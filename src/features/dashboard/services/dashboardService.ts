import apiClient from "../../../api/apiClient";
import { DashboardStats } from "../types";

/**
 * Servicio para obtener estadísticas del dashboard desde el endpoint centralizado.
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const response = await apiClient.get<DashboardStats>("/dashboard/stats");
    return response.data;
  } catch (error) {
    console.error("[dashboardService] Error fetching dashboard stats:", error);
    throw error;
  }
};
