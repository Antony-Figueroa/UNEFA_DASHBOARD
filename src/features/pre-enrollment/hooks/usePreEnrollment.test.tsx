/**
 * @file usePreEnrollment.test.tsx
 * @description Tests para el hook usePreEnrollment que gestiona la lógica de pre-inscripciones.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePreEnrollment } from '../hooks/usePreEnrollment';

// Mock del contexto de Toast
const mockAddToast = vi.fn();

vi.mock('@/context/toast', () => ({
  useToast: () => ({
    addToast: mockAddToast,
  }),
}));

// Mock del hook useCrud
vi.mock('../../../hooks/useCrud', () => ({
  useCrud: vi.fn(() => ({
    data: [
      {
        preEnrollmentId: '1',
        studentCi: 'V-12345678',
        studentName: 'Juan Pérez',
        identificationNumber: '12345678',
        careerId: '1',
        careerName: 'Ingeniería de Sistemas',
        period: '2024-1',
        practiceType: 'ORDINARIA',
        preEnrollmentDate: '2024-01-15',
        status: true,
      },
    ],
    status: 'success',
    loadingAction: false,
    error: null,
    refresh: vi.fn(),
    createItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    toggleItemStatus: vi.fn(),
  })),
}));

describe('usePreEnrollment Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('debería cargar pre-inscripciones al inicializar', async () => {
    const { result } = renderHook(() => usePreEnrollment());

    await waitFor(() => {
      expect(result.current.preEnrollments).toBeDefined();
    });
  });

  it('debería tener funciones de gestión definidas', () => {
    const { result } = renderHook(() => usePreEnrollment());

    expect(result.current.addPreEnrollment).toBeDefined();
    expect(result.current.editPreEnrollment).toBeDefined();
    expect(result.current.toggleStatus).toBeDefined();
  });

  it('debería soportar toggles masivos', () => {
    const { result } = renderHook(() => usePreEnrollment());

    expect(result.current.bulkToggleStatus).toBeDefined();
  });
});