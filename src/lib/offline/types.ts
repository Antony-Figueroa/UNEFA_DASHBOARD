export interface CachedEntity<T = unknown> {
  key: string;
  data: T;
  timestamp: number;
  expiresAt: number;
}

export type MutationType = 'create' | 'update' | 'delete';
export type MutationMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type MutationStatus = 'pending' | 'processing' | 'failed' | 'completed';

export interface PendingMutation {
  id: string;
  type: MutationType;
  endpoint: string;
  method: MutationMethod;
  payload: unknown;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  status: MutationStatus;
  error?: string;
}

export interface SyncLog {
  id: string;
  mutationId: string;
  status: 'success' | 'failed';
  timestamp: number;
  error?: string;
  response?: unknown;
}

export type SyncStatus = 'idle' | 'syncing' | 'error';

export interface OfflineState {
  isOnline: boolean;
  pendingCount: number;
  syncStatus: SyncStatus;
  lastSyncAt: number | null;
  isInitialized: boolean;
}

export interface OfflineActions {
  queueMutation: (mutation: Omit<PendingMutation, 'id' | 'timestamp' | 'retryCount' | 'status'>) => Promise<string>;
  getCachedData: <T>(key: string) => Promise<T | null>;
  cacheData: <T>(key: string, data: T, ttlMs?: number) => Promise<void>;
  forceSync: () => Promise<void>;
  clearCache: () => Promise<void>;
  getPendingMutations: () => Promise<PendingMutation[]>;
  removeMutation: (id: string) => Promise<void>;
  updateMutationStatus: (id: string, status: MutationStatus, error?: string) => Promise<void>;
}

export interface OfflineContextValue extends OfflineState, OfflineActions {}

export interface CachedListItem {
  key: string;
  id: string | number;
  data: unknown;
  timestamp: number;
}

export const CACHE_KEYS = {
  CAREERS: 'careers',
  PERIODS: 'periods',
  STUDENTS: 'students',
  INSTITUTIONS: 'institutions',
  ENROLLMENTS: 'enrollments',
  TUTORS: 'tutors',
  USERS: 'users',
  INTERNSHIP_TYPES: 'internship_types',
  ACTIVITY_LOGS: 'activity_logs',
  LISTS: 'lists_config',
  DASHBOARD_STATS: 'dashboard_stats',
} as const;

export type CacheKey = typeof CACHE_KEYS[keyof typeof CACHE_KEYS];
