import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  notificationService,
  connectToNotificationStream,
} from '../services/notificationService';
import type { Notification, SSENotification } from '../types';
import { useAuth } from '../../../context/auth';

interface UseNotificationsOptions {
  autoConnect?: boolean;
  limit?: number;
}

export const useNotifications = (options: UseNotificationsOptions = {}) => {
  const { autoConnect = true, limit = 20 } = options;
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = !!user;
  
  // El sistema de auth usa cookies, no localStorage
  // isReady solo necesita que el usuario esté autenticado y que auth no esté cargando
  const isReady = isAuthenticated && !authLoading;
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = useCallback(async (offset = 0, reset = false) => {
    // No intentar cargar si no está listo (autenticado + auth cargada)
    if (!isReady) {
      return;
    }
    
    try {
      if (reset) {
        setLoading(true);
      }
      
      const response = await notificationService.getAll(limit, offset, false);
      
      if (reset) {
        setNotifications(response.data);
      } else {
        setNotifications((prev) => [...prev, ...response.data]);
      }
      
      setUnreadCount(response.unreadCount);
      setHasMore(response.data.length === limit);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number } };
      // Silenciar errores 401 y 403 — el backend puede rechazar por permisos
      // sin que esto deba ser un error visible para el usuario
      if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
        return;
      }
    } finally {
      setLoading(false);
    }
  }, [limit, isReady]);

  const markAsRead = useCallback(async (id: number) => {
    if (!isReady) return;
    
    try {
      await notificationService.markAsRead(id);
      
      setNotifications((prev) =>
        prev.map((n) =>
          n.NOTIFICATION_ID === id
            ? { ...n, READ: true, READ_AT: new Date().toISOString() }
            : n
        )
      );
      
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('[useNotifications] Error marking as read:', error);
      toast.error('Error al marcar notificación como leída');
    }
  }, [isReady]);

  const markAllAsRead = useCallback(async () => {
    if (!isReady) return;
    
    try {
      await notificationService.markAllAsRead();
      
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, READ: true, READ_AT: new Date().toISOString() }))
      );
      
      setUnreadCount(0);
      toast.success('Todas las notificaciones marcadas como leídas');
    } catch (error) {
      console.error('[useNotifications] Error marking all as read:', error);
      toast.error('Error al marcar notificaciones');
    }
  }, [isReady]);

  const deleteNotification = useCallback(async (id: number) => {
    if (!isReady) return;
    
    try {
      await notificationService.delete(id);
      
      const deleted = notifications.find((n) => n.NOTIFICATION_ID === id);
      setNotifications((prev) => prev.filter((n) => n.NOTIFICATION_ID !== id));
      
      if (deleted && !deleted.READ) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('[useNotifications] Error deleting notification:', error);
      toast.error('Error al eliminar notificación');
    }
  }, [notifications, isReady]);

  const refreshNotifications = useCallback(() => {
    fetchNotifications(0, true);
  }, [fetchNotifications]);

  const handleNewNotification = useCallback((notification: unknown) => {
    const sseNotification = notification as SSENotification;
    const newNotification: Notification = {
      NOTIFICATION_ID: sseNotification.id,
      USER_ID: 0,
      TYPE: sseNotification.type,
      TITLE: sseNotification.title,
      MESSAGE: sseNotification.message,
      READ: false,
      READ_AT: null,
      DATA: sseNotification.data || null,
      CREATED_AT: sseNotification.createdAt,
    };

    setNotifications((prev) => [newNotification, ...prev]);
    setUnreadCount((prev) => prev + 1);
    
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border-l-4 border-brand-500 max-w-sm`}
      >
        <p className="font-semibold text-text-emphasis">{sseNotification.title}</p>
        <p className="text-sm text-text-secondary mt-1">{sseNotification.message}</p>
      </div>
    ), {
      duration: 5000,
      position: 'top-right',
    });
  }, []);

  useEffect(() => {
    // No cargar notificaciones si no está autenticado o si está cargando la auth
    if (!isReady) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    
    fetchNotifications(0, true);
  }, [fetchNotifications, isReady]);

  useEffect(() => {
    // No conectar al stream si no está listo
    if (!autoConnect || !isReady) {
      return;
    }

    const disconnect = connectToNotificationStream(
      handleNewNotification,
      (error) => console.error('[useNotifications] SSE error:', error)
    );

    return () => {
      disconnect();
    };
  }, [autoConnect, handleNewNotification, isReady]);

  return {
    notifications,
    unreadCount,
    loading,
    hasMore,
    fetchMore: () => fetchNotifications(notifications.length, false),
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  };
};
