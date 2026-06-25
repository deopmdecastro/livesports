"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import type { CompetitionFormat, PublicCompetitionSummary } from "@/types";
import { useLang } from "@/lib/lang";
import { getCompetitionTheme } from "@/lib/competition-theme";

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

export default function CompetitionCarousel({ competitions, selectedSlug, onSelect, loading }: Props) {
  const { lang } = useLang();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeTheme = getCompetitionTheme(competitions.find((c) => c.slug === selectedSlug));

  useEffect(() => {
    if (!scrollRef.current || !selectedSlug) return;
    const active = scrollRef.current.querySelector(`[data-slug="${selectedSlug}"]`);
    if (active instanceof HTMLElement) {
      active.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [selectedSlug, competitions.length]);

  const scroll = (direction: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: direction === "left" ? -280 : 280,
      behavior: "smooth",
    });
  };

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

  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
          {lang === "pt" ? "Competições" : "Competitions"}
        </p>
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

      <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
        {competitions.map((item) => {
          const active = item.slug === selectedSlug;
          const format = (item.format || "groups") as CompetitionFormat;
          const formatLabel = formatLabels[format][lang === "pt" ? "pt" : "en"];
          const theme = getCompetitionTheme(item);

          return (
            <button
              key={item.id}
              type="button"
              data-slug={item.slug}
              onClick={() => onSelect(item.slug)}
              className={`group flex w-[200px] flex-shrink-0 snap-start items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                active ? "shadow-lg" : "border-[#1E1E2A] bg-[#0E0E16]/80 hover:bg-[#111118]"
              }`}
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
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt="" className="max-h-full max-w-full object-contain" />
                ) : item.heroBadgeIcon ? (
                  <span className="text-xl leading-none">{item.heroBadgeIcon}</span>
                ) : (
                  <Trophy className="h-5 w-5" style={{ color: active ? theme.primary : "#6B7280" }} />
                )}
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
