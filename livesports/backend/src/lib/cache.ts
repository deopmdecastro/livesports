/**
 * Minimal in-process TTL cache for hot, read-heavy endpoints (e.g. the
 * "currently live" list, which is realistically polled every few seconds by
 * many clients). This is intentionally NOT Redis-backed: the project's
 * docker-compose/README mention Redis, but nothing in the codebase actually
 * connects to it, and introducing a new infra dependency wasn't part of this
 * pass. This in-memory cache is correct for a single backend instance; if the
 * app is ever scaled to multiple instances behind a load balancer, swap this
 * for a shared cache (Redis) so instances don't serve stale/divergent data.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export async function cached<T>(key: string, ttlMs: number, compute: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    return hit.value as T;
  }
  const value = await compute();
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export function invalidateCache(key: string): void {
  store.delete(key);
}

export function invalidateCachePrefix(prefix: string): void {
  for (const k of store.keys()) {
    if (k.startsWith(prefix)) store.delete(k);
  }
}
