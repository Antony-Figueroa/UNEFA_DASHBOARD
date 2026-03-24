import apiClient from "../../../api/apiClient";
import type { NotificationsResponse } from '../types';

export type TestNotificationType = 'success' | 'warning' | 'error' | 'info';

export const notificationService = {
  /**
   * Crea una notificación de prueba (solo para desarrollo)
   */
  createTest: async (type: TestNotificationType = 'info'): Promise<{ success: boolean }> => {
    const messages: Record<TestNotificationType, { title: string; message: string }> = {
      success: {
        title: '✅ Operación exitosa',
        message: 'La acción se completó correctamente.'
      },
      warning: {
        title: '⚠️ Advertencia',
        message: 'Hay acciones que requieren tu atención.'
      },
      error: {
        title: '❌ Error',
        message: 'Ocurrió un error al procesar la solicitud.'
      },
      info: {
        title: 'ℹ️ Información',
        message: 'Nueva actualización disponible en el sistema.'
      }
    };

    const { title, message } = messages[type];

    try {
      const response = await apiClient.post('/notifications', {
        TITLE: title,
        MESSAGE: message,
        TYPE: type.toUpperCase(),
        PRIORITY: type === 'error' ? 'high' : type === 'warning' ? 'medium' : 'low'
      });
      return response.data;
    } catch (error) {
      console.error('[NotificationService] Error creating test notification:', error);
      return { success: false };
    }
  },

  getAll: async (limit = 20, offset = 0, unreadOnly = false): Promise<NotificationsResponse> => {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
      unreadOnly: String(unreadOnly),
    });
    const response = await apiClient.get(`/notifications?${params}`);
    return response.data;
  },

  getUnreadCount: async (): Promise<{ success: boolean; count: number }> => {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (id: number): Promise<{ success: boolean }> => {
    const response = await apiClient.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<{ success: boolean }> => {
    const response = await apiClient.patch('/notifications/read-all');
    return response.data;
  },

  delete: async (id: number): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/notifications/${id}`);
    return response.data;
  },
};

export const connectToNotificationStream = (
  onNotification: (notification: unknown) => void,
  onError?: (error: Event) => void
): (() => void) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.warn('[SSE] No token available for SSE connection');
    return () => {};
  }

  const eventSource = new EventSource(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/notifications/stream`, {
    withCredentials: true,
  });

  eventSource.onopen = () => {
    console.log('[SSE] Connected to notification stream');
  };

  eventSource.addEventListener('new_notification', (event) => {
    try {
      const data = JSON.parse(event.data);
      onNotification(data);
    } catch (error) {
      console.error('[SSE] Error parsing notification:', error);
    }
  });

  eventSource.onerror = (error) => {
    console.error('[SSE] Connection error:', error);
    onError?.(error);
  };

  return () => {
    eventSource.close();
    console.log('[SSE] Disconnected from notification stream');
  };
};
