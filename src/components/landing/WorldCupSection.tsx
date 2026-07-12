"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Star, Globe, ChevronRight, Zap, Calendar, MapPin } from "lucide-react";
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

function MatchCard({ match, lang, competitionSlug }: { match: WCMatchView; lang: string; competitionSlug: string }) {
  const isLive = match.status === "in_play";
  const statusLabels = lang === "pt" ? STATUS_LABEL_PT : STATUS_LABEL_EN;
  const renderFlag = (flag?: string, code?: string, name?: string) => {
    const url =
      resolveCountryFlagUrl({ code, name, logo: flag, size: 64 }) ||
      (flag && /^(https?:|data:|\/)/.test(flag) ? flag : null);
    if (url) {
      return <img src={url} alt="" className="h-8 w-8 rounded-full object-cover" />;
    }
    if (flag) return <span className="text-3xl">{flag}</span>;
    return null;
  };

  return (
    <div className={`wc-card rounded-2xl p-4 transition-all ${isLive ? "neon-border" : ""}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{match.stage}</span>
        <span
          className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${STATUS_COLOR[match.status]} flex items-center gap-1.5`}
        >
          {isLive && <span className="live-badge h-1.5 w-1.5 rounded-full bg-[#E50914]" />}
          {statusLabels[match.status]}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex flex-col items-center gap-2">
          {renderFlag(match.home_team.flag, match.home_team.code, match.home_team.name)}
          <span className="text-xs font-bold text-white text-center leading-tight">{match.home_team.name}</span>
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
          <span className="text-[10px] text-gray-600 flex items-center gap-1">
            <Calendar className="h-2.5 w-2.5" />
            {formatDate(match.datetime, lang)}
          </span>
        </div>

        <div className="flex flex-col items-center gap-2">
          {renderFlag(match.away_team.flag, match.away_team.code, match.away_team.name)}
          <span className="text-xs font-bold text-white text-center leading-tight">{match.away_team.name}</span>
        </div>
      </div>

      {match.venue ? (
        <div className="mt-3 flex items-center justify-center gap-1 text-[10px] text-gray-600">
          <MapPin className="h-2.5 w-2.5" />
          {match.venue}
        </div>
      ) : null}

      {isLive ? (
        <Link
          href={`/competicao/${competitionSlug}`}
          className="mt-3 flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-[#E50914]/15 border border-[#E50914]/30 text-[#E50914] text-xs font-bold hover:bg-[#E50914]/25 transition-all"
        >
          <Zap className="h-3.5 w-3.5" />
          {lang === "pt" ? "Assistir Agora" : "Watch Now"}
        </Link>
      ) : null}
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
                    const flagUrl = resolveCountryFlagUrl({
                      code: team.code,
                      name: team.name,
                      logo: team.flag,
                      size: 32,
                    });
                    if (flagUrl) {
                      return <img src={flagUrl} alt="" className="h-5 w-5 rounded-full object-cover" />;
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
  return (
    <div className="rounded-xl border border-[#1E1E2A] overflow-hidden bg-[#0E0E16]/80">
      <div className="flex items-center gap-2 px-3 py-2 bg-[#111118] border-b border-[#1E1E2A]">
        <Trophy className="h-3.5 w-3.5" style={{ color: accent }} />
        <span className="text-xs font-black text-white uppercase tracking-widest">Grupo {group}</span>
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
                  const flagUrl = resolveCountryFlagUrl({
                    code: team.code,
                    name: team.name,
                    logo: team.flag,
                    size: 32,
                  });
                  if (flagUrl) {
                    return <img src={flagUrl} alt="" className="h-5 w-7 rounded-sm object-cover" />;
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
  slug = DEFAULT_COMPETITION_SLUG,
  initialData = null,
  showTopAd = false,
}: WorldCupSectionProps) {
  const { lang } = useLang();
  const [activeTab, setActiveTab] = useState<"matches" | "standings">("matches");
  const [selectedSlug, setSelectedSlug] = useState(slug);
  const [competitions, setCompetitions] = useState<PublicCompetitionSummary[]>([]);
  const [loadingCompetitions, setLoadingCompetitions] = useState(true);
  const [pageData, setPageData] = useState<PublicCompetitionPage | null>(initialData);
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    setSelectedSlug(slug);
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    fetchPublicCompetitions()
      .then((items) => {
        if (!cancelled) setCompetitions(items);
      })
      .finally(() => {
        if (!cancelled) setLoadingCompetitions(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

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

  const competition = pageData?.competition;
  const format = competition?.format || "groups";
  const hero = competition ? getCompetitionHero(competition) : null;
  const matches = (pageData?.events || []).map(mapPublicEventToMatch);
  const groups = normalizeGroups(pageData?.groups as CompetitionGroup[]);
  const leagueTeams = groups.flatMap((g) => g.teams);
  const showStandingsTab = format === "groups" || format === "league";

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
              {competition?.thumbnail ? (
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl border p-2"
                  style={{ borderColor: theme.border, background: theme.badgeBg }}
                >
                  <img src={competition.thumbnail} alt="" className="max-h-full max-w-full object-contain" />
                </div>
              ) : (
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl border"
                  style={{
                    borderColor: theme.border,
                    background: `linear-gradient(135deg, ${theme.softBg}, transparent)`,
                  }}
                >
                  <Trophy className="h-7 w-7" style={{ color: theme.primary }} />
                </div>
              )}
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

        <div className="flex items-center gap-1 mb-6 bg-[#0E0E16] border border-[#1E1E2A] rounded-xl p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {matches.length > 0 ? (
              matches.map((match) => (
                <MatchCard key={match.id} match={match} lang={lang} competitionSlug={selectedSlug} />
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-sm text-gray-500">
                Nenhum jogo cadastrado para esta competição.
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
