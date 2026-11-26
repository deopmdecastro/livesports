"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Globe2, Play, Radio, Tv2, Users } from "lucide-react";
import ResilientLogo from "@/components/ui/ResilientLogo";
import { publicApiRequest } from "@/lib/api";
import { useLang } from "@/lib/lang";
import type { SportCategory } from "@/types";
import { cn, formatNumber, getSportLabel } from "@/utils";

export interface FreeTvChannelItem {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  sport: SportCategory;
  league: string;
  logo: string;
  logoBackups?: string[];
  banner: string;
  language: string;
  quality: string;
  country: string;
  streamUrl: string;
  featured: boolean;
  viewerBase: number;
}

const SPORT_TABS: Array<{ id: "all" | SportCategory; labelPt: string; labelEn: string }> = [
  { id: "all", labelPt: "Todos (22)", labelEn: "All (22)" },
  { id: "football", labelPt: "Futebol", labelEn: "Football" },
  { id: "f1", labelPt: "Motores & F1", labelEn: "Motorsports" },
  { id: "ufc", labelPt: "UFC & Combate", labelEn: "MMA & Combat" },
  { id: "basketball", labelPt: "Basquetebol", labelEn: "Basketball" },
  { id: "tennis", labelPt: "Ténis", labelEn: "Tennis" },
  { id: "other", labelPt: "Multidesporto", labelEn: "Multi-sport" },
];

export default function FreeChannelsSection() {
  const { lang } = useLang();
  const [channels, setChannels] = useState<FreeTvChannelItem[]>([]);
  const [activeSport, setActiveSport] = useState<"all" | SportCategory>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    publicApiRequest<{ total: number; items: FreeTvChannelItem[] }>("/integrations/free-channels", {
      cacheTtl: 60_000,
    })
      .then((res) => {
        if (!active) return;
        setChannels(res.items || []);
      })
      .catch(() => {
        if (active) setChannels([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const list =
      activeSport === "all"
        ? channels
        : channels.filter((c) => c.sport === activeSport);
    return list.slice(0, 8);
  }, [channels, activeSport]);

  if (loading) {
    return (
      <section className="py-12 border-t border-white/[0.04]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-5 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[230px] rounded-2xl anim-shimmer" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (channels.length === 0) return null;

  return (
    <section className="relative py-12 lg:py-16 border-t border-white/[0.04] overflow-hidden">
      <div className="pointer-events-none absolute -left-24 top-12 h-[320px] w-[320px] rounded-full bg-emerald-500/[0.05] blur-[110px]" />

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-5 lg:px-8 space-y-7">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div className="flex items-start gap-3.5">
            <div className="h-11 w-1.5 rounded-full bg-gradient-to-b from-emerald-400 to-[#E50914] mt-0.5" />
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300 mb-2">
                <Tv2 className="h-3 w-3" />
                {lang === "pt" ? "Sinal Aberto · 100% Gratuito" : "Free-to-Air · 24/7 Live TV"}
              </div>
              <h2
                className="text-2xl lg:text-3xl font-black text-white tracking-tight"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {lang === "pt"
                  ? "Canais de Desporto Gratuitos 24/7"
                  : "Free 24/7 Live Sports TV Channels"}
              </h2>
              <p className="text-xs sm:text-sm text-white/50 mt-0.5">
                {lang === "pt"
                  ? `${channels.length} canais oficiais em sinal aberto (FIFA+, beIN XTRA, Red Bull TV, FITE, GLORY, Overtime, Tennis Channel e mais)`
                  : `${channels.length} verified free-to-air HD sports channels streaming live right now`}
              </p>
            </div>
          </div>

          <Link
            href="/canais"
            className="inline-flex items-center gap-2 self-start lg:self-auto rounded-full bg-gradient-to-r from-[#E50914] to-[#B00000] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-[0_10px_30px_rgba(229,9,20,0.3)] transition-all hover:brightness-110"
          >
            <Radio className="h-3.5 w-3.5" />
            {lang === "pt"
              ? `Abrir Guia de TV (${channels.length} Canais)`
              : `Open Live TV Guide (${channels.length})`}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {SPORT_TABS.map((tab) => {
            const active = activeSport === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSport(tab.id)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all",
                  active
                    ? "bg-[#E50914] text-white shadow-[0_0_24px_rgba(229,9,20,0.35)]"
                    : "border border-white/10 bg-white/[0.03] text-white/65 hover:border-white/20 hover:text-white",
                )}
              >
                {lang === "pt" ? tab.labelPt : tab.labelEn}
              </button>
            );
          })}
        </div>

        {/* Channels Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((ch) => (
            <Link
              key={ch.id}
              href={`/watch/${ch.id}`}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#111421] to-[#090B12] transition-all duration-300 hover:-translate-y-1 hover:border-[#E50914]/50 hover:shadow-[0_18px_50px_rgba(229,9,20,0.18)]"
            >
              {/* Visual Preview */}
              <div className="relative aspect-[16/9] overflow-hidden bg-[#151827]">
                <img
                  src={ch.banner}
                  alt={ch.name}
                  loading="lazy"
                  className="h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#090B12] via-[#090B12]/45 to-black/20" />

                {/* Top Badges */}
                <div className="absolute left-3 top-3 right-3 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-black shadow">
                    GRÁTIS · 24/7
                  </span>
                  <span className="rounded-full border border-white/15 bg-black/65 px-2 py-0.5 text-[10px] font-bold text-white/90 backdrop-blur-md">
                    {ch.quality}
                  </span>
                </div>

                {/* Channel Logo Badge */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-white/95 p-1.5 shadow-lg">
                    <ResilientLogo
                      src={ch.logo}
                      backupUrls={ch.logoBackups}
                      name={ch.name}
                      kind="channel"
                      alt={ch.name}
                      className="h-full w-full"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      EM DIRETO
                    </span>
                    <h3 className="truncate text-sm font-black text-white drop-shadow">
                      {ch.name}
                    </h3>
                  </div>
                </div>

                {/* Play hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-black/25">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E50914] shadow-[0_0_28px_rgba(229,9,20,0.75)]">
                    <Play className="ml-0.5 h-5 w-5 fill-current text-white" />
                  </div>
                </div>
              </div>

              {/* Channel Info */}
              <div className="flex flex-1 flex-col justify-between p-4">
                <div>
                  <p className="text-xs font-semibold text-white/85 line-clamp-1">
                    {ch.tagline}
                  </p>
                  <p className="mt-1 text-[11px] text-white/45 line-clamp-2 leading-relaxed">
                    {ch.description}
                  </p>
                </div>

                <div className="mt-3.5 flex items-center justify-between border-t border-white/[0.06] pt-2.5 text-[11px] text-white/50">
                  <span className="inline-flex items-center gap-1 font-semibold text-white/70">
                    <Globe2 className="h-3 w-3 text-[#E50914]" />
                    {getSportLabel(ch.sport)} · {ch.language}
                  </span>
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                    <Users className="h-3 w-3" />
                    {formatNumber(ch.viewerBase)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
