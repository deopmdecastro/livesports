import {
  countryCodeFromName,
  extractCountryCodeFromLogo,
  flagsApiUrl,
  normalizeCountryCode,
} from "@/lib/flags";

export type LogoKind = "team" | "league" | "channel" | "country" | "sport";

export interface ResolveLogoSourcesInput {
  /** Primary logo URL stored in database or API response */
  primaryUrl?: string | null;
  /** Optional explicit backup URLs */
  backupUrls?: Array<string | null | undefined>;
  /** Entity display name (team, league, TV channel, country, etc.) */
  name?: string | null;
  /** Optional 2/3-letter country or team code (e.g. "POR", "PT", "BRA") */
  code?: string | null;
  /** Type of entity to tailor fallback order */
  kind?: LogoKind;
  /** Target pixel size hint */
  size?: number;
}

function normalizeLookupKey(value?: string | null): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function isValidImageUrl(url?: string | null): url is string {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed.includes("/images/fallback/")) return false;
  return /^(https?:\/\/|data:image\/|blob:|\/)/.test(trimmed);
}

/**
 * Curated multi-CDN mirrors for popular leagues, teams, and 24/7 sports TV channels.
 * Every entry provides 2–3 distinct independent hosts so if one CDN is blocked,
 * rate-limited, or offline, the next source loads seamlessly.
 */
const LEAGUE_LOGO_MIRRORS: Record<string, string[]> = {
  uefachampionsleague: [
    "https://a.espncdn.com/i/leaguelogos/soccer/500/2.png",
    "https://crests.football-data.org/CL.png",
    "https://r2.thesportsdb.com/images/media/league/badge/dtp1931534767233.png",
  ],
  championsleague: [
    "https://a.espncdn.com/i/leaguelogos/soccer/500/2.png",
    "https://crests.football-data.org/CL.png",
  ],
  uefaeuropaleague: [
    "https://a.espncdn.com/i/leaguelogos/soccer/500/2310.png",
    "https://r2.thesportsdb.com/images/media/league/badge/mlfe7r1535197953.png",
  ],
  europaleague: [
    "https://a.espncdn.com/i/leaguelogos/soccer/500/2310.png",
    "https://r2.thesportsdb.com/images/media/league/badge/mlfe7r1535197953.png",
  ],
  premierleague: [
    "https://a.espncdn.com/i/leaguelogos/soccer/500/23.png",
    "https://crests.football-data.org/PL.png",
    "https://r2.thesportsdb.com/images/media/league/badge/gasy9d1737743125.png",
  ],
  englishpremierleague: [
    "https://a.espncdn.com/i/leaguelogos/soccer/500/23.png",
    "https://crests.football-data.org/PL.png",
  ],
  laliga: [
    "https://a.espncdn.com/i/leaguelogos/soccer/500/15.png",
    "https://crests.football-data.org/PD.png",
  ],
  spanishlaliga: [
    "https://a.espncdn.com/i/leaguelogos/soccer/500/15.png",
    "https://crests.football-data.org/PD.png",
  ],
  seriea: [
    "https://a.espncdn.com/i/leaguelogos/soccer/500/12.png",
    "https://crests.football-data.org/SA.png",
  ],
  italianseriea: [
    "https://a.espncdn.com/i/leaguelogos/soccer/500/12.png",
    "https://crests.football-data.org/SA.png",
  ],
  bundesliga: [
    "https://a.espncdn.com/i/leaguelogos/soccer/500/10.png",
    "https://crests.football-data.org/BL1.png",
  ],
  germanbundesliga: [
    "https://a.espncdn.com/i/leaguelogos/soccer/500/10.png",
    "https://crests.football-data.org/BL1.png",
  ],
  ligue1: [
    "https://a.espncdn.com/i/leaguelogos/soccer/500/9.png",
    "https://crests.football-data.org/FL1.png",
  ],
  frenchligue1: [
    "https://a.espncdn.com/i/leaguelogos/soccer/500/9.png",
    "https://crests.football-data.org/FL1.png",
  ],
  ligaportugal: [
    "https://a.espncdn.com/i/leaguelogos/soccer/500/14.png",
    "https://crests.football-data.org/PPL.png",
  ],
  ligaportugalbetclic: [
    "https://a.espncdn.com/i/leaguelogos/soccer/500/14.png",
    "https://crests.football-data.org/PPL.png",
  ],
  portugueseprimeiraliga: [
    "https://a.espncdn.com/i/leaguelogos/soccer/500/14.png",
    "https://crests.football-data.org/PPL.png",
  ],
  brasileirao: [
    "https://a.espncdn.com/i/leaguelogos/soccer/500/85.png",
    "https://crests.football-data.org/BSA.png",
  ],
  brasileiraoseriea: [
    "https://a.espncdn.com/i/leaguelogos/soccer/500/85.png",
    "https://crests.football-data.org/BSA.png",
  ],
  campeonatobrasileiroseriea: [
    "https://a.espncdn.com/i/leaguelogos/soccer/500/85.png",
    "https://crests.football-data.org/BSA.png",
  ],
  fifaworldcup: [
    "https://a.espncdn.com/i/leaguelogos/soccer/500/4.png",
    "https://r2.thesportsdb.com/images/media/league/badge/8dqv9l1709198064.png",
  ],
  copadomundo: [
    "https://a.espncdn.com/i/leaguelogos/soccer/500/4.png",
    "https://r2.thesportsdb.com/images/media/league/badge/8dqv9l1709198064.png",
  ],
  copalibertadores: [
    "https://a.espncdn.com/i/leaguelogos/soccer/500/13.png",
    "https://crests.football-data.org/CLI.png",
  ],
  nba: [
    "https://a.espncdn.com/i/teamlogos/leagues/500/nba.png",
    "https://upload.wikimedia.org/wikipedia/en/0/03/National_Basketball_Association_logo.svg",
  ],
  ufc: [
    "https://a.espncdn.com/i/teamlogos/leagues/500/ufc.png",
    "https://upload.wikimedia.org/wikipedia/commons/9/92/UFC_Logo.svg",
  ],
  formula1: [
    "https://a.espncdn.com/i/teamlogos/leagues/500/f1.png",
    "https://upload.wikimedia.org/wikipedia/commons/3/33/F1.svg",
  ],
  f1: [
    "https://a.espncdn.com/i/teamlogos/leagues/500/f1.png",
    "https://upload.wikimedia.org/wikipedia/commons/3/33/F1.svg",
  ],
  atptour: [
    "https://a.espncdn.com/i/leaguelogos/tennis/500/atp.png",
  ],
};

const TEAM_LOGO_MIRRORS: Record<string, string[]> = {
  benfica: [
    "https://a.espncdn.com/i/teamlogos/soccer/500/1929.png",
    "https://crests.football-data.org/1903.png",
    "https://r2.thesportsdb.com/images/media/team/badge/s5kxf01794325225.png",
  ],
  slbenfica: [
    "https://a.espncdn.com/i/teamlogos/soccer/500/1929.png",
    "https://crests.football-data.org/1903.png",
  ],
  sporting: [
    "https://a.espncdn.com/i/teamlogos/soccer/500/2250.png",
    "https://crests.football-data.org/498.png",
  ],
  sportingcp: [
    "https://a.espncdn.com/i/teamlogos/soccer/500/2250.png",
    "https://crests.football-data.org/498.png",
  ],
  fcporto: [
    "https://a.espncdn.com/i/teamlogos/soccer/500/437.png",
    "https://crests.football-data.org/503.png",
  ],
  porto: [
    "https://a.espncdn.com/i/teamlogos/soccer/500/437.png",
    "https://crests.football-data.org/503.png",
  ],
  scbraga: [
    "https://a.espncdn.com/i/teamlogos/soccer/500/2994.png",
    "https://crests.football-data.org/5613.png",
  ],
  realmadrid: [
    "https://a.espncdn.com/i/teamlogos/soccer/500/86.png",
    "https://crests.football-data.org/86.png",
  ],
  barcelona: [
    "https://a.espncdn.com/i/teamlogos/soccer/500/83.png",
    "https://crests.football-data.org/81.png",
  ],
  fcbarcelona: [
    "https://a.espncdn.com/i/teamlogos/soccer/500/83.png",
    "https://crests.football-data.org/81.png",
  ],
  atleticomadrid: [
    "https://a.espncdn.com/i/teamlogos/soccer/500/1068.png",
    "https://crests.football-data.org/78.png",
  ],
  manchestercity: [
    "https://a.espncdn.com/i/teamlogos/soccer/500/382.png",
    "https://crests.football-data.org/65.png",
  ],
  manchesterunited: [
    "https://a.espncdn.com/i/teamlogos/soccer/500/360.png",
    "https://crests.football-data.org/66.png",
  ],
  liverpool: [
    "https://a.espncdn.com/i/teamlogos/soccer/500/364.png",
    "https://crests.football-data.org/64.png",
  ],
  arsenal: [
    "https://a.espncdn.com/i/teamlogos/soccer/500/359.png",
    "https://crests.football-data.org/57.png",
  ],
  chelsea: [
    "https://a.espncdn.com/i/teamlogos/soccer/500/363.png",
    "https://crests.football-data.org/61.png",
  ],
  bayernmunich: [
    "https://a.espncdn.com/i/teamlogos/soccer/500/132.png",
    "https://crests.football-data.org/5.png",
  ],
  fcbayernmunchen: [
    "https://a.espncdn.com/i/teamlogos/soccer/500/132.png",
    "https://crests.football-data.org/5.png",
  ],
  borussiadortmund: [
    "https://a.espncdn.com/i/teamlogos/soccer/500/124.png",
    "https://crests.football-data.org/4.png",
  ],
  parissaintgermain: [
    "https://a.espncdn.com/i/teamlogos/soccer/500/160.png",
    "https://crests.football-data.org/524.png",
  ],
  psg: [
    "https://a.espncdn.com/i/teamlogos/soccer/500/160.png",
    "https://crests.football-data.org/524.png",
  ],
  intermilan: [
    "https://a.espncdn.com/i/teamlogos/soccer/500/110.png",
    "https://crests.football-data.org/108.png",
  ],
  internazionale: [
    "https://a.espncdn.com/i/teamlogos/soccer/500/110.png",
    "https://crests.football-data.org/108.png",
  ],
  acmilan: [
    "https://a.espncdn.com/i/teamlogos/soccer/500/103.png",
    "https://crests.football-data.org/98.png",
  ],
  juventus: [
    "https://a.espncdn.com/i/teamlogos/soccer/500/111.png",
    "https://crests.football-data.org/109.png",
  ],
  flamengo: [
    "https://a.espncdn.com/i/teamlogos/soccer/500/819.png",
    "https://crests.football-data.org/1783.png",
  ],
  palmeiras: [
    "https://a.espncdn.com/i/teamlogos/soccer/500/2029.png",
    "https://crests.football-data.org/1769.png",
  ],
  corinthians: [
    "https://a.espncdn.com/i/teamlogos/soccer/500/874.png",
    "https://crests.football-data.org/1779.png",
  ],
  saopaulo: [
    "https://a.espncdn.com/i/teamlogos/soccer/500/2026.png",
    "https://crests.football-data.org/1776.png",
  ],
};

const CHANNEL_LOGO_MIRRORS: Record<string, string[]> = {
  fifaplusportugaltv: [
    "https://a.espncdn.com/i/leaguelogos/soccer/500/4.png",
    "https://r2.thesportsdb.com/images/media/league/badge/8dqv9l1709198064.png",
  ],
  fifaplusglobalhd: [
    "https://a.espncdn.com/i/leaguelogos/soccer/500/4.png",
    "https://r2.thesportsdb.com/images/media/league/badge/8dqv9l1709198064.png",
  ],
  fifaplusfutebolfeminino: [
    "https://i.imgur.com/xy9ZxVO.png",
    "https://a.espncdn.com/i/leaguelogos/soccer/500/4.png",
  ],
  beinsportsxtrahd: [
    "https://i.imgur.com/V562tpO.png",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/BeIN_Sports_logo_%28vertical_version%29.svg/500px-BeIN_Sports_logo_%28vertical_version%29.svg.png",
  ],
  intertvofficial: [
    "https://a.espncdn.com/i/teamlogos/soccer/500/110.png",
    "https://i.imgur.com/FUTqh2L.png",
    "https://crests.football-data.org/108.png",
  ],
  laziostylechannelhd: [
    "https://a.espncdn.com/i/teamlogos/soccer/500/112.png",
    "https://i.imgur.com/vDB8HFq.png",
    "https://crests.football-data.org/110.png",
  ],
  redbulltvmotorsport: [
    "https://a.espncdn.com/i/teamlogos/leagues/500/f1.png",
    "https://i.imgur.com/a9ZtP17.png",
  ],
  espn8theocho: [
    "https://a.espncdn.com/i/teamlogos/leagues/500/nba.png",
    "https://i.imgur.com/00tsvjE.png",
  ],
  espn8theochohd: [
    "https://a.espncdn.com/i/teamlogos/leagues/500/nba.png",
    "https://i.imgur.com/00tsvjE.png",
  ],
  accdigitalnetwork: [
    "https://i.imgur.com/V6Kaqha.png",
    "https://a.espncdn.com/i/teamlogos/leagues/500/nba.png",
  ],
  accbasketballnetwork: [
    "https://i.imgur.com/V6Kaqha.png",
    "https://a.espncdn.com/i/teamlogos/leagues/500/nba.png",
  ],
  glorykickboxinghd: [
    "https://i.imgur.com/tS7Ub7i.png",
    "https://a.espncdn.com/i/teamlogos/leagues/500/ufc.png",
  ],
};

/**
 * Derives automatic CDN sibling URLs from a known primary URL:
 * - ESPN `500/{id}.png` <-> `500-dark/{id}.png` & `a.espncdn.com` <-> `s.espncdn.com`
 * - TheSportsDB `r2.thesportsdb.com` <-> `www.thesportsdb.com` (and `/tiny` preview)
 * - Flags `flagsapi.com/{ISO}/shiny/64.png` <-> `flagcdn.com/w80/{iso}.png`
 */
export function deriveMirrorUrlsFromUrl(url: string): string[] {
  const mirrors: string[] = [];

  if (url.includes("a.espncdn.com/")) {
    if (url.includes("/500/")) {
      mirrors.push(url.replace("/500/", "/500-dark/"));
    } else if (url.includes("/500-dark/")) {
      mirrors.push(url.replace("/500-dark/", "/500/"));
    }
    mirrors.push(url.replace("https://a.espncdn.com/", "https://s.espncdn.com/"));
  }

  if (url.includes("r2.thesportsdb.com/")) {
    mirrors.push(url.replace("https://r2.thesportsdb.com/", "https://www.thesportsdb.com/"));
  } else if (url.includes("www.thesportsdb.com/")) {
    mirrors.push(url.replace("https://www.thesportsdb.com/", "https://r2.thesportsdb.com/"));
  }

  const flagMatch = url.match(/flagsapi\.com\/([A-Za-z]{2})\//);
  if (flagMatch) {
    const isoLower = flagMatch[1].toLowerCase();
    mirrors.push(`https://flagcdn.com/w80/${isoLower}.png`);
    mirrors.push(`https://flagcdn.com/${isoLower}.svg`);
  }

  // Independent CDN image proxy mirror (wsrv.nl) for any HTTP(S) source so
  // hotlink blocks, TLS quirks, or rate-limits on the origin host have an automatic backup.
  if (
    /^https?:\/\//.test(url) &&
    !url.includes("wsrv.nl") &&
    !url.includes("localhost") &&
    !url.includes("127.0.0.1")
  ) {
    mirrors.push(`https://wsrv.nl/?url=${encodeURIComponent(url)}&w=128&output=png`);
  }

  return mirrors;
}

/**
 * Generates a crisp inline SVG badge Data URI as the guaranteed final fallback
 * so no broken image icon (`<img>` error state) can ever appear on screen.
 */
export function generateVectorMonogramDataUri(
  name?: string | null,
  kind: LogoKind = "team",
): string {
  const clean = (name || "LS").trim();
  const words = clean.split(/[\s·\-_/]+/).filter(Boolean);
  const initials =
    words.length >= 2
      ? `${words[0][0]}${words[1][0]}`.toUpperCase()
      : clean.slice(0, 2).toUpperCase() || "LS";

  // Deterministic palette based on name hash
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 31 + clean.charCodeAt(i)) >>> 0;
  }

  const palettes: Array<[string, string, string]> = [
    ["#E50914", "#7F050B", "#FF858D"],
    ["#0EA5E9", "#0369A1", "#7DD3FC"],
    ["#10B981", "#047857", "#6EE7B7"],
    ["#F59E0B", "#B45309", "#FCD34D"],
    ["#8B5CF6", "#5B21B6", "#C4B5FD"],
    ["#EC4899", "#9D174D", "#F9A8D4"],
  ];
  const [c1, c2, stroke] = palettes[hash % palettes.length];
  const rx = kind === "channel" || kind === "league" ? 20 : 48;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c2}"/>
      </linearGradient>
    </defs>
    <rect x="3" y="3" width="90" height="90" rx="${rx}" fill="url(#g)" stroke="${stroke}" stroke-opacity="0.45" stroke-width="3"/>
    <text x="48" y="57" text-anchor="middle" fill="#FFFFFF" font-family="system-ui,-apple-system,sans-serif" font-size="32" font-weight="900" letter-spacing="1">${initials.replace(/[<>&"']/g, "")}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Core function requested: builds an ordered, deduplicated chain of multiple
 * independent logo URLs (Primary -> Explicit Backups -> CDN Mirrors -> Curated
 * Multi-Provider Registry -> Country Flag CDNs -> Guaranteed Vector SVG Fallback).
 */
export function resolveMultiSourceLogos(input: ResolveLogoSourcesInput): string[] {
  const {
    primaryUrl,
    backupUrls = [],
    name,
    code,
    kind = "team",
    size = 64,
  } = input;

  const candidates: string[] = [];
  const pushUrl = (u?: string | null) => {
    if (!isValidImageUrl(u)) return;
    const trimmed = u.trim();
    if (!candidates.includes(trimmed)) {
      candidates.push(trimmed);
    }
  };

  // 1. Primary URL + automatic CDN mirrors derived from it
  if (isValidImageUrl(primaryUrl)) {
    pushUrl(primaryUrl);
    for (const m of deriveMirrorUrlsFromUrl(primaryUrl)) {
      pushUrl(m);
    }
  }

  // 2. Explicit backup URLs + their CDN mirrors
  for (const b of backupUrls) {
    if (isValidImageUrl(b)) {
      pushUrl(b);
      for (const m of deriveMirrorUrlsFromUrl(b)) {
        pushUrl(m);
      }
    }
  }

  // 3. Curated multi-provider lookup by normalized entity name
  const key = normalizeLookupKey(name);
  if (key) {
    if (kind === "channel") {
      (CHANNEL_LOGO_MIRRORS[key] || []).forEach(pushUrl);
    }
    if (kind === "league" || kind === "channel") {
      (LEAGUE_LOGO_MIRRORS[key] || []).forEach(pushUrl);
    }
    if (kind === "team" || kind === "country") {
      (TEAM_LOGO_MIRRORS[key] || []).forEach(pushUrl);
    }
    // Cross-check other dictionaries if still single-source
    (CHANNEL_LOGO_MIRRORS[key] || []).forEach(pushUrl);
    (LEAGUE_LOGO_MIRRORS[key] || []).forEach(pushUrl);
    (TEAM_LOGO_MIRRORS[key] || []).forEach(pushUrl);
  }

  // 4. Multi-CDN Country Flags (FlagCDN + FlagsAPI) for national teams / countries
  const iso =
    normalizeCountryCode(code) ||
    extractCountryCodeFromLogo(primaryUrl) ||
    countryCodeFromName(name);

  if (iso) {
    const isoLower = iso.toLowerCase();
    pushUrl(`https://flagcdn.com/w80/${isoLower}.png`);
    pushUrl(`https://flagcdn.com/${isoLower}.svg`);
    pushUrl(flagsApiUrl(iso, "shiny", size));
  }

  // 5. Guaranteed local vector SVG monogram as the ultimate unbreakable fallback
  pushUrl(generateVectorMonogramDataUri(name || code || "LS", kind));

  return candidates;
}

// Client-side memory cache for dynamic backend API logo discovery
const dynamicLogoCache = new Map<string, Promise<string[]>>();

/**
 * Queries the backend `/api/integrations/logos/resolve` endpoint (which searches
 * ESPN + TheSportsDB in real time) when all static URLs for an entity fail.
 */
export function fetchDynamicBackupLogos(
  name?: string | null,
  kind: LogoKind = "team",
): Promise<string[]> {
  const clean = name?.trim() || "";
  if (clean.length < 2 || typeof window === "undefined") {
    return Promise.resolve([]);
  }

  const cacheKey = `${kind}:${normalizeLookupKey(clean)}`;
  const existing = dynamicLogoCache.get(cacheKey);
  if (existing) return existing;

  const req = fetch(
    `/api/integrations/logos/resolve?q=${encodeURIComponent(clean)}&kind=${encodeURIComponent(kind)}`,
  )
    .then((r) => (r.ok ? r.json() : null))
    .then((payload) => {
      const list = payload?.data?.sources;
      return Array.isArray(list) ? (list as string[]) : [];
    })
    .catch(() => [] as string[]);

  dynamicLogoCache.set(cacheKey, req);
  return req;
}
