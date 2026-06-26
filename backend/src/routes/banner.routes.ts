import { Router } from 'express';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { randomUUID } from 'crypto';

const router = Router();

const BANNER_POSITIONS = ['hero', 'sidebar', 'in_content'] as const;

function isAllowedValue<T extends readonly string[]>(value: unknown, allowed: T): value is T[number] {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

function mapBanner(row: any) {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    badge: row.badge,
    imageUrl: row.image_url,
    linkUrl: row.link_url,
    ctaText: row.cta_text,
    position: row.position,
    active: row.active,
    sortOrder: row.sort_order,
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const selectBannerSql = `
  SELECT id, title, subtitle, badge, image_url, link_url, cta_text, position::text, active, sort_order, start_date, end_date, created_at, updated_at
  FROM "banners"
`;

router.get('/', async (req, res, next) => {
  try {
    const { position, active } = req.query;
    const where: string[] = [];
    const params: (string | boolean)[] = [];

    if (position && position !== 'all') {
      if (!isAllowedValue(position, BANNER_POSITIONS)) {
        res.status(400).json({ success: false, error: 'Posicao de banner invalida' });
        return;
      }
      params.push(position);
      where.push(`position = $${params.length}`);
    }

    if (active !== undefined && active !== 'all') {
      params.push(active === 'true');
      where.push(`active = $${params.length}`);
    }

    const whereSql = where.length ? ` WHERE ${where.join(' AND ')}` : '';
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `${selectBannerSql}${whereSql} ORDER BY sort_order ASC, created_at DESC`,
      ...params,
    );
    res.json({ success: true, data: rows.map(mapBanner) });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `${selectBannerSql} WHERE id = $1`,
      req.params.id,
    );
    if (!rows[0]) {
      res.status(404).json({ success: false, error: 'Banner nao encontrado' });
      return;
    }
    res.json({ success: true, data: mapBanner(rows[0]) });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const body = req.body;

    if (!body.title?.trim()) {
      res.status(400).json({ success: false, error: 'Titulo obrigatorio' });
      return;
    }

    if (!body.imageUrl?.trim()) {
      res.status(400).json({ success: false, error: 'Imagem obrigatoria' });
      return;
    }

    if (!isAllowedValue(body.position || 'hero', BANNER_POSITIONS)) {
      res.status(400).json({ success: false, error: 'Posicao de banner invalida' });
      return;
    }

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `
        INSERT INTO "banners" (
          id, title, subtitle, badge, image_url, link_url, cta_text, position, active, sort_order, start_date, end_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::date, $12::date)
        RETURNING *
      `,
      randomUUID(),
      body.title.trim(),
      body.subtitle || null,
      body.badge || null,
      body.imageUrl.trim(),
      body.linkUrl || null,
      body.ctaText || null,
      body.position || 'hero',
      body.active ?? true,
      body.sortOrder || 0,
      body.startDate || null,
      body.endDate || null,
    );

    res.status(201).json({ success: true, data: mapBanner(rows[0]) });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const body = req.body;

    if (!body.title?.trim()) {
      res.status(400).json({ success: false, error: 'Titulo obrigatorio' });
      return;
    }

    if (!body.imageUrl?.trim()) {
      res.status(400).json({ success: false, error: 'Imagem obrigatoria' });
      return;
    }

    if (!isAllowedValue(body.position || 'hero', BANNER_POSITIONS)) {
      res.status(400).json({ success: false, error: 'Posicao de banner invalida' });
      return;
    }

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `
        UPDATE "banners"
        SET title = $2, subtitle = $3, badge = $4, image_url = $5, link_url = $6,
          cta_text = $7, position = $8, active = $9, sort_order = $10,
          start_date = $11::date, end_date = $12::date, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      req.params.id,
      body.title.trim(),
      body.subtitle || null,
      body.badge || null,
      body.imageUrl.trim(),
      body.linkUrl || null,
      body.ctaText || null,
      body.position || 'hero',
      body.active ?? true,
      body.sortOrder || 0,
      body.startDate || null,
      body.endDate || null,
    );

    if (!rows[0]) {
      res.status(404).json({ success: false, error: 'Banner nao encontrado' });
      return;
    }
    res.json({ success: true, data: mapBanner(rows[0]) });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { active } = req.body;
    if (typeof active !== 'boolean') {
      res.status(400).json({ success: false, error: 'Status invalido' });
      return;
    }

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `UPDATE "banners" SET active = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
      req.params.id,
      active,
    );

    if (!rows[0]) {
      res.status(404).json({ success: false, error: 'Banner nao encontrado' });
      return;
    }
    res.json({ success: true, data: mapBanner(rows[0]) });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const check = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM "banners" WHERE id = $1`,
      req.params.id,
    );
    if (!check[0]) {
      res.status(404).json({ success: false, error: 'Banner nao encontrado' });
      return;
    }
    await prisma.$executeRawUnsafe(`DELETE FROM "banners" WHERE id = $1`, req.params.id);
    res.json({ success: true, message: 'Banner removido!' });
  } catch (error) {
    next(error);
  }
});

export default router;
