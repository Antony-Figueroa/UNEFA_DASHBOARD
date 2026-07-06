import apiClient from '../../../api/apiClient';
import type { ConfigItem, CategorizedConfig, ConfigResponse, SystemHealth, SyncResult } from '../types';

export type { ConfigItem, CategorizedConfig, ConfigResponse, SystemHealth, SyncResult };

export const configService = {
  getConfig: async () => {
    const response = await apiClient.get('/config');
    return response.data as ConfigResponse;
  },

  updateConfig: async (updates: Record<string, string | number | boolean>) => {
    const response = await apiClient.put('/config', updates);
    return response.data;
  },

  clearOldLogs: async (days: number = 90) => {
    const response = await apiClient.post('/config/clear-logs', { days });
    return response.data;
  },

  getSystemHealth: async () => {
    const response = await apiClient.get('/config/health');
    return response.data as SystemHealth;
  },

  syncData: async () => {
    const response = await apiClient.post('/config/sync');
    return response.data as { success: boolean; message: string; tables: Record<string, { count: number; status: string }>; timestamp: string };
  }
};

export default configService;
