"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Star, Globe, ChevronRight, Zap, Calendar, MapPin, BarChart3, Radio } from "lucide-react";
import { useLang } from "@/lib/lang";
import {
  DEFAULT_COMPETITION_SLUG,
  fetchPublicCompetitions,
  getCompetitionHero,
  mapPublicEventToMatch,
  normalizeGroups,
  type WCMatchView,
} from "@/lib/competition-public";
import { resolveCountryFlagUrl } from "@/lib/flags";
import type { CompetitionGroup, PublicCompetitionPage, PublicCompetitionSummary } from "@/types";
import { WorldCupCtaBanner } from "@/components/landing/WorldCupHero";
import CompetitionCarousel from "@/components/landing/CompetitionCarousel";
import { competitionThemeStyle, getCompetitionTheme } from "@/lib/competition-theme";
import AdSlot from "@/components/ads/AdSlot";
import ResilientLogo from "@/components/ui/ResilientLogo";
import EventCover from "@/components/ui/EventCover";

// Always use the relative /api path here — this runs in the browser, and
// Next.js's rewrite (next.config.ts) proxies it server-side to the backend.
// Building the URL from NEXT_PUBLIC_API_URL directly breaks in Docker, since
// that value is an internal hostname (e.g. http://backend:3001) the browser
// cannot resolve.

interface WCTeam {
  id: string;
  name: string;
  code: string;
  flag?: string;
  group: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  points: number;
}

const STATUS_COLOR = {
  scheduled: "text-red-400 bg-red-400/10 border-red-400/20",
  in_play: "text-[#E50914] bg-[#E50914]/10 border-[#E50914]/30",
  finished: "text-gray-400 bg-gray-400/10 border-gray-400/20",
};
const STATUS_LABEL_PT = {
  scheduled: "Agendado",
  in_play: "AO VIVO",
  finished: "Encerrado",
};
const STATUS_LABEL_EN = {
  scheduled: "Scheduled",
  in_play: "LIVE",
  finished: "Finished",
};

function formatDate(iso: string, lang: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(lang === "pt" ? "pt-PT" : "en-US", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MatchCard({ match, lang, sport }: { match: WCMatchView; lang: string; competitionSlug: string; sport?: string }) {
  const isLive = match.status === "in_play";
  const statusLabels = lang === "pt" ? STATUS_LABEL_PT : STATUS_LABEL_EN;
  const scorers = match.matchDetails?.scorers || [];
  const homeScorers = scorers.filter((s) => s.teamSide === "home");
  const awayScorers = scorers.filter((s) => s.teamSide === "away");
  const quickStats = match.matchDetails?.quickStats || [];
  const hasLiveStream = Boolean(match.liveTag?.liveId);

  const renderFlag = (flag?: string, code?: string, name?: string) => {
    const isUrl = Boolean(flag && /^(https?:|data:|\/)/.test(flag));
    if (isUrl || code || name) {
      return (
        <ResilientLogo
          src={isUrl ? flag : undefined}
          code={code}
          name={name}
          kind="country"
          size={64}
          alt={name || ""}
          className="h-9 w-9 rounded-full object-contain bg-white/[0.04] p-0.5"
        />
      );
    }
    if (flag) return <span className="text-3xl">{flag}</span>;
    return null;
  };

  return (
    <div
      className={`wc-card group relative rounded-2xl p-4 transition-all hover:border-[#E50914]/50 hover:-translate-y-0.5 flex flex-col justify-between ${
        isLive || hasLiveStream ? "neon-border" : ""
      }`}
    >
      <div>
        <Link href={`/evento/${encodeURIComponent(match.id)}`} aria-label={match.home_team.name + " vs " + match.away_team.name} className="block -mx-4 -mt-4 mb-3 overflow-hidden rounded-t-2xl">
          <EventCover src={match.thumbnail} leagueLogo={match.leagueLogo} sport={sport} className="h-24" />
        </Link>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 truncate">
            {match.stage}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {hasLiveStream && (
              <Link
                href={`/watch/${match.liveTag!.liveId}`}
                className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border flex items-center gap-1 transition-all ${
                  match.liveTag!.liveStatus === "live"
                    ? "bg-[#E50914] text-white border-[#E50914] shadow-[0_0_12px_rgba(229,9,20,0.45)] hover:bg-[#ff1f2a]"
                    : "bg-emerald-500/15 text-emerald-300 border-emerald-500/35 hover:bg-emerald-500/25"
                }`}
                title={match.liveTag!.liveTitle}
              >
                <Radio className="h-2.5 w-2.5 animate-pulse" />
                {match.liveTag!.liveStatus === "live"
                  ? "LIVE"
                  : lang === "pt"
                    ? "TEM LIVE"
                    : "STREAM"}
              </Link>
            )}
            <span
              className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${STATUS_COLOR[match.status]} flex items-center gap-1.5`}
            >
              {isLive && <span className="live-badge h-1.5 w-1.5 rounded-full bg-[#E50914]" />}
              {statusLabels[match.status]}
            </span>
          </div>
        </div>

        <Link href={`/evento/${encodeURIComponent(match.id)}`} className="block">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className="flex flex-col items-center gap-2">
              {renderFlag(match.home_team.flag, match.home_team.code, match.home_team.name)}
              <span className="text-xs font-bold text-white text-center leading-tight group-hover:text-red-100">
                {match.home_team.name}
              </span>
            </div>

            <div className="flex flex-col items-center gap-1 px-2">
              {match.status !== "scheduled" ? (
                <div className="text-3xl font-black text-white score-display">
                  {match.home_score ?? 0} – {match.away_score ?? 0}
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-sm font-black text-gray-400 mb-0.5">VS</div>
                </div>
              )}
              <span className="text-[10px] text-gray-500 flex items-center gap-1">
                <Calendar className="h-2.5 w-2.5" />
                {formatDate(match.datetime, lang)}
              </span>
            </div>

            <div className="flex flex-col items-center gap-2">
              {renderFlag(match.away_team.flag, match.away_team.code, match.away_team.name)}
              <span className="text-xs font-bold text-white text-center leading-tight group-hover:text-red-100">
                {match.away_team.name}
              </span>
            </div>
          </div>

          {scorers.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-white/[0.06] grid grid-cols-2 gap-2 text-[10px] leading-snug">
              <div className="space-y-0.5 text-left text-gray-300">
                {homeScorers.slice(0, 4).map((s, idx) => (
                  <div key={idx} className="truncate">
                    <span className="text-emerald-400 mr-1">⚽</span>
                    <span className="font-semibold text-gray-200">{s.player}</span>{" "}
                    <span className="text-gray-500">{s.minute}</span>
                    {s.penalty ? <span className="text-amber-400 ml-0.5">(P)</span> : null}
                    {s.ownGoal ? <span className="text-red-400 ml-0.5">(AG)</span> : null}
                  </div>
                ))}
              </div>
              <div className="space-y-0.5 text-right text-gray-300">
                {awayScorers.slice(0, 4).map((s, idx) => (
                  <div key={idx} className="truncate">
                    <span className="font-semibold text-gray-200">{s.player}</span>{" "}
                    <span className="text-gray-500">{s.minute}</span>
                    {s.penalty ? <span className="text-amber-400 ml-0.5">(P)</span> : null}
                    {s.ownGoal ? <span className="text-red-400 ml-0.5">(AG)</span> : null}
                    <span className="text-emerald-400 ml-1">⚽</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {quickStats.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-white/[0.05] flex items-center justify-around gap-1.5 text-[10px]">
              {quickStats.slice(0, 3).map((st) => (
                <div
                  key={st.key}
                  className="flex flex-col items-center px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.05] min-w-[68px]"
                >
                  <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">
                    {st.label}
                  </span>
                  <span className="font-bold text-gray-200">
                    {st.home} <span className="text-gray-600">·</span> {st.away}
                  </span>
                </div>
              ))}
            </div>
          )}

          {match.venue ? (
            <div className="mt-2.5 flex items-center justify-center gap-1 text-[10px] text-gray-500 truncate">
              <MapPin className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{match.venue}</span>
            </div>
          ) : null}
        </Link>
      </div>

      <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center gap-2">
        <Link
          href={`/evento/${encodeURIComponent(match.id)}`}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-gray-200 text-[11px] font-bold hover:bg-white/[0.09] hover:text-white transition-all"
        >
          <BarChart3 className="h-3.5 w-3.5 text-[#E50914]" />
          {lang === "pt" ? "Estatísticas completas" : "Full statistics"}
        </Link>
        {hasLiveStream && (
          <Link
            href={`/watch/${match.liveTag!.liveId}`}
            className="flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg bg-[#E50914]/15 border border-[#E50914]/35 text-[#E50914] text-[11px] font-black hover:bg-[#E50914] hover:text-white transition-all shrink-0"
          >
            <Zap className="h-3 w-3" />
            {lang === "pt" ? "Assistir" : "Watch"}
          </Link>
        )}
      </div>
    </div>
  );
}

function LeagueTable({ teams, lang, accent }: { teams: WCTeam[]; lang: string; accent: string }) {
  return (
    <div className="rounded-xl border border-[#1E1E2A] overflow-hidden bg-[#0E0E16]/80">
      <div className="flex items-center gap-2 px-3 py-2 bg-[#111118] border-b border-[#1E1E2A]">
        <Trophy className="h-3.5 w-3.5" style={{ color: accent }} />
        <span className="text-xs font-black text-white uppercase tracking-widest">
          {lang === "pt" ? "Classificação" : "Standings"}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[480px]">
          <thead>
            <tr className="text-gray-600 uppercase tracking-widest">
              <th className="text-left px-3 py-1.5 font-semibold">#</th>
              <th className="text-left px-3 py-1.5 font-semibold">{lang === "pt" ? "Equipa" : "Team"}</th>
              <th className="px-2 py-1.5 font-semibold">J</th>
              <th className="px-2 py-1.5 font-semibold">V</th>
              <th className="px-2 py-1.5 font-semibold">E</th>
              <th className="px-2 py-1.5 font-semibold">D</th>
              <th className="px-2 py-1.5 font-semibold">GM</th>
              <th className="px-2 py-1.5 font-semibold">GS</th>
              <th className="px-2 py-1.5 font-semibold" style={{ color: accent }}>
                Pts
              </th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, i) => (
              <tr key={team.id} className={`border-t border-[#1E1E2A]/60 ${i < 4 ? "text-white" : "text-gray-500"}`}>
                <td className="px-3 py-2 text-center font-bold text-gray-500">{i + 1}</td>
                <td className="px-3 py-2 flex items-center gap-2">
                  {(() => {
                    const isUrl = Boolean(team.flag && /^(https?:|data:|\/)/.test(team.flag));
                    if (isUrl || team.code || team.name) {
                      return (
                        <ResilientLogo
                          src={isUrl ? team.flag : undefined}
                          code={team.code}
                          name={team.name}
                          kind="country"
                          size={32}
                          alt={team.name}
                          className="h-5 w-5 rounded-full object-cover"
                        />
                      );
                    }
                    if (team.flag) return <span>{team.flag}</span>;
                    return null;
                  })()}
                  <span className="font-semibold">{team.name}</span>
                </td>
                <td className="px-2 py-2 text-center">{team.played}</td>
                <td className="px-2 py-2 text-center">{team.wins}</td>
                <td className="px-2 py-2 text-center">{team.draws}</td>
                <td className="px-2 py-2 text-center">{team.losses}</td>
                <td className="px-2 py-2 text-center">{team.gf}</td>
                <td className="px-2 py-2 text-center">{team.ga}</td>
                <td
                  className={`px-2 py-2 text-center font-black ${i < 4 ? "" : ""}`}
                  style={i < 4 ? { color: accent } : undefined}
                >
                  {team.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GroupTable({ group, teams, accent }: { group: string; teams: WCTeam[]; accent: string }) {
  const headerLabel = /^[A-Z0-9]{1,3}$/.test(group) ? `Grupo ${group}` : group;
  return (
    <div className="rounded-xl border border-[#1E1E2A] overflow-hidden bg-[#0E0E16]/80">
      <div className="flex items-center gap-2 px-3 py-2 bg-[#111118] border-b border-[#1E1E2A]">
        <Trophy className="h-3.5 w-3.5" style={{ color: accent }} />
        <span className="text-xs font-black text-white uppercase tracking-widest">{headerLabel}</span>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-gray-600 uppercase tracking-widest">
            <th className="text-left px-3 py-1.5 font-semibold">País</th>
            <th className="px-2 py-1.5 font-semibold">J</th>
            <th className="px-2 py-1.5 font-semibold">V</th>
            <th className="px-2 py-1.5 font-semibold">E</th>
            <th className="px-2 py-1.5 font-semibold">D</th>
            <th className="px-2 py-1.5 font-semibold" style={{ color: accent }}>
              Pts
            </th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team, i) => (
            <tr key={team.id} className={`border-t border-[#1E1E2A]/60 ${i < 2 ? "text-white" : "text-gray-500"}`}>
              <td className="px-3 py-2 flex items-center gap-2">
                {(() => {
                  const isUrl = Boolean(team.flag && /^(https?:|data:|\/)/.test(team.flag));
                  if (isUrl || team.code || team.name) {
                    return (
                      <ResilientLogo
                        src={isUrl ? team.flag : undefined}
                        code={team.code}
                        name={team.name}
                        kind="country"
                        size={32}
                        alt={team.name}
                        className="h-5 w-7 rounded-sm object-cover"
                      />
                    );
                  }
                  if (team.flag) return <span>{team.flag}</span>;
                  return null;
                })()}
                <span className="font-semibold truncate max-w-[70px]">{team.name}</span>
                {i < 2 && <span className="ml-auto w-1 h-full bg-green-500 rounded-full" />}
              </td>
              <td className="px-2 py-2 text-center">{team.played}</td>
              <td className="px-2 py-2 text-center">{team.wins}</td>
              <td className="px-2 py-2 text-center">{team.draws}</td>
              <td className="px-2 py-2 text-center">{team.losses}</td>
              <td
                className={`px-2 py-2 text-center font-black ${i < 2 ? "" : ""}`}
                style={i < 2 ? { color: accent } : undefined}
              >
                {team.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface WorldCupSectionProps {
  slug?: string;
  initialData?: PublicCompetitionPage | null;
  showTopAd?: boolean;
}

export default function WorldCupSection({
  slug,
  initialData = null,
  showTopAd = false,
}: WorldCupSectionProps) {
  const { lang } = useLang();
  const [activeTab, setActiveTab] = useState<"matches" | "standings">("matches");
  const [selectedSlug, setSelectedSlug] = useState(slug || DEFAULT_COMPETITION_SLUG);
  const [competitions, setCompetitions] = useState<PublicCompetitionSummary[]>([]);
  const [loadingCompetitions, setLoadingCompetitions] = useState(true);
  const [pageData, setPageData] = useState<PublicCompetitionPage | null>(initialData);
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    if (slug) setSelectedSlug(slug);
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    fetchPublicCompetitions()
      .then((items) => {
        if (cancelled) return;
        setCompetitions(items);
        // No explicit slug was requested by the parent (e.g. the homepage),
        // so follow whichever competition an admin flagged as featured.
        // The list is already ordered featured-first by the API, so the
        // first item is the right fallback when nothing is flagged.
        if (!slug && items.length > 0) {
          const featured = items.find((c) => c.isFeaturedCard) || items[0];
          setSelectedSlug(featured.slug);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingCompetitions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (initialData && selectedSlug === slug) {
      setPageData(initialData);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`/api/competitions/public/${encodeURIComponent(selectedSlug)}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((payload) => {
        if (cancelled) return;
        if (payload.success && payload.data) setPageData(payload.data as PublicCompetitionPage);
        else setPageData(null);
      })
      .catch(() => {
        if (!cancelled) setPageData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedSlug, slug, initialData]);

  const handleSelectCompetition = (nextSlug: string) => {
    if (nextSlug === selectedSlug) return;
    setSelectedSlug(nextSlug);
  };

  useEffect(() => {
    if (!pageData) return;
    const hasEvents = (pageData.events || []).length > 0;
    const hasGroups = Array.isArray(pageData.groups) && pageData.groups.length > 0;
    if (!hasEvents && hasGroups) {
      setActiveTab("standings");
    } else if (hasEvents && !hasGroups && activeTab === "standings") {
      setActiveTab("matches");
    }
  }, [pageData, activeTab]);

  const competition = pageData?.competition;
  const format = competition?.format || "groups";
  const hero = competition ? getCompetitionHero(competition) : null;
  const matches = (pageData?.events || []).map(mapPublicEventToMatch);
  const groups = normalizeGroups(pageData?.groups as CompetitionGroup[]);
  const leagueTeams = groups.flatMap((g) => g.teams);
  const showStandingsTab =
    format === "groups" || format === "league" || groups.length > 0;

  const theme = getCompetitionTheme(competition);

  const tabs = [
    { id: "matches" as const, label: lang === "pt" ? "Jogos" : "Matches" },
    ...(showStandingsTab
      ? [
          {
            id: "standings" as const,
            label:
              format === "league"
                ? lang === "pt"
                  ? "Classificação"
                  : "Standings"
                : lang === "pt"
                  ? "Grupos"
                  : "Groups",
          },
        ]
      : []),
  ];

  return (
    <section
      className="relative overflow-hidden py-10 lg:py-16"
      style={competitionThemeStyle(competition)}
    >
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute top-0 left-1/2 h-[400px] w-[800px] -translate-x-1/2 rounded-full blur-[100px]"
          style={{ background: theme.glow }}
        />
        <div className="absolute inset-0 grid-bg opacity-20" />
      </div>

      <div className={`relative mx-auto max-w-[1400px] px-4 lg:px-6 ${showTopAd ? "-mt-10" : ""}`}>
        {showTopAd ? (
          <div className="relative z-10 mb-8">
            <AdSlot position="in_content" variant="embedded" />
          </div>
        ) : null}

        <CompetitionCarousel
          competitions={competitions}
          selectedSlug={selectedSlug}
          onSelect={handleSelectCompetition}
          loading={loadingCompetitions}
        />

        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white p-2 shadow-lg">
                <ResilientLogo
                  src={competition?.thumbnail}
                  name={competition?.name || hero?.sectionTitle}
                  kind="league"
                  size={56}
                  alt={competition?.name || ""}
                  className="max-h-full max-w-full"
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <h2
                  className="text-2xl font-black text-white lg:text-3xl"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {hero?.sectionTitle || "Competição"}
                </h2>
                {hero?.season ? (
                  <span
                    className="rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider"
                    style={{ borderColor: theme.border, background: theme.badgeBg, color: theme.primary }}
                  >
                    {hero.season}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                {hero?.hostCountries ? (
                  <span className="flex items-center gap-1.5">
                    <Globe className="h-3 w-3" style={{ color: theme.primary }} />
                    {hero.hostCountries}
                  </span>
                ) : null}
                {(hero?.statTeams || 0) > 0 || (hero?.statGames || 0) > 0 ? (
                  <span className="flex items-center gap-1.5">
                    <Star className="h-3 w-3" style={{ color: theme.primary }} />
                    {lang === "pt"
                      ? `${hero?.statTeams || 0} seleções · ${hero?.statGames || 0} jogos`
                      : `${hero?.statTeams || 0} nations · ${hero?.statGames || 0} matches`}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <Link
            href={`/competicao/${selectedSlug}`}
            className="flex items-center gap-2 text-sm font-bold transition-opacity hover:opacity-80"
            style={{ color: theme.primary }}
          >
            {lang === "pt" ? "Ver completo" : "See all"}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="flex items-center gap-1 mb-6 bg-[#0E0E16] border border-[#1E1E2A] rounded-xl p-1 w-fit" role="tablist" aria-label={lang === "pt" ? "Ver jogos ou classificação" : "View matches or standings"}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              id={`wc-tab-${tab.id}`}
              aria-controls={`wc-tabpanel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-[#E50914] to-[#B00000] text-white shadow-red"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-gray-500">A carregar competição...</div>
        ) : null}

        {!loading && activeTab === "matches" && (
          <div>
            {format === "knockout" && <p className="mb-4 text-sm text-gray-400">Jogos das eliminatórias por fase, conforme publicados pela fonte. O percurso entre fases não é presumido.</p>}
            {matches.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-500">
                {['girabola', 'taca-angola-futebol', 'unitel-basket', 'taca-angola-basquetebol', 'basketball-africa-league'].includes(selectedSlug)
                  ? 'Ainda não há dados sincronizados para esta competição. É necessária uma fonte de dados compatível.'
                  : 'Jogos indisponíveis de momento. Consulte novamente quando houver dados disponíveis.'}
              </div>
            ) : format === "knockout" ? (
              Object.entries(matches.reduce<Record<string, WCMatchView[]>>((stages, match) => {
                const stage = match.stage || (lang === "pt" ? "Fase não informada" : "Round unavailable");
                (stages[stage] ||= []).push(match);
                return stages;
              }, {})).map(([stage, games]) => (
                <section key={stage} className="mb-7">
                  <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-white">{stage}</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {games.map((match) => <MatchCard key={match.id} match={match} lang={lang} competitionSlug={selectedSlug} sport={competition?.sport} />)}
                  </div>
                </section>
              ))
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {matches.map((match) => <MatchCard key={match.id} match={match} lang={lang} competitionSlug={selectedSlug} sport={competition?.sport} />)}
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === "standings" && format === "league" && (
          <div>
            {leagueTeams.length > 0 ? (
              <LeagueTable teams={leagueTeams} lang={lang} accent={theme.primary} />
            ) : (
              <div className="py-12 text-center text-sm text-gray-500">
                {lang === "pt"
                  ? "Nenhuma classificação configurada. Edite a competição no admin."
                  : "No standings configured. Edit the competition in admin."}
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === "standings" && format === "groups" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.length > 0 ? (
              groups.map((g) => <GroupTable key={g.group} group={g.group} teams={g.teams} accent={theme.primary} />)
            ) : (
              <div className="col-span-full py-12 text-center text-sm text-gray-500">
                {lang === "pt"
                  ? "Nenhum grupo configurado. Edite a competição no admin."
                  : "No groups configured. Edit the competition in admin."}
              </div>
            )}
          </div>
        )}

        {competition ? <WorldCupCtaBanner competition={competition} competitionSlug={selectedSlug} /> : null}
      </div>
    </section>
  );
}
