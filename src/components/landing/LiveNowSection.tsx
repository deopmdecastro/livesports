"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Zap } from "lucide-react";
import type { Event, Live } from "@/types";
import type { ApiListResponse } from "@/lib/api";
import { publicApiRequest } from "@/lib/api";
import { resolveCountryFlagUrl } from "@/lib/flags";
import { useLang } from "@/lib/lang";

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function isImageValue(value?: string) {
  return Boolean(value && (/^(https?:|data:|blob:)/.test(value) || value.startsWith("/")));
}

function TeamMark({ logo, name, code }: { logo?: string; name?: string; code?: string }) {
  const flagUrl = resolveCountryFlagUrl({ code, name, logo, size: 40 });
  const src = flagUrl || (isImageValue(logo) ? logo : null);
  if (src) return <img loading="lazy" src={src} alt={name || ""} className="h-10 w-10 rounded-full border border-white/10 bg-black/20 object-cover p-0.5" />;
  return (
    <div className="h-10 w-10 flex items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-[#1A1A28] to-[#0A0A14] font-black text-white text-xs">
      {(name || "?").slice(0, 2).toUpperCase()}
    </div>
  );
}

function normalize(v?: string) {
  return (v || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "");
}

function matchLive(event: Event, lives: Live[]) {
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
  const href = live ? `/watch/${live.id}` : `/evento/${event.id}`;
  const statusLabel = event.status === "finished" ? "FT" : event.status === "cancelled" ? "Canc." : event.matchTime || "—";
  const isFinished = event.status === "finished";

  return (
    <Link href={href}
      className="group relative flex-shrink-0 w-[260px] sm:w-[280px] overflow-hidden rounded-2xl
        bg-gradient-to-br from-[#0F111C] to-[#0A0C14] border border-white/[0.04]
        hover:border-[#E50914]/20 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_24px_rgba(229,9,20,0.08)]
        transition-all duration-300 hover:-translate-y-1">

      {/* Top accent for live */}
      {isLive && <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#E50914] to-transparent" />}

      {/* Status badge */}
      <div className="absolute top-3 right-3 z-10">
        {isLive
          ? <span className="badge-live"><span className="badge-live-dot" /> AO VIVO</span>
          : <span className={`badge text-[10px] px-2 py-0.5 ${isFinished ? "badge-green" : "badge-blue"}`}>{statusLabel}</span>}
      </div>

      {/* Thumbnail bg */}
      {event.thumbnail && (
        <div className="absolute inset-0 opacity-[0.04] group-hover:opacity-[0.07] transition-opacity">
          <img loading="lazy" src={event.thumbnail} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      <div className="relative p-5">
        {/* League */}
        <div className="flex items-center gap-2 mb-4">
          {isImageValue(event.leagueLogo)
            ? <img loading="lazy" src={event.leagueLogo} alt="" className="h-4 w-4 object-contain opacity-60" />
            : null}
          <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider truncate">
            {event.league || event.sport || "Desporto"}
          </span>
        </div>

        {/* Teams and score */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
            <TeamMark logo={event.teamALogo} name={event.teamA} code={event.teamACode} />
            <span className="text-xs font-semibold text-white/80 text-center truncate w-full">
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
            <span className="text-sm font-bold text-white/15 flex-shrink-0">VS</span>
          )}

          <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
            <TeamMark logo={event.teamBLogo} name={event.teamB} code={event.teamBCode} />
            <span className="text-xs font-semibold text-white/80 text-center truncate w-full">
              {event.teamB || "—"}
            </span>
          </div>
        </div>

        {/* Date + viewers */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
          <span className="text-[10px] text-white/25">
            {new Date(event.scheduledAt).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
          </span>
          {(event.viewerCount ?? 0) > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-white/25">
              <Eye className="h-3 w-3 text-[#E50914]/60" /> {event.viewerCount}
            </span>
          )}
        </div>
      </div>
    </Link>
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

  const liveEvents = useMemo(() => events.filter((e) => e.status === "live"), [events]);
  const upcomingEvents = useMemo(
    () => events
      .filter((e) => e.status !== "finished" && e.status !== "cancelled")
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .slice(0, 12),
    [events]
  );

  const displayEvents = liveEvents.length >= 2 ? liveEvents : upcomingEvents;

  if (loading) {
    return (
      <section className="py-10">
        <div className="max-w-[1400px] mx-auto px-5 lg:px-8">
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
    <section className="py-10 lg:py-14 border-t border-white/[0.03]">
      <div className="max-w-[1400px] mx-auto px-5 lg:px-8">
        <div className="section-header">
          <div className="section-header-bar" />
          <div>
            <h2>
              {liveEvents.length > 0 ? t.nav_live_now : "Próximos Eventos"}
            </h2>
            <p className="section-header-sub">
              {liveEvents.length > 0
                ? `${liveEvents.length} transmissão(ões) ao vivo agora`
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
