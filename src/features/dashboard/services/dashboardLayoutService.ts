import apiClient from '../../../api/apiClient';

export interface DashboardWidget {
  key: string;
  order: number;
  visible: boolean;
  /** Sobreescribe el tamaño por defecto del widget */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Color de acento personalizado (hex o nombre) */
  color?: string;
}

export interface DashboardLayout {
  roleId: number;
  widgets: DashboardWidget[];
}

export const dashboardLayoutService = {
  /** Obtiene el layout para un rol específico */
  getByRole: async (roleId: number): Promise<DashboardLayout> => {
    const response = await apiClient.get<{ success: boolean; data: DashboardLayout }>(
      `/dashboard-config/layout/${roleId}`
    );
    return response.data.data;
  },

  /** Obtiene todos los layouts (solo admin) */
  getAll: async (): Promise<DashboardLayout[]> => {
    const response = await apiClient.get<{ success: boolean; data: DashboardLayout[] }>(
      '/dashboard-config/layouts'
    );
    return response.data.data;
  },

  /** Guarda el layout de un rol  (solo admin) */
  save: async (roleId: number, widgets: DashboardWidget[]): Promise<DashboardLayout> => {
    const response = await apiClient.put<{ success: boolean; data: DashboardLayout }>(
      `/dashboard-config/layout/${roleId}`,
      { widgets }
    );
    return response.data.data;
  },

  /** Resetea el layout de un rol a valores por defecto (solo admin) */
  reset: async (roleId: number): Promise<DashboardLayout> => {
    const response = await apiClient.post<{ success: boolean; data: DashboardLayout }>(
      `/dashboard-config/layout/${roleId}/reset`
    );
    return response.data.data;
  },
};
