import Dexie, { type Table } from 'dexie';
import type { CachedEntity, PendingMutation, SyncLog } from './types';

export class OfflineDatabase extends Dexie {
  cache!: Table<CachedEntity>;
  mutations!: Table<PendingMutation>;
  syncLogs!: Table<SyncLog>;

  constructor() {
    super('UnefaOfflineDB');
    
    this.version(1).stores({
      cache: 'key, expiresAt, timestamp',
      mutations: 'id, status, timestamp, endpoint',
      syncLogs: 'id, mutationId, timestamp, status',
    });
  }

  async getExpiredCache(): Promise<CachedEntity[]> {
    const now = Date.now();
    return this.cache.where('expiresAt').below(now).toArray();
  }

  async getPendingMutations(): Promise<PendingMutation[]> {
    return this.mutations
      .where('status')
      .anyOf(['pending', 'failed'])
      .sortBy('timestamp');
  }

  async getMutationById(id: string): Promise<PendingMutation | undefined> {
    return this.mutations.get(id);
  }

  async getMutationByEndpoint(endpoint: string): Promise<PendingMutation | undefined> {
    return this.mutations
      .where('endpoint')
      .equals(endpoint)
      .and(m => m.status === 'pending' || m.status === 'processing')
      .first();
  }
}

export const offlineDb = new OfflineDatabase();

export async function clearExpiredCache(): Promise<void> {
  const expired = await offlineDb.getExpiredCache();
  if (expired.length > 0) {
    const keys = expired.map(e => e.key);
    await offlineDb.cache.bulkDelete(keys);
    console.info(`[OfflineDB] Cleared ${expired.length} expired cache entries`);
  }
}

export async function clearAllData(): Promise<void> {
  await Promise.all([
    offlineDb.cache.clear(),
    offlineDb.mutations.clear(),
    offlineDb.syncLogs.clear(),
  ]);
  console.info('[OfflineDB] All offline data cleared');
}

export async function getDatabaseStats(): Promise<{
  cacheCount: number;
  pendingMutations: number;
  syncLogs: number;
}> {
  const [cacheCount, pendingMutations, syncLogs] = await Promise.all([
    offlineDb.cache.count(),
    offlineDb.mutations.where('status').anyOf(['pending', 'failed']).count(),
    offlineDb.syncLogs.count(),
  ]);
  
  return { cacheCount, pendingMutations, syncLogs };
}
