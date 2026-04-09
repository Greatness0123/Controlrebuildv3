const cache = new Map<string, { data: any; timestamp: number }>();
const DEFAULT_TTL = 30000;

export function getCached<T>(key: string, ttl = DEFAULT_TTL): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ttl) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export function invalidateCache(key: string): void {
  cache.delete(key);
}

export function clearCache(): void {
  cache.clear();
}

export async function withCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl = DEFAULT_TTL
): Promise<T> {
  const cached = getCached<T>(key, ttl);
  if (cached) return cached;
  
  const data = await fetchFn();
  setCache(key, data);
  return data;
}
