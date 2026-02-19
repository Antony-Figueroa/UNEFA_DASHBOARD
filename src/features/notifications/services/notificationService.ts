import apiClient from "../../../api/apiClient";
import type { NotificationsResponse } from '../types';

export const notificationService = {
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
