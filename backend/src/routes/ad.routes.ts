import { Router } from 'express';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

const router = Router();

// ─── Mapper ───────────────────────────────────────────────────────────────────

function mapAd(row: any) {
  const impressions = Number(row.impressions || 0);
  const clicks = Number(row.clicks || 0);
  const ctr = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0;

  return {
    id: row.id,
    title: row.title,
    campaign: row.campaign,
    position: row.position,
    format: row.format,
    content: row.content,
    imageUrl: row.image_url,
    videoUrl: row.video_url,
    clickUrl: row.click_url,
    width: row.width,
    height: row.height,
    impressions,
    clicks,
    ctr,
    revenue: Number(row.revenue || 0),
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const selectAdSql = `
  SELECT id, title, campaign, position::text, format::text, content, image_url, video_url, click_url,
    width, height, impressions, clicks, ctr, revenue, status::text, start_date, end_date, created_at, updated_at
  FROM "ads"
`;

// ─── GET /  — list all ads ────────────────────────────────────────────────────

router.get('/', async (_req, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(`${selectAdSql} ORDER BY created_at DESC`);
    res.json({ success: true, data: rows.map(mapAd) });
  } catch (error) {
    next(error);
  }
});

// ─── GET /:id — single ad ─────────────────────────────────────────────────────

router.get('/:id', async (req, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `${selectAdSql} WHERE id = $1`,
      req.params.id,
    );
    if (!rows[0]) {
      res.status(404).json({ success: false, error: 'Anuncio nao encontrado' });
      return;
    }
    res.json({ success: true, data: mapAd(rows[0]) });
  } catch (error) {
    next(error);
  }
});

// ─── GET /stats/summary — aggregate metrics ───────────────────────────────────

router.get('/stats/summary', authenticateToken, requireAdmin, async (_req, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'active') AS active_count,
        COUNT(*) FILTER (WHERE status = 'paused') AS paused_count,
        COALESCE(SUM(impressions), 0) AS total_impressions,
        COALESCE(SUM(clicks), 0) AS total_clicks,
        CASE WHEN SUM(impressions) > 0 THEN
          ROUND((SUM(clicks)::numeric / SUM(impressions)) * 100, 2)
        ELSE 0 END AS overall_ctr,
        COALESCE(SUM(revenue), 0) AS total_revenue
      FROM "ads"
    `);

    const row = rows[0] || {};
    res.json({
      success: true,
      data: {
        activeAds: Number(row.active_count || 0),
        pausedAds: Number(row.paused_count || 0),
        totalImpressions: Number(row.total_impressions || 0),
        totalClicks: Number(row.total_clicks || 0),
        overallCtr: Number(row.overall_ctr || 0),
        totalRevenue: Number(row.total_revenue || 0),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── POST /:id/impression — increment impression counter ──────────────────────

router.post('/:id/impression', async (req, res, next) => {
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "ads" SET impressions = impressions + 1, updated_at = NOW() WHERE id = $1`,
      req.params.id,
    );
    res.json({ success: true, message: 'Impressao registada' });
  } catch (error) {
    next(error);
  }
});

// ─── POST /:id/click — increment click counter ────────────────────────────────

router.post('/:id/click', async (req, res, next) => {
  try {
    // Increment clicks and recalculate CTR in one query
    const rows = await prisma.$queryRawUnsafe<any[]>(`
      UPDATE "ads"
      SET
        clicks = clicks + 1,
        ctr = CASE WHEN impressions > 0 THEN
          ROUND(((clicks + 1)::numeric / impressions) * 100, 2)
        ELSE 0 END,
        updated_at = NOW()
      WHERE id = $1
      RETURNING clicks, impressions, ctr
    `, req.params.id);

    const row = rows[0];
    res.json({
      success: true,
      data: {
        clicks: Number(row?.clicks || 0),
        impressions: Number(row?.impressions || 0),
        ctr: Number(row?.ctr || 0),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── POST / — create ad ───────────────────────────────────────────────────────

router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const body = req.body;

    if (!body.title?.trim()) {
      res.status(400).json({ success: false, error: 'Titulo obrigatorio' });
      return;
    }

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `
        INSERT INTO "ads" (
          title, campaign, position, format, content, image_url, video_url, click_url,
          start_date, end_date, status
        )
        VALUES ($1, $2, $3::ad_position, $4::ad_format, $5, $6, $7, $8, $9::date, $10::date, $11::ad_status)
        RETURNING *
      `,
      body.title.trim(),
      body.campaign || null,
      body.position || 'header',
      body.format || 'banner',
      body.content || '',
      body.imageUrl || null,
      body.videoUrl || null,
      body.clickUrl || null,
      body.startDate || null,
      body.endDate || null,
      body.status || 'active',
    );

    res.status(201).json({ success: true, data: mapAd(rows[0]) });
  } catch (error) {
    next(error);
  }
});

// ─── PUT /:id — update ad ─────────────────────────────────────────────────────

router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const body = req.body;

    if (!body.title?.trim()) {
      res.status(400).json({ success: false, error: 'Titulo obrigatorio' });
      return;
    }

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `
        UPDATE "ads"
        SET title = $2, campaign = $3, position = $4::ad_position, format = $5::ad_format,
          content = $6, image_url = $7, video_url = $8, click_url = $9,
          start_date = $10::date, end_date = $11::date, status = $12::ad_status, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      req.params.id,
      body.title.trim(),
      body.campaign || null,
      body.position || 'header',
      body.format || 'banner',
      body.content || '',
      body.imageUrl || null,
      body.videoUrl || null,
      body.clickUrl || null,
      body.startDate || null,
      body.endDate || null,
      body.status || 'active',
    );

    if (!rows[0]) {
      res.status(404).json({ success: false, error: 'Anuncio nao encontrado' });
      return;
    }
    res.json({ success: true, data: mapAd(rows[0]) });
  } catch (error) {
    next(error);
  }
});

// ─── PATCH /:id/status — toggle status ───────────────────────────────────────

router.patch('/:id/status', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'paused', 'expired'].includes(status)) {
      res.status(400).json({ success: false, error: 'Status invalido' });
      return;
    }

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `UPDATE "ads" SET status = $2::ad_status, updated_at = NOW() WHERE id = $1 RETURNING *`,
      req.params.id,
      status,
    );

    if (!rows[0]) {
      res.status(404).json({ success: false, error: 'Anuncio nao encontrado' });
      return;
    }
    res.json({ success: true, data: mapAd(rows[0]) });
  } catch (error) {
    next(error);
  }
});

// ─── DELETE /:id — remove ad ──────────────────────────────────────────────────

router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const check = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM "ads" WHERE id = $1`,
      req.params.id,
    );
    if (!check[0]) {
      res.status(404).json({ success: false, error: 'Anuncio nao encontrado' });
      return;
    }
    await prisma.$executeRawUnsafe(`DELETE FROM "ads" WHERE id = $1`, req.params.id);
    res.json({ success: true, message: 'Anuncio removido!' });
  } catch (error) {
    next(error);
  }
});

export default router;
