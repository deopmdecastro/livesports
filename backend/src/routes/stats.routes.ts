import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { cached } from '../lib/cache';
import { getTotalViewers, getActiveRoomCount } from '../lib/realtime';

const router = Router();

/**
 * GET /api/stats/public
 *
 * Public, unauthenticated platform-wide stats consumed by the landing page so
 * the headline numbers (live channels, users, countries, viewers online) are
 * real and dynamic instead of hardcoded. The DB aggregates are cached briefly
 * to absorb bursts; the real-time viewer count comes straight from the
 * in-memory Socket.IO room state and is never cached.
 */
router.get('/public', async (_req, res, next) => {
  try {
    const db = await cached('stats:public', 10_000, async () => {
      const rows = await prisma.$queryRawUnsafe<Array<{
        total_users: bigint;
        total_lives: bigint;
        live_now: bigint;
        scheduled: bigint;
        db_viewers: bigint;
        total_views: bigint;
        competitions: bigint;
        events: bigint;
        leagues: bigint;
        countries: bigint;
      }>>(`
        SELECT
          (SELECT COUNT(*) FROM "users")::bigint AS total_users,
          (SELECT COUNT(*) FROM "lives")::bigint AS total_lives,
          (SELECT COUNT(*) FROM "lives" WHERE status = 'live')::bigint AS live_now,
          (SELECT COUNT(*) FROM "lives" WHERE status = 'scheduled')::bigint AS scheduled,
          (SELECT COALESCE(SUM(viewer_count), 0) FROM "lives" WHERE status = 'live')::bigint AS db_viewers,
          (SELECT COALESCE(SUM(total_views), 0) FROM "lives")::bigint AS total_views,
          (SELECT COUNT(*) FROM "competitions")::bigint AS competitions,
          (SELECT COUNT(*) FROM "events")::bigint AS events,
          (SELECT COUNT(DISTINCT league) FROM "lives" WHERE league IS NOT NULL AND TRIM(league) <> '')::bigint AS leagues,
          (SELECT COUNT(DISTINCT country) FROM "users" WHERE country IS NOT NULL AND TRIM(country) <> '')::bigint AS countries
      `);
      const r = rows[0];
      return {
        totalUsers: Number(r?.total_users ?? 0),
        totalLives: Number(r?.total_lives ?? 0),
        liveNow: Number(r?.live_now ?? 0),
        scheduled: Number(r?.scheduled ?? 0),
        dbViewers: Number(r?.db_viewers ?? 0),
        totalViews: Number(r?.total_views ?? 0),
        competitions: Number(r?.competitions ?? 0),
        events: Number(r?.events ?? 0),
        leagues: Number(r?.leagues ?? 0),
        countries: Number(r?.countries ?? 0),
      };
    });

    // Real-time viewers = people connected to live rooms via Socket.IO right
    // now, falling back to the persisted viewer_count when no sockets are
    // connected (e.g. during development without an open player tab).
    const realtimeViewers = getTotalViewers();
    const onlineViewers = Math.max(realtimeViewers, db.dbViewers);

    res.json({
      success: true,
      data: {
        ...db,
        onlineViewers,
        realtimeViewers,
        activeRooms: getActiveRoomCount(),
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
