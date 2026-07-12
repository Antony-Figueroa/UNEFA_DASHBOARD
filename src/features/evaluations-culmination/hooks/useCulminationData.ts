/**
 * @file useCulminationData.ts
 * @description Data fetching hook for the grouped culmination view.
 * Fetches from /api/culmination, manages loading/error state,
 * and exposes refetch for manual refresh.
 */

import { useState, useEffect, useCallback } from 'react';
import { evaluationsCulminationService } from '../services/evaluationsCulminationService';
import type { StudentCulminationRowData, CulminationStats } from '../types';

export interface UseCulminationDataFilters {
  periodId?: number;
  search?: string;
  careerId?: number;
}

export interface UseCulminationDataReturn {
  groups: StudentCulminationRowData[];
  loading: boolean;
  error: string | null;
  stats: CulminationStats;
  meta: { total: number; completed: number; inProgress: number; };
  refetch: () => Promise<void>;
}

const defaultStats: CulminationStats = { total: 0, pending: 0, approved: 0, certified: 0 };
const defaultMeta = { total: 0, completed: 0, inProgress: 0 };

/**
 * Hook that manages data fetching for the grouped culmination view.
 * Calls evaluationsCulminationService.getCulminationGroups with filters.
 */
export const useCulminationData = (
  filters: UseCulminationDataFilters
): UseCulminationDataReturn => {
  const [groups, setGroups] = useState<StudentCulminationRowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<CulminationStats>(defaultStats);
  const [meta, setMeta] = useState(defaultMeta);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await evaluationsCulminationService.getCulminationGroups(filters);
      setGroups(response.groups ?? []);
      setStats(response.stats ?? defaultStats);
      setMeta(response.meta ?? defaultMeta);
    } catch (err) {
      console.error('[useCulminationData] Error fetching culmination groups:', err);
      setError('Error al cargar datos de culminación');
      setGroups([]);
      setStats(defaultStats);
      setMeta(defaultMeta);
    } finally {
      setLoading(false);
    }
  }, [filters.periodId, filters.search, filters.careerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    groups,
    loading,
    error,
    stats,
    meta,
    refetch: fetchData,
  };
};

export default useCulminationData;
