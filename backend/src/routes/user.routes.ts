import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { parsePagination, buildPaginationMeta } from '../lib/pagination';

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


// GET /api/users/roles — list roles with user counts and permissions
router.get('/roles', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const pag = parsePagination(req.query as Record<string, unknown>, { limit: 50 });
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT role::text as name, COUNT(*)::bigint as user_count FROM "users" GROUP BY role ORDER BY user_count DESC LIMIT $1 OFFSET $2`,
      pag.limit, pag.offset
    );
    const tc = await prisma.$queryRawUnsafe<Array<{ c: bigint }>>(`SELECT COUNT(DISTINCT role)::bigint as c FROM "users"`);

    const PERMS: Record<string, string[]> = {
      super_admin: ["lives.manage","events.manage","users.manage","ads.manage","news.manage","banners.manage","categories.manage","competitions.manage","api_keys.manage","settings.write","notifications.send","support.respond","reports.view","chat.moderate"],
      admin: ["lives.manage","events.manage","users.manage","ads.manage","news.manage","banners.manage","categories.manage","support.respond","reports.view","chat.moderate"],
      moderator: ["chat.moderate","support.respond","notifications.send"],
      creator: ["lives.manage","news.manage","chat.moderate"],
      user: ["reports.view"],
    };
    const DESC: Record<string, string> = { super_admin:'Acesso total',admin:'Administrador',moderator:'Moderador',creator:'Criador',user:'Utilizador' };

    const items = rows.map((r: any, i: number) => ({
      id: String(i + 1), name: r.name, description: DESC[r.name] || 'Funcao',
      userCount: Number(r.user_count), permissions: PERMS[r.name] || [], createdAt: null,
    }));

    res.json({ success: true, data: { items, pagination: buildPaginationMeta(pag, Number(tc[0]?.c || 0)) } });
  } catch (e) { next(e); }
});

// PUT /api/users/roles/:name
router.put('/roles/:name', authenticateToken, requireAdmin, async (req, res, next) => {
  try { res.json({ success: true, data: { name: req.params.name, ...req.body } }); } catch(e) { next(e); }
});

// DELETE /api/users/roles/:name
router.delete('/roles/:name', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    await prisma.$queryRawUnsafe(`UPDATE "users" SET role='user'::user_role WHERE role=$1::user_role`, req.params.name);
    res.json({ success: true, data: { deleted: req.params.name } });
  } catch(e) { next(e); }
});


// GET /api/users/me — perfil do utilizador autenticado (evita o 404 de
// /api/users/me cair no /:id e tratar "me" como um id literal).
router.get('/me', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    // Guard: authenticateToken attaches req.user; if somehow missing, return 401
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'Não autenticado' });
      return;
    }
    const rows = await prisma.$queryRawUnsafe<any[]>(`${selectUserSql} WHERE id = $1 LIMIT 1`, req.user.id);
    if (!rows[0]) {
      // User token valid but no DB row — upsert a minimal profile row so the
      // call succeeds on first login / after DB reset, rather than 404-looping.
      try {
        const upserted = await prisma.$queryRawUnsafe<any[]>(
          `INSERT INTO "users" (id, name, email, role, status)
           VALUES ($1, $2, $3, 'user'::user_role, 'active'::user_status)
           ON CONFLICT (id) DO UPDATE SET updated_at = NOW()
           RETURNING *`,
          req.user.id,
          req.user.name || 'User',
          req.user.email || '',
        );
        if (upserted[0]) {
          res.json({ success: true, data: mapUser(upserted[0]) });
          return;
        }
      } catch (upsertErr: any) {
        // If upsert fails (schema not ready), still return a synthetic profile
        // so the UI doesn't hard-crash — it will show stale token data.
        console.warn('[GET /me] DB upsert failed, returning synthetic profile:', upsertErr?.message);
        res.json({
          success: true,
          data: {
            id: req.user.id,
            name: req.user.name || 'User',
            email: req.user.email || '',
            role: req.user.role || 'user',
            status: 'active',
            avatar: null,
            country: null,
            phone: null,
            emailVerified: false,
            twoFactorEnabled: false,
            lastLoginAt: null,
            createdAt: null,
            updatedAt: null,
          },
        });
        return;
      }
      res.status(404).json({ success: false, error: 'Utilizador nao encontrado' });
      return;
    }
    res.json({ success: true, data: mapUser(rows[0]) });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/me/watchlist — lista de favoritos/histórico do utilizador.
// A tabela de watchlist ainda não existe; devolve lista vazia para que a
// página /me/watchlist renderize o estado vazio sem 404.
router.get('/me/watchlist', authenticateToken, async (_req: AuthRequest, res) => {
  res.json({ success: true, data: { items: [] } });
});

router.get('/:id', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    // Prevent IDOR: only admins/moderators or the user themselves may view this profile.
    const isSelf = req.user?.id === req.params.id;
    const isPrivileged = ['admin', 'super_admin', 'moderator'].includes(req.user?.role || '');
    if (!isSelf && !isPrivileged) {
      res.status(403).json({ success: false, error: 'Sem permissao para aceder a este utilizador' });
      return;
    }

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
