"use client";

import ResilientLogo from "@/components/ui/ResilientLogo";
import { resolveCountryFlagUrl } from "@/lib/flags";
import { resolveMultiSourceLogos } from "@/lib/logo-fallback";

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

  const chain = resolveMultiSourceLogos({
    primaryUrl: options.logo,
    name: options.name,
    code: options.code,
    kind: "team",
    size: options.size ?? 32,
  });
  const firstRemote = chain.find((u) => !u.startsWith("data:image/svg+xml"));
  if (firstRemote) return firstRemote;

  if (isDisplayableLogo(options.logo || undefined)) return options.logo!;
  return null;
}

export function isLeagueLogoDisplayable(url?: string | null) {
  if (!isDisplayableLogo(url || undefined)) return false;
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
  if (!logo && !name && !code) return null;

  return (
    <ResilientLogo
      src={logo}
      name={name}
      code={code}
      kind="team"
      size={size}
      alt={name || ""}
      className={className}
    />
  );
}
