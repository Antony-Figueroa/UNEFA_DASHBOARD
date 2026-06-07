/**
 * @file notification.service.ts
 * @description Wrapper de compatibilidad — delega al unified notification service.
 */

import { notificationsUnified } from './notifications-unified.service.js';

export interface CreateNotificationParams {
  userId: number;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  relatedEntity?: string;
  relatedEntityId?: number;
}

class NotificationService {
  /**
   * Creates a notification for a specific user
   */
  async create(params: CreateNotificationParams): Promise<{ success: boolean; id?: number; error?: string }> {
    try {
      const result = await notificationsUnified.create({
        userId: params.userId,
        type: params.type || 'info',
        title: params.title,
        message: params.message,
        data: params.relatedEntity ? { entity: params.relatedEntity, entityId: params.relatedEntityId } : undefined,
      });
      return { success: true, id: (result.notification as any)?.NOTIFICATION_ID };
    } catch (error) {
      console.error('[Notification] Error creating notification:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Creates notifications for all admin users via unified service
   */
  async notifyAdmins(params: Omit<CreateNotificationParams, 'userId'>): Promise<{ success: boolean; count: number }> {
    const count = await notificationsUnified.sendToRole({
      role: 'admin',
      type: params.type || 'info',
      title: params.title,
      message: params.message,
    });
    return { success: count !== null, count: count || 0 };
  }

  /**
   * Creates notifications for both admin and specific user
   */
  async notifyAdminAndUser(
    adminParams: Omit<CreateNotificationParams, 'userId'>,
    userId: number,
    userMessage: string
  ): Promise<{ success: boolean; adminCount: number; userSuccess: boolean }> {
    const adminResult = await this.notifyAdmins(adminParams);
    const userResult = await notificationsUnified.create({
      userId,
      type: adminParams.type || 'info',
      title: userMessage,
      message: adminParams.message,
    });
    return {
      success: adminResult.success && !!userResult.notification,
      adminCount: adminResult.count,
      userSuccess: !!userResult.notification,
    };
  }
}

export const notificationService = new NotificationService();

// Helper functions for common notification scenarios
export const notifyEvaluationCreated = async (
  evaluatorName: string,
  practiceId: number,
  studentName: string
) => {
  return await notificationService.notifyAdmins({
    title: 'Nueva Evaluación Creada',
    message: `El evaluador ${evaluatorName} ha evaluado al estudiante ${studentName}`,
    type: 'info',
    relatedEntity: 'evaluation',
    relatedEntityId: practiceId
  });
};

export const notifyRequestCreated = async (
  studentName: string,
  requestType: string,
  requestId: number
) => {
  return await notificationService.notifyAdmins({
    title: 'Nueva Solicitud',
    message: `El estudiante ${studentName} ha creado una nueva solicitud: ${requestType}`,
    type: 'warning',
    relatedEntity: 'request',
    relatedEntityId: requestId
  });
};

export const notifyTutorAssigned = async (
  tutorName: string,
  studentName: string,
  practiceId: number,
  tutorUserId?: number
) => {
  // Notify admins
  const adminResult = await notificationService.notifyAdmins({
    title: 'Tutor Asignado',
    message: `El tutor ${tutorName} ha sido asignado al estudiante ${studentName}`,
    type: 'info',
    relatedEntity: 'practice',
    relatedEntityId: practiceId
  });

  // Optionally notify the tutor directly
  if (tutorUserId) {
    await notificationService.create({
      userId: tutorUserId,
      title: 'Nueva Asignación de Tutoría',
      message: `Se le ha asignado al estudiante ${studentName} para supervisión de práctica`,
      type: 'info',
      relatedEntity: 'practice',
      relatedEntityId: practiceId
    });
  }

  return adminResult;
};
