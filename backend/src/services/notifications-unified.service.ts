/**
 * @file notifications-unified.service.ts
 * @description Servicio único de notificaciones — centraliza creación en DB + emisión SSE.
 * Reemplaza la lógica duplicada en sse.service.ts, notification.service.ts y
 * notifications.controller.ts.
 */

import { supabase } from '../lib/supabase.js';
import { clients } from './sse.service.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreateParams {
  userId: number;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

interface CreateResult {
  notification: Record<string, unknown> | null;
  sseEmitted: boolean;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class NotificationsUnifiedService {
  /**
   * Crea una notificación para un usuario específico y emite SSE si está conectado.
   */
  async create(params: CreateParams): Promise<CreateResult> {
    try {
      const { data: notification, error } = await supabase
        .from('t_notifications')
        .insert({
          USER_ID: params.userId,
          TYPE: params.type,
          TITLE: params.title,
          MESSAGE: params.message,
          DATA: params.data || null,
          READ: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Emitir SSE si el usuario tiene conexión activa
      let sseEmitted = false;
      const userClients = clients.get(params.userId);
      if (userClients && userClients.size > 0) {
        const eventData = JSON.stringify({
          id: (notification as any)?.NOTIFICATION_ID,
          type: params.type,
          title: params.title,
          message: params.message,
          data: params.data,
          createdAt: (notification as any)?.CREATED_AT,
        });

        for (const client of userClients) {
          client.write(`event: new_notification\n`);
          client.write(`data: ${eventData}\n\n`);
        }
        sseEmitted = true;
      }

      return { notification: notification as unknown as Record<string, unknown>, sseEmitted };
    } catch (error) {
      console.error('[UnifiedNotification] Error creating notification:', error);
      return { notification: null, sseEmitted: false };
    }
  }

  /**
   * Crea notificaciones en lote para múltiples usuarios y emite SSE a los conectados.
   */
  async createBulk(params: {
    userIds: number[];
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }): Promise<number> {
    try {
      const notifications = params.userIds.map((userId) => ({
        USER_ID: userId,
        TYPE: params.type,
        TITLE: params.title,
        MESSAGE: params.message,
        DATA: params.data || null,
        READ: false,
      }));

      const { data: inserted, error } = await supabase
        .from('t_notifications')
        .insert(notifications)
        .select();

      if (error) throw error;

      const eventData = JSON.stringify({
        type: params.type,
        title: params.title,
        message: params.message,
        data: params.data,
        createdAt: new Date().toISOString(),
      });

      // Emitir SSE a cada usuario conectado
      for (const userId of params.userIds) {
        const userClients = clients.get(userId);
        if (userClients && userClients.size > 0) {
          for (const client of userClients) {
            client.write(`event: new_notification\n`);
            client.write(`data: ${eventData}\n\n`);
          }
        }
      }

      console.log(`[UnifiedNotification] Bulk: ${params.userIds.length} notifications created`);
      return params.userIds.length;
    } catch (error) {
      console.error('[UnifiedNotification] Error creating bulk notifications:', error);
      return 0;
    }
  }

  /**
   * Envía notificaciones a usuarios según su rol.
   * CORREGIDO: ahora filtra correctamente por rol usando t_user_roles.
   */
  async sendToRole(params: {
    role: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }): Promise<number | null> {
    try {
      let userIds: number[] = [];

      if (params.role === 'all') {
        const { data: users, error } = await supabase
          .from('t_user')
          .select('USER_ID')
          .eq('STATUS', 1);

        if (error) throw error;
        userIds = (users || []).map((u: any) => u.USER_ID);
      } else {
        const { data: roleUsers, error } = await supabase
          .from('t_user_roles')
          .select('ur_USER_ID')
          .eq('ur_ROLE_NAME', params.role.toUpperCase())
          .eq('ur_STATUS', 1);

        if (error) throw error;
        userIds = (roleUsers || []).map((u: any) => u.ur_USER_ID);
      }

      if (userIds.length === 0) return null;

      await this.createBulk({
        userIds,
        type: params.type,
        title: params.title,
        message: params.message,
        data: params.data,
      });

      return userIds.length;
    } catch (error) {
      console.error('[UnifiedNotification] Error sending to role:', error);
      return null;
    }
  }
}

export const notificationsUnified = new NotificationsUnifiedService();
