import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

const router = Router();
router.use(authenticateToken, requireAdmin);

router.get('/', async (_req, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        a.campaign_id as id,
        a.campaign_name as name,
        COALESCE(a.advertiser_name, 'Anunciante') as advertiser,
        a.budget,
        COALESCE(a.spent, 0) as spent,
        COALESCE(a.impressions, 0) as impressions,
        COALESCE(a.clicks, 0) as clicks,
        CASE WHEN COALESCE(a.impressions,0)>0 THEN ROUND(a.clicks::numeric/a.impressions*100,1) ELSE 0 END as ctr,
        COALESCE(a.status, 'active') as status,
        a.start_date as "startDate",
        a.end_date as "endDate",
        a.positions
      FROM "ads" a
      WHERE a.campaign_id IS NOT NULL
      GROUP BY a.campaign_id, a.campaign_name, a.advertiser_name, a.budget, a.spent, a.impressions, a.clicks, a.status, a.start_date, a.end_date, a.positions
      ORDER BY a.created_at DESC
      LIMIT 50
    `);
    res.json({ success: true, data: rows });
  } catch(e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, advertiser, budget, status, startDate, endDate, positions } = req.body;
    await prisma.$queryRawUnsafe(
      `UPDATE "ads" SET campaign_name=$1, advertiser_name=$2, budget=$3, status=$4, start_date=$5::timestamptz, end_date=$6::timestamptz, positions=$7::text[] WHERE campaign_id=$8`,
      name, advertiser, budget, status, startDate||null, endDate||null, positions||null, id
    );
    res.json({ success: true });
  } catch(e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.$queryRawUnsafe(`DELETE FROM "ads" WHERE campaign_id=$1`, req.params.id);
    res.json({ success: true });
  } catch(e) { next(e); }
});

export default router;
