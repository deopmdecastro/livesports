import { prisma } from './prisma';
import { resolveTeamFlagUrl } from './flags';
import { runRealContentSync } from './real-sync';

export type SportCategory =
  | 'football'
  | 'basketball'
  | 'tennis'
  | 'ufc'
  | 'f1'
  | 'volleyball'
  | 'baseball'
  | 'other';

export type CompetitionFormat = 'groups' | 'league' | 'knockout';
export type EventStatus = 'upcoming' | 'live' | 'finished' | 'cancelled';

export interface GroupTeamStanding {
  id: string;
  name: string;
  code: string;
  flag?: string;
  group: string;
  rank?: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  gd?: number;
  points: number;
  form?: string;
  note?: string;
}

export interface CompetitionGroupStanding {
  group: string;
  teams: GroupTeamStanding[];
}

export interface CompetitionWatcherTarget {
  slug: string;
  name: string;
  sectionTitle: string;
  sport: SportCategory;
  espnSportPath: string; // e.g. 'soccer/eng.1' or 'basketball/nba' or 'racing/f1'
  theSportsDbLeagueId?: string;
  theSportsDbSeason?: string;
  format: CompetitionFormat;
  hostCountries: string;
  heroBadge: string;
  heroBadgeIcon: string;
  thumbnail: string;
  themeColor: string;
  isFeaturedDefault?: boolean;
  scanDaysAhead?: number;
}

/**
 * Multi-sport catalog of competitions watched continuously:
 *  - Football Group Tournaments (Copa do Mundo, Champions League, Libertadores, Euro, Copa América, Nations League, Europa League, Conference League)
 *  - Football Domestic Leagues & Cups (Liga Portugal, Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Brasileirão, Eredivisie, Pro League, Süper Lig, Scottish Premiership, MLS, Saudi Pro League, Taça de Portugal, Copa del Rey, FA Cup, DFB-Pokal)
 *  - Multi-Sport Championships (NBA Conferências Este/Oeste, Fórmula 1 Mundial de Pilotos & Construtores, UFC Fight Night / PPV)
 */
export const WATCHED_COMPETITIONS: CompetitionWatcherTarget[] = [
  // ─── Group Tournaments & International Cups ──────────────────────────────
  {
    slug: 'copa-do-mundo',
    name: 'Copa do Mundo FIFA 2026',
    sectionTitle: 'Copa do Mundo FIFA 2026',
    sport: 'football',
    espnSportPath: 'soccer/fifa.world',
    theSportsDbLeagueId: '4429',
    theSportsDbSeason: '2026',
    format: 'groups',
    hostCountries: 'EUA, Canadá e México',
    heroBadge: 'FIFA World Cup 2026',
    heroBadgeIcon: '🏆',
    thumbnail: 'https://r2.thesportsdb.com/images/media/league/badge/8dqv9l1709198064.png',
    themeColor: '#FFD700',
    isFeaturedDefault: true,
    scanDaysAhead: 4,
  },
  {
    slug: 'champions-league',
    name: 'UEFA Champions League',
    sectionTitle: 'UEFA Champions League',
    sport: 'football',
    espnSportPath: 'soccer/uefa.champions',
    theSportsDbLeagueId: '4480',
    theSportsDbSeason: '2025-2026',
    format: 'league',
    hostCountries: 'Europa',
    heroBadge: 'UEFA Champions League',
    heroBadgeIcon: '⭐',
    thumbnail: 'https://a.espncdn.com/i/leaguelogos/soccer/500/2.png',
    themeColor: '#3B82F6',
    scanDaysAhead: 6,
  },
  {
    slug: 'libertadores',
    name: 'CONMEBOL Libertadores',
    sectionTitle: 'CONMEBOL Libertadores',
    sport: 'football',
    espnSportPath: 'soccer/conmebol.libertadores',
    theSportsDbLeagueId: '4490',
    theSportsDbSeason: '2026',
    format: 'groups',
    hostCountries: 'América do Sul',
    heroBadge: 'Glória Eterna · CONMEBOL',
    heroBadgeIcon: '🏆',
    thumbnail: 'https://a.espncdn.com/i/leaguelogos/soccer/500/13.png',
    themeColor: '#D97706',
    scanDaysAhead: 5,
  },
  {
    slug: 'europa-league',
    name: 'UEFA Europa League',
    sectionTitle: 'UEFA Europa League',
    sport: 'football',
    espnSportPath: 'soccer/uefa.europa',
    theSportsDbLeagueId: '4481',
    theSportsDbSeason: '2025-2026',
    format: 'league',
    hostCountries: 'Europa',
    heroBadge: 'UEFA Europa League',
    heroBadgeIcon: '🟠',
    thumbnail: 'https://a.espncdn.com/i/leaguelogos/soccer/500/2310.png',
    themeColor: '#F97316',
    scanDaysAhead: 5,
  },
  {
    slug: 'conference-league',
    name: 'UEFA Conference League',
    sectionTitle: 'UEFA Conference League',
    sport: 'football',
    espnSportPath: 'soccer/uefa.europa.conf',
    theSportsDbLeagueId: '5071',
    theSportsDbSeason: '2025-2026',
    format: 'league',
    hostCountries: 'Europa',
    heroBadge: 'UEFA Conference League',
    heroBadgeIcon: '🟢',
    thumbnail: 'https://a.espncdn.com/i/leaguelogos/soccer/500/20296.png',
    themeColor: '#10B981',
    scanDaysAhead: 5,
  },
  {
    slug: 'nations-league',
    name: 'UEFA Nations League',
    sectionTitle: 'UEFA Nations League',
    sport: 'football',
    espnSportPath: 'soccer/uefa.nations',
    format: 'groups',
    hostCountries: 'Europa',
    heroBadge: 'UEFA Nations League',
    heroBadgeIcon: '🇪🇺',
    thumbnail: 'https://a.espncdn.com/i/leaguelogos/soccer/500/2705.png',
    themeColor: '#EF4444',
    scanDaysAhead: 4,
  },
  {
    slug: 'euro',
    name: 'UEFA Euro',
    sectionTitle: 'UEFA Euro',
    sport: 'football',
    espnSportPath: 'soccer/uefa.euro',
    format: 'groups',
    hostCountries: 'Europa',
    heroBadge: 'UEFA European Championship',
    heroBadgeIcon: '🏆',
    thumbnail: 'https://a.espncdn.com/i/leaguelogos/soccer/500/750.png',
    themeColor: '#2563EB',
    scanDaysAhead: 3,
  },
  {
    slug: 'copa-america',
    name: 'CONMEBOL Copa América',
    sectionTitle: 'CONMEBOL Copa América',
    sport: 'football',
    espnSportPath: 'soccer/conmebol.america',
    format: 'groups',
    hostCountries: 'Américas',
    heroBadge: 'CONMEBOL Copa América',
    heroBadgeIcon: '🌎',
    thumbnail: 'https://a.espncdn.com/i/leaguelogos/soccer/500/83.png',
    themeColor: '#38BDF8',
    scanDaysAhead: 3,
  },

  // ─── Top Football Leagues ─────────────────────────────────────────────────
  {
    slug: 'liga-portugal',
    name: 'Liga Portugal Betclic',
    sectionTitle: 'Liga Portugal',
    sport: 'football',
    espnSportPath: 'soccer/por.1',
    theSportsDbLeagueId: '4344',
    theSportsDbSeason: '2025-2026',
    format: 'league',
    hostCountries: 'Portugal',
    heroBadge: 'Liga Portugal Betclic',
    heroBadgeIcon: '🇵🇹',
    thumbnail: 'https://a.espncdn.com/i/leaguelogos/soccer/500/14.png',
    themeColor: '#E50914',
    scanDaysAhead: 6,
  },
  {
    slug: 'premier-league',
    name: 'Premier League',
    sectionTitle: 'Premier League',
    sport: 'football',
    espnSportPath: 'soccer/eng.1',
    theSportsDbLeagueId: '4328',
    theSportsDbSeason: '2025-2026',
    format: 'league',
    hostCountries: 'Inglaterra',
    heroBadge: 'English Premier League',
    heroBadgeIcon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    thumbnail: 'https://a.espncdn.com/i/leaguelogos/soccer/500/23.png',
    themeColor: '#9333EA',
    scanDaysAhead: 6,
  },
  {
    slug: 'la-liga',
    name: 'La Liga EA Sports',
    sectionTitle: 'La Liga',
    sport: 'football',
    espnSportPath: 'soccer/esp.1',
    theSportsDbLeagueId: '4335',
    theSportsDbSeason: '2025-2026',
    format: 'league',
    hostCountries: 'Espanha',
    heroBadge: 'La Liga EA Sports',
    heroBadgeIcon: '🇪🇸',
    thumbnail: 'https://a.espncdn.com/i/leaguelogos/soccer/500/15.png',
    themeColor: '#FF4B44',
    scanDaysAhead: 6,
  },
  {
    slug: 'serie-a',
    name: 'Serie A Enilive',
    sectionTitle: 'Serie A',
    sport: 'football',
    espnSportPath: 'soccer/ita.1',
    theSportsDbLeagueId: '4332',
    theSportsDbSeason: '2025-2026',
    format: 'league',
    hostCountries: 'Itália',
    heroBadge: 'Serie A Itália',
    heroBadgeIcon: '🇮🇹',
    thumbnail: 'https://a.espncdn.com/i/leaguelogos/soccer/500/12.png',
    themeColor: '#0EA5E9',
    scanDaysAhead: 6,
  },
  {
    slug: 'bundesliga',
    name: 'Bundesliga',
    sectionTitle: 'Bundesliga',
    sport: 'football',
    espnSportPath: 'soccer/ger.1',
    theSportsDbLeagueId: '4331',
    theSportsDbSeason: '2025-2026',
    format: 'league',
    hostCountries: 'Alemanha',
    heroBadge: 'Bundesliga Alemanha',
    heroBadgeIcon: '🇩🇪',
    thumbnail: 'https://a.espncdn.com/i/leaguelogos/soccer/500/10.png',
    themeColor: '#D20515',
    scanDaysAhead: 6,
  },
  {
    slug: 'ligue-1',
    name: 'Ligue 1 McDonald’s',
    sectionTitle: 'Ligue 1',
    sport: 'football',
    espnSportPath: 'soccer/fra.1',
    theSportsDbLeagueId: '4334',
    theSportsDbSeason: '2025-2026',
    format: 'league',
    hostCountries: 'França',
    heroBadge: 'Ligue 1 França',
    heroBadgeIcon: '🇫🇷',
    thumbnail: 'https://a.espncdn.com/i/leaguelogos/soccer/500/9.png',
    themeColor: '#38BDF8',
    scanDaysAhead: 6,
  },
  {
    slug: 'brasileirao',
    name: 'Brasileirão Série A',
    sectionTitle: 'Brasileirão',
    sport: 'football',
    espnSportPath: 'soccer/bra.1',
    theSportsDbLeagueId: '4351',
    theSportsDbSeason: '2026',
    format: 'league',
    hostCountries: 'Brasil',
    heroBadge: 'Brasileirão Betano',
    heroBadgeIcon: '🇧🇷',
    thumbnail: 'https://a.espncdn.com/i/leaguelogos/soccer/500/85.png',
    themeColor: '#22C55E',
    scanDaysAhead: 6,
  },
  {
    slug: 'eredivisie',
    name: 'Eredivisie',
    sectionTitle: 'Eredivisie',
    sport: 'football',
    espnSportPath: 'soccer/ned.1',
    theSportsDbLeagueId: '4337',
    theSportsDbSeason: '2025-2026',
    format: 'league',
    hostCountries: 'Países Baixos',
    heroBadge: 'Eredivisie',
    heroBadgeIcon: '🇳🇱',
    thumbnail: 'https://a.espncdn.com/i/leaguelogos/soccer/500/11.png',
    themeColor: '#F97316',
    scanDaysAhead: 4,
  },
  {
    slug: 'liga-belgica',
    name: 'Jupiler Pro League',
    sectionTitle: 'Pro League',
    sport: 'football',
    espnSportPath: 'soccer/bel.1',
    format: 'league',
    hostCountries: 'Bélgica',
    heroBadge: 'Belgian Pro League',
    heroBadgeIcon: '🇧🇪',
    thumbnail: 'https://a.espncdn.com/i/leaguelogos/soccer/500/6.png',
    themeColor: '#EF4444',
    scanDaysAhead: 4,
  },
  {
    slug: 'super-lig',
    name: 'Trendyol Süper Lig',
    sectionTitle: 'Süper Lig',
    sport: 'football',
    espnSportPath: 'soccer/tur.1',
    format: 'league',
    hostCountries: 'Turquia',
    heroBadge: 'Süper Lig Turquia',
    heroBadgeIcon: '🇹🇷',
    thumbnail: 'https://a.espncdn.com/i/leaguelogos/soccer/500/18.png',
    themeColor: '#E11D48',
    scanDaysAhead: 4,
  },
  {
    slug: 'scottish-premiership',
    name: 'Scottish Premiership',
    sectionTitle: 'Scottish Premiership',
    sport: 'football',
    espnSportPath: 'soccer/sco.1',
    format: 'league',
    hostCountries: 'Escócia',
    heroBadge: 'Scottish Premiership',
    heroBadgeIcon: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    thumbnail: 'https://a.espncdn.com/i/leaguelogos/soccer/500/45.png',
    themeColor: '#2563EB',
    scanDaysAhead: 4,
  },
  {
    slug: 'saudi-pro-league',
    name: 'Saudi Pro League',
    sectionTitle: 'Saudi Pro League',
    sport: 'football',
    espnSportPath: 'soccer/ksa.1',
    format: 'league',
    hostCountries: 'Arábia Saudita',
    heroBadge: 'Roshn Saudi League',
    heroBadgeIcon: '🇸🇦',
    thumbnail: 'https://a.espncdn.com/i/leaguelogos/soccer/500/2488.png',
    themeColor: '#10B981',
    scanDaysAhead: 4,
  },
  {
    slug: 'mls',
    name: 'Major League Soccer',
    sectionTitle: 'MLS',
    sport: 'football',
    espnSportPath: 'soccer/usa.1',
    format: 'groups',
    hostCountries: 'EUA e Canadá',
    heroBadge: 'Major League Soccer',
    heroBadgeIcon: '🇺🇸',
    thumbnail: 'https://a.espncdn.com/i/leaguelogos/soccer/500/19.png',
    themeColor: '#3B82F6',
    scanDaysAhead: 4,
  },

  // ─── Domestic Knockout Cups ───────────────────────────────────────────────
  {
    slug: 'taca-portugal',
    name: 'Taça de Portugal',
    sectionTitle: 'Taça de Portugal',
    sport: 'football',
    espnSportPath: 'soccer/por.taca.portugal',
    format: 'knockout',
    hostCountries: 'Portugal',
    heroBadge: 'Taça de Portugal Generali',
    heroBadgeIcon: '🏆',
    thumbnail: 'https://a.espncdn.com/i/leaguelogos/soccer/500/14.png',
    themeColor: '#DC2626',
    scanDaysAhead: 4,
  },
  {
    slug: 'copa-del-rey',
    name: 'Copa del Rey',
    sectionTitle: 'Copa del Rey',
    sport: 'football',
    espnSportPath: 'soccer/esp.copa_del_rey',
    format: 'knockout',
    hostCountries: 'Espanha',
    heroBadge: 'Copa del Rey',
    heroBadgeIcon: '👑',
    thumbnail: 'https://a.espncdn.com/i/leaguelogos/soccer/500/80.png',
    themeColor: '#F59E0B',
    scanDaysAhead: 4,
  },
  {
    slug: 'fa-cup',
    name: 'Emirates FA Cup',
    sectionTitle: 'FA Cup',
    sport: 'football',
    espnSportPath: 'soccer/eng.fa',
    format: 'knockout',
    hostCountries: 'Inglaterra',
    heroBadge: 'The Emirates FA Cup',
    heroBadgeIcon: '🏆',
    thumbnail: 'https://a.espncdn.com/i/leaguelogos/soccer/500/40.png',
    themeColor: '#EF4444',
    scanDaysAhead: 4,
  },
  {
    slug: 'dfb-pokal',
    name: 'DFB-Pokal',
    sectionTitle: 'DFB-Pokal',
    sport: 'football',
    espnSportPath: 'soccer/ger.dfb_pokal',
    format: 'knockout',
    hostCountries: 'Alemanha',
    heroBadge: 'DFB-Pokal',
    heroBadgeIcon: '🏆',
    thumbnail: 'https://a.espncdn.com/i/leaguelogos/soccer/500/2061.png',
    themeColor: '#EAB308',
    scanDaysAhead: 4,
  },

  // ─── Multi-Sport Championships (Basketball, F1, UFC) ─────────────────────
  {
    slug: 'nba',
    name: 'NBA Basketball',
    sectionTitle: 'NBA · Conferências',
    sport: 'basketball',
    espnSportPath: 'basketball/nba',
    theSportsDbLeagueId: '4387',
    theSportsDbSeason: '2025-2026',
    format: 'groups',
    hostCountries: 'EUA e Canadá',
    heroBadge: 'National Basketball Association',
    heroBadgeIcon: '🏀',
    thumbnail: 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png',
    themeColor: '#F97316',
    scanDaysAhead: 4,
  },
  {
    slug: 'formula-1',
    name: 'FIA Fórmula 1 Mundial',
    sectionTitle: 'Fórmula 1 · Mundial',
    sport: 'f1',
    espnSportPath: 'racing/f1',
    theSportsDbLeagueId: '4370',
    theSportsDbSeason: '2026',
    format: 'groups',
    hostCountries: 'Mundial FIA',
    heroBadge: 'FIA Formula One World Championship',
    heroBadgeIcon: '🏎️',
    thumbnail: 'https://a.espncdn.com/i/teamlogos/leagues/500/f1.png',
    themeColor: '#E10600',
    scanDaysAhead: 7,
  },
  {
    slug: 'ufc-championship',
    name: 'UFC · Ultimate Fighting Championship',
    sectionTitle: 'UFC · Eventos & Cards',
    sport: 'ufc',
    espnSportPath: 'mma/ufc',
    theSportsDbLeagueId: '4443',
    theSportsDbSeason: '2026',
    format: 'knockout',
    hostCountries: 'Internacional',
    heroBadge: 'Ultimate Fighting Championship',
    heroBadgeIcon: '🥊',
    thumbnail: 'https://a.espncdn.com/i/teamlogos/leagues/500/ufc.png',
    themeColor: '#D4AF37',
    scanDaysAhead: 7,
  },
];

// ─── Watcher Telemetry State ─────────────────────────────────────────────────

export interface WatcherSourceReport {
  slug: string;
  name: string;
  sport: SportCategory;
  format: CompetitionFormat;
  standingsSource: 'espn-v2' | 'thesportsdb' | 'none';
  groupsCount: number;
  teamsCount: number;
  eventsUpserted: number;
  updatedAt: string;
  error?: string;
}

export interface WatcherCycleSummary {
  cycleNumber: number;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  competitionsSynced: number;
  standingsUpdated: number;
  totalGroups: number;
  totalTeamsRanked: number;
  eventsUpserted: number;
  reports: WatcherSourceReport[];
}

interface WatcherRuntimeState {
  running: boolean;
  daemonActive: boolean;
  intervalMs: number;
  cycleCount: number;
  lastCycle: WatcherCycleSummary | null;
  nextRunAt: string | null;
  lastError: string | null;
}

const watcherState: WatcherRuntimeState = {
  running: false,
  daemonActive: false,
  intervalMs: 5 * 60 * 1000,
  cycleCount: 0,
  lastCycle: null,
  nextRunAt: null,
  lastError: null,
};

let daemonTimer: NodeJS.Timeout | null = null;

export function getSportsWatcherStatus(): WatcherRuntimeState {
  return { ...watcherState };
}

// ─── HTTP Helper with Timeout & Retry ────────────────────────────────────────

async function fetchJsonSafe(url: string, timeoutMs = 10_000): Promise<any | null> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'LiveSports-SportsWatcher/2.0',
          Accept: 'application/json',
        },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      if (attempt === 2) return null;
      await new Promise((r) => setTimeout(r, 400));
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

function statMap(stats: any[]): Record<string, number> {
  const out: Record<string, number> = {};
  if (!Array.isArray(stats)) return out;
  for (const s of stats) {
    if (s?.name && typeof s.value === 'number' && Number.isFinite(s.value)) {
      out[s.name] = s.value;
    }
  }
  return out;
}

function cleanGroupLabel(rawName: string | undefined, index: number, totalGroups: number): string {
  const name = (rawName || '').trim();
  if (!name) return totalGroups > 1 ? String.fromCharCode(65 + index) : 'Classificação';
  const groupMatch = name.match(/^Group\s+([A-Z0-9]+)$/i) || name.match(/^Grupo\s+([A-Z0-9]+)$/i);
  if (groupMatch) return groupMatch[1].toUpperCase();
  return name
    .replace(/Eastern Conference/i, 'Conferência Este')
    .replace(/Western Conference/i, 'Conferência Oeste')
    .replace(/Driver Standings/i, 'Mundial de Pilotos')
    .replace(/Constructor Standings/i, 'Mundial de Construtores')
    .replace(/League Phase/i, 'Fase de Liga');
}

/**
 * Source 1: ESPN Public Standings API v2 (no key required, supports groups, conferences, F1 & leagues)
 */
export async function fetchEspnStandingsGroups(
  target: CompetitionWatcherTarget,
): Promise<{ seasonLabel: string | null; groups: CompetitionGroupStanding[] }> {
  const url = `https://site.api.espn.com/apis/v2/sports/${target.espnSportPath}/standings`;
  const payload = await fetchJsonSafe(url);
  if (!payload) return { seasonLabel: null, groups: [] };

  const rawGroups: any[] =
    Array.isArray(payload.children) && payload.children.length > 0
      ? payload.children
      : payload.standings?.entries
        ? [{ name: payload.name || target.name, standings: payload.standings }]
        : [];

  let seasonLabel: string | null = null;
  const groups: CompetitionGroupStanding[] = [];

  for (let idx = 0; idx < rawGroups.length; idx++) {
    const node = rawGroups[idx];
    const entries: any[] = node?.standings?.entries || [];
    if (entries.length === 0) continue;

    if (!seasonLabel && node?.standings?.season) {
      seasonLabel = String(node.standings.seasonDisplayName || node.standings.season);
      const yrMatch = seasonLabel.match(/\d{4}(?:-\d{2,4})?/);
      if (yrMatch) seasonLabel = yrMatch[0];
    }

    const label = cleanGroupLabel(node?.name, idx, rawGroups.length);

    const mappedTeams: GroupTeamStanding[] = entries.map((entry: any, entryIdx: number) => {
      const entity = entry.team || entry.athlete || {};
      const stats = statMap(entry.stats || []);

      const name =
        entity.shortDisplayName ||
        entity.displayName ||
        entity.name ||
        `Equipa ${entryIdx + 1}`;
      const code = String(entity.abbreviation || name.slice(0, 3)).toUpperCase();
      const rawLogo =
        entity.logos?.[0]?.href ||
        entity.flag?.href ||
        undefined;
      const flag =
        resolveTeamFlagUrl({
          code,
          crestOrLogo: rawLogo,
        }) || rawLogo;

      const wins = Math.round(stats.wins ?? 0);
      const losses = Math.round(stats.losses ?? 0);
      const draws = Math.round(stats.ties ?? stats.draws ?? 0);
      const played =
        Math.round(stats.gamesPlayed ?? 0) ||
        (wins + losses + draws > 0 ? wins + losses + draws : 0);

      const gf = Math.round(stats.pointsFor ?? stats.goalsFor ?? 0);
      const ga = Math.round(stats.pointsAgainst ?? stats.goalsAgainst ?? 0);
      const gd = Math.round(stats.pointDifferential ?? gf - ga);

      // F1 uses championshipPts; NBA uses wins as primary table metric; Football uses points
      let points = 0;
      if (target.sport === 'f1') {
        points = Math.round(stats.championshipPts ?? stats.points ?? 0);
      } else if (target.sport === 'basketball') {
        points = wins;
      } else {
        points = Math.round(stats.points ?? wins * 3 + draws);
      }

      const rank =
        Math.round(stats.rank ?? stats.playoffSeed ?? 0) || entryIdx + 1;

      return {
        id: String(entity.id || `${target.slug}-${label}-${entryIdx}`),
        name,
        code,
        flag,
        group: label,
        rank,
        played,
        wins,
        draws,
        losses,
        gf,
        ga,
        gd,
        points,
        note: entry.note?.description || undefined,
      };
    });

    // Sort properly:
    //  - Football: points DESC, gd DESC, gf DESC, rank ASC
    //  - Basketball: wins DESC, losses ASC
    //  - F1: points DESC, rank ASC
    mappedTeams.sort((a, b) => {
      if (target.sport === 'basketball') {
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (a.losses !== b.losses) return a.losses - b.losses;
        return (a.rank || 99) - (b.rank || 99);
      }
      if (b.points !== a.points) return b.points - a.points;
      if ((b.gd ?? 0) !== (a.gd ?? 0)) return (b.gd ?? 0) - (a.gd ?? 0);
      if (b.gf !== a.gf) return b.gf - a.gf;
      return (a.rank || 99) - (b.rank || 99);
    });

    groups.push({
      group: label,
      teams: mappedTeams,
    });
  }

  return { seasonLabel, groups };
}

/**
 * Source 2 (Backup): TheSportsDB League Table API (`lookuptable.php`)
 */
export async function fetchTheSportsDbStandingsBackup(
  target: CompetitionWatcherTarget,
): Promise<CompetitionGroupStanding[]> {
  if (!target.theSportsDbLeagueId) return [];
  const season = target.theSportsDbSeason || '2025-2026';
  const key = process.env.THESPORTSDB_API_KEY?.trim() || '123';
  const url = `https://www.thesportsdb.com/api/v1/json/${encodeURIComponent(key)}/lookuptable.php?l=${encodeURIComponent(
    target.theSportsDbLeagueId,
  )}&s=${encodeURIComponent(season)}`;

  const payload = await fetchJsonSafe(url);
  const rows: any[] = payload?.table || [];
  if (!Array.isArray(rows) || rows.length === 0) return [];

  const grouped = new Map<string, GroupTeamStanding[]>();
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const groupLabel = cleanGroupLabel(r.strGroup || target.sectionTitle, 0, 1);
    const list = grouped.get(groupLabel) || [];
    const badge = typeof r.strBadge === 'string' ? r.strBadge.replace(/\/tiny$/, '') : undefined;
    list.push({
      id: String(r.idTeam || `${target.slug}-tsdb-${i}`),
      name: r.strTeam || `Equipa ${i + 1}`,
      code: String(r.strTeam || 'EQP').slice(0, 3).toUpperCase(),
      flag: badge,
      group: groupLabel,
      rank: Number(r.intRank || i + 1),
      played: Number(r.intPlayed || 0),
      wins: Number(r.intWin || 0),
      draws: Number(r.intDraw || 0),
      losses: Number(r.intLoss || 0),
      gf: Number(r.intGoalsFor || 0),
      ga: Number(r.intGoalsAgainst || 0),
      gd: Number(r.intGoalDifference || 0),
      points: Number(r.intPoints || 0),
      form: r.strForm || undefined,
      note: r.strDescription || undefined,
    });
    grouped.set(groupLabel, list);
  }

  return Array.from(grouped.entries()).map(([group, teams]) => ({
    group,
    teams,
  }));
}

// ─── Scoreboard / Fixtures Multi-Day Fetcher ─────────────────────────────────

function formatYyyyMmDd(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function mapEspnStateToStatus(state?: string, completed?: boolean): EventStatus {
  if (state === 'in') return 'live';
  if (state === 'post' || completed) return 'finished';
  return 'upcoming';
}

interface ParsedCompetitionFixture {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  sport: SportCategory;
  stage: string | null;
  groupName: string | null;
  league: string;
  leagueLogo: string;
  teamA: string;
  teamACode: string | null;
  teamALogo: string | null;
  teamB: string;
  teamBCode: string | null;
  teamBLogo: string | null;
  scoreA: number | null;
  scoreB: number | null;
  matchTime: string;
  venue: string | null;
  scheduledAt: string;
  status: EventStatus;
}

async function fetchEspnFixturesForTarget(
  target: CompetitionWatcherTarget,
): Promise<ParsedCompetitionFixture[]> {
  const urls = new Set<string>();
  // Default scoreboard (always returns active round/matchday even if weeks away, e.g. World Cup / UCL)
  urls.add(`https://site.api.espn.com/apis/site/v2/sports/${target.espnSportPath}/scoreboard`);

  const daysAhead = target.scanDaysAhead ?? 4;
  const now = new Date();
  for (let offset = -1; offset <= daysAhead; offset++) {
    const dt = new Date(now.getTime() + offset * 86_400_000);
    urls.add(
      `https://site.api.espn.com/apis/site/v2/sports/${target.espnSportPath}/scoreboard?dates=${formatYyyyMmDd(dt)}`,
    );
  }

  const seen = new Map<string, ParsedCompetitionFixture>();

  for (const url of Array.from(urls)) {
    const payload = await fetchJsonSafe(url, 8_000);
    const events: any[] = payload?.events || [];
    const leagueLogo =
      payload?.leagues?.[0]?.logos?.[0]?.href || target.thumbnail;

    for (const ev of events) {
      if (!ev?.id) continue;
      const comp = ev.competitions?.[0];
      if (!comp) continue;

      const competitors: any[] = comp.competitors || [];
      const home =
        competitors.find((c) => c.homeAway === 'home') || competitors[0];
      const away =
        competitors.find((c) => c.homeAway === 'away') || competitors[1];

      const teamA =
        home?.team?.shortDisplayName ||
        home?.team?.displayName ||
        home?.athlete?.displayName ||
        ev.shortName ||
        ev.name ||
        target.name;
      const teamB =
        away?.team?.shortDisplayName ||
        away?.team?.displayName ||
        away?.athlete?.displayName ||
        (target.sport === 'f1' ? 'Grande Prémio FIA' : 'Adversário');

      const teamACode = home?.team?.abbreviation || null;
      const teamBCode = away?.team?.abbreviation || null;

      const rawLogoA =
        home?.team?.logo ||
        home?.team?.logos?.[0]?.href ||
        home?.athlete?.flag?.href ||
        target.thumbnail;
      const rawLogoB =
        away?.team?.logo ||
        away?.team?.logos?.[0]?.href ||
        away?.athlete?.flag?.href ||
        target.thumbnail;

      const state = ev.status?.type?.state;
      const completed = Boolean(ev.status?.type?.completed);
      const status = mapEspnStateToStatus(state, completed);

      const parsedScoreA =
        status === 'upcoming'
          ? null
          : Number.isFinite(Number(home?.score))
            ? Number(home.score)
            : null;
      const parsedScoreB =
        status === 'upcoming'
          ? null
          : Number.isFinite(Number(away?.score))
            ? Number(away.score)
            : null;

      const rawNote =
        comp.notes?.[0]?.headline ||
        comp.groups?.name ||
        ev.season?.slug ||
        null;
      const grpMatch =
        typeof rawNote === 'string'
          ? rawNote.match(/Group\s+([A-Z0-9]+)/i) || rawNote.match(/Grupo\s+([A-Z0-9]+)/i)
          : null;
      const groupName = grpMatch ? grpMatch[1].toUpperCase() : null;

      const id = `espn-${target.sport}-${ev.id}`;
      seen.set(id, {
        id,
        title: competitors.length >= 2 ? `${teamA} vs ${teamB}` : ev.name || teamA,
        description: `${target.name} · ${comp.venue?.fullName || target.hostCountries}`,
        thumbnail: leagueLogo || target.thumbnail,
        sport: target.sport,
        stage: rawNote ? String(rawNote).slice(0, 80) : null,
        groupName,
        league: target.name,
        leagueLogo: leagueLogo || target.thumbnail,
        teamA,
        teamACode,
        teamALogo: resolveTeamFlagUrl({ code: teamACode, crestOrLogo: rawLogoA }) || rawLogoA,
        teamB,
        teamBCode,
        teamBLogo: resolveTeamFlagUrl({ code: teamBCode, crestOrLogo: rawLogoB }) || rawLogoB,
        scoreA: parsedScoreA,
        scoreB: parsedScoreB,
        matchTime:
          status === 'live'
            ? ev.status?.type?.shortDetail || 'AO VIVO'
            : status === 'finished'
              ? 'Terminado'
              : ev.status?.type?.shortDetail || 'Agendado',
        venue: comp.venue?.fullName || null,
        scheduledAt: ev.date || new Date().toISOString(),
        status,
      });
    }
  }

  return Array.from(seen.values());
}

// ─── Database Upsert Helpers ─────────────────────────────────────────────────

async function upsertWatchedCompetition(
  target: CompetitionWatcherTarget,
  seasonLabel: string | null,
  groups: CompetitionGroupStanding[],
  gamesCount: number,
): Promise<string> {
  const totalTeams = groups.reduce((acc, g) => acc + g.teams.length, 0);
  const effectiveFormat: CompetitionFormat =
    groups.length > 1
      ? 'groups'
      : groups.length === 1 && target.format === 'groups'
        ? 'league'
        : target.format;

  const groupsJson = groups.length > 0 ? JSON.stringify(groups) : null;

  const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `
      INSERT INTO "competitions" (
        "id", "name", "slug", "season", "sport", "description", "thumbnail",
        "status", "format", "hero_badge", "hero_badge_icon", "hero_title_line1", "hero_title_line2",
        "host_countries", "section_title", "stat_teams", "stat_games", "groups_data", "theme_color", "is_featured_card"
      )
      VALUES (
        $1, $2, $3, $4, $5::sport_category, $6, $7,
        'active'::competition_status, $8::competition_format, $9, $10, $11, $12,
        $13, $14, $15, $16, $17::jsonb, $18, $19
      )
      ON CONFLICT ("slug") DO UPDATE SET
        "name" = EXCLUDED."name",
        "season" = COALESCE(EXCLUDED."season", "competitions"."season"),
        "sport" = EXCLUDED."sport",
        "description" = COALESCE(EXCLUDED."description", "competitions"."description"),
        "thumbnail" = COALESCE(EXCLUDED."thumbnail", "competitions"."thumbnail"),
        "format" = EXCLUDED."format",
        "hero_badge" = COALESCE(EXCLUDED."hero_badge", "competitions"."hero_badge"),
        "hero_badge_icon" = COALESCE(EXCLUDED."hero_badge_icon", "competitions"."hero_badge_icon"),
        "hero_title_line1" = COALESCE(EXCLUDED."hero_title_line1", "competitions"."hero_title_line1"),
        "hero_title_line2" = COALESCE(EXCLUDED."hero_title_line2", "competitions"."hero_title_line2"),
        "host_countries" = COALESCE(EXCLUDED."host_countries", "competitions"."host_countries"),
        "section_title" = COALESCE(EXCLUDED."section_title", "competitions"."section_title"),
        "stat_teams" = CASE WHEN EXCLUDED."stat_teams" > 0 THEN EXCLUDED."stat_teams" ELSE "competitions"."stat_teams" END,
        "stat_games" = CASE WHEN EXCLUDED."stat_games" > 0 THEN EXCLUDED."stat_games" ELSE "competitions"."stat_games" END,
        "groups_data" = COALESCE(EXCLUDED."groups_data", "competitions"."groups_data"),
        "theme_color" = COALESCE(EXCLUDED."theme_color", "competitions"."theme_color"),
        "updated_at" = NOW()
      RETURNING "id"
    `,
    `comp-${target.slug}`,
    target.name,
    target.slug,
    seasonLabel || target.theSportsDbSeason || '2026',
    target.sport,
    `Classificação oficial, grupos, resultados ao vivo e calendário de ${target.name} (${target.hostCountries}).`,
    target.thumbnail,
    effectiveFormat,
    target.heroBadge,
    target.heroBadgeIcon,
    target.name,
    seasonLabel || target.theSportsDbSeason || '2026',
    target.hostCountries,
    target.sectionTitle,
    totalTeams,
    gamesCount,
    groupsJson,
    target.themeColor,
    Boolean(target.isFeaturedDefault),
  );

  return rows[0].id;
}

async function upsertCompetitionFixture(
  fx: ParsedCompetitionFixture,
  competitionId: string,
): Promise<void> {
  await prisma.$executeRawUnsafe(
    `
      INSERT INTO "events" (
        "id", "title", "description", "thumbnail", "sport", "competition_id",
        "stage", "group_name", "league", "league_logo",
        "team_a", "team_a_code", "team_a_logo",
        "team_b", "team_b_code", "team_b_logo",
        "score_a", "score_b", "match_time", "viewer_count", "venue",
        "scheduled_at", "status"
      )
      VALUES (
        $1, $2, $3, $4, $5::sport_category, $6,
        $7, $8, $9, $10,
        $11, $12, $13,
        $14, $15, $16,
        $17, $18, $19, 0, $20,
        $21::timestamptz, $22::event_status
      )
      ON CONFLICT ("id") DO UPDATE SET
        "title" = EXCLUDED."title",
        "competition_id" = EXCLUDED."competition_id",
        "stage" = COALESCE(EXCLUDED."stage", "events"."stage"),
        "group_name" = COALESCE(EXCLUDED."group_name", "events"."group_name"),
        "league" = EXCLUDED."league",
        "league_logo" = COALESCE(EXCLUDED."league_logo", "events"."league_logo"),
        "team_a" = EXCLUDED."team_a",
        "team_a_code" = COALESCE(EXCLUDED."team_a_code", "events"."team_a_code"),
        "team_a_logo" = COALESCE(EXCLUDED."team_a_logo", "events"."team_a_logo"),
        "team_b" = EXCLUDED."team_b",
        "team_b_code" = COALESCE(EXCLUDED."team_b_code", "events"."team_b_code"),
        "team_b_logo" = COALESCE(EXCLUDED."team_b_logo", "events"."team_b_logo"),
        "score_a" = EXCLUDED."score_a",
        "score_b" = EXCLUDED."score_b",
        "match_time" = EXCLUDED."match_time",
        "venue" = COALESCE(EXCLUDED."venue", "events"."venue"),
        "scheduled_at" = EXCLUDED."scheduled_at",
        "status" = EXCLUDED."status",
        "updated_at" = NOW()
    `,
    fx.id,
    fx.title,
    fx.description,
    fx.thumbnail,
    fx.sport,
    competitionId,
    fx.stage,
    fx.groupName,
    fx.league,
    fx.leagueLogo,
    fx.teamA,
    fx.teamACode,
    fx.teamALogo,
    fx.teamB,
    fx.teamBCode,
    fx.teamBLogo,
    fx.scoreA,
    fx.scoreB,
    fx.matchTime,
    fx.venue,
    fx.scheduledAt,
    fx.status,
  );
}

/**
 * Also link existing events in PostgreSQL whose `league` matches the competition name
 * so no orphan fixtures are left outside the competition page.
 */
async function linkMatchingLeagueEvents(
  competitionId: string,
  target: CompetitionWatcherTarget,
): Promise<number> {
  const countRow = await prisma.$queryRawUnsafe<Array<{ cnt: number }>>(
    `
      WITH updated AS (
        UPDATE "events"
        SET "competition_id" = $1
        WHERE "competition_id" IS NULL
          AND (
            LOWER("league") = LOWER($2)
            OR LOWER("league") = LOWER($3)
          )
        RETURNING 1
      )
      SELECT COUNT(*)::int AS cnt FROM updated
    `,
    competitionId,
    target.name,
    target.sectionTitle,
  );
  return Number(countRow?.[0]?.cnt || 0);
}

// ─── Main Poll Cycle Execution ───────────────────────────────────────────────

export async function runSportsWatcherCycle(options?: {
  slugFilter?: string[];
  includeLiveChannelsAndNews?: boolean;
}): Promise<WatcherCycleSummary> {
  if (watcherState.running && watcherState.lastCycle) {
    return watcherState.lastCycle;
  }

  watcherState.running = true;
  watcherState.lastError = null;
  const startedMs = Date.now();
  const startedAt = new Date(startedMs).toISOString();
  const reports: WatcherSourceReport[] = [];

  try {
    if (options?.includeLiveChannelsAndNews !== false) {
      await runRealContentSync(false).catch(() => {});
    }

    const targets = options?.slugFilter?.length
      ? WATCHED_COMPETITIONS.filter((t) => options.slugFilter!.includes(t.slug))
      : WATCHED_COMPETITIONS;

    // Process in batches of 4 to stay fast (~5-8s total) while polite to upstream CDNs
    const BATCH_SIZE = 4;
    for (let i = 0; i < targets.length; i += BATCH_SIZE) {
      const slice = targets.slice(i, i + BATCH_SIZE);
      const sliceReports = await Promise.all(
        slice.map(async (target): Promise<WatcherSourceReport> => {
          try {
            // 1. Primary standings/groups from ESPN v2, fallback to TheSportsDB
            let standingsSource: WatcherSourceReport['standingsSource'] = 'none';
            const espnStandings = await fetchEspnStandingsGroups(target);
            let groups = espnStandings.groups;
            const seasonLabel = espnStandings.seasonLabel;

            if (groups.length > 0) {
              standingsSource = 'espn-v2';
            } else {
              const backupGroups = await fetchTheSportsDbStandingsBackup(target);
              if (backupGroups.length > 0) {
                groups = backupGroups;
                standingsSource = 'thesportsdb';
              }
            }

            // 2. Fetch fixtures / results across multi-day window
            const fixtures = await fetchEspnFixturesForTarget(target);

            // 3. Upsert competition + standings + fixtures into PostgreSQL
            const competitionId = await upsertWatchedCompetition(
              target,
              seasonLabel,
              groups,
              fixtures.length,
            );

            for (const fx of fixtures) {
              await upsertCompetitionFixture(fx, competitionId);
            }

            const linked = await linkMatchingLeagueEvents(competitionId, target);
            const totalEventsRow = await prisma.$queryRawUnsafe<Array<{ cnt: number }>>(
              `SELECT COUNT(*)::int AS cnt FROM "events" WHERE "competition_id" = $1`,
              competitionId,
            );
            const totalStoredGames = Number(totalEventsRow?.[0]?.cnt || fixtures.length);
            if (totalStoredGames > fixtures.length) {
              await prisma.$executeRawUnsafe(
                `UPDATE "competitions" SET "stat_games" = $2 WHERE "id" = $1`,
                competitionId,
                totalStoredGames,
              );
            }

            return {
              slug: target.slug,
              name: target.name,
              sport: target.sport,
              format: groups.length > 1 ? 'groups' : target.format,
              standingsSource,
              groupsCount: groups.length,
              teamsCount: groups.reduce((s, g) => s + g.teams.length, 0),
              eventsUpserted: fixtures.length + linked,
              updatedAt: new Date().toISOString(),
            };
          } catch (err: any) {
            return {
              slug: target.slug,
              name: target.name,
              sport: target.sport,
              format: target.format,
              standingsSource: 'none',
              groupsCount: 0,
              teamsCount: 0,
              eventsUpserted: 0,
              updatedAt: new Date().toISOString(),
              error: err?.message || String(err),
            };
          }
        }),
      );
      reports.push(...sliceReports);
    }

    watcherState.cycleCount += 1;
    const finishedMs = Date.now();
    const summary: WatcherCycleSummary = {
      cycleNumber: watcherState.cycleCount,
      startedAt,
      finishedAt: new Date(finishedMs).toISOString(),
      durationMs: finishedMs - startedMs,
      competitionsSynced: reports.filter((r) => !r.error).length,
      standingsUpdated: reports.filter((r) => r.groupsCount > 0).length,
      totalGroups: reports.reduce((s, r) => s + r.groupsCount, 0),
      totalTeamsRanked: reports.reduce((s, r) => s + r.teamsCount, 0),
      eventsUpserted: reports.reduce((s, r) => s + r.eventsUpserted, 0),
      reports,
    };

    watcherState.lastCycle = summary;
    console.log(
      `📡 [SportsWatcher #${summary.cycleNumber}] ${summary.competitionsSynced} competições | ${summary.standingsUpdated} tabelas (${summary.totalGroups} grupos, ${summary.totalTeamsRanked} equipas) | ${summary.eventsUpserted} jogos sincronizados em ${(summary.durationMs / 1000).toFixed(1)}s`,
    );
    return summary;
  } catch (err: any) {
    watcherState.lastError = err?.message || String(err);
    throw err;
  } finally {
    watcherState.running = false;
  }
}

/**
 * Starts the continuous background polling daemon inside the API server
 * or standalone CLI worker.
 */
export function startSportsWatcherDaemon(intervalMs = 5 * 60 * 1000): void {
  if (daemonTimer) {
    clearInterval(daemonTimer);
    daemonTimer = null;
  }

  watcherState.daemonActive = true;
  watcherState.intervalMs = intervalMs;
  watcherState.nextRunAt = new Date(Date.now() + intervalMs).toISOString();

  // Trigger initial cycle immediately in background
  runSportsWatcherCycle({ includeLiveChannelsAndNews: false })
    .then(() => {
      watcherState.nextRunAt = new Date(Date.now() + intervalMs).toISOString();
    })
    .catch((err) => {
      console.warn('[SportsWatcher] Initial cycle warning:', err?.message || String(err));
    });

  daemonTimer = setInterval(() => {
    runSportsWatcherCycle({ includeLiveChannelsAndNews: true })
      .then(() => {
        watcherState.nextRunAt = new Date(Date.now() + intervalMs).toISOString();
      })
      .catch((err) => {
        console.warn('[SportsWatcher] Scheduled cycle warning:', err?.message || String(err));
      });
  }, intervalMs);

  // Do not block graceful process exit when unref is available
  if (typeof daemonTimer.unref === 'function') {
    daemonTimer.unref();
  }
}

export function stopSportsWatcherDaemon(): void {
  if (daemonTimer) {
    clearInterval(daemonTimer);
    daemonTimer = null;
  }
  watcherState.daemonActive = false;
  watcherState.nextRunAt = null;
}
