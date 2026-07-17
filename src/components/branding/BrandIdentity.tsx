"use client";

import { useMemo } from "react";
import { Play, Tv2, Zap } from "lucide-react";
import { useBranding } from "@/lib/branding";

interface BrandIdentityProps {
  mode?: "navbar" | "sidebar" | "creator";
  subtitle?: string;
  className?: string;
}

export default function BrandIdentity({ mode = "navbar", subtitle, className = "" }: BrandIdentityProps) {
  const branding = useBranding();

  const initials = useMemo(() => {
    const words = (branding.siteName || "LiveSports").trim().split(/\s+/).filter(Boolean);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return words.slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join("");
  }, [branding.siteName]);

  if (branding.logoUrl) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <img src={branding.logoUrl} alt={branding.siteName} className="max-h-11 w-auto max-w-[180px] object-contain" />
      </div>
    );
  }

  if (mode === "navbar") {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#ff2b36] to-[#b30010] shadow-[0_0_18px_rgba(229,9,20,0.32)]">
          <div className="absolute inset-[5px] rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.16),transparent_40%),rgba(255,255,255,0.06)]" />
          <Zap className="relative h-[18px] w-[18px] fill-white text-white" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-[11px] font-black uppercase tracking-[0.12em] text-[#ff4f58]">Live</span>
          <span className="text-sm font-black uppercase tracking-[0.22em] text-white">Sports</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff2b36] to-[#b30010] shadow-[0_0_18px_rgba(229,9,20,0.28)]">
        {mode === "creator" ? <Tv2 className="h-[18px] w-[18px] text-white" /> : <Play className="h-[18px] w-[18px] fill-white text-white" />}
      </div>
      <div>
        <div className="flex items-center gap-1">
          <span className="text-sm font-black uppercase tracking-[0.08em] text-white">LIVE</span>
          <span className="text-sm font-black uppercase tracking-[0.08em] text-[#ff4f58]">SPORTS</span>
        </div>
        {subtitle ? (
          <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.24em] text-white/30">{subtitle}</span>
        ) : (
          <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.24em] text-white/30">{initials}</span>
        )}
      </div>
    </div>
  );
}
