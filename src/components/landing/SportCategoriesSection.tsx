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

// Updated sport categories with proper names for both languages
const sportMeta: Record<string, { pt: string; en: string; gradient: string }> = {
  football:   { pt: "Futebol",   en: "Football",   gradient: "from-green-500/20 to-emerald-500/5" },
  basketball: { pt: "Basquete",  en: "Basketball", gradient: "from-orange-500/20 to-amber-500/5" },
  tennis:     { pt: "Tênis",     en: "Tennis",     gradient: "from-lime-500/20 to-green-500/5" },
  volleyball: { pt: "Vôlei",     en: "Volleyball", gradient: "from-blue-500/20 to-indigo-500/5" },
  ufc:        { pt: "UFC",       en: "UFC",        gradient: "from-red-600/20 to-rose-500/5" },
  f1:         { pt: "Fórmula 1", en: "Formula 1",  gradient: "from-red-500/20 to-orange-500/5" },
  baseball:   { pt: "Beisebol",  en: "Baseball",   gradient: "from-purple-500/20 to-violet-500/5" },
  other:      { pt: "Mais",      en: "More",       gradient: "from-gray-500/20 to-slate-500/5" },
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

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {sportCategories.map((sport) => {
            const meta = sportMeta[sport.id] || { pt: sport.label, en: sport.label, gradient: "from-gray-500/10 to-transparent" };
            const label = lang === "pt" ? meta.pt : meta.en;
            const href = sportRoutes[sport.id] || `/${sport.id}`;

            return (
              <Link
                key={sport.id}
                href={href}
                className={`group league-badge flex flex-col items-center gap-2.5 p-4 rounded-2xl transition-all cursor-pointer`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center transition-transform group-hover:scale-110`}>
                  <span className="text-2xl">{sport.icon}</span>
                </div>
                <span className="text-xs font-semibold text-gray-400 group-hover:text-white text-center leading-tight transition-colors">
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
