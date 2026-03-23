/**
 * @file useTutors.test.tsx
 * @description Tests para el hook useTutors que gestiona la lógica de negocio de tutores.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTutors } from '../hooks/useTutors';

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
        tutorId: '1',
        firstName: 'Dr. Carlos',
        lastName: 'Martínez',
        identificationNumber: '12345678',
        email: 'carlos.martinez@unefa.edu.ve',
        status: true,
        practiceTypes: ['ORDINARIA'],
        isInUse: true,
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

describe('useTutors Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('debería cargar tutores al inicializar', async () => {
    const { result } = renderHook(() => useTutors());

    await waitFor(() => {
      expect(result.current.tutors).toBeDefined();
      expect(result.current.tutors.length).toBeGreaterThan(0);
    });
  });

  it('debería tener funciones de gestión definidas', () => {
    const { result } = renderHook(() => useTutors());

    expect(result.current.addTutor).toBeDefined();
    expect(result.current.editTutor).toBeDefined();
    expect(result.current.toggleStatus).toBeDefined();
  });

  it('debería validar tutor en uso', () => {
    const { result } = renderHook(() => useTutors());

    const tutorInUse = result.current.tutors.find(t => t.isInUse);
    expect(tutorInUse).toBeDefined();
  });
});