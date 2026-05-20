/**
 * @file useDashboardStats.ts
 * @description Hook for managing dashboard statistics state with caching.
 * Implements stale-while-revalidate pattern for optimal UX.
 */

import { useState, useEffect, useCallback } from "react";
import { DashboardStats } from "../types";
import { getDashboardStats } from "../services/dashboardService";

const CACHE_KEY = "dashboard_stats_cache";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: DashboardStats;
  timestamp: number;
}

/**
 * Get cached stats from localStorage
 */
const getCachedStats = (): DashboardStats | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const entry: CacheEntry = JSON.parse(cached);
    const isExpired = Date.now() - entry.timestamp > CACHE_DURATION;
    
    if (isExpired) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    return entry.data;
  } catch {
    return null;
  }
};

/**
 * Save stats to localStorage cache
 */
const setCachedStats = (data: DashboardStats): void => {
  try {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Ignore storage errors
  }
};

/**
 * Hook to manage dashboard statistics with caching.
 * Uses stale-while-revalidate pattern: shows cached data immediately 
 * while fetching fresh data in background.
 * 
 * @returns An object containing:
 * - `stats`: The dashboard data (from cache or fresh).
 * - `loading`: Boolean indicating if initial fetch is in progress.
 * - `error`: String containing error message or null if no error.
 * - `refresh`: Function to manually trigger a data refresh.
 * - `isStale`: Boolean indicating if displayed data is from cache.
 */
export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);

  /**
   * Fetches the dashboard stats from the service.
   * @param silent - If true, doesn't set the loading state.
   * @param force - If true, bypasses cache and forces fresh fetch.
   */
  const fetchStats = useCallback(async (silent = false, force = false) => {
    try {
      if (!silent) {
        // Check for cached data on initial load
        if (!force) {
          const cached = getCachedStats();
          if (cached) {
            setStats(cached);
            setIsStale(true);
          }
        }
        setLoading(true);
      }

      // Always fetch fresh data in background
      const data = await getDashboardStats();
      setStats(data);
      setCachedStats(data);
      setError(null);
      setIsStale(false);
    } catch (err: any) {
      console.error("[useDashboardStats] Error fetching dashboard stats:", err);
      
      // If we have cached data, don't show error - just keep using stale data
      const cached = getCachedStats();
      if (!cached) {
        const errorMessage = err.response?.data?.message || 
                            err.message || 
                            "Error de conexión con el servidor";
        setError(errorMessage);
      }
      
      // If fetch failed but we have cached data, try to use it
      if (!stats && !cached) {
        const freshCached = getCachedStats();
        if (freshCached) {
          setStats(freshCached);
          setIsStale(true);
        }
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    
    // Polling every 30 seconds for "real-time" updates (only if not stale)
    const interval = setInterval(() => {
      fetchStats(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchStats]);

  return { stats, loading, error, refresh: fetchStats, isStale };
};

