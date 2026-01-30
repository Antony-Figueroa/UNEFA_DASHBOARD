/**
 * @file useDashboardStats.ts
 * @description Hook for managing dashboard statistics state and periodic refreshing.
 */

import { useState, useEffect, useCallback } from "react";
import { DashboardStats } from "../types";
import { getDashboardStats } from "../services/dashboardService";

/**
 * Hook to manage dashboard statistics.
 * Handles initial loading, error states, and automatic background polling.
 * 
 * @returns An object containing:
 * - `stats`: The dashboard data or null if not loaded.
 * - `loading`: Boolean indicating if the initial fetch is in progress.
 * - `error`: String containing error message or null if no error.
 * - `refresh`: Function to manually trigger a data refresh.
 */
export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches the dashboard stats from the service.
   * @param silent - If true, doesn't set the loading state (useful for background updates).
   */
  const fetchStats = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await getDashboardStats();
      setStats(data);
      setError(null);
    } catch (err: any) {
      console.error("[useDashboardStats] Error fetching dashboard stats:", err);
      
      // Extract error message from backend or use default
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          "Error de conexión con el servidor";
      setError(errorMessage);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    
    // Polling every 30 seconds for "real-time" updates
    const interval = setInterval(() => {
      fetchStats(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchStats]);

  return { stats, loading, error, refresh: fetchStats };
};

