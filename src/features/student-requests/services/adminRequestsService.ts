import apiClient from '../../../api/apiClient';
import type { RequestType, UpdateStatusPayload, RequestFilters, RequestStats, PaginationMeta, AdminRequest } from '../types';

const ADMIN_API = '/requests';

export interface GetAllResponse {
  data: AdminRequest[];
  stats: RequestStats;
  pagination: PaginationMeta;
}

export const adminRequestsService = {
  getAll: async (params?: RequestFilters): Promise<GetAllResponse> => {
    const response = await apiClient.get(ADMIN_API, { params });
    return { data: response.data.data, stats: response.data.stats, pagination: response.data.pagination };
  },

  getById: async (id: string): Promise<AdminRequest> => {
    const response = await apiClient.get(`${ADMIN_API}/${id}`);
    return response.data.data;
  },

  updateStatus: async (id: string, data: UpdateStatusPayload): Promise<void> => {
    await apiClient.put(`${ADMIN_API}/${id}`, data);
  },

  getTypes: async (): Promise<RequestType[]> => {
    const response = await apiClient.get(`${ADMIN_API}/types`);
    return response.data.data;
  }
};

export default adminRequestsService;
