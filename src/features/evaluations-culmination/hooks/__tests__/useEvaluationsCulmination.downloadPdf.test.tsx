/**
 * @file useEvaluationsCulmination.downloadPdf.test.tsx
 * @description Tests for handleDownloadPdf enriched data flow.
 * Verifies reportsService.getDocumentData is called and
 * generateCertificatePDF receives enriched data.
 * Written FIRST (TDD).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import React from 'react';
import { useEvaluationsCulmination } from '../useEvaluationsCulmination';
import type { PracticeWithEvaluations } from '../../types';

// --- Mocks ---

vi.mock('react-hot-toast', () => ({
  default: {
    loading: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    dismiss: vi.fn(),
  },
}));

const mockAddToast = vi.fn();
vi.mock('@/context/toast', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

vi.mock('@/components/ui/dialog/DialogConfig', () => ({
  TOAST: {
    loadError: () => ({ title: 'Error', variant: 'error' }),
    updated: (name: string) => ({ title: `${name} actualizado`, variant: 'success' }),
    updateError: (name: string) => ({ title: `Error al actualizar ${name}`, variant: 'error' }),
    created: (name: string) => ({ title: `${name} creado`, variant: 'success' }),
    createError: (name: string) => ({ title: `Error al crear ${name}`, variant: 'error' }),
  },
}));

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
    approveCulmination: vi.fn().mockResolvedValue({ success: true }),
    generateCertificate: vi.fn().mockResolvedValue({
      success: true,
      certificate: { number: 'CERT-001' },
    }),
    closeActasPreview: vi.fn().mockResolvedValue({
      success: true, practices: [], totalHours: 0,
    }),
    closeActas: vi.fn().mockResolvedValue({
      success: true, closedCount: 0, frozenCount: 0, autoPreEnrollResults: [],
    }),
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
  matchSearch: (text: string, term: string) =>
    text.toLowerCase().includes(term.toLowerCase()),
}));

// Mock reportsService
const mockGetDocumentData = vi.fn();
vi.mock('../../../reports/services/reportsService', () => ({
  reportsService: {
    getDocumentData: (...args: any[]) => mockGetDocumentData(...args),
  },
}));

// Mock generateCertificatePDF
const mockGenerateCertificatePDF = vi.fn().mockResolvedValue(new Blob(['pdf-content'], { type: 'application/pdf' }));
vi.mock('../../../../components/ui/pdf/templates/CertificatePDF', () => ({
  generateCertificatePDF: (...args: any[]) => mockGenerateCertificatePDF(...args),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

const mockPractice: PracticeWithEvaluations = {
  practiceId: 100,
  studentCi: '12345678',
  studentName: 'Juan Pérez',
  careerId: 1,
  careerName: 'Ing. Enfermería',
  minimumGrade: 10,
  institutionId: 1,
  institutionName: 'Hospital Central',
  periodId: 1,
  periodName: '2024-2',
  practiceTypeId: 1,
  practiceTypeName: 'Hospitalaria',
  startDate: '2024-02-01',
  endDate: '2024-05-30',
  totalHours: 360,
  evaluationStatus: 'completed',
  evaluations: {
    INSTITUCIONAL: { completed: true, score: 18, evaluatorName: 'Dr. López' },
    ACADEMICO: { completed: true, score: 15, evaluatorName: 'Ing. Ruiz' },
    COMITE: { completed: true, score: 16, evaluatorName: 'Comité' },
  },
  finalGrade: 16.5,
  culminationStatus: 'certified',
  result: 'approved',
  certificateNumber: 'CERT-001',
};

describe('handleDownloadPdf — enriched data flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: successful endpoint response
    mockGetDocumentData.mockResolvedValue({
      practiceId: 100,
      estudiante: {
        ci: 'V-12.345.678',
        primerNombre: 'Juan',
        segundoNombre: 'Carlos',
        primerApellido: 'Pérez',
        segundoApellido: 'Gómez',
      },
      carrera: { nombre: 'Ing. Enfermería' },
      institucion: { nombre: 'Hospital Central' },
      periodo: { description: '2024-2', startDate: '2024-01-15', endDate: '2024-06-30' },
      practica: { startDate: '2024-02-01', endDate: '2024-05-30', grade: 16 },
      evaluacionFinal: {
        weights: { institucional: 0.4, academico: 0.3, comite: 0.3 },
        parciales: { institucional: 18, academico: 15, comite: 16 },
        notaFinal: 16.5,
      },
      textos: {
        firma1Nombre: 'Dr. María López',
        firma1Cargo: 'JEFA DEL EQUIPO DE TRABAJO',
      },
    });
  });

  it('calls reportsService.getDocumentData with evaluacion-consolidada and practiceId', async () => {
    const { result } = renderHook(() => useEvaluationsCulmination(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleDownloadPdf(mockPractice);
    });

    expect(mockGetDocumentData).toHaveBeenCalledWith('evaluacion-consolidada', 100);
  });

  it('passes enriched data and textos to generateCertificatePDF', async () => {
    const { result } = renderHook(() => useEvaluationsCulmination(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleDownloadPdf(mockPractice);
    });

    expect(mockGenerateCertificatePDF).toHaveBeenCalledTimes(1);
    const [dataArg, textosArg] = mockGenerateCertificatePDF.mock.calls[0];
    expect(dataArg).toHaveProperty('evaluacionFinal');
    expect(dataArg).toHaveProperty('estudiante');
    expect(textosArg).toHaveProperty('firma1Nombre');
  });

  it('shows toast error and does NOT generate PDF when evaluacionFinal is null', async () => {
    mockGetDocumentData.mockResolvedValue({
      practiceId: 100,
      estudiante: { ci: '12345678', primerNombre: 'Juan', primerApellido: 'Pérez' },
      carrera: { nombre: 'Ing. Enfermería' },
      institucion: null,
      periodo: null,
      practica: { startDate: '', endDate: '', grade: 0 },
      evaluacionFinal: null,
      textos: {},
    });

    const { result } = renderHook(() => useEvaluationsCulmination(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleDownloadPdf(mockPractice);
    });

    expect(mockGenerateCertificatePDF).not.toHaveBeenCalled();
    // Should show error toast
    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'error' })
    );
  });

  it('shows toast error and does NOT generate PDF when notaFinal is null', async () => {
    mockGetDocumentData.mockResolvedValue({
      practiceId: 100,
      estudiante: { ci: '12345678', primerNombre: 'Juan', primerApellido: 'Pérez' },
      carrera: { nombre: 'Ing. Enfermería' },
      institucion: { nombre: 'Hospital' },
      periodo: null,
      practica: { startDate: '', endDate: '', grade: 0 },
      evaluacionFinal: {
        weights: { institucional: 0.4, academico: 0.3, comite: 0.3 },
        parciales: { institucional: null, academico: null, comite: null },
        notaFinal: null as any,
      },
      textos: {},
    });

    const { result } = renderHook(() => useEvaluationsCulmination(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleDownloadPdf(mockPractice);
    });

    expect(mockGenerateCertificatePDF).not.toHaveBeenCalled();
    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'error' })
    );
  });
});
