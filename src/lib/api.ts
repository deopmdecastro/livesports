const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
export const API_URL = RAW_API_URL.endsWith("/api") ? RAW_API_URL : `${RAW_API_URL}/api`;

export interface ApiListResponse<T> {
  items: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
  };
}

function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("livesports.accessToken");
}

export function setAuthSession(data: { accessToken: string; refreshToken?: string; user?: unknown }) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("livesports.accessToken", data.accessToken);
  if (data.refreshToken) window.localStorage.setItem("livesports.refreshToken", data.refreshToken);
  if (data.user) window.localStorage.setItem("livesports.user", JSON.stringify(data.user));
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    throw new Error(payload.error || "Pedido API falhou.");
  }
  return payload.data as T;
}

export async function publicApiRequest<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    throw new Error(payload.error || "Pedido API falhou.");
  }
  return payload.data as T;
}
