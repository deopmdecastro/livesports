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
  } catch (error: any) {
    console.error('[DB ERROR] GET /api/dashboard/stats', {
      message: error?.message,
      code: error?.code,
      stack: process.env.NODE_ENV !== 'production' ? error?.stack : undefined,
    });
    next(error);
  }
});

router.get('/sidebar-stats', authenticateToken, requireAdmin, async (_req, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{
      live_now: bigint;
      online_viewers: bigint;
      countries: bigint;
    }>>(`
      SELECT
        (SELECT COUNT(*)::bigint FROM "lives" WHERE status = 'live') AS live_now,
        (SELECT COALESCE(SUM(viewer_count), 0)::bigint FROM "lives" WHERE status = 'live') AS online_viewers,
        (SELECT COUNT(DISTINCT country)::bigint FROM "users"
          WHERE country IS NOT NULL AND TRIM(country) <> '') AS countries
    `);

    const row = rows[0];
    res.json({
      success: true,
      data: {
        livesLiveNow: Number(row?.live_now ?? 0),
        onlineViewers: Number(row?.online_viewers ?? 0),
        countries: Number(row?.countries ?? 0),
      },
    });
  } catch (error: any) {
    console.error('[DB ERROR] GET /api/dashboard/sidebar-stats', {
      message: error?.message,
      code: error?.code,
      stack: process.env.NODE_ENV !== 'production' ? error?.stack : undefined,
    });
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
  } catch (error: any) {
    console.error('[DB ERROR] GET /api/dashboard/charts/views', {
      message: error?.message,
      code: error?.code,
      stack: process.env.NODE_ENV !== 'production' ? error?.stack : undefined,
    });
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
  } catch (error: any) {
    console.error('[DB ERROR] GET /api/dashboard/charts/devices', {
      message: error?.message,
      code: error?.code,
      stack: process.env.NODE_ENV !== 'production' ? error?.stack : undefined,
    });
    next(error);
  }
});

router.get('/operations', authenticateToken, requireAdmin, async (_req, res, next) => {
  try {
    const [notificationSummaryRows, recentNotifications, logsSummaryRows, recentLogs, apiKeys, supportSummaryRows, recentTickets, liveRows, eventRows] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          COUNT(*)::bigint AS total,
          COUNT(*) FILTER (WHERE read = false)::bigint AS unread,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours')::bigint AS last_24h
        FROM "notifications"
      `).catch(() => [{ total: 0, unread: 0, last_24h: 0 }]),
      prisma.$queryRawUnsafe<any[]>(`
        SELECT n.id, n.type::text AS type, n.title, n.message, n.read, n.created_at, u.name AS user_name
        FROM "notifications" n
        LEFT JOIN "users" u ON u.id = n.user_id
        ORDER BY n.created_at DESC
        LIMIT 5
      `).catch(() => []),
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          COUNT(*)::bigint AS total,
          COUNT(*) FILTER (WHERE level = 'error')::bigint AS errors,
          COUNT(*) FILTER (WHERE level = 'warn')::bigint AS warnings,
          COUNT(*) FILTER (WHERE level = 'fatal')::bigint AS fatals,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours')::bigint AS last_24h
        FROM "system_logs"
      `).catch(() => [{ total: 0, errors: 0, warnings: 0, fatals: 0, last_24h: 0 }]),
      prisma.$queryRawUnsafe<any[]>(`
        SELECT id, level::text AS level, service::text AS service, message, created_at
        FROM "system_logs"
        WHERE level IN ('warn', 'error', 'fatal')
        ORDER BY created_at DESC
        LIMIT 6
      `).catch(() => []),
      prisma.$queryRawUnsafe<any[]>(`
        SELECT id, name, provider, requests_used, request_limit, error_count, last_used_at, status::text AS status
        FROM "api_keys"
        ORDER BY error_count DESC, requests_used DESC
        LIMIT 8
      `).catch(() => []),
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          COUNT(*)::bigint AS total,
          COUNT(*) FILTER (WHERE status = 'open')::bigint AS open,
          COUNT(*) FILTER (WHERE status = 'pending')::bigint AS pending,
          COUNT(*) FILTER (WHERE priority = 'critical')::bigint AS critical
        FROM "support_tickets"
      `).catch(() => [{ total: 0, open: 0, pending: 0, critical: 0 }]),
      prisma.$queryRawUnsafe<any[]>(`
        SELECT t.id, t.subject, t.status::text AS status, t.priority::text AS priority, t.created_at, u.name AS user_name
        FROM "support_tickets" t
        LEFT JOIN "users" u ON u.id = t.user_id
        ORDER BY t.created_at DESC
        LIMIT 5
      `).catch(() => []),
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          COUNT(*)::bigint AS total,
          COUNT(*) FILTER (WHERE status = 'live')::bigint AS live_now,
          COUNT(*) FILTER (WHERE status = 'scheduled')::bigint AS scheduled,
          COUNT(*) FILTER (WHERE status = 'ended')::bigint AS ended,
          COALESCE(SUM(viewer_count), 0)::bigint AS viewers_now
        FROM "lives"
      `).catch(() => [{ total: 0, live_now: 0, scheduled: 0, ended: 0, viewers_now: 0 }]),
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          COUNT(*)::bigint AS total,
          COUNT(*) FILTER (WHERE status = 'live')::bigint AS live_now,
          COUNT(*) FILTER (WHERE status = 'upcoming')::bigint AS upcoming,
          COUNT(*) FILTER (WHERE status = 'finished')::bigint AS finished
        FROM "events"
      `).catch(() => [{ total: 0, live_now: 0, upcoming: 0, finished: 0 }]),
    ]);

    const notificationSummary = notificationSummaryRows[0] || {};
    const logsSummary = logsSummaryRows[0] || {};
    const supportSummary = supportSummaryRows[0] || {};
    const liveSummary = liveRows[0] || {};
    const eventSummary = eventRows[0] || {};

    res.json({
      success: true,
      data: {
        notifications: {
          total: Number(notificationSummary.total || 0),
          unread: Number(notificationSummary.unread || 0),
          last24h: Number(notificationSummary.last_24h || 0),
          recent: recentNotifications.map((item) => ({
            id: item.id,
            type: item.type,
            title: item.title,
            message: item.message,
            read: item.read,
            userName: item.user_name,
            createdAt: item.created_at,
          })),
        },
        logs: {
          total: Number(logsSummary.total || 0),
          errors: Number(logsSummary.errors || 0),
          warnings: Number(logsSummary.warnings || 0),
          fatals: Number(logsSummary.fatals || 0),
          last24h: Number(logsSummary.last_24h || 0),
          recent: recentLogs.map((item) => ({
            id: item.id,
            level: item.level,
            service: item.service,
            message: item.message,
            createdAt: item.created_at,
          })),
        },
        apis: {
          configured: apiKeys.length,
          failing: apiKeys.filter((key) => Number(key.error_count || 0) > 0 || key.status !== 'active').length,
          exhausted: apiKeys.filter((key) => Number(key.request_limit || 0) > 0 && Number(key.requests_used || 0) >= Number(key.request_limit || 0)).length,
          recent: apiKeys.map((key) => ({
            id: key.id,
            name: key.name,
            provider: key.provider,
            requestsUsed: Number(key.requests_used || 0),
            requestLimit: key.request_limit ? Number(key.request_limit) : null,
            errorCount: Number(key.error_count || 0),
            lastUsedAt: key.last_used_at,
            status: key.status,
          })),
        },
        support: {
          total: Number(supportSummary.total || 0),
          open: Number(supportSummary.open || 0),
          pending: Number(supportSummary.pending || 0),
          critical: Number(supportSummary.critical || 0),
          recent: recentTickets.map((ticket) => ({
            id: ticket.id,
            subject: ticket.subject,
            status: ticket.status,
            priority: ticket.priority,
            userName: ticket.user_name,
            createdAt: ticket.created_at,
          })),
        },
        lives: {
          total: Number(liveSummary.total || 0),
          liveNow: Number(liveSummary.live_now || 0),
          scheduled: Number(liveSummary.scheduled || 0),
          ended: Number(liveSummary.ended || 0),
          viewersNow: Number(liveSummary.viewers_now || 0),
        },
        events: {
          total: Number(eventSummary.total || 0),
          liveNow: Number(eventSummary.live_now || 0),
          upcoming: Number(eventSummary.upcoming || 0),
          finished: Number(eventSummary.finished || 0),
        },
      },
    });
  } catch (error: any) {
    console.error('[DB ERROR] GET /api/dashboard/operations', {
      message: error?.message,
      code: error?.code,
      stack: process.env.NODE_ENV !== 'production' ? error?.stack : undefined,
    });
    next(error);
  }
});

export default router;
