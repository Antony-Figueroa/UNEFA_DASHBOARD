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

export interface SyncResult {
  success: boolean;
  message: string;
  tables: Record<string, { count: number; status: string }>;
  timestamp: string;
}
