"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/lib/lang";
import { LEAGUE_LOGOS } from "@/lib/mock-data";

interface ImportedLeague {
  id: string;
  key: string;
  name: string;
  logo: string | null;
  sport: string;
  eventCount: number;
  liveCount: number;
  totalCount: number;
  country?: string | null;
}

async function fetchImportedLeagues(): Promise<ImportedLeague[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const response = await fetch(`${apiUrl}/api/stats/imported-leagues`, {
      cache: "no-store",
      next: { revalidate: 60 },
    });
    const payload = await response.json();
    if (!response.ok || payload.success === false) return [];
    return payload.data?.leagues || [];
  } catch {
    return [];
  }
}

export default function LeaguesSection() {
  const { lang } = useLang();
  const [leagues, setLeagues] = useState<ImportedLeague[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImportedLeagues().then((data) => {
      setLeagues(data);
      setLoading(false);
    });
  }, []);

  // Use imported leagues if available, otherwise fallback to mock league logos for display
  const displayLeagues = leagues.length > 0
    ? leagues.map((league) => ({
        key: league.key,
        name: league.name,
        logo: league.logo || LEAGUE_LOGOS[league.key]?.logo || "",
        country: league.country || LEAGUE_LOGOS[league.key]?.country || "",
        eventCount: league.eventCount,
        liveCount: league.liveCount,
      }))
    : Object.entries(LEAGUE_LOGOS).map(([key, value]) => ({
        key,
        name: value.name,
        logo: value.logo,
        country: value.country,
        eventCount: 0,
        liveCount: 0,
      }));

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
            {leagues.length > 0 && (
              <p className="text-[10px] text-gray-600 mt-1">
                {lang === "pt"
                  ? `${leagues.length} ligas carregadas da base de dados`
                  : `${leagues.length} leagues loaded from database`}
              </p>
            )}
          </div>
        </div>

        {/* Leagues Grid */}
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 xl:grid-cols-12 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2.5 p-3 rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] animate-pulse"
              >
                <div className="w-12 h-12 rounded-lg bg-[#1E1E2A]" />
                <div className="w-16 h-3 rounded bg-[#1E1E2A]" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 xl:grid-cols-12 gap-3">
            {displayLeagues.slice(0, 24).map((league) => {
              if (!league.logo) return null;
              return (
                <Link
                  key={league.key}
                  href={`/futebol?league=${league.key}`}
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
                    {league.country && (
                      <p className="text-[9px] text-gray-600 mt-0.5">{league.country}</p>
                    )}
                    {(league.eventCount > 0 || league.liveCount > 0) && (
                      <p className="text-[8px] text-gray-700 mt-0.5">
                        {league.liveCount > 0 && (
                          <span className="text-green-400">{league.liveCount} {lang === "pt" ? "live" : "live"}</span>
                        )}
                        {league.eventCount > 0 && (
                          <span className="text-gray-500 ml-1">{league.eventCount} {lang === "pt" ? "eventos" : "events"}</span>
                        )}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Ticker - infinite scroll marquee */}
        {!loading && displayLeagues.length > 0 && (
          <div className="mt-10 relative overflow-hidden py-4 border-t border-b border-[#1E1E2A]">
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#060609] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#060609] to-transparent z-10 pointer-events-none" />
            <div className="flex gap-8 animate-marquee whitespace-nowrap">
              {[...displayLeagues.slice(0, 12), ...displayLeagues.slice(0, 12)].map((league, i) => {
                if (!league.logo) return null;
                return (
                  <div key={`${league.key}-${i}`} className="flex items-center gap-2.5 flex-shrink-0">
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
        )}
      </div>
    </section>
  );
}
