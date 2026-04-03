import { offlineDb } from './db';
import { queueMutation, getPendingCount, hasPendingMutationForEndpoint } from './syncQueue';
import { syncManager } from './syncManager';
import { getCacheTTL, shouldCacheEndpoint, generateUUID } from './constants';
import type { CachedEntity, PendingMutation } from './types';

export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const cached = await offlineDb.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    if (Date.now() > cached.expiresAt) {
      await offlineDb.cache.delete(key);
      return null;
    }
    
    return cached.data as T;
  } catch (error) {
    console.error(`[OfflineAPI] Error getting cached data for key: ${key}`, error);
    return null;
  }
}

export async function cacheData<T>(key: string, data: T, ttlMs?: number): Promise<void> {
  if (!shouldCacheEndpoint(key)) {
    return;
  }
  
  try {
    const ttl = ttlMs || getCacheTTL(key);
    const now = Date.now();
    
    const cachedEntity: CachedEntity<T> = {
      key,
      data,
      timestamp: now,
      expiresAt: now + ttl,
    };
    
    await offlineDb.cache.put(cachedEntity);
    
    console.debug(`[OfflineAPI] Cached data for key: ${key}`, { ttl, size: JSON.stringify(data).length });
  } catch (error) {
    console.error(`[OfflineAPI] Error caching data for key: ${key}`, error);
  }
}

export async function invalidateCache(key: string): Promise<void> {
  try {
    await offlineDb.cache.delete(key);
    console.debug(`[OfflineAPI] Cache invalidated for key: ${key}`);
  } catch (error) {
    console.error(`[OfflineAPI] Error invalidating cache for key: ${key}`, error);
  }
}

export async function invalidateCachePattern(pattern: string): Promise<void> {
  try {
    const keys = await offlineDb.cache
      .filter(item => item.key.includes(pattern))
      .primaryKeys();
    
    if (keys.length > 0) {
      await offlineDb.cache.bulkDelete(keys);
      console.debug(`[OfflineAPI] Cache invalidated for pattern: ${pattern}`, { count: keys.length });
    }
  } catch (error) {
    console.error(`[OfflineAPI] Error invalidating cache pattern: ${pattern}`, error);
  }
}

export async function queueOfflineMutation(
  type: PendingMutation['type'],
  endpoint: string,
  method: PendingMutation['method'],
  payload: unknown
): Promise<string> {
  const existingMutation = await hasPendingMutationForEndpoint(endpoint);
  
  if (existingMutation && (type === 'create' || type === 'update')) {
    console.warn(`[OfflineAPI] Duplicate mutation detected for: ${endpoint}`);
    const existing = await offlineDb.getMutationByEndpoint(endpoint);
    if (existing) {
      await offlineDb.mutations.update(existing.id, {
        payload,
        timestamp: Date.now(),
        status: 'pending',
      });
      return existing.id;
    }
  }
  
  return queueMutation({
    type,
    endpoint,
    method,
    payload,
    maxRetries: 3,
  });
}

export async function getOfflinePendingCount(): Promise<number> {
  return getPendingCount();
}

export function startSyncManager(): void {
  syncManager.start();
}

export function stopSyncManager(): void {
  syncManager.stop();
}

export async function forceSyncNow(): Promise<void> {
  await syncManager.forceSync();
}

export function subscribeSyncManager(listener: (status: string, pendingCount: number) => void): () => void {
  return syncManager.subscribe(listener);
}

export async function extractCacheKeyFromUrl(url: string): Promise<string> {
  const urlObj = new URL(url, window.location.origin);
  const pathname = urlObj.pathname.replace(/^\/api/, '');
  const searchParams = urlObj.searchParams.toString();
  
  return searchParams ? `${pathname}?${searchParams}` : pathname;
}

export async function getCacheStats(): Promise<{
  totalKeys: number;
  expiredKeys: number;
  totalSize: number;
}> {
  const allCache = await offlineDb.cache.toArray();
  const now = Date.now();
  
  let totalSize = 0;
  let expiredKeys = 0;
  
  allCache.forEach(item => {
    totalSize += JSON.stringify(item.data).length;
    if (item.expiresAt < now) {
      expiredKeys++;
    }
  });
  
  return {
    totalKeys: allCache.length,
    expiredKeys,
    totalSize,
  };
}
