import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'livesports-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'livesports-refresh-secret';

const loginSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(6, 'Senha muito curta'),
  rememberMe: z.boolean().optional(),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Nome muito curto').max(100),
  email: z.string().email('Email invalido'),
  password: z.string().min(8, 'Minimo 8 caracteres'),
  country: z.string().optional(),
});

function publicUser(user: any) {
  const { password, ...safeUser } = user;
  return {
    id: safeUser.id,
    name: safeUser.name,
    email: safeUser.email,
    avatar: safeUser.avatar,
    country: safeUser.country,
    phone: safeUser.phone,
    role: safeUser.role,
    status: safeUser.status,
    emailVerified: safeUser.email_verified,
    twoFactorEnabled: safeUser.two_factor_enabled,
    createdAt: safeUser.created_at,
  };
}

async function findUserByEmail(email: string) {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT id, name, email, password, avatar, country, phone, role::text, status::text, email_verified, two_factor_enabled, created_at FROM "users" WHERE email = $1 LIMIT 1`,
    email
  );
  return rows[0];
}

async function findUserById(id: string) {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT id, name, email, password, avatar, country, phone, role::text, status::text, email_verified, two_factor_enabled, created_at FROM "users" WHERE id = $1 LIMIT 1`,
    id
  );
  return rows[0];
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
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string; user_id: string; expires_at: Date }>>(
    `SELECT id, user_id, expires_at FROM "refresh_tokens" WHERE token = $1 LIMIT 1`,
    hashToken(token)
  );
  const row = rows[0];
  if (!row) return null;
  // Always revoke on use (rotation) — even if expired, to avoid replay.
  await prisma.$executeRawUnsafe(`DELETE FROM "refresh_tokens" WHERE id = $1`, row.id);
  if (new Date(row.expires_at).getTime() < Date.now()) return null;
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
      res.status(401).json({ success: false, error: 'Credenciais invalidas' });
      return;
    }
    if (user.status !== 'active') {
      res.status(403).json({ success: false, error: 'Conta suspensa ou banida' });
      return;
    }
    const expiresIn = rememberMe ? '30d' : '24h';
    const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn });
    const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: '30d' });
    const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await persistRefreshToken(user.id, refreshToken, refreshExpiresAt);
    await prisma.$executeRawUnsafe(`UPDATE "users" SET "last_login_at" = NOW() WHERE id = $1`, user.id);
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
      res.status(409).json({ success: false, error: 'Email ja cadastrado' });
      return;
    }
    const hashedPassword = bcrypt.hashSync(data.password, 12);
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `
        INSERT INTO "users" ("name", "email", "password", "country", "role", "status")
        VALUES ($1, $2, $3, $4, 'user', 'active')
        RETURNING id, name, email, avatar, country, phone, role::text, status::text, email_verified, two_factor_enabled, created_at
      `,
      data.name,
      data.email,
      hashedPassword,
      data.country || null
    );
    const user = rows[0];
    const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: '30d' });
    await persistRefreshToken(user.id, refreshToken, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    res.status(201).json({ success: true, data: { user: publicUser(user), accessToken, refreshToken }, message: 'Conta criada com sucesso!' });
  } catch (error) {
    if (error instanceof z.ZodError) res.status(400).json({ success: false, error: error.errors[0].message });
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
    if (!user) {
      res.status(404).json({ success: false, error: 'Utilizador nao encontrado' });
      return;
    }
    const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    // Rotate: issue a new refresh token and persist it; the old one is already revoked.
    const newRefreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: '30d' });
    await persistRefreshToken(user.id, newRefreshToken, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    res.json({ success: true, data: { accessToken, refreshToken: newRefreshToken } });
  } catch {
    res.status(403).json({ success: false, error: 'Refresh token invalido' });
  }
});

router.post('/forgot-password', async (_req: Request, res: Response) => {
  // NOTE: token generation + email delivery is intentionally not implemented —
  // this backend has no email provider wired up (see .env.example: SMTP_* /
  // nodemailer were removed as unused dead code). Wire up an email provider
  // before relying on this endpoint in production. Returning a generic
  // success message regardless of whether the email exists prevents
  // account enumeration.
  res.json({ success: true, message: 'Se o email existir, voce recebera as instrucoes.' });
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
    await prisma.$executeRawUnsafe(
      `UPDATE "users" SET "password" = $2, "updated_at" = NOW() WHERE "id" = $1`,
      user.id, hashed,
    );

    // Changing the password invalidates all existing sessions for this user.
    await prisma.$executeRawUnsafe(`DELETE FROM "refresh_tokens" WHERE "user_id" = $1`, user.id);

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
