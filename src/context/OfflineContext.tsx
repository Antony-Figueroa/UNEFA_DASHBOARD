import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import {
  startSyncManager,
  stopSyncManager,
  forceSyncNow,
  getOfflinePendingCount,
  getCachedData,
  cacheData,
  clearAllData,
  getPendingMutations,
  removeMutation,
  updateMutationStatus,
  syncManager,
  offlineDb,
  type OfflineContextValue,
  type OfflineState,
  type SyncStatus,
  type PendingMutation,
} from '../lib/offline/index';
import { generateUUID } from '../lib/offline/constants';

const initialState: OfflineState = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  pendingCount: 0,
  syncStatus: 'idle',
  lastSyncAt: null,
  isInitialized: false,
};

const OfflineContext = createContext<OfflineContextValue | null>(null);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OfflineState>(initialState);
  const syncManagerStarted = useRef(false);

  const updatePendingCount = useCallback(async () => {
    try {
      const count = await getOfflinePendingCount();
      setState(prev => ({ ...prev, pendingCount: count }));
    } catch (error) {
      console.error('[OfflineContext] Error getting pending count:', error);
    }
  }, []);

  const handleSyncStatusChange = useCallback((status: SyncStatus, pendingCount: number) => {
    setState(prev => ({
      ...prev,
      syncStatus: status,
      pendingCount,
      lastSyncAt: status === 'idle' && pendingCount === 0 ? Date.now() : prev.lastSyncAt,
    }));
  }, []);

  useEffect(() => {
    if (syncManagerStarted.current) return;
    syncManagerStarted.current = true;

    startSyncManager();
    updatePendingCount();

    const unsubscribe = syncManager.subscribe(handleSyncStatusChange);

    return () => {
      unsubscribe();
      stopSyncManager();
    };
  }, [handleSyncStatusChange, updatePendingCount]);

  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      console.info('[OfflineContext] Connection restored');
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
      console.info('[OfflineContext] Connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setState(prev => ({ ...prev, isInitialized: true }));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(updatePendingCount, 5000);
    return () => clearInterval(interval);
  }, [updatePendingCount]);

  const queueMutation = useCallback(async (
    mutation: Parameters<OfflineContextValue['queueMutation']>[0]
  ): Promise<string> => {
    const id = generateUUID();
    
    const pendingMutation: PendingMutation = {
      type: mutation.type,
      endpoint: mutation.endpoint,
      method: mutation.method,
      payload: mutation.payload,
      maxRetries: mutation.maxRetries,
      id,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
    };
    
    await offlineDb.mutations.add(pendingMutation);
    await updatePendingCount();
    
    return id;
  }, [updatePendingCount]);

  const getCachedDataLocal = useCallback(async <T,>(key: string): Promise<T | null> => {
    return getCachedData<T>(key);
  }, []);

  const cacheDataLocal = useCallback(async <T,>(key: string, data: T, ttlMs?: number): Promise<void> => {
    await cacheData(key, data, ttlMs);
  }, []);

  const forceSync = useCallback(async (): Promise<void> => {
    await forceSyncNow();
    await updatePendingCount();
  }, [updatePendingCount]);

  const clearCache = useCallback(async (): Promise<void> => {
    await clearAllData();
    await updatePendingCount();
  }, [updatePendingCount]);

  const getPendingMutationsLocal = useCallback(async () => {
    return getPendingMutations();
  }, []);

  const removeMutationLocal = useCallback(async (id: string): Promise<void> => {
    await removeMutation(id);
    await updatePendingCount();
  }, [updatePendingCount]);

  const updateMutationStatusLocal = useCallback(async (
    id: string,
    status: Parameters<OfflineContextValue['updateMutationStatus']>[1],
    error?: string
  ): Promise<void> => {
    await updateMutationStatus(id, status, error);
    await updatePendingCount();
  }, [updatePendingCount]);

  const value: OfflineContextValue = {
    ...state,
    queueMutation,
    getCachedData: getCachedDataLocal,
    cacheData: cacheDataLocal,
    forceSync,
    clearCache,
    getPendingMutations: getPendingMutationsLocal,
    removeMutation: removeMutationLocal,
    updateMutationStatus: updateMutationStatusLocal,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline(): OfflineContextValue {
  const context = useContext(OfflineContext);
  
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  
  return context;
}

export function useIsOnline(): boolean {
  const { isOnline } = useOffline();
  return isOnline;
}

export function usePendingMutationsCount(): number {
  const { pendingCount } = useOffline();
  return pendingCount;
}

export function useSyncStatus(): SyncStatus {
  const { syncStatus } = useOffline();
  return syncStatus;
}
