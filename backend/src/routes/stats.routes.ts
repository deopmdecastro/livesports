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

/**
 * GET /api/stats/imported-leagues
 *
 * Returns leagues/competitions that are actually imported in the database
 * from events and lives tables, with their logos.
 * Used by frontend to show only real/imported leagues instead of hardcoded mock data.
 */
router.get('/imported-leagues', async (_req, res, next) => {
  try {
    // Get distinct leagues from both events and lives tables with their logos
    const eventsLeagues = await prisma.$queryRawUnsafe<Array<{
      league: string;
      league_logo: string | null;
      sport: string;
      count: bigint;
    }>>(`
      SELECT
        league,
        MAX(league_logo) as league_logo,
        sport::text as sport,
        COUNT(*)::bigint as count
      FROM "events"
      WHERE league IS NOT NULL AND TRIM(league) <> ''
      GROUP BY league, sport
      ORDER BY count DESC
    `);

    const livesLeagues = await prisma.$queryRawUnsafe<Array<{
      league: string;
      league_logo: string | null;
      sport: string;
      count: bigint;
    }>>(`
      SELECT
        league,
        MAX(league_logo) as league_logo,
        sport::text as sport,
        COUNT(*)::bigint as count
      FROM "lives"
      WHERE league IS NOT NULL AND TRIM(league) <> ''
      GROUP BY league, sport
      ORDER BY count DESC
    `);

    // Merge and deduplicate leagues (prefer events data)
    const leagueMap = new Map<string, { name: string; logo: string | null; sport: string; eventCount: number; liveCount: number }>();

    for (const row of eventsLeagues) {
      leagueMap.set(row.league, {
        name: row.league,
        logo: row.league_logo,
        sport: row.sport,
        eventCount: Number(row.count),
        liveCount: 0,
      });
    }

    for (const row of livesLeagues) {
      const existing = leagueMap.get(row.league);
      if (existing) {
        existing.liveCount = Number(row.count);
        // Use logo from lives if events doesn't have one
        if (!existing.logo && row.league_logo) {
          existing.logo = row.league_logo;
        }
      } else {
        leagueMap.set(row.league, {
          name: row.league,
          logo: row.league_logo,
          sport: row.sport,
          eventCount: 0,
          liveCount: Number(row.count),
        });
      }
    }

    // Convert to array and sort by total count
    const leagues = Array.from(leagueMap.values())
      .sort((a, b) => (b.eventCount + b.liveCount) - (a.eventCount + a.liveCount))
      .map((league, index) => ({
        id: `league-${index}`,
        key: league.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/g, ''),
        name: league.name,
        logo: league.logo,
        sport: league.sport,
        eventCount: league.eventCount,
        liveCount: league.liveCount,
        totalCount: league.eventCount + league.liveCount,
        country: null, // Could be enriched from competitions table if available
      }));

    res.json({
      success: true,
      data: {
        leagues,
        totalLeagues: leagues.length,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
