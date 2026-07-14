/**
 * @file useEvaluationsCulmination.composition.test.tsx
 * @description Integration test for the refactored parent hook.
 * Verifies that useEvaluationsCulmination composes the 4 sub-hooks
 * and exposes both flat-model and grouped-model data.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import React from 'react';
import { useEvaluationsCulmination } from '../useEvaluationsCulmination';
import type { PracticeWithEvaluations, EvaluationStatus, CulminationStatus, PracticeResult } from '../../types';
import type { StudentCulminationRowData } from '../../types';

// --- Mocks ---

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

const { mockGetPractices, mockGetCulminationGroups, mockGetPracticeById, mockGetEvaluationStats, mockGetCulminationStats, mockApproveCulmination, mockGenerateCertificate, mockGetCertificate, mockCloseActasPreview, mockCloseActas, mockReverseFailed } = vi.hoisted(() => ({
  mockGetPractices: vi.fn(),
  mockGetCulminationGroups: vi.fn(),
  mockGetPracticeById: vi.fn().mockResolvedValue(null),
  mockGetEvaluationStats: vi.fn().mockResolvedValue({
    total: 0, completed: 0, partial: 0, pending: 0, approved: 0, failed: 0,
  }),
  mockGetCulminationStats: vi.fn().mockResolvedValue({
    total: 0, pending: 0, approved: 0, certified: 0,
  }),
  mockApproveCulmination: vi.fn(),
  mockGenerateCertificate: vi.fn(),
  mockGetCertificate: vi.fn().mockResolvedValue({
    success: true,
    certificate: { number: 'CERT-001' },
  }),
  mockCloseActasPreview: vi.fn().mockResolvedValue({
    success: true,
    practices: [],
    totalHours: 0,
  }),
  mockCloseActas: vi.fn().mockResolvedValue({
    success: true,
    closedCount: 0,
    frozenCount: 0,
    autoPreEnrollResults: [],
  }),
  mockReverseFailed: vi.fn(),
}));

vi.mock('../../services/evaluationsCulminationService', () => ({
  evaluationsCulminationService: {
    getPractices: mockGetPractices,
    getCulminationGroups: mockGetCulminationGroups,
    getPracticeById: mockGetPracticeById,
    getEvaluationStats: mockGetEvaluationStats,
    getCulminationStats: mockGetCulminationStats,
    approveCulmination: mockApproveCulmination,
    generateCertificate: mockGenerateCertificate,
    getCertificate: mockGetCertificate,
    closeActasPreview: mockCloseActasPreview,
    closeActas: mockCloseActas,
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

const defaultGroupResponse = {
  groups: mockGroups,
  stats: { total: 1, pending: 0, approved: 1, certified: 0 },
  meta: { total: 1, completed: 1, inProgress: 0 },
};

describe('useEvaluationsCulmination — sub-hook composition (PR 2b)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPractices.mockResolvedValue({
      success: true,
      data: [],
      meta: { total: 0, periods: [], careers: [], practiceTypes: [] },
    });
    mockGetCulminationGroups.mockResolvedValue(defaultGroupResponse);
    mockApproveCulmination.mockResolvedValue({ success: true, message: 'Aprobada' });
    mockGenerateCertificate.mockResolvedValue({ success: true, message: 'Certificado', certificate: { number: 'CERT-001' } });
    mockReverseFailed.mockResolvedValue({ success: true, message: 'Reversión exitosa' });
  });

  // ─── Backward Compatibility (Flat Model) ─────────────────

  it('still exposes flat practices data (backward compat)', async () => {
    const { result } = renderHook(() => useEvaluationsCulmination(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.practices).toEqual([]);
    expect(result.current.filteredPractices).toEqual([]);
    expect(result.current.meta).toHaveProperty('total');
    expect(result.current.meta).toHaveProperty('periods');
    expect(typeof result.current.updateFilter).toBe('function');
    expect(typeof result.current.setSearchTerm).toBe('function');
    expect(typeof result.current.refresh).toBe('function');
  });

  it('still exposes all original admin actions', async () => {
    const { result } = renderHook(() => useEvaluationsCulmination(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(typeof result.current.handleApprove).toBe('function');
    expect(typeof result.current.handleGenerateCertificate).toBe('function');
    expect(typeof result.current.handleDownloadPdf).toBe('function');
    expect(typeof result.current.handleWithdraw).toBe('function');
    expect(typeof result.current.handleConfirmWithdraw).toBe('function');
    expect(typeof result.current.handleUnfreeze).toBe('function');
    expect(typeof result.current.handleGrantExtension).toBe('function');
    expect(typeof result.current.handleBulkExtension).toBe('function');
    expect(typeof result.current.handleFreezeAll).toBe('function');
    expect(typeof result.current.handleOpenCommittee).toBe('function');
    expect(typeof result.current.handleExportExcel).toBe('function');
    expect(typeof result.current.handleViewAudit).toBe('function');
  });

  it('still exposes all original modal/dialog state', async () => {
    const { result } = renderHook(() => useEvaluationsCulmination(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.evalModalOpen).toBe(false);
    expect(result.current.detailModalOpen).toBe(false);
    expect(result.current.studentDetailOpen).toBe(false);
    expect(result.current.withdrawDialogOpen).toBe(false);
    expect(result.current.extensionDialogOpen).toBe(false);
    expect(result.current.bulkExtensionOpen).toBe(false);
    expect(result.current.committeeDialogOpen).toBe(false);
    expect(result.current.isReadOnly).toBe(false);
  });

  // ─── Grouped Culmination Data (useCulminationData) ───────

  it('exposes grouped culmination data from useCulminationData', async () => {
    const { result } = renderHook(() => useEvaluationsCulmination(), { wrapper });

    await waitFor(() => {
      expect(result.current.culminationGroupsLoading).toBe(false);
    });

    expect(result.current.culminationGroups).toHaveLength(1);
    expect(result.current.culminationGroups[0].studentName).toBe('María Pérez');
    expect(result.current.culminationGroupStats).toEqual({
      total: 1, pending: 0, approved: 1, certified: 0,
    });
    expect(result.current.culminationGroupsMeta).toEqual({
      total: 1, completed: 1, inProgress: 0, failed: 0,
    });
    expect(result.current.culminationGroupsError).toBeNull();
  });

  it('exposes refetchCulminationGroups', async () => {
    const { result } = renderHook(() => useEvaluationsCulmination(), { wrapper });

    await waitFor(() => {
      expect(result.current.culminationGroupsLoading).toBe(false);
    });

    expect(typeof result.current.refetchCulminationGroups).toBe('function');

    // Refetch should call the service again
    await act(async () => {
      await result.current.refetchCulminationGroups();
    });

    expect(mockGetCulminationGroups).toHaveBeenCalledTimes(2);
  });

  // ─── Culmination Filters (useCulminationFilters) ─────────

  it('exposes culmination filters from useCulminationFilters', async () => {
    const { result } = renderHook(() => useEvaluationsCulmination(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Defaults
    expect(result.current.culminationPeriodId).toBeUndefined();
    expect(result.current.culminationSearch).toBe('');
    expect(result.current.culminationCareerId).toBeUndefined();
    expect(result.current.culminationPhaseFilter).toBe('all');

    // Setters
    expect(typeof result.current.setCulminationPeriodId).toBe('function');
    expect(typeof result.current.setCulminationSearch).toBe('function');
    expect(typeof result.current.setCulminationCareerId).toBe('function');
    expect(typeof result.current.setCulminationPhaseFilter).toBe('function');
    expect(typeof result.current.resetCulminationFilters).toBe('function');
  });

  it('culmination filters update state independently', async () => {
    const { result } = renderHook(() => useEvaluationsCulmination(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setCulminationPeriodId(5);
      result.current.setCulminationSearch('María');
      result.current.setCulminationCareerId(3);
      result.current.setCulminationPhaseFilter('hospitalaria');
    });

    expect(result.current.culminationPeriodId).toBe(5);
    expect(result.current.culminationSearch).toBe('María');
    expect(result.current.culminationCareerId).toBe(3);
    expect(result.current.culminationPhaseFilter).toBe('hospitalaria');
  });

  it('resetCulminationFilters clears all to defaults', async () => {
    const { result } = renderHook(() => useEvaluationsCulmination(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setCulminationPeriodId(5);
      result.current.setCulminationSearch('test');
    });

    act(() => {
      result.current.resetCulminationFilters();
    });

    expect(result.current.culminationPeriodId).toBeUndefined();
    expect(result.current.culminationSearch).toBe('');
    expect(result.current.culminationCareerId).toBeUndefined();
    expect(result.current.culminationPhaseFilter).toBe('all');
  });

  // ─── Culmination UI (useCulminationUI) ────────────────────

  it('exposes culmination UI state from useCulminationUI', async () => {
    const { result } = renderHook(() => useEvaluationsCulmination(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Defaults
    expect(result.current.culminationExpandedStudentCi).toBeNull();
    expect(result.current.culminationActiveTab).toBe('evaluations');
    expect(result.current.isCulminationModalOpen).toBe(false);
    expect(result.current.culminationModalType).toBeNull();
    expect(result.current.culminationSelectedPracticeId).toBeNull();

    // Functions
    expect(typeof result.current.toggleCulminationRow).toBe('function');
    expect(typeof result.current.setCulminationActiveTab).toBe('function');
    expect(typeof result.current.openCulminationModal).toBe('function');
    expect(typeof result.current.closeCulminationModal).toBe('function');
  });

  it('toggleCulminationRow expands and collapses rows', async () => {
    const { result } = renderHook(() => useEvaluationsCulmination(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => { result.current.toggleCulminationRow('V-12345678'); });
    expect(result.current.culminationExpandedStudentCi).toBe('V-12345678');

    act(() => { result.current.toggleCulminationRow('V-12345678'); });
    expect(result.current.culminationExpandedStudentCi).toBeNull();
  });

  it('setCulminationActiveTab changes tab', async () => {
    const { result } = renderHook(() => useEvaluationsCulmination(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => { result.current.setCulminationActiveTab('culmination'); });
    expect(result.current.culminationActiveTab).toBe('culmination');

    act(() => { result.current.setCulminationActiveTab('certification'); });
    expect(result.current.culminationActiveTab).toBe('certification');
  });

  it('openCulminationModal and closeCulminationModal work', async () => {
    const { result } = renderHook(() => useEvaluationsCulmination(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => { result.current.openCulminationModal('evaluation', 42); });
    expect(result.current.isCulminationModalOpen).toBe(true);
    expect(result.current.culminationModalType).toBe('evaluation');
    expect(result.current.culminationSelectedPracticeId).toBe(42);

    act(() => { result.current.closeCulminationModal(); });
    expect(result.current.isCulminationModalOpen).toBe(false);
    expect(result.current.culminationModalType).toBeNull();
    expect(result.current.culminationSelectedPracticeId).toBeNull();
  });

  // ─── Culmination Actions (useCulminationActions) ──────────

  it('exposes culmination actions from useCulminationActions', async () => {
    const { result } = renderHook(() => useEvaluationsCulmination(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(typeof result.current.approveCulminationGrouped).toBe('function');
    expect(typeof result.current.certifyPracticeGrouped).toBe('function');
    expect(typeof result.current.reverseCulminationGrouped).toBe('function');
    expect(typeof result.current.bulkExtendGrouped).toBe('function');

    // Loading states
    expect(result.current.actionApproving).toBe(false);
    expect(result.current.actionCertifying).toBe(false);
    expect(result.current.actionReversing).toBe(false);
    expect(result.current.actionBulkExtending).toBe(false);
    expect(result.current.actionError).toBeNull();
  });

  it('approveCulminationGrouped calls service and shows loading', async () => {
    const { result } = renderHook(() => useEvaluationsCulmination(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.approveCulminationGrouped(42);
    });

    expect(mockApproveCulmination).toHaveBeenCalledWith(42);
    expect(result.current.actionApproving).toBe(false);
  });

  it('certifyPracticeGrouped calls service', async () => {
    const { result } = renderHook(() => useEvaluationsCulmination(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.certifyPracticeGrouped(42);
    });

    expect(mockGenerateCertificate).toHaveBeenCalledWith(42);
  });

  it('reverseCulminationGrouped calls service with params', async () => {
    const { result } = renderHook(() => useEvaluationsCulmination(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.reverseCulminationGrouped(42, 'reason', 'RES-001');
    });

    expect(mockReverseFailed).toHaveBeenCalledWith(42, 'reason', 'RES-001');
  });

  // ─── Independent State ───────────────────────────────────

  it('flat and grouped filters are independent', async () => {
    const { result } = renderHook(() => useEvaluationsCulmination(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Set flat filter
    act(() => { result.current.updateFilter('periodId', '5'); });
    expect(result.current.filters.periodId).toBe('5');

    // Grouped filter should remain default
    expect(result.current.culminationPeriodId).toBeUndefined();

    // Set grouped filter
    act(() => { result.current.setCulminationPeriodId(10); });
    expect(result.current.culminationPeriodId).toBe(10);

    // Flat filter should still be '5'
    expect(result.current.filters.periodId).toBe('5');
  });

  it('flat and grouped UI state are independent', async () => {
    const { result } = renderHook(() => useEvaluationsCulmination(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    // They use different state, so toggling one should not affect the other
    act(() => { result.current.toggleCulminationRow('V-12345678'); });
    expect(result.current.culminationExpandedStudentCi).toBe('V-12345678');
  });
});
