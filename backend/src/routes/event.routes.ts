import { Router } from 'express';
import axios from 'axios';
import { z } from 'zod';
import { authenticateToken, requireEditor } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { parsePagination, buildPaginationMeta } from '../lib/pagination';

const router = Router();

// DTO / validation schema shared by POST and PUT. Coerces empty strings to
// null for optional text fields so the DB doesn't end up with "" instead of
// NULL, and validates enum-like fields up front instead of letting Postgres
// raise an opaque invalid-input-syntax error.
const eventSchema = z.object({
  title: z.string().trim().min(1, 'Titulo obrigatorio').max(500),
  description: z.string().trim().nullish(),
  thumbnail: z.string().trim().nullish(),
  sport: z.enum(['football', 'basketball', 'tennis', 'ufc', 'f1', 'volleyball', 'baseball', 'other']).default('football'),
  competitionId: z.string().trim().nullish(),
  stage: z.string().trim().nullish(),
  roundNumber: z.coerce.number().int().nullish(),
  groupName: z.string().trim().nullish(),
  matchNumber: z.coerce.number().int().nullish(),
  league: z.string().trim().nullish(),
  leagueLogo: z.string().trim().nullish(),
  teamA: z.string().trim().nullish(),
  teamACode: z.string().trim().nullish(),
  teamALogo: z.string().trim().nullish(),
  teamB: z.string().trim().nullish(),
  teamBCode: z.string().trim().nullish(),
  teamBLogo: z.string().trim().nullish(),
  scoreA: z.coerce.number().int().nullish(),
  scoreB: z.coerce.number().int().nullish(),
  matchTime: z.string().trim().nullish(),
  viewerCount: z.coerce.number().int().min(0).default(0),
  venue: z.string().trim().nullish(),
  scheduledAt: z.string().trim().nullish(),
  status: z.enum(['upcoming', 'live', 'finished', 'cancelled']).default('upcoming'),
});

function mapEvent(row: any) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    thumbnail: row.thumbnail,
    sport: row.sport,

    competitionId: row.competition_id,
    stage: row.stage,
    roundNumber: row.round_number != null ? Number(row.round_number) : null,
    groupName: row.group_name,
    matchNumber: row.match_number != null ? Number(row.match_number) : null,

    league: row.league,
    leagueLogo: row.league_logo,
    teamA: row.team_a,
    teamACode: row.team_a_code,
    teamALogo: row.team_a_logo,
    teamB: row.team_b,
    teamBCode: row.team_b_code,
    teamBLogo: row.team_b_logo,
    scoreA: row.score_a,
    scoreB: row.score_b,
    matchTime: row.match_time,
    viewerCount: row.viewer_count,
    venue: row.venue,
    scheduledAt: row.scheduled_at,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}


// NOTE: queryRawUnsafe quebra 500 se qualquer coluna não existir no banco.
// Como o schema pode estar parcialmente migrado, usamos um SELECT resiliente:
// - `to_regclass('events')` garante que a tabela exista
// - `COALESCE`/casts evitam falhas em colunas NULL
// Mesmo assim, se colunas específicas não existirem, PostgreSQL ainda falha.
// Portanto, mantemos o SQL alinhado com o Prisma schema `Event`.
// Uses an explicit "e" alias so filters that need to JOIN against
// "competitions" (e.g. season) can be added without string-replacing the
// FROM clause.
const selectEventSql = `
  SELECT
    e.id,
    e.title,
    e.description,
    e.thumbnail,
    e.sport::text,
    e.competition_id,
    e.stage,
    e.round_number,
    e.group_name,
    e.match_number,
    e.league,
    e.league_logo,
    e.team_a,
    e.team_a_code,
    e.team_a_logo,
    e.team_b,
    e.team_b_code,
    e.team_b_logo,
    e.score_a,
    e.score_b,
    e.match_time,
    e.viewer_count,
    e.venue,
    e.scheduled_at,
    e.status::text,
    e.created_at,
    e.updated_at
  FROM "events" e
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

router.get('/', async (req, res, next) => {
  // NOTE on response shape: this endpoint returns `data` as a flat array with
  // `pagination` as a sibling key (not nested inside `data` like
  // live.routes.ts / news.routes.ts do). This looks inconsistent, but it's
  // intentional: every existing frontend consumer (LiveNowSection,
  // admin/events, admin/competitions/[id]/games, admin/dashboard) already
  // calls `apiRequest<Event[]>("/events")` and destructures `data` as an
  // array directly. Nesting it would silently break all four call sites.
  // New list endpoints should prefer the nested `{ items, pagination }` shape
  // (see live.routes.ts) — this one is grandfathered in.
  try {
    const { status, sport, q, team, season, from, to } = req.query;
    const conditions: string[] = ['1=1'];
    const values: unknown[] = [];

    if (status) {
      values.push(status);
      conditions.push(`e.status = $${values.length}::event_status`);
    }
    if (sport) {
      values.push(sport);
      conditions.push(`e.sport = $${values.length}::sport_category`);
    }
    const { competitionId } = req.query as any;
    if (competitionId) {
      values.push(competitionId);
      conditions.push(`e.competition_id = $${values.length}`);
    }

    if (q) {
      const like = `%${String(q)}%`;
      values.push(like);
      conditions.push(`(e.title ILIKE $${values.length} OR e.league ILIKE $${values.length} OR e.team_a ILIKE $${values.length} OR e.team_b ILIKE $${values.length})`);
    }
    // Filter by team name (either side of the fixture), as requested for the
    // results API — matches partial names case-insensitively.
    if (team) {
      const like = `%${String(team)}%`;
      values.push(like);
      conditions.push(`(e.team_a ILIKE $${values.length} OR e.team_b ILIKE $${values.length} OR e.team_a_code ILIKE $${values.length} OR e.team_b_code ILIKE $${values.length})`);
    }
    // Filter by season — events don't carry season directly, it lives on the
    // competition they belong to, so this joins through competition_id.
    if (season) {
      values.push(season);
      conditions.push(`EXISTS (SELECT 1 FROM "competitions" c WHERE c.id = e.competition_id AND c.season = $${values.length})`);
    }
    if (from) {
      values.push(from);
      conditions.push(`e.scheduled_at >= $${values.length}::timestamptz`);
    }
    if (to) {
      values.push(to);
      conditions.push(`e.scheduled_at <= $${values.length}::timestamptz`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const pagination = parsePagination(req.query as Record<string, unknown>, { limit: 50 });

    const [rows, countRows] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(
        `${selectEventSql} ${where} ORDER BY e.status = 'live' DESC, e.scheduled_at ASC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
        ...values, pagination.limit, pagination.offset
      ),
      prisma.$queryRawUnsafe<Array<{ total: bigint }>>(
        `SELECT COUNT(*)::bigint AS total FROM "events" e ${where}`,
        ...values
      ),
    ]);

    const total = Number(countRows[0]?.total || 0);
    res.json({
      success: true,
      data: rows.map(mapEvent),
      pagination: buildPaginationMeta(pagination, total),
    });
  } catch (error) {
    next(error);
  }
});

// ===== Search for admin select (title / teams / league) =====
router.get('/search', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const sport = String(req.query.sport || '').trim();
    const pagination = parsePagination(req.query as Record<string, unknown>, { limit: 20, maxLimit: 50 });

    const conditions: string[] = [];
    const values: unknown[] = [];

    if (q) {
      const like = `%${q}%`;
      values.push(like);
      // title | league | teams
      conditions.push(
        `(
          e.title ILIKE $${values.length}
          OR e.league ILIKE $${values.length}
          OR e.team_a ILIKE $${values.length}
          OR e.team_b ILIKE $${values.length}
        )`
      );
    }

    if (sport) {
      values.push(sport);
      conditions.push(`e.sport = $${values.length}::sport_category`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `${selectEventSql} ${where} ORDER BY e.status = 'live' DESC, e.scheduled_at ASC, e.created_at DESC LIMIT $${values.length + 1}`,
      ...values,
      pagination.limit
    );

    res.json({ success: true, data: rows.map(mapEvent) });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(`${selectEventSql} WHERE e.id = $1 LIMIT 1`, req.params.id);
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
    const parsed = eventSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message, details: parsed.error.errors });
      return;
    }
    const body = parsed.data;
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `
        INSERT INTO "events" (
          title,
          description,
          thumbnail,
          sport,
          competition_id,
          stage,
          round_number,
          group_name,
          match_number,
          league,
          league_logo,
          team_a,
          team_a_code,
          team_a_logo,
          team_b,
          team_b_code,
          team_b_logo,
          score_a,
          score_b,
          match_time,
          viewer_count,
          venue,
          scheduled_at,
          status
        )
        VALUES (
          $1,
          $2,
          $3,
          $4::sport_category,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12,
          $13,
          $14,
          $15,
          $16,
          $17,
          $18,
          $19,
          $20,
          $21,
          $22,
          $23,
          $24::timestamptz,
          $25::event_status
        )
        RETURNING *
      `,
      body.title,
      body.description ?? null,
      body.thumbnail ?? null,
      body.sport,
      body.competitionId ?? null,
      body.stage ?? null,
      body.roundNumber ?? null,
      body.groupName ?? null,
      body.matchNumber ?? null,
      body.league ?? null,
      body.leagueLogo ?? null,
      body.teamA ?? null,
      body.teamACode ?? null,
      body.teamALogo ?? null,
      body.teamB ?? null,
      body.teamBCode ?? null,
      body.teamBLogo ?? null,
      body.scoreA ?? null,
      body.scoreB ?? null,
      body.matchTime ?? null,
      body.viewerCount,
      body.venue ?? null,
      body.scheduledAt || new Date().toISOString(),
      body.status
    );
    res.status(201).json({ success: true, data: mapEvent(rows[0]) });
  } catch (error) {
    next(error);
  }
});


router.put('/:id', authenticateToken, requireEditor, async (req, res, next) => {
  try {
    const parsed = eventSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message, details: parsed.error.errors });
      return;
    }
    const body = parsed.data;
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `
        UPDATE "events"
        SET title = $2,
          description = $3,
          thumbnail = $4,
          sport = $5::sport_category,
          competition_id = $6,
          stage = $7,
          round_number = $8,
          group_name = $9,
          match_number = $10,
          league = $11,
          league_logo = $12,
          team_a = $13,
          team_a_code = $14,
          team_a_logo = $15,
          team_b = $16,
          team_b_code = $17,
          team_b_logo = $18,
          score_a = $19,
          score_b = $20,
          match_time = $21,
          viewer_count = $22,
          venue = $23,
          scheduled_at = $24::timestamptz,
          status = $25::event_status,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      req.params.id,
      body.title,
      body.description ?? null,
      body.thumbnail ?? null,
      body.sport,
      body.competitionId ?? null,
      body.stage ?? null,
      body.roundNumber ?? null,
      body.groupName ?? null,
      body.matchNumber ?? null,
      body.league ?? null,
      body.leagueLogo ?? null,
      body.teamA ?? null,
      body.teamACode ?? null,
      body.teamALogo ?? null,
      body.teamB ?? null,
      body.teamBCode ?? null,
      body.teamBLogo ?? null,
      body.scoreA ?? null,
      body.scoreB ?? null,
      body.matchTime ?? null,
      body.viewerCount,
      body.venue ?? null,
      body.scheduledAt || new Date().toISOString(),
      body.status
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
    const rows = await prisma.$queryRawUnsafe<any[]>(`DELETE FROM "events" WHERE id = $1 RETURNING id`, req.params.id);
    if (!rows[0]) {
      res.status(404).json({ success: false, error: 'Evento nao encontrado' });
      return;
    }
    res.json({ success: true, message: 'Evento removido com sucesso!' });
  } catch (error) {
    next(error);
  }
});

// ─── Quick Actions ─────────────────────────────────────────────────────────────
router.patch('/:id/status', authenticateToken, requireEditor, async (req, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `UPDATE "events" SET status = $2::event_status, updated_at = NOW() WHERE id = $1 RETURNING *`,
      req.params.id, req.body.status
    );
    if (!rows[0]) { res.status(404).json({ success: false, error: 'Evento nao encontrado' }); return; }
    res.json({ success: true, data: mapEvent(rows[0]) });
  } catch (error) { next(error); }
});

router.patch('/:id/archive', authenticateToken, requireEditor, async (req, res, next) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `UPDATE "events" SET archived = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
      req.params.id, Boolean(req.body.archived ?? true)
    );
    if (!rows[0]) { res.status(404).json({ success: false, error: 'Evento nao encontrado' }); return; }
    res.json({ success: true, data: mapEvent(rows[0]) });
  } catch (error) { next(error); }
});

export default router;

