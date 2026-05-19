/**
 * Notification Service - Notificaciones del chat
 *
 * Usa la Notification API del navegador
 */

import toast from 'react-hot-toast';

// ============================================
// Types
// ============================================

export interface ChatNotification {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Verifica si las notificaciones están habilitadas
 */
export const isNotificationsSupported = (): boolean => {
  return 'Notification' in window;
};

/**
 * Solicita permiso para notificaciones
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationsSupported()) {
    console.warn('[Notifications] API no soportada en este navegador');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.warn('[Notifications] Permiso denegado por el usuario');
    return false;
  }

  // Solicitar permiso
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

/**
 * Obtiene el estado actual del permiso
 */
export const getNotificationPermission = (): NotificationPermission | 'unsupported' => {
  if (!isNotificationsSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
};

// ============================================
// Notification Functions
// ============================================

/**
 * Envía una notificación de nuevo mensaje de la IA
 */
export const notifyNewMessage = async (
  message: string,
  maxLength: number = 100
): Promise<void> => {
  // Verificar permiso
  const permission = getNotificationPermission();
  if (permission !== 'granted') {
    // Fallback to toast
    toast.success('💬 Nuevo mensaje del asistente');
    return;
  }

  // Truncar mensaje para la notificación
  const truncatedMessage = message.length > maxLength
    ? message.substring(0, maxLength) + '...'
    : message;

  try {
    new Notification('🤖 Asistente UNEFA', {
      body: truncatedMessage,
      icon: '/favicon.ico',
      tag: 'ai-chat-message',
      requireInteraction: false,
    });
  } catch (error) {
    console.error('[Notifications] Error al enviar:', error);
  }
};

/**
 * Envía una notificación de error
 */
export const notifyError = async (error: string): Promise<void> => {
  const permission = getNotificationPermission();
  if (permission !== 'granted') {
    toast.error('❌ ' + error);
    return;
  }

  try {
    new Notification('⚠️ Error del Asistente', {
      body: error,
      icon: '/favicon.ico',
      tag: 'ai-chat-error',
    });
  } catch {
    // Ignorar
  }
};

/**
 * Envía una notificación de análisis de archivo completado
 */
export const notifyFileAnalyzed = async (filename: string): Promise<void> => {
  const permission = getNotificationPermission();
  
  if (permission === 'granted') {
    try {
      new Notification('📎 Archivo Analizado', {
        body: `El archivo ${filename} ha sido procesado`,
        icon: '/favicon.ico',
        tag: 'ai-file-analysis',
      });
    } catch {
      // Ignorar
    }
  } else {
    toast.success(`📎 Archivo ${filename} analizado`);
  }
};

export default {
  isNotificationsSupported,
  requestNotificationPermission,
  getNotificationPermission,
  notifyNewMessage,
  notifyError,
  notifyFileAnalyzed,
};