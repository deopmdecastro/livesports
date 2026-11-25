"use client";

import { useState } from "react";

const DEFAULT_COVER = "/images/sport-cover.svg";
const SPORT_COVERS: Record<string, string> = { football: "/images/football-cover.jpg", basketball: "/images/event-cover.jpg" };

/** Decorative cover: event artwork when available, never stretch a league badge. */
export default function EventCover({ src, leagueLogo, sport, className = "" }: {
  src?: string | null;
  leagueLogo?: string | null;
  sport?: string | null;
  className?: string;
}) {
  const fallback = SPORT_COVERS[sport || ""] || DEFAULT_COVER;
  const usable = src && src !== leagueLogo && /^(https?:\/\/|\/)/i.test(src) ? src : fallback;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const image = failedSrc === usable ? fallback : usable;
  return (
    <div aria-hidden="true" className={`relative overflow-hidden bg-[#151927] ${className}`}>
      <img src={image} alt="" loading="lazy" onError={() => setFailedSrc(usable)} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d16] via-[#0b0d16]/30 to-black/10" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />
    </div>
  );
}
