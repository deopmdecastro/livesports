"use client";

import Link from "next/link";
import { Activity, ArrowRight, CircleDot, Flag, LayoutGrid, Radio, Trophy } from "lucide-react";
import { useLang } from "@/lib/lang";
import SportIcon from "@/components/ui/SportIcon";

export default function SportQuickStrip() {
  const { lang, t } = useLang();
  const links = [
    { href: "/ao-vivo", label: t.nav_live_now, icon: Radio, accent: true },
    { href: "/futebol", label: t.nav_football, icon: CircleDot, sport: "football" },
    { href: "/basquete", label: t.nav_basketball, icon: Trophy, sport: "basketball" },
    { href: "/tenis", label: t.nav_tennis, icon: Activity, sport: "tennis" },
    { href: "/ufc", label: t.nav_ufc, icon: Activity, sport: "ufc" },
    { href: "/f1", label: t.nav_f1, icon: Flag, sport: "f1" },
    { href: "/calendario", label: lang === "pt" ? "Calendário" : "Calendar", icon: LayoutGrid },
  ];
  return (
    <section className="relative mx-auto max-w-[1400px] px-4 pb-7 sm:px-6 lg:px-8 lg:pb-10" aria-label={lang === "pt" ? "Explorar desportos" : "Explore sports"}>
      <div className="mb-3 flex items-center justify-between gap-4"><h2 className="text-xs font-bold uppercase tracking-[.18em] text-gray-400">{lang === "pt" ? "Explora o LiveSports" : "Explore LiveSports"}</h2><Link href="/calendario" className="inline-flex items-center gap-1 text-xs font-semibold text-red-300 hover:text-white">{lang === "pt" ? "Ver calendário" : "View calendar"}<ArrowRight className="h-3.5 w-3.5" /></Link></div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {links.map(({href,label,icon:Icon,accent,sport}) => <Link key={href} href={href} className={`group flex min-h-[62px] items-center gap-3 rounded-2xl border px-3 py-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400 ${accent ? 'border-red-500/30 bg-red-500/10 text-white hover:bg-red-500/20' : 'border-white/10 bg-[#101118] text-gray-200 hover:border-white/25 hover:bg-white/[.06]'}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${accent ? 'bg-red-500/20 text-red-300' : 'bg-white/[.06] text-gray-300'}`}>{sport ? <SportIcon sport={sport} className="h-4 w-4" /> : <Icon className="h-4 w-4" />}</span><span className="min-w-0">{label}</span><ArrowRight className="ml-auto hidden h-4 w-4 text-gray-500 group-hover:text-white xl:block" /></Link>)}
      </div>
    </section>
  );
}
