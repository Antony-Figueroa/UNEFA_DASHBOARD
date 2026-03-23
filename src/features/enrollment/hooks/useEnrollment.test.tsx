/**
 * @file useEnrollment.test.tsx
 * @description Tests para el hook useEnrollment que gestiona la lógica de inscripciones.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useEnrollment } from '../hooks/useEnrollment';

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
        enrollmentId: '1',
        studentCi: 'V-12345678',
        studentName: 'Juan Pérez',
        identificationNumber: '12345678',
        careerId: '1',
        careerName: 'Ingeniería de Sistemas',
        period: '2024-1',
        practiceType: 'ORDINARIA',
        enrollmentDate: '2024-02-01',
        status: true,
        internshipStatus: 'active',
        grade: 0,
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

describe('useEnrollment Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('debería cargar inscripciones al inicializar', async () => {
    const { result } = renderHook(() => useEnrollment());

    await waitFor(() => {
      expect(result.current.enrollments).toBeDefined();
    });
  });

  it('debería tener funciones CRUD definidas', () => {
    const { result } = renderHook(() => useEnrollment());

    expect(result.current.addEnrollment).toBeDefined();
    expect(result.current.editEnrollment).toBeDefined();
    expect(result.current.toggleStatus).toBeDefined();
  });
});