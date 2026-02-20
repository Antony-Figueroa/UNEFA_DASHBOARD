import apiClient from '../../../api/apiClient';

export interface Permission {
  PERMISSIONS_ID: number;
  NAME: string;
  DESCRIPTION: string | null;
}

export interface GroupedPermissions {
  [module: string]: Permission[];
}

export interface RolePermissionsResponse {
  success: boolean;
  data: Permission[];
  permissionIds: number[];
}

export interface MyPermissionsResponse {
  success: boolean;
  data: string[];
  roleId: number;
}

export const permissionService = {
  getAllPermissions: async (): Promise<{ data: Permission[]; grouped: GroupedPermissions }> => {
    const response = await apiClient.get('/permissions');
    return response.data;
  },

  getRolePermissions: async (roleId: number): Promise<RolePermissionsResponse> => {
    const response = await apiClient.get(`/permissions/role/${roleId}`);
    return response.data;
  },

  updateRolePermissions: async (roleId: number, permissionIds: number[]): Promise<void> => {
    await apiClient.put(`/permissions/role/${roleId}`, { permissionIds });
  },

  getMyPermissions: async (): Promise<string[]> => {
    const response = await apiClient.get('/permissions/my');
    return response.data.data || [];
  },

  checkPermission: async (permission: string): Promise<boolean> => {
    const response = await apiClient.get(`/permissions/check/${permission}`);
    return response.data.hasPermission;
  },
};
