import apiClient from '../../../api/apiClient';

export interface Role {
  id: number;
  name: string;
  description: string;
  userCount: number;
  permissions: string[];
  status: 'active' | 'inactive';
  isSystem: boolean;
}

export interface RolesResponse {
  success: boolean;
  data: Role[];
}

export interface CreateRolePayload {
  name: string;
  description?: string;
  permissionIds?: number[];
}

export const rolesService = {
  getAll: async () => {
    const response = await apiClient.get('/roles');
    return response.data as RolesResponse;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/roles/${id}`);
    return response.data as { success: boolean; data: Role };
  },

  getPermissions: async () => {
    const response = await apiClient.get('/roles/permissions');
    return response.data as { success: boolean; data: Role[]; modules: string[] };
  },

  create: async (data: CreateRolePayload) => {
    const response = await apiClient.post('/roles', data);
    return response.data as { success: boolean; data: Role; message: string };
  },

  update: async (id: number, updates: { name?: string; description?: string }) => {
    const response = await apiClient.put(`/roles/${id}`, updates);
    return response.data;
  }
};
