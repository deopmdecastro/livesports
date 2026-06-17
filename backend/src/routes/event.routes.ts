import { Router } from 'express';
import axios from 'axios';
import { authenticateToken, requireEditor } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

const router = Router();

function mapEvent(row: any) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    thumbnail: row.thumbnail,
    sport: row.sport,
    league: row.league,
    leagueLogo: row.league_logo,
    teamA: row.team_a,
    teamALogo: row.team_a_logo,
    teamB: row.team_b,
    teamBLogo: row.team_b_logo,
    scoreA: row.score_a,
    scoreB: row.score_b,
    matchTime: row.match_time,
    viewerCount: row.viewer_count,
    scheduledAt: row.scheduled_at,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const selectEventSql = `
  SELECT id, title, description, thumbnail, sport::text, league, league_logo, team_a, team_a_logo,
    team_b, team_b_logo, score_a, score_b, match_time, viewer_count, scheduled_at,
    status::text, created_at, updated_at
  FROM "events"
`;

async function fetchApiFootballFixtureData(fixtureId: string) {
  const token = process.env.API_FOOTBALL_KEY;
  if (!token) {
    return {
      source: 'api-football',
      fixtureId,
      fixture: null,
      statistics: [],
      timeline: [],
      lineups: [],
    };
  }

  const headers = { 'x-apisports-key': token };
  const [fixtureResult, statisticsResult, eventsResult, lineupsResult] = await Promise.allSettled([
    axios.get('https://v3.football.api-sports.io/fixtures', {
      headers,
      params: { id: fixtureId },
      timeout: 15000,
    }),
    axios.get('https://v3.football.api-sports.io/fixtures/statistics', {
      headers,
      params: { fixture: fixtureId },
      timeout: 15000,
    }),
    axios.get('https://v3.football.api-sports.io/fixtures/events', {
      headers,
      params: { fixture: fixtureId },
      timeout: 15000,
    }),
    axios.get('https://v3.football.api-sports.io/fixtures/lineups', {
      headers,
      params: { fixture: fixtureId },
      timeout: 15000,
    }),
  ]);

  return {
    source: 'api-football',
    fixtureId,
    fixture: fixtureResult.status === 'fulfilled' ? fixtureResult.value.data?.response?.[0] || null : null,
    statistics: statisticsResult.status === 'fulfilled' ? statisticsResult.value.data?.response || [] : [],
    timeline: eventsResult.status === 'fulfilled' ? eventsResult.value.data?.response || [] : [],
    lineups: lineupsResult.status === 'fulfilled' ? lineupsResult.value.data?.response || [] : [],
  };
}

router.get('/', async (_req, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(`${selectEventSql} ORDER BY status = 'live' DESC, scheduled_at ASC`);
    res.json({ success: true, data: rows.map(mapEvent) });
  } catch (error) {
    next(error);
  }
});

// ===== Search for admin select (title / teams / league) =====
router.get('/search', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const sport = String(req.query.sport || '').trim();
    const limit = Math.min(Number(req.query.limit || 20), 50);

    const conditions: string[] = [];
    const values: unknown[] = [];

    if (q) {
      const like = `%${q}%`;
      values.push(like);
      // title | league | teams
      conditions.push(
        `(
          title ILIKE $${values.length}
          OR league ILIKE $${values.length}
          OR team_a ILIKE $${values.length}
          OR team_b ILIKE $${values.length}
        )`
      );
    }

    if (sport) {
      values.push(sport);
      conditions.push(`sport = $${values.length}::sport_category`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `${selectEventSql} ${where} ORDER BY status = 'live' DESC, scheduled_at ASC, created_at DESC LIMIT $${values.length + 1}`,
      ...values,
      limit
    );

    res.json({ success: true, data: rows.map(mapEvent) });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(`${selectEventSql} WHERE id = $1 LIMIT 1`, req.params.id);
    if (!rows[0]) {
      res.status(404).json({ success: false, error: 'Evento nao encontrado' });
      return;
    }
    res.json({ success: true, data: mapEvent(rows[0]) });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/statistics', async (req, res, next) => {
  try {
    if (!req.params.id.startsWith('api-football-')) {
      res.json({ success: true, data: { source: 'local', items: [] } });
      return;
    }

    const fixtureId = req.params.id.replace('api-football-', '');
    const data = await fetchApiFootballFixtureData(fixtureId);

    res.json({
      success: true,
      data: {
        source: 'api-football',
        fixtureId,
        items: data.statistics,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/summary', async (req, res, next) => {
  try {
    if (!req.params.id.startsWith('api-football-')) {
      res.json({
        success: true,
        data: {
          source: 'local',
          fixtureId: null,
          fixture: null,
          statistics: [],
          timeline: [],
          lineups: [],
        },
      });
      return;
    }

    const fixtureId = req.params.id.replace('api-football-', '');
    const data = await fetchApiFootballFixtureData(fixtureId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticateToken, requireEditor, async (req, res, next) => {
  try {
    const body = req.body;
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `
        INSERT INTO "events" (
          title, description, thumbnail, sport, league, league_logo, team_a, team_a_logo,
          team_b, team_b_logo, score_a, score_b, match_time, viewer_count, scheduled_at, status
        )
        VALUES ($1, $2, $3, $4::sport_category, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::timestamptz, $16::event_status)
        RETURNING *
      `,
      body.title,
      body.description || null,
      body.thumbnail || null,
      body.sport || 'football',
      body.league || null,
      body.leagueLogo || null,
      body.teamA || null,
      body.teamALogo || null,
      body.teamB || null,
      body.teamBLogo || null,
      body.scoreA ?? null,
      body.scoreB ?? null,
      body.matchTime || null,
      body.viewerCount || 0,
      body.scheduledAt || new Date().toISOString(),
      body.status || 'upcoming'
    );
    res.status(201).json({ success: true, data: mapEvent(rows[0]) });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticateToken, requireEditor, async (req, res, next) => {
  try {
    const body = req.body;
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `
        UPDATE "events"
        SET title = $2, description = $3, thumbnail = $4, sport = $5::sport_category,
          league = $6, league_logo = $7, team_a = $8, team_a_logo = $9,
          team_b = $10, team_b_logo = $11, score_a = $12, score_b = $13,
          match_time = $14, viewer_count = $15, scheduled_at = $16::timestamptz,
          status = $17::event_status, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      req.params.id,
      body.title,
      body.description || null,
      body.thumbnail || null,
      body.sport || 'football',
      body.league || null,
      body.leagueLogo || null,
      body.teamA || null,
      body.teamALogo || null,
      body.teamB || null,
      body.teamBLogo || null,
      body.scoreA ?? null,
      body.scoreB ?? null,
      body.matchTime || null,
      body.viewerCount || 0,
      body.scheduledAt || new Date().toISOString(),
      body.status || 'upcoming'
    );
    if (!rows[0]) {
      res.status(404).json({ success: false, error: 'Evento nao encontrado' });
      return;
    }
    res.json({ success: true, data: mapEvent(rows[0]) });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticateToken, requireEditor, async (req, res, next) => {
  try {
    await prisma.$executeRawUnsafe(`DELETE FROM "events" WHERE id = $1`, req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;

