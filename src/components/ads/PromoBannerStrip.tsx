"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { publicApiRequest } from "@/lib/api";
import { cn } from "@/utils";

export interface PromotionalBanner {
  id: string;
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  imageUrl: string;
  linkUrl?: string | null;
  ctaText?: string | null;
  position: "hero" | "sidebar" | "in_content";
  active: boolean;
  sortOrder: number;
  startDate?: string | null;
  endDate?: string | null;
}

interface PromoBannerStripProps {
  position?: "in_content" | "sidebar";
  className?: string;
  /** Milliseconds between slides. Set 0 to disable auto-rotation. */
  interval?: number;
  /** Show the platform's own promotions when there are no sponsored banners. */
  houseFallback?: boolean;
}

/**
 * House promotions for the platform itself. Shown only when the API returns
 * no sponsored banners, so the slot never collapses into an empty gap.
 */
const HOUSE_BANNERS: PromotionalBanner[] = [
  {
    id: "house-install",
    title: "Instala a app LiveSports",
    subtitle: "Acesso rápido aos jogos ao vivo e alertas de golos no ecrã inicial.",
    badge: "LiveSports",
    imageUrl:
      "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1200&q=70",
    linkUrl: "/instalar",
    ctaText: "Instalar agora",
    position: "in_content",
    active: true,
    sortOrder: 0,
  },
  {
    id: "house-creator",
    title: "Transmite os teus eventos",
    subtitle: "Cria o teu canal, publica lives e chega a mais adeptos.",
    badge: "Para criadores",
    imageUrl:
      "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200&q=70",
    linkUrl: "/register",
    ctaText: "Criar canal",
    position: "in_content",
    active: true,
    sortOrder: 1,
  },
  {
    id: "house-calendar",
    title: "Não percas nenhum jogo",
    subtitle: "Consulta o calendário completo de competições e ativa lembretes.",
    badge: "Calendário",
    imageUrl:
      "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=1200&q=70",
    linkUrl: "/calendario",
    ctaText: "Ver calendário",
    position: "in_content",
    active: true,
    sortOrder: 2,
  },
];

function isInWindow(b: PromotionalBanner, now: number) {
  if (!b.active) return false;
  if (b.startDate && new Date(b.startDate).getTime() > now) return false;
  if (b.endDate && new Date(b.endDate).getTime() < now) return false;
  return true;
}

export default function PromoBannerStrip({
  position = "in_content",
  className,
  interval = 7000,
  houseFallback = true,
}: PromoBannerStripProps) {
  const [banners, setBanners] = useState<PromotionalBanner[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    publicApiRequest<PromotionalBanner[]>(`/banners?position=${position}&active=true`, {
      cacheTtl: 60_000,
    })
      .then((res) => {
        if (mounted) setBanners(Array.isArray(res) ? res : []);
      })
      .catch(() => {
        if (mounted) setBanners([]);
      })
      .finally(() => {
        if (mounted) setLoaded(true);
      });
    return () => {
      mounted = false;
    };
  }, [position]);

  const { slides, sponsored } = useMemo(() => {
    const now = Date.now();
    const live = banners.filter((b) => isInWindow(b, now));
    if (live.length > 0) return { slides: live, sponsored: true };
    if (!houseFallback) return { slides: [] as PromotionalBanner[], sponsored: false };
    return {
      slides: HOUSE_BANNERS.map((b) => ({ ...b, position })),
      sponsored: false,
    };
  }, [banners, position, houseFallback]);

  const count = slides.length;
  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  useEffect(() => {
    if (count < 2 || paused || interval <= 0) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), interval);
    return () => window.clearInterval(id);
  }, [count, paused, interval]);

  if (loaded && count === 0) return null;

  if (!loaded) {
    return (
      <div
        className={cn(
          "rounded-[26px] anim-shimmer",
          position === "sidebar" ? "min-h-[240px]" : "min-h-[150px]",
          className,
        )}
        aria-hidden="true"
      />
    );
  }

  const banner = slides[Math.min(index, count - 1)];
  const href = banner.linkUrl || "/";
  const isExternal = /^https?:\/\//i.test(href);
  const imageOk = !failedImages.has(banner.id);

  const content = (
    <div
      className={cn(
        "relative z-10 flex gap-5 h-full",
        position === "sidebar"
          ? "flex-col justify-between"
          : "flex-col md:flex-row md:items-center md:justify-between",
      )}
    >
      <div className="space-y-2.5 max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#E50914]/30 bg-[#E50914]/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#ff6d75]">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          {banner.badge || "Destaque Patrocinado"}
        </div>
        <h3
          className="text-2xl sm:text-3xl font-black text-white leading-tight"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          {banner.title}
        </h3>
        {banner.subtitle && (
          <p className="text-xs sm:text-sm text-white/70 leading-relaxed">{banner.subtitle}</p>
        )}
      </div>
      <span className="shrink-0 inline-flex items-center justify-center gap-2 self-start rounded-full bg-gradient-to-r from-[#E50914] to-[#B00000] px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-[0_10px_30px_rgba(229,9,20,0.32)] transition-all group-hover:brightness-110 group-hover:translate-x-0.5">
        {banner.ctaText || "Saber Mais"}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </span>
    </div>
  );

  const frameClass = "group block h-full focus-visible:outline-none";
  const link = isExternal ? (
    <a
      href={href}
      target="_blank"
      rel={sponsored ? "sponsored noopener noreferrer" : "noopener noreferrer"}
      className={frameClass}
      aria-label={`${banner.title} — ${banner.ctaText || "Saber mais"}`}
    >
      {content}
    </a>
  ) : (
    <Link
      href={href}
      className={frameClass}
      aria-label={`${banner.title} — ${banner.ctaText || "Saber mais"}`}
    >
      {content}
    </Link>
  );

  return (
    <section
      aria-roledescription="carrossel"
      aria-label={sponsored ? "Publicidade" : "Destaques LiveSports"}
      className={cn(
        "group relative overflow-hidden rounded-[26px] border border-white/10 bg-[#0B0D16] shadow-[0_24px_80px_rgba(0,0,0,0.45)] transition-colors duration-300 hover:border-[#E50914]/40 focus-within:border-[#E50914]/60",
        position === "sidebar" ? "p-5 min-h-[240px]" : "px-6 py-7 sm:px-9 sm:py-8 min-h-[150px]",
        className,
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null || count < 2) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;
        if (Math.abs(dx) > 48) go(index + (dx < 0 ? 1 : -1));
      }}
    >
      {imageOk && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={banner.id}
          src={banner.imageUrl}
          alt=""
          loading="lazy"
          onError={() => setFailedImages((prev) => new Set(prev).add(banner.id))}
          className="absolute inset-0 h-full w-full object-cover opacity-35 transition-transform duration-700 group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-[#06070D]/95 via-[#06070D]/82 to-[#06070D]/45" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(229,9,20,0.20),transparent_48%)]" />

      {sponsored && (
        <span className="absolute right-4 top-3 z-20 rounded bg-black/50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/55">
          Publicidade
        </span>
      )}

      <div aria-live={paused ? "polite" : "off"} className="h-full">
        {link}
      </div>

      {count > 1 && (
        <div className="relative z-20 mt-5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Ir para o destaque ${i + 1} de ${count}`}
                aria-current={i === index}
                className="flex h-6 items-center"
              >
                <span
                  className={cn(
                    "block h-1.5 rounded-full transition-all",
                    i === index ? "w-6 bg-[#E50914]" : "w-1.5 bg-white/30 hover:bg-white/60",
                  )}
                />
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Destaque anterior"
              className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-white/80 transition hover:border-[#E50914]/50 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Próximo destaque"
              className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-white/80 transition hover:border-[#E50914]/50 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
