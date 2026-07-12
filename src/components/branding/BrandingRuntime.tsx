"use client";

import { useEffect } from "react";
import { applyBrandingToDocument, BRANDING_UPDATED_EVENT, readStoredBranding } from "@/lib/branding";

export default function BrandingRuntime() {
  useEffect(() => {
    const applyCurrent = () => applyBrandingToDocument(readStoredBranding());
    applyCurrent();

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== "livesports_branding") return;
      applyCurrent();
    };

    const handleBrandingUpdated = () => applyCurrent();

    window.addEventListener("storage", handleStorage);
    window.addEventListener(BRANDING_UPDATED_EVENT, handleBrandingUpdated as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(BRANDING_UPDATED_EVENT, handleBrandingUpdated as EventListener);
    };
  }, []);

  return null;
}
