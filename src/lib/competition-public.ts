import type { Competition, CompetitionGroup, PublicCompetitionEvent, PublicCompetitionPage, PublicCompetitionSummary } from "@/types";
import { resolveCountryFlagUrl } from "@/lib/flags";
import { SERVER_API_URL } from "@/lib/server-api";

export const DEFAULT_COMPETITION_SLUG = "copa-do-mundo";

function publicApiUrl(path: string) {
  // In the browser, always go through the relative /api path so the Next.js
  // rewrite (next.config.ts) proxies the request server-side to the backend.
  // Calling NEXT_PUBLIC_API_URL directly from the browser breaks in Docker,
  // where that value is an internal hostname (e.g. http://backend:3001) that
  // only resolves inside the compose network, not from the user's machine.
  if (typeof window !== "undefined") {
    return `/api${path}`;
  }
  return `${SERVER_API_URL}${path}`;
}

export async function fetchPublicCompetitions(): Promise<PublicCompetitionSummary[]> {
  try {
    const response = await fetch(publicApiUrl("/competitions/public"), { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok || payload.success === false) return [];
    return (payload.data || []) as PublicCompetitionSummary[];
  } catch {
    return [];
  }
}

export async function fetchPublicCompetition(slug = DEFAULT_COMPETITION_SLUG): Promise<PublicCompetitionPage | null> {
  try {
    const response = await fetch(`${SERVER_API_URL}/competitions/public/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    const payload = await response.json();
    if (!response.ok || payload.success === false) return null;
    return payload.data as PublicCompetitionPage;
  } catch {
    return null;
  }
}

export function getCompetitionHero(competition: Competition) {
  return {
    badge: competition.heroBadge || competition.name,
    badgeIcon: competition.heroBadgeIcon || "🏆",
    titleLine1: competition.heroTitleLine1 || competition.name,
    titleLine2: competition.heroTitleLine2 || competition.season || "",
    description: competition.heroDescription || competition.description || "",
    statTeams: competition.statTeams ?? 0,
    statGames: competition.statGames ?? 0,
    statHostCountries: competition.statHostCountries ?? 0,
    statStadiums: competition.statStadiums ?? 0,
    hostCountries: competition.hostCountries || "",
    sectionTitle: competition.sectionTitle || competition.name,
    season: competition.season || "",
    ctaTitle: competition.ctaTitle || "",
    ctaDescription: competition.ctaDescription || "",
    ctaButtonText: competition.ctaButtonText || "",
  };
}

export type WCMatchStatus = "scheduled" | "in_play" | "finished";

export interface WCMatchView {
  id: string;
  home_team: { name: string; code: string; flag?: string };
  away_team: { name: string; code: string; flag?: string };
  home_score?: number;
  away_score?: number;
  status: WCMatchStatus;
  datetime: string;
  stage: string;
  venue?: string;
}

const STATUS_MAP: Record<PublicCompetitionEvent["status"], WCMatchStatus> = {
  upcoming: "scheduled",
  live: "in_play",
  finished: "finished",
  cancelled: "scheduled",
};

export function mapPublicEventToMatch(event: PublicCompetitionEvent): WCMatchView {
  return {
    id: event.id,
    home_team: {
      name: event.teamA || "Time A",
      code: event.teamACode || "",
      flag: resolveCountryFlagUrl({
        code: event.teamACode,
        name: event.teamA,
        logo: event.teamALogo,
        size: 64,
      }) || event.teamALogo || undefined,
    },
    away_team: {
      name: event.teamB || "Time B",
      code: event.teamBCode || "",
      flag: resolveCountryFlagUrl({
        code: event.teamBCode,
        name: event.teamB,
        logo: event.teamBLogo,
        size: 64,
      }) || event.teamBLogo || undefined,
    },
    home_score: event.scoreA ?? undefined,
    away_score: event.scoreB ?? undefined,
    status: STATUS_MAP[event.status] || "scheduled",
    datetime: event.scheduledAt,
    stage: event.stage || (event.groupName ? `Grupo ${event.groupName}` : ""),
    venue: event.venue || undefined,
  };
}

export function normalizeGroups(groups: CompetitionGroup[] | null | undefined): CompetitionGroup[] {
  if (!Array.isArray(groups)) return [];
  return groups.map((group) => ({
    ...group,
    teams: group.teams.map((team) => ({
      ...team,
      flag:
        resolveCountryFlagUrl({
          code: team.code,
          name: team.name,
          logo: team.flag,
          size: 32,
        }) || team.flag,
    })),
  }));
}
