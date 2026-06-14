import { dbManager } from '../lib/db-manager.js';

/**
 * Cache en memoria para getConfig() con TTL de 30s.
 * Evita una query a Supabase en cada login y refresh.
 */
let cachedConfig: { data: SystemConfig | null; expiry: number } | null = null;
const CONFIG_CACHE_TTL = 30_000; // 30s

export const invalidateConfigCache = (): void => {
  cachedConfig = null;
};

export interface SystemConfig {
  CONFIG_ID: number;
  RECOVERY_EMAIL: number;
  BLOCKING_DAYS: number;
  WRONG_KEY_LOCK: number;
  ATTEMPTS_KEY_BLOCK: number;
  KEY_EXPIRATION: number;
  EXPIRATION_DAYS: number;
  USER_UPPERCASE: number;
  USER_LOWERCASE: number;
  USER_NUMBERS: number;
  USER_SPECIAL_CHARACTERS: number;
  USER_NUM_UPPERCASE: number;
  USER_NUM_LOWERCASE: number;
  USER_NUM_NUMBERS: number;
  USER_NUM_SPECIAL_CHARACTERS: number;
  KEY_UPPERCASE: number;
  KEY_LOWERCASE: number;
  KEY_NUMBERS: number;
  KEY_SPECIAL_CHARACTERS: number;
  KEY_NUM_UPPERCASE: number;
  KEY_NUM_LOWERCASE: number;
  KEY_NUM_NUMBERS: number;
  KEY_NUM_SPECIAL_CHARACTERS: number;
  USER_LENGTH: number;
  KEY_LEGTH: number;
  SECURITY_QUESTIONS: number;
  TOTAL_QUESTIONS: number;
  TOTAL_PRESET_QUESTIONS: number;
  TOTAL_USER_QUESTIONS: number;
  TOTAL_ANSWERS: number;
  PERIOD_VALIDATION_RULES?: Record<string, unknown>;
}

export const getConfig = async (): Promise<SystemConfig | null> => {
  // Cache warm? Devolver sin tocar DB
  if (cachedConfig && Date.now() < cachedConfig.expiry) {
    return cachedConfig.data;
  }

  const supabase = dbManager.getConnection();
  const { data, error } = await supabase
    .from('t_config')
    .select('*')
    .eq('CONFIG_ID', 1)
    .maybeSingle();

  // Usamos maybeSingle porque t_config puede tener múltiples filas
  // con CONFIG_ID=1 (duplicadas en Supabase). .single() lanzaría error
  // y getSessionMinutes() fallaría a default 60.
  if (error) {
    console.error('[ConfigService] Error getting config:', error);
    cachedConfig = { data: null, expiry: Date.now() + CONFIG_CACHE_TTL };
    return null;
  }

  const result = data as unknown as SystemConfig;
  cachedConfig = { data: result, expiry: Date.now() + CONFIG_CACHE_TTL };
  return result;
};

export const updateConfig = async (updates: Partial<SystemConfig>): Promise<SystemConfig | null> => {
  const supabase = dbManager.getConnection();
  
  const { data, error } = await supabase
    .from('t_config')
    .update(updates)
    .eq('CONFIG_ID', 1)
    .select()
    .maybeSingle();

  if (error) {
    console.error('[ConfigService] Error updating config:', error);
    return null;
  }

  // Invalidar cache porque la config cambió
  invalidateConfigCache();

  return data as unknown as SystemConfig;
};

export const clearOldLogs = async (daysToKeep: number = 90): Promise<{ deleted: number }> => {
  const supabase = dbManager.getConnection();
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const { data, error } = await supabase
    .from('t_auth_log')
    .delete()
    .lt('CREATED_AT', cutoffDate.toISOString())
    .select('AUTH_LOG_ID');

  if (error) {
    console.error('[ConfigService] Error clearing logs:', error);
    throw error;
  }

  return { deleted: data?.length || 0 };
};

export const getSystemHealth = async (): Promise<{
  database: boolean;
  logsCount: number;
  oldestLog: string | null;
}> => {
  const supabase = dbManager.getConnection();

  const [dbCheck, logsCountResult, oldestLogResult] = await Promise.all([
    supabase.from('t_config').select('CONFIG_ID').limit(1),
    supabase.from('t_auth_log').select('*', { count: 'exact', head: true }),
    supabase.from('t_auth_log').select('CREATED_AT').order('CREATED_AT', { ascending: true }).limit(1)
  ]);

  return {
    database: !dbCheck.error,
    logsCount: logsCountResult.count || 0,
    oldestLog: oldestLogResult.data?.[0]?.CREATED_AT || null
  };
};
