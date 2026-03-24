/**
 * @file notification.service.ts
 * @description Backend service for creating notifications for critical actions
 */

import { dbManager } from '../lib/db-manager.js';

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
      const { data, error } = await dbManager.withRetry(async (supabase) => {
        return await supabase.from('t_notifications').insert({
          USER_ID: params.userId,
          TITLE: params.title,
          MESSAGE: params.message,
          TYPE: params.type || 'info',
          RELATED_ENTITY: params.relatedEntity || null,
          RELATED_ENTITY_ID: params.relatedEntityId || null,
          STATUS: 1, // unread
          IS_READ: false
        }).select('NOTIFICATION_ID').single();
      });

      if (error) throw error;

      console.log(`[Notification] Created notification #${(data as any)?.NOTIFICATION_ID}: ${params.title}`);
      return { success: true, id: (data as any)?.NOTIFICATION_ID };
    } catch (error) {
      console.error('[Notification] Error creating notification:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Creates a notification for all admin users
   */
  async notifyAdmins(params: Omit<CreateNotificationParams, 'userId'>): Promise<{ success: boolean; count: number }> {
    try {
      // Get all admin users
      const { data: admins, error: adminError } = await dbManager.withRetry(async (supabase) => {
        return await supabase
          .from('t_user')
          .select('USER_ID')
          .eq('STATUS', 1);
      });

      if (adminError) throw adminError;
      if (!admins || admins.length === 0) {
        return { success: true, count: 0 };
      }

      const notifications = (admins as any[]).map(admin => ({
        USER_ID: admin.USER_ID,
        TITLE: params.title,
        MESSAGE: params.message,
        TYPE: params.type || 'info',
        RELATED_ENTITY: params.relatedEntity || null,
        RELATED_ENTITY_ID: params.relatedEntityId || null,
        STATUS: 1,
        IS_READ: false
      }));

      const { error: insertError } = await dbManager.withRetry(async (supabase) => {
        return await supabase.from('t_notifications').insert(notifications);
      });

      if (insertError) throw insertError;

      console.log(`[Notification] Notified ${admins.length} admins: ${params.title}`);
      return { success: true, count: admins.length };
    } catch (error) {
      console.error('[Notification] Error notifying admins:', error);
      return { success: false, count: 0 };
    }
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
    const userResult = await this.create({
      userId,
      title: userMessage,
      message: adminParams.message,
      type: adminParams.type,
      relatedEntity: adminParams.relatedEntity,
      relatedEntityId: adminParams.relatedEntityId
    });

    return {
      success: adminResult.success && userResult.success,
      adminCount: adminResult.count,
      userSuccess: userResult.success
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
