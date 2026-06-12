"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Shield } from "lucide-react";
import type { Event, Live } from "@/types";
import type { ApiListResponse } from "@/lib/api";
import { publicApiRequest } from "@/lib/api";

function isImageValue(value?: string) {
  return Boolean(value && (/^(https?:|data:|blob:)/.test(value) || value.startsWith("/")));
}

function TeamMark({ logo, name }: { logo?: string; name?: string }) {
  if (isImageValue(logo)) {
    return <img src={logo} alt="" className="h-10 w-10 rounded-full border border-white/10 bg-black/20 object-contain p-1" />;
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#262626] text-xs font-black text-white">
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

function EventCard({ event, live }: { event: Event; live?: Live }) {
  const hasScore = typeof event.scoreA === "number" && typeof event.scoreB === "number";
  const href = live ? `/watch/${live.id}` : `/evento/${event.id}`;
  const label = live ? "AO VIVO" : "EVENTO";
  const statusLabel = event.status === "finished" ? "90'" : event.status === "cancelled" ? "Cancelado" : event.matchTime || "Not Started";

  return (
    <Link
      href={href}
      className={`group relative min-h-[138px] flex-shrink-0 overflow-hidden rounded-lg border bg-[#181818] p-3 shadow-[0_16px_36px_rgba(0,0,0,0.32)] transition-all hover:-translate-y-0.5 hover:bg-[#202020] ${live ? "border-red-500/45 hover:border-red-400" : "border-white/10 hover:border-red-500/40"}`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-white/10" />

      <div className="mb-3 flex items-start justify-between gap-2">
        <span className="inline-flex items-center gap-1 rounded bg-[#E50914] px-2 py-1 text-[9px] font-black uppercase leading-none text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-white live-badge" />
          {label}
        </span>
        <span className="max-w-[92px] truncate text-right text-[10px] font-bold text-red-400">{statusLabel}</span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex min-w-0 flex-col items-start">
          <TeamMark logo={event.teamALogo} name={event.teamA} />
          <p className="mt-2 w-full truncate text-[11px] font-bold text-white">{event.teamA || event.title}</p>
        </div>

        <div className="text-center">
          {hasScore ? (
            <div className="score-display whitespace-nowrap text-2xl font-black leading-none text-white">
              {event.scoreA} - {event.scoreB}
            </div>
          ) : (
            <div className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-xs font-black text-white">
              {new Date(event.scheduledAt).toLocaleTimeString("pt-PT", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col items-end">
          <div className="ml-auto w-fit">
            <TeamMark logo={event.teamBLogo} name={event.teamB} />
          </div>
          <p className="mt-2 w-full truncate text-right text-[11px] font-bold text-white">{event.teamB || "Adversario"}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-1.5 text-center text-[10px] font-medium text-gray-500">
        {isImageValue(event.leagueLogo) ? <img src={event.leagueLogo} alt="" className="h-3.5 w-3.5 rounded object-contain" /> : <Shield className="h-3.5 w-3.5" />}
        <span className="truncate">{event.league || "Liga"}</span>
      </div>
    </Link>
  );
}

export default function LiveNowSection() {
  const [events, setEvents] = useState<Event[]>([]);
  const [lives, setLives] = useState<Live[]>([]);

  useEffect(() => {
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
      });
  }, []);

  const visibleEvents = useMemo(
    () =>
      [...events]
        .sort((a, b) => {
          if (a.status === "live" && b.status !== "live") return -1;
          if (a.status !== "live" && b.status === "live") return 1;
          return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
        })
        .slice(0, 8),
    [events]
  );

  const liveCount = lives.filter((live) => live.status === "live").length;

  return (
    <section className="py-8 lg:py-12">
      <div className="mx-auto max-w-[1400px] px-4 lg:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-6 w-1 rounded-full bg-[#E50914]" />
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#E50914] live-badge" />
                <h2 className="font-heading text-xl font-bold lg:text-2xl">Eventos em Destaque</h2>
              </div>
              <p className="text-xs text-gray-400">{liveCount} eventos ao vivo agora</p>
            </div>
          </div>
          <Link href="/ao-vivo" className="flex items-center gap-1 text-sm font-semibold text-[#E50914] transition-colors hover:text-red-400">
            Ver todos
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid auto-cols-[minmax(235px,1fr)] grid-flow-col gap-2 overflow-x-auto pb-4 scrollbar-hide lg:grid-flow-row lg:grid-cols-4 lg:pb-0 xl:grid-cols-5">
          {visibleEvents.map((event) => (
            <EventCard key={event.id} event={event} live={matchLive(event, lives)} />
          ))}
        </div>
      </div>
    </section>
  );
}
