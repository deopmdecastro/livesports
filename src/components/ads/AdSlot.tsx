"use client";

import { useEffect, useMemo, useState } from "react";
import type { Ad, AdPosition } from "@/types";
import { publicApiRequest } from "@/lib/api";
import { cn } from "@/utils";

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

export default function AdSlot({ position, className = "", variant = "horizontal" }: AdSlotProps) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    publicApiRequest<Ad[]>("/ads")
      .then(setAds)
      .catch(() => setAds([]));
  }, []);

  const ad = useMemo(() => ads.find((item) => item.position === position && isActive(item)), [ads, position]);

  if (!ad || closed) return null;

  const content = (
    <>
      {ad.format === "video" && ad.videoUrl ? (
        <video
          src={ad.videoUrl}
          poster={ad.imageUrl}
          className="h-full w-full object-contain"
          controls
          muted
          playsInline
        />
      ) : ad.format === "html" || ad.format === "script" ? (
        <div className="h-full w-full" dangerouslySetInnerHTML={{ __html: ad.content }} />
      ) : ad.imageUrl ? (
        <img src={ad.imageUrl} alt={ad.title} className="h-full w-full object-contain" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-500">
          {ad.title}
        </div>
      )}
    </>
  );

  if (variant === "popup") {
    return (
      <div className={cn("fixed bottom-5 right-5 z-40 hidden w-[320px] overflow-hidden rounded-xl border border-white/10 bg-[#111] shadow-2xl lg:block", className)}>
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
          <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Publicidade</span>
          <button onClick={() => setClosed(true)} className="text-xs font-bold text-gray-400 hover:text-white">Fechar</button>
        </div>
        <a href={ad.clickUrl || "#"} target={ad.clickUrl ? "_blank" : undefined} rel="noreferrer" className="block h-[180px] bg-black/40 p-2">
          {content}
        </a>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mx-auto w-full overflow-hidden rounded-xl border border-white/10 bg-[#111] p-2",
        variant === "box" ? "max-w-[320px]" : "max-w-[1100px]",
        className
      )}
    >
      <a
        href={ad.clickUrl || "#"}
        target={ad.clickUrl ? "_blank" : undefined}
        rel="noreferrer"
        className={cn("block bg-black/30", variant === "box" ? "aspect-[4/3]" : "aspect-[970/90]")}
      >
        {content}
      </a>
    </div>
  );
}
