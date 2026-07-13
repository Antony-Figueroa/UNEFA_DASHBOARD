import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const mockGetDashboardStats = vi.fn();

const authState = {
  user: null as { id: number; role: number } | null,
  loading: true,
};

vi.mock('../../services/dashboardService', () => ({
  getDashboardStats: mockGetDashboardStats,
}));

vi.mock('@/context/auth', () => ({
  useAuth: () => authState,
}));

describe('useDashboardStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.user = null;
    authState.loading = true;
  });

  it('no consulta estadísticas mientras la autenticación sigue cargando', async () => {
    const { useDashboardStats } = await import('../useDashboardStats');

    renderHook(() => useDashboardStats());

    expect(mockGetDashboardStats).not.toHaveBeenCalled();
  });

  it('no consulta estadísticas cuando el hook está deshabilitado', async () => {
    authState.user = { id: 1, role: 2 };
    authState.loading = false;

    const { useDashboardStats } = await import('../useDashboardStats');

    renderHook(() => useDashboardStats({ enabled: false }));

    expect(mockGetDashboardStats).not.toHaveBeenCalled();
  });
});
