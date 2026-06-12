import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/stats', authenticateToken, requireAdmin, async (_req, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{
      total_users: bigint;
      lives_transmitted: bigint;
      total_views: bigint;
      ads_revenue: any;
    }>>(`
      SELECT
        (SELECT COUNT(*) FROM "users") AS total_users,
        (SELECT COUNT(*) FROM "lives") AS lives_transmitted,
        (SELECT COALESCE(SUM("total_views"), 0) FROM "lives") AS total_views,
        (SELECT COALESCE(SUM("revenue"), 0) FROM "ads") AS ads_revenue
    `);
    const data = rows[0];
    res.json({
      success: true,
      data: {
        totalUsers: Number(data.total_users),
        totalUsersGrowth: 0,
        livesTransmitted: Number(data.lives_transmitted),
        livesGrowth: 0,
        totalViews: Number(data.total_views),
        viewsGrowth: 0,
        adsRevenue: Number(data.ads_revenue || 0),
        revenueGrowth: 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/charts/views', authenticateToken, requireAdmin, async (_req, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ date: string; views: bigint; revenue: any }>>(`
      SELECT TO_CHAR(day, 'DD/MM') AS date, COALESCE(views, 0)::bigint AS views, COALESCE(revenue, 0) AS revenue
      FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day') AS day
      LEFT JOIN (
        SELECT DATE("created_at") AS created_day, COUNT(*) AS views
        FROM "live_views"
        GROUP BY DATE("created_at")
      ) live_stats ON live_stats.created_day = day
      LEFT JOIN (
        SELECT DATE("created_at") AS created_day, SUM("revenue") AS revenue
        FROM "ads"
        GROUP BY DATE("created_at")
      ) ad_stats ON ad_stats.created_day = day
      ORDER BY day
    `);
    res.json({ success: true, data: rows.map((row) => ({ date: row.date, views: Number(row.views), revenue: Number(row.revenue || 0) })) });
  } catch (error) {
    next(error);
  }
});

router.get('/charts/devices', authenticateToken, requireAdmin, async (_req, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ device: string; total: bigint }>>(`
      SELECT
        CASE
          WHEN LOWER(COALESCE("user_agent", '')) LIKE '%smart-tv%'
            OR LOWER(COALESCE("user_agent", '')) LIKE '%smarttv%'
            OR LOWER(COALESCE("user_agent", '')) LIKE '%tizen%'
            OR LOWER(COALESCE("user_agent", '')) LIKE '%webos%' THEN 'smartTv'
          WHEN LOWER(COALESCE("user_agent", '')) LIKE '%tablet%'
            OR LOWER(COALESCE("user_agent", '')) LIKE '%ipad%' THEN 'tablet'
          WHEN LOWER(COALESCE("user_agent", '')) LIKE '%mobile%'
            OR LOWER(COALESCE("user_agent", '')) LIKE '%android%'
            OR LOWER(COALESCE("user_agent", '')) LIKE '%iphone%' THEN 'mobile'
          ELSE 'desktop'
        END AS device,
        COUNT(*) AS total
      FROM "live_views"
      GROUP BY device
    `);
    const totals = rows.reduce((sum, row) => sum + Number(row.total), 0);
    const percentages = { mobile: 0, desktop: 0, smartTv: 0, tablet: 0 };

    rows.forEach((row) => {
      const key = row.device as keyof typeof percentages;
      percentages[key] = totals > 0 ? Math.round((Number(row.total) / totals) * 100) : 0;
    });

    res.json({ success: true, data: percentages });
  } catch (error) {
    next(error);
  }
});

export default router;
