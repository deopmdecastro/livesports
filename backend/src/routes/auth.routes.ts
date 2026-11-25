import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

const router = Router();

/** bcrypt cost factor — do not lower below 10 in production */
const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'livesports-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'livesports-refresh-secret';

const loginSchema = z.object({
  email: z.string().trim().email('Email inválido').max(254).transform(value => value.toLowerCase()),
  password: z.string().min(6, 'Senha muito curta'),
  rememberMe: z.boolean().optional(),
});

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Nome muito curto').max(100),
  email: z.string().trim().email('Email inválido').max(254).transform(value => value.toLowerCase()),
  password: z.string().min(8, 'Mínimo 8 caracteres').refine(value => Buffer.byteLength(value, 'utf8') <= 72, 'Senha demasiado longa (máximo 72 bytes)'),
  country: z.string().trim().max(100).optional(),
});

function publicUser(user: any) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    country: user.country,
    phone: user.phone,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified ?? user.email_verified,
    twoFactorEnabled: user.twoFactorEnabled ?? user.two_factor_enabled,
    createdAt: user.createdAt ?? user.created_at,
  };
}

// ─── Prisma-based helpers (safer than raw SQL) ─────────────────────────────
// These replace the old $queryRawUnsafe calls for standard CRUD operations.

async function findUserByEmail(email: string) {
  return prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: {
      id: true, name: true, email: true, password: true, avatar: true,
      country: true, phone: true, role: true, status: true,
      emailVerified: true, twoFactorEnabled: true, createdAt: true,
    },
  });
}

async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, password: true, avatar: true,
      country: true, phone: true, role: true, status: true,
      emailVerified: true, twoFactorEnabled: true, createdAt: true,
    },
  });
}

// ─── Refresh token persistence ────────────────────────────────────────────────
// Refresh tokens are stored as a SHA-256 hash (not the raw JWT) so a DB leak
// alone doesn't hand out usable tokens. Each refresh rotates the token
// (old one revoked, new one issued) to limit the blast radius of token theft.

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function persistRefreshToken(userId: string, token: string, expiresAt: Date): Promise<void> {
  await prisma.$executeRawUnsafe(
    `INSERT INTO "refresh_tokens" ("token", "user_id", "expires_at") VALUES ($1, $2, $3::timestamptz)`,
    hashToken(token),
    userId,
    expiresAt.toISOString()
  );
}

async function consumeRefreshToken(token: string): Promise<{ userId: string } | null> {
  // DELETE ... RETURNING consumes the token atomically, even with concurrent requests.
  const rows = await prisma.$queryRawUnsafe<Array<{ user_id: string; expires_at: Date }>>(
    `DELETE FROM "refresh_tokens" WHERE token = $1 RETURNING user_id, expires_at`,
    hashToken(token)
  );
  const row = rows[0];
  if (!row || new Date(row.expires_at).getTime() < Date.now()) return null;
  return { userId: row.user_id };
}

async function revokeRefreshToken(token: string): Promise<void> {
  await prisma.$executeRawUnsafe(`DELETE FROM "refresh_tokens" WHERE token = $1`, hashToken(token));
}

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password, rememberMe } = loginSchema.parse(req.body);
    const user = await findUserByEmail(email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      res.status(401).json({ success: false, error: 'Email ou palavra-passe incorretos' });
      return;
    }
    if (user.status !== 'active') {
      res.status(403).json({ success: false, error: 'Conta suspensa ou banida' });
      return;
    }
    const expiresIn = rememberMe ? '30d' : '24h';
    const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn });
    const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: '30d', jwtid: crypto.randomUUID() });
    const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await persistRefreshToken(user.id, refreshToken, refreshExpiresAt);
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    res.json({ success: true, data: { user: publicUser(user), accessToken, refreshToken } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors[0].message });
      return;
    }

    // Log real error to help debug 500s on /login
    console.error('[LOGIN_ERROR]', {
      message: (error as any)?.message,
      name: (error as any)?.name,
      stack: (error as any)?.stack,
    });

    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await findUserByEmail(data.email);
    if (existing) {
      res.status(409).json({ success: false, error: 'Este email já está registado' });
      return;
    }
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
    const { user, accessToken, refreshToken } = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name: data.name, email: data.email, password: hashedPassword, country: data.country || null, role: 'user', status: 'active' },
        select: { id: true, name: true, email: true, avatar: true, country: true, phone: true, role: true, status: true, emailVerified: true, twoFactorEnabled: true, createdAt: true },
      });
      const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
      const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: '30d', jwtid: crypto.randomUUID() });
      await tx.refreshToken.create({ data: { userId: user.id, token: hashToken(refreshToken), expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } });
      return { user, accessToken, refreshToken };
    });
    res.status(201).json({ success: true, data: { user: publicUser(user), accessToken, refreshToken }, message: 'Conta criada com sucesso!' });
  } catch (error) {
    if (error instanceof z.ZodError) res.status(400).json({ success: false, error: error.errors[0].message });
    else if ((error as { code?: string })?.code === 'P2002') res.status(409).json({ success: false, error: 'Email já registado' });
    else res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  const user = await findUserById(req.user?.id || '');
  if (!user) {
    res.status(404).json({ success: false, error: 'Utilizador nao encontrado' });
    return;
  }
  res.json({ success: true, data: publicUser(user) });
});

// ─── PATCH /me ──────────────────────────────────────────────────────────────
// Lets the logged-in user update their own profile (name/avatar/country/phone).
// Email/role/status changes are intentionally excluded here — those go through
// dedicated, more sensitive flows (email change would need re-verification;
// role/status are admin-only via /api/users).

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Nome muito curto').max(100).optional(),
  avatar: z.string().url('URL de avatar invalida').max(500).optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
});

router.patch('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.user?.id || '' },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.avatar !== undefined && { avatar: data.avatar || null }),
        ...(data.country !== undefined && { country: data.country || null }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
      },
    });
    res.json({ success: true, data: publicUser(user) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors[0].message });
    } else {
      res.status(500).json({ success: false, error: 'Erro ao atualizar perfil' });
    }
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(401).json({ success: false, error: 'Refresh token obrigatorio' });
    return;
  }
  try {
    // Verify JWT signature/expiry first (cheap check), then consult the DB
    // record so a token can be revoked server-side (logout) even if the JWT
    // itself hasn't expired yet.
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { id: string };
    const consumed = await consumeRefreshToken(refreshToken);
    if (!consumed) {
      res.status(403).json({ success: false, error: 'Refresh token invalido, expirado ou ja utilizado' });
      return;
    }
    const user = await findUserById(decoded.id);
    if (!user || user.status !== 'active' || user.id !== consumed.userId) {
      res.status(403).json({ success: false, error: 'Sessão inválida ou conta indisponível' });
      return;
    }
    const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    // Rotate: issue a new refresh token and persist it; the old one is already revoked.
    const newRefreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: '30d', jwtid: crypto.randomUUID() });
    await persistRefreshToken(user.id, newRefreshToken, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    res.json({ success: true, data: { accessToken, refreshToken: newRefreshToken } });
  } catch {
    res.status(403).json({ success: false, error: 'Refresh token invalido' });
  }
});

router.post('/forgot-password', async (_req: Request, res: Response) => {
  // No mail provider or reset-token implementation is configured yet.
  res.status(503).json({ success: false, error: 'Recuperação de senha temporariamente indisponível.' });
});

// ─── POST /change-password ─────────────────────────────────────────────────────

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual obrigatoria'),
  newPassword: z.string().min(8, 'Nova senha: minimo 8 caracteres'),
});

router.post('/change-password', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    const user = await findUserById(req.user?.id || '');
    if (!user) {
      res.status(404).json({ success: false, error: 'Utilizador nao encontrado' });
      return;
    }

    if (!bcrypt.compareSync(currentPassword, user.password)) {
      res.status(401).json({ success: false, error: 'Senha atual incorreta' });
      return;
    }

    const hashed = bcrypt.hashSync(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    // Changing the password invalidates all existing sessions for this user.
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

    res.json({ success: true, message: 'Senha alterada com sucesso' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors[0].message });
    } else {
      res.status(500).json({ success: false, error: 'Erro interno' });
    }
  }
});

// ─── POST /logout ─────────────────────────────────────────────────────────────

router.post('/logout', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { refreshToken } = req.body || {};
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }
    res.json({ success: true, message: 'Logout realizado com sucesso' });
  } catch {
    // Logout should not fail the client even if revocation has an issue.
    res.json({ success: true, message: 'Logout realizado com sucesso' });
  }
});

export default router;
