export type NotificationType = 
  | 'pre_enrollment'
  | 'enrollment'
  | 'tracking'
  | 'tracking_visit'
  | 'user_management'
  | 'reminder'
  | 'system'
  | 'approval';

export interface Notification {
  NOTIFICATION_ID: number;
  USER_ID: number;
  TYPE: NotificationType;
  TITLE: string;
  MESSAGE: string;
  READ: boolean;
  READ_AT: string | null;
  DATA: Record<string, unknown> | null;
  CREATED_AT: string;
}

export interface NotificationsResponse {
  success: boolean;
  data: Notification[];
  unreadCount: number;
}

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface SSENotification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  createdAt: string;
}

export const notificationTypeLabels: Record<NotificationType, string> = {
  pre_enrollment: 'Pre-inscripción',
  enrollment: 'Inscripción',
  tracking: 'Seguimiento',
  tracking_visit: 'Visita de seguimiento',
  user_management: 'Gestión de usuarios',
  reminder: 'Recordatorio',
  system: 'Sistema',
  approval: 'Aprobación',
};

export const notificationTypeIcons: Record<NotificationType, string> = {
  pre_enrollment: '📝',
  enrollment: '✅',
  tracking: '📊',
  tracking_visit: '👁️',
  user_management: '👤',
  reminder: '⏰',
  system: '⚙️',
  approval: '👍',
};
