"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Globe2,
  Layers,
  Radio,
  RefreshCw,
  Search,
  TableProperties,
  Trophy,
  Zap,
} from "lucide-react";
import ResilientLogo from "@/components/ui/ResilientLogo";
import EventCover from "@/components/ui/EventCover";
import AdSlot from "@/components/ads/AdSlot";
import { publicApiRequest } from "@/lib/api";
import { useLang } from "@/lib/lang";
import type {
  CompetitionGroup,
  PublicCompetitionPage,
  PublicCompetitionSummary,
  SportCategory,
} from "@/types";
import { cn, getSportLabel } from "@/utils";

interface WatcherStatusPayload {
  running: boolean;
  daemonActive: boolean;
  intervalMs: number;
  cycleCount: number;
  lastCycle: {
    cycleNumber: number;
    finishedAt: string;
    durationMs: number;
    competitionsSynced: number;
    standingsUpdated: number;
    totalGroups: number;
    totalTeamsRanked: number;
    eventsUpserted: number;
  } | null;
  nextRunAt: string | null;
}

const FORMAT_FILTERS = [
  { id: "all", labelPt: "Todas as Competições", labelEn: "All Competitions" },
  { id: "groups", labelPt: "Fase de Grupos & Conferências", labelEn: "Group Stage & Conferences" },
  { id: "league", labelPt: "Tabelas de Ligas", labelEn: "League Tables" },
  { id: "knockout", labelPt: "Taças & Eliminatórias", labelEn: "Knockout Cups" },
] as const;

const SPORT_FILTERS: Array<{ id: "all" | SportCategory; labelPt: string; labelEn: string }> = [
  { id: "all", labelPt: "Todos os Desportos", labelEn: "All Sports" },
  { id: "football", labelPt: "Futebol", labelEn: "Football" },
  { id: "basketball", labelPt: "Basquetebol", labelEn: "Basketball" },
  { id: "f1", labelPt: "Fórmula 1", labelEn: "Formula 1" },
  { id: "ufc", labelPt: "UFC & Combate", labelEn: "UFC & Combat" },
];

export default function CompetitionsHubClient({
  initialCompetitions,
}: {
  initialCompetitions: PublicCompetitionSummary[];
}) {
  const { lang } = useLang();
  const [competitions, setCompetitions] = useState<PublicCompetitionSummary[]>(initialCompetitions);
  const [formatFilter, setFormatFilter] = useState<(typeof FORMAT_FILTERS)[number]["id"]>("all");
  const [sportFilter, setSportFilter] = useState<"all" | SportCategory>("all");
  const [search, setSearch] = useState("");
  const [selectedSlug, setSelectedSlug] = useState<string>(
    initialCompetitions[0]?.slug || "copa-do-mundo",
  );
  const [detail, setDetail] = useState<PublicCompetitionPage | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [watcher, setWatcher] = useState<WatcherStatusPayload | null>(null);
  const [syncingNow, setSyncingNow] = useState(false);

  const loadCompetitionsAndWatcher = async () => {
    try {
      const [compRes, watcherRes] = await Promise.all([
        publicApiRequest<PublicCompetitionSummary[]>("/competitions/public"),
        publicApiRequest<WatcherStatusPayload>("/competitions/watcher/status").catch(() => null),
      ]);
      if (Array.isArray(compRes) && compRes.length > 0) {
        setCompetitions(compRes);
        if (!selectedSlug) setSelectedSlug(compRes[0].slug);
      }
      if (watcherRes) setWatcher(watcherRes);
    } catch {
      /* keep initial SSR list */
    }
  };

  useEffect(() => {
    void loadCompetitionsAndWatcher();
    const poll = setInterval(() => {
      void loadCompetitionsAndWatcher();
    }, 60_000);
    return () => clearInterval(poll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedSlug) return;
    let active = true;
    setLoadingDetail(true);
    publicApiRequest<PublicCompetitionPage>(`/competitions/public/${encodeURIComponent(selectedSlug)}`)
      .then((res) => {
        if (active) setDetail(res);
      })
      .catch(() => {
        if (active) setDetail(null);
      })
      .finally(() => {
        if (active) setLoadingDetail(false);
      });

    return () => {
      active = false;
    };
  }, [selectedSlug]);

  const handleManualSync = async () => {
    if (syncingNow) return;
    setSyncingNow(true);
    try {
      await fetch("/api/competitions/watcher/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      await loadCompetitionsAndWatcher();
      if (selectedSlug) {
        const refreshed = await publicApiRequest<PublicCompetitionPage>(
          `/competitions/public/${encodeURIComponent(selectedSlug)}`,
        );
        setDetail(refreshed);
      }
    } catch {
      /* ignore */
    } finally {
      setSyncingNow(false);
    }
  };

  const filteredCompetitions = useMemo(() => {
    return competitions.filter((c) => {
      if (formatFilter !== "all" && (c.format || "groups") !== formatFilter) return false;
      if (sportFilter !== "all" && (c.sport || "football") !== sportFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = `${c.name} ${c.sectionTitle || ""} ${c.hostCountries || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [competitions, formatFilter, sportFilter, search]);

  const groups: CompetitionGroup[] = useMemo(() => {
    return Array.isArray(detail?.groups) ? detail!.groups : [];
  }, [detail]);

  return (
    <section className="min-h-[85vh] px-4 py-8 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-[1440px] space-y-8">
        {/* Header + Live Watcher Daemon Status */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/[0.07] pb-6">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#E50914]/35 bg-[#E50914]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#ff6b73]">
              <TableProperties className="h-3.5 w-3.5" />
              {lang === "pt"
                ? "Central de Competições · Classificações & Tabelas de Grupos"
                : "Competitions Hub · Live Standings & Group Tables"}
            </div>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-black text-white"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              {lang === "pt"
                ? "Competições, Ligas & Tabelas de Grupos em Tempo Real"
                : "Live Sports Competitions, Standings & Group Tables"}
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-white/55">
              {lang === "pt"
                ? "Explore futebol, basquetebol e outras modalidades: ligas, taças, classificações e jogos, incluindo competições africanas. Dados apresentados quando disponíveis nas fontes."
                : "Continuously synced standings, group stages, conferences, and fixtures across global sports."}
            </p>
          </div>

          {/* Continuous Watcher Status Card */}
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-[#0D101A] p-3.5">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
              </span>
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-400">
                  <Activity className="h-3.5 w-3.5" />
                  {lang === "pt" ? "Monitorização Automática Ativa" : "Live Watcher Active"}
                </div>
                <p className="text-[11px] text-white/50">
                  {watcher?.lastCycle
                    ? `${watcher.lastCycle.competitionsSynced} competições · ${watcher.lastCycle.totalGroups} grupos/tabelas (${watcher.lastCycle.totalTeamsRanked} equipas)`
                    : `${competitions.length} competições sincronizadas`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleManualSync}
              disabled={syncingNow}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.05] px-3 py-2 text-xs font-bold text-white hover:bg-white/[0.1] disabled:opacity-50"
            >
              <RefreshCw className={cn("h-3.5 w-3.5 text-[#E50914]", syncingNow && "animate-spin")} />
              {syncingNow
                ? lang === "pt"
                  ? "A atualizar..."
                  : "Syncing..."
                : lang === "pt"
                  ? "Atualizar Fontes"
                  : "Sync Now"}
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {FORMAT_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFormatFilter(f.id)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-bold transition-all",
                  formatFilter === f.id
                    ? "bg-[#E50914] text-white shadow-[0_0_20px_rgba(229,9,20,0.35)]"
                    : "border border-white/10 bg-white/[0.03] text-white/65 hover:text-white",
                )}
              >
                {lang === "pt" ? f.labelPt : f.labelEn}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {SPORT_FILTERS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSportFilter(s.id)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[11px] font-bold transition-all",
                  sportFilter === s.id
                    ? "border border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
                    : "border border-white/10 bg-white/[0.02] text-white/55 hover:text-white",
                )}
              >
                {lang === "pt" ? s.labelPt : s.labelEn}
              </button>
            ))}

            <div className="relative min-w-[220px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={lang === "pt" ? "Pesquisar liga ou torneio..." : "Search competition..."}
                className="w-full rounded-full border border-white/10 bg-[#0D101A] py-1.5 pl-8 pr-3 text-xs text-white placeholder-white/35 outline-none focus:border-[#E50914]/50"
              />
            </div>
          </div>
        </div>

        {/* Interactive Master-Detail: Competition Selector + Live Standings / Groups Preview */}
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Left: Competition Directory List */}
          <div className="lg:col-span-4 rounded-[24px] border border-white/10 bg-[#0B0D15] overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
              <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-white">
                <Trophy className="h-3.5 w-3.5 text-[#E50914]" />
                {lang === "pt" ? "Competições Ativas" : "Active Competitions"}
              </span>
              <span className="text-[11px] font-semibold text-white/45">
                {filteredCompetitions.length}
              </span>
            </div>

            <div className="max-h-[680px] overflow-y-auto divide-y divide-white/[0.05] p-2">
              {filteredCompetitions.map((comp) => {
                const isSelected = comp.slug === selectedSlug;
                const fmtBadge =
                  comp.format === "groups"
                    ? (comp.groupsCount || 0) > 1
                      ? `${comp.groupsCount} Grupos`
                      : "Grupos"
                    : comp.format === "league"
                      ? "Tabela"
                      : "Eliminatória";

                return (
                  <button
                    key={comp.id}
                    type="button"
                    onClick={() => setSelectedSlug(comp.slug)}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-xl p-2.5 text-left transition-all",
                      isSelected
                        ? "bg-[#E50914]/15 border border-[#E50914]/45"
                        : "hover:bg-white/[0.04] border border-transparent",
                    )}
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/95 p-1.5">
                      <ResilientLogo
                        src={comp.thumbnail}
                        name={comp.sectionTitle || comp.name}
                        kind="league"
                        size={40}
                        alt={comp.name}
                        className="h-full w-full"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-xs sm:text-sm font-bold text-white">
                          {comp.sectionTitle || comp.name}
                        </p>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-white/45">
                        <span>{comp.hostCountries || getSportLabel(comp.sport || "football")}</span>
                        {comp.season ? (
                          <>
                            <span>•</span>
                            <span>{comp.season}</span>
                          </>
                        ) : null}
                        {(comp.statTeams || 0) > 0 ? (
                          <>
                            <span>•</span>
                            <span className="text-emerald-400 font-semibold">
                              {comp.statTeams} equipas
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <span className="shrink-0 rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/70">
                      {fmtBadge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Live Standings / Group Tables + Fixtures */}
          <div className="lg:col-span-8 space-y-6">
            {loadingDetail ? (
              <div className="h-[520px] rounded-[24px] anim-shimmer" />
            ) : detail?.competition ? (
              <div className="rounded-[24px] border border-white/10 bg-[#0B0D15] p-5 sm:p-6 space-y-6">
                {/* Selected Competition Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.07] pb-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white p-2 shadow-lg">
                      <ResilientLogo
                        src={detail.competition.thumbnail}
                        name={detail.competition.name}
                        kind="league"
                        size={64}
                        alt={detail.competition.name}
                        className="h-full w-full"
                      />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#E50914]/15 border border-[#E50914]/35 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#ff6c74]">
                          {detail.competition.season || "2026"}
                        </span>
                        {detail.competition.hostCountries ? (
                          <span className="inline-flex items-center gap-1 text-xs text-white/55">
                            <Globe2 className="h-3.5 w-3.5 text-[#E50914]" />
                            {detail.competition.hostCountries}
                          </span>
                        ) : null}
                      </div>
                      <h2
                        className="mt-1 text-2xl sm:text-3xl font-black text-white"
                        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                      >
                        {detail.competition.name}
                      </h2>
                      <p className="text-xs text-white/50">
                        {groups.length > 1
                          ? `${groups.length} tabelas de grupos/conferências · ${
                              detail.competition.statTeams || 0
                            } participantes`
                          : groups.length === 1
                            ? `Classificação geral (${groups[0].teams.length} participantes)`
                            : `${detail.events.length} jogos sincronizados`}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/competicao/${detail.competition.slug}`}
                    className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#E50914] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_24px_rgba(229,9,20,0.35)] hover:brightness-110"
                  >
                    {lang === "pt" ? "Página da Competição" : "Open Full Page"}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* Group Tables or Single League Standings */}
                {groups.length > 1 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
                        <Layers className="h-4 w-4 text-[#E50914]" />
                        {lang === "pt" ? "Tabelas de Grupos / Conferências" : "Group Stage & Conferences"}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {lang === "pt" ? "Sincronizado em tempo real" : "Live synced"}
                      </span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {groups.map((grp) => {
                        const title = /^[A-Z0-9]{1,3}$/.test(grp.group)
                          ? `Grupo ${grp.group}`
                          : grp.group;
                        return (
                          <div
                            key={grp.group}
                            className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#10131F]"
                          >
                            <div className="flex items-center justify-between border-b border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5">
                              <span className="text-xs font-black uppercase tracking-wider text-white">
                                {title}
                              </span>
                              <span className="text-[10px] font-semibold text-white/40">
                                {grp.teams.length} {lang === "pt" ? "equipas" : "teams"}
                              </span>
                            </div>

                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-white/[0.05] text-[10px] uppercase tracking-wider text-white/40">
                                  <th className="py-2 pl-3 pr-1 text-left">#</th>
                                  <th className="py-2 px-2 text-left">Equipa</th>
                                  <th className="py-2 px-1.5 text-center">J</th>
                                  <th className="py-2 px-1.5 text-center">V</th>
                                  <th className="py-2 px-1.5 text-center">E</th>
                                  <th className="py-2 px-1.5 text-center">D</th>
                                  <th className="py-2 pl-1.5 pr-3 text-right text-[#ff6b73]">Pts</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/[0.04]">
                                {grp.teams.map((team, idx) => (
                                  <tr
                                    key={team.id}
                                    className={cn(
                                      "hover:bg-white/[0.03]",
                                      idx < 2 ? "text-white" : "text-white/65",
                                    )}
                                  >
                                    <td className="py-2 pl-3 pr-1 font-mono text-[11px] font-bold text-white/45">
                                      {idx + 1}
                                    </td>
                                    <td className="py-2 px-2">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <ResilientLogo
                                          src={team.flag}
                                          name={team.name}
                                          code={team.code}
                                          kind="team"
                                          size={24}
                                          alt={team.name}
                                          className="h-5 w-5 shrink-0"
                                        />
                                        <span className="truncate font-semibold max-w-[125px]">
                                          {team.name}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="py-2 px-1.5 text-center tabular-nums">{team.played}</td>
                                    <td className="py-2 px-1.5 text-center tabular-nums">{team.wins}</td>
                                    <td className="py-2 px-1.5 text-center tabular-nums">{team.draws}</td>
                                    <td className="py-2 px-1.5 text-center tabular-nums">{team.losses}</td>
                                    <td className="py-2 pl-1.5 pr-3 text-right font-black tabular-nums text-white">
                                      {team.points}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : groups.length === 1 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
                        <TableProperties className="h-4 w-4 text-[#E50914]" />
                        {lang === "pt" ? "Tabela Classificativa Oficial" : "Official League Table"}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {lang === "pt" ? "Atualizada automaticamente" : "Auto-updated"}
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#10131F]">
                      <table className="w-full min-w-[520px] text-xs">
                        <thead>
                          <tr className="border-b border-white/[0.07] bg-white/[0.03] text-[10px] uppercase tracking-wider text-white/45">
                            <th className="py-2.5 pl-4 pr-2 text-left">#</th>
                            <th className="py-2.5 px-2 text-left">Clube / Equipa</th>
                            <th className="py-2.5 px-2 text-center">J</th>
                            <th className="py-2.5 px-2 text-center">V</th>
                            <th className="py-2.5 px-2 text-center">E</th>
                            <th className="py-2.5 px-2 text-center">D</th>
                            <th className="py-2.5 px-2 text-center">GM</th>
                            <th className="py-2.5 px-2 text-center">GS</th>
                            <th className="py-2.5 px-2 text-center">DG</th>
                            <th className="py-2.5 pl-2 pr-4 text-right text-[#ff6b73]">Pts</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.05]">
                          {groups[0].teams.map((team, idx) => {
                            const gd = team.gf - team.ga;
                            return (
                              <tr
                                key={team.id}
                                className={cn(
                                  "hover:bg-white/[0.03]",
                                  idx < 4 ? "text-white" : "text-white/75",
                                )}
                              >
                                <td className="py-2.5 pl-4 pr-2 font-mono text-xs font-bold text-white/50">
                                  {idx + 1}
                                </td>
                                <td className="py-2.5 px-2">
                                  <div className="flex items-center gap-2.5">
                                    <ResilientLogo
                                      src={team.flag}
                                      name={team.name}
                                      code={team.code}
                                      kind="team"
                                      size={28}
                                      alt={team.name}
                                      className="h-6 w-6 shrink-0"
                                    />
                                    <span className="font-bold">{team.name}</span>
                                  </div>
                                </td>
                                <td className="py-2.5 px-2 text-center tabular-nums">{team.played}</td>
                                <td className="py-2.5 px-2 text-center tabular-nums text-emerald-400/90">
                                  {team.wins}
                                </td>
                                <td className="py-2.5 px-2 text-center tabular-nums">{team.draws}</td>
                                <td className="py-2.5 px-2 text-center tabular-nums text-rose-400/80">
                                  {team.losses}
                                </td>
                                <td className="py-2.5 px-2 text-center tabular-nums">{team.gf}</td>
                                <td className="py-2.5 px-2 text-center tabular-nums">{team.ga}</td>
                                <td className="py-2.5 px-2 text-center tabular-nums font-semibold">
                                  {gd > 0 ? `+${gd}` : gd}
                                </td>
                                <td className="py-2.5 pl-2 pr-4 text-right text-sm font-black tabular-nums text-white">
                                  {team.points}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}

                {/* Upcoming & Recent Matches in this Competition */}
                {detail.events.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h3 className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
                      <Calendar className="h-4 w-4 text-[#E50914]" />
                      {lang === "pt" ? "Jogos & Resultados da Competição" : "Matches & Results"}
                    </h3>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {detail.events.slice(0, 8).map((ev) => {
                        const hasScore =
                          typeof ev.scoreA === "number" && typeof ev.scoreB === "number";
                        const scorers = ev.matchDetails?.scorers || [];
                        const hasLiveStream = Boolean(ev.liveTag?.liveId);
                        return (
                          <div
                            key={ev.id}
                            className="group relative isolate overflow-hidden rounded-xl border border-white/[0.08] bg-[#10131F] p-3.5 transition-all hover:border-[#E50914]/45 flex flex-col justify-between gap-2.5"
                          >
                            <div className="pointer-events-none absolute inset-0 -z-10"><EventCover sport={detail.competition.sport} className="h-full" /></div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-white/45 truncate">
                                {ev.stage || ev.matchTime || "Jogo"}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {hasLiveStream && (
                                  <Link
                                    href={`/watch/${ev.liveTag!.liveId}`}
                                    className={cn(
                                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border transition-all",
                                      ev.liveTag!.liveStatus === "live"
                                        ? "bg-[#E50914] text-white border-[#E50914] shadow-[0_0_10px_rgba(229,9,20,0.4)]"
                                        : "bg-emerald-500/15 text-emerald-300 border-emerald-500/35 hover:bg-emerald-500/25",
                                    )}
                                  >
                                    <Radio className="h-2.5 w-2.5 animate-pulse" />
                                    {ev.liveTag!.liveStatus === "live" ? "LIVE" : "TEM LIVE"}
                                  </Link>
                                )}
                                {ev.status === "live" && (
                                  <span className="rounded-full bg-[#E50914]/15 border border-[#E50914]/35 px-2 py-0.5 text-[10px] font-black text-[#ff6b73]">
                                    AO VIVO
                                  </span>
                                )}
                              </div>
                            </div>

                            <Link
                              href={`/evento/${encodeURIComponent(ev.id)}`}
                              className="flex items-center justify-between gap-3 group"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <ResilientLogo
                                  src={ev.teamALogo}
                                  name={ev.teamA}
                                  code={ev.teamACode}
                                  kind="team"
                                  size={28}
                                  alt={ev.teamA || ""}
                                  className="h-7 w-7 shrink-0"
                                />
                                <span className="truncate text-xs font-bold text-white group-hover:text-[#ff6b73]">
                                  {ev.teamA || ev.title}
                                </span>
                              </div>

                              <div className="shrink-0 px-2 text-center">
                                {hasScore ? (
                                  <span className="rounded-md bg-white/[0.06] px-2.5 py-1 text-xs font-black text-white tabular-nums">
                                    {ev.scoreA} - {ev.scoreB}
                                  </span>
                                ) : (
                                  <span className="text-[11px] font-bold text-[#ff6b73]">
                                    {ev.matchTime || "VS"}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center justify-end gap-2 min-w-0 flex-1">
                                <span className="truncate text-right text-xs font-bold text-white group-hover:text-[#ff6b73]">
                                  {ev.teamB || ""}
                                </span>
                                <ResilientLogo
                                  src={ev.teamBLogo}
                                  name={ev.teamB}
                                  code={ev.teamBCode}
                                  kind="team"
                                  size={28}
                                  alt={ev.teamB || ""}
                                  className="h-7 w-7 shrink-0"
                                />
                              </div>
                            </Link>

                            {scorers.length > 0 && (
                              <Link
                                href={`/evento/${encodeURIComponent(ev.id)}`}
                                className="pt-2 border-t border-white/[0.05] text-[10px] text-white/65 flex flex-wrap gap-x-2.5 gap-y-0.5"
                              >
                                {scorers.slice(0, 4).map((s, idx) => (
                                  <span key={idx} className="inline-flex items-center gap-1">
                                    <span className="text-emerald-400">⚽</span>
                                    <span className="font-semibold text-white/85">{s.player}</span>
                                    <span className="text-white/40">{s.minute}</span>
                                  </span>
                                ))}
                              </Link>
                            )}

                            <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between gap-2">
                              <Link
                                href={`/evento/${encodeURIComponent(ev.id)}`}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-white/75 hover:text-white"
                              >
                                <BarChart3 className="h-3.5 w-3.5 text-[#E50914]" />
                                {lang === "pt" ? "Ver estatísticas completas" : "Full match stats"}
                              </Link>
                              {hasLiveStream && (
                                <Link
                                  href={`/watch/${ev.liveTag!.liveId}`}
                                  className="inline-flex items-center gap-1 rounded-md bg-[#E50914]/15 border border-[#E50914]/35 px-2 py-0.5 text-[10px] font-black text-[#ff6b73] hover:bg-[#E50914] hover:text-white transition-all"
                                >
                                  <Zap className="h-3 w-3" />
                                  Assistir
                                </Link>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <AdSlot position="footer" hideWhenEmpty />
      </div>
    </section>
  );
}
