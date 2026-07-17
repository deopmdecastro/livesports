"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  MapPin,
  Play,
  Radio,
  Sparkles,
  Star,
  Trophy,
  Tv2,
  Users,
  Zap,
} from "lucide-react";
import type { Ad, Live } from "@/types";
import { publicApiRequest, type ApiListResponse } from "@/lib/api";
import { resolveCountryFlagUrl } from "@/lib/flags";
import { useLang } from "@/lib/lang";

function isImageValue(value?: string) {
  return Boolean(value && (/^(https?:|data:|blob:)/.test(value) || value.startsWith("/")));
}

function formatViewers(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function TeamBadge({
  logo,
  name,
  code,
  size = "lg",
}: {
  logo?: string;
  name?: string;
  code?: string;
  size?: "sm" | "md" | "lg";
}) {
  const pxMap = { sm: 42, md: 54, lg: 70 };
  const wrapperMap = {
    sm: "h-11 w-11",
    md: "h-14 w-14",
    lg: "h-[70px] w-[70px]",
  };
  const src = resolveCountryFlagUrl({ code, name, logo, size: pxMap[size] }) || (isImageValue(logo) ? logo : null);

  if (src) {
    return (
      <div className={`flex ${wrapperMap[size]} items-center justify-center rounded-[18px] border border-white/10 bg-black/30 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]`}>
        <img src={src} alt={name || ""} className="h-full w-full rounded-[14px] object-contain" loading="lazy" />
      </div>
    );
  }

  return (
    <div className={`flex ${wrapperMap[size]} items-center justify-center rounded-[18px] border border-white/10 bg-gradient-to-br from-[#151720] to-[#08090f] text-sm font-black text-white`}>
      {(name || "?").slice(0, 2).toUpperCase()}
    </div>
  );
}

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1920&q=80",
  "https://images.unsplash.com/photo-1517747614396-d21a78b850e8?w=1920&q=80",
  "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1920&q=80",
];

function LiveScorePanel({ live }: { live: Live }) {
  const isLive = live.status === "live";
  const hasScore = typeof live.scoreA === "number" && typeof live.scoreB === "number";
  const venue = live.description || live.league || "Cobertura em tempo real";

  return (
    <Link
      href={`/watch/${live.id}`}
      className="group relative block overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(14,16,24,0.92),rgba(7,8,13,0.96))] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-[#E50914]/35"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(229,9,20,0.14),transparent_42%)]" />
      <div className="relative space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/72">
              <span className="h-2 w-2 rounded-full bg-sky-300" />
              {live.league || "Transmissão principal"}
            </span>
          </div>
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
            isLive
              ? "bg-[#E50914]/16 text-[#ff5d66] border border-[#E50914]/25"
              : "bg-white/[0.06] text-white/65 border border-white/10"
          }`}>
            {isLive ? <span className="badge-live-dot" /> : <CalendarDays className="h-3 w-3" />}
            {isLive ? "Ao vivo" : "Agendado"}
          </span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex flex-col items-center gap-3 text-center">
            <TeamBadge logo={live.teamALogo} name={live.teamA} size="md" />
            <span className="text-sm font-bold text-white">{live.teamA || "Equipe A"}</span>
          </div>

          <div className="flex min-w-[112px] items-center justify-center gap-3 rounded-[20px] border border-white/10 bg-black/20 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            {hasScore ? (
              <>
                <span className="text-display text-5xl text-white">{live.scoreA}</span>
                <span className="text-display text-2xl text-white/28">-</span>
                <span className="text-display text-5xl text-white">{live.scoreB}</span>
              </>
            ) : (
              <span className="text-display text-3xl text-white/40">VS</span>
            )}
          </div>

          <div className="flex flex-col items-center gap-3 text-center">
            <TeamBadge logo={live.teamBLogo} name={live.teamB} size="md" />
            <span className="text-sm font-bold text-white">{live.teamB || "Equipe B"}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-[20px] border border-white/8 bg-white/[0.03] p-3 text-[11px] text-white/55">
          <div className="flex items-center gap-2 truncate">
            <Clock className="h-3.5 w-3.5 text-[#E50914]" />
            <span>{live.matchTime || (isLive ? "Em andamento" : "Pré-jogo")}</span>
          </div>
          <div className="flex items-center gap-2 truncate justify-self-end">
            <Eye className="h-3.5 w-3.5 text-[#E50914]" />
            <span>{formatViewers(live.viewerCount || 0)}</span>
          </div>
          <div className="col-span-2 flex items-center gap-2 truncate border-t border-white/6 pt-3">
            <MapPin className="h-3.5 w-3.5 text-white/35" />
            <span className="truncate">{venue}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/6 pt-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">Partida em destaque</span>
          <span className="inline-flex items-center gap-2 text-sm font-bold text-white transition-colors group-hover:text-[#ff6b73]">
            Ver detalhes <Play className="h-4 w-4 fill-current" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function QuickLiveRail({ lives }: { lives: Live[] }) {
  if (!lives.length) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/30">Transmissões paralelas</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#E50914]">Live feed</span>
      </div>
      {lives.map((live) => (
        <Link
          key={live.id}
          href={`/watch/${live.id}`}
          className="group flex items-center gap-3 rounded-[22px] border border-white/8 bg-white/[0.035] px-4 py-3.5 backdrop-blur-xl transition-all duration-300 hover:border-[#E50914]/22 hover:bg-[#E50914]/[0.06]"
        >
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/20">
            <TeamBadge logo={live.teamALogo} name={live.teamA} size="sm" />
            <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border border-[#090b10] bg-[#E50914]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{live.teamA && live.teamB ? `${live.teamA} vs ${live.teamB}` : live.title}</p>
            <p className="truncate text-[11px] text-white/38">{live.league || "Cobertura ao vivo"}</p>
          </div>
          <div className="text-right">
            <p className="text-display text-2xl text-white/90">
              {typeof live.scoreA === "number" && typeof live.scoreB === "number" ? `${live.scoreA}-${live.scoreB}` : "AO"}
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/28">{live.matchTime || "Live"}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function HeroSection() {
  const { t } = useLang();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [allLives, setAllLives] = useState<Live[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [countdown, setCountdown] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [livesRes, adsRes] = await Promise.all([
          publicApiRequest<ApiListResponse<Live>>("/lives?limit=50"),
          publicApiRequest<Ad[]>("/ads?status=active"),
        ]);
        setAllLives(livesRes.items || []);
        setAds(Array.isArray(adsRes) ? adsRes : []);
      } catch {
        /* silent */
      }
    };

    load();
  }, []);

  const slides = useMemo(() => {
    const items: Array<{
      id: string;
      kind: "live" | "ad";
      isLive: boolean;
      image: string;
      title: string;
      subtitle: string;
      highlight: string;
      live?: Live;
      ad?: Ad;
    }> = [];

    const liveFirst = allLives.filter((item) => item.status === "live");
    const featured = allLives.filter((item) => item.featured && item.status !== "ended");
    const scheduled = allLives.filter((item) => item.status === "scheduled");

    for (const live of [...liveFirst, ...featured, ...scheduled]) {
      if (items.find((entry) => entry.kind === "live" && entry.live?.id === live.id)) continue;
      items.push({
        id: `live-${live.id}`,
        kind: "live",
        isLive: live.status === "live",
        image: live.banner || live.thumbnail || FALLBACK_IMAGES[items.length % FALLBACK_IMAGES.length],
        title: live.teamA && live.teamB ? `${live.teamA} vs ${live.teamB}` : live.title,
        subtitle: live.league || live.description || "A melhor plataforma de streaming desportivo em tempo real",
        highlight: live.status === "live" ? "Ao vivo" : live.status === "scheduled" ? "Agendado" : "Destaque",
        live,
      });
      if (items.length >= 5) break;
    }

    const heroAds = ads.filter((ad) => ad.position === "header" || ad.position === "live_preroll");
    for (const ad of heroAds) {
      if (items.length >= 6) break;
      items.push({
        id: `ad-${ad.id}`,
        kind: "ad",
        isLive: false,
        image: ad.imageUrl || FALLBACK_IMAGES[items.length % FALLBACK_IMAGES.length],
        title: ad.title,
        subtitle: ad.campaign || "Patrocinado",
        highlight: "Premium",
        ad,
      });
    }

    if (!items.length) {
      items.push({
        id: "fallback",
        kind: "ad",
        isLive: false,
        image: FALLBACK_IMAGES[0],
        title: "LiveSports",
        subtitle: "A melhor plataforma de streaming desportivo em tempo real",
        highlight: "Premium",
      });
    }

    return items;
  }, [ads, allLives]);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    autoPlayRef.current = setInterval(() => {
      setCurrent((value) => (value + 1) % slides.length);
    }, 6500);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [paused, slides.length]);

  useEffect(() => {
    const nextMatch = allLives
      .filter((item) => item.status === "scheduled" && item.scheduledAt)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];

    if (!nextMatch?.scheduledAt) return;

    const update = () => {
      const diff = Math.max(0, new Date(nextMatch.scheduledAt).getTime() - Date.now());
      setCountdown({
        d: Math.floor(diff / 86_400_000),
        h: Math.floor((diff % 86_400_000) / 3_600_000),
        m: Math.floor((diff % 3_600_000) / 60_000),
        s: Math.floor((diff % 60_000) / 1000),
      });
    };

    update();
    countdownRef.current = setInterval(update, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [allLives]);

  const slide = slides[current];
  if (!slide) return null;

  const otherLives = allLives
    .filter((item) => item.status === "live" && (slide.kind !== "live" || item.id !== slide.live?.id))
    .slice(0, 3);

  const headlineParts = slide.title.includes(" vs ") ? slide.title.split(" vs ") : null;
  const featureItems = [
    { icon: Radio, title: "Transmissões", subtitle: "Ao vivo" },
    { icon: BarChart3, title: "Estatísticas", subtitle: "Em tempo real" },
    { icon: Tv2, title: "Conteúdo", subtitle: "Exclusivo" },
    { icon: Star, title: "Experiência", subtitle: "Premium" },
  ];

  return (
    <section
      className="relative overflow-hidden bg-[#05060a] px-4 pb-24 pt-[112px] lg:px-6 lg:pb-28 lg:pt-[118px]"
      role="region"
      aria-roledescription="carousel"
      aria-label="Destaques ao vivo"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(229,9,20,0.12),transparent_25%),radial-gradient(circle_at_78%_28%,rgba(44,77,255,0.08),transparent_18%),linear-gradient(180deg,#04050a_0%,#05060a_42%,#06070c_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[560px] grid-pattern opacity-[0.07]" />
      <p className="sr-only" aria-live="polite">{slide.title}</p>

      <div className="relative mx-auto max-w-[1400px]">
        <div className="relative overflow-hidden rounded-[34px] border border-white/[0.08] bg-[#090b10] shadow-[0_30px_120px_rgba(0,0,0,0.48)]">
          {slides.map((item, index) => (
            <div
              key={item.id}
              className={`absolute inset-0 transition-all duration-700 ${index === current ? "opacity-100 scale-100" : "opacity-0 scale-105"}`}
            >
              <img
                src={item.image}
                alt=""
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "auto"}
                className="h-full w-full object-cover object-center"
              />
            </div>
          ))}

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,5,10,0.97)_0%,rgba(4,5,10,0.92)_22%,rgba(4,5,10,0.55)_58%,rgba(4,5,10,0.22)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(229,9,20,0.10)_0%,transparent_24%,transparent_78%,rgba(3,4,9,0.92)_100%)]" />
          <div className="absolute inset-0 border border-white/[0.03] [mask-image:linear-gradient(180deg,white,transparent)]" />

          <div className="relative z-10 grid min-h-[560px] gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end lg:px-10 lg:py-10 xl:min-h-[600px] xl:px-12 xl:py-12">
            <div className="flex max-w-[720px] flex-col justify-between gap-8">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] ${
                    slide.isLive
                      ? "border border-[#E50914]/30 bg-[#E50914]/14 text-[#ff646c]"
                      : "border border-white/10 bg-white/[0.05] text-white/70"
                  }`}>
                    {slide.isLive ? <span className="badge-live-dot" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {slide.highlight}
                  </span>
                  {slide.kind === "live" && slide.live?.league ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[11px] font-medium text-white/72">
                      <Trophy className="h-3.5 w-3.5 text-[#E50914]" />
                      {slide.live.league}
                    </span>
                  ) : null}
                  {slide.kind === "live" && slide.live && (slide.live.viewerCount ?? 0) > 0 ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[11px] font-medium text-white/72">
                      <Eye className="h-3.5 w-3.5 text-[#E50914]" />
                      {formatViewers(slide.live.viewerCount ?? 0)} espectadores
                    </span>
                  ) : null}
                </div>

                <div className="space-y-4">
                  <h1 className="max-w-[11ch] text-display text-[60px] leading-[0.92] text-white sm:text-[76px] lg:text-[88px] xl:text-[104px]">
                    {headlineParts ? (
                      <>
                        <span>{headlineParts[0]}</span>
                        <span className="mx-3 text-[#E50914]">vs</span>
                        <span>{headlineParts[1]}</span>
                      </>
                    ) : (
                      slide.title
                    )}
                  </h1>
                  <p className="max-w-[560px] text-sm leading-7 text-white/58 sm:text-[15px]">
                    {slide.subtitle}
                  </p>
                </div>

                {slide.kind === "live" && !slide.isLive && countdown.d + countdown.h + countdown.m + countdown.s > 0 ? (
                  <div className="flex flex-wrap items-center gap-3 rounded-[22px] border border-white/10 bg-black/20 px-4 py-3 backdrop-blur-xl">
                    <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                      <Clock className="h-4 w-4 text-[#E50914]" />
                      {t.hero_starts_in}
                    </span>
                    <div className="flex items-center gap-2">
                      {[
                        { value: countdown.d, label: "D" },
                        { value: countdown.h, label: "H" },
                        { value: countdown.m, label: "M" },
                        { value: countdown.s, label: "S" },
                      ].map((item) => (
                        <div key={item.label} className="flex min-w-[58px] flex-col rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                          <span className="text-display text-2xl text-white">{String(item.value).padStart(2, "0")}</span>
                          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/28">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-3">
                  {slide.kind === "live" ? (
                    <Link href={`/watch/${slide.live!.id}`} className="btn btn-primary btn-lg rounded-full px-7 shadow-[0_0_36px_rgba(229,9,20,0.24)]">
                      <Play className="h-5 w-5 fill-current" />
                      {slide.isLive ? "Ver detalhes" : t.hero_watch}
                    </Link>
                  ) : slide.ad?.clickUrl ? (
                    <a href={slide.ad.clickUrl} target="_blank" rel="noreferrer" className="btn btn-primary btn-lg rounded-full px-7">
                      <Play className="h-5 w-5 fill-current" />
                      Explorar
                    </a>
                  ) : null}
                  <Link href="/register" className="btn btn-secondary btn-lg rounded-full border-white/12 bg-black/20 px-7 text-white hover:bg-white/[0.06]">
                    <Users className="h-5 w-5" />
                    {t.hero_create_account}
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {featureItems.map(({ icon: Icon, title, subtitle }) => (
                  <div
                    key={title}
                    className="flex items-center gap-3 rounded-[22px] border border-white/8 bg-white/[0.035] px-4 py-4 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#E50914]/25 bg-[#E50914]/10 text-[#ff5e67]">
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className="leading-tight">
                      <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">{title}</span>
                      <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-white/30">{subtitle}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-end gap-4 lg:pl-3">
              {slide.kind === "live" && slide.live ? (
                <>
                  <div className="lg:translate-y-3 xl:translate-y-5">
                    <LiveScorePanel live={slide.live} />
                  </div>
                  <QuickLiveRail lives={otherLives} />
                </>
              ) : (
                <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(14,16,24,0.88),rgba(7,8,13,0.96))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#E50914]/25 bg-[#E50914]/12 text-[#ff5d66]">
                    <Zap className="h-7 w-7" />
                  </div>
                  <h2 className="text-heading text-3xl text-white">Experiência premium de streaming</h2>
                  <p className="mt-3 text-sm leading-7 text-white/55">
                    Interface ultramoderna, estatísticas em tempo real, destaques de competições e acesso rápido às transmissões do momento.
                  </p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {[
                      "Cobertura global",
                      "Busca instantânea",
                      "Placar em tempo real",
                      "Navegação cinematográfica",
                    ].map((item) => (
                      <div key={item} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white/80">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {slides.length > 1 ? (
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.06] px-6 py-4 sm:px-8 lg:px-10 xl:px-12">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrent((value) => (value - 1 + slides.length) % slides.length)}
                  aria-label="Slide anterior"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/68 transition-colors hover:border-white/20 hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrent((value) => (value + 1) % slides.length)}
                  aria-label="Próximo slide"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/68 transition-colors hover:border-white/20 hover:text-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                {slides.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrent(index)}
                    aria-label={`Ir para o slide ${index + 1} de ${slides.length}`}
                    aria-current={index === current}
                    className={`rounded-full transition-all duration-300 ${
                      index === current ? "h-2 w-10 bg-gradient-to-r from-[#E50914] to-[#ff6b73]" : "h-2 w-2 bg-white/18 hover:bg-white/35"
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/34">
                <span className="text-white/55">{String(current + 1).padStart(2, "0")}</span>
                <span>/</span>
                <span>{String(slides.length).padStart(2, "0")}</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
