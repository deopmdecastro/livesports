"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { publicApiRequest } from "@/lib/api";
import { cn } from "@/utils";

export interface PromotionalBanner {
  id: string;
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  imageUrl: string;
  linkUrl?: string | null;
  ctaText?: string | null;
  position: "hero" | "sidebar" | "in_content";
  active: boolean;
  sortOrder: number;
  startDate?: string | null;
  endDate?: string | null;
}

interface PromoBannerStripProps {
  position?: "in_content" | "sidebar";
  className?: string;
}

export default function PromoBannerStrip({
  position = "in_content",
  className,
}: PromoBannerStripProps) {
  const [banners, setBanners] = useState<PromotionalBanner[]>([]);

  useEffect(() => {
    let mounted = true;
    publicApiRequest<PromotionalBanner[]>(`/banners?position=${position}&active=true`, {
      cacheTtl: 60_000,
    })
      .then((res) => {
        if (!mounted) return;
        setBanners(Array.isArray(res) ? res : []);
      })
      .catch(() => {
        if (mounted) setBanners([]);
      });
    return () => {
      mounted = false;
    };
  }, [position]);

  const activeBanner = useMemo(() => {
    const now = Date.now();
    return banners.find((b) => {
      if (!b.active) return false;
      if (b.startDate && new Date(b.startDate).getTime() > now) return false;
      if (b.endDate && new Date(b.endDate).getTime() < now) return false;
      return true;
    });
  }, [banners]);

  if (!activeBanner) return null;

  const isExternal = activeBanner.linkUrl?.startsWith("http");
  const href = activeBanner.linkUrl || "/plans";

  const Inner = (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[26px] border border-white/10 bg-[#0B0D16] shadow-[0_24px_80px_rgba(0,0,0,0.45)] transition-all duration-300 hover:border-[#E50914]/40",
        position === "sidebar" ? "p-5 min-h-[240px]" : "px-6 py-7 sm:px-9 sm:py-8",
        className,
      )}
    >
      <img
        src={activeBanner.imageUrl}
        alt={activeBanner.title}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover opacity-35 transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#06070D]/95 via-[#06070D]/82 to-[#06070D]/45" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(229,9,20,0.20),transparent_48%)]" />

      <div
        className={cn(
          "relative z-10 flex gap-5",
          position === "sidebar"
            ? "flex-col justify-between h-full"
            : "flex-col md:flex-row md:items-center md:justify-between",
        )}
      >
        <div className="space-y-2.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E50914]/30 bg-[#E50914]/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#ff6d75]">
            <Sparkles className="h-3 w-3" />
            {activeBanner.badge || "Destaque Patrocinado"}
          </div>
          <h3
            className="text-2xl sm:text-3xl font-black text-white leading-tight"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            {activeBanner.title}
          </h3>
          {activeBanner.subtitle && (
            <p className="text-xs sm:text-sm text-white/65 leading-relaxed">
              {activeBanner.subtitle}
            </p>
          )}
        </div>

        <div className="shrink-0">
          <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#E50914] to-[#B00000] px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-[0_10px_30px_rgba(229,9,20,0.32)] transition-all group-hover:brightness-110 group-hover:translate-x-0.5">
            {activeBanner.ctaText || "Saber Mais"}
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </div>
  );

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block">
        {Inner}
      </a>
    );
  }

  return (
    <Link href={href} className="block">
      {Inner}
    </Link>
  );
}
