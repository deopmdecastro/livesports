"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  Globe2,
  Play,
  Radio,
  Search,
  Sparkles,
  Tv2,
  Users,
  Zap,
} from "lucide-react";
import LivePlayer from "@/components/watch/LivePlayer";
import AdSlot from "@/components/ads/AdSlot";
import { publicApiRequest, type ApiListResponse } from "@/lib/api";
import { useLang } from "@/lib/lang";
import type { Live, SportCategory } from "@/types";
import { cn, formatNumber, getSportLabel } from "@/utils";

const CATEGORIES: Array<{ id: "all" | SportCategory; labelPt: string; labelEn: string }> = [
  { id: "all", labelPt: "Todos os Canais", labelEn: "All Channels" },
  { id: "football", labelPt: "Futebol", labelEn: "Football" },
  { id: "f1", labelPt: "Motores & F1", labelEn: "Motorsports" },
  { id: "ufc", labelPt: "UFC & Combate", labelEn: "MMA & Combat" },
  { id: "basketball", labelPt: "Basquetebol", labelEn: "Basketball" },
  { id: "tennis", labelPt: "Ténis", labelEn: "Tennis" },
  { id: "other", labelPt: "Multidesporto & Golfe", labelEn: "Multi-sport & Golf" },
];

export default function FreeChannelsGuideClient() {
  const { lang } = useLang();
  const [lives, setLives] = useState<Live[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [sportFilter, setSportFilter] = useState<"all" | SportCategory>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    publicApiRequest<ApiListResponse<Live>>("/lives?status=live&limit=100")
      .then((res) => {
        if (!active) return;
        const all = res.items || [];
        // Prioritize free 24/7 TV channels first, followed by live matches
        const sorted = [...all].sort((a, b) => {
          const aFree = a.id.startsWith("free-tv-") ? 0 : 1;
          const bFree = b.id.startsWith("free-tv-") ? 0 : 1;
          if (aFree !== bFree) return aFree - bFree;
          return (b.viewerCount || 0) - (a.viewerCount || 0);
        });
        setLives(sorted);
        if (sorted.length > 0) {
          setSelectedId(sorted[0].id);
        }
      })
      .catch(() => {
        if (active) setLives([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredChannels = useMemo(() => {
    return lives.filter((ch) => {
      if (sportFilter !== "all" && ch.sport !== sportFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = `${ch.title} ${ch.league || ""} ${ch.description || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [lives, sportFilter, search]);

  const activeChannel = useMemo(() => {
    return (
      lives.find((c) => c.id === selectedId) ||
      filteredChannels[0] ||
      lives[0] ||
      null
    );
  }, [lives, selectedId, filteredChannels]);

  return (
    <section className="min-h-[82vh] px-4 py-8 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-[1440px] space-y-8">
        {/* Top Hero Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 border-b border-white/[0.06] pb-6">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-300">
              <Tv2 className="h-3.5 w-3.5" />
              {lang === "pt" ? "TV Desportiva em Sinal Aberto · 24/7" : "Free-to-Air Sports TV · 24/7"}
            </div>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-black text-white"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              {lang === "pt"
                ? "Canais de Desporto & Lives Gratuitas"
                : "Free Live Sports Channels & Streams"}
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-white/55">
              {lang === "pt"
                ? "Mude de canal instantaneamente sem sair da página ou abra em modo cinema com chat em tempo real e múltiplos servidores HD."
                : "Switch sports channels instantly with our interactive live TV guide or open full theater mode with live chat."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-right">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                {lang === "pt" ? "Canais Ativos Agora" : "Active Channels"}
              </span>
              <span className="text-xl font-black text-white tabular-nums">
                {lives.length} {lang === "pt" ? "Sinais HD" : "HD Feeds"}
              </span>
            </div>
          </div>
        </div>

        {/* Interactive TV Player + Zapping Sidebar */}
        {loading ? (
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8 aspect-video rounded-3xl anim-shimmer" />
            <div className="lg:col-span-4 h-[460px] rounded-3xl anim-shimmer" />
          </div>
        ) : activeChannel ? (
          <div className="grid gap-6 lg:grid-cols-12 items-start">
            {/* Main Live Player */}
            <div className="lg:col-span-8 space-y-4">
              <div className="overflow-hidden rounded-[26px] border border-white/12 bg-black shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
                <LivePlayer key={activeChannel.id} live={activeChannel} autoPlayMuted />
              </div>

              {/* Active Channel Details Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-[#0E101A] p-5">
                <div className="flex items-start gap-3.5 min-w-0">
                  {activeChannel.leagueLogo && (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white p-1.5">
                      <img
                        src={activeChannel.leagueLogo}
                        alt={activeChannel.title}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-300">
                        <Zap className="h-3 w-3" /> SINAL ABERTO GRATUITO
                      </span>
                      <span className="text-xs font-bold text-[#ff626a]">
                        {activeChannel.league || getSportLabel(activeChannel.sport)}
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-white truncate">
                      {activeChannel.title}
                    </h2>
                    {activeChannel.description && (
                      <p className="mt-1 text-xs sm:text-sm text-white/55 line-clamp-2">
                        {activeChannel.description}
                      </p>
                    )}
                  </div>
                </div>

                <Link
                  href={`/watch/${activeChannel.id}`}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#E50914] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_25px_rgba(229,9,20,0.35)] hover:brightness-110"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {lang === "pt" ? "Modo Sala & Chat" : "Watch Room & Chat"}
                </Link>
              </div>
            </div>

            {/* Quick Channel Zapping List */}
            <div className="lg:col-span-4 flex flex-col rounded-[26px] border border-white/10 bg-[#0C0E17] overflow-hidden max-h-[580px]">
              <div className="border-b border-white/[0.07] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-white">
                    <Radio className="h-3.5 w-3.5 text-[#E50914]" />
                    {lang === "pt" ? "Zapping Rápido" : "Quick Channel Switcher"}
                  </span>
                  <span className="text-[11px] font-semibold text-white/45">
                    {filteredChannels.length} {lang === "pt" ? "canais" : "channels"}
                  </span>
                </div>

                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={lang === "pt" ? "Procurar canal (ex: FIFA+, Red Bull, UFC)..." : "Search channel..."}
                    className="w-full rounded-xl border border-white/10 bg-black/40 py-2 pl-9 pr-3 text-xs text-white placeholder-white/35 outline-none focus:border-[#E50914]/50"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-white/[0.05] p-2">
                {filteredChannels.map((ch, idx) => {
                  const isSelected = activeChannel?.id === ch.id;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setSelectedId(ch.id)}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-xl p-2.5 text-left transition-all",
                        isSelected
                          ? "bg-[#E50914]/15 border border-[#E50914]/40"
                          : "hover:bg-white/[0.04] border border-transparent",
                      )}
                    >
                      <span className="w-5 text-center font-mono text-[11px] font-bold text-white/35">
                        {String(idx + 1).padStart(2, "0")}
                      </span>

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white p-1">
                        {ch.leagueLogo || ch.teamALogo ? (
                          <img
                            src={ch.leagueLogo || ch.teamALogo}
                            alt={ch.title}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <Tv2 className="h-5 w-5 text-black" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-white">
                          {ch.teamA && !ch.teamB ? ch.teamA : ch.title}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-white/45">
                          <span className="truncate">{getSportLabel(ch.sport)}</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-semibold">
                            {formatNumber(ch.viewerCount || 0)} online
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="shrink-0 rounded-full bg-[#E50914] px-2 py-0.5 text-[9px] font-black uppercase text-white">
                          NO AR
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {/* Ad Slot */}
        <AdSlot position="in_content" hideWhenEmpty />

        {/* Full Filterable Channel Directory Grid */}
        <div className="space-y-5 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#E50914]" />
              <h2
                className="text-2xl font-black text-white"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {lang === "pt" ? "Grelha Completa de Canais & Transmissões" : "Full Sports Channel Lineup"}
              </h2>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSportFilter(cat.id)}
                  className={cn(
                    "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all",
                    sportFilter === cat.id
                      ? "bg-[#E50914] text-white"
                      : "border border-white/10 bg-white/[0.03] text-white/65 hover:text-white",
                  )}
                >
                  {lang === "pt" ? cat.labelPt : cat.labelEn}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredChannels.map((ch) => {
              const isFreeChannel = ch.id.startsWith("free-tv-");
              return (
                <div
                  key={ch.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#111421] to-[#090B12] transition-all hover:-translate-y-1 hover:border-[#E50914]/45"
                >
                  <div
                    onClick={() => {
                      setSelectedId(ch.id);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="relative cursor-pointer aspect-video overflow-hidden bg-[#161926]"
                  >
                    <img
                      src={
                        ch.thumbnail ||
                        ch.banner ||
                        "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=900&q=80"
                      }
                      alt={ch.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#090B12] via-black/30 to-transparent" />

                    <div className="absolute left-3 top-3 flex items-center gap-1.5">
                      <span className="badge-live">
                        <span className="badge-live-dot" /> AO VIVO
                      </span>
                      {isFreeChannel && (
                        <span className="rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-black uppercase text-black">
                          24/7 GRÁTIS
                        </span>
                      )}
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 bg-black/30">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E50914] shadow-lg">
                        <Play className="ml-0.5 h-5 w-5 fill-current text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#ff6068] truncate">
                        {ch.league || getSportLabel(ch.sport)}
                      </p>
                      <h3 className="mt-1 line-clamp-2 text-sm font-bold text-white">
                        {ch.title}
                      </h3>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                        <Users className="h-3.5 w-3.5" />
                        {formatNumber(ch.viewerCount || 0)}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedId(ch.id);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="rounded-lg border border-white/12 bg-white/[0.04] px-2.5 py-1 text-[11px] font-bold text-white/85 hover:bg-white/[0.1]"
                        >
                          {lang === "pt" ? "Sintonizar" : "Tune In"}
                        </button>
                        <Link
                          href={`/watch/${ch.id}`}
                          className="rounded-lg bg-[#E50914] px-2.5 py-1 text-[11px] font-bold text-white hover:brightness-110"
                        >
                          {lang === "pt" ? "Abrir Sala" : "Room"}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
