"use client";

import { useMemo } from "react";
import { Tv2, Zap } from "lucide-react";
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
    if (mode === "navbar") {
      return (
        <div className={`flex items-center gap-3 ${className}`}>
          <div className="relative flex h-11 items-center">
            <img src={branding.logoUrl} alt={branding.siteName} className="max-h-11 w-auto max-w-[180px] object-contain" />
          </div>
        </div>
      );
    }

    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex min-h-11 items-center rounded-xl bg-white/5 px-2 py-1.5">
          <img src={branding.logoUrl} alt={branding.siteName} className="max-h-10 w-auto max-w-[160px] object-contain" />
        </div>
        {subtitle ? (
          <div>
            <div className="text-sm font-black text-white tracking-tight">{branding.siteName}</div>
            <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-[0.24em] mt-0.5 block">
              {subtitle}
            </span>
          </div>
        ) : null}
      </div>
    );
  }

  if (mode === "navbar") {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <div className="relative">
          <div className="bg-gradient-to-br from-[#E50914] to-[#B00000] rounded-lg p-1.5 shadow-[0_0_12px_rgba(229,9,20,0.3)] transition-all">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-gradient text-sm font-black tracking-tight">LIVE</span>
          <span className="text-white text-sm font-black tracking-widest -mt-0.5">SPORTS</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative">
        <div className="bg-gradient-to-br from-[#E50914] to-[#B00000] rounded-xl p-2 shadow-[0_0_16px_rgba(229,9,20,0.35)]">
          {mode === "creator" ? <Tv2 className="w-4 h-4 text-white" /> : <span className="text-xs font-black text-white">{initials}</span>}
        </div>
      </div>
      <div>
        <div className="flex items-center gap-1">
          <span className="text-white font-black text-base leading-none tracking-tight font-heading">LIVE</span>
          <span className="text-[#E50914] font-black text-base leading-none tracking-tight font-heading">SPORTS</span>
        </div>
        {subtitle ? (
          <span className="text-[9px] text-gray-600 font-semibold uppercase tracking-widest leading-none mt-0.5 block">
            {subtitle}
          </span>
        ) : null}
      </div>
    </div>
  );
}
