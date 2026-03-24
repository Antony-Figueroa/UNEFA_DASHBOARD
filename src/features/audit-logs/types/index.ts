export interface AuditLog {
  id: number;
  dateTime: string;
  tableName: string;
  tableLabel: string;
  columnName: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  userId: number;
  userName: string;
  userCi: string;
  oldValue: string;
  newValue: string;
  ipAddress: string;
  recordId: number;
}

export interface AuditTable {
  TABLE_ID: number;
  NAME: string;
  PHYSICAL_NAME: string;
}

export interface AuditStats {
  operations: {
    INSERT: number;
    UPDATE: number;
    DELETE: number;
  };
  topUsers: Array<{ name: string; count: number }>;
  topTables: Array<{ name: string; count: number }>;
  totalChanges: number;
  period: number;
}

export interface AuditLogsResponse {
  success: boolean;
  data: AuditLog[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface AuditLogDetailResponse {
  success: boolean;
  data: AuditLog;
}

export interface AuditStatsResponse {
  success: boolean;
  data: AuditStats;
}

export interface AuditTablesResponse {
  success: boolean;
  data: AuditTable[];
}

export interface GetAuditLogsParams {
  tableName?: string;
  userId?: number;
  operation?: 'INSERT' | 'UPDATE' | 'DELETE';
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}
