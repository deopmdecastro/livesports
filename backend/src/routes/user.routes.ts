import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

const router = Router();

function mapUser(row: any) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatar: row.avatar,
    country: row.country,
    phone: row.phone,
    role: row.role,
    status: row.status,
    emailVerified: row.email_verified,
    twoFactorEnabled: row.two_factor_enabled,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const selectUserSql = `
  SELECT id, name, email, avatar, country, phone, role::text, status::text, email_verified,
    two_factor_enabled, last_login_at, created_at, updated_at
  FROM "users"
`;

router.get('/', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { status, role, page = 1, limit = 50 } = req.query;
    const conditions: string[] = [];
    const values: unknown[] = [];
    if (status) {
      values.push(status);
      conditions.push(`status = $${values.length}::user_status`);
    }
    if (role) {
      values.push(role);
      conditions.push(`role = $${values.length}::user_role`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const offset = (pageNumber - 1) * limitNumber;
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `${selectUserSql} ${where} ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      ...values,
      limitNumber,
      offset
    );
    const countRows = await prisma.$queryRawUnsafe<Array<{ total: bigint }>>(
      `SELECT COUNT(*)::bigint AS total FROM "users" ${where}`,
      ...values
    );
    const total = Number(countRows[0]?.total || 0);
    res.json({ success: true, data: { items: rows.map(mapUser), pagination: { page: pageNumber, limit: limitNumber, total } } });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(`${selectUserSql} WHERE id = $1 LIMIT 1`, req.params.id);
    if (!rows[0]) {
      res.status(404).json({ success: false, error: 'Utilizador nao encontrado' });
      return;
    }
    res.json({ success: true, data: mapUser(rows[0]) });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const body = req.body;
    const password = bcrypt.hashSync(body.password || 'user12345', 12);
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `
        INSERT INTO "users" ("name", "email", "password", "avatar", "country", "phone", "role", "status", "email_verified")
        VALUES ($1, $2, $3, $4, $5, $6, $7::user_role, $8::user_status, TRUE)
        RETURNING id, name, email, avatar, country, phone, role::text, status::text, email_verified,
          two_factor_enabled, last_login_at, created_at, updated_at
      `,
      body.name,
      body.email,
      password,
      body.avatar || null,
      body.country || null,
      body.phone || null,
      body.role || 'user',
      body.status || 'active'
    );
    res.status(201).json({ success: true, data: mapUser(rows[0]) });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `
        UPDATE "users" SET status = $2::user_status, updated_at = NOW()
        WHERE id = $1
        RETURNING id, name, email, avatar, country, phone, role::text, status::text, email_verified,
          two_factor_enabled, last_login_at, created_at, updated_at
      `,
      req.params.id,
      req.body.status
    );
    if (!rows[0]) {
      res.status(404).json({ success: false, error: 'Utilizador nao encontrado' });
      return;
    }
    res.json({ success: true, data: mapUser(rows[0]) });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const body = req.body;
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `
        UPDATE "users"
        SET name = $2, email = $3, avatar = $4, country = $5, phone = $6,
          role = $7::user_role, status = $8::user_status, updated_at = NOW()
        WHERE id = $1
        RETURNING id, name, email, avatar, country, phone, role::text, status::text, email_verified,
          two_factor_enabled, last_login_at, created_at, updated_at
      `,
      req.params.id,
      body.name,
      body.email,
      body.avatar || null,
      body.country || null,
      body.phone || null,
      body.role || 'user',
      body.status || 'active'
    );
    if (!rows[0]) {
      res.status(404).json({ success: false, error: 'Utilizador nao encontrado' });
      return;
    }
    res.json({ success: true, data: mapUser(rows[0]) });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    await prisma.$executeRawUnsafe(`DELETE FROM "users" WHERE id = $1`, req.params.id);
    res.json({ success: true, message: 'Utilizador removido!' });
  } catch (error) {
    next(error);
  }
});

export default router;
