import apiClient from '../../../api/apiClient';

export interface Manual {
  id: number;
  title: string;
  description: string;
  category: string;
  fileType: string;
  fileSize: string;
  fileUrl?: string;
  version: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}

export interface ManualsResponse {
  success: boolean;
  data: Manual[];
}

export interface CategoriesResponse {
  success: boolean;
  data: string[];
}

export const manualsService = {
  getAll: async (params?: { category?: string; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);
    
    const queryString = queryParams.toString();
    const url = `/manuals${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient.get(url);
    return response.data as ManualsResponse;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/manuals/${id}`);
    return response.data as { success: boolean; data: Manual };
  },

  getCategories: async () => {
    const response = await apiClient.get('/manuals/categories');
    return response.data as CategoriesResponse;
  },

  create: async (manual: Partial<Manual>) => {
    const response = await apiClient.post('/manuals', manual);
    return response.data;
  },

  update: async (id: number, updates: Partial<Manual>) => {
    const response = await apiClient.put(`/manuals/${id}`, updates);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/manuals/${id}`);
    return response.data;
  }
};

export default manualsService;
