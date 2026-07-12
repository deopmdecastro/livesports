"use client";

import { useEffect, useState } from "react";
import { apiRequest, publicApiRequest } from "@/lib/api";

export const BRANDING_STORAGE_KEY = "livesports_branding";

export interface BrandingSettings {
  logoUrl: string;
  faviconUrl: string;
  ogImageUrl: string;
  primaryColor: string;
  siteName: string;
}

export const DEFAULT_BRANDING: BrandingSettings = {
  logoUrl: "",
  faviconUrl: "",
  ogImageUrl: "",
  primaryColor: "#E50914",
  siteName: "LiveSports",
};

export const BRANDING_UPDATED_EVENT = "livesports:branding-updated";
const BRANDING_CACHE_TTL_MS = 60_000;
let brandingRequest: Promise<BrandingSettings> | null = null;

function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function normalizeBranding(value?: Partial<BrandingSettings> | null): BrandingSettings {
  if (!value) return { ...DEFAULT_BRANDING };
  return {
    logoUrl: typeof value.logoUrl === "string" ? value.logoUrl : DEFAULT_BRANDING.logoUrl,
    faviconUrl: typeof value.faviconUrl === "string" ? value.faviconUrl : DEFAULT_BRANDING.faviconUrl,
    ogImageUrl: typeof value.ogImageUrl === "string" ? value.ogImageUrl : DEFAULT_BRANDING.ogImageUrl,
    primaryColor: typeof value.primaryColor === "string" && value.primaryColor.trim()
      ? value.primaryColor
      : DEFAULT_BRANDING.primaryColor,
    siteName: typeof value.siteName === "string" && value.siteName.trim()
      ? value.siteName.trim()
      : DEFAULT_BRANDING.siteName,
  };
}

export function readStoredBranding(): BrandingSettings {
  if (typeof window === "undefined") return { ...DEFAULT_BRANDING };

  try {
    const raw = window.localStorage.getItem(BRANDING_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_BRANDING };
    const parsed: unknown = JSON.parse(raw);
    return normalizeBranding(isObjectLike(parsed) ? (parsed as Partial<BrandingSettings>) : undefined);
  } catch {
    return { ...DEFAULT_BRANDING };
  }
}

export function persistBranding(branding: Partial<BrandingSettings>): BrandingSettings {
  const normalized = normalizeBranding(branding);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent(BRANDING_UPDATED_EVENT, { detail: normalized }));
  }
  return normalized;
}

export function clearStoredBranding(): BrandingSettings {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(BRANDING_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(BRANDING_UPDATED_EVENT, { detail: { ...DEFAULT_BRANDING } }));
  }
  return { ...DEFAULT_BRANDING };
}

/**
 * Fetches branding from the backend (source of truth) and syncs it into
 * localStorage so every component listening to BRANDING_UPDATED_EVENT / the
 * "storage" event picks it up — including the footer logo.
 */
export async function fetchBranding(force = false): Promise<BrandingSettings> {
  if (!force && brandingRequest) return brandingRequest;

  const request = publicApiRequest<Partial<BrandingSettings>>("/settings/branding", {
    cacheTtl: force ? 0 : BRANDING_CACHE_TTL_MS,
  })
    .then((response) => {
      const normalized = normalizeBranding(response);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(normalized));
        window.dispatchEvent(new CustomEvent(BRANDING_UPDATED_EVENT, { detail: normalized }));
      }
      return normalized;
    })
    .finally(() => {
      brandingRequest = null;
    });

  brandingRequest = request;
  return request;
}

/**
 * Persists branding to the backend (admin only) and mirrors it locally.
 */
export async function saveBranding(branding: Partial<BrandingSettings>): Promise<BrandingSettings> {
  const response = await apiRequest<Partial<BrandingSettings>>("/settings/branding", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(normalizeBranding(branding)),
  });
  return persistBranding(response);
}

/**
 * Live branding for any client component (navbar, footer, sidebar...).
 * Reads the local cache first for an instant paint, fetches the API value
 * on mount, and stays in sync when settings are saved elsewhere (same tab
 * via BRANDING_UPDATED_EVENT, other tabs via the "storage" event).
 */
export function useBranding(): BrandingSettings {
  const [branding, setBranding] = useState<BrandingSettings>(() => readStoredBranding());

  useEffect(() => {
    fetchBranding().then(setBranding).catch(() => {
      /* keep whatever was cached locally if the API is unreachable */
    });

    const refresh = () => setBranding(readStoredBranding());
    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== BRANDING_STORAGE_KEY) return;
      refresh();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(BRANDING_UPDATED_EVENT, refresh as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(BRANDING_UPDATED_EVENT, refresh as EventListener);
    };
  }, []);

  return branding;
}

function setOrCreateLink(rel: string, href: string, type?: string) {
  if (typeof document === "undefined") return;
  let link = document.querySelector<HTMLLinkElement>(`link[rel='${rel}']`);
  if (!link) {
    link = document.createElement("link");
    link.rel = rel;
    document.head.appendChild(link);
  }
  if (type) link.type = type;
  link.href = href;
}

function withCacheBust(url: string): string {
  if (!url) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${Date.now()}`;
}

export function applyBrandingToDocument(branding: Partial<BrandingSettings>) {
  if (typeof document === "undefined") return;

  const normalized = normalizeBranding(branding);
  const faviconHref = normalized.faviconUrl ? withCacheBust(normalized.faviconUrl) : "/favicon.svg";

  setOrCreateLink("icon", faviconHref, normalized.faviconUrl ? undefined : "image/svg+xml");
  setOrCreateLink("shortcut icon", faviconHref, normalized.faviconUrl ? undefined : "image/svg+xml");
  setOrCreateLink("apple-touch-icon", faviconHref, normalized.faviconUrl ? undefined : "image/svg+xml");

  document.documentElement.style.setProperty("--brand-primary", normalized.primaryColor || DEFAULT_BRANDING.primaryColor);
  document.documentElement.setAttribute("data-brand-site-name", normalized.siteName || DEFAULT_BRANDING.siteName);

  if (normalized.siteName) {
    document.title = document.title.includes(DEFAULT_BRANDING.siteName)
      ? document.title.replaceAll(DEFAULT_BRANDING.siteName, normalized.siteName)
      : document.title;
  }
}
