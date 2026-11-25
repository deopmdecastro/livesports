"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ResilientLogo from "@/components/ui/ResilientLogo";
import type { CompetitionFormat, PublicCompetitionSummary } from "@/types";
import { useLang } from "@/lib/lang";
import { getCompetitionTheme } from "@/lib/competition-theme";
import { cn } from "@/utils";

const formatLabels: Record<CompetitionFormat, { pt: string; en: string }> = {
  groups: { pt: "Grupos", en: "Groups" },
  league: { pt: "Liga", en: "League" },
  knockout: { pt: "Taça", en: "Cup" },
};

interface Props {
  competitions: PublicCompetitionSummary[];
  selectedSlug: string;
  onSelect: (slug: string) => void;
  loading?: boolean;
}

function CompetitionLogo({
  src,
  name,
}: {
  src?: string;
  name: string;
}) {
  return (
    <ResilientLogo
      src={src}
      name={name}
      kind="league"
      size={44}
      alt={name}
      className="max-h-full max-w-full"
    />
  );
}

export default function CompetitionCarousel({ competitions, selectedSlug, onSelect, loading }: Props) {
  const { lang } = useLang();
  const scrollRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const [paused, setPaused] = useState(false);
  const activeTheme = getCompetitionTheme(competitions.find((c) => c.slug === selectedSlug));

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  // Keep active chip in view when selection changes
  useEffect(() => {
    if (!scrollRef.current || !selectedSlug) return;
    const active = scrollRef.current.querySelector(`[data-slug="${selectedSlug}"]`);
    if (active instanceof HTMLElement) {
      active.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [selectedSlug, competitions.length]);

  // Continuous auto-scroll (marquee-style) while not paused
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || competitions.length < 3) return;

    let last = performance.now();
    const speed = 28; // px per second

    const tick = (now: number) => {
      const dt = Math.min(32, now - last);
      last = now;
      if (!pausedRef.current && el) {
        el.scrollLeft += (speed * dt) / 1000;
        // loop
        const max = el.scrollWidth - el.clientWidth;
        if (max > 0 && el.scrollLeft >= max - 1) {
          el.scrollLeft = 0;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [competitions.length]);

  const scroll = useCallback((direction: "left" | "right") => {
    setPaused(true);
    scrollRef.current?.scrollBy({
      left: direction === "left" ? -280 : 280,
      behavior: "smooth",
    });
    window.setTimeout(() => setPaused(false), 2500);
  }, []);

  if (loading && competitions.length === 0) {
    return (
      <div className="mb-8 flex gap-3 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-[88px] w-[200px] flex-shrink-0 animate-pulse rounded-xl border border-[#1E1E2A] bg-[#111118]"
          />
        ))}
      </div>
    );
  }

  if (competitions.length === 0) return null;

  // Duplicate list for smoother loop perception when few items
  const track = competitions.length < 6 ? [...competitions, ...competitions] : competitions;

  return (
    <div
      className="mb-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            {lang === "pt" ? "Competições" : "Competitions"}
          </p>
          {!paused && competitions.length >= 3 ? (
            <span className="hidden items-center gap-1 text-[10px] text-gray-600 sm:inline-flex">
              <span className="h-1 w-1 animate-pulse rounded-full bg-[#E50914]" />
              {lang === "pt" ? "A deslizar" : "Scrolling"}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => scroll("left")}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#1E1E2A] bg-[#0E0E16] text-gray-400 transition-colors hover:opacity-80"
            style={{ borderColor: activeTheme.border, color: activeTheme.primary }}
            aria-label={lang === "pt" ? "Anterior" : "Previous"}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#1E1E2A] bg-[#0E0E16] text-gray-400 transition-colors hover:opacity-80"
            style={{ borderColor: activeTheme.border, color: activeTheme.primary }}
            aria-label={lang === "pt" ? "Seguinte" : "Next"}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
        style={{ scrollBehavior: "auto" }}
      >
        {track.map((item, idx) => {
          const active = item.slug === selectedSlug;
          const format = (item.format || "groups") as CompetitionFormat;
          const formatLabel = formatLabels[format][lang === "pt" ? "pt" : "en"];
          const theme = getCompetitionTheme(item);

          return (
            <button
              key={`${item.id}-${idx}`}
              type="button"
              data-slug={item.slug}
              onClick={() => {
                setPaused(true);
                onSelect(item.slug);
                window.setTimeout(() => setPaused(false), 4000);
              }}
              aria-pressed={active}
              className={cn(
                "group flex w-[200px] flex-shrink-0 items-center gap-3 rounded-xl border p-3 text-left transition-all duration-300",
                active ? "shadow-lg scale-[1.02]" : "border-[#1E1E2A] bg-[#0E0E16]/80 hover:bg-[#111118] hover:-translate-y-0.5"
              )}
              style={
                active
                  ? {
                      borderColor: theme.border,
                      background: `linear-gradient(135deg, ${theme.softBg}, transparent)`,
                      boxShadow: `0 0 24px ${theme.glow}`,
                    }
                  : undefined
              }
            >
              <div
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border p-1.5"
                style={{
                  borderColor: active ? theme.border : "#1E1E2A",
                  background: active ? theme.badgeBg : "#111118",
                }}
              >
                <CompetitionLogo src={item.thumbnail} name={item.sectionTitle || item.name} />
              </div>

              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-bold leading-tight ${active ? "text-white" : "text-gray-200"}`}>
                  {item.sectionTitle || item.name}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {item.season ? (
                    <span className="text-[10px] font-semibold text-gray-500">{item.season}</span>
                  ) : null}
                  <span
                    className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                    style={
                      active
                        ? { background: theme.badgeBg, color: theme.primary }
                        : { background: "rgba(255,255,255,0.05)", color: "#6B7280" }
                    }
                  >
                    {formatLabel}
                  </span>
                </div>
                {item.hostCountries ? (
                  <p className="mt-0.5 truncate text-[10px] text-gray-600">{item.hostCountries}</p>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
