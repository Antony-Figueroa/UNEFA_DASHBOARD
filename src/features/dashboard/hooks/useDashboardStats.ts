import { useState, useEffect, useCallback, useRef } from "react";
import { DashboardStats } from "../types";
import { getDashboardStats } from "../services/dashboardService";

const CACHE_DURATION = 5 * 60 * 1000;

interface CacheEntry {
  data: DashboardStats;
  timestamp: number;
}

const getCacheKey = (pid?: number | null) => `dashboard_stats_cache_${pid ?? 'default'}`;

const getCachedStats = (pid?: number | null): DashboardStats | null => {
  try {
    const cached = localStorage.getItem(getCacheKey(pid));
    if (!cached) return null;
    const entry: CacheEntry = JSON.parse(cached);
    return Date.now() - entry.timestamp > CACHE_DURATION ? null : entry.data;
  } catch {
    return null;
  }
};

const setCachedStats = (data: DashboardStats, pid?: number | null): void => {
  try {
    localStorage.setItem(getCacheKey(pid), JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    // Ignore storage errors
  }
};

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const statsRef = useRef<DashboardStats | null>(null);
  const periodRef = useRef<number | null>(null);

  useEffect(() => { statsRef.current = stats; }, [stats]);
  useEffect(() => { periodRef.current = selectedPeriodId; }, [selectedPeriodId]);

  const fetchStats = useCallback(async (silent = false, force = false, periodOverride?: number | null) => {
    const effectivePeriodId = periodOverride !== undefined ? periodOverride : periodRef.current;

    try {
      if (!silent) {
        if (!force) {
          const cached = getCachedStats(effectivePeriodId);
          if (cached) {
            setStats(cached);
            statsRef.current = cached;
            setIsStale(true);
          }
        }
        setLoading(true);
      }

      const data = await getDashboardStats(effectivePeriodId ?? undefined);
      setStats(data);
      statsRef.current = data;
      setCachedStats(data, effectivePeriodId);
      setError(null);
      setIsStale(false);
    } catch (err: any) {
      console.error("[useDashboardStats] Error fetching dashboard stats:", err);

      const cached = getCachedStats(effectivePeriodId);
      if (!cached) {
        const errorMessage = err.response?.data?.message ||
          err.message ||
          "Error de conexión con el servidor";
        setError(errorMessage);
      }

      if (!statsRef.current && !cached) {
        const freshCached = getCachedStats(effectivePeriodId);
        if (freshCached) {
          setStats(freshCached);
          statsRef.current = freshCached;
          setIsStale(true);
        }
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => fetchStats(true, false, periodRef.current), 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  useEffect(() => {
    if (stats?.currentPeriod?.periodId && selectedPeriodId === null) {
      setSelectedPeriodId(stats.currentPeriod.periodId);
    }
  }, [stats, selectedPeriodId]);

  const handlePeriodChange = useCallback((periodId: number | null) => {
    setSelectedPeriodId(periodId);
    fetchStats(false, true, periodId);
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats,
    isStale,
    selectedPeriodId,
    setSelectedPeriodId,
    handlePeriodChange,
    availablePeriods: stats?.availablePeriods ?? [],
  };
};
