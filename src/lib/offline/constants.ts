export const OFFLINE_CONFIG = {
  DB_NAME: 'UnefaOfflineDB',
  DB_VERSION: 1,
  
  CACHE_TTL: {
    SHORT: 5 * 60 * 1000,
    MEDIUM: 30 * 60 * 1000,
    LONG: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000,
  },
  
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  SYNC_BATCH_SIZE: 5,
  SYNC_INTERVAL_MS: 30 * 1000,
  
  ENDPOINTS_NO_CACHE: [
    '/auth/',
    '/notifications',
    '/activity-logs',
    '/documents',
    '/student-requests',
  ] as const,
  
  ENDPOINTS_CACHE_FIRST: [
    '/careers',
    '/periods',
    '/institutions',
    '/internship-types',
    '/lists',
  ] as const,
  
  ENDPOINTS_NETWORK_FIRST: [
    '/students',
    '/enrollments',
    '/tutors',
    '/users',
    '/evaluations',
  ] as const,
} as const;

export function shouldCacheEndpoint(url: string): boolean {
  const noCachePatterns = OFFLINE_CONFIG.ENDPOINTS_NO_CACHE;
  return !noCachePatterns.some(pattern => url.includes(pattern));
}

export function getCacheStrategy(url: string): 'cache-first' | 'network-first' | 'no-cache' {
  if (!shouldCacheEndpoint(url)) {
    return 'no-cache';
  }
  
  if (OFFLINE_CONFIG.ENDPOINTS_NETWORK_FIRST.some(pattern => url.includes(pattern))) {
    return 'network-first';
  }
  
  if (OFFLINE_CONFIG.ENDPOINTS_CACHE_FIRST.some(pattern => url.includes(pattern))) {
    return 'cache-first';
  }
  
  return 'network-first';
}

export function getCacheTTL(url: string): number {
  if (url.includes('/dashboard') || url.includes('/stats')) {
    return OFFLINE_CONFIG.CACHE_TTL.SHORT;
  }
  if (url.includes('/students') || url.includes('/enrollments')) {
    return OFFLINE_CONFIG.CACHE_TTL.MEDIUM;
  }
  if (url.includes('/careers') || url.includes('/periods') || url.includes('/institutions')) {
    return OFFLINE_CONFIG.CACHE_TTL.LONG;
  }
  return OFFLINE_CONFIG.CACHE_TTL.MEDIUM;
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
