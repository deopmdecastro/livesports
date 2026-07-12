import axios from 'axios';

// ─── Retry helper — handles transient network errors and rate limits ───────────
const THESPORTSDB_RETRY_COUNT = 3;
const THESPORTSDB_RETRY_DELAY_MS = 500;

async function retryFetch(url: string, retries = THESPORTSDB_RETRY_COUNT): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 429 && attempt < retries) {
        // Rate limited — back off
        await new Promise(r => setTimeout(r, THESPORTSDB_RETRY_DELAY_MS * attempt * 2));
        continue;
      }
      return res;
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, THESPORTSDB_RETRY_DELAY_MS * attempt));
    }
  }
  throw new Error('retryFetch: exhausted all retries');
}



const BASE_URL = 'https://www.thesportsdb.com/api/v1/json';
const DEFAULT_FREE_KEY = '123';
const CACHE_TTL_MS = 5 * 60 * 1000;

export const THESPORTSDB_SPORTS = [
  { id: 'Soccer', label: 'Futebol', slug: 'soccer' },
  { id: 'Basketball', label: 'Basquete', slug: 'basketball' },
  { id: 'Tennis', label: 'Ténis', slug: 'tennis' },
  { id: 'Fighting', label: 'Luta / UFC', slug: 'fighting' },
  { id: 'Motorsport', label: 'Motorsport / F1', slug: 'motorsport' },
  { id: 'Baseball', label: 'Beisebol', slug: 'baseball' },
  { id: 'American Football', label: 'Futebol Americano', slug: 'american-football' },
  { id: 'Ice Hockey', label: 'Hóquei no Gelo', slug: 'ice-hockey' },
  { id: 'Rugby', label: 'Rugby', slug: 'rugby' },
  { id: 'Cricket', label: 'Críquete', slug: 'cricket' },
  { id: 'Volleyball', label: 'Voleibol', slug: 'volleyball' },
] as const;

export type TheSportsDbSport = (typeof THESPORTSDB_SPORTS)[number]['id'];

export type SportCategory =
  | 'football'
  | 'basketball'
  | 'tennis'
  | 'ufc'
  | 'f1'
  | 'volleyball'
  | 'baseball'
  | 'other';

export interface TheSportsDbRawEvent {
  idEvent?: string;
  strEvent?: string;
  strSport?: string;
  idLeague?: string;
  strLeague?: string;
  strLeagueBadge?: string;
  strHomeTeam?: string | null;
  strAwayTeam?: string | null;
  strHomeTeamBadge?: string | null;
  strAwayTeamBadge?: string | null;
  intHomeScore?: string | number | null;
  intAwayScore?: string | number | null;
  dateEvent?: string;
  strTime?: string;
  strTimestamp?: string;
  strStatus?: string;
  strThumb?: string | null;
  strVenue?: string | null;
  intRound?: string | number | null;
  strRound?: string | null;
  strSeason?: string | null;
  strGroup?: string | null;
}

export interface TheSportsDbRawLeague {
  idLeague?: string;
  strLeague?: string;
  strSport?: string;
  strLeagueAlternate?: string | null;
  strBadge?: string | null;
  strCountry?: string | null;
  strCurrentSeason?: string | null;
}

export interface CalendarEvent {
  id: string;
  externalId: string;
  title: string;
  sport: string;
  sportCategory: SportCategory;
  leagueId: string;
  league: string;
  leagueBadge: string | null;
  homeTeam: string | null;
  awayTeam: string | null;
  homeBadge: string | null;
  awayBadge: string | null;
  homeScore: number | null;
  awayScore: number | null;
  date: string;
  time: string | null;
  timestamp: string | null;
  status: 'upcoming' | 'live' | 'finished' | 'cancelled';
  matchTime: string;
  thumbnail: string | null;
  venue: string | null;
  round: string | null;
  season: string | null;
}

export interface CalendarLeague {
  id: string;
  name: string;
  sport: string;
  badge: string | null;
  country: string | null;
  currentSeason: string | null;
}

export interface TheSportsDbRawTeam {
  idTeam?: string;
  strTeam?: string;
  strTeamShort?: string | null;
  strSport?: string;
  strLeague?: string;
  idLeague?: string;
  strCountry?: string | null;
  strBadge?: string | null;
  strStadium?: string | null;
  strLocation?: string | null;
  intFormedYear?: string | null;
}

export interface SearchTeamResult {
  id: string;
  name: string;
  shortName: string | null;
  sport: string;
  league: string;
  leagueId: string;
  country: string | null;
  badge: string | null;
  stadium: string | null;
  location: string | null;
  formedYear: string | null;
}

type CacheEntry<T> = { data: T; expiresAt: number };
const cache = new Map<string, CacheEntry<unknown>>();

function getApiKey() {
  const key = process.env.THESPORTSDB_API_KEY?.trim();
  if (!key || key === 'your-thesportsdb-api-key') return DEFAULT_FREE_KEY;
  return key;
}

function cacheGet<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function cacheSet<T>(key: string, data: T) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

function isMissingApiKey() {
  const key = process.env.THESPORTSDB_API_KEY?.trim();
  return !key || key === 'your-thesportsdb-api-key';
}

function parseScore(value?: string | number | null): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function mapSportCategory(strSport?: string): SportCategory {
  const sport = (strSport || '').toLowerCase();
  if (sport === 'soccer') return 'football';
  if (sport === 'basketball') return 'basketball';
  if (sport === 'tennis') return 'tennis';
  if (sport === 'fighting') return 'ufc';
  if (sport === 'motorsport') return 'f1';
  if (sport === 'volleyball') return 'volleyball';
  if (sport === 'baseball') return 'baseball';
  return 'other';
}

export function mapEventStatus(strStatus?: string): CalendarEvent['status'] {
  const status = (strStatus || '').toLowerCase();
  if (['in play', 'live', '1h', '2h', 'ht', 'et', 'pen'].some((s) => status.includes(s))) return 'live';
  if (['finished', 'match finished', 'ft', 'aet'].some((s) => status.includes(s))) return 'finished';
  if (['postponed', 'cancelled', 'canceled', 'abandoned'].some((s) => status.includes(s))) return 'cancelled';
  return 'upcoming';
}

function buildTimestamp(date?: string, time?: string, fallback?: string): string | null {
  if (fallback) {
    const parsed = new Date(fallback);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  if (!date) return null;
  const safeTime = time && time !== '00:00:00' ? time : '12:00:00';
  const parsed = new Date(`${date}T${safeTime}Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

export function mapTheSportsDbEvent(raw: TheSportsDbRawEvent): CalendarEvent | null {
  if (!raw.idEvent) return null;

  const homeTeam = raw.strHomeTeam || null;
  const awayTeam = raw.strAwayTeam || null;
  const title =
    raw.strEvent ||
    (homeTeam && awayTeam ? `${homeTeam} vs ${awayTeam}` : homeTeam || awayTeam || 'Evento desportivo');
  const status = mapEventStatus(raw.strStatus);
  const round = raw.strRound || (raw.intRound != null ? String(raw.intRound) : null);
  const matchTime =
    status === 'live'
      ? raw.strStatus || 'Ao vivo'
      : round
        ? `Jornada ${round}`
        : raw.strTime?.slice(0, 5) || 'Agendado';

  return {
    id: `thesportsdb-${raw.idEvent}`,
    externalId: raw.idEvent,
    title,
    sport: raw.strSport || 'Other',
    sportCategory: mapSportCategory(raw.strSport),
    leagueId: raw.idLeague || '',
    league: raw.strLeague || 'Sem liga',
    leagueBadge: raw.strLeagueBadge || null,
    homeTeam,
    awayTeam,
    homeBadge: raw.strHomeTeamBadge || null,
    awayBadge: raw.strAwayTeamBadge || null,
    homeScore: parseScore(raw.intHomeScore),
    awayScore: parseScore(raw.intAwayScore),
    date: raw.dateEvent || '',
    time: raw.strTime || null,
    timestamp: buildTimestamp(raw.dateEvent, raw.strTime, raw.strTimestamp),
    status,
    matchTime,
    thumbnail: raw.strThumb || null,
    venue: raw.strVenue || null,
    round,
    season: raw.strSeason || null,
  };
}

function mapLeague(raw: TheSportsDbRawLeague): CalendarLeague | null {
  if (!raw.idLeague || !raw.strLeague) return null;
  return {
    id: raw.idLeague,
    name: raw.strLeague,
    sport: raw.strSport || '',
    badge: raw.strBadge || null,
    country: raw.strCountry || null,
    currentSeason: raw.strCurrentSeason || null,
  };
}

function mapTeam(raw: TheSportsDbRawTeam): SearchTeamResult | null {
  if (!raw.idTeam || !raw.strTeam) return null;
  return {
    id: raw.idTeam,
    name: raw.strTeam,
    shortName: raw.strTeamShort || null,
    sport: raw.strSport || '',
    league: raw.strLeague || '',
    leagueId: raw.idLeague || '',
    country: raw.strCountry || null,
    badge: raw.strBadge || null,
    stadium: raw.strStadium || null,
    location: raw.strLocation || null,
    formedYear: raw.intFormedYear || null,
  };
}

async function fetchV1<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const cacheKey = `${endpoint}:${JSON.stringify(params)}`;
  const cached = cacheGet<T>(cacheKey);
  if (cached) return cached;

  const response = await axios.get<T>(`${BASE_URL}/${getApiKey()}/${endpoint}`, {
    params,
    timeout: 20000,
  });

  cacheSet(cacheKey, response.data);
  return response.data;
}

export async function fetchEventsByDay(options: {
  date: string;
  sport?: string;
  leagueId?: string;
}): Promise<CalendarEvent[]> {
  const params: Record<string, string> = { d: options.date };
  if (options.sport) params.s = options.sport;
  if (options.leagueId) params.l = options.leagueId;

  const payload = await fetchV1<{ events?: TheSportsDbRawEvent[] | null }>('eventsday.php', params);
  const events = payload.events || [];
  return events.map(mapTheSportsDbEvent).filter(Boolean) as CalendarEvent[];
}

export async function fetchLeagueSeasonEvents(options: {
  leagueId: string;
  season: string;
}): Promise<CalendarEvent[]> {
  const payload = await fetchV1<{ events?: TheSportsDbRawEvent[] | null }>('eventsseason.php', {
    id: options.leagueId,
    s: options.season,
  });
  const events = payload.events || [];
  return events.map(mapTheSportsDbEvent).filter(Boolean) as CalendarEvent[];
}

export async function fetchLeaguesBySport(sport?: string): Promise<CalendarLeague[]> {
  const payload = await fetchV1<{ leagues?: TheSportsDbRawLeague[] | null }>('all_leagues.php');
  const leagues = payload.leagues || [];

  const mapped = leagues.map(mapLeague).filter(Boolean) as CalendarLeague[];
  if (!sport) return mapped.slice(0, 200);

  return mapped.filter((league) => league.sport.toLowerCase() === sport.toLowerCase()).slice(0, 200);
}

export async function searchTeams(query: string): Promise<SearchTeamResult[]> {
  const term = query.trim();
  if (term.length < 2) return [];

  const payload = await fetchV1<{ teams?: TheSportsDbRawTeam[] | null }>('searchteams.php', { t: term });
  const teams = payload.teams || [];
  return teams.map(mapTeam).filter(Boolean) as SearchTeamResult[];
}

export const DEV_SEARCH_TEAMS: SearchTeamResult[] = [
  {
    id: '133604',
    name: 'Arsenal',
    shortName: 'ARS',
    sport: 'Soccer',
    league: 'English Premier League',
    leagueId: '4328',
    country: 'England',
    badge: 'https://r2.thesportsdb.com/images/media/team/badge/uyhbfe1612467038.png',
    stadium: 'Emirates Stadium',
    location: 'London, England',
    formedYear: '1892',
  },
  {
    id: '133602',
    name: 'Chelsea',
    shortName: 'CHE',
    sport: 'Soccer',
    league: 'English Premier League',
    leagueId: '4328',
    country: 'England',
    badge: null,
    stadium: 'Stamford Bridge',
    location: 'London, England',
    formedYear: '1905',
  },
];

export const DEV_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'thesportsdb-dev-001',
    externalId: 'dev-001',
    title: 'Brasil vs Argentina',
    sport: 'Soccer',
    sportCategory: 'football',
    leagueId: '4429',
    league: 'FIFA World Cup',
    leagueBadge: 'https://r2.thesportsdb.com/images/media/league/badge/8dqv9l1709198064.png',
    homeTeam: 'Brasil',
    awayTeam: 'Argentina',
    homeBadge: null,
    awayBadge: null,
    homeScore: null,
    awayScore: null,
    date: '2026-06-20',
    time: '20:00:00',
    timestamp: '2026-06-20T20:00:00.000Z',
    status: 'upcoming',
    matchTime: 'Agendado',
    thumbnail: null,
    venue: 'Estadio Azteca',
    round: '1',
    season: '2026',
  },
  {
    id: 'thesportsdb-dev-002',
    externalId: 'dev-002',
    title: 'Real Madrid vs Barcelona',
    sport: 'Soccer',
    sportCategory: 'football',
    leagueId: '4335',
    league: 'Spanish La Liga',
    leagueBadge: null,
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    homeBadge: null,
    awayBadge: null,
    homeScore: null,
    awayScore: null,
    date: '2026-06-20',
    time: '21:00:00',
    timestamp: '2026-06-20T21:00:00.000Z',
    status: 'upcoming',
    matchTime: 'Agendado',
    thumbnail: null,
    venue: 'Santiago Bernabéu',
    round: '38',
    season: '2025-2026',
  },
  {
    id: 'thesportsdb-dev-003',
    externalId: 'dev-003',
    title: 'Manchester United vs Liverpool',
    sport: 'Soccer',
    sportCategory: 'football',
    leagueId: '4328',
    league: 'English Premier League',
    leagueBadge: null,
    homeTeam: 'Manchester United',
    awayTeam: 'Liverpool',
    homeBadge: null,
    awayBadge: null,
    homeScore: 2,
    awayScore: 1,
    date: '2026-06-20',
    time: '17:30:00',
    timestamp: '2026-06-20T17:30:00.000Z',
    status: 'live',
    matchTime: 'Ao vivo',
    thumbnail: null,
    venue: 'Old Trafford',
    round: '38',
    season: '2025-2026',
  },
];

export function shouldUseDevCalendar() {
  return process.env.ALLOW_DEMO_DATA === 'true' && process.env.THESPORTSDB_USE_DEV === 'true';
}

export { isMissingApiKey, getApiKey };
