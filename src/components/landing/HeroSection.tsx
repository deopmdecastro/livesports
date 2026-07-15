"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock, Play, Eye, Users, Zap, Trophy, Tv2, Radio, BarChart3, Star } from "lucide-react";
import type { Ad, Live } from "@/types";
import { publicApiRequest, type ApiListResponse } from "@/lib/api";
import { resolveCountryFlagUrl } from "@/lib/flags";
import { useLang } from "@/lib/lang";

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function isImageValue(value?: string) {
  return Boolean(value && (/^(https?:|data:|blob:)/.test(value) || value.startsWith("/")));
}

function TeamCrest({ logo, name, code, size = "md" }: {
  logo?: string; name?: string; code?: string; size?: "sm" | "md" | "lg";
}) {
  const sizeMap = { sm: 32, md: 48, lg: 64 };
  const px = sizeMap[size];
  const flagUrl = resolveCountryFlagUrl({ code, name, logo, size: px });
  const src = flagUrl || (isImageValue(logo) ? logo : null);

  if (src) return (
    <img loading="lazy" src={src} alt={name || ""}
      className="w-12 h-12 lg:w-14 lg:h-14 rounded-full border-2 border-white/10 object-cover bg-black/40 p-0.5" />
  );
  const initials = (name || "?").slice(0, 2).toUpperCase();
  return (
    <div className="w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center rounded-full
      border-2 border-white/8 bg-gradient-to-br from-[#1A1A28] to-[#0A0A14] font-black text-white text-sm">
      {initials}
    </div>
  );
}

function formatViewers(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1920&q=80",
  "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=1920&q=80",
  "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1920&q=80",
];

/* ── LiveHeroCard ─────────────────────────────────────────────────────────── */

function LiveHeroCard({ live }: { live: Live }) {
  const isLive = live.status === "live";
  const hasScore = typeof live.scoreA === "number" && typeof live.scoreB === "number";

  return (
    <Link href={`/watch/${live.id}`} className="group block">
      <div className={`relative overflow-hidden rounded-2xl transition-all duration-500 group-hover:-translate-y-1
        ${isLive
          ? "border border-[#E50914]/30 bg-gradient-to-br from-[#14060A] via-[#0A0C14] to-[#06070D] shadow-[0_0_40px_rgba(229,9,20,0.15)]"
          : "border border-white/8 bg-gradient-to-br from-[#0F111C] to-[#0A0C14]"}
      `}>
        {isLive && (
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#E50914] to-transparent" />
        )}

        {/* Background image */}
        {(live.banner || live.thumbnail) && (
          <div className="absolute inset-0 opacity-8 group-hover:opacity-12 transition-opacity duration-700">
            <img loading="lazy" src={live.banner || live.thumbnail} alt="" 
              className="h-full w-full object-cover scale-105 group-hover:scale-110 transition-transform duration-1000" />
          </div>
        )}

        <div className="relative p-5">
          {/* League header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              {isImageValue(live.leagueLogo)
                ? <img loading="lazy" src={live.leagueLogo} alt="" className="h-5 w-5 object-contain opacity-80" />
                : <Trophy className="h-4 w-4 text-white/30" />}
              <span className="text-[11px] font-semibold text-white/60 truncate max-w-[140px]">
                {live.league || "Desporto"}
              </span>
            </div>
            {isLive && <span className="badge-live"><span className="badge-live-dot" /> AO VIVO</span>}
          </div>

          {/* Teams & Score */}
          <div className="flex items-center justify-center gap-5 mb-5 py-2">
            <div className="flex flex-col items-center gap-2 flex-1">
              <TeamCrest logo={live.teamALogo} name={live.teamA} />
              <span className="text-[13px] font-bold text-white/90 text-center leading-tight line-clamp-2">
                {live.teamA || "Time A"}
              </span>
            </div>

            {hasScore ? (
              <div className="flex items-center gap-2">
                <span className="text-3xl font-black text-white tabular-nums">{live.scoreA}</span>
                <span className="text-lg font-bold text-white/30">–</span>
                <span className="text-3xl font-black text-white tabular-nums">{live.scoreB}</span>
              </div>
            ) : (
              <span className="text-lg font-bold text-white/20">VS</span>
            )}

            <div className="flex flex-col items-center gap-2 flex-1">
              <TeamCrest logo={live.teamBLogo} name={live.teamB} />
              <span className="text-[13px] font-bold text-white/90 text-center leading-tight line-clamp-2">
                {live.teamB || "Time B"}
              </span>
            </div>
          </div>

          {/* Footer stats */}
          <div className="flex items-center justify-between pt-3 border-t border-white/6">
            <div className="flex items-center gap-3 text-[11px] text-white/40">
              {live.viewerCount > 0 && (
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {formatViewers(live.viewerCount)}</span>
              )}
              {live.matchTime && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {live.matchTime}</span>}
            </div>
            <Play className="h-4 w-4 text-[#E50914] group-hover:scale-110 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── Main HeroSection Component ───────────────────────────────────────────── */

export default function HeroSection() {
  const { t } = useLang();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [allLives, setAllLives] = useState<Live[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [countdown, setCountdown] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Fetch data ── */
  useEffect(() => {
    const load = async () => {
      try {
        const [livesRes, adsRes] = await Promise.all([
          publicApiRequest<ApiListResponse<Live>>("/lives?limit=50"),
          publicApiRequest<Ad[]>("/ads?status=active"),
        ]);
        setAllLives(livesRes.items || []);
        setAds(Array.isArray(adsRes) ? adsRes : []);
      } catch { /* silent */ }
    };
    load();
  }, []);

  /* ── Build slides ── */
  const slides = useMemo(() => {
    const items: Array<{
      id: string; kind: "live" | "ad"; isLive: boolean;
      image: string; title: string; subtitle: string;
      highlight: string; cta: string;
      live?: Live; ad?: Ad;
    }> = [];

    const liveLives = allLives.filter((l) => l.status === "live");
    const featured = allLives.filter((l) => l.featured && l.status !== "ended");
    const scheduled = allLives.filter((l) => l.status === "scheduled");

    // Priority: live > featured > scheduled > ads
    const priorityLives = [...liveLives, ...featured, ...scheduled].slice(0, 4);

    for (const live of priorityLives) {
      const img = live.banner || live.thumbnail || FALLBACK_IMAGES[items.length % 3];
      items.push({
        id: `live-${live.id}`,
        kind: "live",
        isLive: live.status === "live",
        image: img,
        title: live.teamA && live.teamB ? `${live.teamA} vs ${live.teamB}` : live.title,
        subtitle: live.league || live.description || "Transmissão ao vivo",
        highlight: live.status === "live" ? "AO VIVO" : live.status === "scheduled" ? "AGENDADO" : "DESTAQUE",
        cta: live.status === "live" ? "Assistir Agora" : "Ver Detalhes",
        live,
      });
    }

    // Fill remaining slots with ads
    const heroAds = ads.filter((a) => a.position === "header" || a.position === "live_preroll").slice(0, 2);
    for (const ad of heroAds) {
      if (items.length >= 6) break;
      items.push({
        id: `ad-${ad.id}`,
        kind: "ad",
        isLive: false,
        image: ad.imageUrl || FALLBACK_IMAGES[items.length % 3],
        title: ad.title,
        subtitle: ad.campaign || "Patrocinador",
        highlight: "PATROCINADO",
        cta: ad.clickUrl ? "Saber Mais" : "",
        ad,
      });
    }

    // Fallback placeholder
    if (items.length === 0) {
      items.push({
        id: "fallback",
        kind: "ad",
        isLive: false,
        image: FALLBACK_IMAGES[0],
        title: "LiveSports",
        subtitle: "A melhor plataforma de streaming desportivo",
        highlight: "EM BREVE",
        cta: "Explorar",
      });
    }

    return items;
  }, [allLives, ads]);

  /* ── Auto-play ── */
  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    autoPlayRef.current = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrent((c) => (c + 1) % slides.length);
        setIsTransitioning(false);
      }, 300);
    }, 6000);
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, [slides.length, paused]);

  /* ── Countdown ── */
  useEffect(() => {
    const nextMatch = allLives
      .filter((l) => l.status === "scheduled" && l.scheduledAt)
      .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())[0];

    if (!nextMatch?.scheduledAt) return;

    const tick = () => {
      const now = Date.now();
      const target = new Date(nextMatch.scheduledAt!).getTime();
      const diff = Math.max(0, target - now);
      setCountdown({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [allLives]);

  /* ── Navigation ── */
  const goTo = (idx: number) => {
    if (idx === current || isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => { setCurrent(idx); setIsTransitioning(false); }, 300);
  };

  const slide = slides[current];
  if (!slide) return null;

  /* ── Other live feeds ── */
  const otherLives = allLives
    .filter((l) => l.status === "live" && (slide.kind !== "live" || l.id !== slide.live?.id))
    .slice(0, 3);

  return (
    <section
      className="relative h-[92vh] min-h-[640px] max-h-[960px] overflow-hidden bg-[#020307]"
      role="region"
      aria-roledescription="carousel"
      aria-label="Destaques ao vivo"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* ── Background slides ── */}
      {slides.map((item, index) => (
        <div key={item.id}
          className={`absolute inset-0 transition-all duration-700 ${index === current && !isTransitioning ? "opacity-100 scale-100" : "opacity-0 scale-105"}`}
          style={{ transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}>
          <img
            src={item.image}
            alt=""
            loading={index === 0 ? "eager" : "lazy"}
            fetchPriority={index === 0 ? "high" : "auto"}
            className="h-full w-full object-cover object-center" />
        </div>
      ))}

      {/* ── Overlays ── */}
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute inset-0 gradient-overlay-bottom" />
      <div className="absolute inset-0 grid-pattern opacity-10" />

      {/* Decorative glow orbs */}
      <div className="absolute top-20 right-20 w-80 h-80 rounded-full bg-[#E50914]/4 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-60 h-60 rounded-full bg-red-500/3 blur-[80px] pointer-events-none" />

      {/* Anúncio para leitores de ecrã da mudança de destaque */}
      <p className="sr-only" aria-live="polite">{slide.title}</p>

      {/* ── Content ── */}
      <div className="relative z-10 flex h-full items-center">
        <div className="mx-auto w-full max-w-[1400px] px-5 lg:px-8">
          <div className="grid lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_440px] gap-10 xl:gap-20 items-center">

            {/* ── LEFT: Main content ── */}
            <div className="max-w-2xl stagger">
              {/* Status badge */}
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <span className={`badge flex items-center gap-2 ${
                  slide.isLive ? "badge-red text-[11px] px-3 py-1.5" : "badge-blue text-[11px] px-3 py-1.5"}`}>
                  {slide.isLive && <span className="badge-live-dot" />}
                  {slide.highlight}
                </span>
                {slide.kind === "live" && slide.live?.league && (
                  <span className="flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] px-3 py-1 text-[11px] font-medium text-white/50">
                    {isImageValue(slide.live.leagueLogo) && (
                      <img loading="lazy" src={slide.live.leagueLogo} alt="" className="h-4 w-4 object-contain" />
                    )}
                    {slide.live.league}
                  </span>
                )}
                {slide.kind === "live" && slide.live?.viewerCount != null && slide.live.viewerCount > 0 && (
                  <span className="flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] px-3 py-1 text-[11px] font-medium text-white/50">
                    <Eye className="h-3 w-3 text-[#E50914]" />
                    {formatViewers(slide.live.viewerCount)}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-display text-5xl md:text-6xl lg:text-7xl xl:text-8xl mb-5 tracking-tight">
                {slide.title.includes(" vs ") ? (
                  <>
                    <span className="text-white">{slide.title.split(" vs ")[0]}</span>
                    <span className="text-gradient mx-2">vs</span>
                    <span className="text-white">{slide.title.split(" vs ")[1]}</span>
                  </>
                ) : (
                  <span className="text-gradient">{slide.title}</span>
                )}
              </h1>

              <p className="mb-7 max-w-lg text-sm lg:text-base text-white/40 leading-relaxed">
                {slide.subtitle}
              </p>

              {/* Countdown (scheduled) */}
              {!slide.isLive && slide.kind === "live" && countdown.d + countdown.h + countdown.m + countdown.s > 0 && (
                <div className="mb-7 flex items-center gap-4">
                  <Clock className="h-4 w-4 text-[#E50914]" />
                  <span className="text-sm text-white/50">{t.hero_starts_in}</span>
                  <div className="flex items-center gap-2">
                    {[
                      { v: countdown.d, l: "Dias" },
                      { v: countdown.h, l: "Hrs" },
                      { v: countdown.m, l: "Min" },
                      { v: countdown.s, l: "Seg" },
                    ].map(({ v, l }, i) => (
                      <div key={l} className="flex items-center gap-1">
                        {i > 0 && <span className="text-white/20 font-bold">:</span>}
                        <div className="min-w-[50px] rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-center">
                          <span className="block text-mono text-xl font-bold text-white">{String(v).padStart(2, "0")}</span>
                          <span className="block text-[9px] text-white/30 uppercase tracking-widest mt-0.5">{l}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3">
                {slide.kind === "live" ? (
                  <Link href={`/watch/${slide.live!.id}`}
                    className="btn btn-primary btn-lg shadow-[0_0_32px_rgba(229,9,20,0.3)] group">
                    <Play className="h-5 w-5 fill-current" />
                    {slide.isLive ? "Assistir Agora" : "Ver Detalhes"}
                    {slide.isLive && <span className="badge-live-dot ml-1" />}
                  </Link>
                ) : slide.ad?.clickUrl ? (
                  <a href={slide.ad.clickUrl} target="_blank" rel="noreferrer"
                    className="btn btn-primary btn-lg">
                    <Play className="h-5 w-5 fill-current" /> {slide.cta || "Saber Mais"}
                  </a>
                ) : null}
                <Link href="/register"
                  className="btn btn-secondary btn-lg">
                  <Users className="h-5 w-5" /> {t.hero_create_account}
                </Link>
              </div>

              {/* Trust / feature strip */}
              <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
                {[
                  { icon: Radio, l1: "Transmissões", l2: "Ao Vivo" },
                  { icon: BarChart3, l1: "Estatísticas", l2: "Em Tempo Real" },
                  { icon: Tv2, l1: "Conteúdo", l2: "Exclusivo" },
                  { icon: Star, l1: "Melhor", l2: "Experiência" },
                ].map(({ icon: Icon, l1, l2 }) => (
                  <div key={l1} className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-[#E50914]/30 bg-[#E50914]/5">
                      <Icon aria-hidden="true" className="h-4 w-4 text-[#E50914]" />
                    </span>
                    <span className="leading-tight">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-white/70">{l1}</span>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-white/30">{l2}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── RIGHT: Hero card + other lives ── */}
            <div className="hidden lg:flex flex-col gap-3">
              {slide.kind === "live"
                ? <LiveHeroCard live={slide.live!} />
                : (
                  <div className="surface-glass p-6 text-center">
                    <Zap className="h-8 w-8 text-[#E50914] mx-auto mb-3" />
                    <p className="text-sm font-bold text-white">Em Breve</p>
                    <p className="text-xs text-white/40 mt-1">Próximas transmissões</p>
                  </div>
                )}

              {/* Other live matches */}
              {otherLives.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-1">
                    Outros ao Vivo
                  </span>
                  {otherLives.map((l) => (
                    <Link key={l.id} href={`/watch/${l.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.04] bg-white/[0.02]
                        hover:border-[#E50914]/20 hover:bg-[#E50914]/5 transition-all duration-200">
                      <span className="flex h-2 w-2 rounded-full bg-[#E50914] animate-pulse flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">
                          {l.teamA && l.teamB ? `${l.teamA} vs ${l.teamB}` : l.title}
                        </p>
                        <p className="text-[10px] text-white/30 truncate">{l.league}</p>
                      </div>
                      {typeof l.scoreA === "number" && (
                        <span className="text-xs font-black text-white/80 tabular-nums flex-shrink-0">
                          {l.scoreA}–{l.scoreB}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Slide controls ── */}
      {slides.length > 1 && (
        <>
          <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-4">
            <button onClick={() => goTo((current - 1 + slides.length) % slides.length)}
              aria-label="Destaque anterior"
              className="btn btn-ghost btn-icon rounded-full border border-white/[0.06]">
              <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              {slides.map((item, index) => (
                <button key={item.id} onClick={() => goTo(index)}
                  aria-label={`Ir para destaque ${index + 1} de ${slides.length}`}
                  aria-current={index === current}
                  className={`rounded-full transition-all duration-500 ${
                    index === current
                      ? "w-8 h-1.5 bg-gradient-to-r from-[#E50914] to-[#FF6B6B]"
                      : "w-1.5 h-1.5 bg-white/15 hover:bg-white/30"}`} />
              ))}
            </div>
            <button onClick={() => goTo((current + 1) % slides.length)}
              aria-label="Próximo destaque"
              className="btn btn-ghost btn-icon rounded-full border border-white/[0.06]">
              <ChevronRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
          <div className="absolute top-8 right-8 z-10 hidden lg:flex items-center gap-2 text-xs font-bold text-white/30">
            <span className="text-white/60">{String(current + 1).padStart(2, "0")}</span>
            <span className="text-white/15">/</span>
            <span>{String(slides.length).padStart(2, "0")}</span>
          </div>
        </>
      )}
    </section>
  );
}
