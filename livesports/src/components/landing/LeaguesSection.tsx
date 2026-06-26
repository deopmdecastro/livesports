"use client";

import Link from "next/link";
import { useLang } from "@/lib/lang";
import { LEAGUE_LOGOS } from "@/lib/mock-data";

const FEATURED_LEAGUES = [
  "championsleague",
  "premierleague",
  "laliga",
  "brasileirao",
  "bundesliga",
  "seriea",
  "ligue1",
  "nba",
  "ufc",
  "f1",
  "atp",
  "mlb",
];

export default function LeaguesSection() {
  const { lang } = useLang();

  return (
    <section className="py-12 lg:py-16 border-t border-[#1E1E2A] overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="h-10 w-1.5 bg-gradient-to-b from-[#E50914] to-[#B00000] rounded-full" />
          <div>
            <h2
              className="text-xl lg:text-2xl font-black text-white"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              {lang === "pt" ? "Ligas & Competições" : "Leagues & Competitions"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {lang === "pt"
                ? "Transmissão ao vivo das maiores competições do mundo"
                : "Live streaming of the biggest competitions in the world"}
            </p>
          </div>
        </div>

        {/* Leagues Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 xl:grid-cols-12 gap-3">
          {FEATURED_LEAGUES.map((key) => {
            const league = LEAGUE_LOGOS[key];
            if (!league) return null;
            return (
              <Link
                key={key}
                href={`/futebol?league=${key}`}
                className="group flex flex-col items-center gap-2.5 p-3 rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] hover:border-[#E50914]/30 hover:bg-[#111118] transition-all duration-300 cursor-pointer"
              >
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <img
                    src={league.logo}
                    alt={league.name}
                    className="max-w-full max-h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-gray-300 group-hover:text-white leading-tight text-center transition-colors line-clamp-2">
                    {league.name}
                  </p>
                  <p className="text-[9px] text-gray-600 mt-0.5">{league.country}</p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Ticker - infinite scroll marquee */}
        <div className="mt-10 relative overflow-hidden py-4 border-t border-b border-[#1E1E2A]">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#060609] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#060609] to-transparent z-10 pointer-events-none" />
          <div className="flex gap-8 animate-marquee whitespace-nowrap">
            {[...FEATURED_LEAGUES, ...FEATURED_LEAGUES].map((key, i) => {
              const league = LEAGUE_LOGOS[key];
              if (!league) return null;
              return (
                <div key={`${key}-${i}`} className="flex items-center gap-2.5 flex-shrink-0">
                  <img
                    src={league.logo}
                    alt={league.name}
                    className="h-5 w-auto object-contain opacity-60"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {league.name}
                  </span>
                  <span className="text-gray-700 text-xs">•</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
