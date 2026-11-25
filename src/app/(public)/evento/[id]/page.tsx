import Link from "next/link";
import {
  ArrowLeft,
  Award,
  BarChart3,
  CalendarClock,
  Flag,
  MapPin,
  Radio,
  Shield,
  Shirt,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { notFound } from "next/navigation";
import type { Event, MatchScorerSummary } from "@/types";
import ResilientLogo from "@/components/ui/ResilientLogo";
import { serverApiRequest } from "@/lib/server-api";
import { getSportLabel } from "@/utils";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

type ApiStatistic = {
  type: string;
  value: number | string | null;
};

type ApiTeamStats = {
  team?: {
    name?: string;
    logo?: string;
  };
  statistics?: ApiStatistic[];
};

type EventStatisticsResponse = {
  source: string;
  items: ApiTeamStats[];
};

type ApiTimelineItem = {
  time?: {
    elapsed?: number;
    extra?: number | null;
    display?: string;
  };
  team?: {
    name?: string;
    logo?: string;
    side?: "home" | "away";
  };
  player?: {
    name?: string;
  };
  assist?: {
    name?: string | null;
  };
  type?: string;
  detail?: string;
  comments?: string | null;
  scoringPlay?: boolean;
  yellowCard?: boolean;
  redCard?: boolean;
  substitution?: boolean;
};

type ApiLineupPlayer = {
  player?: {
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
};

type ApiLineup = {
  team?: {
    name?: string;
    logo?: string;
  };
  formation?: string;
  startXI?: ApiLineupPlayer[];
  substitutes?: ApiLineupPlayer[];
};

type EventSummaryResponse = {
  source: string;
  fixtureId?: string | null;
  espnSportPath?: string | null;
  venue?: {
    name?: string | null;
    city?: string | null;
    country?: string | null;
    attendance?: number | null;
  } | null;
  scorers?: MatchScorerSummary[];
  statistics: ApiTeamStats[];
  timeline: ApiTimelineItem[];
  lineups: ApiLineup[];
  leaders?: Array<{
    teamName: string;
    teamLogo?: string;
    category: string;
    playerName: string;
    displayValue: string;
  }>;
};

function isImageValue(value?: string) {
  return Boolean(
    value && (/^(https?:|data:|blob:)/.test(value) || value.startsWith("/")),
  );
}

function formatKickoff(value: string) {
  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function parseStatValue(value: number | string | null | undefined) {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const str = String(value).trim();
  // Support NBA ratios like "38-86" -> 38
  if (/^\d+-\d+$/.test(str)) {
    return Number(str.split("-")[0]) || 0;
  }
  const parsed = Number(str.replace("%", "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function statLabel(type: string) {
  const labels: Record<string, string> = {
    "Shots on Goal": "Remates à baliza",
    "Shots off Goal": "Remates fora",
    "Total Shots": "Remates totais",
    "Blocked Shots": "Remates bloqueados",
    "Shots insidebox": "Remates na área",
    "Shots outsidebox": "Remates fora da área",
    Fouls: "Faltas cometidas",
    "Corner Kicks": "Cantos",
    Offsides: "Foras de jogo",
    "Ball Possession": "Posse de bola",
    "Yellow Cards": "Cartões amarelos",
    "Red Cards": "Cartões vermelhos",
    "Goalkeeper Saves": "Defesas do guarda-redes",
    "Total passes": "Total de passes",
    "Passes accurate": "Passes certos",
    "Passes %": "Precisão de passe",
  };
  return labels[type] || type;
}

function TeamLogo({
  logo,
  name,
  code,
}: {
  logo?: string;
  name?: string;
  code?: string;
}) {
  return (
    <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06] p-2.5 shadow-[0_8px_28px_rgba(0,0,0,0.45)]">
      <ResilientLogo
        src={logo}
        name={name}
        code={code}
        kind="team"
        size={96}
        alt={name || ""}
        className="h-full w-full object-contain"
      />
    </div>
  );
}

function StatisticRow({
  label,
  home,
  away,
}: {
  label: string;
  home: number | string | null;
  away: number | string | null;
}) {
  const homeValue = parseStatValue(home);
  const awayValue = parseStatValue(away);
  const total = Math.max(homeValue + awayValue, 1);
  const homeWidth = `${Math.max((homeValue / total) * 100, homeValue > 0 ? 6 : 0)}%`;
  const awayWidth = `${Math.max((awayValue / total) * 100, awayValue > 0 ? 6 : 0)}%`;
  const homeLeads = homeValue > awayValue;
  const awayLeads = awayValue > homeValue;

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#141621] p-3.5 transition-colors hover:border-white/15">
      <div className="mb-2 flex items-center justify-between text-xs sm:text-sm">
        <span
          className={`tabular-nums font-black ${
            homeLeads ? "text-white" : "text-gray-400"
          }`}
        >
          {home ?? "-"}
        </span>
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 text-center px-2">
          {label}
        </span>
        <span
          className={`tabular-nums font-black ${
            awayLeads ? "text-white" : "text-gray-400"
          }`}
        >
          {away ?? "-"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <div className="h-2 overflow-hidden rounded-l-full bg-white/[0.08]">
          <div
            className={`ml-auto h-full rounded-l-full transition-all ${
              homeLeads ? "bg-[#E50914]" : "bg-[#E50914]/55"
            }`}
            style={{ width: homeWidth }}
          />
        </div>
        <div className="h-2 overflow-hidden rounded-r-full bg-white/[0.08]">
          <div
            className={`h-full rounded-r-full transition-all ${
              awayLeads ? "bg-sky-400" : "bg-sky-400/55"
            }`}
            style={{ width: awayWidth }}
          />
        </div>
      </div>
    </div>
  );
}

function StatisticsPanel({
  stats,
  homeName,
  awayName,
}: {
  stats?: EventStatisticsResponse | null;
  homeName: string;
  awayName: string;
}) {
  const teams = stats?.items || [];
  const homeStats = teams[0]?.statistics || [];
  const awayStats = teams[1]?.statistics || [];
  const statTypes = homeStats
    .map((item) => item.type)
    .filter((type) => awayStats.some((item) => item.type === type));

  if (statTypes.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#141621] p-6 text-center">
        <BarChart3 className="mx-auto mb-3 h-8 w-8 text-gray-500" />
        <h3 className="text-base font-bold text-white">
          Estatísticas em atualização
        </h3>
        <p className="mt-2 text-sm text-gray-400">
          As estatísticas serão apresentadas quando estiverem disponíveis na fonte de dados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-2 pb-1 text-xs font-black uppercase tracking-wider text-gray-400">
        <span className="flex items-center gap-2 text-white">
          <span className="h-2.5 w-2.5 rounded-full bg-[#E50914]" />
          {teams[0]?.team?.name || homeName}
        </span>
        <span className="flex items-center gap-2 text-white">
          {teams[1]?.team?.name || awayName}
          <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
        </span>
      </div>

      {statTypes.map((type) => (
        <StatisticRow
          key={type}
          label={statLabel(type)}
          home={homeStats.find((item) => item.type === type)?.value ?? null}
          away={awayStats.find((item) => item.type === type)?.value ?? null}
        />
      ))}
    </div>
  );
}

function TimelinePanel({ items }: { items: ApiTimelineItem[] }) {
  if (!items.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#141621] p-6 text-center">
        <Flag className="mx-auto mb-3 h-8 w-8 text-gray-500" />
        <h3 className="text-base font-bold text-white">
          Cronologia de lances indisponível
        </h3>
        <p className="mt-2 text-sm text-gray-400">
          Os golos, assistências, cartões e substituições serão registados aqui minuto a minuto.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.map((item, index) => {
        const minute =
          item.time?.display ||
          (item.time?.elapsed
            ? `${item.time.elapsed}${item.time.extra ? `+${item.time.extra}` : ""}'`
            : "-");
        const teamLogo = item.team?.logo;
        const isGoal = Boolean(item.scoringPlay || /golo|goal/i.test(item.type || ""));
        const isYellow = Boolean(item.yellowCard || /amarelo|yellow/i.test(item.type || ""));
        const isRed = Boolean(item.redCard || /vermelho|red/i.test(item.type || ""));
        const isSub = Boolean(item.substitution || /substit/i.test(item.type || ""));

        return (
          <div
            key={`${minute}-${item.type}-${index}`}
            className={`flex gap-3 rounded-xl border p-3.5 transition-colors ${
              isGoal
                ? "border-emerald-500/35 bg-emerald-500/[0.07]"
                : isRed
                  ? "border-red-500/35 bg-red-500/[0.07]"
                  : "border-white/[0.08] bg-[#141621]"
            }`}
          >
            <div
              className={`flex h-10 w-14 flex-shrink-0 items-center justify-center rounded-lg text-xs font-black tabular-nums ${
                isGoal
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-black/35 text-[#ff6b73] border border-white/5"
              }`}
            >
              {minute}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-white">
                {isGoal && <span>⚽</span>}
                {isYellow && (
                  <span className="inline-block h-3.5 w-2.5 rounded-[2px] bg-amber-400" />
                )}
                {isRed && (
                  <span className="inline-block h-3.5 w-2.5 rounded-[2px] bg-red-500" />
                )}
                {isSub && <span className="text-sky-400">⇄</span>}
                {(teamLogo || item.team?.name) && (
                  <ResilientLogo
                    src={teamLogo}
                    name={item.team?.name}
                    kind="team"
                    size={22}
                    alt=""
                    className="h-5 w-5"
                  />
                )}
                <span className={isGoal ? "text-emerald-300" : "text-white"}>
                  {item.type || "Lance"}
                </span>
                {item.team?.name && (
                  <span className="text-xs font-semibold text-gray-400">
                    · {item.team.name}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm font-semibold text-gray-200">
                {item.player?.name || item.team?.name || "Evento do jogo"}
                {item.assist?.name && !isSub ? (
                  <span className="text-gray-400 font-normal">
                    {" "}
                    (Assistência: {item.assist.name})
                  </span>
                ) : null}
                {item.detail ? (
                  <span className="text-gray-400 font-normal">
                    {" "}
                    — {item.detail}
                  </span>
                ) : null}
              </p>
              {item.comments && (
                <p className="mt-1 text-xs text-gray-400 leading-relaxed">
                  {item.comments}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LineupsPanel({ lineups }: { lineups: ApiLineup[] }) {
  if (!lineups.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#141621] p-6 text-center">
        <Shirt className="mx-auto mb-3 h-8 w-8 text-gray-500" />
        <h3 className="text-base font-bold text-white">
          Onzes iniciais ainda não divulgados
        </h3>
        <p className="mt-2 text-sm text-gray-400">
          As formações, titulares e suplentes serão apresentados quando estiverem disponíveis.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {lineups.map((lineup, lIdx) => {
        const subs = lineup.substitutes || [];
        return (
          <div
            key={lineup.team?.name || lIdx}
            className="rounded-xl border border-white/[0.08] bg-[#141621] p-4"
          >
            <div className="mb-4 flex items-center justify-between gap-3 pb-3 border-b border-white/[0.07]">
              <div className="flex min-w-0 items-center gap-2.5">
                {(lineup.team?.logo || lineup.team?.name) && (
                  <ResilientLogo
                    src={lineup.team?.logo}
                    name={lineup.team?.name}
                    kind="team"
                    size={32}
                    alt=""
                    className="h-8 w-8"
                  />
                )}
                <h3 className="truncate text-sm font-black text-white">
                  {lineup.team?.name || "Equipa"}
                </h3>
              </div>
              {lineup.formation && (
                <span className="rounded-md bg-[#E50914]/15 border border-[#E50914]/30 px-2.5 py-1 text-xs font-black text-[#ff6b73]">
                  {lineup.formation}
                </span>
              )}
            </div>

            <div className="mb-2 text-[10px] font-black uppercase tracking-wider text-gray-500">
              Titulares
            </div>
            <div className="space-y-1.5">
              {(lineup.startXI || []).slice(0, 11).map(({ player }, idx) => (
                <div
                  key={`${player?.number}-${player?.name}-${idx}`}
                  className="flex items-center justify-between gap-2 rounded-lg bg-black/25 px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 text-right font-mono text-[11px] font-bold text-gray-500">
                      {player?.number ?? "-"}
                    </span>
                    <span className="min-w-0 truncate font-semibold text-white">
                      {player?.name || "Jogador"}
                    </span>
                    {(player?.goals ?? 0) > 0 && (
                      <span className="text-[11px] text-emerald-400 font-bold">
                        {"⚽".repeat(Math.min(player!.goals!, 4))}
                      </span>
                    )}
                    {(player?.assists ?? 0) > 0 && (
                      <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300">
                        {player!.assists} AST
                      </span>
                    )}
                    {(player?.yellowCards ?? 0) > 0 && (
                      <span className="inline-block h-3 w-2 rounded-[1px] bg-amber-400" />
                    )}
                    {(player?.redCards ?? 0) > 0 && (
                      <span className="inline-block h-3 w-2 rounded-[1px] bg-red-500" />
                    )}
                    {player?.subbedOut && (
                      <span className="text-[10px] text-rose-400" title="Substituído">
                        ↓
                      </span>
                    )}
                  </div>
                  <span className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[10px] font-bold text-gray-400 shrink-0">
                    {player?.pos || "-"}
                  </span>
                </div>
              ))}
            </div>

            {subs.length > 0 && (
              <>
                <div className="mt-4 mb-2 text-[10px] font-black uppercase tracking-wider text-gray-500">
                  Suplentes / Entraram
                </div>
                <div className="space-y-1">
                  {subs.map(({ player }, idx) => (
                    <div
                      key={`sub-${player?.number}-${player?.name}-${idx}`}
                      className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.02] px-3 py-1.5 text-xs text-gray-300"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 text-right font-mono text-[10px] text-gray-500">
                          {player?.number ?? "-"}
                        </span>
                        <span className="truncate">{player?.name || "Suplente"}</span>
                        {player?.subbedIn && (
                          <span className="text-[10px] text-emerald-400 font-bold" title="Entrou em campo">
                            ↑
                          </span>
                        )}
                        {(player?.goals ?? 0) > 0 && (
                          <span className="text-[11px] text-emerald-400 font-bold">
                            {"⚽".repeat(Math.min(player!.goals!, 3))}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-500">
                        {player?.pos || "-"}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const event = await serverApiRequest<Event>(
    `/events/${encodeURIComponent(decodedId)}`,
  );
  if (!event) notFound();

  const summary = await serverApiRequest<EventSummaryResponse>(
    `/events/${encodeURIComponent(decodedId)}/summary`,
  );
  const stats: EventStatisticsResponse = {
    source: summary?.source || "local",
    items: summary?.statistics || [],
  };

  const hasScore =
    typeof event.scoreA === "number" && typeof event.scoreB === "number";

  const scorers: MatchScorerSummary[] =
    summary?.scorers && summary.scorers.length > 0
      ? summary.scorers
      : event.matchDetails?.scorers || [];

  const homeScorers = scorers.filter((s) => s.teamSide === "home");
  const awayScorers = scorers.filter((s) => s.teamSide === "away");
  const hasLiveStream = Boolean(event.liveTag?.liveId);
  const leaders = summary?.leaders || [];

  return (
    <main className="min-h-screen bg-[#08090F] px-4 py-6 text-white lg:px-6">
      <div className="mx-auto max-w-[1220px]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/competicao"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar às Competições
          </Link>

          {hasLiveStream && (
            <Link
              href={`/watch/${event.liveTag!.liveId}`}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#E50914] to-[#B00000] px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-[0_0_24px_rgba(229,9,20,0.45)] hover:brightness-110 transition-all"
            >
              <Radio className="h-3.5 w-3.5 animate-pulse" />
              {event.liveTag!.liveStatus === "live"
                ? "Assistir Transmissão em Direto"
                : "Abrir Sala da Live"}
            </Link>
          )}
        </div>

        {/* Scoreboard Hero */}
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#121524] via-[#0D101B] to-[#090B12] shadow-2xl">
          <div className="relative p-6 lg:p-9">
            <div className="absolute inset-0 opacity-15 pointer-events-none">
              {isImageValue(event.thumbnail) && (
                <img
                  src={event.thumbnail}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-[#0D101B]/90 to-[#090B12]" />
            </div>

            <div className="relative">
              <div className="mb-7 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-gray-300">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider ${
                      event.status === "live"
                        ? "bg-[#E50914] text-white shadow-[0_0_14px_rgba(229,9,20,0.5)]"
                        : event.status === "finished"
                          ? "bg-white/10 text-gray-200 border border-white/15"
                          : "bg-sky-500/15 text-sky-300 border border-sky-500/30"
                    }`}
                  >
                    {event.status === "live"
                      ? "AO VIVO"
                      : event.status === "finished"
                        ? "TERMINADO"
                        : event.status === "cancelled"
                          ? "CANCELADO"
                          : "AGENDADO"}
                  </span>

                  {hasLiveStream && (
                    <Link
                      href={`/watch/${event.liveTag!.liveId}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-300 hover:bg-emerald-500/25 transition-all"
                    >
                      <Zap className="h-3 w-3" />
                      TEM LIVE DISPONÍVEL
                    </Link>
                  )}

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1 text-white/90">
                    {(event.leagueLogo || event.league) && (
                      <ResilientLogo
                        src={event.leagueLogo}
                        name={event.league}
                        kind="league"
                        size={18}
                        alt=""
                        className="h-4 w-4 rounded bg-white/90 p-0.5"
                      />
                    )}
                    {event.league || getSportLabel(event.sport)}
                  </span>

                  {event.stage && (
                    <span className="text-gray-400">· {event.stage}</span>
                  )}
                </div>

                <span className="inline-flex items-center gap-1.5 text-gray-400">
                  <CalendarClock className="h-3.5 w-3.5 text-[#E50914]" />
                  {formatKickoff(event.scheduledAt)}
                </span>
              </div>

              {/* Teams & Score */}
              <div className="grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
                <div className="flex flex-col items-center text-center">
                  <TeamLogo
                    logo={event.teamALogo}
                    name={event.teamA}
                    code={event.teamACode}
                  />
                  <h1 className="mt-3 text-xl font-black lg:text-2xl">
                    {event.teamA || event.title}
                  </h1>
                </div>

                <div className="text-center px-4">
                  <div className="score-display text-5xl font-black leading-none tracking-tight lg:text-7xl tabular-nums">
                    {hasScore ? `${event.scoreA} – ${event.scoreB}` : "VS"}
                  </div>
                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#ff6b73]">
                    {event.matchTime || "Pré-jogo"}
                  </p>
                </div>

                <div className="flex flex-col items-center text-center">
                  <TeamLogo
                    logo={event.teamBLogo}
                    name={event.teamB}
                    code={event.teamBCode}
                  />
                  <h2 className="mt-3 text-xl font-black lg:text-2xl">
                    {event.teamB || "Adversário"}
                  </h2>
                </div>
              </div>

              {/* Goal Scorers (Marcadores) Bar */}
              {scorers.length > 0 && (
                <div className="mt-7 pt-5 border-t border-white/10 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-start">
                  <div className="space-y-1.5 text-center md:text-right">
                    {homeScorers.map((s, idx) => (
                      <div
                        key={idx}
                        className="text-xs sm:text-sm text-gray-200 font-semibold"
                      >
                        <span>{s.player}</span>{" "}
                        <span className="font-bold text-emerald-400">
                          {s.minute}
                        </span>
                        {s.penalty && (
                          <span className="ml-1 text-[11px] text-amber-300">
                            (Pen.)
                          </span>
                        )}
                        {s.ownGoal && (
                          <span className="ml-1 text-[11px] text-rose-400">
                            (A.G.)
                          </span>
                        )}
                        {s.assist && (
                          <span className="block text-[11px] text-gray-400 font-normal">
                            Assist.: {s.assist}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="hidden md:flex flex-col items-center justify-center px-3">
                    <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                      ⚽ Marcadores
                    </span>
                  </div>

                  <div className="space-y-1.5 text-center md:text-left">
                    {awayScorers.map((s, idx) => (
                      <div
                        key={idx}
                        className="text-xs sm:text-sm text-gray-200 font-semibold"
                      >
                        <span className="font-bold text-emerald-400">
                          {s.minute}
                        </span>{" "}
                        <span>{s.player}</span>
                        {s.penalty && (
                          <span className="ml-1 text-[11px] text-amber-300">
                            (Pen.)
                          </span>
                        )}
                        {s.ownGoal && (
                          <span className="ml-1 text-[11px] text-rose-400">
                            (A.G.)
                          </span>
                        )}
                        {s.assist && (
                          <span className="block text-[11px] text-gray-400 font-normal">
                            Assist.: {s.assist}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_350px]">
          <div className="space-y-6">
            {/* Complete Match Statistics */}
            <div className="rounded-2xl border border-white/10 bg-[#0E101A] p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-lg font-black">
                  <BarChart3 className="h-5 w-5 text-[#E50914]" />
                  Estatísticas Completas do Jogo
                </h2>
                <span className="rounded-md bg-white/[0.05] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {stats.items.reduce(
                    (max, t) => Math.max(max, t.statistics?.length || 0),
                    0,
                  )}{" "}
                  métricas
                </span>
              </div>
              <StatisticsPanel
                stats={stats}
                homeName={event.teamA || "Casa"}
                awayName={event.teamB || "Fora"}
              />
            </div>

            {/* Match Timeline (Marcadores, Cartões, Substituições) */}
            <div className="rounded-2xl border border-white/10 bg-[#0E101A] p-5 sm:p-6">
              <h2 className="mb-5 flex items-center gap-2 text-lg font-black">
                <Flag className="h-5 w-5 text-[#E50914]" />
                Cronologia, Golos & Cartões
              </h2>
              <TimelinePanel items={summary?.timeline || []} />
            </div>

            {/* Starting Lineups & Substitutes */}
            <div className="rounded-2xl border border-white/10 bg-[#0E101A] p-5 sm:p-6">
              <h2 className="mb-5 flex items-center gap-2 text-lg font-black">
                <Shirt className="h-5 w-5 text-[#E50914]" />
                Onzes Iniciais, Formações & Suplentes
              </h2>
              <LineupsPanel lineups={summary?.lineups || []} />
            </div>
          </div>

          {/* Right Sidebar: Live Stream Card + Leaders + Match Info */}
          <aside className="space-y-5">
            {hasLiveStream && (
              <div className="rounded-2xl border border-[#E50914]/40 bg-gradient-to-br from-[#220910] to-[#110C14] p-5 shadow-[0_12px_32px_rgba(229,9,20,0.15)]">
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#E50914] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                  <Radio className="h-3 w-3 animate-pulse" />
                  {event.liveTag!.liveStatus === "live"
                    ? "EM DIRETO AGORA"
                    : "TRANSMISSÃO AGENDADA"}
                </div>
                <h3 className="mt-1 text-base font-black text-white">
                  {event.liveTag!.liveTitle}
                </h3>
                <p className="mt-1 text-xs text-gray-300">
                  Este jogo tem transmissão associada na plataforma LiveSports com chat em tempo real.
                </p>
                <Link
                  href={`/watch/${event.liveTag!.liveId}`}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#E50914] py-2.5 text-xs font-black uppercase tracking-wider text-white hover:bg-[#ff1f2a] transition-all"
                >
                  <Zap className="h-4 w-4" />
                  Assistir Live do Jogo
                </Link>
              </div>
            )}

            {leaders.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-[#0E101A] p-5">
                <h2 className="mb-4 flex items-center gap-2 text-base font-black">
                  <Award className="h-4 w-4 text-amber-400" />
                  Destaques Individuais
                </h2>
                <div className="space-y-2.5">
                  {leaders.slice(0, 6).map((ld, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-white/[0.06] bg-[#141621] p-3"
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        <span>{ld.category}</span>
                        <span className="truncate max-w-[120px]">{ld.teamName}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-white">
                          {ld.playerName}
                        </span>
                        <span className="text-xs font-bold text-[#ff6b73]">
                          {ld.displayValue}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-[#0E101A] p-5">
              <h2 className="mb-4 flex items-center gap-2 text-base font-black">
                <Trophy className="h-4 w-4 text-[#E50914]" />
                Ficha Técnica do Jogo
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3 py-1.5 border-b border-white/[0.05]">
                  <span className="text-gray-400">Modalidade</span>
                  <span className="font-bold">{getSportLabel(event.sport)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 py-1.5 border-b border-white/[0.05]">
                  <span className="text-gray-400">Competição</span>
                  <span className="flex min-w-0 items-center gap-2 font-bold">
                    {(event.leagueLogo || event.league) ? (
                      <ResilientLogo
                        src={event.leagueLogo}
                        name={event.league}
                        kind="league"
                        size={20}
                        alt=""
                        className="h-5 w-5 rounded bg-white/90 p-0.5"
                      />
                    ) : (
                      <Shield className="h-4 w-4" />
                    )}
                    <span className="truncate">{event.league || "-"}</span>
                  </span>
                </div>
                {(summary?.venue?.name || event.venue) && (
                  <div className="flex items-center justify-between gap-3 py-1.5 border-b border-white/[0.05]">
                    <span className="text-gray-400">Estádio / Recinto</span>
                    <span className="flex items-center gap-1.5 font-bold text-right">
                      <MapPin className="h-3.5 w-3.5 text-[#E50914] shrink-0" />
                      <span className="truncate max-w-[180px]">
                        {summary?.venue?.name || event.venue}
                      </span>
                    </span>
                  </div>
                )}
                {summary?.venue?.city && (
                  <div className="flex items-center justify-between gap-3 py-1.5 border-b border-white/[0.05]">
                    <span className="text-gray-400">Cidade</span>
                    <span className="font-bold">
                      {summary.venue.city}
                      {summary.venue.country ? `, ${summary.venue.country}` : ""}
                    </span>
                  </div>
                )}
                {(summary?.venue?.attendance || event.matchDetails?.attendance) ? (
                  <div className="flex items-center justify-between gap-3 py-1.5 border-b border-white/[0.05]">
                    <span className="text-gray-400">Assistência</span>
                    <span className="flex items-center gap-1.5 font-bold">
                      <Users className="h-3.5 w-3.5 text-gray-400" />
                      {Number(
                        summary?.venue?.attendance ||
                          event.matchDetails?.attendance,
                      ).toLocaleString("pt-PT")}{" "}
                      espetadores
                    </span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-3 py-1.5 border-b border-white/[0.05]">
                  <span className="text-gray-400">Data & Hora</span>
                  <span className="flex items-center gap-1.5 font-bold">
                    <CalendarClock className="h-4 w-4 text-gray-500" />
                    {formatKickoff(event.scheduledAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 py-1.5">
                  <span className="text-gray-400">Fonte de Dados</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    {summary?.source === "espn-v2-summary"
                      ? "ESPN"
                      : summary?.source || "Sincronizado"}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
