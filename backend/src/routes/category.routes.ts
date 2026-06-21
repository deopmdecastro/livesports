import { Router } from 'express';
import { authenticateToken, requireEditor } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

const router = Router();

function mapCategory(row: any) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    icon: row.icon,
    sport: row.sport,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const selectCategorySql = `
  SELECT id, name, slug, description, icon, sport::text, color, created_at, updated_at
  FROM "categories"
`;

router.get('/', async (_req, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(`${selectCategorySql} ORDER BY name ASC`);
    res.json({ success: true, data: rows.map(mapCategory) });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticateToken, requireEditor, async (req, res, next) => {
  try {
    const body = req.body || {};

    if (!body.name?.trim()) {
      res.status(400).json({ success: false, error: 'Nome obrigatorio' });
      return;
    }
    if (!body.sport) {
      res.status(400).json({ success: false, error: 'Desporto obrigatorio' });
      return;
    }

    const slug = String(body.slug || body.name).trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `
        INSERT INTO "categories" (name, slug, description, icon, sport, color)
        VALUES ($1, $2, $3, $4, $5::sport_category, $6)
        RETURNING *
      `,
      body.name.trim(),
      slug,
      body.description || null,
      body.icon || null,
      body.sport,
      body.color || null
    );

    res.status(201).json({ success: true, data: mapCategory(rows[0]) });
  } catch (error: any) {
    if (error?.code === '23505') {
      res.status(409).json({ success: false, error: 'Ja existe uma categoria com este nome ou slug' });
      return;
    }
    next(error);
  }
});

router.put('/:id', authenticateToken, requireEditor, async (req, res, next) => {
  try {
    const body = req.body || {};
    const slug = body.slug ? String(body.slug).trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : null;

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `
        UPDATE "categories"
        SET
          name = COALESCE($2, name),
          slug = COALESCE($3, slug),
          description = COALESCE($4, description),
          icon = COALESCE($5, icon),
          sport = COALESCE($6::sport_category, sport),
          color = COALESCE($7, color),
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      req.params.id,
      body.name ?? null,
      slug,
      body.description ?? null,
      body.icon ?? null,
      body.sport ?? null,
      body.color ?? null
    );

    if (!rows[0]) {
      res.status(404).json({ success: false, error: 'Categoria nao encontrada' });
      return;
    }
    res.json({ success: true, data: mapCategory(rows[0]) });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticateToken, requireEditor, async (req, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(`DELETE FROM "categories" WHERE id = $1 RETURNING id`, req.params.id);
    if (!rows[0]) {
      res.status(404).json({ success: false, error: 'Categoria nao encontrada' });
      return;
    }
    res.json({ success: true, message: 'Categoria removida!' });
  } catch (error) {
    next(error);
  }
});

export default router;
