"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseApiDataOptions<T> {
  /** URL path (without /api prefix, e.g., "/lives?status=live") */
  url: string;
  /** Polling interval in ms (0 = no polling) */
  pollInterval?: number;
  /** Initial data */
  initialData?: T;
  /** Whether to fetch immediately */
  enabled?: boolean;
  /** Transform function */
  transform?: (data: T) => T;
  /** Dependencies for re-fetching */
  deps?: unknown[];
}

interface UseApiDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setData: (data: T) => void;
}

import { apiRequest, publicApiRequest, type ApiListResponse } from "@/lib/api";

/**
 * Reusable hook for fetching data from the API with polling support,
 * error handling, and refresh capability.
 *
 * @example
 * const { data, loading, refresh } = useApiData<Live[]>({
 *   url: "/lives?status=live",
 *   pollInterval: 30_000,
 * });
 */
export function useApiData<T>({
  url,
  pollInterval = 0,
  initialData = null,
  enabled = true,
  transform,
  deps = [],
}: UseApiDataOptions<T>): UseApiDataReturn<T> {
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const isPublic = !url.startsWith("/users") && !url.startsWith("/dashboard") && !url.startsWith("/admin");

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const fetcher = isPublic ? publicApiRequest : apiRequest;
      let result = await fetcher<T>(url);
      if (transform) result = transform(result);
      if (mountedRef.current) setData(result);
    } catch (err) {
      if (mountedRef.current) setError(err instanceof Error ? err.message : "Erro ao carregar dados");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [url, enabled, isPublic, transform, ...deps]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    if (pollInterval > 0) {
      const interval = setInterval(fetchData, pollInterval);
      return () => {
        mountedRef.current = false;
        clearInterval(interval);
      };
    }
    return () => { mountedRef.current = false; };
  }, [fetchData, pollInterval]);

  return { data, loading, error, refresh: fetchData, setData };
}

/**
 * Hook for paginated API data with auto-loading.
 */
export function useApiListData<T>(
  url: string,
  options?: Omit<UseApiDataOptions<ApiListResponse<T>>, "url" | "transform">
) {
  return useApiData<ApiListResponse<T>>({
    url,
    ...options,
    transform: (data) => ({
      ...data,
      items: data.items || [],
    }),
  });
}
