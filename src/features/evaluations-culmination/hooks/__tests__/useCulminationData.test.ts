/**
 * @file useCulminationData.test.ts
 * @description Tests for useCulminationData — data fetching hook
 * for the grouped culmination view.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { useCulminationData } from '../useCulminationData';
import type { StudentCulminationRowData } from '../../types';

// --- Mocks ---

const { mockGetCulminationGroups } = vi.hoisted(() => ({
  mockGetCulminationGroups: vi.fn(),
}));

vi.mock('../../services/evaluationsCulminationService', () => ({
  evaluationsCulminationService: {
    getCulminationGroups: mockGetCulminationGroups,
  },
}));

const mockGroups: StudentCulminationRowData[] = [
  {
    studentCi: 'V-12345678',
    studentName: 'María Pérez',
    careerName: 'Enfermería',
    periodId: 1,
    periodName: '2025-I',
    phases: [
      {
        practiceId: 1,
        practiceTypeId: 1,
        practiceTypeName: 'PASANTIA',
        priority: 1,
        status: 'approved',
        statusLabel: 'Aprobado',
        grade: 18,
        isFrozen: false,
        evaluationStatus: 'completed',
        institutionName: 'Hospital Central',
        hoursCompleted: 400,
      },
    ],
    finalStatus: 'approved',
    finalStatusLabel: 'Aprobado',
    canCertify: true,
    certificateNumber: null,
    certifiedAt: null,
    totalPractices: 1,
    completedPractices: 1,
  },
];

const defaultResponse = {
  groups: mockGroups,
  stats: { total: 1, pending: 0, approved: 1, certified: 0 },
  meta: { total: 1, completed: 1, inProgress: 0 },
};

describe('useCulminationData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCulminationGroups.mockResolvedValue(defaultResponse);
  });

  it('returns empty groups and loading=true initially', () => {
    // Don't resolve mock so we can inspect loading state during fetch
    mockGetCulminationGroups.mockImplementationOnce(() => new Promise(() => {}));

    const { result } = renderHook(() => useCulminationData({}));

    expect(result.current.groups).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('populates groups after successful fetch', async () => {
    const { result } = renderHook(() => useCulminationData({}));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.groups).toHaveLength(1);
    expect(result.current.groups[0].studentName).toBe('María Pérez');
    expect(result.current.groups[0].studentCi).toBe('V-12345678');
    expect(result.current.error).toBeNull();
  });

  it('returns stats and meta after successful fetch', async () => {
    const { result } = renderHook(() => useCulminationData({}));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toEqual({ total: 1, pending: 0, approved: 1, certified: 0 });
    expect(result.current.meta).toEqual({ total: 1, completed: 1, inProgress: 0, failed: 0 });
  });

  it('sets error on fetch failure', async () => {
    mockGetCulminationGroups.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useCulminationData({}));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.groups).toEqual([]);
    expect(result.current.error).toBe('Error al cargar datos de culminación');
  });

  it('refetch triggers re-fetch and returns updated data', async () => {
    const { result } = renderHook(() => useCulminationData({}));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.groups).toHaveLength(1);

    // Now change the mock and call refetch
    const updatedGroups: StudentCulminationRowData[] = [
      { ...mockGroups[0], studentName: 'María Pérez Updated' },
    ];
    mockGetCulminationGroups.mockResolvedValueOnce({
      ...defaultResponse,
      groups: updatedGroups,
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.groups).toHaveLength(1);
    expect(result.current.groups[0].studentName).toBe('María Pérez Updated');
  });

  it('calls service with provided filters', async () => {
    renderHook(() => useCulminationData({ periodId: 5, search: 'Maria', careerId: 3 }));

    await waitFor(() => {
      expect(mockGetCulminationGroups).toHaveBeenCalledWith({
        periodId: 5,
        search: 'Maria',
        careerId: 3,
      });
    });
  });

  it('handles empty response gracefully', async () => {
    mockGetCulminationGroups.mockResolvedValueOnce({
      groups: [],
      stats: { total: 0, pending: 0, approved: 0, certified: 0 },
      meta: { total: 0, completed: 0, inProgress: 0 },
    });

    const { result } = renderHook(() => useCulminationData({}));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.groups).toEqual([]);
    expect(result.current.stats.total).toBe(0);
    expect(result.current.error).toBeNull();
  });
});
