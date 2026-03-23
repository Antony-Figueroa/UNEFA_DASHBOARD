/**
 * @file useInstitutions.test.tsx
 * @description Tests para el hook useInstitutions que gestiona la lógica de negocio de instituciones.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useInstitutions } from '../hooks/useInstitutions';

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
        institutionId: '1',
        rif: 'J-12345678-9',
        name: 'Empresa Test C.A.',
        institutionType: 'PRIVADA',
        status: true,
        registrationDate: '2024-01-01',
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

describe('useInstitutions Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('debería cargar instituciones al inicializar', async () => {
    const { result } = renderHook(() => useInstitutions());

    await waitFor(() => {
      expect(result.current.institutions).toBeDefined();
    });
  });

  it('debería tener funciones CRUD definidas', () => {
    const { result } = renderHook(() => useInstitutions());

    expect(result.current.addInstitution).toBeDefined();
    expect(result.current.editInstitution).toBeDefined();
    expect(result.current.toggleStatus).toBeDefined();
  });

  it('debería soportar operaciones masivas', () => {
    const { result } = renderHook(() => useInstitutions());

    expect(result.current.bulkRemoveInstitutions).toBeDefined();
    expect(result.current.bulkRestoreInstitutions).toBeDefined();
  });
});