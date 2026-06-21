import { Router } from 'express';
import { authenticateToken, requireEditor, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

const router = Router();

function mapNews(row: any) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    thumbnail: row.thumbnail,
    sport: row.sport,
    tags: row.tags || [],
    authorId: row.author_id,
    published: row.published,
    featured: row.featured,
    views: Number(row.views || 0),
    publishedAt: row.published_at,
    metaTitle: row.meta_title,
    metaDesc: row.meta_desc,
    ogImage: row.og_image,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const selectNewsSql = `
  SELECT id, title, slug, excerpt, content, thumbnail, sport::text, tags, author_id,
    published, featured, views, published_at, meta_title, meta_desc, og_image, created_at, updated_at
  FROM "news_articles"
`;

// ─── GET / — list articles (public sees only published unless authenticated editor+) ──

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const isEditorOrAbove = req.user && ['admin', 'super_admin', 'moderator', 'editor'].includes(req.user.role);
    const { published, sport, page = 1, limit = 50 } = req.query;

    const conditions: string[] = [];
    const values: unknown[] = [];

    // Public/unauthenticated callers only ever see published articles.
    if (!isEditorOrAbove) {
      conditions.push('published = TRUE');
    } else if (published !== undefined) {
      values.push(published === 'true');
      conditions.push(`published = $${values.length}`);
    }

    if (sport) {
      values.push(sport);
      conditions.push(`sport = $${values.length}::sport_category`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const pageNumber = Math.max(1, Number(page));
    const limitNumber = Math.min(100, Math.max(1, Number(limit)));
    const offset = (pageNumber - 1) * limitNumber;

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `${selectNewsSql} ${where} ORDER BY featured DESC, created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      ...values,
      limitNumber,
      offset
    );
    const countRows = await prisma.$queryRawUnsafe<Array<{ total: bigint }>>(
      `SELECT COUNT(*)::bigint AS total FROM "news_articles" ${where}`,
      ...values
    );
    const total = Number(countRows[0]?.total || 0);

    res.json({
      success: true,
      data: {
        items: rows.map(mapNews),
        pagination: { page: pageNumber, limit: limitNumber, total, totalPages: Math.ceil(total / limitNumber) },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(`${selectNewsSql} WHERE id = $1 OR slug = $1 LIMIT 1`, req.params.id);
    if (!rows[0]) {
      res.status(404).json({ success: false, error: 'Noticia nao encontrada' });
      return;
    }
    res.json({ success: true, data: mapNews(rows[0]) });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticateToken, requireEditor, async (req: AuthRequest, res, next) => {
  try {
    const body = req.body || {};

    if (!body.title?.trim()) {
      res.status(400).json({ success: false, error: 'Titulo obrigatorio' });
      return;
    }
    if (!body.content?.trim()) {
      res.status(400).json({ success: false, error: 'Conteudo obrigatorio' });
      return;
    }

    const slug = String(body.slug || body.title).trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const published = Boolean(body.published);

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `
        INSERT INTO "news_articles" (
          title, slug, excerpt, content, thumbnail, sport, tags, author_id,
          published, featured, published_at, meta_title, meta_desc, og_image
        )
        VALUES (
          $1, $2, $3, $4, $5, $6::sport_category, $7, $8,
          $9, $10, $11::timestamptz, $12, $13, $14
        )
        RETURNING *
      `,
      body.title.trim(),
      slug,
      body.excerpt || null,
      body.content,
      body.thumbnail || null,
      body.sport || null,
      Array.isArray(body.tags) ? body.tags : [],
      req.user!.id,
      published,
      Boolean(body.featured),
      published ? new Date().toISOString() : null,
      body.metaTitle || null,
      body.metaDesc || null,
      body.ogImage || null
    );

    res.status(201).json({ success: true, data: mapNews(rows[0]) });
  } catch (error: any) {
    if (error?.code === '23505') {
      res.status(409).json({ success: false, error: 'Ja existe uma noticia com este slug' });
      return;
    }
    next(error);
  }
});

router.put('/:id', authenticateToken, requireEditor, async (req: AuthRequest, res, next) => {
  try {
    const body = req.body || {};
    const slug = body.slug ? String(body.slug).trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : null;

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `
        UPDATE "news_articles"
        SET
          title = COALESCE($2, title),
          slug = COALESCE($3, slug),
          excerpt = COALESCE($4, excerpt),
          content = COALESCE($5, content),
          thumbnail = COALESCE($6, thumbnail),
          sport = COALESCE($7::sport_category, sport),
          tags = COALESCE($8, tags),
          published = COALESCE($9, published),
          featured = COALESCE($10, featured),
          published_at = CASE WHEN $9 = TRUE AND published_at IS NULL THEN NOW() ELSE published_at END,
          meta_title = COALESCE($11, meta_title),
          meta_desc = COALESCE($12, meta_desc),
          og_image = COALESCE($13, og_image),
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      req.params.id,
      body.title ?? null,
      slug,
      body.excerpt ?? null,
      body.content ?? null,
      body.thumbnail ?? null,
      body.sport ?? null,
      Array.isArray(body.tags) ? body.tags : null,
      body.published ?? null,
      body.featured ?? null,
      body.metaTitle ?? null,
      body.metaDesc ?? null,
      body.ogImage ?? null
    );

    if (!rows[0]) {
      res.status(404).json({ success: false, error: 'Noticia nao encontrada' });
      return;
    }
    res.json({ success: true, data: mapNews(rows[0]) });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticateToken, requireEditor, async (req: AuthRequest, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(`DELETE FROM "news_articles" WHERE id = $1 RETURNING id`, req.params.id);
    if (!rows[0]) {
      res.status(404).json({ success: false, error: 'Noticia nao encontrada' });
      return;
    }
    res.json({ success: true, message: 'Noticia removida!' });
  } catch (error) {
    next(error);
  }
});

export default router;
