import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

function mapLiveResult(row: any) {
  return {
    kind: 'live' as const,
    id: row.id,
    title: row.title,
    league: row.league,
    leagueLogo: row.league_logo,
    teamA: row.team_a,
    teamB: row.team_b,
    status: row.status,
    sport: row.sport,
    thumbnail: row.thumbnail,
    scheduledAt: row.scheduled_at,
    matchTime: row.match_time,
  };
}

function mapEventResult(row: any) {
  return {
    kind: 'event' as const,
    id: row.id,
    title: row.title,
    league: row.league,
    leagueLogo: row.league_logo,
    teamA: row.team_a,
    teamB: row.team_b,
    status: row.status,
    sport: row.sport,
    thumbnail: row.thumbnail,
    scheduledAt: row.scheduled_at,
    matchTime: row.match_time,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q || q.length < 2) {
      res.json({ success: true, data: { lives: [], events: [] } });
      return;
    }

    const limit = Math.min(Number(req.query.limit ?? 8), 20);
    const like = `%${q}%`;

    const [liveRows, eventRows] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(
        `SELECT id, title, league, league_logo, team_a, team_b, status::text, sport::text,
                thumbnail, scheduled_at, match_time
         FROM "lives"
         WHERE archived = false
           AND (title ILIKE $1 OR league ILIKE $1 OR team_a ILIKE $1 OR team_b ILIKE $1)
         ORDER BY status = 'live' DESC, scheduled_at DESC
         LIMIT $2`,
        like,
        limit
      ),
      prisma.$queryRawUnsafe<any[]>(
        `SELECT id, title, league, league_logo, team_a, team_b, status::text, sport::text,
                thumbnail, scheduled_at, match_time
         FROM "events"
         WHERE archived = false
           AND (title ILIKE $1 OR league ILIKE $1 OR team_a ILIKE $1 OR team_b ILIKE $1)
         ORDER BY status = 'live' DESC, scheduled_at ASC
         LIMIT $2`,
        like,
        limit
      ),
    ]);

    res.json({
      success: true,
      data: {
        lives: liveRows.map(mapLiveResult),
        events: eventRows.map(mapEventResult),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
