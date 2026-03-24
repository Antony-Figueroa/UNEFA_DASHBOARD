import apiClient from '../../../api/apiClient';
import type {
  AuditLogsResponse,
  AuditLogDetailResponse,
  AuditStatsResponse,
  AuditTablesResponse,
  GetAuditLogsParams
} from '../types';

export const auditLogsService = {
  getAll: async (params?: GetAuditLogsParams): Promise<AuditLogsResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params?.tableName) queryParams.append('tableName', params.tableName);
    if (params?.userId) queryParams.append('userId', String(params.userId));
    if (params?.operation) queryParams.append('operation', params.operation);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.offset) queryParams.append('offset', String(params.offset));
    
    const queryString = queryParams.toString();
    const url = `/audit${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient.get(url);
    return response.data;
  },

  getById: async (id: number): Promise<AuditLogDetailResponse> => {
    const response = await apiClient.get(`/audit/${id}`);
    return response.data;
  },

  getTables: async (): Promise<AuditTablesResponse> => {
    const response = await apiClient.get('/audit/tables');
    return response.data;
  },

  getStats: async (days?: number): Promise<AuditStatsResponse> => {
    const params = days ? `?days=${days}` : '';
    const response = await apiClient.get(`/audit/stats${params}`);
    return response.data;
  },

  getRecordHistory: async (tableName: string, recordId: number, limit?: number): Promise<AuditLogsResponse> => {
    const params = limit ? `?limit=${limit}` : '';
    const response = await apiClient.get(`/audit/record/${tableName}/${recordId}${params}`);
    return response.data;
  }
};

export default auditLogsService;
