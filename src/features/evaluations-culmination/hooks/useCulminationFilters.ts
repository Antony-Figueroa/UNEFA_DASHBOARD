/**
 * @file useCulminationFilters.ts
 * @description Pure state management hook for culmination tab filter state.
 * Manages period, search, career, and phase-type filters. No API calls.
 */

import { useState, useCallback } from 'react';

export interface UseCulminationFiltersReturn {
  periodId: number | undefined;
  search: string;
  careerId: number | undefined;
  phaseFilter: 'all' | 'hospitalaria' | 'comunitaria';
  setPeriodId: (id: number | undefined) => void;
  setSearch: (search: string) => void;
  setCareerId: (id: number | undefined) => void;
  setPhaseFilter: (filter: 'all' | 'hospitalaria' | 'comunitaria') => void;
  resetFilters: () => void;
}

/**
 * Hook that manages filter state for the culmination tab.
 * Pure state management — no API calls.
 */
export const useCulminationFilters = (): UseCulminationFiltersReturn => {
  const [periodId, setPeriodId] = useState<number | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [careerId, setCareerId] = useState<number | undefined>(undefined);
  const [phaseFilter, setPhaseFilter] = useState<'all' | 'hospitalaria' | 'comunitaria'>('all');

  const resetFilters = useCallback(() => {
    setPeriodId(undefined);
    setSearch('');
    setCareerId(undefined);
    setPhaseFilter('all');
  }, []);

  return {
    periodId,
    search,
    careerId,
    phaseFilter,
    setPeriodId,
    setSearch,
    setCareerId,
    setPhaseFilter,
    resetFilters,
  };
};

export default useCulminationFilters;
