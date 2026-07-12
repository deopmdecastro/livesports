// ─── Configuration ────────────────────────────────────────────────────────────

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// In the browser always use a relative path (/api) so the Next.js rewrite rules
// (next.config.ts) proxy the request to the backend. This prevents calls to
// localhost:3001 from breaking in production or deployed environments.
export const API_URL =
  typeof window !== "undefined"
    ? "/api"
    : RAW_API_URL.endsWith("/api")
    ? RAW_API_URL
    : `${RAW_API_URL}/api`;

// ─── Retry configuration ─────────────────────────────────────────────────────

const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 500;

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);
      // Only retry on 5xx or network errors (not 4xx)
      if (response.status >= 500 && attempt < retries) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        continue;
      }
      return response;
    } catch (err) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        continue;
      }
      throw err;
    }
  }
  // Fallback — should not reach here
  return fetch(url, options);
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ApiListResponse<T> {
  items: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
  };
}

export interface ApiError {
  message: string;
  status: number;
  requestId?: string;
}

// ─── Local storage helpers ────────────────────────────────────────────────────

const STORAGE_KEYS = {
  accessToken: "livesports.accessToken",
  refreshToken: "livesports.refreshToken",
  user: "livesports.user",
} as const;

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEYS.accessToken);
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEYS.refreshToken);
}
export function setAuthSession(data: {
  accessToken: string;
  refreshToken?: string;
  user?: unknown;
}): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEYS.accessToken, data.accessToken);
  if (data.refreshToken) window.localStorage.setItem(STORAGE_KEYS.refreshToken, data.refreshToken);
  if (data.user) window.localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data.user));
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  Object.values(STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(key));
}

/**
 * Logs the user out: revokes the refresh token server-side (so it can't be
 * replayed even if it leaked) and then clears the local session. Network
 * failures are swallowed — the local session is cleared regardless, since a
 * failed revocation shouldn't trap the user in a logged-in UI state.
 */
export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  const token = getToken();
  try {
    if (token) {
      await fetchWithRetry(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ refreshToken }),
      });
    }
  } catch {
    // Best-effort: still clear the local session below.
  } finally {
    clearAuthSession();
  }
}

export function getStoredUser<T = Record<string, unknown>>(): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.user);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Overwrites the cached user profile (e.g. after a successful /auth/me update). */
export function setStoredUser(user: unknown): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
}

// ─── Token refresh (singleton promise to avoid races) ─────────────────────────

let _refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        clearAuthSession();
        return null;
      }

      const payload = await res.json();
      const newToken: string = payload?.data?.accessToken;
      if (newToken) {
        window.localStorage.setItem(STORAGE_KEYS.accessToken, newToken);
        if (payload?.data?.refreshToken) {
          window.localStorage.setItem(STORAGE_KEYS.refreshToken, payload.data.refreshToken);
        }
        return newToken;
      }
      return null;
    } catch {
      return null;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

// ─── In-memory response cache (for GET requests) ──────────────────────────────

interface CacheEntry {
  data: unknown;
  ts: number;
  ttl: number;
}

const _responseCache = new Map<string, CacheEntry>();
const DEFAULT_CACHE_TTL = 30 * 1000; // 30 seconds

function cacheGet<T>(key: string): T | null {
  const entry = _responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > entry.ttl) {
    _responseCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function cacheSet(key: string, data: unknown, ttl = DEFAULT_CACHE_TTL): void {
  _responseCache.set(key, { data, ts: Date.now(), ttl });
}

export function invalidateCache(pathPattern?: string): void {
  if (!pathPattern) {
    _responseCache.clear();
    return;
  }
  for (const key of _responseCache.keys()) {
    if (key.includes(pathPattern)) _responseCache.delete(key);
  }
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

interface FetchOptions extends RequestInit {
  /** TTL in ms for GET response caching. 0 = no cache. Default: 0. */
  cacheTtl?: number;
  /** Skip auth header even if token is present */
  noAuth?: boolean;
  /** Number of retries on 5xx errors */
  retries?: number;
}

async function coreFetch<T>(
  path: string,
  options: FetchOptions = {},
  attemptRefresh = true,
): Promise<T> {
  const { cacheTtl = 0, noAuth = false, retries = 1, ...init } = options;
  const isGet = !init.method || init.method === "GET";

  // Check cache for GET requests
  if (isGet && cacheTtl > 0) {
    const cached = cacheGet<T>(`${path}`);
    if (cached !== null) return cached;
  }

  const token = noAuth ? null : getToken();
  const url = `${API_URL}${path}`;

  const doFetch = async (): Promise<Response> => {
    return fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers || {}),
      },
      cache: isGet && cacheTtl > 0 ? "force-cache" : "no-store",
    });
  };

  let response: Response;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      response = await doFetch();
      break;
    } catch (err) {
      lastError = err as Error;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }
      throw new Error(`Erro de rede: ${lastError.message}`);
    }
  }

  // Token expired — try refresh once
  if (response!.status === 401 && attemptRefresh && !noAuth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return coreFetch<T>(path, { ...options, headers: { Authorization: `Bearer ${newToken}` } }, false);
    }
    // Refresh failed — clear session and redirect to login
    clearAuthSession();
    if (typeof window !== "undefined") {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
    }
    throw new Error("Sessao expirada. Por favor, inicia sessao novamente.");
  }

  const payload = await response!.json().catch(() => ({}));

  if (!response!.ok || payload.success === false) {
    let message = payload.error || `Erro ${response!.status}`;
    // Friendlier messages for common errors
    if (response!.status === 503) {
      message = `Serviço indisponível — a base de dados não está acessível.
Inicie o PostgreSQL: docker-compose up -d postgres`;
    } else if (response!.status === 500) {
      message = `${message} (Erro interno — verifique os logs do servidor)`;
    }
    const error = new Error(message) as Error & { status?: number; requestId?: string };
    error.status = response!.status;
    error.requestId = payload.requestId;
    throw error;
  }

  const data = payload.data as T;

  // Cache successful GET responses
  if (isGet && cacheTtl > 0) {
    cacheSet(`${path}`, data, cacheTtl);
  }

  return data;
}

// ─── Public API exports ───────────────────────────────────────────────────────

/**
 * Authenticated API request. Automatically attaches Bearer token and refreshes on 401.
 */
export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  return coreFetch<T>(path, init);
}

/**
 * Public (unauthenticated) API request with optional short-lived caching.
 */
export async function publicApiRequest<T>(
  path: string,
  options: { cacheTtl?: number } = {},
): Promise<T> {
  return coreFetch<T>(path, { noAuth: true, cacheTtl: options.cacheTtl ?? 0 });
}

/**
 * Public API request with 30s cache (useful for live event polling).
 */
export async function cachedApiRequest<T>(path: string, ttl = 30_000): Promise<T> {
  return coreFetch<T>(path, { noAuth: true, cacheTtl: ttl });
}
