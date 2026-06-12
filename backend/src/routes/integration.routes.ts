import { Router } from 'express';
import axios from 'axios';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

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

export default router;
