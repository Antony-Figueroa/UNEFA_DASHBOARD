import apiClient from '../../../api/apiClient';

export interface Permission {
  id: string;
  module: string;
  action: string;
  description: string;
}

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

export interface PermissionsResponse {
  success: boolean;
  data: Permission[];
  modules: string[];
}

export interface RoleStatsResponse {
  success: boolean;
  data: {
    rolesCount: number;
    permissionsCount: number;
    usersWithRoles: number;
  };
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
    return response.data as PermissionsResponse;
  },

  getStats: async () => {
    const response = await apiClient.get('/roles/stats');
    return response.data as RoleStatsResponse;
  },

  create: async (data: { name: string; description?: string; permissionIds?: string[] }) => {
    const response = await apiClient.post('/roles', data);
    return response.data as { success: boolean; data: Role; message: string };
  },

  update: async (id: number, updates: { name?: string; description?: string; permissions?: string[] }) => {
    const response = await apiClient.put(`/roles/${id}`, updates);
    return response.data;
  }
};

export default rolesService;
