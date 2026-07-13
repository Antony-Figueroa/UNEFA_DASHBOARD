import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const mockGetMyPermissions = vi.fn();

const authState = {
  user: { id: 1, role: 2 },
  loading: false,
};

vi.mock('../../services/permissionService', () => ({
  permissionService: {
    getMyPermissions: mockGetMyPermissions,
  },
}));

vi.mock('@/context/auth', () => ({
  useAuth: () => authState,
}));

describe('usePermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    authState.user = { id: 1, role: 2 };
    authState.loading = false;
  });

  it('comparte la misma carga de permisos entre múltiples consumidores', async () => {
    mockGetMyPermissions.mockResolvedValue(['dashboard:view']);

    const { usePermissions } = await import('../usePermissions');

    const first = renderHook(() => usePermissions());
    const second = renderHook(() => usePermissions());

    await waitFor(() => {
      expect(first.result.current.loading).toBe(false);
      expect(second.result.current.loading).toBe(false);
    });

    expect(mockGetMyPermissions).toHaveBeenCalledTimes(1);
    expect(first.result.current.permissions).toEqual(['dashboard:view']);
    expect(second.result.current.permissions).toEqual(['dashboard:view']);
  });

  it('no reintenta inmediatamente tras un 401 para el mismo usuario', async () => {
    mockGetMyPermissions.mockRejectedValue({
      response: { status: 401 },
      message: 'Unauthorized',
    });

    const { usePermissions } = await import('../usePermissions');

    const first = renderHook(() => usePermissions());

    await waitFor(() => {
      expect(first.result.current.loading).toBe(false);
      expect(first.result.current.permissions).toEqual([]);
    });

    first.unmount();

    const second = renderHook(() => usePermissions());

    await waitFor(() => {
      expect(second.result.current.loading).toBe(false);
      expect(second.result.current.permissions).toEqual([]);
    });

    expect(mockGetMyPermissions).toHaveBeenCalledTimes(1);
  });
});
