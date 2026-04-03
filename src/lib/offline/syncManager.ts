import { offlineDb, clearExpiredCache, getDatabaseStats } from './db';
import {
  getPendingMutations,
  executeMutation,
  clearCompletedMutations,
  getPendingCount,
} from './syncQueue';
import { OFFLINE_CONFIG } from './constants';
import type { SyncStatus } from './types';

type SyncListener = (status: SyncStatus, pendingCount: number) => void;

class SyncManager {
  private listeners: Set<SyncListener> = new Set();
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private isSyncing = false;
  private currentStatus: SyncStatus = 'idle';
  private lastSyncAt: number | null = null;

  start(): void {
    if (this.syncInterval) {
      console.info('[SyncManager] Already running');
      return;
    }

    console.info('[SyncManager] Starting sync manager');
    
    this.syncInterval = setInterval(() => {
      if (navigator.onLine) {
        this.processQueue();
      }
    }, OFFLINE_CONFIG.SYNC_INTERVAL_MS);

    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    
    console.info('[SyncManager] Stopped');
  }

  private handleOnline = (): void => {
    console.info('[SyncManager] Connection restored, starting sync');
    this.processQueue();
  };

  private handleOffline = (): void => {
    console.info('[SyncManager] Connection lost');
    this.updateStatus('idle');
  };

  async processQueue(): Promise<void> {
    if (this.isSyncing || !navigator.onLine) {
      return;
    }

    this.isSyncing = true;
    this.updateStatus('syncing');

    try {
      await clearExpiredCache();
      
      const pendingMutations = await getPendingMutations();
      
      if (pendingMutations.length === 0) {
        console.info('[SyncManager] No pending mutations');
        this.lastSyncAt = Date.now();
        this.updateStatus('idle');
        return;
      }

      console.info(`[SyncManager] Processing ${pendingMutations.length} pending mutations`);

      let successCount = 0;
      let failCount = 0;

      for (const mutation of pendingMutations) {
        if (!navigator.onLine) {
          console.warn('[SyncManager] Lost connection during sync');
          break;
        }

        const success = await executeMutation(mutation);
        
        if (success) {
          successCount++;
        } else {
          failCount++;
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      await clearCompletedMutations();

      this.lastSyncAt = Date.now();
      
      console.info(`[SyncManager] Sync completed: ${successCount} success, ${failCount} failed`);

      if (failCount > 0) {
        this.updateStatus('error');
      } else {
        this.updateStatus('idle');
      }

      const pendingCount = await getPendingCount();
      this.notifyListeners(this.currentStatus, pendingCount);

    } catch (error) {
      console.error('[SyncManager] Sync error:', error);
      this.updateStatus('error');
    } finally {
      this.isSyncing = false;
    }
  }

  private updateStatus(status: SyncStatus): void {
    this.currentStatus = status;
  }

  getStatus(): SyncStatus {
    return this.currentStatus;
  }

  getLastSyncAt(): number | null {
    return this.lastSyncAt;
  }

  async forceSync(): Promise<void> {
    if (!navigator.onLine) {
      console.warn('[SyncManager] Cannot force sync while offline');
      return;
    }
    await this.processQueue();
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(status: SyncStatus, pendingCount: number): void {
    this.listeners.forEach(listener => listener(status, pendingCount));
  }

  async getStats(): Promise<{
    status: SyncStatus;
    lastSyncAt: number | null;
    pendingCount: number;
    dbStats: Awaited<ReturnType<typeof getDatabaseStats>>;
  }> {
    const [dbStats, pendingCount] = await Promise.all([
      getDatabaseStats(),
      getPendingCount(),
    ]);

    return {
      status: this.currentStatus,
      lastSyncAt: this.lastSyncAt,
      pendingCount,
      dbStats,
    };
  }
}

export const syncManager = new SyncManager();
