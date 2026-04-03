import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OfflineDatabase, clearExpiredCache, clearAllData, getDatabaseStats } from '../db';
import type { CachedEntity, PendingMutation } from '../types';

describe('OfflineDatabase', () => {
  let db: OfflineDatabase;

  beforeEach(async () => {
    db = new OfflineDatabase();
    await db.cache.clear();
    await db.mutations.clear();
    await db.syncLogs.clear();
  });

  describe('cache operations', () => {
    it('should store and retrieve cached data', async () => {
      const key = 'test-key';
      const data = { id: 1, name: 'Test' };
      const cachedEntity: CachedEntity<typeof data> = {
        key,
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + 60000,
      };

      await db.cache.put(cachedEntity);
      const result = await db.cache.get(key);

      expect(result).toBeDefined();
      expect(result?.data).toEqual(data);
    });

    it('should return null for non-existent key', async () => {
      const result = await db.cache.get('non-existent');
      expect(result).toBeUndefined();
    });

    it('should get expired cache entries', async () => {
      const now = Date.now();
      
      await db.cache.bulkPut([
        { key: 'expired', data: 'expired', timestamp: now - 1000, expiresAt: now - 500 },
        { key: 'valid', data: 'valid', timestamp: now, expiresAt: now + 60000 },
      ]);

      const expired = await db.getExpiredCache();
      expect(expired).toHaveLength(1);
      expect(expired[0].key).toBe('expired');
    });
  });

  describe('mutations operations', () => {
    it('should store and retrieve pending mutations', async () => {
      const mutation: PendingMutation = {
        id: 'test-mutation-1',
        type: 'create',
        endpoint: '/api/students',
        method: 'POST',
        payload: { name: 'Test' },
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
        status: 'pending',
      };

      await db.mutations.add(mutation);
      const result = await db.getMutationById('test-mutation-1');

      expect(result).toBeDefined();
      expect(result?.endpoint).toBe('/api/students');
    });

    it('should get pending mutations sorted by timestamp', async () => {
      const now = Date.now();
      
      await db.mutations.bulkAdd([
        {
          id: 'mutation-2',
          type: 'create',
          endpoint: '/api/test2',
          method: 'POST',
          payload: {},
          timestamp: now + 1000,
          retryCount: 0,
          maxRetries: 3,
          status: 'pending',
        },
        {
          id: 'mutation-1',
          type: 'create',
          endpoint: '/api/test1',
          method: 'POST',
          payload: {},
          timestamp: now,
          retryCount: 0,
          maxRetries: 3,
          status: 'pending',
        },
      ]);

      const pending = await db.getPendingMutations();
      expect(pending).toHaveLength(2);
      expect(pending[0].id).toBe('mutation-1');
    });

    it('should get mutation by endpoint', async () => {
      const mutation: PendingMutation = {
        id: 'test-mutation',
        type: 'create',
        endpoint: '/api/students',
        method: 'POST',
        payload: { name: 'Test' },
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
        status: 'pending',
      };

      await db.mutations.add(mutation);
      const result = await db.getMutationByEndpoint('/api/students');

      expect(result).toBeDefined();
      expect(result?.id).toBe('test-mutation');
    });
  });

  describe('clearExpiredCache', () => {
    it('should remove expired cache entries', async () => {
      const now = Date.now();
      
      await db.cache.bulkPut([
        { key: 'expired1', data: 'test', timestamp: now - 1000, expiresAt: now - 500 },
        { key: 'expired2', data: 'test', timestamp: now - 1000, expiresAt: now - 200 },
        { key: 'valid', data: 'test', timestamp: now, expiresAt: now + 60000 },
      ]);

      await clearExpiredCache();
      
      const all = await db.cache.toArray();
      expect(all).toHaveLength(1);
      expect(all[0].key).toBe('valid');
    });
  });

  describe('clearAllData', () => {
    it('should clear all stores', async () => {
      await db.cache.put({ key: 'test', data: 'test', timestamp: Date.now(), expiresAt: Date.now() + 60000 });
      await db.mutations.add({
        id: 'test',
        type: 'create',
        endpoint: '/api/test',
        method: 'POST',
        payload: {},
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
        status: 'pending',
      });

      await clearAllData();

      const cacheCount = await db.cache.count();
      const mutationCount = await db.mutations.count();
      
      expect(cacheCount).toBe(0);
      expect(mutationCount).toBe(0);
    });
  });

  describe('getDatabaseStats', () => {
    it('should return database statistics', async () => {
      await db.cache.put({ key: 'test', data: 'test', timestamp: Date.now(), expiresAt: Date.now() + 60000 });
      await db.mutations.add({
        id: 'test',
        type: 'create',
        endpoint: '/api/test',
        method: 'POST',
        payload: {},
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
        status: 'pending',
      });

      const stats = await getDatabaseStats();
      
      expect(stats.cacheCount).toBe(1);
      expect(stats.pendingMutations).toBe(1);
      expect(stats.syncLogs).toBe(0);
    });
  });
});
