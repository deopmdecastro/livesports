import { Router } from 'express';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

const router = Router();

function mapAd(row: any) {
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
    impressions: row.impressions,
    clicks: row.clicks,
    ctr: Number(row.ctr || 0),
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

router.get('/', async (_req, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(`${selectAdSql} ORDER BY created_at DESC`);
    res.json({ success: true, data: rows.map(mapAd) });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const body = req.body;
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `
        INSERT INTO "ads" (
          title, campaign, position, format, content, image_url, video_url, click_url,
          start_date, end_date, status
        )
        VALUES ($1, $2, $3::ad_position, $4::ad_format, $5, $6, $7, $8, $9::date, $10::date, $11::ad_status)
        RETURNING *
      `,
      body.title,
      body.campaign || null,
      body.position || 'header',
      body.format || 'banner',
      body.content || '',
      body.imageUrl || null,
      body.videoUrl || null,
      body.clickUrl || null,
      body.startDate || null,
      body.endDate || null,
      body.status || 'active'
    );
    res.status(201).json({ success: true, data: mapAd(rows[0]) });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const body = req.body;
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
      body.title,
      body.campaign || null,
      body.position || 'header',
      body.format || 'banner',
      body.content || '',
      body.imageUrl || null,
      body.videoUrl || null,
      body.clickUrl || null,
      body.startDate || null,
      body.endDate || null,
      body.status || 'active'
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

router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    await prisma.$executeRawUnsafe(`DELETE FROM "ads" WHERE id = $1`, req.params.id);
    res.json({ success: true, message: 'Anuncio removido!' });
  } catch (error) {
    next(error);
  }
});

export default router;
