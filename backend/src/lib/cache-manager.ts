
type CacheEntry<T> = {
  data: T;
  expiry: number;
};

// Module-level cache storage (Singleton by nature of ES modules)
const cache: Map<string, CacheEntry<unknown>> = new Map();
const DEFAULT_TTL: number = 60000; // 1 minute default

/**
 * Set a value in the cache with a TTL
 */
const set = <T>(key: string, data: T, ttl: number = DEFAULT_TTL): void => {
  const expiry = Date.now() + ttl;
  cache.set(key, { data, expiry });
};

/**
 * Get a value from the cache
 * Returns null if not found or expired
 */
const get = <T>(key: string): T | null => {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }

  return entry.data as T;
};

/**
 * Delete a specific key from cache
 */
const remove = (key: string): void => {
  cache.delete(key);
};

/**
 * Clear the entire cache
 */
const clear = (): void => {
  cache.clear();
};

/**
 * Helper to clear cache by prefix (e.g., when updating students, clear 'students:*')
 */
const deleteByPrefix = (prefix: string): void => {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
};

// Export as a simple object to maintain compatibility with existing imports
// This replaces the previous Singleton Class pattern with a simpler Module pattern
export const cacheManager = {
  set,
  get,
  delete: remove,
  clear,
  deleteByPrefix
};
