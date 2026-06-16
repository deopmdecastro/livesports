"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Shield, Eye, Zap, Clock } from "lucide-react";
import type { Event, Live } from "@/types";
import type { ApiListResponse } from "@/lib/api";
import { publicApiRequest } from "@/lib/api";
import { useLang } from "@/lib/lang";

function isImageValue(value?: string) {
  return Boolean(value && (/^(https?:|data:|blob:)/.test(value) || value.startsWith("/")));
}

function TeamMark({ logo, name, size = "md" }: { logo?: string; name?: string; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "h-9 w-9 text-[10px]" : "h-11 w-11 text-xs";
  if (isImageValue(logo)) {
    return (
      <img
        src={logo}
        alt={name || "team"}
        className={`${sz} rounded-full border border-white/10 bg-black/30 object-contain p-0.5`}
      />
    );
  }
  return (
    <div className={`${sz} flex items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-[#1A1A28] to-[#0E0E16] font-black text-white`}>
      {(name || "?").slice(0, 2).toUpperCase()}
    </div>
  );
}

function normalize(value?: string) {
  return (value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "");
}

function matchLive(event: Event, lives: Live[]) {
  const eventTitle = normalize(event.title);
  const eventTeams = [normalize(event.teamA), normalize(event.teamB)].filter(Boolean).join("-");
  const eventLeague = normalize(event.league);

  return lives.find((live) => {
    const liveTitle = normalize(live.title);
    const liveTeams = [normalize(live.teamA), normalize(live.teamB)].filter(Boolean).join("-");
    const sameTitle = eventTitle && liveTitle && eventTitle === liveTitle;
    const sameTeams = eventTeams && liveTeams && eventTeams === liveTeams;
    const sameLeague = !eventLeague || !live.league || normalize(live.league) === eventLeague;
    return (sameTitle || sameTeams) && sameLeague;
  });
}

function formatViewers(n?: number) {
  if (!n) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function EventCard({ event, live }: { event: Event; live?: Live }) {
  const hasScore = typeof event.scoreA === "number" && typeof event.scoreB === "number";
  const href = live ? `/watch/${live.id}` : `/evento/${event.id}`;
  const isLive = event.status === "live";
  const isUpcoming = event.status === "upcoming";
  const viewers = formatViewers(event.viewerCount);

  const statusLabel =
    event.status === "finished" ? "FT" :
    event.status === "cancelled" ? "Canc." :
    event.matchTime || "—";

  return (
    <Link
      href={href}
      className={`group relative flex-shrink-0 overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 ${
        isLive
          ? "border border-[#E50914]/40 bg-gradient-to-br from-[#14121A] to-[#0E0C14] shadow-[0_4px_24px_rgba(229,9,20,0.15)] hover:shadow-[0_8px_32px_rgba(229,9,20,0.25)]"
          : "border border-[#1E1E2A] bg-gradient-to-br from-[#111118] to-[#0E0E16] hover:border-[#E50914]/25 hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
      }`}
    >
      {/* Top accent line */}
      {isLive && <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#E50914] to-transparent" />}

      {/* Glow blur bg for live */}
      {isLive && <div className="absolute inset-0 bg-[#E50914]/3 pointer-events-none" />}

      <div className="relative p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex items-center gap-1.5">
            {isImageValue(event.leagueLogo) ? (
              <img src={event.leagueLogo} alt="" className="h-4 w-4 object-contain opacity-80" />
            ) : (
              <Shield className="h-3.5 w-3.5 text-gray-600" />
            )}
            <span className="text-[10px] font-semibold text-gray-500 truncate max-w-[100px]">
              {event.league || "Liga"}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {viewers && (
              <span className="flex items-center gap-1 text-[9px] text-gray-600 font-medium">
                <Eye className="h-2.5 w-2.5" />
                {viewers}
              </span>
            )}
            <span
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                isLive ? "badge-live text-white" : isUpcoming ? "bg-blue-500/10 border border-blue-500/20 text-blue-400" : "bg-gray-500/10 border border-gray-500/20 text-gray-500"
              }`}
            >
              {isLive && <span className="live-badge h-1.5 w-1.5 rounded-full bg-white" />}
              {isLive ? "LIVE" : isUpcoming ? "EM BREVE" : "FT"}
            </span>
          </div>
        </div>

        {/* Teams + Score */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          {/* Team A */}
          <div className="flex flex-col items-center gap-2">
            <TeamMark logo={event.teamALogo} name={event.teamA} />
            <p className="text-[11px] font-bold text-white text-center leading-tight max-w-full truncate">
              {event.teamA || event.title}
            </p>
          </div>

          {/* Score/Time */}
          <div className="flex flex-col items-center gap-1">
            {hasScore ? (
              <>
                <div className="score-display text-2xl font-black text-white leading-none">
                  {event.scoreA} – {event.scoreB}
                </div>
                <span className={`text-[10px] font-bold ${isLive ? "text-[#E50914]" : "text-gray-500"}`}>
                  {statusLabel}
                </span>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <div className="px-3 py-1.5 rounded-lg border border-[#1E1E2A] bg-[#0E0E16]">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                    <Clock className="h-3 w-3" />
                    {new Date(event.scheduledAt).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Team B */}
          <div className="flex flex-col items-center gap-2">
            <TeamMark logo={event.teamBLogo} name={event.teamB} />
            <p className="text-[11px] font-bold text-white text-center leading-tight max-w-full truncate">
              {event.teamB || "Adversário"}
            </p>
          </div>
        </div>

        {/* Watch overlay on hover */}
        <div className="mt-4 flex items-center justify-center gap-2 py-2 rounded-lg bg-white/0 group-hover:bg-[#E50914]/10 border border-transparent group-hover:border-[#E50914]/20 transition-all">
          <Zap className="h-3.5 w-3.5 text-[#E50914] opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="text-[11px] font-bold text-[#E50914] opacity-0 group-hover:opacity-100 transition-opacity">
            {isLive ? "Assistir ao Vivo" : "Ver Detalhes"}
          </span>
        </div>
      </div>
    </Link>
  );
}

function EventCardSkeleton() {
  return (
    <div className="flex-shrink-0 rounded-2xl border border-[#1E1E2A] bg-[#111118] p-4 min-h-[180px]">
      <div className="shimmer rounded mb-3 h-3 w-24" />
      <div className="grid grid-cols-3 gap-3 items-center">
        <div className="flex flex-col items-center gap-2">
          <div className="shimmer rounded-full h-11 w-11" />
          <div className="shimmer rounded h-2 w-16" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="shimmer rounded h-7 w-16" />
          <div className="shimmer rounded h-2 w-8" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="shimmer rounded-full h-11 w-11" />
          <div className="shimmer rounded h-2 w-16" />
        </div>
      </div>
    </div>
  );
}

export default function LiveNowSection() {
  const { t } = useLang();
  const [events, setEvents] = useState<Event[]>([]);
  const [lives, setLives] = useState<Live[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      publicApiRequest<Event[]>("/events"),
      publicApiRequest<ApiListResponse<Live>>("/lives?limit=100"),
    ])
      .then(([eventsData, livesData]) => {
        setEvents(eventsData);
        setLives(livesData.items || []);
      })
      .catch(() => {
        setEvents([]);
        setLives([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const visibleEvents = useMemo(
    () =>
      [...events]
        .sort((a, b) => {
          if (a.status === "live" && b.status !== "live") return -1;
          if (a.status !== "live" && b.status === "live") return 1;
          return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
        })
        .slice(0, 10),
    [events]
  );

  const liveCount = lives.filter((live) => live.status === "live").length;

  return (
    <section className="py-10 lg:py-14">
      <div className="mx-auto max-w-[1400px] px-4 lg:px-6">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-10 w-1.5 bg-gradient-to-b from-[#E50914] to-[#B00000] rounded-full" />
              {liveCount > 0 && (
                <div className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-[#E50914] live-badge" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5 mb-0.5">
                {liveCount > 0 && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E50914]/12 border border-[#E50914]/25 text-[#E50914] text-[10px] font-black uppercase tracking-wider">
                    <span className="live-badge h-1.5 w-1.5 rounded-full bg-[#E50914]" />
                    {liveCount} {t.section_live_count}
                  </span>
                )}
              </div>
              <h2
                className="text-xl lg:text-2xl font-black text-white"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {t.section_featured}
              </h2>
            </div>
          </div>
          <Link
            href="/ao-vivo"
            className="flex items-center gap-1.5 text-sm font-bold text-[#E50914] hover:text-red-400 transition-colors"
          >
            {t.section_see_all}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid auto-cols-[minmax(220px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-4 scrollbar-hide lg:grid-flow-row lg:grid-cols-4 lg:pb-0 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ) : visibleEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#111118] border border-[#1E1E2A] flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-gray-600" />
            </div>
            <p className="text-gray-400 font-medium">Nenhum evento disponível no momento</p>
            <p className="text-gray-600 text-sm mt-1">Volte em breve para os próximos jogos</p>
          </div>
        ) : (
          <div className="grid auto-cols-[minmax(220px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-4 scrollbar-hide lg:grid-flow-row lg:grid-cols-4 lg:pb-0 xl:grid-cols-5">
            {visibleEvents.map((event) => (
              <EventCard key={event.id} event={event} live={matchLive(event, lives)} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
