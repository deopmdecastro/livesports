import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

const router = Router();

router.use(authenticateToken, requireAdmin);

// GET /api/reports/games — real game/event statistics
router.get('/games', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const fromDate = from ? String(from) : new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const toDate = to ? String(to) : new Date().toISOString().slice(0, 10);

    const [summary, bySport, byStatus, bySource, recentGames] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          COUNT(*)::bigint as total,
          COUNT(*) FILTER (WHERE status='live')::bigint as live_now,
          COUNT(*) FILTER (WHERE status='finished')::bigint as finished,
          COUNT(*) FILTER (WHERE status='upcoming')::bigint as upcoming,
          COUNT(*) FILTER (WHERE status='cancelled')::bigint as cancelled
        FROM "events"
        WHERE scheduled_at BETWEEN $1::timestamptz AND $2::timestamptz
      `, `${fromDate}T00:00:00Z`, `${toDate}T23:59:59Z`),

      prisma.$queryRawUnsafe<any[]>(`
        SELECT sport::text, COUNT(*)::bigint as count
        FROM "events"
        WHERE scheduled_at BETWEEN $1::timestamptz AND $2::timestamptz
        GROUP BY sport ORDER BY count DESC
      `, `${fromDate}T00:00:00Z`, `${toDate}T23:59:59Z`),

      prisma.$queryRawUnsafe<any[]>(`
        SELECT status::text, COUNT(*)::bigint as count
        FROM "events"
        WHERE scheduled_at BETWEEN $1::timestamptz AND $2::timestamptz
        GROUP BY status
      `, `${fromDate}T00:00:00Z`, `${toDate}T23:59:59Z`),

      prisma.$queryRawUnsafe<any[]>(`
        SELECT COALESCE(import_source, 'manual') as source, COUNT(*)::bigint as count
        FROM "events"
        WHERE scheduled_at BETWEEN $1::timestamptz AND $2::timestamptz
        GROUP BY import_source ORDER BY count DESC
      `, `${fromDate}T00:00:00Z`, `${toDate}T23:59:59Z`),

      prisma.$queryRawUnsafe<any[]>(`
        SELECT id, title, sport::text, league, team_a, team_b, score_a, score_b, scheduled_at, status::text
        FROM "events"
        WHERE scheduled_at BETWEEN $1::timestamptz AND $2::timestamptz
        ORDER BY scheduled_at DESC LIMIT 20
      `, `${fromDate}T00:00:00Z`, `${toDate}T23:59:59Z`),
    ]);

    const s = summary[0] || {};
    res.json({
      success: true,
      data: {
        period: { from: fromDate, to: toDate },
        summary: {
          total: Number(s.total || 0),
          liveNow: Number(s.live_now || 0),
          finished: Number(s.finished || 0),
          upcoming: Number(s.upcoming || 0),
          cancelled: Number(s.cancelled || 0),
        },
        bySport: bySport.map((r) => ({ sport: r.sport, count: Number(r.count) })),
        byStatus: byStatus.map((r) => ({ status: r.status, count: Number(r.count) })),
        bySource: bySource.map((r) => ({ source: r.source, count: Number(r.count) })),
        recentGames,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/lives — live stream statistics
router.get('/lives', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const fromDate = from ? String(from) : new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const toDate = to ? String(to) : new Date().toISOString().slice(0, 10);

    const [summary, bySport, byStatus, topViewed, dailyViews] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          COUNT(*)::bigint as total,
          COUNT(*) FILTER (WHERE status='live')::bigint as live_now,
          COUNT(*) FILTER (WHERE status='ended')::bigint as ended,
          COALESCE(SUM(total_views),0)::bigint as total_views,
          COALESCE(SUM(viewer_count),0)::bigint as current_viewers,
          COALESCE(SUM(like_count),0)::bigint as total_likes
        FROM "lives"
        WHERE scheduled_at BETWEEN $1::timestamptz AND $2::timestamptz
      `, `${fromDate}T00:00:00Z`, `${toDate}T23:59:59Z`),

      prisma.$queryRawUnsafe<any[]>(`
        SELECT sport::text, COUNT(*)::bigint as count, COALESCE(SUM(total_views),0)::bigint as views
        FROM "lives"
        WHERE scheduled_at BETWEEN $1::timestamptz AND $2::timestamptz
        GROUP BY sport ORDER BY views DESC
      `, `${fromDate}T00:00:00Z`, `${toDate}T23:59:59Z`),

      prisma.$queryRawUnsafe<any[]>(`
        SELECT status::text, COUNT(*)::bigint as count
        FROM "lives"
        WHERE scheduled_at BETWEEN $1::timestamptz AND $2::timestamptz
        GROUP BY status
      `, `${fromDate}T00:00:00Z`, `${toDate}T23:59:59Z`),

      prisma.$queryRawUnsafe<any[]>(`
        SELECT id, title, sport::text, league, team_a, team_b, total_views, viewer_count, like_count, status::text, scheduled_at
        FROM "lives"
        WHERE scheduled_at BETWEEN $1::timestamptz AND $2::timestamptz
        ORDER BY total_views DESC LIMIT 10
      `, `${fromDate}T00:00:00Z`, `${toDate}T23:59:59Z`),

      prisma.$queryRawUnsafe<any[]>(`
        SELECT TO_CHAR(DATE(scheduled_at), 'DD/MM') as date,
               COUNT(*)::bigint as count,
               COALESCE(SUM(total_views),0)::bigint as views
        FROM "lives"
        WHERE scheduled_at BETWEEN $1::timestamptz AND $2::timestamptz
        GROUP BY DATE(scheduled_at) ORDER BY DATE(scheduled_at)
      `, `${fromDate}T00:00:00Z`, `${toDate}T23:59:59Z`),
    ]);

    const s = summary[0] || {};
    res.json({
      success: true,
      data: {
        period: { from: fromDate, to: toDate },
        summary: {
          total: Number(s.total || 0),
          liveNow: Number(s.live_now || 0),
          ended: Number(s.ended || 0),
          totalViews: Number(s.total_views || 0),
          currentViewers: Number(s.current_viewers || 0),
          totalLikes: Number(s.total_likes || 0),
        },
        bySport: bySport.map((r) => ({ sport: r.sport, count: Number(r.count), views: Number(r.views) })),
        byStatus: byStatus.map((r) => ({ status: r.status, count: Number(r.count) })),
        topViewed: topViewed.map((r) => ({
          id: r.id, title: r.title, sport: r.sport, league: r.league,
          teamA: r.team_a, teamB: r.team_b,
          totalViews: Number(r.total_views), viewerCount: Number(r.viewer_count),
          likeCount: Number(r.like_count), status: r.status, scheduledAt: r.scheduled_at,
        })),
        dailyViews: dailyViews.map((r) => ({
          date: r.date, count: Number(r.count), views: Number(r.views),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/users — user statistics
router.get('/users', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const fromDate = from ? String(from) : new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const toDate = to ? String(to) : new Date().toISOString().slice(0, 10);

    const [summary, byRole, byStatus, registrationsByDay] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          COUNT(*)::bigint as total,
          COUNT(*) FILTER (WHERE status='active')::bigint as active,
          COUNT(*) FILTER (WHERE status='suspended')::bigint as suspended,
          COUNT(*) FILTER (WHERE status='banned')::bigint as banned,
          COUNT(*) FILTER (WHERE email_verified=true)::bigint as verified,
          COUNT(*) FILTER (WHERE created_at >= $1::timestamptz)::bigint as new_this_period
        FROM "users"
      `, `${fromDate}T00:00:00Z`),

      prisma.$queryRawUnsafe<any[]>(`
        SELECT role::text, COUNT(*)::bigint as count FROM "users" GROUP BY role ORDER BY count DESC
      `),

      prisma.$queryRawUnsafe<any[]>(`
        SELECT status::text, COUNT(*)::bigint as count FROM "users" GROUP BY status
      `),

      prisma.$queryRawUnsafe<any[]>(`
        SELECT TO_CHAR(DATE(created_at), 'DD/MM') as date, COUNT(*)::bigint as count
        FROM "users"
        WHERE created_at BETWEEN $1::timestamptz AND $2::timestamptz
        GROUP BY DATE(created_at) ORDER BY DATE(created_at)
      `, `${fromDate}T00:00:00Z`, `${toDate}T23:59:59Z`),
    ]);

    const s = summary[0] || {};
    res.json({
      success: true,
      data: {
        period: { from: fromDate, to: toDate },
        summary: {
          total: Number(s.total || 0),
          active: Number(s.active || 0),
          suspended: Number(s.suspended || 0),
          banned: Number(s.banned || 0),
          verified: Number(s.verified || 0),
          newThisPeriod: Number(s.new_this_period || 0),
        },
        byRole: byRole.map((r) => ({ role: r.role, count: Number(r.count) })),
        byStatus: byStatus.map((r) => ({ status: r.status, count: Number(r.count) })),
        registrationsByDay: registrationsByDay.map((r) => ({ date: r.date, count: Number(r.count) })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/errors — API error/log statistics
router.get('/errors', async (_req, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        COUNT(*)::bigint as total,
        COUNT(*) FILTER (WHERE level='error')::bigint as errors,
        COUNT(*) FILTER (WHERE level='fatal')::bigint as fatals,
        COUNT(*) FILTER (WHERE level='warn')::bigint as warnings,
        COUNT(*) FILTER (WHERE created_at >= NOW()-INTERVAL '1h')::bigint as last_hour,
        COUNT(*) FILTER (WHERE created_at >= NOW()-INTERVAL '24h')::bigint as last_24h
      FROM "system_logs"
    `).catch(() => [{ total: 0, errors: 0, fatals: 0, warnings: 0, last_hour: 0, last_24h: 0 }]);

    const byService = await prisma.$queryRawUnsafe<any[]>(`
      SELECT service::text, COUNT(*)::bigint as count
      FROM "system_logs"
      WHERE level IN ('error','fatal') AND created_at >= NOW()-INTERVAL '7d'
      GROUP BY service ORDER BY count DESC
    `).catch(() => []);

    const recent = await prisma.$queryRawUnsafe<any[]>(`
      SELECT id, level::text, service::text, message, created_at
      FROM "system_logs"
      WHERE level IN ('error','fatal','warn')
      ORDER BY created_at DESC LIMIT 20
    `).catch(() => []);

    const r = rows[0] || {};
    res.json({
      success: true,
      data: {
        summary: {
          total: Number(r.total || 0),
          errors: Number(r.errors || 0),
          fatals: Number(r.fatals || 0),
          warnings: Number(r.warnings || 0),
          lastHour: Number(r.last_hour || 0),
          last24h: Number(r.last_24h || 0),
        },
        byService: byService.map((s) => ({ service: s.service, count: Number(s.count) })),
        recentErrors: recent,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/api-consumption — API keys usage
router.get('/api-consumption', async (_req, res, next) => {
  try {
    const keys = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, name, provider, requests_used, request_limit, error_count, last_used_at, status::text
       FROM "api_keys" ORDER BY requests_used DESC`
    ).catch(() => []);

    res.json({
      success: true,
      data: {
        keys: keys.map((k) => ({
          id: k.id,
          name: k.name,
          provider: k.provider,
          requestsUsed: Number(k.requests_used || 0),
          requestLimit: k.request_limit ? Number(k.request_limit) : null,
          usagePercent: k.request_limit ? Math.round((Number(k.requests_used) / Number(k.request_limit)) * 100) : null,
          errorCount: Number(k.error_count || 0),
          lastUsedAt: k.last_used_at,
          status: k.status,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
