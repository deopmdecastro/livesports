"use client";

import { useMemo } from "react";
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
        <img src="/favicon.svg" alt="" className="h-10 w-10 shrink-0 drop-shadow-[0_0_12px_rgba(229,9,20,0.35)]" />
        <div className="flex flex-col leading-none">
          <span className="text-[11px] font-black uppercase tracking-[0.12em] text-[#ff4f58]">Live</span>
          <span className="text-sm font-black uppercase tracking-[0.22em] text-white">Sports</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img src="/favicon.svg" alt="" className="h-11 w-11 shrink-0" />
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
