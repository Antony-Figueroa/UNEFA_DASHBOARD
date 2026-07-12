/**
 * @file useCulminationFilters.test.ts
 * @description Tests for useCulminationFilters — pure state management hook
 * for culmination tab filter state.
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCulminationFilters } from '../useCulminationFilters';

describe('useCulminationFilters', () => {
  it('returns default values (all undefined/empty)', () => {
    const { result } = renderHook(() => useCulminationFilters());

    expect(result.current.periodId).toBeUndefined();
    expect(result.current.search).toBe('');
    expect(result.current.careerId).toBeUndefined();
    expect(result.current.phaseFilter).toBe('all');
  });

  it('setPeriodId updates state', () => {
    const { result } = renderHook(() => useCulminationFilters());

    act(() => {
      result.current.setPeriodId(5);
    });

    expect(result.current.periodId).toBe(5);
  });

  it('setPeriodId with undefined clears the period filter', () => {
    const { result } = renderHook(() => useCulminationFilters());

    act(() => {
      result.current.setPeriodId(5);
    });
    expect(result.current.periodId).toBe(5);

    act(() => {
      result.current.setPeriodId(undefined);
    });
    expect(result.current.periodId).toBeUndefined();
  });

  it('setSearch updates state', () => {
    const { result } = renderHook(() => useCulminationFilters());

    act(() => {
      result.current.setSearch('Maria');
    });

    expect(result.current.search).toBe('Maria');
  });

  it('setSearch with empty string clears search', () => {
    const { result } = renderHook(() => useCulminationFilters());

    act(() => {
      result.current.setSearch('test');
    });
    act(() => {
      result.current.setSearch('');
    });

    expect(result.current.search).toBe('');
  });

  it('setCareerId updates state', () => {
    const { result } = renderHook(() => useCulminationFilters());

    act(() => {
      result.current.setCareerId(3);
    });

    expect(result.current.careerId).toBe(3);
  });

  it('setCareerId with undefined clears the career filter', () => {
    const { result } = renderHook(() => useCulminationFilters());

    act(() => {
      result.current.setCareerId(3);
    });
    act(() => {
      result.current.setCareerId(undefined);
    });

    expect(result.current.careerId).toBeUndefined();
  });

  it('setPhaseFilter updates state', () => {
    const { result } = renderHook(() => useCulminationFilters());

    act(() => {
      result.current.setPhaseFilter('hospitalaria');
    });

    expect(result.current.phaseFilter).toBe('hospitalaria');
  });

  it('setPhaseFilter can switch between all phase types', () => {
    const { result } = renderHook(() => useCulminationFilters());

    act(() => { result.current.setPhaseFilter('hospitalaria'); });
    expect(result.current.phaseFilter).toBe('hospitalaria');

    act(() => { result.current.setPhaseFilter('comunitaria'); });
    expect(result.current.phaseFilter).toBe('comunitaria');

    act(() => { result.current.setPhaseFilter('all'); });
    expect(result.current.phaseFilter).toBe('all');
  });

  it('resetFilters clears all to defaults after setting values', () => {
    const { result } = renderHook(() => useCulminationFilters());

    act(() => {
      result.current.setPeriodId(5);
      result.current.setSearch('Maria');
      result.current.setCareerId(3);
      result.current.setPhaseFilter('hospitalaria');
    });

    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.periodId).toBeUndefined();
    expect(result.current.search).toBe('');
    expect(result.current.careerId).toBeUndefined();
    expect(result.current.phaseFilter).toBe('all');
  });
});
