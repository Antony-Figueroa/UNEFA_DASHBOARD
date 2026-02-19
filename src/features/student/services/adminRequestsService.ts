import apiClient from '../../../api/apiClient';
import type { RequestType } from '../types';

const ADMIN_API = '/requests';

export const adminRequestsService = {
  getAll: async (params?: { status?: string; typeId?: string }): Promise<{ data: any[]; stats: any }> => {
    const response = await apiClient.get(ADMIN_API, { params });
    return { data: response.data.data, stats: response.data.stats };
  },

  getById: async (id: string): Promise<any> => {
    const response = await apiClient.get(`${ADMIN_API}/${id}`);
    return response.data.data;
  },

  updateStatus: async (id: string, data: { status: string; response?: string }): Promise<void> => {
    await apiClient.put(`${ADMIN_API}/${id}`, data);
  },

  getTypes: async (): Promise<RequestType[]> => {
    const response = await apiClient.get(`${ADMIN_API}/types`);
    return response.data.data;
  }
};

export default adminRequestsService;
