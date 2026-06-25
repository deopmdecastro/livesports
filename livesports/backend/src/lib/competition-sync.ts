import axios from 'axios';
import { prisma } from './prisma';
import {
  fetchEventsByDay,
  fetchLeagueSeasonEvents,
  fetchLeaguesBySport,
  type CalendarEvent,
  type CalendarLeague,
} from './thesportsdb';
import { resolveTeamFlagUrl } from './flags';

type CompetitionFormat = 'groups' | 'league' | 'knockout';
type SportCategory = 'football' | 'basketball' | 'tennis' | 'ufc' | 'f1' | 'volleyball' | 'baseball' | 'other';
type EventStatus = 'upcoming' | 'live' | 'finished' | 'cancelled';
type SourceStatus = 'synced' | 'skipped' | 'error';

export interface CompetitionSyncSourceResult {
  source: string;
  status: SourceStatus;
  message?: string;
  competitionsCreated: number;
  competitionsUpdated: number;
  eventsUpserted: number;
  standingsUpdated: number;
}

export interface CompetitionSyncResult {
  startedAt: string;
  finishedAt: string;
  competitionsCreated: number;
  competitionsUpdated: number;
  eventsUpserted: number;
  standingsUpdated: number;
  sources: CompetitionSyncSourceResult[];
}

interface SyncOptions {
  season?: string;
  date?: string;
  maxLeagues?: number;
  maxSeasonLeagues?: number;
  maxEventsPerLeague?: number;
}

interface CompetitionInput {
  name: string;
  slug?: string;
  season?: string | null;
  sport?: SportCategory | null;
  description?: string | null;
  thumbnail?: string | null;
  banner?: string | null;
  format?: CompetitionFormat;
  heroBadge?: string | null;
  heroBadgeIcon?: string | null;
  heroTitleLine1?: string | null;
  heroTitleLine2?: string | null;
  hostCountries?: string | null;
  sectionTitle?: string | null;
  statTeams?: number | null;
  statGames?: number | null;
  groupsData?: unknown;
  themeColor?: string | null;
}

interface EventInput {
  id: string;
  title: string;
  description?: string | null;
  thumbnail?: string | null;
  sport: SportCategory;
  competitionId?: string | null;
  stage?: string | null;
  roundNumber?: number | null;
  groupName?: string | null;
  matchNumber?: number | null;
  league?: string | null;
  leagueLogo?: string | null;
  teamA?: string | null;
  teamACode?: string | null;
  teamALogo?: string | null;
  teamB?: string | null;
  teamBCode?: string | null;
  teamBLogo?: string | null;
  scoreA?: number | null;
  scoreB?: number | null;
  matchTime?: string | null;
  venue?: string | null;
  scheduledAt: string;
  status: EventStatus;
}

const API_FOOTBALL_BASE = 'https://v3.football.api-sports.io';
const FOOTBALL_DATA_BASE = 'https://api.football-data.org/v4';

const SOURCE_ZERO = {
  competitionsCreated: 0,
  competitionsUpdated: 0,
  eventsUpserted: 0,
  standingsUpdated: 0,
};

const SLUG_OVERRIDES: Record<string, string> = {
  englishpremierleague: 'premier-league',
  premierleague: 'premier-league',
  spanishlaliga: 'la-liga',
  laliga: 'la-liga',
  bundesliga: 'bundesliga',
  germanbundesliga: 'bundesliga',
  italianseriea: 'serie-a',
  seriea: 'serie-a',
  frenchligue1: 'ligue-1',
  ligue1: 'ligue-1',
  ligaportugal: 'liga-portugal',
  portugueseliga: 'liga-portugal',
  brasileiraoseriea: 'brasileirao',
  brasileirao: 'brasileirao',
  uefachampionsleague: 'champions-league',
  championleague: 'champions-league',
  championleagueuefa: 'champions-league',
  uefaeuropaleague: 'europa-league',
  uefaconferenceleague: 'conference-league',
  fifaworldcup: 'copa-do-mundo',
  fifaworldcup2026: 'copa-do-mundo',
  worldcup: 'copa-do-mundo',
  uefaeuro: 'euro',
  uefanationsleague: 'nations-league',
};

const PREFERRED_SLUGS = new Set([
  'copa-do-mundo',
  'premier-league',
  'la-liga',
  'bundesliga',
  'serie-a',
  'ligue-1',
  'liga-portugal',
  'brasileirao',
  'champions-league',
  'europa-league',
  'conference-league',
  'nations-league',
  'eredivisie',
  'liga-belgica',
  'super-lig',
  'scottish-premiership',
]);

function emptySource(source: string, status: SourceStatus, message?: string): CompetitionSyncSourceResult {
  return { source, status, message, ...SOURCE_ZERO };
}

function mergeTotals(sources: CompetitionSyncSourceResult[], startedAt: string): CompetitionSyncResult {
  return {
    startedAt,
    finishedAt: new Date().toISOString(),
    competitionsCreated: sources.reduce((sum, item) => sum + item.competitionsCreated, 0),
    competitionsUpdated: sources.reduce((sum, item) => sum + item.competitionsUpdated, 0),
    eventsUpserted: sources.reduce((sum, item) => sum + item.eventsUpserted, 0),
    standingsUpdated: sources.reduce((sum, item) => sum + item.standingsUpdated, 0),
    sources,
  };
}

function isMissingApiKey(value?: string | null) {
  const token = value?.trim();
  return !token || token === 'your-api-football-key' || token === 'your-football-data-token' || token === 'your-rapidapi-key';
}

function normalizeKey(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

function slugify(value: string) {
  const key = normalizeKey(value);
  if (SLUG_OVERRIDES[key]) return SLUG_OVERRIDES[key];

  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'competicao';
}

function currentFootballSeason() {
  const now = new Date();
  const year = now.getUTCFullYear();
  return String(now.getUTCMonth() >= 6 ? year : year - 1);
}

function displaySeason(value?: string | null) {
  if (!value) return null;
  if (/^\d{4}-\d{4}$/.test(value)) return value.replace('-', '-');
  return value;
}

function inferFormat(name: string, type?: string | null): CompetitionFormat {
  const text = `${name} ${type || ''}`.toLowerCase();
  if (text.includes('league') || text.includes('liga') || text.includes('serie') || text.includes('premiership')) {
    return 'league';
  }
  if (text.includes('cup') || text.includes('copa') || text.includes('taca') || text.includes('pokal') || text.includes('super')) {
    return 'knockout';
  }
  return 'groups';
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function roundNumber(value?: string | number | null): number | null {
  if (typeof value === 'number') return value;
  if (!value) return null;
  const match = String(value).match(/\d+/);
  return match ? Number(match[0]) : null;
}

function groupName(value?: string | null): string | null {
  if (!value) return null;
  const match = value.match(/group\s+([A-Z0-9]+)/i);
  return match ? match[1] : null;
}

function apiFootballStatus(short?: string): EventStatus {
  const code = short || '';
  if (['1H', 'HT', '2H', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE'].includes(code)) return 'live';
  if (['FT', 'AET', 'PEN'].includes(code)) return 'finished';
  if (['PST', 'CANC', 'ABD', 'AWD', 'WO'].includes(code)) return 'cancelled';
  return 'upcoming';
}

function footballDataStatus(status?: string): EventStatus {
  if (['IN_PLAY', 'PAUSED', 'LIVE'].includes(status || '')) return 'live';
  if (status === 'FINISHED') return 'finished';
  if (['POSTPONED', 'CANCELLED', 'SUSPENDED'].includes(status || '')) return 'cancelled';
  return 'upcoming';
}

function apiFootballMatchTime(match: any) {
  const elapsed = match.fixture?.status?.elapsed;
  if (typeof elapsed === 'number' && elapsed > 0) return `${elapsed}'`;
  return match.fixture?.status?.long || match.league?.round || 'Agendado';
}

async function existingCompetitionSlugs() {
  const rows = await prisma.$queryRawUnsafe<Array<{ slug: string }>>('SELECT slug FROM "competitions"');
  return new Set(rows.map((row) => row.slug));
}

async function upsertCompetition(input: CompetitionInput): Promise<{ id: string; inserted: boolean }> {
  const slug = input.slug || slugify(input.name);
  const groupsData = input.groupsData == null ? null : JSON.stringify(input.groupsData);

  const rows = await prisma.$queryRawUnsafe<Array<{ id: string; inserted: boolean }>>(
    `
      INSERT INTO "competitions" (
        "name", "slug", "season", "sport", "description", "thumbnail", "banner",
        "status", "format", "hero_badge", "hero_badge_icon", "hero_title_line1", "hero_title_line2",
        "host_countries", "section_title", "stat_teams", "stat_games", "groups_data", "theme_color"
      )
      VALUES (
        $1, $2, $3, $4::sport_category, $5, $6, $7,
        'active'::competition_status, $8::competition_format, $9, $10, $11, $12,
        $13, $14, $15, $16, $17::jsonb, $18
      )
      ON CONFLICT ("slug") DO UPDATE SET
        "name" = EXCLUDED."name",
        "season" = COALESCE(EXCLUDED."season", "competitions"."season"),
        "sport" = COALESCE(EXCLUDED."sport", "competitions"."sport"),
        "description" = COALESCE(EXCLUDED."description", "competitions"."description"),
        "thumbnail" = COALESCE(EXCLUDED."thumbnail", "competitions"."thumbnail"),
        "banner" = COALESCE(EXCLUDED."banner", "competitions"."banner"),
        "format" = COALESCE(EXCLUDED."format", "competitions"."format"),
        "hero_badge" = COALESCE(EXCLUDED."hero_badge", "competitions"."hero_badge"),
        "hero_badge_icon" = COALESCE(EXCLUDED."hero_badge_icon", "competitions"."hero_badge_icon"),
        "hero_title_line1" = COALESCE(EXCLUDED."hero_title_line1", "competitions"."hero_title_line1"),
        "hero_title_line2" = COALESCE(EXCLUDED."hero_title_line2", "competitions"."hero_title_line2"),
        "host_countries" = COALESCE(EXCLUDED."host_countries", "competitions"."host_countries"),
        "section_title" = COALESCE(EXCLUDED."section_title", "competitions"."section_title"),
        "stat_teams" = COALESCE(EXCLUDED."stat_teams", "competitions"."stat_teams"),
        "stat_games" = COALESCE(EXCLUDED."stat_games", "competitions"."stat_games"),
        "groups_data" = COALESCE(EXCLUDED."groups_data", "competitions"."groups_data"),
        "theme_color" = COALESCE(EXCLUDED."theme_color", "competitions"."theme_color"),
        "updated_at" = NOW()
      RETURNING "id", (xmax = 0) AS "inserted"
    `,
    input.name,
    slug,
    input.season ?? null,
    input.sport ?? 'football',
    input.description ?? null,
    input.thumbnail ?? null,
    input.banner ?? null,
    input.format ?? inferFormat(input.name),
    input.heroBadge ?? input.name,
    input.heroBadgeIcon ?? null,
    input.heroTitleLine1 ?? input.name,
    input.heroTitleLine2 ?? input.season ?? null,
    input.hostCountries ?? null,
    input.sectionTitle ?? input.name,
    input.statTeams ?? null,
    input.statGames ?? null,
    groupsData,
    input.themeColor ?? null
  );

  return { id: rows[0].id, inserted: Boolean(rows[0].inserted) };
}

async function upsertEvent(input: EventInput): Promise<void> {
  await prisma.$executeRawUnsafe(
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
        $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20,
        $21, 0, $22, $23::timestamptz, $24::event_status
      )
      ON CONFLICT ("id") DO UPDATE SET
        "title" = EXCLUDED."title",
        "description" = COALESCE(EXCLUDED."description", "events"."description"),
        "thumbnail" = COALESCE(EXCLUDED."thumbnail", "events"."thumbnail"),
        "sport" = EXCLUDED."sport",
        "competition_id" = COALESCE(EXCLUDED."competition_id", "events"."competition_id"),
        "stage" = COALESCE(EXCLUDED."stage", "events"."stage"),
        "round_number" = COALESCE(EXCLUDED."round_number", "events"."round_number"),
        "group_name" = COALESCE(EXCLUDED."group_name", "events"."group_name"),
        "match_number" = COALESCE(EXCLUDED."match_number", "events"."match_number"),
        "league" = COALESCE(EXCLUDED."league", "events"."league"),
        "league_logo" = COALESCE(EXCLUDED."league_logo", "events"."league_logo"),
        "team_a" = COALESCE(EXCLUDED."team_a", "events"."team_a"),
        "team_a_code" = COALESCE(EXCLUDED."team_a_code", "events"."team_a_code"),
        "team_a_logo" = COALESCE(EXCLUDED."team_a_logo", "events"."team_a_logo"),
        "team_b" = COALESCE(EXCLUDED."team_b", "events"."team_b"),
        "team_b_code" = COALESCE(EXCLUDED."team_b_code", "events"."team_b_code"),
        "team_b_logo" = COALESCE(EXCLUDED."team_b_logo", "events"."team_b_logo"),
        "score_a" = EXCLUDED."score_a",
        "score_b" = EXCLUDED."score_b",
        "match_time" = COALESCE(EXCLUDED."match_time", "events"."match_time"),
        "venue" = COALESCE(EXCLUDED."venue", "events"."venue"),
        "scheduled_at" = EXCLUDED."scheduled_at",
        "status" = EXCLUDED."status",
        "updated_at" = NOW()
    `,
    input.id,
    input.title,
    input.description ?? null,
    input.thumbnail ?? null,
    input.sport,
    input.competitionId ?? null,
    input.stage ?? null,
    input.roundNumber ?? null,
    input.groupName ?? null,
    input.matchNumber ?? null,
    input.league ?? null,
    input.leagueLogo ?? null,
    input.teamA ?? null,
    input.teamACode ?? null,
    input.teamALogo ?? null,
    input.teamB ?? null,
    input.teamBCode ?? null,
    input.teamBLogo ?? null,
    input.scoreA ?? null,
    input.scoreB ?? null,
    input.matchTime ?? null,
    input.venue ?? null,
    input.scheduledAt,
    input.status
  );
}

function shouldDeepSync(slug: string, existing: Set<string>) {
  return existing.has(slug) || PREFERRED_SLUGS.has(slug);
}

function mapTheSportsDbEventToInput(event: CalendarEvent, competitionId: string | null): EventInput {
  return {
    id: event.id,
    title: event.title,
    description: [event.league, event.round ? `Jornada ${event.round}` : null, 'TheSportsDB'].filter(Boolean).join(' - '),
    thumbnail: event.thumbnail || event.leagueBadge || null,
    sport: event.sportCategory,
    competitionId,
    stage: event.round ? `Jornada ${event.round}` : null,
    roundNumber: roundNumber(event.round),
    groupName: null,
    league: event.league,
    leagueLogo: event.leagueBadge,
    teamA: event.homeTeam,
    teamALogo: event.homeBadge,
    teamB: event.awayTeam,
    teamBLogo: event.awayBadge,
    scoreA: event.homeScore,
    scoreB: event.awayScore,
    matchTime: event.matchTime,
    venue: event.venue,
    scheduledAt: event.timestamp || `${event.date || new Date().toISOString().slice(0, 10)}T12:00:00.000Z`,
    status: event.status,
  };
}

async function syncTheSportsDb(options: Required<SyncOptions>, existing: Set<string>): Promise<CompetitionSyncSourceResult> {
  const result = emptySource('TheSportsDB', 'synced');

  const leagues = (await fetchLeaguesBySport('Soccer')).slice(0, options.maxLeagues);
  const targets: Array<{ league: CalendarLeague; competitionId: string; slug: string }> = [];

  for (const league of leagues) {
    const slug = slugify(league.name);
    const upserted = await upsertCompetition({
      name: league.name,
      slug,
      season: displaySeason(league.currentSeason),
      sport: 'football',
      description: [league.country, 'Dados sincronizados do TheSportsDB.'].filter(Boolean).join(' - '),
      thumbnail: league.badge,
      format: inferFormat(league.name),
      heroBadge: league.name,
      heroTitleLine1: league.name,
      heroTitleLine2: displaySeason(league.currentSeason),
      hostCountries: league.country,
      sectionTitle: league.name,
    });

    if (upserted.inserted) result.competitionsCreated += 1;
    else result.competitionsUpdated += 1;

    if (league.currentSeason && shouldDeepSync(slug, existing)) {
      targets.push({ league, competitionId: upserted.id, slug });
    }
  }

  for (const target of targets.slice(0, options.maxSeasonLeagues)) {
    try {
      const seasonEvents = await fetchLeagueSeasonEvents({
        leagueId: target.league.id,
        season: target.league.currentSeason || options.season,
      });

      for (const event of seasonEvents.slice(0, options.maxEventsPerLeague)) {
        await upsertEvent(mapTheSportsDbEventToInput(event, target.competitionId));
        result.eventsUpserted += 1;
      }

      if (seasonEvents.length > 0) {
        await upsertCompetition({
          name: target.league.name,
          slug: target.slug,
          season: displaySeason(target.league.currentSeason),
          sport: 'football',
          statGames: seasonEvents.length,
        });
      }
    } catch {
      // Keep the global sync useful even when a free endpoint has no season data.
    }
  }

  try {
    const dayEvents = await fetchEventsByDay({ date: options.date, sport: 'Soccer' });
    for (const event of dayEvents.slice(0, options.maxEventsPerLeague)) {
      const slug = slugify(event.league);
      const comp = await upsertCompetition({
        name: event.league,
        slug,
        season: displaySeason(event.season),
        sport: event.sportCategory,
        thumbnail: event.leagueBadge,
        format: inferFormat(event.league),
        sectionTitle: event.league,
      });
      await upsertEvent(mapTheSportsDbEventToInput(event, comp.id));
      result.eventsUpserted += 1;
    }
  } catch {
    // Calendar can be empty on the free key; that should not make the sync fail.
  }

  result.message = `${leagues.length} ligas lidas; ${result.eventsUpserted} jogos atualizados.`;
  return result;
}

function mapApiFootballStandings(payload: any): unknown[] | null {
  const standings = payload?.response?.[0]?.league?.standings;
  if (!Array.isArray(standings) || standings.length === 0) return null;

  return standings.map((groupRows: any[], index: number) => {
    const label = groupRows?.[0]?.group?.replace(/^Group\s+/i, '') || (standings.length > 1 ? String.fromCharCode(65 + index) : 'Classificacao');
    return {
      group: label,
      teams: (groupRows || []).map((item: any) => ({
        id: String(item.team?.id || item.rank || item.team?.name),
        name: item.team?.name || 'Equipa',
        code: '',
        flag: item.team?.logo || undefined,
        group: label,
        played: Number(item.all?.played || 0),
        wins: Number(item.all?.win || 0),
        draws: Number(item.all?.draw || 0),
        losses: Number(item.all?.lose || 0),
        gf: Number(item.all?.goals?.for || 0),
        ga: Number(item.all?.goals?.against || 0),
        points: Number(item.points || 0),
      })),
    };
  });
}

function mapApiFootballFixture(match: any, competitionId: string | null): EventInput {
  const home = match.teams?.home || {};
  const away = match.teams?.away || {};
  const league = match.league || {};
  const round = league.round || null;

  return {
    id: `api-football-${match.fixture?.id}`,
    title: `${home.name || 'Equipa A'} vs ${away.name || 'Equipa B'}`,
    description: [league.name, round, 'API-Football'].filter(Boolean).join(' - '),
    thumbnail: league.logo || null,
    sport: 'football',
    competitionId,
    stage: round,
    roundNumber: roundNumber(round),
    groupName: groupName(round),
    league: league.name || null,
    leagueLogo: league.logo || null,
    teamA: home.name || null,
    teamALogo: home.logo || null,
    teamB: away.name || null,
    teamBLogo: away.logo || null,
    scoreA: toNumber(match.goals?.home),
    scoreB: toNumber(match.goals?.away),
    matchTime: apiFootballMatchTime(match),
    venue: match.fixture?.venue?.name || null,
    scheduledAt: match.fixture?.date || new Date().toISOString(),
    status: apiFootballStatus(match.fixture?.status?.short),
  };
}

async function apiFootballGet<T>(token: string, endpoint: string, params: Record<string, string | number | undefined>) {
  const response = await axios.get<T>(`${API_FOOTBALL_BASE}/${endpoint}`, {
    headers: { 'x-apisports-key': token },
    params: params as any,
    timeout: 20000,
  });


  const errors = (response.data as any)?.errors;
  if (errors && Object.keys(errors).length > 0) {
    throw new Error(Object.values(errors).filter(Boolean).join(' - ') || 'Erro na API-Football.');
  }

  return response.data;
}

async function syncApiFootball(options: Required<SyncOptions>, existing: Set<string>): Promise<CompetitionSyncSourceResult> {
  const token = process.env.API_FOOTBALL_KEY?.trim();
  if (isMissingApiKey(token)) {
    return emptySource('API-Football', 'skipped', 'API_FOOTBALL_KEY esta vazia em backend/.env.');
  }

  const result = emptySource('API-Football', 'synced');
  const payload = await apiFootballGet<any>(token!, 'leagues', { season: options.season });
  const items = (payload.response || []).slice(0, options.maxLeagues);
  const deepTargets: Array<{ leagueId: number; season: string; competitionId: string; name: string; slug: string; logo?: string | null }> = [];

  for (const item of items) {
    const league = item.league || {};
    if (!league.id || !league.name) continue;

    const country = item.country || {};
    const seasonInfo = (item.seasons || []).find((entry: any) => String(entry.year) === options.season) || (item.seasons || [])[0] || {};
    const slug = slugify(league.name);
    const upserted = await upsertCompetition({
      name: league.name,
      slug,
      season: String(seasonInfo.year || options.season),
      sport: 'football',
      description: [country.name, 'Dados sincronizados da API-Football.'].filter(Boolean).join(' - '),
      thumbnail: league.logo || null,
      format: inferFormat(league.name, league.type),
      heroBadge: league.name,
      heroTitleLine1: league.name,
      heroTitleLine2: String(seasonInfo.year || options.season),
      hostCountries: country.name || null,
      sectionTitle: league.name,
    });

    if (upserted.inserted) result.competitionsCreated += 1;
    else result.competitionsUpdated += 1;

    if (shouldDeepSync(slug, existing)) {
      deepTargets.push({
        leagueId: Number(league.id),
        season: String(seasonInfo.year || options.season),
        competitionId: upserted.id,
        name: league.name,
        slug,
        logo: league.logo || null,
      });
    }
  }

  for (const target of deepTargets.slice(0, options.maxSeasonLeagues)) {
    try {
      const standings = await apiFootballGet<any>(token!, 'standings', {
        league: target.leagueId,
        season: target.season,
      });
      const groupsData = mapApiFootballStandings(standings);
      if (groupsData) {
        const teamCount = (groupsData as any[]).reduce((sum, group) => sum + (group.teams?.length || 0), 0);
        await upsertCompetition({
          name: target.name,
          slug: target.slug,
          sport: 'football',
          thumbnail: target.logo,
          groupsData,
          statTeams: teamCount,
          format: (groupsData as any[]).length > 1 ? 'groups' : 'league',
        });
        result.standingsUpdated += 1;
      }
    } catch {
      // Some cups/leagues do not expose standings on the current plan.
    }

    const fixtures = new Map<number, any>();
    for (const params of [
      { league: target.leagueId, season: target.season, next: 30 },
      { league: target.leagueId, season: target.season, last: 20 },
    ]) {
      try {
        const fixturePayload = await apiFootballGet<any>(token!, 'fixtures', params);
        for (const match of fixturePayload.response || []) {
          if (match.fixture?.id) fixtures.set(Number(match.fixture.id), match);
        }
      } catch {
        // Continue with any successful fixture request.
      }
    }

    for (const match of Array.from(fixtures.values()).slice(0, options.maxEventsPerLeague)) {
      await upsertEvent(mapApiFootballFixture(match, target.competitionId));
      result.eventsUpserted += 1;
    }
  }

  result.message = `${items.length} ligas lidas; ${result.standingsUpdated} classificacoes; ${result.eventsUpserted} jogos.`;
  return result;
}

function footballDataCompetitionFormat(type?: string | null): CompetitionFormat {
  const normalized = (type || '').toLowerCase();
  if (normalized.includes('league')) return 'league';
  if (normalized.includes('cup')) return 'knockout';
  return 'groups';
}

function footballDataTeamName(team: any, fallback: string) {
  return team?.shortName || team?.name || team?.tla || fallback;
}

function mapFootballDataMatch(match: any, competitionId: string | null, leagueName: string, leagueLogo?: string | null): EventInput {
  const homeName = footballDataTeamName(match.homeTeam, 'Equipa A');
  const awayName = footballDataTeamName(match.awayTeam, 'Equipa B');
  const stage = match.group ? match.group.replace('_', ' ') : match.stage || null;

  return {
    id: `football-data-${match.id}`,
    title: `${homeName} vs ${awayName}`,
    description: [leagueName, stage, 'football-data.org'].filter(Boolean).join(' - '),
    thumbnail: leagueLogo || null,
    sport: 'football',
    competitionId,
    stage,
    roundNumber: match.matchday ?? null,
    groupName: groupName(stage),
    league: leagueName,
    leagueLogo: leagueLogo || null,
    teamA: homeName,
    teamACode: match.homeTeam?.tla || null,
    teamALogo: resolveTeamFlagUrl({ code: match.homeTeam?.tla, crestOrLogo: match.homeTeam?.crest }) || null,
    teamB: awayName,
    teamBCode: match.awayTeam?.tla || null,
    teamBLogo: resolveTeamFlagUrl({ code: match.awayTeam?.tla, crestOrLogo: match.awayTeam?.crest }) || null,
    scoreA: toNumber(match.score?.fullTime?.home),
    scoreB: toNumber(match.score?.fullTime?.away),
    matchTime: match.matchday ? `Jornada ${match.matchday}` : stage || 'Agendado',
    scheduledAt: match.utcDate || new Date().toISOString(),
    status: footballDataStatus(match.status),
  };
}

async function footballDataGet<T>(token: string, endpoint: string, params: Record<string, string | number> = {}) {
  const response = await axios.get<T>(`${FOOTBALL_DATA_BASE}/${endpoint}`, {
    headers: { 'X-Auth-Token': token },
    params: params as any,
    timeout: 20000,
  });
  return response.data;
}

async function syncFootballData(options: Required<SyncOptions>, existing: Set<string>): Promise<CompetitionSyncSourceResult> {
  const token = process.env.FOOTBALL_DATA_API_TOKEN?.trim();
  if (isMissingApiKey(token)) {
    return emptySource('Football-Data', 'skipped', 'FOOTBALL_DATA_API_TOKEN esta vazia em backend/.env.');
  }

  const result = emptySource('Football-Data', 'synced');
  const payload = await footballDataGet<any>(token!, 'competitions');
  const competitions = (payload.competitions || []).slice(0, options.maxLeagues);
  const targets: Array<{ code: string; id: string; name: string; logo?: string | null; slug: string }> = [];

  for (const item of competitions) {
    if (!item.name || !item.code) continue;
    const slug = slugify(item.name);
    const upserted = await upsertCompetition({
      name: item.name,
      slug,
      season: item.currentSeason?.startDate ? item.currentSeason.startDate.slice(0, 4) : options.season,
      sport: 'football',
      description: [item.area?.name, 'Dados sincronizados do Football-Data.'].filter(Boolean).join(' - '),
      thumbnail: item.emblem || null,
      format: footballDataCompetitionFormat(item.type),
      heroBadge: item.name,
      heroTitleLine1: item.name,
      heroTitleLine2: item.currentSeason?.startDate ? item.currentSeason.startDate.slice(0, 4) : options.season,
      hostCountries: item.area?.name || null,
      sectionTitle: item.name,
    });

    if (upserted.inserted) result.competitionsCreated += 1;
    else result.competitionsUpdated += 1;

    if (shouldDeepSync(slug, existing) || item.code === 'WC') {
      targets.push({ code: item.code, id: upserted.id, name: item.name, logo: item.emblem || null, slug });
    }
  }

  for (const target of targets.slice(0, options.maxSeasonLeagues)) {
    try {
      const matchesPayload = await footballDataGet<any>(token!, `competitions/${target.code}/matches`, {
        season: target.code === 'WC' ? '2026' : options.season,
      });
      const matches = matchesPayload.matches || [];
      for (const match of matches.slice(0, options.maxEventsPerLeague)) {
        await upsertEvent(mapFootballDataMatch(match, target.id, target.name, target.logo));
        result.eventsUpserted += 1;
      }

      if (matches.length > 0) {
        await upsertCompetition({
          name: target.name,
          slug: target.slug,
          sport: 'football',
          thumbnail: target.logo,
          statGames: matches.length,
        });
      }
    } catch {
      // Plans differ a lot on football-data.org; keep syncing the rest.
    }
  }

  result.message = `${competitions.length} competicoes lidas; ${result.eventsUpserted} jogos.`;
  return result;
}

function normalizeOptions(options: SyncOptions = {}): Required<SyncOptions> {
  return {
    season: options.season || currentFootballSeason(),
    date: options.date || new Date().toISOString().slice(0, 10),
    maxLeagues: Math.min(Math.max(Number(options.maxLeagues || 80), 1), 200),
    maxSeasonLeagues: Math.min(Math.max(Number(options.maxSeasonLeagues || 12), 1), 40),
    maxEventsPerLeague: Math.min(Math.max(Number(options.maxEventsPerLeague || 80), 1), 200),
  };
}

export async function syncAllCompetitions(options: SyncOptions = {}): Promise<CompetitionSyncResult> {
  const startedAt = new Date().toISOString();
  const normalized = normalizeOptions(options);
  const sources: CompetitionSyncSourceResult[] = [];
  const existing = await existingCompetitionSlugs();

  for (const syncer of [
    () => syncTheSportsDb(normalized, existing),
    () => syncApiFootball(normalized, existing),
    () => syncFootballData(normalized, existing),
  ]) {
    try {
      sources.push(await syncer());
    } catch (error) {
      sources.push({
        ...emptySource('Fonte externa', 'error'),
        message: error instanceof Error ? error.message : 'Erro desconhecido durante a sincronizacao.',
      });
    }
  }

  return mergeTotals(sources, startedAt);
}
