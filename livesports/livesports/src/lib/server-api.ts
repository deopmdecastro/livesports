const RAW_SERVER_API_URL =
  process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const SERVER_API_URL = RAW_SERVER_API_URL.endsWith("/api")
  ? RAW_SERVER_API_URL
  : `${RAW_SERVER_API_URL}/api`;

export async function serverApiRequest<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${SERVER_API_URL}${path}`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok || payload.success === false) return null;
    return payload.data as T;
  } catch {
    return null;
  }
}
