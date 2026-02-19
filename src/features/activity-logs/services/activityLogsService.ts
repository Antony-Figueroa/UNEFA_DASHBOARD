import apiClient from '../../../api/apiClient';
import type {
  CreateActivityLogPayload,
  UpdateActivityLogPayload,
  ActivityLogsResponse,
  ActivityLogResponse,
  ActivityLogStatsResponse
} from '../types';

export const activityLogsService = {
  getAll: async (params?: {
    practiceId?: number;
    studentId?: number;
    type?: string;
    week?: number;
    status?: string;
  }): Promise<ActivityLogsResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.practiceId) queryParams.append('practiceId', String(params.practiceId));
    if (params?.studentId) queryParams.append('studentId', String(params.studentId));
    if (params?.type) queryParams.append('type', params.type);
    if (params?.week) queryParams.append('week', String(params.week));
    if (params?.status) queryParams.append('status', params.status);
    
    const queryString = queryParams.toString();
    const url = `/activity-logs${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient.get(url);
    return response.data;
  },

  getById: async (id: number): Promise<ActivityLogResponse> => {
    const response = await apiClient.get(`/activity-logs/${id}`);
    return response.data;
  },

  create: async (data: CreateActivityLogPayload): Promise<ActivityLogResponse> => {
    const response = await apiClient.post('/activity-logs', data);
    return response.data;
  },

  update: async (id: number, data: UpdateActivityLogPayload): Promise<ActivityLogResponse> => {
    const response = await apiClient.put(`/activity-logs/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/activity-logs/${id}`);
  },

  approve: async (id: number, comments?: string): Promise<ActivityLogResponse> => {
    const response = await apiClient.post(`/activity-logs/${id}/approve`, { comments });
    return response.data;
  },

  getStats: async (practiceId: number): Promise<ActivityLogStatsResponse> => {
    const response = await apiClient.get(`/activity-logs/stats?practiceId=${practiceId}`);
    return response.data;
  }
};

export default activityLogsService;
