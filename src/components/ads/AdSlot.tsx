"use client";

import { useEffect, useMemo, useState } from "react";
import type { Ad, AdPosition } from "@/types";
import { publicApiRequest } from "@/lib/api";
import { cn } from "@/utils";
import { X } from "lucide-react";

interface AdSlotProps {
  position: AdPosition;
  className?: string;
  variant?: "horizontal" | "box" | "popup";
}

function isActive(ad: Ad) {
  if (ad.status !== "active") return false;
  const now = Date.now();
  if (ad.startDate && new Date(ad.startDate).getTime() > now) return false;
  if (ad.endDate && new Date(ad.endDate).getTime() < now) return false;
  return true;
}

// Mock ads as placeholders when API is unavailable
function AdPlaceholder({ variant }: { variant: "horizontal" | "box" | "popup" }) {
  if (variant === "popup") return null;
  return (
    <div className={cn(
      "ad-container mx-auto w-full flex items-center justify-center",
      variant === "box" ? "max-w-[320px] aspect-[4/3]" : "max-w-[1100px] h-[90px]"
    )}>
      <span className="ad-label">Publicidade · Advertisement</span>
    </div>
  );
}

export default function AdSlot({ position, className = "", variant = "horizontal" }: AdSlotProps) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [closed, setClosed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    publicApiRequest<Ad[]>("/ads")
      .then((data) => { setAds(data); setLoaded(true); })
      .catch(() => { setAds([]); setLoaded(true); });
  }, []);

  const ad = useMemo(() => ads.find((item) => item.position === position && isActive(item)), [ads, position]);

  if (closed) return null;

  // Show placeholder if no ad
  if (loaded && !ad) {
    return <AdPlaceholder variant={variant} />;
  }

  if (!ad) return null;

  const adContent = (
    <>
      {ad.format === "video" && ad.videoUrl ? (
        <video
          src={ad.videoUrl}
          poster={ad.imageUrl}
          className="h-full w-full object-contain"
          controls
          muted
          playsInline
          autoPlay
          loop
        />
      ) : ad.format === "html" || ad.format === "script" ? (
        <div className="h-full w-full" dangerouslySetInnerHTML={{ __html: ad.content }} />
      ) : ad.imageUrl ? (
        <img
          src={ad.imageUrl}
          alt={ad.title}
          className="h-full w-full object-contain transition-transform duration-300 hover:scale-[1.02]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className="ad-label">{ad.title}</span>
        </div>
      )}
    </>
  );

  if (variant === "popup") {
    return (
      <div className={cn(
        "fixed bottom-6 right-6 z-40 hidden w-[300px] overflow-hidden rounded-2xl shadow-2xl lg:block",
        "border border-white/8 bg-[#111118]",
        className
      )}>
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/6 bg-[#0E0E16]">
          <span className="ad-label">Publicidade · Ad</span>
          <button
            onClick={() => setClosed(true)}
            className="p-1 rounded-lg text-gray-600 hover:text-white hover:bg-white/8 transition-all"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <a
          href={ad.clickUrl || "#"}
          target={ad.clickUrl ? "_blank" : undefined}
          rel="noreferrer"
          className="block h-[200px] bg-black/30"
          onClick={() => {/* track click */}}
        >
          {adContent}
        </a>
      </div>
    );
  }

  return (
    <div className={cn(
      "ad-container mx-auto w-full overflow-hidden",
      variant === "box" ? "max-w-[320px]" : "max-w-[1100px]",
      className
    )}>
      <div className="px-2 py-1">
        <span className="ad-label block text-center">Publicidade · Advertisement</span>
      </div>
      <a
        href={ad.clickUrl || "#"}
        target={ad.clickUrl ? "_blank" : undefined}
        rel="noreferrer"
        className={cn(
          "block overflow-hidden rounded-lg",
          variant === "box" ? "aspect-[4/3]" : "h-[90px]"
        )}
      >
        {adContent}
      </a>
    </div>
  );
}
