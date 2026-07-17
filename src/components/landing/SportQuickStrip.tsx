"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  Bike,
  CircleDot,
  Flag,
  LayoutGrid,
  Radio,
  Trophy,
} from "lucide-react";
import type { Event, SportCategory } from "@/types";
import type { ApiListResponse } from "@/lib/api";
import { publicApiRequest } from "@/lib/api";
import { useLang } from "@/lib/lang";

const QUICK_SPORTS: Array<{
  id: SportCategory;
  href: string;
  labelKey: "nav_football" | "nav_basketball" | "nav_tennis" | "nav_ufc" | "nav_f1";
  icon: typeof Trophy;
  iconClass: string;
}> = [
  { id: "football", href: "/futebol", labelKey: "nav_football", icon: CircleDot, iconClass: "text-white" },
  { id: "basketball", href: "/basquete", labelKey: "nav_basketball", icon: Trophy, iconClass: "text-orange-400" },
  { id: "tennis", href: "/tenis", labelKey: "nav_tennis", icon: Activity, iconClass: "text-lime-300" },
  { id: "ufc", href: "/ufc", labelKey: "nav_ufc", icon: Bike, iconClass: "text-rose-400" },
  { id: "f1", href: "/f1", labelKey: "nav_f1", icon: Flag, iconClass: "text-slate-200" },
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
        for (const event of Array.isArray(eventsRes) ? eventsRes : []) {
          if (event.status === "cancelled") continue;
          counts[event.sport || "other"] = (counts[event.sport || "other"] || 0) + 1;
        }

        setSportCounts(counts);
      } catch {
        /* silent */
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const eventsLabel = lang === "pt" ? "Eventos" : "Events";

  return (
    <section
      className="relative z-20 -mt-16 px-4 lg:-mt-14 lg:px-6"
      aria-label={lang === "pt" ? "Acesso rápido por categoria" : "Quick category access"}
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          <Link
            href="/calendario?status=live"
            className="group flex min-h-[112px] flex-col justify-between rounded-[24px] border border-[#E50914]/35 bg-[linear-gradient(180deg,rgba(229,9,20,0.16),rgba(10,12,18,0.92))] p-4 shadow-[0_18px_50px_rgba(229,9,20,0.12)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#E50914]/60"
          >
            <div className="flex items-center gap-3">
              <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-[#E50914]/30 bg-[#E50914]/14 text-[#ff6068]">
                <Radio className="h-[18px] w-[18px]" />
                <span className="absolute -right-1 -top-1 badge-live-dot" />
              </span>
              <div>
                <p className="text-sm font-bold text-white">{t.nav_live_now}</p>
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">Streaming</p>
              </div>
            </div>
            <div>
              <span className="text-display text-[40px] text-[#ff5d66]">{liveCount}</span>
              <span className="ml-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/34">{eventsLabel}</span>
            </div>
          </Link>

          {QUICK_SPORTS.map((sport) => {
            const Icon = sport.icon;

            return (
              <Link
                key={sport.id}
                href={sport.href}
                className="group flex min-h-[112px] flex-col justify-between rounded-[24px] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(16,18,26,0.96),rgba(8,9,14,0.92))] p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:bg-[linear-gradient(180deg,rgba(20,22,30,0.98),rgba(10,11,16,0.95))]"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04]">
                    <Icon className={`h-[18px] w-[18px] ${sport.iconClass}`} />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white/92">{t[sport.labelKey]}</p>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-white/28">Categoria</p>
                  </div>
                </div>
                <div>
                  <span className="text-display text-[36px] text-white">{sportCounts[sport.id] || 0}</span>
                  <span className="ml-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/34">{eventsLabel}</span>
                </div>
              </Link>
            );
          })}

          <Link
            href="/calendario"
            className="group flex min-h-[112px] flex-col justify-between rounded-[24px] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(16,18,26,0.96),rgba(8,9,14,0.92))] p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/15"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04] text-white/70">
                <LayoutGrid className="h-[18px] w-[18px]" />
              </span>
              <div>
                <p className="text-sm font-bold text-white/92">{lang === "pt" ? "Ver Todos" : "See All"}</p>
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/28">Hub</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/34">
              {lang === "pt" ? "Mais categorias" : "More categories"}
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
