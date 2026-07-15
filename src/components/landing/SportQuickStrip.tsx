"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Radio, LayoutGrid } from "lucide-react";
import type { Event, SportCategory } from "@/types";
import type { ApiListResponse } from "@/lib/api";
import { publicApiRequest } from "@/lib/api";
import { useLang } from "@/lib/lang";

const QUICK_SPORTS: Array<{ id: SportCategory; icon: string; href: string; labelKey: "nav_football" | "nav_basketball" | "nav_tennis" | "nav_ufc" | "nav_f1" }> = [
  { id: "football",   icon: "⚽",   href: "/futebol",  labelKey: "nav_football" },
  { id: "basketball", icon: "🏀",   href: "/basquete", labelKey: "nav_basketball" },
  { id: "tennis",     icon: "🎾",   href: "/tenis",    labelKey: "nav_tennis" },
  { id: "ufc",        icon: "🥊",   href: "/ufc",      labelKey: "nav_ufc" },
  { id: "f1",         icon: "🏎️",  href: "/f1",       labelKey: "nav_f1" },
];

export default function SportQuickStrip() {
  const { lang, t } = useLang();
  const [liveCount, setLiveCount] = useState(0);
  const [sportCounts, setSportCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [livesRes, eventsRes] = await Promise.all([
          publicApiRequest<ApiListResponse<{ id: string }>>("/lives?status=live&limit=100", { cacheTtl: 60_000 }),
          publicApiRequest<Event[]>("/events?limit=200", { cacheTtl: 60_000 }),
        ]);
        if (!active) return;
        setLiveCount(livesRes.pagination?.total ?? livesRes.items?.length ?? 0);

        const counts: Record<string, number> = {};
        const events = Array.isArray(eventsRes) ? eventsRes : [];
        for (const ev of events) {
          if (ev.status === "cancelled") continue;
          const key = ev.sport || "other";
          counts[key] = (counts[key] || 0) + 1;
        }
        setSportCounts(counts);
      } catch {
        /* silent — a faixa simplesmente não mostra contagens */
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const eventsLabel = lang === "pt" ? "Eventos" : "Events";

  return (
    <section className="relative z-10 -mt-10 lg:-mt-12 px-4 lg:px-6" aria-label={lang === "pt" ? "Acesso rápido por categoria" : "Quick category access"}>
      <div className="mx-auto max-w-[1400px]">
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* Ao Vivo — destaque */}
          <Link
            href="/calendario?status=live"
            className="group flex flex-col justify-between rounded-2xl border border-[#E50914]/40 bg-gradient-to-br from-[#E50914]/10 to-[#0A0C14] p-4 transition-all hover:border-[#E50914]/70 hover:shadow-[0_8px_28px_rgba(229,9,20,0.18)]"
          >
            <span className="flex items-center gap-2">
              <span className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#E50914]/15">
                <Radio aria-hidden="true" className="h-4 w-4 text-[#E50914]" />
                <span className="badge-live-dot absolute -top-0.5 -right-0.5" />
              </span>
              <span className="text-sm font-bold text-white">{t.nav_live_now}</span>
            </span>
            <span className="mt-3 block">
              <span className="text-xl font-black text-[#E50914] tabular-nums">{liveCount}</span>
              <span className="ml-1.5 text-[11px] font-semibold text-white/40">{eventsLabel}</span>
            </span>
          </Link>

          {/* Desportos */}
          {QUICK_SPORTS.map((sport) => (
            <Link
              key={sport.id}
              href={sport.href}
              className="group flex flex-col justify-between rounded-2xl border border-white/[0.06] bg-[#0E0E16]/80 p-4 transition-all hover:border-white/15 hover:bg-[#111118]"
            >
              <span className="flex items-center gap-2">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-base">
                  {sport.icon}
                </span>
                <span className="text-sm font-bold text-white/90 truncate">{t[sport.labelKey]}</span>
              </span>
              <span className="mt-3 block">
                <span className="text-xl font-black text-white tabular-nums">{sportCounts[sport.id] || 0}</span>
                <span className="ml-1.5 text-[11px] font-semibold text-white/40">{eventsLabel}</span>
              </span>
            </Link>
          ))}

          {/* Ver Todos */}
          <Link
            href="/calendario"
            className="group flex flex-col justify-between rounded-2xl border border-white/[0.06] bg-[#0E0E16]/80 p-4 transition-all hover:border-white/15 hover:bg-[#111118]"
          >
            <span className="flex items-center gap-2">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
                <LayoutGrid aria-hidden="true" className="h-4 w-4 text-white/60" />
              </span>
              <span className="text-sm font-bold text-white/90">
                {lang === "pt" ? "Ver Todos" : "See All"}
              </span>
            </span>
            <span className="mt-3 block text-[11px] font-semibold text-white/40">
              {lang === "pt" ? "Mais Categorias" : "More Categories"}
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
