import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { parsePagination, buildPaginationMeta } from '../lib/pagination';

const router = Router();
router.use(authenticateToken, requireAdmin);

// GET /api/users/roles
router.get('/', async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query as Record<string, unknown>, { limit: 50 });
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT role::text as name, COUNT(*)::bigint as user_count
       FROM "users"
       GROUP BY role
       ORDER BY user_count DESC
       LIMIT $1 OFFSET $2`,
      pagination.limit, pagination.offset
    );

    const countRows = await prisma.$queryRawUnsafe<Array<{ total: bigint }>>(
      `SELECT COUNT(DISTINCT role)::bigint as total FROM "users"`
    );

    const ROLE_PERMISSIONS: Record<string, string[]> = {
      super_admin: [
        "lives.manage", "events.manage", "users.manage", "ads.manage",
        "news.manage", "banners.manage", "categories.manage", "competitions.manage",
        "api_keys.manage", "settings.write", "notifications.send",
        "support.respond", "reports.view", "chat.moderate",
      ],
      admin: [
        "lives.manage", "events.manage", "users.manage", "ads.manage",
        "news.manage", "banners.manage", "categories.manage",
        "support.respond", "reports.view", "chat.moderate",
      ],
      moderator: [
        "chat.moderate", "support.respond", "notifications.send",
      ],
      creator: [
        "lives.manage", "news.manage", "chat.moderate",
      ],
      user: [
        "reports.view",
      ],
    };

    const roles = rows.map((r, idx) => ({
      id: String(idx + 1),
      name: r.name,
      description: getRoleDescription(r.name),
      userCount: Number(r.user_count),
      permissions: ROLE_PERMISSIONS[r.name] || [],
      createdAt: null,
    }));

    const total = Number(countRows[0]?.total || 0);
    res.json({
      success: true,
      data: {
        items: roles,
        pagination: buildPaginationMeta(pagination, total),
      },
    });
  } catch (error) {
    next(error);
  }
});

function getRoleDescription(role: string): string {
  const descriptions: Record<string, string> = {
    super_admin: 'Acesso total a todos os modulos',
    admin: 'Gere utilizadores, lives, eventos e anuncios',
    moderator: 'Modera chat e responde a tickets',
    creator: 'Cria lives, noticias e gere o chat',
    user: 'Acesso apenas de leitura aos relatorios',
  };
  return descriptions[role] || 'Funcao personalizada';
}

// PUT /api/users/roles/:name
router.put('/:name', async (req, res, next) => {
  try {
    const { name } = req.params;
    const { permissions, description } = req.body;
    if (!Array.isArray(permissions)) {
      res.status(400).json({ success: false, error: 'Permissoes invalidas' });
      return;
    }
    res.json({ success: true, data: { name, permissions, description } });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/users/roles/:name
router.delete('/:name', async (req, res, next) => {
  try {
    const { name } = req.params;
    await prisma.$queryRawUnsafe(
      `UPDATE "users" SET role = 'user'::user_role WHERE role = $1::user_role`,
      name
    );
    res.json({ success: true, data: { deleted: name } });
  } catch (error) {
    next(error);
  }
});

export default router;
