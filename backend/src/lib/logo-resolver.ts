import axios from 'axios';

export type LogoEntityKind = 'team' | 'league' | 'channel' | 'country' | 'sport';

export interface LogoLookupResult {
  query: string;
  kind: LogoEntityKind;
  sources: string[];
  cachedAt: string;
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour cache
const lookupCache = new Map<string, { expiresAt: number; sources: string[] }>();

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

const CURATED_MULTI_LOGOS: Record<string, string[]> = {
  // Leagues
  uefachampionsleague: [
    'https://a.espncdn.com/i/leaguelogos/soccer/500/2.png',
    'https://crests.football-data.org/CL.png',
    'https://r2.thesportsdb.com/images/media/league/badge/dtp1931534767233.png',
  ],
  uefaeuropaleague: [
    'https://a.espncdn.com/i/leaguelogos/soccer/500/2310.png',
    'https://r2.thesportsdb.com/images/media/league/badge/mlfe7r1535197953.png',
  ],
  premierleague: [
    'https://a.espncdn.com/i/leaguelogos/soccer/500/23.png',
    'https://crests.football-data.org/PL.png',
    'https://r2.thesportsdb.com/images/media/league/badge/gasy9d1737743125.png',
  ],
  englishpremierleague: [
    'https://a.espncdn.com/i/leaguelogos/soccer/500/23.png',
    'https://crests.football-data.org/PL.png',
  ],
  laliga: [
    'https://a.espncdn.com/i/leaguelogos/soccer/500/15.png',
    'https://crests.football-data.org/PD.png',
  ],
  spanishlaliga: [
    'https://a.espncdn.com/i/leaguelogos/soccer/500/15.png',
    'https://crests.football-data.org/PD.png',
  ],
  seriea: [
    'https://a.espncdn.com/i/leaguelogos/soccer/500/12.png',
    'https://crests.football-data.org/SA.png',
  ],
  bundesliga: [
    'https://a.espncdn.com/i/leaguelogos/soccer/500/10.png',
    'https://crests.football-data.org/BL1.png',
  ],
  ligue1: [
    'https://a.espncdn.com/i/leaguelogos/soccer/500/9.png',
    'https://crests.football-data.org/FL1.png',
  ],
  ligaportugal: [
    'https://a.espncdn.com/i/leaguelogos/soccer/500/14.png',
    'https://crests.football-data.org/PPL.png',
  ],
  primeiraliga: [
    'https://a.espncdn.com/i/leaguelogos/soccer/500/14.png',
    'https://crests.football-data.org/PPL.png',
  ],
  brasileirao: [
    'https://a.espncdn.com/i/leaguelogos/soccer/500/85.png',
    'https://crests.football-data.org/BSA.png',
  ],
  fifaworldcup: [
    'https://a.espncdn.com/i/leaguelogos/soccer/500/4.png',
    'https://r2.thesportsdb.com/images/media/league/badge/8dqv9l1709198064.png',
  ],
  nba: [
    'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png',
    'https://upload.wikimedia.org/wikipedia/en/0/03/National_Basketball_Association_logo.svg',
  ],
  ufc: [
    'https://a.espncdn.com/i/teamlogos/leagues/500/ufc.png',
    'https://upload.wikimedia.org/wikipedia/commons/9/92/UFC_Logo.svg',
  ],
  formula1: [
    'https://a.espncdn.com/i/teamlogos/leagues/500/f1.png',
    'https://upload.wikimedia.org/wikipedia/commons/3/33/F1.svg',
  ],
  f1: [
    'https://a.espncdn.com/i/teamlogos/leagues/500/f1.png',
    'https://upload.wikimedia.org/wikipedia/commons/3/33/F1.svg',
  ],
};

function uniqueUrls(list: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of list) {
    const u = raw?.trim();
    if (!u || seen.has(u)) continue;
    if (!/^https?:\/\/|^data:image\//.test(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
}

async function queryEspnLogos(name: string, kind: LogoEntityKind): Promise<string[]> {
  try {
    const typeParam = kind === 'league' ? 'league' : kind === 'team' ? 'team' : undefined;
    const response = await axios.get('https://site.api.espn.com/apis/common/v3/search', {
      params: {
        query: name,
        limit: 4,
        ...(typeParam ? { type: typeParam } : {}),
      },
      timeout: 5000,
    });

    const items = Array.isArray(response.data?.items) ? response.data.items : [];
    const urls: string[] = [];
    for (const item of items) {
      if (Array.isArray(item?.logos)) {
        for (const l of item.logos) {
          if (typeof l?.href === 'string') {
            urls.push(l.href);
          }
        }
      }
    }
    return urls;
  } catch {
    return [];
  }
}

async function queryTheSportsDbLogos(name: string, kind: LogoEntityKind): Promise<string[]> {
  try {
    if (kind === 'team' || kind === 'channel') {
      const res = await axios.get(
        `https://www.thesportsdb.com/api/v1/json/123/searchteams.php`,
        { params: { t: name }, timeout: 5000 },
      );
      const teams = Array.isArray(res.data?.teams) ? res.data.teams : [];
      const urls: string[] = [];
      for (const t of teams.slice(0, 3)) {
        if (t?.strBadge) urls.push(t.strBadge);
        if (t?.strLogo) urls.push(t.strLogo);
      }
      return urls;
    }
    return [];
  } catch {
    return [];
  }
}

export async function resolveMultiSourceLogos(
  query: string,
  kind: LogoEntityKind = 'team',
): Promise<LogoLookupResult> {
  const clean = query.trim();
  const norm = normalizeKey(clean);
  const cacheKey = `${kind}:${norm}`;
  const now = Date.now();

  const cached = lookupCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return {
      query: clean,
      kind,
      sources: cached.sources,
      cachedAt: new Date(cached.expiresAt - CACHE_TTL_MS).toISOString(),
    };
  }

  const curated = CURATED_MULTI_LOGOS[norm] || [];
  const [espnUrls, sportsDbUrls] = await Promise.all([
    queryEspnLogos(clean, kind),
    queryTheSportsDbLogos(clean, kind),
  ]);

  const sources = uniqueUrls([...curated, ...espnUrls, ...sportsDbUrls]);
  lookupCache.set(cacheKey, {
    expiresAt: now + CACHE_TTL_MS,
    sources,
  });

  return {
    query: clean,
    kind,
    sources,
    cachedAt: new Date(now).toISOString(),
  };
}
