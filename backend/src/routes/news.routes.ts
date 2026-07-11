import { Router } from 'express';
import { authenticateToken, requireEditor, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { cached } from '../lib/cache';
import { fetchNewsdataLatest, mapNewsdataArticle, isMissingNewsdataKey } from '../lib/newsdata';
import { fetchNewsApiTopHeadlines, mapNewsApiArticle, isMissingNewsApiKey, NEWSAPI_LANGUAGE_COUNTRY } from '../lib/newsapi';

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
    author: { id: row.author_id, name: row.author_name || 'Equipa LiveSports' },
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
  SELECT n.id, n.title, n.slug, n.excerpt, n.content, n.thumbnail, n.sport::text, n.tags, n.author_id,
    u.name AS author_name,
    n.published, n.featured, n.views, n.published_at, n.meta_title, n.meta_desc, n.og_image, n.created_at, n.updated_at
  FROM "news_articles" n
  LEFT JOIN "users" u ON u.id = n.author_id
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
      conditions.push('n.published = TRUE');
    } else if (published !== undefined) {
      values.push(published === 'true');
      conditions.push(`n.published = $${values.length}`);
    }

    if (sport) {
      values.push(sport);
      conditions.push(`n.sport = $${values.length}::sport_category`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const pageNumber = Math.max(1, Number(page));
    const limitNumber = Math.min(100, Math.max(1, Number(limit)));
    const offset = (pageNumber - 1) * limitNumber;

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `${selectNewsSql} ${where} ORDER BY n.featured DESC, n.created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      ...values,
      limitNumber,
      offset
    );
    const countRows = await prisma.$queryRawUnsafe<Array<{ total: bigint }>>(
      `SELECT COUNT(*)::bigint AS total FROM "news_articles" n ${where}`,
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

// ─── External sports news (NewsData.io) — PT + EN, used to power the blog ─────
// Placed before `/:id` so the literal "external" segment isn't swallowed by
// the id/slug lookup route below.

// GET /external — live sports headlines in Portuguese and/or English, merged
// from NewsData.io and NewsAPI.org. Both providers are locked to sports-only
// content: this endpoint exists exclusively to feed the blog's "import news"
// panel, never general-purpose news.
router.get('/external', async (req, res, next) => {
  try {
    const newsdataKey = process.env.NEWSDATA_API_KEY;
    const newsapiKey = process.env.NEWSAPI_KEY;
    const hasNewsdata = !isMissingNewsdataKey(newsdataKey);
    const hasNewsapi = !isMissingNewsApiKey(newsapiKey);

    if (!hasNewsdata && !hasNewsapi) {
      res.status(400).json({
        success: false,
        error: 'Nenhuma API de noticias configurada. Define NEWSDATA_API_KEY e/ou NEWSAPI_KEY em Admin > API Keys.',
      });
      return;
    }

    const { q, language = 'pt,en', country, page } = req.query as Record<string, string | undefined>;
    const languages = language.split(',').map((l) => l.trim().toLowerCase()).filter(Boolean);

    const tasks: Promise<any[]>[] = [];

    if (hasNewsdata) {
      const cacheKey = `newsdata:${q || ''}:${language}:sports:${country || ''}:${page || ''}`;
      tasks.push(
        cached(cacheKey, 10 * 60 * 1000, () =>
          fetchNewsdataLatest({ apiKey: newsdataKey!, q, language, category: 'sports', country, page })
        )
          .then((data) => (data.status === 'success' ? (data.results || []).map(mapNewsdataArticle) : []))
          .catch((err) => {
            console.error('NewsData.io fetch failed:', err?.message || err);
            return [];
          })
      );
    }

    if (hasNewsapi) {
      // top-headlines takes a single country per request (no language param),
      // so we fan out one request per requested language and merge results.
      const targetCountries = Array.from(
        new Set(languages.map((l) => NEWSAPI_LANGUAGE_COUNTRY[l]).filter(Boolean))
      );
      const countries = targetCountries.length ? targetCountries : ['us'];

      countries.forEach((countryCode) => {
        const lang = countryCode === 'pt' ? 'pt' : 'en';
        const cacheKey = `newsapi:${q || ''}:${countryCode}:${page || ''}`;
        tasks.push(
          cached(cacheKey, 10 * 60 * 1000, () =>
            fetchNewsApiTopHeadlines({ apiKey: newsapiKey!, country: countryCode, q, page: page ? Number(page) : undefined })
          )
            .then((data) => (data.status === 'ok' ? (data.articles || []).map((a) => mapNewsApiArticle(a, lang)) : []))
            .catch((err) => {
              console.error('NewsAPI.org fetch failed:', err?.message || err);
              return [];
            })
        );
      });
    }

    const settled = await Promise.all(tasks);
    const merged = settled.flat();

    // Dedupe (both providers can surface the same wire story) and sort newest first.
    const seen = new Set<string>();
    const items = merged
      .filter((item) => {
        const key = item.sourceUrl || item.title;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());

    res.json({
      success: true,
      data: {
        items,
        totalResults: items.length,
        providers: { newsdata: hasNewsdata, newsapi: hasNewsapi },
      },
    });
  } catch (error: any) {
    if (error?.response?.status === 429) {
      res.status(429).json({ success: false, error: 'Limite de pedidos atingido numa das APIs de noticias. Tenta novamente mais tarde.' });
      return;
    }
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      res.status(502).json({ success: false, error: 'Uma das chaves de API de noticias e invalida ou sem permissoes.' });
      return;
    }
    next(error);
  }
});

// POST /external/import — copy an external article into the blog as an editable draft
router.post('/external/import', authenticateToken, requireEditor, async (req: AuthRequest, res, next) => {
  try {
    const body = req.body || {};

    if (!body.title?.trim()) {
      res.status(400).json({ success: false, error: 'Titulo obrigatorio' });
      return;
    }

    const slug = String(body.slug || body.title).trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const sourceNote = body.sourceUrl
      ? `<p><em>Fonte: <a href="${body.sourceUrl}" target="_blank" rel="noopener noreferrer">${body.sourceName || body.sourceUrl}</a></em></p>`
      : '';
    const content = `${body.content || body.excerpt || ''}${sourceNote}`;

    const inserted = await prisma.$queryRawUnsafe<any[]>(
      `
        INSERT INTO "news_articles" (
          title, slug, excerpt, content, thumbnail, sport, tags, author_id,
          published, featured, published_at, meta_title, meta_desc, og_image
        )
        VALUES (
          $1, $2, $3, $4, $5, $6::sport_category, $7, $8,
          FALSE, FALSE, NULL, $9, $10, $11
        )
        RETURNING id
      `,
      body.title.trim(),
      slug,
      body.excerpt || null,
      content,
      body.thumbnail || null,
      body.sport || 'other',
      Array.isArray(body.tags) ? body.tags : [],
      req.user!.id,
      body.title.trim(),
      body.excerpt || null,
      body.thumbnail || null
    );

    const rows = await prisma.$queryRawUnsafe<any[]>(`${selectNewsSql} WHERE n.id = $1`, inserted[0].id);
    res.status(201).json({ success: true, data: mapNews(rows[0]) });
  } catch (error: any) {
    if (error?.code === '23505') {
      res.status(409).json({ success: false, error: 'Ja existe uma noticia com este slug (talvez ja tenha sido importada)' });
      return;
    }
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(`${selectNewsSql} WHERE n.id = $1 OR n.slug = $1 LIMIT 1`, req.params.id);
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

    const inserted = await prisma.$queryRawUnsafe<any[]>(
      `
        INSERT INTO "news_articles" (
          title, slug, excerpt, content, thumbnail, sport, tags, author_id,
          published, featured, published_at, meta_title, meta_desc, og_image
        )
        VALUES (
          $1, $2, $3, $4, $5, $6::sport_category, $7, $8,
          $9, $10, $11::timestamptz, $12, $13, $14
        )
        RETURNING id
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

    const rows = await prisma.$queryRawUnsafe<any[]>(`${selectNewsSql} WHERE n.id = $1`, inserted[0].id);
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

    const updated = await prisma.$queryRawUnsafe<any[]>(
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
        RETURNING id
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

    if (!updated[0]) {
      res.status(404).json({ success: false, error: 'Noticia nao encontrada' });
      return;
    }
    const rows = await prisma.$queryRawUnsafe<any[]>(`${selectNewsSql} WHERE n.id = $1`, updated[0].id);
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
