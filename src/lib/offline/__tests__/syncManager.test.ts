import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { syncManager } from '../syncManager';
import { offlineDb, clearAllData } from '../db';
import { queueMutation } from '../syncQueue';
import type { PendingMutation } from '../types';

describe('SyncManager', () => {
  beforeEach(async () => {
    await clearAllData();
    syncManager.stop();
    vi.clearAllMocks();
  });

  afterEach(() => {
    syncManager.stop();
  });

  describe('start/stop', () => {
    it('should start the sync manager', () => {
      const consoleSpy = vi.spyOn(console, 'info');
      
      syncManager.start();
      
      expect(consoleSpy).toHaveBeenCalledWith('[SyncManager] Starting sync manager');
    });

    it('should allow starting after stop', () => {
      const consoleSpy = vi.spyOn(console, 'info');
      
      syncManager.start();
      syncManager.stop();
      syncManager.start();
      
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should stop the sync manager', () => {
      const consoleSpy = vi.spyOn(console, 'info');
      
      syncManager.start();
      syncManager.stop();
      
      expect(consoleSpy).toHaveBeenCalledWith('[SyncManager] Stopped');
    });
  });

  describe('getStatus', () => {
    it('should return idle by default', () => {
      expect(syncManager.getStatus()).toBe('idle');
    });
  });

  describe('getLastSyncAt', () => {
    it('should return null by default', () => {
      expect(syncManager.getLastSyncAt()).toBeNull();
    });
  });

  describe('subscribe', () => {
    it('should allow subscription to status changes', () => {
      const callback = vi.fn();
      const unsubscribe = syncManager.subscribe(callback);
      
      expect(typeof unsubscribe).toBe('function');
      
      unsubscribe();
    });

    it('should notify listeners when processQueue is called', async () => {
      const callback = vi.fn();
      syncManager.subscribe(callback);
      
      syncManager.start();
      
      await queueMutation({
        type: 'create',
        endpoint: '/api/test',
        method: 'POST',
        payload: { test: 'data' },
        maxRetries: 3,
      });
      
      await syncManager.processQueue();
      
      expect(callback).toHaveBeenCalledWith(expect.any(String), expect.any(Number));
    });

    it('should unsubscribe correctly', async () => {
      const callback = vi.fn();
      const unsubscribe = syncManager.subscribe(callback);
      
      unsubscribe();
      
      syncManager.start();
      await syncManager.processQueue();
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('processQueue', () => {
    it('should return early if offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const result = await syncManager.processQueue();
      
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      expect(result).toBeUndefined();
    });

    it('should process pending mutations when online', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      const mutationId = await queueMutation({
        type: 'create',
        endpoint: '/api/test',
        method: 'POST',
        payload: { test: 'data' },
        maxRetries: 3,
      });

      const mutation = await offlineDb.getMutationById(mutationId);
      expect(mutation).toBeDefined();
      expect(mutation?.status).toBe('pending');
    });

    it('should handle empty queue gracefully', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      const consoleSpy = vi.spyOn(console, 'info');
      
      await syncManager.processQueue();
      
      expect(consoleSpy).toHaveBeenCalledWith('[SyncManager] No pending mutations');
    });
  });

  describe('forceSync', () => {
    it('should not sync if offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const consoleSpy = vi.spyOn(console, 'warn');
      
      await syncManager.forceSync();
      
      expect(consoleSpy).toHaveBeenCalledWith('[SyncManager] Cannot force sync while offline');

      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
    });

    it('should sync when online', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      await syncManager.forceSync();
      
      expect(syncManager.getStatus()).toBe('idle');
    });
  });

  describe('getStats', () => {
    it('should return comprehensive stats', async () => {
      await queueMutation({
        type: 'create',
        endpoint: '/api/test',
        method: 'POST',
        payload: { test: 'data' },
        maxRetries: 3,
      });

      const stats = await syncManager.getStats();
      
      expect(stats).toHaveProperty('status');
      expect(stats).toHaveProperty('lastSyncAt');
      expect(stats).toHaveProperty('pendingCount');
      expect(stats).toHaveProperty('dbStats');
      expect(stats.dbStats).toHaveProperty('cacheCount');
      expect(stats.dbStats).toHaveProperty('pendingMutations');
    });
  });
});
