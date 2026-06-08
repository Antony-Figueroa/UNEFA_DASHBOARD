/**
 * @file dashboardService.ts
 * @description Service for retrieving centralized dashboard metrics and statistics.
 */

import apiClient from "../../../api/apiClient";
import { DashboardStats } from "../types";

/**
 * Fetches the comprehensive dashboard statistics from the centralized endpoint.
 * This includes student counts, institution metrics, growth trends, and charts data.
 * 
 * @param periodId - Optional period ID to filter registration stats.
 * @returns A promise with the dashboard statistics.
 * @throws Will throw an error if the request fails, which should be handled by the caller.
 */
export const getDashboardStats = async (periodId?: number): Promise<DashboardStats> => {
  const response = await apiClient.get<DashboardStats>("/dashboard/stats", {
    params: periodId !== undefined ? { periodId } : {}
  });
  return response.data;
};
