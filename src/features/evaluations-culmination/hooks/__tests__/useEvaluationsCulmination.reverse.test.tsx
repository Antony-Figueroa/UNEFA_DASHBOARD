/**
 * @file useEvaluationsCulmination.reverse.test.tsx
 * @description Slice B tests: handleReverseFailed (reverse-failed) + failed-only derivation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import React from 'react';
import { useEvaluationsCulmination } from '../useEvaluationsCulmination';
import type { PracticeWithEvaluations, EvaluationStatus, CulminationStatus, PracticeResult } from '../../types';

vi.mock('react-hot-toast', () => ({
  default: { loading: vi.fn(), success: vi.fn(), error: vi.fn(), dismiss: vi.fn() },
}));

const mockAddToast = vi.fn();
vi.mock('@/context/toast', () => ({ useToast: () => ({ addToast: mockAddToast }) }));

vi.mock('@/components/ui/dialog/DialogConfig', () => ({
  TOAST: {
    loadError: () => ({ title: 'Error', variant: 'error' }),
    updated: (name: string) => ({ title: `${name} actualizado`, variant: 'success' }),
    updateError: (name: string) => ({ title: `Error al actualizar ${name}`, variant: 'error' }),
    created: (name: string) => ({ title: `${name} creado`, variant: 'success' }),
    createError: (name: string) => ({ title: `Error al crear ${name}`, variant: 'error' }),
  },
}));

const { mockReverseFailed } = vi.hoisted(() => ({
  mockReverseFailed: vi.fn().mockResolvedValue({ success: true }),
}));
vi.mock('../../services/evaluationsCulminationService', () => ({
  evaluationsCulminationService: {
    getPractices: vi.fn().mockResolvedValue({
      success: true,
      data: [],
      meta: { total: 0, periods: [], careers: [], practiceTypes: [] },
    }),
    approveCulmination: vi.fn().mockResolvedValue({ success: true }),
    generateCertificate: vi.fn().mockResolvedValue({ success: true, certificate: { number: 'CERT-001' } }),
    reverseFailed: mockReverseFailed,
  },
}));

vi.mock('../../../evaluations/services/evaluationService', () => ({
  evaluationService: {
    markFailed: vi.fn().mockResolvedValue(undefined),
    unfreezePractice: vi.fn().mockResolvedValue(undefined),
    grantExtension: vi.fn().mockResolvedValue(undefined),
    revokeExtension: vi.fn().mockResolvedValue(undefined),
    bulkGrantExtension: vi.fn().mockResolvedValue({ grantedCount: 2 }),
    freezeBatch: vi.fn().mockResolvedValue({ frozenCount: 3 }),
    exportEvaluationsExcel: vi.fn().mockResolvedValue(new Blob()),
    getAuditHistory: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../../enrollment/services/enrollmentService', () => ({
  withdrawPractice: vi.fn().mockResolvedValue(undefined),
  reclassifyWithdrawal: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../../context/auth', () => ({
  useAuth: () => ({ user: { role: 1, name: 'Admin Test' } }),
}));

vi.mock('../../../../utils/searchNormalizer', () => ({
  matchSearch: (text: string, term: string) => text.toLowerCase().includes(term.toLowerCase()),
}));

vi.mock('../../../../components/ui/pdf/templates/CertificatePDF', () => ({
  generateCertificatePDF: vi.fn().mockResolvedValue(new Blob()),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

const buildPractice = (over: Partial<PracticeWithEvaluations>): PracticeWithEvaluations => ({
  practiceId: 1,
  studentName: 'Juan Perez',
  studentCi: '12345678',
  institutionName: 'Hospital Central',
  evaluationStatus: 'completed' as EvaluationStatus,
  culminationStatus: 'approved' as CulminationStatus,
  result: 'approved' as PracticeResult,
  careerName: 'Medicina',
  careerId: 1,
  minimumGrade: 10,
  institutionId: 1,
  periodId: 1,
  periodName: '1-2026',
  practiceTypeId: 1,
  practiceTypeName: 'Hospitalaria',
  startDate: '2026-01-01',
  endDate: '2026-06-30',
  totalHours: 480,
  evaluations: {
    INSTITUCIONAL: { completed: true, score: 18, evaluatorName: 'Dr. Smith' },
    ACADEMICO: { completed: true, score: 16, evaluatorName: 'Prof. Garcia' },
    COMITE: { completed: true, score: 17, evaluatorName: 'Comite' },
  },
  finalGrade: 17,
  ...over,
});

describe('useEvaluationsCulmination — reverse-failed + failed filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReverseFailed.mockResolvedValue({ success: true });
  });

  it('derives failed-only set via filteredPractices when result filter = failed', async () => {
    const mockPractices: PracticeWithEvaluations[] = [
      buildPractice({ practiceId: 1, result: 'approved' }),
      buildPractice({ practiceId: 2, result: 'failed', practicesStatus: 'REPROBADO' }),
      buildPractice({ practiceId: 3, result: 'failed', practicesStatus: 'INSCRITO' }),
      buildPractice({ practiceId: 4, result: 'pending' }),
    ];

    const { evaluationsCulminationService } = await import('../../services/evaluationsCulminationService');
    vi.mocked(evaluationsCulminationService.getPractices).mockResolvedValue({
      success: true,
      data: mockPractices,
      meta: { total: 4, periods: [], careers: [], practiceTypes: [] },
    });

    const { result } = renderHook(() => useEvaluationsCulmination(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.updateFilter('result', 'failed');
    });

    await waitFor(() => {
      const failed = result.current.filteredPractices.filter(p => p.result === 'failed');
      expect(failed).toHaveLength(2);
      expect(failed.map(p => p.practiceId).sort()).toEqual([2, 3]);
    });
  });

  it('handleReverseFailed opens reverse dialog with target', async () => {
    const { result } = renderHook(() => useEvaluationsCulmination(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.handleReverseFailed(7, 'Maria Lopez');
    });

    expect(result.current.reverseDialogOpen).toBe(true);
    expect(result.current.reverseTarget).toEqual({ practiceId: 7, studentName: 'Maria Lopez' });
  });

  it('handleReverseFailed confirm calls service reverseFailed then refreshes', async () => {
    const { evaluationsCulminationService } = await import('../../services/evaluationsCulminationService');
    const { result } = renderHook(() => useEvaluationsCulmination(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Capture the getPractices call count BEFORE the reverse to assert refresh.
    const beforeSpy = vi.mocked(evaluationsCulminationService.getPractices).mock.calls.length;

    act(() => {
      result.current.handleReverseFailed(7, 'Maria Lopez');
    });

    expect(result.current.reverseDialogOpen).toBe(true);

    // Set reason + resolution number, let state settle
    act(() => {
      result.current.setReverseReason('Error administrativo al evaluar');
      result.current.setReverseResolutionNumber('RES-2026-010');
    });

    await waitFor(() => {
      expect(result.current.reverseReason).toBe('Error administrativo al evaluar');
      expect(result.current.reverseResolutionNumber).toBe('RES-2026-010');
    });

    // Confirm the reverse
    act(() => {
      result.current.handleConfirmReverseFailed();
    });

    await waitFor(() => {
      expect(mockReverseFailed).toHaveBeenCalledWith(
        7,
        'Error administrativo al evaluar',
        'RES-2026-010'
      );
    });

    // Refresh: getPractices must be called again after the reverse
    await waitFor(() => {
      expect(vi.mocked(evaluationsCulminationService.getPractices).mock.calls.length).toBeGreaterThan(beforeSpy);
    });

    // Dialog closed after confirm
    await waitFor(() => {
      expect(result.current.reverseDialogOpen).toBe(false);
      expect(result.current.reverseTarget).toBeNull();
    });
  });
});
