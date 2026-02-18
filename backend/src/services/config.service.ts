import { dbManager } from '../lib/db-manager.js';

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
}

export const getConfig = async (): Promise<SystemConfig | null> => {
  const supabase = dbManager.getConnection();
  const { data, error } = await supabase
    .from('t_config')
    .select('*')
    .eq('CONFIG_ID', 1)
    .single();

  if (error) {
    console.error('[ConfigService] Error getting config:', error);
    return null;
  }

  return data as unknown as SystemConfig;
};

export const updateConfig = async (updates: Partial<SystemConfig>): Promise<SystemConfig | null> => {
  const supabase = dbManager.getConnection();
  
  const { data, error } = await supabase
    .from('t_config')
    .update(updates)
    .eq('CONFIG_ID', 1)
    .select()
    .single();

  if (error) {
    console.error('[ConfigService] Error updating config:', error);
    return null;
  }

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
