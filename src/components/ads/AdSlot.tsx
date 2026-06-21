"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Ad, AdPosition } from "@/types";
import { publicApiRequest, apiRequest } from "@/lib/api";
import { cn } from "@/utils";
import { X, BarChart2 } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AdSlotProps {
  position: AdPosition;
  className?: string;
  variant?: "horizontal" | "box" | "popup" | "overlay" | "lateral" | "embedded";
  /** Callback fired after the ad impression is tracked */
  onImpression?: (adId: string) => void;
  /** Callback fired when the user clicks the ad */
  onClick?: (adId: string) => void;
}

// ─── Active filter ─────────────────────────────────────────────────────────────

function isActive(ad: Ad): boolean {
  if (ad.status !== "active") return false;
  const now = Date.now();
  if (ad.startDate && new Date(ad.startDate).getTime() > now) return false;
  if (ad.endDate && new Date(ad.endDate).getTime() < now) return false;
  return true;
}

// ─── Metrics tracking ─────────────────────────────────────────────────────────

async function trackImpression(adId: string): Promise<void> {
  try {
    await fetch(`/api/ads/${adId}/impression`, { method: "POST" });
  } catch {
    // silently ignore — metrics are non-critical
  }
}

async function trackClick(adId: string): Promise<void> {
  try {
    await fetch(`/api/ads/${adId}/click`, { method: "POST" });
  } catch {
    // silently ignore
  }
}

// ─── Placeholder ──────────────────────────────────────────────────────────────

function AdPlaceholder({
  variant,
}: {
  variant: "horizontal" | "box" | "popup" | "overlay" | "lateral" | "embedded";
}) {
  if (variant === "popup" || variant === "overlay") return null;

  if (variant === "embedded") {
    return (
      <div className="flex h-[72px] w-full items-center justify-center gap-2 opacity-35">
        <BarChart2 className="h-4 w-4 text-gray-500" />
        <span className="ad-label">Publicidade · Advertisement</span>
      </div>
    );
  }

  const sizeCls =
    variant === "box"
      ? "max-w-[320px] aspect-[4/3]"
      : variant === "lateral"
      ? "w-[160px] min-h-[600px]"
      : "max-w-[1100px] h-[90px]";

  return (
    <div
      className={cn(
        "ad-container mx-auto w-full flex items-center justify-center",
        sizeCls,
      )}
    >
      <div className="flex flex-col items-center gap-1 opacity-40">
        <BarChart2 className="h-4 w-4 text-gray-500" />
        <span className="ad-label">Publicidade · Advertisement</span>
      </div>
    </div>
  );
}

// ─── Ad Content renderer ──────────────────────────────────────────────────────

function AdContent({ ad }: { ad: Ad }) {
  if (ad.format === "video" && ad.videoUrl) {
    return (
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
    );
  }
  if ((ad.format === "html" || ad.format === "script") && ad.content) {
    return <div className="h-full w-full" dangerouslySetInnerHTML={{ __html: ad.content }} />;
  }
  if (ad.imageUrl) {
    return (
      <img
        src={ad.imageUrl}
        alt={ad.title}
        className="h-full w-full object-contain transition-transform duration-300 hover:scale-[1.02]"
      />
    );
  }
  return (
    <div className="flex h-full w-full items-center justify-center">
      <span className="ad-label">{ad.title}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdSlot({
  position,
  className = "",
  variant = "horizontal",
  onImpression,
  onClick,
}: AdSlotProps) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [closed, setClosed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const impressionTracked = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Fetch ads once
  useEffect(() => {
    publicApiRequest<Ad[]>("/ads")
      .then((data) => {
        setAds(data);
        setLoaded(true);
      })
      .catch(() => {
        setAds([]);
        setLoaded(true);
      });
  }, []);

  // Pick the best matching ad for this position
  const ad = useMemo(
    () => ads.find((item) => item.position === position && isActive(item)),
    [ads, position],
  );

  // Intersection Observer — track impression only when ad is in viewport
  useEffect(() => {
    if (!ad || impressionTracked.current) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !impressionTracked.current) {
          impressionTracked.current = true;
          trackImpression(ad.id);
          onImpression?.(ad.id);
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ad, onImpression]);

  const handleClick = useCallback(() => {
    if (!ad) return;
    trackClick(ad.id);
    onClick?.(ad.id);
  }, [ad, onClick]);

  // ── Closed ────────────────────────────────────────────────────────────────
  if (closed) return null;

  // ── Placeholder (loaded but no matching ad) ───────────────────────────────
  if (loaded && !ad) {
    return <AdPlaceholder variant={variant} />;
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (!ad) return null;

  // ── Popup (floating bottom-right corner) ─────────────────────────────────
  if (variant === "popup") {
    return (
      <div
        ref={containerRef}
        className={cn(
          "fixed bottom-6 right-6 z-40 hidden w-[300px] overflow-hidden rounded-2xl shadow-2xl lg:block",
          "border border-white/8 bg-[#111118] animate-fadeInUp",
          className,
        )}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/6 bg-[#0E0E16]">
          <span className="ad-label">Publicidade · Ad</span>
          <button
            onClick={() => setClosed(true)}
            className="p-1 rounded-lg text-gray-600 hover:text-white hover:bg-white/8 transition-all"
            aria-label="Fechar anúncio"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <a
          href={ad.clickUrl || "#"}
          target={ad.clickUrl ? "_blank" : undefined}
          rel="noreferrer"
          className="block h-[200px] bg-black/30"
          onClick={handleClick}
        >
          <AdContent ad={ad} />
        </a>
        <div className="px-3 py-1.5 bg-[#0E0E16] border-t border-white/4">
          <p className="text-[9px] text-gray-600 text-center">
            Anúncio · {ad.impressions?.toLocaleString() || 0} impressões
          </p>
        </div>
      </div>
    );
  }

  // ── Overlay (full-screen semi-transparent, dismissible) ───────────────────
  if (variant === "overlay") {
    return (
      <div
        ref={containerRef}
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm",
          className,
        )}
      >
        <div className="relative w-full max-w-lg mx-4 overflow-hidden rounded-2xl border border-white/10 bg-[#111118] shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
            <span className="ad-label text-xs">Publicidade</span>
            <button
              onClick={() => setClosed(true)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <a
            href={ad.clickUrl || "#"}
            target={ad.clickUrl ? "_blank" : undefined}
            rel="noreferrer"
            className="block aspect-video bg-black/30"
            onClick={handleClick}
          >
            <AdContent ad={ad} />
          </a>
        </div>
      </div>
    );
  }

  // ── Lateral (tall sidebar banner) ─────────────────────────────────────────
  if (variant === "lateral") {
    return (
      <div
        ref={containerRef}
        className={cn(
          "ad-container w-[160px] min-h-[600px] overflow-hidden",
          className,
        )}
      >
        <div className="px-1 py-1 text-center">
          <span className="ad-label">Publicidade</span>
        </div>
        <a
          href={ad.clickUrl || "#"}
          target={ad.clickUrl ? "_blank" : undefined}
          rel="noreferrer"
          className="block w-full min-h-[560px] overflow-hidden rounded-lg bg-black/20"
          onClick={handleClick}
        >
          <AdContent ad={ad} />
        </a>
      </div>
    );
  }

  // ── Embedded (flush on page background, no card border) ───────────────────
  if (variant === "embedded") {
    return (
      <div ref={containerRef} className={cn("relative z-10 w-full", className)}>
        <a
          href={ad.clickUrl || "#"}
          target={ad.clickUrl ? "_blank" : undefined}
          rel="noreferrer"
          className="block h-[72px] w-full overflow-hidden rounded-lg"
          onClick={handleClick}
        >
          <AdContent ad={ad} />
        </a>
        <p className="mt-1 text-center">
          <span className="ad-label">Publicidade · Advertisement</span>
        </p>
      </div>
    );
  }

  // ── Default: horizontal / box ─────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className={cn(
        "ad-container mx-auto w-full overflow-hidden",
        variant === "box" ? "max-w-[320px]" : "max-w-[1100px]",
        className,
      )}
    >
      <div className="px-2 py-1 flex items-center justify-between">
        <span className="ad-label">Publicidade · Advertisement</span>
        <button
          onClick={() => setClosed(true)}
          className="p-0.5 rounded text-gray-700 hover:text-gray-400 transition-colors"
          aria-label="Fechar"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      <a
        href={ad.clickUrl || "#"}
        target={ad.clickUrl ? "_blank" : undefined}
        rel="noreferrer"
        className={cn(
          "block overflow-hidden rounded-lg",
          variant === "box" ? "aspect-[4/3]" : "h-[90px]",
        )}
        onClick={handleClick}
      >
        <AdContent ad={ad} />
      </a>
    </div>
  );
}
