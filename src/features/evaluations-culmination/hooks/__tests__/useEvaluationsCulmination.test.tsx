/**
 * @file useEvaluationsCulmination.test.tsx
 * @description Tests para el hook useEvaluationsCulmination.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import React from 'react';
import { useEvaluationsCulmination } from '../useEvaluationsCulmination';
import type { PracticeWithEvaluations, EvaluationStatus, CulminationStatus, PracticeResult } from '../../types';

// --- Mocks ---

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: {
    loading: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    dismiss: vi.fn(),
  },
}));

// Mock useToast context
const mockAddToast = vi.fn();
vi.mock('@/context/toast', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

// Mock TOAST config
vi.mock('@/components/ui/dialog/DialogConfig', () => ({
  TOAST: {
    loadError: () => ({ title: 'Error', variant: 'error' }),
    updated: (name: string) => ({ title: `${name} actualizado`, variant: 'success' }),
    updateError: (name: string) => ({ title: `Error al actualizar ${name}`, variant: 'error' }),
    created: (name: string) => ({ title: `${name} creado`, variant: 'success' }),
    createError: (name: string) => ({ title: `Error al crear ${name}`, variant: 'error' }),
  },
}));

// Mock evaluationsCulminationService
vi.mock('../../services/evaluationsCulminationService', () => ({
  evaluationsCulminationService: {
    getPractices: vi.fn().mockResolvedValue({
      success: true,
      data: [],
      meta: { total: 0, periods: [], careers: [], practiceTypes: [] },
    }),
    getCulminationGroups: vi.fn().mockResolvedValue({
      success: true,
      data: [],
      meta: { total: 0, periods: [], careers: [] },
    }),
    getPracticeById: vi.fn().mockResolvedValue(null),
    getEvaluationStats: vi.fn().mockResolvedValue({
      total: 0, completed: 0, partial: 0, pending: 0, approved: 0, failed: 0,
    }),
    getCulminationStats: vi.fn().mockResolvedValue({
      total: 0, pending: 0, approved: 0, certified: 0,
    }),
    approveCulmination: vi.fn().mockResolvedValue({ success: true }),
    generateCertificate: vi.fn().mockResolvedValue({
      success: true,
      certificate: { number: 'CERT-001' },
    }),
    getCertificate: vi.fn().mockResolvedValue({
      success: true,
      certificate: { number: 'CERT-001' },
    }),
    closeActasPreview: vi.fn().mockResolvedValue({
      success: true,
      practices: [],
      totalHours: 0,
    }),
    closeActas: vi.fn().mockResolvedValue({
      success: true,
      closedCount: 0,
      frozenCount: 0,
      autoPreEnrollResults: [],
    }),
  },
}));

// Mock evaluationService
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

// Mock enrollmentService
vi.mock('../../../enrollment/services/enrollmentService', () => ({
  withdrawPractice: vi.fn().mockResolvedValue(undefined),
  reclassifyWithdrawal: vi.fn().mockResolvedValue(undefined),
}));

// Mock useAuth — path relative to THIS test file (hooks/__tests__/)
vi.mock('../../../../context/auth', () => ({
  useAuth: () => ({
    user: { role: 1, name: 'Admin Test' },
  }),
}));

// Mock matchSearch
vi.mock('../../../../utils/searchNormalizer', () => ({
  matchSearch: (text: string, term: string) =>
    text.toLowerCase().includes(term.toLowerCase()),
}));

// Mock generateCertificatePDF
vi.mock('../../../../components/ui/pdf/templates/CertificatePDF', () => ({
  generateCertificatePDF: vi.fn().mockResolvedValue(new Blob()),
}));

// Wrapper with MemoryRouter
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe('useEvaluationsCulmination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', async () => {
    const { result } = renderHook(() => useEvaluationsCulmination(), { wrapper });

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.practices).toEqual([]);
    expect(result.current.searchTerm).toBe('');
    expect(result.current.currentPage).toBe(1);
    expect(result.current.itemsPerPage).toBe(10);
    expect(result.current.filters).toEqual({});
  });

  it('should have all admin actions defined', async () => {
    const { result } = renderHook(() => useEvaluationsCulmination(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Admin actions
    expect(typeof result.current.handleApprove).toBe('function');
    expect(typeof result.current.handleGenerateCertificate).toBe('function');
    expect(typeof result.current.handleDownloadPdf).toBe('function');
    expect(typeof result.current.handleWithdraw).toBe('function');
    expect(typeof result.current.handleConfirmWithdraw).toBe('function');
    expect(typeof result.current.handleReclassifyWithdrawal).toBe('function');
    expect(typeof result.current.handleUnfreeze).toBe('function');
    expect(typeof result.current.handleGrantExtension).toBe('function');
    expect(typeof result.current.handleConfirmExtension).toBe('function');
    expect(typeof result.current.handleRevokeExtension).toBe('function');
    expect(typeof result.current.handleBulkExtension).toBe('function');
    expect(typeof result.current.handleConfirmBulkExtension).toBe('function');
    expect(typeof result.current.handleFreezeAll).toBe('function');
    expect(typeof result.current.handleOpenCommittee).toBe('function');
    expect(typeof result.current.handleExportExcel).toBe('function');
    expect(typeof result.current.handleViewAudit).toBe('function');
  });

  it('should have tabs configured via meta', async () => {
    const { result } = renderHook(() => useEvaluationsCulmination(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Meta should have structure for tabs
    expect(result.current.meta).toHaveProperty('total');
    expect(result.current.meta).toHaveProperty('periods');
    expect(result.current.meta).toHaveProperty('careers');
    expect(result.current.meta).toHaveProperty('practiceTypes');
    expect(Array.isArray(result.current.meta.periods)).toBe(true);
    expect(Array.isArray(result.current.meta.careers)).toBe(true);
    expect(Array.isArray(result.current.meta.practiceTypes)).toBe(true);
  });

  it('should filter practices by search term', async () => {
    const mockPractices: PracticeWithEvaluations[] = [
      {
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
        certificateNumber: 'CERT-001',
        certifiedAt: '2026-07-01',
      },
      {
        practiceId: 2,
        studentName: 'Maria Lopez',
        studentCi: '87654321',
        institutionName: 'Clinica Santa Maria',
        evaluationStatus: 'pending' as EvaluationStatus,
        culminationStatus: 'pending' as CulminationStatus,
        result: 'pending' as PracticeResult,
        careerName: 'Enfermeria',
        careerId: 2,
        minimumGrade: 10,
        institutionId: 2,
        periodId: 1,
        periodName: '1-2026',
        practiceTypeId: 1,
        practiceTypeName: 'Hospitalaria',
        startDate: '2026-01-01',
        endDate: '2026-06-30',
        totalHours: 480,
        evaluations: {
          INSTITUCIONAL: { completed: false, score: 0, evaluatorName: '' },
          ACADEMICO: { completed: false, score: 0, evaluatorName: '' },
          COMITE: { completed: false, score: 0, evaluatorName: '' },
        },
        finalGrade: null,
      },
    ];

    // Mock getPractices to always return test data (including re-fetches on search change)
    const { evaluationsCulminationService } = await import('../../services/evaluationsCulminationService');
    vi.mocked(evaluationsCulminationService.getPractices).mockResolvedValue({
      success: true,
      data: mockPractices,
      meta: { total: 2, periods: [], careers: [], practiceTypes: [] },
    });

    const { result } = renderHook(() => useEvaluationsCulmination(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // All practices should be present initially
    expect(result.current.filteredPractices).toHaveLength(2);

    // Set search term to filter by name
    act(() => {
      result.current.setSearchTerm('Juan');
    });

    await waitFor(() => {
      expect(result.current.filteredPractices).toHaveLength(1);
      expect(result.current.filteredPractices[0].studentName).toBe('Juan Perez');
    });

    // Search by CI
    act(() => {
      result.current.setSearchTerm('8765');
    });

    await waitFor(() => {
      expect(result.current.filteredPractices).toHaveLength(1);
      expect(result.current.filteredPractices[0].studentCi).toBe('87654321');
    });

    // Search by institution
    act(() => {
      result.current.setSearchTerm('Clinica');
    });

    await waitFor(() => {
      expect(result.current.filteredPractices).toHaveLength(1);
      expect(result.current.filteredPractices[0].institutionName).toBe('Clinica Santa Maria');
    });
  });

  it('should compute evaluation and culmination stats', async () => {
    const mockPractices: PracticeWithEvaluations[] = [
      {
        practiceId: 1,
        studentName: 'Juan Perez',
        studentCi: '12345678',
        institutionName: 'Hospital Central',
        evaluationStatus: 'completed' as EvaluationStatus,
        result: 'approved' as PracticeResult,
        culminationStatus: 'certified' as CulminationStatus,
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
      },
      {
        practiceId: 2,
        studentName: 'Maria Lopez',
        studentCi: '87654321',
        institutionName: 'Clinica Santa Maria',
        evaluationStatus: 'partial' as EvaluationStatus,
        result: 'pending' as PracticeResult,
        culminationStatus: 'approved' as CulminationStatus,
        careerName: 'Enfermeria',
        careerId: 2,
        minimumGrade: 10,
        institutionId: 2,
        periodId: 1,
        periodName: '1-2026',
        practiceTypeId: 1,
        practiceTypeName: 'Hospitalaria',
        startDate: '2026-01-01',
        endDate: '2026-06-30',
        totalHours: 480,
        evaluations: {
          INSTITUCIONAL: { completed: true, score: 15, evaluatorName: 'Dr. Garcia' },
          ACADEMICO: { completed: false, score: 0, evaluatorName: '' },
          COMITE: { completed: false, score: 0, evaluatorName: '' },
        },
        finalGrade: null,
      },
      {
        practiceId: 3,
        studentName: 'Pedro Martinez',
        studentCi: '11223344',
        institutionName: 'Hospital Universitario',
        evaluationStatus: 'pending' as EvaluationStatus,
        result: 'failed' as PracticeResult,
        culminationStatus: 'pending' as CulminationStatus,
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
          INSTITUCIONAL: { completed: false, score: 0, evaluatorName: '' },
          ACADEMICO: { completed: false, score: 0, evaluatorName: '' },
          COMITE: { completed: false, score: 0, evaluatorName: '' },
        },
        finalGrade: null,
      },
    ];

    const { evaluationsCulminationService } = await import('../../services/evaluationsCulminationService');
    vi.mocked(evaluationsCulminationService.getPractices).mockResolvedValueOnce({
      success: true,
      data: mockPractices,
      meta: { total: 3, periods: [], careers: [], practiceTypes: [] },
    });

    const { result } = renderHook(() => useEvaluationsCulmination(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.evaluationStats).toEqual({
      total: 3,
      completed: 1,
      partial: 1,
      pending: 1,
      approved: 1,
      failed: 1,
    });

    expect(result.current.culminationStats).toEqual({
      total: 3,
      pending: 1,
      approved: 1,
      certified: 1,
    });
  });

  it('should update filters and reset page', async () => {
    const { result } = renderHook(() => useEvaluationsCulmination(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setCurrentPage(3);
    });

    expect(result.current.currentPage).toBe(3);

    act(() => {
      result.current.updateFilter('periodId', '5');
    });

    expect(result.current.currentPage).toBe(1);
    expect(result.current.filters.periodId).toBe('5');
  });

  it('should clear all filters', async () => {
    const { result } = renderHook(() => useEvaluationsCulmination(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setSearchTerm('test');
      result.current.updateFilter('periodId', '5');
    });

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.filters).toEqual({});
    expect(result.current.searchTerm).toBe('');
    expect(result.current.currentPage).toBe(1);
  });

  it('should show isReadOnly based on user role', async () => {
    const { result } = renderHook(() => useEvaluationsCulmination(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Role 1 = admin, so isReadOnly should be false
    expect(result.current.isReadOnly).toBe(false);
  });

  it('should open withdraw dialog', async () => {
    const { result } = renderHook(() => useEvaluationsCulmination(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.handleWithdraw(1, 'Juan Perez');
    });

    expect(result.current.withdrawDialogOpen).toBe(true);
    expect(result.current.withdrawTarget).toEqual({ practiceId: 1, studentName: 'Juan Perez' });
  });

  it('should open extension dialog', async () => {
    const { result } = renderHook(() => useEvaluationsCulmination(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.handleGrantExtension(1, 'Juan Perez');
    });

    expect(result.current.extensionDialogOpen).toBe(true);
    expect(result.current.extensionTarget).toEqual({ practiceId: 1, studentName: 'Juan Perez' });
  });

  it('should open bulk extension modal', async () => {
    const { result } = renderHook(() => useEvaluationsCulmination(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.handleBulkExtension();
    });

    expect(result.current.bulkExtensionOpen).toBe(true);
    expect(result.current.bulkExtensionSelectedIds).toEqual([]);
    expect(result.current.bulkExtensionReason).toBe('');
  });
});
