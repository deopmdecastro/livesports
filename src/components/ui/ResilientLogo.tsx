"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchDynamicBackupLogos,
  generateVectorMonogramDataUri,
  resolveMultiSourceLogos,
  type LogoKind,
} from "@/lib/logo-fallback";
import { cn } from "@/utils";

export interface ResilientLogoProps {
  /** Primary logo URL */
  src?: string | null;
  /** Additional backup logo URLs */
  backupUrls?: Array<string | null | undefined>;
  /** Entity name (team, league, channel, country) used for multi-source lookup & fallback badge */
  name?: string | null;
  /** Optional 2/3-letter team or country code */
  code?: string | null;
  /** Entity category */
  kind?: LogoKind;
  /** Accessible alt text */
  alt?: string;
  /** Image element classes */
  className?: string;
  /** Target pixel hint */
  size?: number;
  /** Disable dynamic backend lookup on failure if desired */
  disableDynamicLookup?: boolean;
}

/**
 * Multi-source resilient logo `<img />` component.
 * Automatically cascades through:
 *  1. Primary URL + derived CDN mirrors (ESPN / TheSportsDB / FlagCDN / FlagsAPI)
 *  2. Explicit backupUrls + curated multi-provider dictionary
 *  3. Live backend discovery (`/api/integrations/logos/resolve` querying ESPN & TheSportsDB)
 *  4. Guaranteed crisp inline SVG vector monogram
 */
export default function ResilientLogo({
  src,
  backupUrls,
  name,
  code,
  kind = "team",
  alt,
  className,
  size = 64,
  disableDynamicLookup = false,
}: ResilientLogoProps) {
  const staticChain = useMemo(
    () =>
      resolveMultiSourceLogos({
        primaryUrl: src,
        backupUrls,
        name,
        code,
        kind,
        size,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [src, name, code, kind, size, JSON.stringify(backupUrls || [])],
  );

  // Separate real remote URLs from the final data:image/svg+xml monogram
  const vectorFallback = useMemo(
    () =>
      staticChain.find((u) => u.startsWith("data:image/svg+xml")) ||
      generateVectorMonogramDataUri(name || code || "LS", kind),
    [staticChain, name, code, kind],
  );

  const initialRemoteChain = useMemo(
    () => staticChain.filter((u) => !u.startsWith("data:image/svg+xml")),
    [staticChain],
  );

  const [candidates, setCandidates] = useState<string[]>(initialRemoteChain);
  const [index, setIndex] = useState(0);
  const fetchedDynamicRef = useRef(false);

  useEffect(() => {
    setCandidates(initialRemoteChain);
    setIndex(0);
    fetchedDynamicRef.current = false;
  }, [initialRemoteChain]);

  // If primary was missing and we have no static remote URLs, try dynamic lookup immediately
  useEffect(() => {
    if (
      initialRemoteChain.length === 0 &&
      !disableDynamicLookup &&
      name &&
      name.trim().length >= 2 &&
      !fetchedDynamicRef.current
    ) {
      fetchedDynamicRef.current = true;
      fetchDynamicBackupLogos(name, kind).then((discovered) => {
        if (discovered.length > 0) {
          setCandidates(discovered);
          setIndex(0);
        }
      });
    }
  }, [initialRemoteChain.length, disableDynamicLookup, name, kind]);

  const handleError = () => {
    const nextIdx = index + 1;
    if (nextIdx < candidates.length) {
      setIndex(nextIdx);
      return;
    }

    // All static remote sources failed -> try dynamic API lookup once before showing SVG monogram
    if (!disableDynamicLookup && !fetchedDynamicRef.current && name && name.trim().length >= 2) {
      fetchedDynamicRef.current = true;
      fetchDynamicBackupLogos(name, kind).then((discovered) => {
        const fresh = discovered.filter((d) => !candidates.includes(d));
        if (fresh.length > 0) {
          setCandidates((prev) => {
            const nextList = [...prev, ...fresh];
            setIndex(prev.length);
            return nextList;
          });
        } else {
          setIndex(candidates.length);
        }
      });
      return;
    }

    setIndex(candidates.length);
  };

  const currentUrl = index < candidates.length ? candidates[index] : vectorFallback;

  return (
    <img
      src={currentUrl}
      alt={alt ?? name ?? ""}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={currentUrl === vectorFallback ? undefined : handleError}
      className={cn("object-contain", className)}
    />
  );
}
