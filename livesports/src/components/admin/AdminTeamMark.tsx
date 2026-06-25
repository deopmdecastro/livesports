"use client";

import { resolveCountryFlagUrl } from "@/lib/flags";

function isDisplayableLogo(url?: string) {
  if (!url) return false;
  if (url.includes("/images/fallback/")) return false;
  return /^(https?:|data:|blob:|\/)/.test(url);
}

export function resolveTeamMarkUrl(options: {
  logo?: string | null;
  name?: string | null;
  code?: string | null;
  size?: number;
}): string | null {
  const flagUrl = resolveCountryFlagUrl({
    code: options.code,
    name: options.name,
    logo: options.logo,
    size: options.size ?? 32,
  });
  if (flagUrl) return flagUrl;
  if (isDisplayableLogo(options.logo || undefined)) return options.logo!;
  return null;
}

export function isLeagueLogoDisplayable(url?: string | null) {
  if (!isDisplayableLogo(url || undefined)) return false;
  if (url?.includes("crests.football-data.org")) return false;
  return true;
}

interface AdminTeamMarkProps {
  logo?: string | null;
  name?: string | null;
  code?: string | null;
  size?: number;
  className?: string;
}

export default function AdminTeamMark({
  logo,
  name,
  code,
  size = 32,
  className = "h-5 w-5 rounded-full object-cover border border-white/10",
}: AdminTeamMarkProps) {
  const src = resolveTeamMarkUrl({ logo, name, code, size });

  if (src) {
    return <img src={src} alt={name || ""} className={className} />;
  }

  if (name) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[#2A2A2A] text-[9px] font-black uppercase text-gray-300 ${className}`}
      >
        {name.slice(0, 2)}
      </span>
    );
  }

  return null;
}
