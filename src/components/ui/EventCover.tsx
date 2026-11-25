"use client";

import { useState } from "react";

const DEFAULT_COVER = "/images/sport-cover.svg";
const SPORT_COVERS: Record<string, string> = {
  football: "/images/football-cover.jpg", basketball: "/images/event-cover.jpg",
  tennis: "/images/tennis-cover.jpg", f1: "/images/f1-cover.jpg", ufc: "/images/ufc-cover.jpg",
  volleyball: "/images/volleyball-cover.jpg", baseball: "/images/baseball-cover.jpg",
};

export function getSportCover(sport?: string | null) { return SPORT_COVERS[sport || ""] || DEFAULT_COVER; }

/** Decorative cover: event artwork when available, never stretch a league badge. */
export default function EventCover({ src, leagueLogo, sport, className = "" }: {
  src?: string | null;
  leagueLogo?: string | null;
  sport?: string | null;
  className?: string;
}) {
  const fallback = getSportCover(sport);
  const usable = src && src !== leagueLogo && /^(https?:\/\/|\/)/i.test(src) ? src : fallback;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const image = failedSrc === usable ? fallback : usable;
  return (
    <div aria-hidden="true" className={`relative overflow-hidden bg-[#151927] ${className}`}>
      <img src={image} alt="" loading="lazy" onError={() => setFailedSrc(usable)} className="h-full w-full object-cover opacity-30 transition-opacity duration-500 group-hover:opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#08090f] via-[#08090f]/70 to-[#08090f]/45" />
    </div>
  );
}
