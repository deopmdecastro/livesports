import { publicApiRequest } from '@/lib/api';

export interface SportsCalendarSport {
  id: string;
  label: string;
  slug: string;
}

export interface SportsCalendarLeague {
  id: string;
  name: string;
  sport: string;
  badge: string | null;
  country: string | null;
  currentSeason: string | null;
}

export interface SportsCalendarEvent {
  id: string;
  externalId: string;
  title: string;
  sport: string;
  sportCategory: string;
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

export interface SportsCalendarResponse {
  source: string;
  params: {
    date: string;
    sport: string | null;
    leagueId: string | null;
    season?: string | null;
  };
  count: number;
  events: SportsCalendarEvent[];
  notice?: string;
}

export interface SportsLeaguesResponse {
  source: string;
  sport?: string | null;
  leagues: SportsCalendarLeague[];
}

export interface SportsListResponse {
  sports: SportsCalendarSport[];
}

export interface SportsTeamSearchResult {
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

export interface SportsTeamSearchResponse {
  source: string;
  query: string;
  count: number;
  teams: SportsTeamSearchResult[];
  notice?: string;
}

function buildQuery(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

export async function fetchSportsCalendar(params: {
  date: string;
  sport?: string;
  leagueId?: string;
  season?: string;
}) {
  const query = buildQuery({
    d: params.date,
    s: params.sport,
    l: params.leagueId,
    season: params.season,
  });

  return publicApiRequest<SportsCalendarResponse>(`/integrations/thesportsdb/calendar${query}`, {
    cacheTtl: 60_000,
  });
}

export async function fetchSportsLeagues(sport?: string) {
  const query = buildQuery({ s: sport });
  return publicApiRequest<SportsLeaguesResponse>(`/integrations/thesportsdb/leagues${query}`, {
    cacheTtl: 5 * 60_000,
  });
}

export async function fetchSportsList() {
  return publicApiRequest<SportsListResponse>('/integrations/thesportsdb/sports', {
    cacheTtl: 24 * 60 * 60_000,
  });
}

export async function searchSportsTeams(query: string) {
  const term = query.trim();
  if (term.length < 2) return { source: 'local', query: term, count: 0, teams: [] as SportsTeamSearchResult[] };

  const search = new URLSearchParams({ t: term });
  return publicApiRequest<SportsTeamSearchResponse>(
    `/integrations/thesportsdb/teams/search?${search.toString()}`,
    { cacheTtl: 60_000 },
  );
}

export function formatCalendarDate(date: string, lang: 'pt' | 'en' = 'pt') {
  const parsed = new Date(`${date}T12:00:00`);
  return parsed.toLocaleDateString(lang === 'pt' ? 'pt-PT' : 'en-US', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function formatEventTime(event: SportsCalendarEvent, lang: 'pt' | 'en' = 'pt') {
  if (!event.timestamp) return event.time?.slice(0, 5) || '--:--';
  return new Date(event.timestamp).toLocaleTimeString(lang === 'pt' ? 'pt-PT' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function shiftDate(date: string, days: number) {
  const parsed = new Date(`${date}T12:00:00`);
  parsed.setDate(parsed.getDate() + days);
  return parsed.toISOString().slice(0, 10);
}

export function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}
