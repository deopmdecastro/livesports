import { Router } from 'express';
import axios from 'axios';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { DEV_CALENDAR_EVENTS, fetchEventsByDay, shouldUseDevCalendar } from '../lib/thesportsdb';

const router = Router();


type FootballDataTeam = {
  id?: number;
  name?: string;
  shortName?: string;
  tla?: string;
  crest?: string;
};

type FootballDataMatch = {
  id: number;
  utcDate: string;
  status: string;
  stage?: string;
  group?: string;
  matchday?: number;
  homeTeam: FootballDataTeam;
  awayTeam: FootballDataTeam;
  score?: {
    fullTime?: {
      home?: number | null;
      away?: number | null;
    };
  };
};

type ApiFootballFixture = {
  fixture: {
    id: number;
    date: string;
    status?: {
      short?: string;
      long?: string;
      elapsed?: number | null;
    };
  };
  league?: {
    name?: string;
    logo?: string;
    round?: string;
  };
  teams?: {
    home?: {
      name?: string;
      logo?: string;
    };
    away?: {
      name?: string;
      logo?: string;
    };
  };
  goals?: {
    home?: number | null;
    away?: number | null;
  };
};

function toEventStatus(status: string) {
  if (['IN_PLAY', 'PAUSED', 'LIVE'].includes(status)) return 'live';
  if (status === 'FINISHED') return 'finished';
  return 'upcoming';
}

function toApiFootballEventStatus(status?: string) {
  const short = status || '';
  if (['1H', 'HT', '2H', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE'].includes(short)) return 'live';
  if (['FT', 'AET', 'PEN'].includes(short)) return 'finished';
  if (['PST', 'CANC', 'ABD', 'AWD', 'WO'].includes(short)) return 'cancelled';
  return 'upcoming';
}

function apiFootballMatchTime(match: ApiFootballFixture) {
  const elapsed = match.fixture.status?.elapsed;
  if (typeof elapsed === 'number' && elapsed > 0) return `${elapsed}'`;
  return match.fixture.status?.long || match.league?.round || 'Agendado';
}

function teamName(team: FootballDataTeam, fallback: string) {
  return team.shortName || team.name || team.tla || fallback;
}

router.post('/football-data/world-cup/events', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const token = process.env.FOOTBALL_DATA_API_TOKEN;
    if (!token) {
      res.status(400).json({
        success: false,
        error: 'FOOTBALL_DATA_API_TOKEN nao configurado no backend.',
      });
      return;
    }

    const season = String(req.body?.season || req.query.season || '2026');
    const stage = String(req.body?.stage || req.query.stage || 'GROUP_STAGE');
    const competitionCode = String(req.body?.competition || req.query.competition || 'WC');

    const response = await axios.get(`https://api.football-data.org/v4/competitions/${competitionCode}/matches`, {
      headers: { 'X-Auth-Token': token },
      params: { season, stage },
      timeout: 15000,
    });

    const matches = (response.data?.matches || []) as FootballDataMatch[];
    const competition = response.data?.competition || {};
    const league = `${competition.name || 'FIFA World Cup'} ${season}`;
    const leagueLogo = competition.emblem || 'https://crests.football-data.org/qatar.png';
    const imported = [];

    for (const match of matches.filter((item) => item.stage === stage)) {
      const homeName = teamName(match.homeTeam, 'Equipa A');
      const awayName = teamName(match.awayTeam, 'Equipa B');
      const eventId = `football-data-wc-${match.id}`;
      const scoreA = match.score?.fullTime?.home ?? null;
      const scoreB = match.score?.fullTime?.away ?? null;
      const groupLabel = match.group ? match.group.replace('_', ' ') : 'Fase de grupos';

      const rows = await prisma.$queryRawUnsafe<any[]>(
        `
          INSERT INTO "events" (
            "id", "title", "description", "thumbnail", "sport", "league", "league_logo",
            "team_a", "team_a_logo", "team_b", "team_b_logo", "score_a", "score_b",
            "match_time", "viewer_count", "scheduled_at", "status"
          )
          VALUES ($1, $2, $3, $4, 'football'::sport_category, $5, $6, $7, $8, $9, $10, $11, $12, $13, 0, $14::timestamptz, $15::event_status)
          ON CONFLICT ("id") DO UPDATE SET
            "title" = EXCLUDED."title",
            "description" = EXCLUDED."description",
            "thumbnail" = EXCLUDED."thumbnail",
            "sport" = EXCLUDED."sport",
            "league" = EXCLUDED."league",
            "league_logo" = EXCLUDED."league_logo",
            "team_a" = EXCLUDED."team_a",
            "team_a_logo" = EXCLUDED."team_a_logo",
            "team_b" = EXCLUDED."team_b",
            "team_b_logo" = EXCLUDED."team_b_logo",
            "score_a" = EXCLUDED."score_a",
            "score_b" = EXCLUDED."score_b",
            "match_time" = EXCLUDED."match_time",
            "scheduled_at" = EXCLUDED."scheduled_at",
            "status" = EXCLUDED."status",
            "updated_at" = NOW()
          RETURNING id, title, league, team_a, team_b, scheduled_at, status
        `,
        eventId,
        `${homeName} vs ${awayName}`,
        `${league} - ${groupLabel}. Dados importados de football-data.org.`,
        leagueLogo,
        league,
        leagueLogo,
        homeName,
        match.homeTeam.crest || null,
        awayName,
        match.awayTeam.crest || null,
        scoreA,
        scoreB,
        match.matchday ? `Jornada ${match.matchday}` : groupLabel,
        match.utcDate,
        toEventStatus(match.status)
      );

      imported.push(rows[0]);
    }

    res.json({
      success: true,
      data: {
        competition: competitionCode,
        season,
        stage,
        importedCount: imported.length,
        items: imported,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/api-football/live-events', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const token = process.env.API_FOOTBALL_KEY;
    if (!token) {
      res.status(400).json({
        success: false,
        error: 'API_FOOTBALL_KEY nao configurado no backend.',
      });
      return;
    }

    const requestedDate = req.body?.date || req.query.date;
    const requestedLeague = req.body?.league || req.query.league;
    const requestedSeason = req.body?.season || req.query.season;
    const requestedLive = req.body?.live || req.query.live || 'all';
    const params: Record<string, string> = {};

    if (requestedDate) {
      params.date = String(requestedDate);
    } else if (requestedLeague) {
      params.league = String(requestedLeague);
      params.season = String(requestedSeason || new Date().getFullYear());
    } else {
      params.live = String(requestedLive);
    }

    const response = await axios.get('https://v3.football.api-sports.io/fixtures', {
      headers: { 'x-apisports-key': token },
      params,
      timeout: 15000,
    });

    const matches = (response.data?.response || []) as ApiFootballFixture[];
    const synced = [];

    for (const match of matches) {
      const homeName = match.teams?.home?.name || 'Equipa A';
      const awayName = match.teams?.away?.name || 'Equipa B';
      const leagueName = match.league?.name || 'Football';
      const leagueRound = match.league?.round ? ` - ${match.league.round}` : '';
      const eventId = `api-football-${match.fixture.id}`;
      const leagueLogo = match.league?.logo || null;
      const status = toApiFootballEventStatus(match.fixture.status?.short);

      const rows = await prisma.$queryRawUnsafe<any[]>(
        `
          INSERT INTO "events" (
            "id", "title", "description", "thumbnail", "sport", "league", "league_logo",
            "team_a", "team_a_logo", "team_b", "team_b_logo", "score_a", "score_b",
            "match_time", "viewer_count", "scheduled_at", "status"
          )
          VALUES ($1, $2, $3, $4, 'football'::sport_category, $5, $6, $7, $8, $9, $10, $11, $12, $13, 0, $14::timestamptz, $15::event_status)
          ON CONFLICT ("id") DO UPDATE SET
            "title" = EXCLUDED."title",
            "description" = EXCLUDED."description",
            "thumbnail" = EXCLUDED."thumbnail",
            "sport" = EXCLUDED."sport",
            "league" = EXCLUDED."league",
            "league_logo" = EXCLUDED."league_logo",
            "team_a" = EXCLUDED."team_a",
            "team_a_logo" = EXCLUDED."team_a_logo",
            "team_b" = EXCLUDED."team_b",
            "team_b_logo" = EXCLUDED."team_b_logo",
            "score_a" = EXCLUDED."score_a",
            "score_b" = EXCLUDED."score_b",
            "match_time" = EXCLUDED."match_time",
            "scheduled_at" = EXCLUDED."scheduled_at",
            "status" = EXCLUDED."status",
            "updated_at" = NOW()
          RETURNING id, title, league, team_a, team_b, score_a, score_b, match_time, scheduled_at, status
        `,
        eventId,
        `${homeName} vs ${awayName}`,
        `${leagueName}${leagueRound}. Dados sincronizados da API-Football.`,
        leagueLogo,
        leagueName,
        leagueLogo,
        homeName,
        match.teams?.home?.logo || null,
        awayName,
        match.teams?.away?.logo || null,
        match.goals?.home ?? null,
        match.goals?.away ?? null,
        apiFootballMatchTime(match),
        match.fixture.date,
        status
      );

      synced.push(rows[0]);
    }

    res.json({
      success: true,
      data: {
        source: 'api-football',
        params,
        syncedCount: synced.length,
        items: synced,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/thesportsdb/import-events', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const date = String(req.query.date || req.body?.date || new Date().toISOString().slice(0, 10));
    const sport = String(req.query.s || req.query.sport || req.body?.sport || 'Soccer');

    if (shouldUseDevCalendar()) {
      // Minimal import for dev mode (no external HTTP requests)
      const imported = [] as any[];
      for (const ev of DEV_CALENDAR_EVENTS) {
        const rows = await prisma.$queryRawUnsafe<any[]>(
          `
          INSERT INTO "events" (
            "id", "title", "description", "thumbnail", "sport", "competition_id",
            "stage", "round_number", "group_name", "match_number",
            "league", "league_logo", "team_a", "team_a_code", "team_a_logo",
            "team_b", "team_b_code", "team_b_logo", "score_a", "score_b",
            "match_time", "viewer_count", "venue", "scheduled_at", "status"
          )
          VALUES (
            $1, $2, $3, $4, $5::sport_category, $6,
            $7, $8, $9, $10,
            $11, $12, $13, NULL, $14,
            $15, NULL, $16, $17, $18,
            $19, 0, $20, $21::timestamptz, $22::event_status
          )
          ON CONFLICT ("id") DO UPDATE SET
            "title" = EXCLUDED."title",
            "description" = EXCLUDED."description",
            "thumbnail" = EXCLUDED."thumbnail",
            "sport" = EXCLUDED."sport",
            "competition_id" = COALESCE(EXCLUDED."competition_id", "events"."competition_id"),
            "stage" = EXCLUDED."stage",
            "round_number" = EXCLUDED."round_number",
            "group_name" = EXCLUDED."group_name",
            "match_number" = EXCLUDED."match_number",
            "league" = EXCLUDED."league",
            "league_logo" = EXCLUDED."league_logo",
            "team_a" = EXCLUDED."team_a",
            "team_a_logo" = EXCLUDED."team_a_logo",
            "team_b" = EXCLUDED."team_b",
            "team_b_logo" = EXCLUDED."team_b_logo",
            "score_a" = EXCLUDED."score_a",
            "score_b" = EXCLUDED."score_b",
            "match_time" = EXCLUDED."match_time",
            "venue" = EXCLUDED."venue",
            "scheduled_at" = EXCLUDED."scheduled_at",
            "status" = EXCLUDED."status",
            "updated_at" = NOW()
          RETURNING id, title, league, team_a, team_b, scheduled_at, status
        `,
          ev.id,
          ev.title,
          `TheSportsDB (DEV) - ${ev.league}`,
          ev.thumbnail,
          ev.sportCategory,
          null,
          ev.round ? String(ev.round) : null,
          null,
          null,
          null,
          ev.league,
          ev.leagueBadge,
          ev.homeTeam,
          ev.homeBadge,
          ev.awayTeam,
          ev.awayBadge,
          ev.homeScore,
          ev.awayScore,
          ev.matchTime,
          ev.venue,
          ev.timestamp || `${ev.date}T12:00:00.000Z`,
          ev.status
        );
        imported.push(rows[0]);
      }

      res.json({
        success: true,
        data: {
          source: 'thesportsdb-dev',
          date,
          sport,
          importedCount: imported.length,
          items: imported,
        },
      });
      return;
    }

    // Live import
    const events = await fetchEventsByDay({ date, sport });
    const imported = [] as any[];

    for (const event of events) {
      const rows = await prisma.$queryRawUnsafe<any[]>(
        `
        INSERT INTO "events" (
          "id", "title", "description", "thumbnail", "sport", "competition_id",
          "stage", "round_number", "group_name", "match_number",
          "league", "league_logo", "team_a", "team_a_code", "team_a_logo",
          "team_b", "team_b_code", "team_b_logo", "score_a", "score_b",
          "match_time", "viewer_count", "venue", "scheduled_at", "status"
        )
        VALUES (
          $1, $2, $3, $4, $5::sport_category, $6,
          $7, $8, $9, $10,
          $11, $12, $13, NULL, $14,
          $15, NULL, $16, $17, $18,
          $19, 0, $20, $21::timestamptz, $22::event_status
        )
        ON CONFLICT ("id") DO UPDATE SET
          "title" = EXCLUDED."title",
          "description" = EXCLUDED."description",
          "thumbnail" = EXCLUDED."thumbnail",
          "sport" = EXCLUDED."sport",
          "competition_id" = COALESCE(EXCLUDED."competition_id", "events"."competition_id"),
          "stage" = EXCLUDED."stage",
          "round_number" = EXCLUDED."round_number",
          "group_name" = EXCLUDED."group_name",
          "match_number" = EXCLUDED."match_number",
          "league" = EXCLUDED."league",
          "league_logo" = EXCLUDED."league_logo",
          "team_a" = EXCLUDED."team_a",
          "team_a_logo" = EXCLUDED."team_a_logo",
          "team_b" = EXCLUDED."team_b",
          "team_b_logo" = EXCLUDED."team_b_logo",
          "score_a" = EXCLUDED."score_a",
          "score_b" = EXCLUDED."score_b",
          "match_time" = EXCLUDED."match_time",
          "venue" = EXCLUDED."venue",
          "scheduled_at" = EXCLUDED."scheduled_at",
          "status" = EXCLUDED."status",
          "updated_at" = NOW()
        RETURNING id, title, league, team_a, team_b, scheduled_at, status
      `,
        event.id,
        event.title,
        `TheSportsDB - ${event.league}`,
        event.thumbnail,
        event.sportCategory,
        null,
        event.round ? `Jornada ${event.round}` : null,
        null,
        event.status === 'finished' ? null : null,
        null,
        event.league,
        event.leagueBadge,
        event.homeTeam,
        event.homeBadge,
        event.awayTeam,
        event.awayBadge,
        event.homeScore,
        event.awayScore,
        event.matchTime,
        event.venue,
        event.timestamp || `${event.date}T12:00:00.000Z`,
        event.status
      );
      imported.push(rows[0]);
    }

    res.json({
      success: true,
      data: {
        source: 'thesportsdb',
        date,
        sport,
        importedCount: imported.length,
        items: imported,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/rapidapi/all-live-stream', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    type SourceAudit = {
      used: string[];
      ignored: string[];
      failed: Array<{ source: string; reason: string }>;
    };

    const audit: SourceAudit = { used: [], ignored: [], failed: [] };

    const apiKey = process.env.RAPIDAPI_KEY?.trim();

    // No RapidAPI key -> fallback instead of failing without context
    if (!apiKey || apiKey === 'your-rapidapi-key') {
      audit.ignored.push('rapidapi');

      if (process.env.ALLOW_DEMO_DATA === 'true') {
        // Use existing dev data from rapidapi-live-stream
        const {
          DEV_RAPIDAPI_LIVE_STREAMS,
          flattenRapidApiLiveStreams,
        } = await import('../lib/rapidapi-live-stream');

        // Return the mapped demo items (no DB upsert in this minimal router).
        const items = flattenRapidApiLiveStreams(DEV_RAPIDAPI_LIVE_STREAMS);
        audit.used.push('dev-sample');

        res.json({
          success: true,
          data: {
            source: 'dev-sample',
            sources: audit,
            syncedCount: 0,
            skippedCount: items.length,
            items,
            notice:
              'RAPIDAPI_KEY nao configurado. Foram devolvidos streams de demonstracao para desenvolvimento.',
          },
        });
        return;
      }


      // Fallback to what is already in the DB
      const rows = await prisma.$queryRawUnsafe<any[]>(
        `
          SELECT id, title, description, thumbnail, banner,
                 sport::text as sport, league, league_logo,
                 team_a, team_a_logo, team_b, team_b_logo,
                 score_a, score_b,
                 stream_url, hls_url, m3u8_url,
                 stream_servers, status,
                 featured, viewer_count, match_time, scheduled_at
          FROM "lives"
          ORDER BY featured DESC, scheduled_at DESC
          LIMIT 200
        `
      );

      if (!rows || rows.length === 0) {
        audit.failed.push({ source: 'db-fallback', reason: 'Nenhum live existente na base para fallback' });

        res.status(400).json({
          success: false,
          data: {
            source: 'db-fallback',
            sources: audit,
            syncedCount: 0,
            skippedCount: 0,
            items: [],
            notice:
              'RAPIDAPI_KEY nao configurado e a tabela "lives" esta vazia (nenhum stream previo para retornar).',
          },
        });
        return;
      }

      audit.used.push('db-fallback');

      const items = rows.map((row) => ({
        id: `db-live-${row.id}`,
        matchId: Number(row.id),
        title: row.title,
        teamA: row.team_a,
        teamB: row.team_b,
        league: row.league,
        sport: row.sport,
        scoreA: row.score_a,
        scoreB: row.score_b,
        m3u8Url: row.m3u8_url,
        hlsUrl: row.hls_url,
        streamUrl: row.stream_url,
        streamServers: row.stream_servers || [],
        scheduledAt: row.scheduled_at,
        matchTime: row.match_time,
        status: 'live' as const,
        description: row.description,
      }));

      res.json({
        success: true,
        data: {
          source: 'db-fallback',
          sources: audit,
          syncedCount: 0,
          skippedCount: items.length,
          items,
          notice:
            'RAPIDAPI_KEY nao configurado. Streams retornados a partir de lives ja existentes na base (fallback).',
        },
      });
      return;
    }

    // RapidAPI key present: full flow (fetch -> map -> upsert -> return)
    const {
      fetchRapidApiLiveStreams,
      flattenRapidApiLiveStreams,
      isMissingRapidApiKey,
    } = await import('../lib/rapidapi-live-stream');

    if (isMissingRapidApiKey(apiKey)) {
      audit.failed.push({ source: 'rapidapi', reason: 'RAPIDAPI_KEY inválida.' });
      res.status(400).json({ success: false, data: { source: 'rapidapi', sources: audit } });
      return;
    }

    audit.used.push('rapidapi-fetch');

    const groups = await fetchRapidApiLiveStreams(apiKey);
    const items = flattenRapidApiLiveStreams(groups);

    const upserted: any[] = [];

    for (const item of items) {
      const rows = await prisma.$queryRawUnsafe<any[]>(
        `
          INSERT INTO "lives" (
            "id",
            "title",
            "description",
            "thumbnail",
            "banner",
            "sport",
            "league",
            "league_logo",
            "team_a",
            "team_a_logo",
            "team_b",
            "team_b_logo",
            "score_a",
            "score_b",
            "stream_url",
            "hls_url",
            "m3u8_url",
            "stream_servers",
            "status",
            "featured",
            "viewer_count",
            "match_time",
            "scheduled_at",
            "tags"
          )
          VALUES (
            $1,
            $2,
            $3,
            NULL,
            NULL,
            $4::sport_category,
            $5,
            NULL,
            $6,
            NULL,
            $7,
            NULL,
            $8,
            $9,
            $10,
            $11,
            $12,
            $13::jsonb,
            'live'::live_status,
            FALSE,
            0,
            $14,
            $15::timestamptz,
            $14,
            '{}'
          )
          ON CONFLICT ("id") DO UPDATE SET
            "title" = EXCLUDED."title",
            "description" = EXCLUDED."description",
            "sport" = EXCLUDED."sport",
            "league" = EXCLUDED."league",
            "team_a" = EXCLUDED."team_a",
            "team_b" = EXCLUDED."team_b",
            "score_a" = EXCLUDED."score_a",
            "score_b" = EXCLUDED."score_b",
            "stream_url" = EXCLUDED."stream_url",
            "hls_url" = EXCLUDED."hls_url",
            "m3u8_url" = EXCLUDED."m3u8_url",
            "stream_servers" = EXCLUDED."stream_servers",
            "status" = EXCLUDED."status",
            "match_time" = EXCLUDED."match_time",
            "scheduled_at" = EXCLUDED."scheduled_at",
            "updated_at" = NOW()
          RETURNING id, title, league, team_a, team_b, score_a, score_b, stream_url, hls_url, m3u8_url, stream_servers, status, match_time, scheduled_at, updated_at
        `,
        item.id,
        item.title,
        item.description,
        item.sport,
        item.league,
        item.teamA,
        item.teamB,
        item.scoreA,
        item.scoreB,
        item.streamUrl,
        item.hlsUrl,
        item.m3u8Url,
        JSON.stringify(item.streamServers || []),
        item.matchTime,
        item.scheduledAt
      );

      upserted.push(rows[0]);
    }

    audit.used.push('rapidapi-upsert');

    const mapped = upserted.map((row) => ({
      id: row.id,
      matchId: Number(String(row.id).replace('rapidapi-live-', '')),
      title: row.title,
      teamA: row.team_a,
      teamB: row.team_b,
      league: row.league,
      sport: row.sport,
      scoreA: row.score_a,
      scoreB: row.score_b,
      m3u8Url: row.m3u8_url,
      hlsUrl: row.hls_url,
      streamUrl: row.stream_url,
      streamServers: row.stream_servers || [],
      scheduledAt: row.scheduled_at,
      matchTime: row.match_time,
      status: 'live' as const,
      description: row.description,
    }));

    res.json({
      success: true,
      data: {
        source: 'rapidapi',
        sources: audit,
        syncedCount: mapped.length,
        skippedCount: 0,
        items: mapped,
        notice: 'Streams importados e sincronizados via RapidAPI.',
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
