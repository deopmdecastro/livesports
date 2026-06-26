"use client";

import { useEffect, useState } from "react";
import { publicApiRequest } from "@/lib/api";

export interface PlatformStats {
  totalUsers: number;
  totalLives: number;
  liveNow: number;
  scheduled: number;
  dbViewers: number;
  totalViews: number;
  competitions: number;
  events: number;
  leagues: number;
  countries: number;
  onlineViewers: number;
  realtimeViewers: number;
  activeRooms: number;
  updatedAt: string;
}

/**
 * Fetches real, platform-wide stats from the public API and refreshes them on
 * an interval so headline numbers (live channels, viewers online, countries…)
 * stay dynamic instead of hardcoded. Returns `null` until first load.
 */
export function usePlatformStats(pollMs = 15_000): PlatformStats | null {
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await publicApiRequest<PlatformStats>("/stats/public", {
          cacheTtl: pollMs > 0 ? Math.min(pollMs, 10_000) : 0,
        });
        if (!cancelled) setStats(data);
      } catch {
        // Keep previous value on transient failures.
      }
    };

    load();
    const id = pollMs > 0 ? setInterval(load, pollMs) : undefined;
    return () => {
      cancelled = true;
      if (id) clearInterval(id);
    };
  }, [pollMs]);

  return stats;
}

/** Compact number formatting: 1234 → "1.2K", 1_500_000 → "1.5M". */
export function formatCompact(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0";
  if (n < 1000) return String(Math.round(n));
  if (n < 1_000_000) {
    const v = n / 1000;
    return `${v >= 100 ? Math.round(v) : v.toFixed(1).replace(/\.0$/, "")}K`;
  }
  const v = n / 1_000_000;
  return `${v >= 100 ? Math.round(v) : v.toFixed(1).replace(/\.0$/, "")}M`;
}

/** Compact number with a trailing "+" for "at least" headline stats. */
export function formatCompactPlus(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0";
  return `${formatCompact(n)}+`;
}
