import { prisma } from './prisma';
import { WATCHED_COMPETITIONS } from './sports-watcher';

export interface MatchScorerSummary {
  player: string;
  minute: string;
  teamSide: 'home' | 'away';
  teamName: string;
  penalty?: boolean;
  ownGoal?: boolean;
  assist?: string | null;
}

export interface MatchQuickStat {
  key: string;
  label: string;
  home: string;
  away: string;
}

export interface StoredMatchDetails {
  espnEventId?: string;
  espnSportPath?: string;
  scorers: MatchScorerSummary[];
  quickStats: MatchQuickStat[];
  attendance?: number | null;
  referee?: string | null;
}

export interface LiveMatchTag {
  liveId: string;
  liveStatus: 'live' | 'scheduled';
  liveTitle: string;
  viewerCount: number;
}

export interface NormalizedStatisticItem {
  type: string;
  value: number | string | null;
}

export interface NormalizedTeamStatistics {
  team: {
    name: string;
    logo?: string;
  };
  statistics: NormalizedStatisticItem[];
}

export interface NormalizedTimelineItem {
  time: {
    elapsed?: number;
    extra?: number | null;
    display?: string;
  };
  team: {
    name?: string;
    logo?: string;
    side?: 'home' | 'away';
  };
  player: {
    name?: string;
  };
  assist?: {
    name?: string | null;
  };
  type: string;
  detail?: string;
  comments?: string | null;
  scoringPlay?: boolean;
  yellowCard?: boolean;
  redCard?: boolean;
  substitution?: boolean;
}

export interface NormalizedLineupPlayer {
  player: {
    id?: number | string;
    name?: string;
    number?: number | string;
    pos?: string;
    starter?: boolean;
    subbedIn?: boolean;
    subbedOut?: boolean;
    goals?: number;
    assists?: number;
    yellowCards?: number;
    redCards?: number;
    saves?: number;
    shots?: number;
  };
}

export interface NormalizedTeamLineup {
  team: {
    name?: string;
    logo?: string;
  };
  formation?: string;
  startXI: NormalizedLineupPlayer[];
  substitutes?: NormalizedLineupPlayer[];
}

export interface FullMatchSummaryPayload {
  source: string;
  fixtureId: string | null;
  espnSportPath?: string | null;
  venue?: {
    name?: string | null;
    city?: string | null;
    country?: string | null;
    attendance?: number | null;
  } | null;
  scorers: MatchScorerSummary[];
  statistics: NormalizedTeamStatistics[];
  timeline: NormalizedTimelineItem[];
  lineups: NormalizedTeamLineup[];
  leaders?: Array<{
    teamName: string;
    teamLogo?: string;
    category: string;
    playerName: string;
    displayValue: string;
  }>;
}

// ─── Parse Scoreboard Details (Scorers + Quick Stats) ────────────────────────

export function extractMatchDetailsFromEspnEvent(
  ev: any,
  espnSportPath: string,
): StoredMatchDetails {
  const comp = ev?.competitions?.[0] || {};
  const competitors: any[] = comp.competitors || [];
  const home = competitors.find((c) => c.homeAway === 'home') || competitors[0] || {};
  const away = competitors.find((c) => c.homeAway === 'away') || competitors[1] || {};
  const homeTeamId = String(home?.team?.id || home?.id || '');
  const homeName =
    home?.team?.shortDisplayName || home?.team?.displayName || 'Casa';
  const awayName =
    away?.team?.shortDisplayName || away?.team?.displayName || 'Fora';

  const details: any[] = Array.isArray(comp.details) ? comp.details : [];
  const scorers: MatchScorerSummary[] = [];

  for (const d of details) {
    if (!d?.scoringPlay) continue;
    const teamId = String(d.team?.id || '');
    const teamSide: 'home' | 'away' =
      teamId && teamId === homeTeamId ? 'home' : 'away';
    const athletes: any[] = d.athletesInvolved || d.participants || [];
    const primary = athletes[0]?.athlete || athletes[0] || {};
    const secondary = athletes[1]?.athlete || athletes[1] || null;
    const player =
      primary.shortName ||
      primary.displayName ||
      primary.fullName ||
      d.text ||
      'Marcador';
    const assist =
      secondary?.shortName || secondary?.displayName || null;

    scorers.push({
      player,
      minute: d.clock?.displayValue || '',
      teamSide,
      teamName: teamSide === 'home' ? homeName : awayName,
      penalty: Boolean(d.penaltyKick),
      ownGoal: Boolean(d.ownGoal),
      assist,
    });
  }

  // Extract quick stats directly from scoreboard competitor statistics when available
  const homeStatsMap = new Map<string, string>();
  for (const s of home?.statistics || []) {
    if (s?.name && s.displayValue != null) {
      homeStatsMap.set(String(s.name), String(s.displayValue));
    }
  }
  const awayStatsMap = new Map<string, string>();
  for (const s of away?.statistics || []) {
    if (s?.name && s.displayValue != null) {
      awayStatsMap.set(String(s.name), String(s.displayValue));
    }
  }

  const quickDefs: Array<[string, string, boolean?]> = [
    ['possessionPct', 'Posse', true],
    ['totalShots', 'Remates'],
    ['shotsOnTarget', 'No Alvo'],
    ['wonCorners', 'Cantos'],
    ['foulsCommitted', 'Faltas'],
    ['fieldGoalPct', 'FG%', true],
    ['rebounds', 'Ressaltos'],
    ['assists', 'Assistências'],
  ];

  const quickStats: MatchQuickStat[] = [];
  for (const [key, label, isPct] of quickDefs) {
    const h = homeStatsMap.get(key);
    const a = awayStatsMap.get(key);
    if (h != null && a != null) {
      quickStats.push({
        key,
        label,
        home: isPct && !h.endsWith('%') ? `${h}%` : h,
        away: isPct && !a.endsWith('%') ? `${a}%` : a,
      });
    }
  }

  return {
    espnEventId: String(ev.id || ''),
    espnSportPath,
    scorers,
    quickStats: quickStats.slice(0, 4),
    attendance: typeof comp.attendance === 'number' ? comp.attendance : null,
  };
}

// ─── Live Stream Correlation Helper (Tag de LIVE para Eventos) ───────────────

function normName(v?: string | null): string {
  if (!v) return '';
  return v
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(fc|sc|cf|ac|as|cd|ud|fk|sk|rb|club|clube|sport|sporting)\b/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

function extractNumericEspnId(id?: string | null): string | null {
  if (!id) return null;
  const m = id.match(/(?:espn-[a-z0-9]+-|real-live-)(\d{6,})/);
  return m ? m[1] : null;
}

export async function attachLiveTagsToEvents<
  T extends {
    id: string;
    title?: string | null;
    teamA?: string | null;
    teamB?: string | null;
    scheduledAt?: string | Date | null;
    matchDetails?: StoredMatchDetails | null;
  },
>(events: T[]): Promise<Array<T & { liveTag: LiveMatchTag | null }>> {
  if (events.length === 0) return [];

  const liveRows = await prisma
    .$queryRawUnsafe<
      Array<{
        id: string;
        title: string;
        team_a: string | null;
        team_b: string | null;
        status: string;
        viewer_count: number | null;
        scheduled_at: Date | null;
      }>
    >(
      `
        SELECT id, title, team_a, team_b, status::text, viewer_count, scheduled_at
        FROM "lives"
        WHERE COALESCE(archived, FALSE) = FALSE
          AND status IN ('live'::live_status, 'scheduled'::live_status)
          AND id NOT LIKE 'free-tv-%'
        ORDER BY (status = 'live'::live_status) DESC, viewer_count DESC
      `,
    )
    .catch(() => []);

  const byEspnNumeric = new Map<string, (typeof liveRows)[number]>();
  for (const l of liveRows) {
    const numId = extractNumericEspnId(l.id);
    if (numId && !byEspnNumeric.has(numId)) {
      byEspnNumeric.set(numId, l);
    }
  }

  return events.map((ev) => {
    const evNum =
      ev.matchDetails?.espnEventId || extractNumericEspnId(ev.id);
    let matched = evNum ? byEspnNumeric.get(evNum) : undefined;

    if (!matched && ev.teamA && ev.teamB) {
      const a = normName(ev.teamA);
      const b = normName(ev.teamB);
      if (a.length >= 3 && b.length >= 3) {
        matched = liveRows.find((l) => {
          // Team names alone also match rematches in other rounds or seasons.
          const eventTime = ev.scheduledAt ? new Date(ev.scheduledAt).getTime() : NaN;
          const liveTime = l.scheduled_at ? new Date(l.scheduled_at).getTime() : NaN;
          if (!Number.isFinite(eventTime) || !Number.isFinite(liveTime) || Math.abs(eventTime - liveTime) > 6 * 60 * 60 * 1000) return false;
          const la = normName(l.team_a);
          const lb = normName(l.team_b);
          if (!la || !lb) return false;
          const direct =
            (la.includes(a) || a.includes(la)) &&
            (lb.includes(b) || b.includes(lb));
          const swapped =
            (la.includes(b) || b.includes(la)) &&
            (lb.includes(a) || a.includes(lb));
          return direct || swapped;
        });
      }
    }

    const liveTag: LiveMatchTag | null = matched
      ? {
          liveId: matched.id,
          liveStatus: matched.status === 'live' ? 'live' : 'scheduled',
          liveTitle: matched.title,
          viewerCount: Number(matched.viewer_count || 0),
        }
      : null;

    return {
      ...ev,
      liveTag,
    };
  });
}

// ─── Full Real-Time Match Summary Fetcher (ESPN Summary API + Cache) ─────────

const summaryCache = new Map<
  string,
  { expiresAt: number; data: FullMatchSummaryPayload }
>();
const SUMMARY_TTL_MS = 90 * 1000; // 90s cache so live matches refresh rapidly

const ESPN_STAT_LABELS_PT: Record<string, string> = {
  possessionPct: 'Posse de bola',
  totalShots: 'Remates totais',
  shotsOnTarget: 'Remates à baliza',
  blockedShots: 'Remates bloqueados',
  wonCorners: 'Cantos',
  foulsCommitted: 'Faltas cometidas',
  offsides: 'Foras de jogo',
  saves: 'Defesas do guarda-redes',
  totalPasses: 'Total de passes',
  accuratePasses: 'Passes certos',
  passPct: 'Precisão de passe',
  totalCrosses: 'Cruzamentos',
  totalLongBalls: 'Bolas longas',
  totalTackles: 'Desarmes',
  effectiveTackles: 'Desarmes ganhos',
  interceptions: 'Interceções',
  totalClearance: 'Alívios',
  yellowCards: 'Cartões amarelos',
  redCards: 'Cartões vermelhos',
  penaltyKickGoals: 'Golos de penálti',
  // Basketball / NBA
  'fieldGoalsMade-fieldGoalsAttempted': 'Lançamentos convertidos (FG)',
  fieldGoalPct: 'Eficácia de lançamento (%)',
  'threePointFieldGoalsMade-threePointFieldGoalsAttempted': 'Triplos (3PT)',
  threePointFieldGoalPct: 'Eficácia de triplos (%)',
  'freeThrowsMade-freeThrowsAttempted': 'Lances livres (FT)',
  freeThrowPct: 'Eficácia de lances livres (%)',
  totalRebounds: 'Ressaltos totais',
  offensiveRebounds: 'Ressaltos ofensivos',
  defensiveRebounds: 'Ressaltos defensivos',
  assists: 'Assistências',
  steals: 'Roubos de bola',
  blocks: 'Desarmes de lançamento (Blocks)',
  turnovers: 'Perdas de bola (Turnovers)',
  pointsInPaint: 'Pontos no garrafão',
  fastBreakPoints: 'Pontos em contra-ataque',
};

const SPORT_FALLBACK_PATHS: Record<string, string[]> = {
  football: [
    'soccer/uefa.champions',
    'soccer/por.1',
    'soccer/eng.1',
    'soccer/esp.1',
    'soccer/ita.1',
    'soccer/ger.1',
    'soccer/fra.1',
    'soccer/bra.1',
    'soccer/uefa.europa',
    'soccer/uefa.europa.conf',
    'soccer/fifa.world',
    'soccer/conmebol.libertadores',
  ],
  basketball: ['basketball/nba'],
  ufc: ['mma/ufc'],
  f1: ['racing/f1'],
};

async function fetchJsonWithTimeout(url: string, timeoutMs = 9000): Promise<any | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'LiveSports-MatchCenter/2.0',
        Accept: 'application/json',
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function formatEspnStatDisplay(name: string, rawDisplay: string): string {
  if (name === 'possessionPct') {
    return rawDisplay.endsWith('%') ? rawDisplay : `${rawDisplay}%`;
  }
  if (name === 'passPct' || name === 'shotPct' || name === 'tacklePct' || name === 'crossPct' || name === 'longballPct') {
    const num = Number(rawDisplay);
    if (Number.isFinite(num) && num <= 1) {
      return `${Math.round(num * 100)}%`;
    }
    return rawDisplay.endsWith('%') ? rawDisplay : `${rawDisplay}%`;
  }
  if (name.endsWith('Pct') && !rawDisplay.endsWith('%')) {
    return `${rawDisplay}%`;
  }
  return rawDisplay;
}

function resolveEspnPathsForEvent(eventRow: any, storedDetails?: StoredMatchDetails | null): string[] {
  const paths: string[] = [];
  if (storedDetails?.espnSportPath) {
    paths.push(storedDetails.espnSportPath);
  }

  // Match by competition or league name in WATCHED_COMPETITIONS
  const leagueLower = String(eventRow?.league || '').toLowerCase();
  const compMatch = WATCHED_COMPETITIONS.find(
    (c) =>
      `comp-${c.slug}` === eventRow?.competition_id ||
      c.name.toLowerCase() === leagueLower ||
      c.sectionTitle.toLowerCase() === leagueLower,
  );
  if (compMatch && !paths.includes(compMatch.espnSportPath)) {
    paths.push(compMatch.espnSportPath);
  }

  const fallbacks = SPORT_FALLBACK_PATHS[String(eventRow?.sport || 'football')] || SPORT_FALLBACK_PATHS.football;
  for (const fb of fallbacks) {
    if (!paths.includes(fb)) paths.push(fb);
  }
  return paths;
}

function parseMinuteNumber(display?: string): { elapsed?: number; extra?: number | null } {
  if (!display) return {};
  const m = display.match(/(\d+)'?(?:\+(\d+))?/);
  if (!m) return {};
  return {
    elapsed: Number(m[1]),
    extra: m[2] ? Number(m[2]) : null,
  };
}

export async function fetchRichMatchSummaryForEvent(
  eventRow: any,
): Promise<FullMatchSummaryPayload> {
  let storedDetails: StoredMatchDetails | null = null;
  if (eventRow?.match_details) {
    storedDetails =
      typeof eventRow.match_details === 'string'
        ? JSON.parse(eventRow.match_details)
        : eventRow.match_details;
  }

  const espnId =
    storedDetails?.espnEventId || extractNumericEspnId(eventRow?.id);

  if (!espnId) {
    return {
      source: 'local',
      fixtureId: null,
      scorers: storedDetails?.scorers || [],
      statistics: [],
      timeline: [],
      lineups: [],
    };
  }

  const cacheKey = `${espnId}`;
  const cached = summaryCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const candidatePaths = resolveEspnPathsForEvent(eventRow, storedDetails);
  let rawSummary: any = null;
  let usedPath: string | null = null;

  for (const sportPath of candidatePaths.slice(0, 5)) {
    const url = `https://site.api.espn.com/apis/site/v2/sports/${sportPath}/summary?event=${encodeURIComponent(
      espnId,
    )}`;
    const json = await fetchJsonWithTimeout(url);
    if (json && (json.header || json.boxscore)) {
      rawSummary = json;
      usedPath = sportPath;
      break;
    }
  }

  if (!rawSummary) {
    return {
      source: 'espn-cached',
      fixtureId: espnId,
      scorers: storedDetails?.scorers || [],
      statistics: [],
      timeline: [],
      lineups: [],
    };
  }

  // Identify Home & Away teams from header
  const headerComp = rawSummary.header?.competitions?.[0] || {};
  const headerCompetitors: any[] = headerComp.competitors || [];
  const homeHeader =
    headerCompetitors.find((c) => c.homeAway === 'home') || headerCompetitors[0] || {};
  const awayHeader =
    headerCompetitors.find((c) => c.homeAway === 'away') || headerCompetitors[1] || {};
  const homeTeamId = String(homeHeader?.team?.id || homeHeader?.id || '');
  const homeTeamName =
    homeHeader?.team?.displayName || eventRow?.team_a || 'Equipa Casa';
  const awayTeamName =
    awayHeader?.team?.displayName || eventRow?.team_b || 'Equipa Visitante';
  const homeTeamLogo =
    homeHeader?.team?.logos?.[0]?.href || eventRow?.team_a_logo || undefined;
  const awayTeamLogo =
    awayHeader?.team?.logos?.[0]?.href || eventRow?.team_b_logo || undefined;

  // 1. Statistics (ordered Home first, Away second)
  const boxTeams: any[] = rawSummary.boxscore?.teams || [];
  const sortedBoxTeams = [...boxTeams].sort((a, b) => {
    const aIsHome =
      a.homeAway === 'home' || String(a.team?.id || '') === homeTeamId;
    const bIsHome =
      b.homeAway === 'home' || String(b.team?.id || '') === homeTeamId;
    if (aIsHome && !bIsHome) return -1;
    if (!aIsHome && bIsHome) return 1;
    return 0;
  });

  const preferredOrder = Object.keys(ESPN_STAT_LABELS_PT);
  const statistics: NormalizedTeamStatistics[] = sortedBoxTeams.map((bt) => {
    const rawStats: any[] = bt.statistics || [];
    const mapped: NormalizedStatisticItem[] = [];

    // First add stats in preferred visual order
    for (const key of preferredOrder) {
      const found = rawStats.find((s) => s.name === key);
      if (found && found.displayValue != null) {
        mapped.push({
          type: ESPN_STAT_LABELS_PT[key] || found.label || key,
          value: formatEspnStatDisplay(key, String(found.displayValue)),
        });
      }
    }

    // Add any remaining meaningful stats
    for (const s of rawStats) {
      if (!preferredOrder.includes(s.name) && s.label && s.displayValue != null) {
        mapped.push({
          type: String(s.label),
          value: formatEspnStatDisplay(String(s.name), String(s.displayValue)),
        });
      }
    }

    return {
      team: {
        name: bt.team?.displayName || bt.team?.shortDisplayName || 'Equipa',
        logo: bt.team?.logo || bt.team?.logos?.[0]?.href || undefined,
      },
      statistics: mapped,
    };
  });

  // 2. Scorers & Key Match Timeline (Goals, Penalties, Cards, Substitutions)
  const scorers: MatchScorerSummary[] = [];
  const timeline: NormalizedTimelineItem[] = [];

  const keyEvents: any[] = Array.isArray(rawSummary.keyEvents)
    ? rawSummary.keyEvents
    : [];

  if (keyEvents.length > 0) {
    for (const ke of keyEvents) {
      const rawType = String(ke.type?.text || '');
      if (/kickoff|half|end\s+of|start\s+of/i.test(rawType) && !ke.scoringPlay) {
        continue;
      }

      const clockDisplay = ke.clock?.displayValue || '';
      const parsedMin = parseMinuteNumber(clockDisplay);
      const evTeamId = String(ke.team?.id || '');
      const isHome = evTeamId && evTeamId === homeTeamId;
      const teamLogo = isHome ? homeTeamLogo : evTeamId ? awayTeamLogo : undefined;
      const teamName =
        ke.team?.displayName || (isHome ? homeTeamName : awayTeamName);

      const participants: any[] = ke.participants || [];
      const mainPlayer =
        participants[0]?.athlete?.displayName ||
        participants[0]?.athlete?.shortName ||
        undefined;
      const secondPlayer =
        participants[1]?.athlete?.displayName ||
        participants[1]?.athlete?.shortName ||
        null;

      const isGoal = Boolean(ke.scoringPlay);
      const isYellow = /yellow/i.test(rawType);
      const isRed = /red/i.test(rawType);
      const isSub = /substitution/i.test(rawType);
      const isPenalty = /penalty/i.test(rawType);
      const isOwnGoal = /own\s+goal/i.test(rawType);

      let typePt = rawType || 'Lance';
      if (isGoal) {
        typePt = isPenalty
          ? 'Golo (Penálti)'
          : isOwnGoal
            ? 'Auto-golo'
            : 'Golo';
        scorers.push({
          player: mainPlayer || ke.shortText || 'Marcador',
          minute: clockDisplay,
          teamSide: isHome ? 'home' : 'away',
          teamName,
          penalty: isPenalty,
          ownGoal: isOwnGoal,
          assist: secondPlayer,
        });
      } else if (isYellow) {
        typePt = 'Cartão Amarelo';
      } else if (isRed) {
        typePt = 'Cartão Vermelho';
      } else if (isSub) {
        typePt = 'Substituição';
      }

      timeline.push({
        time: {
          elapsed: parsedMin.elapsed,
          extra: parsedMin.extra,
          display: clockDisplay || '-',
        },
        team: {
          name: teamName,
          logo: teamLogo,
          side: isHome ? 'home' : 'away',
        },
        player: {
          name: mainPlayer,
        },
        assist: secondPlayer ? { name: secondPlayer } : undefined,
        type: typePt,
        detail: isSub && secondPlayer ? `Sai: ${secondPlayer}` : undefined,
        comments: ke.text || null,
        scoringPlay: isGoal,
        yellowCard: isYellow,
        redCard: isRed,
        substitution: isSub,
      });
    }
  } else if (Array.isArray(headerComp.details)) {
    // Fallback to header details if keyEvents is empty
    for (const d of headerComp.details) {
      const clockDisplay = d.clock?.displayValue || '';
      const parsedMin = parseMinuteNumber(clockDisplay);
      const evTeamId = String(d.team?.id || '');
      const isHome = evTeamId === homeTeamId;
      const p0 = d.participants?.[0]?.athlete?.displayName;
      const p1 = d.participants?.[1]?.athlete?.displayName || null;

      if (d.scoringPlay) {
        scorers.push({
          player: p0 || 'Marcador',
          minute: clockDisplay,
          teamSide: isHome ? 'home' : 'away',
          teamName: isHome ? homeTeamName : awayTeamName,
          penalty: Boolean(d.penaltyKick),
          ownGoal: Boolean(d.ownGoal),
          assist: p1,
        });
      }

      timeline.push({
        time: {
          elapsed: parsedMin.elapsed,
          extra: parsedMin.extra,
          display: clockDisplay || '-',
        },
        team: {
          name: isHome ? homeTeamName : awayTeamName,
          logo: isHome ? homeTeamLogo : awayTeamLogo,
          side: isHome ? 'home' : 'away',
        },
        player: { name: p0 },
        assist: p1 ? { name: p1 } : undefined,
        type: d.scoringPlay ? 'Golo' : d.redCard ? 'Cartão Vermelho' : 'Cartão Amarelo',
        scoringPlay: Boolean(d.scoringPlay),
        redCard: Boolean(d.redCard),
      });
    }
  }

  // 3. Lineups & Player Match Stats (Starters + Bench)
  const rosters: any[] = Array.isArray(rawSummary.rosters) ? rawSummary.rosters : [];
  const sortedRosters = [...rosters].sort((a, b) => {
    if (a.homeAway === 'home' && b.homeAway !== 'home') return -1;
    if (a.homeAway !== 'home' && b.homeAway === 'home') return 1;
    return 0;
  });

  const lineups: NormalizedTeamLineup[] = sortedRosters.map((r) => {
    const entries: any[] = Array.isArray(r.roster) ? r.roster : [];
    const mapPlayer = (entry: any): NormalizedLineupPlayer => {
      const pStats = new Map<string, number>();
      for (const st of entry.stats || []) {
        if (st?.name && typeof st.value === 'number') {
          pStats.set(st.name, st.value);
        }
      }
      return {
        player: {
          id: entry.athlete?.id,
          name: entry.athlete?.displayName || entry.athlete?.shortName || 'Jogador',
          number: entry.jersey || undefined,
          pos: entry.position?.abbreviation || undefined,
          starter: Boolean(entry.starter),
          subbedIn: Boolean(entry.subbedIn),
          subbedOut: Boolean(entry.subbedOut),
          goals: pStats.get('totalGoals') || 0,
          assists: pStats.get('goalAssists') || 0,
          yellowCards: pStats.get('yellowCards') || 0,
          redCards: pStats.get('redCards') || 0,
          saves: pStats.get('saves') || 0,
          shots: pStats.get('totalShots') || 0,
        },
      };
    };

    const starters = entries.filter((e) => e.starter).map(mapPlayer);
    const bench = entries
      .filter((e) => !e.starter && (e.subbedIn || entries.length <= 26))
      .map(mapPlayer);

    return {
      team: {
        name: r.team?.displayName || 'Equipa',
        logo: r.team?.logo || r.team?.logos?.[0]?.href || undefined,
      },
      formation: r.formation || undefined,
      startXI: starters.length > 0 ? starters : entries.slice(0, 11).map(mapPlayer),
      substitutes: bench,
    };
  });

  // 4. Individual Leaders (especially useful for NBA / Basketball & Football)
  const leaders: FullMatchSummaryPayload['leaders'] = [];
  if (Array.isArray(rawSummary.leaders)) {
    for (const teamGroup of rawSummary.leaders) {
      const tName = teamGroup?.team?.displayName || '';
      const tLogo = teamGroup?.team?.logos?.[0]?.href || teamGroup?.team?.logo;
      for (const cat of teamGroup?.leaders || []) {
        const top = cat?.leaders?.[0];
        if (top?.athlete?.displayName && top?.displayValue) {
          leaders.push({
            teamName: tName,
            teamLogo: tLogo,
            category: cat.displayName || cat.name || 'Destaque',
            playerName: top.athlete.displayName,
            displayValue: String(top.displayValue),
          });
        }
      }
    }
  }

  // Persist freshly discovered scorers back into `events.match_details` if not yet saved
  if (scorers.length > 0 && (!storedDetails?.scorers || storedDetails.scorers.length === 0) && eventRow?.id) {
    const updatedDetails: StoredMatchDetails = {
      espnEventId: espnId,
      espnSportPath: usedPath || storedDetails?.espnSportPath,
      scorers,
      quickStats: storedDetails?.quickStats || [],
      attendance: rawSummary.gameInfo?.attendance ?? null,
    };
    prisma
      .$executeRawUnsafe(
        `UPDATE "events" SET "match_details" = $2::jsonb WHERE "id" = $1`,
        eventRow.id,
        JSON.stringify(updatedDetails),
      )
      .catch(() => {});
  }

  const result: FullMatchSummaryPayload = {
    source: 'espn-v2-summary',
    fixtureId: espnId,
    espnSportPath: usedPath,
    venue: rawSummary.gameInfo?.venue
      ? {
          name: rawSummary.gameInfo.venue.fullName || null,
          city: rawSummary.gameInfo.venue.address?.city || null,
          country: rawSummary.gameInfo.venue.address?.country || null,
          attendance: rawSummary.gameInfo.attendance || null,
        }
      : null,
    scorers: scorers.length > 0 ? scorers : storedDetails?.scorers || [],
    statistics,
    timeline,
    lineups,
    leaders,
  };

  summaryCache.set(cacheKey, {
    expiresAt: Date.now() + SUMMARY_TTL_MS,
    data: result,
  });

  return result;
}
