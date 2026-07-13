/**
 * @file usePeriods.test.tsx
 * @description Tests para usePeriods — updateTypeDates function.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock del contexto de Toast
const mockAddToast = vi.fn();
vi.mock('@/context/toast', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

const authState = {
  user: { id: 1, role: 1 },
  loading: false,
};

vi.mock('@/context/auth', () => ({
  useAuth: () => authState,
}));

// Mock del hook useCrud
const mockUseCrud = vi.fn(() => ({
  data: [
    { periodId: '1', description: '1-2026', startDate: new Date('2026-01-01'), endDate: new Date('2026-07-31'), periodStatus: 1, status: true, code: '1-2026' },
  ],
  status: 'success',
  loadingAction: false,
  error: null,
  refresh: vi.fn(),
  createItem: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
  toggleItemStatus: vi.fn(),
  bulkDelete: vi.fn(),
  bulkRestore: vi.fn(),
}));

vi.mock('@/hooks/useCrud', () => ({
  useCrud: mockUseCrud,
}));

// Mock del servicio de period type dates
vi.mock('../../services/periodTypeDatesService', () => ({
  upsert: vi.fn(),
  getByPeriod: vi.fn(),
  remove: vi.fn(),
}));

describe('usePeriods — updateTypeDates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.user = { id: 1, role: 1 };
    authState.loading = false;
  });

  it('desactiva la carga automática de períodos cuando la autenticación aún no está lista', async () => {
    authState.user = null;
    authState.loading = true;

    const { usePeriods } = await import('../usePeriods');
    renderHook(() => usePeriods());

    expect(mockUseCrud).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        autoLoad: false,
      })
    );
  });

  it('desactiva la carga automática cuando el hook está deshabilitado explícitamente', async () => {
    const { usePeriods } = await import('../usePeriods');
    renderHook(() => usePeriods({ enabled: false }));

    expect(mockUseCrud).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        autoLoad: false,
      })
    );
  });

  it('debería exponer updateTypeDates como función', () => {
    const { result } = renderHook(() => usePeriods());

    expect(result.current.updateTypeDates).toBeDefined();
    expect(typeof result.current.updateTypeDates).toBe('function');
  });

  it('debería llamar upsert del servicio cuando se invoca updateTypeDates', async () => {
    const mockUpsert = vi.mocked(periodTypeDatesService.upsert);
    mockUpsert.mockResolvedValue({ id: 1, periodId: 1, internshipTypeId: 1, startDate: '2026-03-16', endDate: '2026-05-08' });

    const { result } = renderHook(() => usePeriods());

    await act(async () => {
      await result.current.updateTypeDates(1, [
        { periodId: 1, internshipTypeId: 1, startDate: '2026-03-16', endDate: '2026-05-08' },
      ]);
    });

    expect(mockUpsert).toHaveBeenCalled();
  });

  it('debería actualizar typeDates para múltiples tipos', async () => {
    const mockUpsert = vi.mocked(periodTypeDatesService.upsert);
    mockUpsert.mockResolvedValue({ id: 1, periodId: 1, internshipTypeId: 1, startDate: '2026-03-16', endDate: '2026-05-08' });

    const { result } = renderHook(() => usePeriods());
    const typeDates = [
      { periodId: 1, internshipTypeId: 1, startDate: '2026-03-16', endDate: '2026-05-08' },
      { periodId: 1, internshipTypeId: 2, startDate: '2026-05-01', endDate: '2026-07-03' },
    ];

    await act(async () => {
      await result.current.updateTypeDates(1, typeDates);
    });

    expect(mockUpsert).toHaveBeenCalledTimes(typeDates.length);
  });
});
