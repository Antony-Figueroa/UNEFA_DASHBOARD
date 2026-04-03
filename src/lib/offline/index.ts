export {
  offlineDb,
  clearExpiredCache,
  clearAllData,
  getDatabaseStats,
} from './db';

export {
  queueMutation,
  getPendingMutations,
  getMutationById,
  removeMutation,
  updateMutationStatus,
  incrementRetryCount,
  clearCompletedMutations,
  getPendingCount,
  executeMutation,
  hasPendingMutationForEndpoint,
} from './syncQueue';

export { syncManager } from './syncManager';

export {
  getCachedData,
  cacheData,
  invalidateCache,
  invalidateCachePattern,
  queueOfflineMutation,
  getOfflinePendingCount,
  startSyncManager,
  stopSyncManager,
  forceSyncNow,
  subscribeSyncManager,
  extractCacheKeyFromUrl,
  getCacheStats,
} from './offlineApiClient';

export * from './types';
export * from './constants';
