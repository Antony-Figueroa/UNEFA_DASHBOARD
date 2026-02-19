import apiClient from '../../../api/apiClient';

export interface ConfigItem {
  id: string;
  category: string;
  key: string;
  label: string;
  value: string | number | boolean;
  type: 'text' | 'number' | 'boolean' | 'select';
  options?: { value: string; label: string }[];
  description: string;
}

export interface CategorizedConfig {
  category: string;
  items: ConfigItem[];
}

export interface ConfigResponse {
  raw: Record<string, unknown>;
  categorized: CategorizedConfig[];
}

export interface SystemHealth {
  status: 'healthy' | 'unhealthy';
  checks: {
    database: {
      status: 'ok' | 'error';
      message: string;
    };
    logs: {
      status: 'ok' | 'error';
      count: number;
      oldestRecord: string | null;
    };
  };
  timestamp: string;
}

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
