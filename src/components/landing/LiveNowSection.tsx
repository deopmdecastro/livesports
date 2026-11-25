"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, Eye, Radio, Zap } from "lucide-react";
import type { Event, Live } from "@/types";
import type { ApiListResponse } from "@/lib/api";
import ResilientLogo from "@/components/ui/ResilientLogo";
import EventCover from "@/components/ui/EventCover";
import { publicApiRequest } from "@/lib/api";
import { useLang } from "@/lib/lang";

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function TeamMark({ logo, name, code }: { logo?: string; name?: string; code?: string }) {
  return (
    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-black/25 p-1">
      <ResilientLogo src={logo} name={name} code={code} kind="team" size={40} alt={name || ""} className="h-full w-full" />
    </div>
  );
}

function normalize(v?: string) {
  return (v || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "");
}

function matchLive(event: Event, lives: Live[]) {
  if (event.id.startsWith("live-room-")) {
    const rawId = event.id.replace("live-room-", "");
    return lives.find((l) => l.id === rawId);
  }
  const et = normalize(event.title);
  const ett = [normalize(event.teamA), normalize(event.teamB)].filter(Boolean).join("-");
  return lives.find((l) => {
    const lt = normalize(l.title);
    const ltt = [normalize(l.teamA), normalize(l.teamB)].filter(Boolean).join("-");
    return (et && lt && et === lt) || (ett && ltt && ett === ltt);
  });
}

/* ── LiveCard ─────────────────────────────────────────────────────────────── */

function LiveCard({ event, live }: { event: Event; live?: Live }) {
  const isLive = event.status === "live";
  const hasScore = typeof event.scoreA === "number" && typeof event.scoreB === "number";
  const resolvedLiveId = live?.id || event.liveTag?.liveId;
  const resolvedLiveStatus = live?.status || event.liveTag?.liveStatus;
  const isSyntheticLiveRoom = event.id.startsWith("live-room-");
  const statsHref = isSyntheticLiveRoom
    ? `/watch/${resolvedLiveId || event.id.replace("live-room-", "")}`
    : `/evento/${encodeURIComponent(event.id)}`;
  const statusLabel = event.status === "finished" ? "FT" : event.status === "cancelled" ? "Canc." : event.matchTime || "—";
  const isFinished = event.status === "finished";
  const scorers = event.matchDetails?.scorers || [];

  return (
    <div
      className="group relative isolate flex-shrink-0 w-[min(272px,82vw)] sm:w-[292px] overflow-hidden rounded-2xl
        bg-gradient-to-br from-[#0F111C] to-[#0A0C14] border border-white/[0.06]
        hover:border-[#E50914]/35 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_28px_rgba(229,9,20,0.12)]
        transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
    >
      {/* Top accent for live */}
      {(isLive || Boolean(resolvedLiveId)) && (
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#E50914] to-transparent" />
      )}

      {/* Status + Live stream badge */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
        {resolvedLiveId && (
          <Link
            href={`/watch/${resolvedLiveId}`}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border transition-all ${
              resolvedLiveStatus === "live"
                ? "bg-[#E50914] text-white border-[#E50914] shadow-[0_0_12px_rgba(229,9,20,0.45)]"
                : "bg-emerald-500/15 text-emerald-300 border-emerald-500/35 hover:bg-emerald-500/25"
            }`}
          >
            <Radio className="h-2.5 w-2.5 animate-pulse" />
            {resolvedLiveStatus === "live" ? "LIVE" : "TEM LIVE"}
          </Link>
        )}
        {isLive
          ? <span className="badge-live"><span className="badge-live-dot" /> AO VIVO</span>
          : <span className={`badge text-[10px] px-2 py-0.5 ${isFinished ? "badge-green" : "badge-blue"}`}>{statusLabel}</span>}
      </div>

      <div className="pointer-events-none absolute inset-0 -z-10"><EventCover src={live?.banner || live?.thumbnail || event.thumbnail} leagueLogo={event.leagueLogo} sport={event.sport} className="h-full" /></div>

      <div className="relative p-5 flex flex-col justify-between flex-1">
        <Link href={statsHref} className="block">
          {/* League */}
          <div className="flex items-center gap-2 mb-4 pr-24">
            {(event.leagueLogo || event.league) ? (
              <ResilientLogo
                src={event.leagueLogo}
                name={event.league || event.sport}
                kind="league"
                size={24}
                alt=""
                className="h-4 w-4 opacity-75"
              />
            ) : null}
            <span className="text-[10px] font-semibold text-white/35 uppercase tracking-wider truncate">
              {event.league || event.sport || "Desporto"}
            </span>
          </div>

          {/* Teams and score */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              <TeamMark logo={event.teamALogo} name={event.teamA} code={event.teamACode} />
              <span className="text-xs font-semibold text-white/85 text-center truncate w-full">
                {event.teamA || "—"}
              </span>
            </div>

            {hasScore ? (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-2xl font-black text-white tabular-nums">{event.scoreA}</span>
                <span className="text-sm font-bold text-white/20">–</span>
                <span className="text-2xl font-black text-white tabular-nums">{event.scoreB}</span>
              </div>
            ) : (
              <span className="text-sm font-bold text-white/25 flex-shrink-0">VS</span>
            )}

            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              <TeamMark logo={event.teamBLogo} name={event.teamB} code={event.teamBCode} />
              <span className="text-xs font-semibold text-white/85 text-center truncate w-full">
                {event.teamB || "—"}
              </span>
            </div>
          </div>

          {scorers.length > 0 && (
            <div className="mb-3 pt-2 border-t border-white/[0.05] text-[10px] text-white/65 flex flex-wrap gap-x-2 gap-y-0.5">
              {scorers.slice(0, 3).map((s, idx) => (
                <span key={idx} className="inline-flex items-center gap-0.5 truncate max-w-[120px]">
                  <span className="text-emerald-400">⚽</span>
                  <span className="font-semibold text-white/85 truncate">{s.player}</span>
                  <span className="text-white/40">{s.minute}</span>
                </span>
              ))}
            </div>
          )}
        </Link>

        {/* Date + actions */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/[0.06]">
          <Link
            href={statsHref}
            className="inline-flex items-center gap-1 text-[10px] font-bold text-white/65 hover:text-white transition-colors"
          >
            <BarChart3 className="h-3 w-3 text-[#E50914]" />
            {isSyntheticLiveRoom ? "Ver sala" : "Estatísticas"}
          </Link>
          {resolvedLiveId ? (
            <Link
              href={`/watch/${resolvedLiveId}`}
              className="inline-flex items-center gap-1 rounded-md bg-[#E50914]/15 border border-[#E50914]/35 px-2 py-0.5 text-[10px] font-black text-[#ff6b73] hover:bg-[#E50914] hover:text-white transition-all"
            >
              <Zap className="h-2.5 w-2.5" />
              Assistir Live
            </Link>
          ) : (
            <span className="text-[10px] text-white/30">
              {new Date(event.scheduledAt).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── LiveNowSection ───────────────────────────────────────────────────────── */

export default function LiveNowSection() {
  const { t } = useLang();
  const [events, setEvents] = useState<Event[]>([]);
  const [lives, setLives] = useState<Live[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [eventsRes, livesRes] = await Promise.all([
          publicApiRequest<Event[]>("/events?limit=30"),
          publicApiRequest<ApiListResponse<Live>>("/lives?limit=50"),
        ]);
        setEvents(Array.isArray(eventsRes) ? eventsRes : []);
        setLives(livesRes.items || []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const liveStreamsAsEvents: Event[] = useMemo(() => {
    return lives
      .filter((l) => l.status === "live")
      .map((l) => ({
        id: `live-room-${l.id}`,
        title: l.title,
        sport: l.sport,
        league: l.league,
        leagueLogo: l.leagueLogo,
        teamA: l.teamA,
        teamALogo: l.teamALogo,
        teamB: l.teamB,
        teamBLogo: l.teamBLogo,
        scoreA: l.scoreA,
        scoreB: l.scoreB,
        matchTime: l.matchTime || "AO VIVO",
        scheduledAt: l.scheduledAt || l.startedAt || new Date().toISOString(),
        status: "live" as const,
        thumbnail: l.thumbnail || l.banner,
        featured: l.featured,
        viewerCount: l.viewerCount,
        createdAt: l.createdAt || new Date().toISOString(),
      }));
  }, [lives]);

  const liveEvents = useMemo(() => {
    const fromEvents = events.filter((e) => e.status === "live");
    const combined = [...liveStreamsAsEvents];
    for (const ev of fromEvents) {
      const exists = combined.some(
        (c) => normalize(c.title) === normalize(ev.title) || (c.teamA && ev.teamA && normalize(c.teamA) === normalize(ev.teamA)),
      );
      if (!exists) combined.push(ev);
    }
    return combined;
  }, [events, liveStreamsAsEvents]);

  const upcomingEvents = useMemo(
    () => events
      .filter((e) => e.status !== "finished" && e.status !== "cancelled")
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .slice(0, 12),
    [events]
  );

  const displayEvents = liveEvents.length >= 2 ? liveEvents : [...liveEvents, ...upcomingEvents].slice(0, 12);

  if (loading) {
    return (
      <section className="py-10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-5 lg:px-8">
          <div className="section-header">
            <div className="section-header-bar" />
            <div>
              <div className="h-7 w-48 anim-shimmer rounded" />
              <div className="h-3 w-32 anim-shimmer rounded mt-1" />
            </div>
          </div>
          <div className="live-scroll">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-[260px] h-[220px] anim-shimmer rounded-2xl flex-shrink-0" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (displayEvents.length === 0) return null;

  return (
    <section className="py-8 sm:py-10 lg:py-14 border-t border-white/[0.03]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-5 lg:px-8">
        <div className="section-header">
          <div className="section-header-bar" />
          <div>
            <h2>
              {liveEvents.length > 0 ? t.nav_live_now : "Próximos Eventos"}
            </h2>
            <p className="section-header-sub">
              {liveEvents.length > 0
                ? `${liveEvents.length} evento(s) a decorrer agora`
                : "Os próximos jogos na plataforma"}
            </p>
          </div>
          {liveEvents.length > 0 && (
            <span className="ml-auto badge-live"><span className="badge-live-dot" /> AO VIVO</span>
          )}
        </div>

        <div className="live-scroll">
          {displayEvents.map((event) => (
            <LiveCard key={event.id} event={event} live={matchLive(event, lives)} />
          ))}
        </div>
      </div>
    </section>
  );
}
