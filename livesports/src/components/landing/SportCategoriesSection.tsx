"use client";

import Link from "next/link";
import { sportCategories } from "@/lib/mock-data";
import { useLang } from "@/lib/lang";

const sportRoutes: Record<string, string> = {
  football: "/futebol",
  basketball: "/basquete",
  tennis: "/tenis",
  volleyball: "/volei",
  ufc: "/ufc",
  f1: "/f1",
  baseball: "/beisebol",
  other: "/outros",
};

const sportMeta: Record<string, {
  pt: string;
  en: string;
  gradient: string;
  bg: string;
  glow: string;
}> = {
  football:   { pt: "Futebol",    en: "Football",   gradient: "from-green-500/30 to-emerald-500/5",  bg: "#22C55E",  glow: "rgba(34,197,94,0.2)" },
  basketball: { pt: "Basquete",   en: "Basketball", gradient: "from-orange-500/30 to-amber-500/5",   bg: "#F59E0B",  glow: "rgba(245,158,11,0.2)" },
  tennis:     { pt: "Tênis",      en: "Tennis",     gradient: "from-lime-500/30 to-green-500/5",     bg: "#84CC16",  glow: "rgba(132,204,22,0.2)" },
  volleyball: { pt: "Vôlei",      en: "Volleyball", gradient: "from-blue-500/30 to-indigo-500/5",    bg: "#3B82F6",  glow: "rgba(59,130,246,0.2)" },
  ufc:        { pt: "UFC / MMA",  en: "UFC / MMA",  gradient: "from-red-600/30 to-rose-500/5",       bg: "#E50914",  glow: "rgba(229,9,20,0.2)" },
  f1:         { pt: "Fórmula 1",  en: "Formula 1",  gradient: "from-red-500/30 to-orange-500/5",     bg: "#EF4444",  glow: "rgba(239,68,68,0.2)" },
  baseball:   { pt: "Beisebol",   en: "Baseball",   gradient: "from-purple-500/30 to-violet-500/5",  bg: "#8B5CF6",  glow: "rgba(139,92,246,0.2)" },
  other:      { pt: "Mais",       en: "More",       gradient: "from-gray-500/20 to-slate-500/5",     bg: "#6B7280",  glow: "rgba(107,114,128,0.15)" },
};

export default function SportCategoriesSection() {
  const { lang, t } = useLang();

  return (
    <section className="py-10 lg:py-14 border-t border-[#1E1E2A]">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
        <div className="flex items-center gap-4 mb-7">
          <div className="h-10 w-1.5 bg-gradient-to-b from-[#E50914] to-[#B00000] rounded-full" />
          <div>
            <h2
              className="text-xl lg:text-2xl font-black text-white"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              {t.section_sports}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {lang === "pt" ? "Escolha o seu desporto favorito" : "Choose your favorite sport"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-3">
          {sportCategories.map((sport) => {
            const meta = sportMeta[sport.id] || {
              pt: sport.label, en: sport.label,
              gradient: "from-gray-500/10 to-transparent",
              bg: "#6B7280", glow: "rgba(107,114,128,0.15)"
            };
            const label = lang === "pt" ? meta.pt : meta.en;
            const href = sportRoutes[sport.id] || `/${sport.id}`;

            return (
              <Link
                key={sport.id}
                href={href}
                className="group relative league-badge flex flex-col items-center gap-2.5 p-4 rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden"
                style={{
                  background: "rgba(14,14,22,0.8)",
                  border: "1px solid #1E1E2A",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = `${meta.bg}40`;
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${meta.glow}`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#1E1E2A";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                {/* Background glow */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${meta.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                />

                <div
                  className="relative w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300"
                  style={{
                    background: `${meta.bg}15`,
                    border: `1px solid ${meta.bg}25`,
                  }}
                >
                  <span className="text-2xl">{sport.icon}</span>
                </div>
                <span className="relative text-xs font-semibold text-gray-400 group-hover:text-white text-center leading-tight transition-colors duration-200">
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
