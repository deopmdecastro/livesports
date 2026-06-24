"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock, Play, Eye, Users, Star, Zap, Trophy, Signal } from "lucide-react";
import type { Ad, Live } from "@/types";
import { publicApiRequest, type ApiListResponse } from "@/lib/api";
import { resolveCountryFlagUrl } from "@/lib/flags";
import { useLang } from "@/lib/lang";

function isImageValue(value?: string) {
  return Boolean(value && (/^(https?:|data:|blob:)/.test(value) || value.startsWith("/")));
}

function TeamCrest({ logo, name, code, size = "md" }: { logo?: string; name?: string; code?: string; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = { sm: "h-10 w-10 text-xs", md: "h-16 w-16 text-sm", lg: "h-20 w-20 text-base" };
  const cls = sizeClasses[size];
  const flagUrl = resolveCountryFlagUrl({ code, name, logo, size: size === "sm" ? 40 : size === "lg" ? 80 : 64 });
  const src = flagUrl || (isImageValue(logo) ? logo : null);
  if (src) return <img src={src} alt={name || "team"} className={`${cls} rounded-full border-2 border-white/20 object-cover bg-black/50 p-0.5 shadow-xl`} />;
  const initials = (name || "?").slice(0, 2).toUpperCase();
  return (
    <div className={`${cls} flex items-center justify-center rounded-full border-2 border-white/20 bg-gradient-to-br from-[#1A1A28] to-[#0E0E16] font-black text-white shadow-xl`}>
      {initials}
    </div>
  );
}

function formatViewers(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

const fallbackImages = [
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1600&q=80",
  "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=1600&q=80",
  "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1600&q=80",
];

// ─── Live Card Component (the big improved hero card) ──────────────────────
function LiveHeroCard({ live }: { live: Live }) {
  const hasTeams = live.teamA && live.teamB;
  const hasScore = typeof live.scoreA === "number" && typeof live.scoreB === "number";
  const isLiveNow = live.status === "live";

  return (
    <Link href={`/watch/${live.id}`} className="group block w-full">
      {/* Outer card with glass + glow */}
      <div className={`relative overflow-hidden rounded-2xl transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-2xl ${
        isLiveNow
          ? "border border-[#E50914]/40 bg-gradient-to-br from-[#16080A] via-[#0E0E16] to-[#0A0A0F] shadow-[0_0_48px_rgba(229,9,20,0.2)]"
          : "border border-white/10 bg-gradient-to-br from-[#111118] to-[#0A0A0F]"
      }`}>
        {/* Red glow top line */}
        {isLiveNow && <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#E50914] to-transparent" />}

        {/* Background thumbnail with overlay */}
        {(live.thumbnail || live.banner) && (
          <div className="absolute inset-0 overflow-hidden opacity-10 group-hover:opacity-15 transition-opacity duration-500">
            <img
              src={live.banner || live.thumbnail}
              alt=""
              className="h-full w-full object-cover object-center scale-105 group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/90" />
          </div>
        )}

        <div className="relative p-5">
          {/* Header: league + live badge */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              {isImageValue(live.leagueLogo) ? (
                <img src={live.leagueLogo} alt="" className="h-5 w-5 object-contain opacity-90 drop-shadow-sm" />
              ) : (
                <Trophy className="h-4 w-4 text-gray-600" />
              )}
              <span className="text-xs font-bold text-gray-300 truncate max-w-[160px]">
                {live.league || "Desporto"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {live.viewerCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-400">
                  <Eye className="h-3 w-3" />
                  {formatViewers(live.viewerCount)}
                </span>
              )}
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isLiveNow
                  ? "bg-[#E50914] text-white shadow-[0_0_12px_rgba(229,9,20,0.5)]"
                  : "border border-blue-500/30 bg-blue-500/10 text-blue-400"
              }`}>
                {isLiveNow && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                  </span>
                )}
                {isLiveNow ? "AO VIVO" : "EM BREVE"}
              </span>
            </div>
          </div>

          {/* Teams + Score — the main visual */}
          {hasTeams ? (
            <div className="relative">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                {/* Team A */}
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className={`relative transition-transform duration-300 ${isLiveNow && typeof live.scoreA === "number" && live.scoreA > (live.scoreB ?? 0) ? "scale-110" : ""}`}>
                    <TeamCrest logo={live.teamALogo} name={live.teamA} size="md" />
                    {isLiveNow && typeof live.scoreA === "number" && live.scoreA > (live.scoreB ?? 0) && (
                      <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[#E50914] flex items-center justify-center">
                        <Star className="h-2 w-2 text-white fill-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-black text-white leading-tight max-w-[80px] truncate">{live.teamA}</p>
                    <p className="text-[9px] text-gray-500 uppercase tracking-wider mt-0.5">Casa</p>
                  </div>
                </div>

                {/* Score / VS */}
                <div className="flex flex-col items-center gap-2 px-2">
                  {hasScore ? (
                    <>
                      <div
                        className="text-5xl font-black text-white leading-none tracking-tight tabular-nums"
                        style={{ fontFamily: "'Barlow Condensed', sans-serif", textShadow: isLiveNow ? "0 0 30px rgba(229,9,20,0.5)" : "none" }}
                      >
                        {live.scoreA} <span className="text-[#E50914]/60">–</span> {live.scoreB}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isLiveNow && <span className="h-1.5 w-1.5 rounded-full bg-[#E50914] animate-pulse" />}
                        <span className={`text-[11px] font-black uppercase tracking-wider ${isLiveNow ? "text-[#E50914]" : "text-gray-500"}`}>
                          {live.matchTime || (isLiveNow ? "AO VIVO" : "–")}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl font-black text-gray-600" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>VS</span>
                      {live.matchTime && (
                        <span className="text-xs font-semibold text-gray-400">{live.matchTime}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Team B */}
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className={`relative transition-transform duration-300 ${isLiveNow && typeof live.scoreB === "number" && live.scoreB > (live.scoreA ?? 0) ? "scale-110" : ""}`}>
                    <TeamCrest logo={live.teamBLogo} name={live.teamB} size="md" />
                    {isLiveNow && typeof live.scoreB === "number" && live.scoreB > (live.scoreA ?? 0) && (
                      <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[#E50914] flex items-center justify-center">
                        <Star className="h-2 w-2 text-white fill-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-black text-white leading-tight max-w-[80px] truncate">{live.teamB}</p>
                    <p className="text-[9px] text-gray-500 uppercase tracking-wider mt-0.5">Visitante</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-xl font-black text-white leading-tight">{live.title}</p>
            </div>
          )}

          {/* Footer: CTA */}
          <div className={`mt-5 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all duration-300 border ${
            isLiveNow
              ? "bg-[#E50914]/15 border-[#E50914]/30 group-hover:bg-[#E50914]/25 group-hover:border-[#E50914]/50"
              : "bg-white/4 border-white/10 group-hover:bg-white/8 group-hover:border-white/20"
          }`}>
            <div className={`flex h-6 w-6 items-center justify-center rounded-full ${isLiveNow ? "bg-[#E50914]" : "bg-white/10"}`}>
              <Play className={`h-3 w-3 fill-current ${isLiveNow ? "text-white" : "text-gray-400"}`} />
            </div>
            <span className={`text-xs font-black uppercase tracking-wider ${isLiveNow ? "text-white" : "text-gray-400 group-hover:text-white"}`}>
              {isLiveNow ? "Assistir ao Vivo" : "Ver Transmissão"}
            </span>
            {isLiveNow && <Signal className="h-3 w-3 text-[#E50914] animate-pulse" />}
          </div>
        </div>
      </div>
    </Link>
  );
}

function buildLiveSlide(live: Live, index: number, t: ReturnType<typeof useLang>["t"]) {
  const isLive = live.status === "live";
  return {
    kind: "live" as const, id: live.id,
    title: isLive ? live.title : t.hero_next_broadcast,
    highlight: isLive ? t.hero_live_now : t.hero_scheduled,
    subtitle: live.description || `${live.league || "Liga"} ${t.hero_alt_servers}`,
    image: live.banner || live.thumbnail || fallbackImages[index % fallbackImages.length],
    live, cta: t.hero_watch, isLive,
  };
}

function isAdActive(ad: Ad): boolean {
  if (ad.status !== "active") return false;
  const now = Date.now();
  if (ad.startDate && new Date(ad.startDate).getTime() > now) return false;
  if (ad.endDate && new Date(ad.endDate).getTime() < now) return false;
  return true;
}

type HeroSlide = ReturnType<typeof buildLiveSlide> | { kind: "ad"; id: string; title: string; highlight: string; subtitle: string; image: string; ad: Ad; cta: string; isLive: false };

interface BannerSlideData { id: string; title: string; subtitle?: string; badge?: string; imageUrl: string; linkUrl?: string; ctaText?: string; active: boolean; position: string }

function buildBannerSlide(banner: BannerSlideData, index: number): HeroSlide {
  const image = banner.imageUrl || fallbackImages[index % fallbackImages.length];
  const syntheticAd: Ad = { id: banner.id, title: banner.title, campaign: "", imageUrl: banner.imageUrl, clickUrl: banner.linkUrl || "", position: "live_preroll" as Ad["position"], status: "active", format: "image", videoUrl: "", startDate: "", endDate: "", impressions: 0, clicks: 0, ctr: 0, revenue: 0, createdAt: new Date().toISOString() };
  return { kind: "ad", id: banner.id, title: banner.title, highlight: banner.badge || "Em destaque", subtitle: banner.subtitle || "", image, ad: syntheticAd, cta: banner.ctaText || "Ver mais", isLive: false };
}

function buildAdSlide(ad: Ad): HeroSlide {
  return { kind: "ad", id: ad.id, title: ad.title, highlight: "Publicidade", subtitle: ad.campaign ? `Campanha: ${ad.campaign}` : "Anúncio", image: ad.imageUrl || fallbackImages[0], ad, cta: "Ver mais", isLive: false };
}

export default function HeroSection() {
  const { t } = useLang();
  const [current, setCurrent] = useState(0);
  const [countdown, setCountdown] = useState({ h: 2, m: 30, s: 45 });
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [allLives, setAllLives] = useState<Live[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const livesRes = await publicApiRequest<ApiListResponse<Live>>("/lives?limit=10");
        if (cancelled) return;

        const liveItems = livesRes.items || [];
        setAllLives(liveItems);

        const featured = liveItems.filter((l) => l.featured || l.status === "live").slice(0, 5);
        if (featured.length > 0) { setSlides(featured.map((l, i) => buildLiveSlide(l, i, t))); return; }

        try {
          const bannersRes = await publicApiRequest<BannerSlideData[]>("/banners?position=hero");
          if (!cancelled && bannersRes?.length > 0) {
            const bs = bannersRes.filter((b) => b.active && b.position === "hero").slice(0, 5).map((b, i) => buildBannerSlide(b, i));
            if (bs.length > 0) { setSlides(bs); return; }
          }
        } catch { }

        const adsRes = await publicApiRequest<Ad[]>("/ads");
        if (cancelled) return;
        setSlides(adsRes.filter((ad) => ad.position === "live_preroll" && isAdActive(ad)).slice(0, 3).map(buildAdSlide));
      } catch { if (!cancelled) setSlides([]); }
      finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => { setCurrent((p) => (p + 1) % slides.length); setIsTransitioning(false); }, 400);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev.s > 0) return { ...prev, s: prev.s - 1 };
        if (prev.m > 0) return { ...prev, m: prev.m - 1, s: 59 };
        if (prev.h > 0) return { h: prev.h - 1, m: 59, s: 59 };
        return prev;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const goTo = (idx: number) => {
    if (idx === current) return;
    setIsTransitioning(true);
    setTimeout(() => { setCurrent(idx); setIsTransitioning(false); }, 400);
  };

  const slide = slides[current];

  if (loading) {
    return (
      <section className="relative h-[88vh] min-h-[600px] max-h-[950px] overflow-hidden bg-[#060609]">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#060609] via-[#060609]/80 to-transparent" />
        <div className="relative z-10 flex h-full items-center">
          <div className="mx-auto w-full max-w-[1400px] px-4 lg:px-6">
            <div className="grid lg:grid-cols-[1fr_380px] gap-12 items-center">
              <div className="max-w-2xl space-y-5">
                <div className="flex items-center gap-3"><div className="shimmer h-7 w-24 rounded-full" /><div className="shimmer h-7 w-32 rounded-full" /></div>
                <div className="space-y-3"><div className="shimmer h-14 w-full max-w-xl rounded-xl" /><div className="shimmer h-14 w-3/4 rounded-xl" /></div>
                <div className="shimmer h-5 w-full max-w-lg rounded-lg" />
                <div className="flex gap-3"><div className="shimmer h-12 w-40 rounded-xl" /><div className="shimmer h-12 w-44 rounded-xl" /></div>
              </div>
              <div className="shimmer h-64 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!slide) {
    return <section className="relative h-[88vh] min-h-[600px] max-h-[950px] overflow-hidden bg-[#060609]"><div className="absolute inset-0 grid-bg opacity-20" /></section>;
  }

  // Other live matches (for the mini sidebar)
  const otherLives = allLives.filter((l) => l.status === "live" && (slide.kind !== "live" || l.id !== slide.live?.id)).slice(0, 3);

  return (
    <section className="relative h-[88vh] min-h-[620px] max-h-[960px] overflow-hidden">
      {/* Backgrounds */}
      {slides.map((item, index) => (
        <div key={item.id} className={`absolute inset-0 transition-all duration-700 ${index === current && !isTransitioning ? "opacity-100 scale-100" : "opacity-0 scale-105"}`} style={{ transitionTimingFunction: "cubic-bezier(0.4,0,0.2,1)" }}>
          <img src={item.image} alt={item.title} className="h-full w-full object-cover object-center" />
        </div>
      ))}

      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute inset-0 hero-bottom-fade" />
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="absolute top-6 right-6 w-40 h-40 rounded-full bg-[#E50914]/8 blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex h-full items-center">
        <div className="mx-auto w-full max-w-[1400px] px-4 lg:px-6">
          <div className="grid lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_420px] gap-8 xl:gap-16 items-center">

            {/* Left: Main content */}
            <div className="max-w-2xl">
              {/* Status Badge + League */}
              <div className="mb-5 flex flex-wrap items-center gap-3 animate-fade-in-up">
                <div className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-black uppercase tracking-widest ${slide.isLive ? "badge-live" : "badge-scheduled"}`}>
                  {slide.isLive && (
                    <span className="relative flex h-2 w-2">
                      <span className="live-ring absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                    </span>
                  )}
                  {slide.highlight}
                </div>
                {slide.kind === "live" && slide.live.league && (
                  <span className="flex items-center gap-1.5 rounded-full bg-white/8 border border-white/10 px-3 py-1 text-xs font-semibold text-gray-300">
                    {isImageValue(slide.live.leagueLogo) && <img src={slide.live.leagueLogo} alt="" className="h-4 w-4 object-contain drop-shadow-sm" />}
                    {slide.live.league}
                  </span>
                )}
                {slide.kind === "live" && slide.live.viewerCount > 0 && (
                  <span className="flex items-center gap-1.5 rounded-full bg-white/8 border border-white/10 px-3 py-1 text-xs font-semibold text-gray-300">
                    <Eye className="h-3 w-3" />{formatViewers(slide.live.viewerCount)}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="font-black leading-tight mb-5 text-4xl md:text-5xl lg:text-6xl xl:text-7xl tracking-tight" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                <span className="text-white">{slide.title.split(" vs ")[0]}</span>
                {slide.title.includes(" vs ") && (
                  <><span className="text-white"> </span><span className="gradient-text-red">vs</span><span className="text-white"> {slide.title.split(" vs ")[1]}</span></>
                )}
                {!slide.title.includes(" vs ") && <span className="gradient-text-red"> {slide.highlight}</span>}
              </h1>

              <p className="mb-6 max-w-lg text-sm text-gray-300 lg:text-base leading-relaxed">{slide.subtitle}</p>

              {/* Countdown (scheduled) */}
              {!slide.isLive && (
                <div className="mb-6 flex items-center gap-3">
                  <Clock className="h-4 w-4 text-[#E50914]" />
                  <span className="text-sm text-gray-300">{t.hero_starts_in}</span>
                  <div className="flex items-center gap-1.5">
                    {[{ v: countdown.h, l: "h" }, { v: countdown.m, l: "m" }, { v: countdown.s, l: "s" }].map(({ v, l }, i) => (
                      <div key={l} className="flex items-center gap-1">
                        {i > 0 && <span className="text-gray-600 font-bold text-sm">:</span>}
                        <div className="min-w-[44px] rounded-lg border border-[#1E1E2A] bg-[#111118] px-2 py-1.5 text-center">
                          <span className="block font-mono text-lg font-black text-white leading-none">{String(v).padStart(2, "0")}</span>
                          <span className="block text-[9px] text-gray-500 uppercase tracking-widest mt-0.5">{l}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3">
                {slide.kind === "live" ? (
                  <Link href={`/watch/${slide.live.id}`} className="group flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#E50914] to-[#B00000] px-7 py-3.5 font-bold text-white transition-all hover:from-[#FF1A24] hover:to-[#E50914] shadow-red hover:shadow-red-lg hover:-translate-y-0.5">
                    <Play className="h-4 w-4 fill-current" />{slide.cta}
                    {slide.isLive && <span className="flex h-2 w-2 items-center justify-center"><span className="live-badge inline-flex rounded-full h-2 w-2 bg-white opacity-80" /></span>}
                  </Link>
                ) : (
                  <a href={slide.ad.clickUrl || "#"} target={slide.ad.clickUrl ? "_blank" : undefined} rel="noreferrer" className="group flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#E50914] to-[#B00000] px-7 py-3.5 font-bold text-white transition-all hover:from-[#FF1A24] hover:to-[#E50914] shadow-red hover:shadow-red-lg hover:-translate-y-0.5">
                    <Play className="h-4 w-4 fill-current" />{slide.cta}
                  </a>
                )}
                <Link href="/register" className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/8 px-7 py-3.5 font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/15 hover:border-white/25">
                  <Users className="h-4 w-4" />{t.hero_create_account}
                </Link>
              </div>
            </div>

            {/* Right: Improved Live Card */}
            <div className="hidden lg:block space-y-3">
              {slide.kind === "live" ? (
                <LiveHeroCard live={slide.live} />
              ) : (
                <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md overflow-hidden p-5 text-center">
                  <Zap className="h-8 w-8 text-[#E50914] mx-auto mb-3" />
                  <p className="text-sm font-bold text-white">Em breve</p>
                  <p className="text-xs text-gray-400">Próximas transmissões</p>
                </div>
              )}

              {/* Other live matches mini-cards */}
              {otherLives.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider px-1">Outros ao Vivo</p>
                  {otherLives.map((l) => (
                    <Link key={l.id} href={`/watch/${l.id}`} className="flex items-center gap-3 p-3 rounded-xl border border-[#1E1E2A] bg-black/40 hover:border-[#E50914]/30 hover:bg-[#E50914]/5 transition-all">
                      <span className="flex h-2 w-2 rounded-full bg-[#E50914] animate-pulse flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{l.teamA && l.teamB ? `${l.teamA} vs ${l.teamB}` : l.title}</p>
                        <p className="text-[10px] text-gray-500 truncate">{l.league}</p>
                      </div>
                      {typeof l.scoreA === "number" && (
                        <span className="text-xs font-black text-white tabular-nums flex-shrink-0">{l.scoreA}–{l.scoreB}</span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Slide Controls */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 items-center gap-4">
          <button onClick={() => goTo((current - 1 + slides.length) % slides.length)} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 backdrop-blur-sm transition-all hover:border-[#E50914]/60 hover:bg-[#E50914]/20">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            {slides.map((item, index) => (
              <button key={item.id} onClick={() => goTo(index)} className={`rounded-full transition-all duration-300 ${index === current ? "w-10 h-1.5 bg-gradient-to-r from-[#E50914] to-[#FF6B35]" : "w-1.5 h-1.5 bg-white/25 hover:bg-white/50"}`} />
            ))}
          </div>
          <button onClick={() => goTo((current + 1) % slides.length)} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 backdrop-blur-sm transition-all hover:border-[#E50914]/60 hover:bg-[#E50914]/20">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {slides.length > 1 && (
        <div className="absolute top-8 right-8 z-10 hidden lg:flex items-center gap-2 text-xs font-bold text-white/50">
          <span className="text-white">{current + 1}</span><span>/</span><span>{slides.length}</span>
        </div>
      )}
    </section>
  );
}
