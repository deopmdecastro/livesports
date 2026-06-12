import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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
    await prisma.$executeRawUnsafe(`UPDATE "users" SET "last_login_at" = NOW() WHERE id = $1`, user.id);
    res.json({ success: true, data: { user: publicUser(user), accessToken, refreshToken } });
  } catch (error) {
    if (error instanceof z.ZodError) res.status(400).json({ success: false, error: error.errors[0].message });
    else res.status(500).json({ success: false, error: 'Erro interno' });
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
    res.status(201).json({ success: true, data: { user: publicUser(user), accessToken }, message: 'Conta criada com sucesso!' });
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
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { id: string };
    const user = await findUserById(decoded.id);
    if (!user) {
      res.status(404).json({ success: false, error: 'Utilizador nao encontrado' });
      return;
    }
    const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ success: true, data: { accessToken } });
  } catch {
    res.status(403).json({ success: false, error: 'Refresh token invalido' });
  }
});

router.post('/forgot-password', async (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Se o email existir, voce recebera as instrucoes.' });
});

router.post('/logout', authenticateToken, (_req: AuthRequest, res: Response) => {
  res.json({ success: true, message: 'Logout realizado com sucesso' });
});

export default router;
