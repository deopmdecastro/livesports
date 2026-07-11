import Link from "next/link";
import { ArrowLeft, CalendarClock, Flag, Shield, Shirt, Trophy } from "lucide-react";
import { notFound } from "next/navigation";
import type { Event } from "@/types";
import { serverApiRequest } from "@/lib/server-api";
import { resolveCountryFlagUrl } from "@/lib/flags";
import { getSportLabel } from "@/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

type ApiFootballStatistic = {
  type: string;
  value: number | string | null;
};

type ApiFootballTeamStats = {
  team?: {
    name?: string;
    logo?: string;
  };
  statistics?: ApiFootballStatistic[];
};

type EventStatisticsResponse = {
  source: string;
  items: ApiFootballTeamStats[];
};

type ApiFootballTimelineItem = {
  time?: {
    elapsed?: number;
    extra?: number | null;
  };
  team?: {
    name?: string;
    logo?: string;
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
};

type ApiFootballLineup = {
  team?: {
    name?: string;
    logo?: string;
  };
  formation?: string;
  startXI?: Array<{
    player?: {
      id?: number;
      name?: string;
      number?: number;
      pos?: string;
    };
  }>;
};

type EventSummaryResponse = {
  source: string;
  fixtureId?: string | null;
  fixture?: unknown;
  statistics: ApiFootballTeamStats[];
  timeline: ApiFootballTimelineItem[];
  lineups: ApiFootballLineup[];
};

function isImageValue(value?: string) {
  return Boolean(value && (/^(https?:|data:|blob:)/.test(value) || value.startsWith("/")));
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
  const parsed = Number(String(value).replace("%", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function statLabel(type: string) {
  const labels: Record<string, string> = {
    "Shots on Goal": "Remates no alvo",
    "Shots off Goal": "Remates fora",
    "Total Shots": "Remates",
    "Blocked Shots": "Remates bloqueados",
    "Shots insidebox": "Remates na area",
    "Shots outsidebox": "Remates fora da area",
    Fouls: "Faltas",
    "Corner Kicks": "Cantos",
    Offsides: "Foras de jogo",
    "Ball Possession": "Posse de bola",
    "Yellow Cards": "Cartoes amarelos",
    "Red Cards": "Cartoes vermelhos",
    "Goalkeeper Saves": "Defesas",
    "Total passes": "Passes",
    "Passes accurate": "Passes certos",
    "Passes %": "Precisao de passe",
  };
  return labels[type] || type;
}

function TeamLogo({ logo, name, code }: { logo?: string; name?: string; code?: string }) {
  const flagUrl = resolveCountryFlagUrl({ code, name, logo, size: 80 });
  const src = flagUrl || (isImageValue(logo) ? logo : null);

  if (src) {
    return <img src={src} alt="" className="h-20 w-20 rounded-full border border-white/10 bg-black/20 object-cover p-1" />;
  }

  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-[#202020] text-xl font-black text-white">
      {(name || "?").slice(0, 2).toUpperCase()}
    </div>
  );
}

function StatisticRow({ label, home, away }: { label: string; home: number | string | null; away: number | string | null }) {
  const homeValue = parseStatValue(home);
  const awayValue = parseStatValue(away);
  const total = Math.max(homeValue + awayValue, 1);
  const homeWidth = `${Math.max((homeValue / total) * 100, homeValue > 0 ? 8 : 0)}%`;
  const awayWidth = `${Math.max((awayValue / total) * 100, awayValue > 0 ? 8 : 0)}%`;

  return (
    <div className="rounded-lg border border-white/10 bg-[#171717] p-3">
      <div className="mb-2 flex items-center justify-between text-xs font-bold">
        <span className="text-white">{home ?? "-"}</span>
        <span className="text-gray-400">{label}</span>
        <span className="text-white">{away ?? "-"}</span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        <div className="h-2 overflow-hidden rounded-l-full bg-white/10">
          <div className="ml-auto h-full rounded-l-full bg-[#E50914]" style={{ width: homeWidth }} />
        </div>
        <div className="h-2 overflow-hidden rounded-r-full bg-white/10">
          <div className="h-full rounded-r-full bg-red-500" style={{ width: awayWidth }} />
        </div>
      </div>
    </div>
  );
}

function StatisticsPanel({ stats }: { stats?: EventStatisticsResponse | null }) {
  const teams = stats?.items || [];
  const homeStats = teams[0]?.statistics || [];
  const awayStats = teams[1]?.statistics || [];
  const statTypes = homeStats.map((item) => item.type).filter((type) => awayStats.some((item) => item.type === type));

  if (statTypes.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#171717] p-6 text-center">
        <Trophy className="mx-auto mb-3 h-8 w-8 text-gray-500" />
        <h2 className="text-lg font-bold text-white">Estatisticas ainda indisponiveis</h2>
        <p className="mt-2 text-sm text-gray-400">
          A ficha do jogo foi criada com dados reais, mas a API ainda nao retornou estatisticas detalhadas para este evento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
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

function TimelinePanel({ items }: { items: ApiFootballTimelineItem[] }) {
  if (!items.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#171717] p-6 text-center">
        <Flag className="mx-auto mb-3 h-8 w-8 text-gray-500" />
        <h2 className="text-lg font-bold text-white">Linha do tempo indisponivel</h2>
        <p className="mt-2 text-sm text-gray-400">A API ainda nao retornou lances detalhados para este jogo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const minute = item.time?.elapsed ? `${item.time.elapsed}${item.time.extra ? `+${item.time.extra}` : ""}'` : "-";
        const teamLogo = item.team?.logo;
        return (
          <div key={`${minute}-${item.type}-${index}`} className="flex gap-3 rounded-lg border border-white/10 bg-[#171717] p-3">
            <div className="flex h-9 w-12 flex-shrink-0 items-center justify-center rounded bg-black/30 text-xs font-black text-[#E50914]">
              {minute}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-white">
                {isImageValue(teamLogo) && <img src={teamLogo} alt="" className="h-5 w-5 object-contain" />}
                <span>{item.type || "Lance"}</span>
                {item.detail && <span className="text-gray-400">- {item.detail}</span>}
              </div>
              <p className="mt-1 text-sm text-gray-300">
                {item.player?.name || item.team?.name || "Evento do jogo"}
                {item.assist?.name ? `, assistencia: ${item.assist.name}` : ""}
              </p>
              {item.comments && <p className="mt-1 text-xs text-gray-500">{item.comments}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LineupsPanel({ lineups }: { lineups: ApiFootballLineup[] }) {
  if (!lineups.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#171717] p-6 text-center">
        <Shirt className="mx-auto mb-3 h-8 w-8 text-gray-500" />
        <h2 className="text-lg font-bold text-white">Escalacoes indisponiveis</h2>
        <p className="mt-2 text-sm text-gray-400">A API ainda nao publicou as escalacoes para este jogo.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {lineups.map((lineup) => (
        <div key={lineup.team?.name} className="rounded-xl border border-white/10 bg-[#171717] p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              {isImageValue(lineup.team?.logo) && <img src={lineup.team?.logo} alt="" className="h-8 w-8 object-contain" />}
              <h3 className="truncate text-sm font-black text-white">{lineup.team?.name || "Equipa"}</h3>
            </div>
            {lineup.formation && <span className="rounded bg-black/30 px-2 py-1 text-xs font-bold text-gray-300">{lineup.formation}</span>}
          </div>
          <div className="space-y-2">
            {(lineup.startXI || []).slice(0, 11).map(({ player }) => (
              <div key={`${player?.number}-${player?.name}`} className="flex items-center justify-between gap-3 rounded-lg bg-black/20 px-3 py-2 text-xs">
                <span className="min-w-0 truncate font-semibold text-white">
                  {player?.number ? `${player.number}. ` : ""}{player?.name || "Jogador"}
                </span>
                <span className="text-gray-500">{player?.pos || "-"}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const event = await serverApiRequest<Event>(`/events/${id}`);
  if (!event) notFound();

  const summary = await serverApiRequest<EventSummaryResponse>(`/events/${id}/summary`);
  const stats: EventStatisticsResponse = {
    source: summary?.source || "local",
    items: summary?.statistics || [],
  };
  const hasScore = typeof event.scoreA === "number" && typeof event.scoreB === "number";

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-6 text-white lg:px-6">
      <div className="mx-auto max-w-[1180px]">
        <Link href="/" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-400 transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#111]">
          <div className="relative p-5 lg:p-8">
            <div className="absolute inset-0 opacity-20">
              {isImageValue(event.thumbnail) && <img src={event.thumbnail} alt="" className="h-full w-full object-cover" />}
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-[#111]/90 to-[#111]" />
            </div>

            <div className="relative">
              <div className="mb-8 flex flex-wrap items-center gap-2 text-xs font-bold text-gray-300">
                <span className="rounded-full bg-[#E50914] px-3 py-1 text-white">{event.status === "live" ? "AO VIVO" : event.status === "finished" ? "FINALIZADO" : event.status === "cancelled" ? "CANCELADO" : "EVENTO"}</span>
                <span>{event.league || getSportLabel(event.sport)}</span>
                <span>|</span>
                <span>{formatKickoff(event.scheduledAt)}</span>
              </div>

              <div className="grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
                <div className="flex flex-col items-center text-center">
                  <TeamLogo logo={event.teamALogo} name={event.teamA} code={event.teamACode} />
                  <h1 className="mt-3 text-xl font-black lg:text-2xl">{event.teamA || event.title}</h1>
                </div>

                <div className="text-center">
                  <div className="score-display text-5xl font-black leading-none lg:text-7xl">
                    {hasScore ? `${event.scoreA} - ${event.scoreB}` : "vs"}
                  </div>
                  <p className="mt-3 text-sm font-bold text-[#E50914]">{event.matchTime || "Pre-jogo"}</p>
                </div>

                <div className="flex flex-col items-center text-center">
                  <TeamLogo logo={event.teamBLogo} name={event.teamB} code={event.teamBCode} />
                  <h2 className="mt-3 text-xl font-black lg:text-2xl">{event.teamB || "Adversario"}</h2>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-[#111] p-5">
              <h2 className="mb-4 text-lg font-black">Estatisticas do jogo</h2>
              <StatisticsPanel stats={stats} />
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#111] p-5">
              <h2 className="mb-4 text-lg font-black">Linha do tempo</h2>
              <TimelinePanel items={summary?.timeline || []} />
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#111] p-5">
              <h2 className="mb-4 text-lg font-black">Escalacoes</h2>
              <LineupsPanel lineups={summary?.lineups || []} />
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-[#111] p-5">
              <h2 className="mb-4 text-lg font-black">Ficha</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-400">Modalidade</span>
                  <span className="font-bold">{getSportLabel(event.sport)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-400">Liga</span>
                  <span className="flex min-w-0 items-center gap-2 font-bold">
                    {isImageValue(event.leagueLogo) ? <img src={event.leagueLogo} alt="" className="h-5 w-5 object-contain" /> : <Shield className="h-4 w-4" />}
                    <span className="truncate">{event.league || "-"}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-400">Horario</span>
                  <span className="flex items-center gap-2 font-bold"><CalendarClock className="h-4 w-4 text-gray-500" />{formatKickoff(event.scheduledAt)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-400">Estado</span>
                  <span className="font-bold capitalize">{event.status}</span>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
