/**
 * Sports Data API utility with in-memory caching.
 *
 * Supports multiple data sources:
 * - API-Football (api-football.com / api-sports.io)
 * - Wikipedia / Wikimedia SVG logos
 * - Custom overrides via LOGOS constant
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LeagueInfo {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag: string;
  season?: number;
}

export interface TeamInfo {
  id: number;
  name: string;
  code?: string;
  country: string;
  logo: string;
  national?: boolean;
}

export interface CountryInfo {
  name: string;
  code?: string;
  flag: string;
}

export interface CachedEntry<T> {
  data: T;
  fetchedAt: number;
  ttl: number; // milliseconds
}

// ─── Cache ────────────────────────────────────────────────────────────────────

const _cache = new Map<string, CachedEntry<unknown>>();
const DEFAULT_TTL = 6 * 60 * 60 * 1000; // 6 hours
const SHORT_TTL = 30 * 60 * 1000; // 30 minutes (for live data)

function cacheGet<T>(key: string): T | null {
  const entry = _cache.get(key) as CachedEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > entry.ttl) {
    _cache.delete(key);
    return null;
  }
  return entry.data;
}

function cacheSet<T>(key: string, data: T, ttl = DEFAULT_TTL): void {
  _cache.set(key, { data, fetchedAt: Date.now(), ttl });
}

export function clearCache(): void {
  _cache.clear();
}

export function getCacheStats(): { size: number; keys: string[] } {
  return { size: _cache.size, keys: Array.from(_cache.keys()) };
}

// ─── API-Football client ──────────────────────────────────────────────────────

const API_FOOTBALL_BASE = 'https://v3.football.api-sports.io';
const API_SPORTS_MEDIA = 'https://media.api-sports.io';

function getApiKey(): string | null {
  if (typeof window !== 'undefined') {
    // Client-side: use public env var
    return process.env.NEXT_PUBLIC_API_FOOTBALL_KEY || null;
  }
  // Server-side
  return process.env.API_FOOTBALL_KEY || process.env.NEXT_PUBLIC_API_FOOTBALL_KEY || null;
}

async function apiFetch<T>(path: string, ttl = DEFAULT_TTL): Promise<T | null> {
  const key = `api_football:${path}`;
  const cached = cacheGet<T>(key);
  if (cached) return cached;

  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('[SportsAPI] No API key configured — skipping fetch:', path);
    return null;
  }

  try {
    const res = await fetch(`${API_FOOTBALL_BASE}${path}`, {
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      },
      next: { revalidate: Math.floor(ttl / 1000) },
    });

    if (!res.ok) {
      console.warn('[SportsAPI] HTTP error', res.status, path);
      return null;
    }

    const json = await res.json();
    if (json.errors && Object.keys(json.errors).length > 0) {
      console.warn('[SportsAPI] API error', json.errors);
      return null;
    }

    const data = json.response as T;
    cacheSet(key, data, ttl);
    return data;
  } catch (err) {
    console.error('[SportsAPI] Fetch failed:', err);
    return null;
  }
}

// ─── League helpers ───────────────────────────────────────────────────────────

export async function fetchLeague(id: number): Promise<LeagueInfo | null> {
  const key = `league:${id}`;
  const cached = cacheGet<LeagueInfo>(key);
  if (cached) return cached;

  const results = await apiFetch<any[]>(`/leagues?id=${id}`);
  if (!results || results.length === 0) return null;

  const item = results[0];
  const info: LeagueInfo = {
    id: item.league.id,
    name: item.league.name,
    country: item.country.name,
    logo: item.league.logo,
    flag: item.country.flag || '',
    season: item.seasons?.[item.seasons.length - 1]?.year,
  };

  cacheSet(key, info);
  return info;
}

export function getLeagueLogoUrl(id: number): string {
  return `${API_SPORTS_MEDIA}/leagues/${id}.png`;
}

// ─── Team helpers ─────────────────────────────────────────────────────────────

export async function fetchTeam(id: number): Promise<TeamInfo | null> {
  const key = `team:${id}`;
  const cached = cacheGet<TeamInfo>(key);
  if (cached) return cached;

  const results = await apiFetch<any[]>(`/teams?id=${id}`);
  if (!results || results.length === 0) return null;

  const item = results[0];
  const info: TeamInfo = {
    id: item.team.id,
    name: item.team.name,
    code: item.team.code,
    country: item.team.country,
    logo: item.team.logo,
    national: item.team.national,
  };

  cacheSet(key, info);
  return info;
}

export function getTeamLogoUrl(id: number): string {
  return `${API_SPORTS_MEDIA}/teams/${id}.png`;
}

// ─── Country / Flag helpers ───────────────────────────────────────────────────

// ISO 3166-1 alpha-2 code → flag emoji + Wikipedia URL
const FLAG_EMOJIS: Record<string, string> = {
  BR: '🇧🇷', PT: '🇵🇹', ES: '🇪🇸', DE: '🇩🇪', FR: '🇫🇷',
  IT: '🇮🇹', GB: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', US: '🇺🇸', AR: '🇦🇷', MX: '🇲🇽',
  NL: '🇳🇱', BE: '🇧🇪', HR: '🇭🇷', MA: '🇲🇦', JP: '🇯🇵',
  KR: '🇰🇷', AU: '🇦🇺', CA: '🇨🇦', TR: '🇹🇷', PL: '🇵🇱',
  CH: '🇨🇭', AT: '🇦🇹', DK: '🇩🇰', SE: '🇸🇪', NO: '🇳🇴',
  UA: '🇺🇦', RS: '🇷🇸', CZ: '🇨🇿', GR: '🇬🇷', RO: '🇷🇴',
  HU: '🇭🇺', SK: '🇸🇰', SI: '🇸🇮', EG: '🇪🇬', NG: '🇳🇬',
  SN: '🇸🇳', GH: '🇬🇭', CI: '🇨🇮', CM: '🇨🇲', ZA: '🇿🇦',
  SA: '🇸🇦', IR: '🇮🇷', KW: '🇰🇼', QA: '🇶🇦', UY: '🇺🇾',
  CO: '🇨🇴', CL: '🇨🇱', PE: '🇵🇪', EC: '🇪🇨', VE: '🇻🇪',
};

export function getFlagEmoji(isoCode: string): string {
  return FLAG_EMOJIS[isoCode.toUpperCase()] || '🏳️';
}

export function getFlagImageUrl(isoCode: string, style: "flat" | "shiny" = "shiny", size = 64): string {
  const code = isoCode.trim().toUpperCase();
  return `https://flagsapi.com/${code}/${style}/${size}.png`;
}

// ─── Known logo overrides (Wikipedia SVG CDN) ─────────────────────────────────

export const KNOWN_LOGOS: Record<string, string> = {
  // Clubs
  'Manchester United': 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg',
  'Liverpool': 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
  'Real Madrid': 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
  'Barcelona': 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
  'PSG': 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg',
  'Flamengo': 'https://upload.wikimedia.org/wikipedia/commons/2/2b/Flamengo_braz_logo.svg',
  'Palmeiras': 'https://upload.wikimedia.org/wikipedia/commons/1/10/Palmeiras_logo.svg',
  'Chelsea': 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg',
  'Arsenal': 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
  'Manchester City': 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
  'Bayern Munich': 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282002%E2%80%932017%29.svg',
  'Juventus': 'https://upload.wikimedia.org/wikipedia/commons/1/15/Juventus_FC_2017_icon_%28black%29.svg',
  'AC Milan': 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg',
  'Inter Milan': 'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg',
  'Atletico Madrid': 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_de_madrid_crest.svg',
  'Borussia Dortmund': 'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg',
  'Ajax': 'https://upload.wikimedia.org/wikipedia/en/7/79/Ajax_Amsterdam.svg',
  'Porto': 'https://upload.wikimedia.org/wikipedia/en/f/f4/FC_Porto.svg',
  'Benfica': 'https://upload.wikimedia.org/wikipedia/en/f/f5/SL_Benfica_logo.svg',
  'Sporting CP': 'https://upload.wikimedia.org/wikipedia/en/0/0a/Sporting_CP_logo.svg',
  // Leagues
  'Premier League': 'https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg',
  'La Liga': 'https://upload.wikimedia.org/wikipedia/commons/1/13/LaLiga.svg',
  'Bundesliga': 'https://upload.wikimedia.org/wikipedia/en/d/df/Bundesliga_logo_%282017%29.svg',
  'Serie A': 'https://upload.wikimedia.org/wikipedia/en/e/e1/Serie_A_logo_%282019%29.svg',
  'Ligue 1': 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Ligue_1_Uber_Eats.svg',
  'Brasileirao': 'https://upload.wikimedia.org/wikipedia/commons/0/01/Logo_Campeonato_Brasileiro_Serie_A.svg',
  'Champions League': 'https://upload.wikimedia.org/wikipedia/en/b/bf/UEFA_Champions_League_logo_2.svg',
  'Copa do Mundo': 'https://upload.wikimedia.org/wikipedia/en/e/e3/2022_FIFA_World_Cup.svg',
  'NBA': 'https://upload.wikimedia.org/wikipedia/en/0/03/National_Basketball_Association_logo.svg',
  'NFL': 'https://upload.wikimedia.org/wikipedia/en/a/a2/NFL_logo_and_wordmark.svg',
};

/**
 * Resolve logo URL: tries known overrides first, then API-Football CDN, then fallback.
 */
export function resolveLogoUrl(
  name?: string,
  apiId?: number,
  type: 'teams' | 'leagues' = 'teams',
): string {
  if (name && KNOWN_LOGOS[name]) return KNOWN_LOGOS[name];
  if (apiId) {
    return type === 'leagues' ? getLeagueLogoUrl(apiId) : getTeamLogoUrl(apiId);
  }
  return type === 'leagues'
    ? '/images/fallback/league.svg'
    : '/images/fallback/shield.svg';
}

// ─── World Cup 2026 data ───────────────────────────────────────────────────────

export const WC2026_HOSTS = [
  { country: 'United States', iso: 'US', stadiums: 11 },
  { country: 'Mexico', iso: 'MX', stadiums: 3 },
  { country: 'Canada', iso: 'CA', stadiums: 2 },
];

export const WC2026_STATS = {
  teams: 48,
  matches: 104,
  groups: 12,
  hosts: 3,
  stadiums: 16,
  startDate: '2026-06-11',
  finalDate: '2026-07-19',
  finalVenue: 'MetLife Stadium, New Jersey, USA',
};
