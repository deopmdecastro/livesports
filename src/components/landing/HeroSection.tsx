"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock, Play, Eye, Users } from "lucide-react";
import type { Live } from "@/types";
import { publicApiRequest, type ApiListResponse } from "@/lib/api";
import { useLang } from "@/lib/lang";

function isImageValue(value?: string) {
  return Boolean(value && (/^(https?:|data:|blob:)/.test(value) || value.startsWith("/")));
}

function TeamCrest({ logo, name, size = "md" }: { logo?: string; name?: string; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = { sm: "h-8 w-8 text-xs", md: "h-12 w-12 text-sm", lg: "h-16 w-16 text-base" };
  const cls = sizeClasses[size];

  if (isImageValue(logo)) {
    return (
      <img
        src={logo}
        alt={name || "team"}
        className={`${cls} rounded-full border-2 border-white/15 object-contain bg-black/40 p-0.5`}
      />
    );
  }

  const initials = (name || "?").slice(0, 2).toUpperCase();
  return (
    <div className={`${cls} flex items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-[#1A1A28] to-[#0E0E16] font-black text-white`}>
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

function buildSlide(live: Live, index: number, t: ReturnType<typeof useLang>["t"]) {
  const isLive = live.status === "live";
  return {
    id: live.id,
    title: isLive ? live.title : t.hero_next_broadcast,
    highlight: isLive ? t.hero_live_now : t.hero_scheduled,
    subtitle: live.description || `${live.league || "Liga"} ${t.hero_alt_servers}`,
    image: live.banner || live.thumbnail || fallbackImages[index % fallbackImages.length],
    live,
    cta: isLive ? t.hero_watch : t.hero_watch,
    isLive,
  };
}

export default function HeroSection() {
  const { t } = useLang();
  const [current, setCurrent] = useState(0);
  const [countdown, setCountdown] = useState({ h: 2, m: 30, s: 45 });
  const [slides, setSlides] = useState<ReturnType<typeof buildSlide>[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    publicApiRequest<ApiListResponse<Live>>("/lives?limit=6")
      .then((data) => {
        const nextSlides = data.items
          .filter((live) => live.featured || live.status === "live")
          .slice(0, 3)
          .map((live, i) => buildSlide(live, i, t));
        setSlides(nextSlides);
      })
      .catch(() => setSlides([]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % slides.length);
        setIsTransitioning(false);
      }, 400);
    }, 7000);
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
  if (!slide) {
    // Enhanced Skeleton with content placeholders
    return (
      <section className="relative h-[88vh] min-h-[600px] max-h-[950px] overflow-hidden bg-[#060609]">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#060609] via-[#060609]/80 to-transparent" />
        <div className="relative z-10 flex h-full items-center">
          <div className="mx-auto w-full max-w-[1400px] px-4 lg:px-6">
            <div className="max-w-2xl space-y-5">
              {/* Badge skeleton */}
              <div className="flex items-center gap-3">
                <div className="shimmer h-7 w-24 rounded-full" />
                <div className="shimmer h-7 w-32 rounded-full" />
              </div>
              {/* Title skeleton */}
              <div className="space-y-3">
                <div className="shimmer h-14 w-full max-w-xl rounded-xl" />
                <div className="shimmer h-14 w-3/4 max-w-md rounded-xl" />
              </div>
              {/* Subtitle skeleton */}
              <div className="shimmer h-5 w-full max-w-lg rounded-lg" />
              {/* Score board skeleton */}
              <div className="shimmer h-20 w-72 rounded-xl" />
              {/* CTA skeleton */}
              <div className="flex gap-3">
                <div className="shimmer h-12 w-40 rounded-xl" />
                <div className="shimmer h-12 w-44 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-[88vh] min-h-[620px] max-h-[960px] overflow-hidden">
      {/* Backgrounds */}
      {slides.map((item, index) => (
        <div
          key={item.id}
          className={`absolute inset-0 transition-all duration-700 ${index === current && !isTransitioning ? "opacity-100 scale-100" : "opacity-0 scale-105"}`}
          style={{ transitionTimingFunction: "cubic-bezier(0.4,0,0.2,1)" }}
        >
          <img
            src={item.image}
            alt={item.title}
            className="h-full w-full object-cover object-center"
          />
        </div>
      ))}

      {/* Overlays */}
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute inset-0 hero-bottom-fade" />
      <div className="absolute inset-0 grid-bg opacity-20" />

      {/* Decorative corner */}
      <div className="absolute top-6 right-6 w-40 h-40 rounded-full bg-[#E50914]/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-1/2 w-60 h-60 rounded-full bg-[#E50914]/5 blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex h-full items-center">
        <div className="mx-auto w-full max-w-[1400px] px-4 lg:px-6">
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
              {slide.live.league && (
                <span className="flex items-center gap-1.5 rounded-full bg-white/8 border border-white/10 px-3 py-1 text-xs font-semibold text-gray-300">
                  {isImageValue(slide.live.leagueLogo) && (
                    <img src={slide.live.leagueLogo} alt="" className="h-4 w-4 object-contain" />
                  )}
                  {slide.live.league}
                </span>
              )}
              {slide.live.viewerCount > 0 && (
                <span className="flex items-center gap-1.5 rounded-full bg-white/8 border border-white/10 px-3 py-1 text-xs font-semibold text-gray-300">
                  <Eye className="h-3 w-3" />
                  {formatViewers(slide.live.viewerCount)}
                </span>
              )}
            </div>

            {/* Title */}
            <h1
              className="font-black leading-tight mb-5 text-4xl md:text-5xl lg:text-6xl xl:text-7xl tracking-tight"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              <span className="text-white">{slide.title.split(" vs ")[0]}</span>
              {slide.title.includes(" vs ") && (
                <>
                  {" "}
                  <span className="gradient-text-red">vs</span>
                  {" "}
                  <span className="text-white">{slide.title.split(" vs ")[1]}</span>
                </>
              )}
              {!slide.title.includes(" vs ") && (
                <span className="gradient-text-red"> {slide.highlight}</span>
              )}
            </h1>

            <p className="mb-6 max-w-lg text-sm text-gray-300 lg:text-base leading-relaxed">
              {slide.subtitle}
            </p>

            {/* Score Board (if live) */}
            {slide.isLive && (
              <div className="mb-6 futuristic-border inline-block">
                <div className="flex items-center gap-5 rounded-xl border border-white/8 bg-black/50 backdrop-blur-sm px-5 py-4">
                  <div className="flex items-center gap-3">
                    <TeamCrest logo={slide.live.teamALogo} name={slide.live.teamA} size="md" />
                    <div>
                      <p className="text-sm font-bold text-white leading-tight">{slide.live.teamA}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide">Casa</p>
                    </div>
                  </div>

                  <div className="text-center px-3">
                    <div
                      className="text-4xl font-black text-white leading-none mb-1 score-display"
                      style={{ textShadow: "0 0 20px rgba(229,9,20,0.4)" }}
                    >
                      {slide.live.scoreA ?? 0} – {slide.live.scoreB ?? 0}
                    </div>
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="live-badge h-1.5 w-1.5 rounded-full bg-[#E50914]" />
                      <span className="text-[11px] font-black text-[#E50914] uppercase tracking-wider">
                        {slide.live.matchTime}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-row-reverse">
                    <TeamCrest logo={slide.live.teamBLogo} name={slide.live.teamB} size="md" />
                    <div className="text-right">
                      <p className="text-sm font-bold text-white leading-tight">{slide.live.teamB}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide">Visitante</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Countdown (scheduled) */}
            {!slide.isLive && (
              <div className="mb-6 flex items-center gap-3">
                <Clock className="h-4 w-4 text-[#E50914]" />
                <span className="text-sm text-gray-300">{t.hero_starts_in}</span>
                <div className="flex items-center gap-1.5">
                  {[
                    { v: countdown.h, l: "h" },
                    { v: countdown.m, l: "m" },
                    { v: countdown.s, l: "s" },
                  ].map(({ v, l }, i) => (
                    <div key={l} className="flex items-center gap-1">
                      {i > 0 && <span className="text-gray-600 font-bold text-sm">:</span>}
                      <div className="min-w-[44px] rounded-lg border border-[#1E1E2A] bg-[#111118] px-2 py-1.5 text-center">
                        <span className="block font-mono text-lg font-black text-white leading-none">
                          {String(v).padStart(2, "0")}
                        </span>
                        <span className="block text-[9px] text-gray-500 uppercase tracking-widest mt-0.5">{l}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/watch/${slide.live.id}`}
                className="group flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#E50914] to-[#B00000] px-7 py-3.5 font-bold text-white transition-all hover:from-[#FF1A24] hover:to-[#E50914] shadow-red hover:shadow-red-lg hover:-translate-y-0.5"
              >
                <Play className="h-4 w-4 fill-current" />
                {slide.cta}
                {slide.isLive && (
                  <span className="flex h-2 w-2 items-center justify-center">
                    <span className="live-badge inline-flex rounded-full h-2 w-2 bg-white opacity-80" />
                  </span>
                )}
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/8 px-7 py-3.5 font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/15 hover:border-white/25"
              >
                <Users className="h-4 w-4" />
                {t.hero_create_account}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Slide Controls */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 items-center gap-4">
          <button
            onClick={() => goTo((current - 1 + slides.length) % slides.length)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 backdrop-blur-sm transition-all hover:border-[#E50914]/60 hover:bg-[#E50914]/20"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2">
            {slides.map((item, index) => (
              <button
                key={item.id}
                onClick={() => goTo(index)}
                className={`rounded-full transition-all duration-300 ${
                  index === current
                    ? "w-10 h-1.5 bg-gradient-to-r from-[#E50914] to-[#FF6B35]"
                    : "w-1.5 h-1.5 bg-white/25 hover:bg-white/50"
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => goTo((current + 1) % slides.length)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 backdrop-blur-sm transition-all hover:border-[#E50914]/60 hover:bg-[#E50914]/20"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Slide counter */}
      {slides.length > 1 && (
        <div className="absolute top-8 right-8 z-10 hidden lg:flex items-center gap-2 text-xs font-bold text-white/50">
          <span className="text-white">{current + 1}</span>
          <span>/</span>
          <span>{slides.length}</span>
        </div>
      )}
    </section>
  );
}
