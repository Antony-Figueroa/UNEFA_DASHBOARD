import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const mockGetAll = vi.fn();
const mockConnect = vi.fn(() => vi.fn());

const authState = {
  user: { id: 1, role: 2 },
  loading: false,
};

vi.mock('@/context/auth', () => ({
  useAuth: () => authState,
}));

vi.mock('@/context/toast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock('../../services/notificationService', () => ({
  notificationService: {
    getAll: mockGetAll,
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    delete: vi.fn(),
  },
  connectToNotificationStream: mockConnect,
}));

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.user = { id: 1, role: 2 };
    authState.loading = false;
  });

  it('no consulta notificaciones cuando el hook está deshabilitado', async () => {
    const { useNotifications } = await import('../useNotifications');

    renderHook(() => useNotifications({ enabled: false, autoConnect: false }));

    await waitFor(() => {
      expect(mockGetAll).not.toHaveBeenCalled();
    });

    expect(mockGetAll).not.toHaveBeenCalled();
    expect(mockConnect).not.toHaveBeenCalled();
  });
});
