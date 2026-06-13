import { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";
import { notificationsUnified } from "../services/notifications-unified.service.js";
import { sendEmail } from "../utils/email.utils.js";

// Mapeo de nombres de rol a IDs de la tabla t_user_roles
const ROLE_NAME_TO_ID: Record<string, number> = {
  admin: 1,
  asistente: 2,
  tutor: 3,
  estudiante: 4,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Reemplaza variables {{variable}} con valores del contexto */
function replaceVariables(text: string, ctx: Record<string, string>): string {
  return text
    .replace(/\{\{(\w+)\}\}/g, (_match, key: string) => ctx[key] ?? '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export interface Notification {
  NOTIFICATION_ID: number;
  USER_ID: number;
  TYPE: string;
  TITLE: string;
  MESSAGE: string;
  READ: boolean;
  READ_AT: string | null;
  DATA: Record<string, unknown> | null;
  CREATED_AT: string;
}

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { limit = 20, offset = 0, unreadOnly = false } = req.query;

    let query = supabase
      .from("t_notifications")
      .select("*")
      .eq("USER_ID", userId)
      .order("CREATED_AT", { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (unreadOnly === "true") {
      query = query.eq("READ", false);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Get unread count
    const { count } = await supabase
      .from("t_notifications")
      .select("*", { count: "exact", head: true })
      .eq("USER_ID", userId)
      .eq("READ", false);

    res.json({
      success: true,
      data: data || [],
      unreadCount: count || 0,
    });
  } catch (error) {
    console.error("[notifications.controller] Error getting notifications:", error);
    res.status(500).json({ error: "Error al obtener notificaciones" });
  }
};

export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { error } = await supabase
      .from("t_notifications")
      .update({ 
        READ: true, 
        READ_AT: new Date().toISOString() 
      })
      .eq("NOTIFICATION_ID", id)
      .eq("USER_ID", userId);

    if (error) throw error;

    res.json({ success: true, message: "Notificación marcada como leída" });
  } catch (error) {
    console.error("[notifications.controller] Error marking notification as read:", error);
    res.status(500).json({ error: "Error al marcar notificación como leída" });
  }
};

export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { error } = await supabase
      .from("t_notifications")
      .update({ 
        READ: true, 
        READ_AT: new Date().toISOString() 
      })
      .eq("USER_ID", userId)
      .eq("READ", false);

    if (error) throw error;

    res.json({ success: true, message: "Todas las notificaciones marcadas como leídas" });
  } catch (error) {
    console.error("[notifications.controller] Error marking all notifications as read:", error);
    res.status(500).json({ error: "Error al marcar notificaciones como leídas" });
  }
};

export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { error } = await supabase
      .from("t_notifications")
      .delete()
      .eq("NOTIFICATION_ID", id)
      .eq("USER_ID", userId);

    if (error) throw error;

    res.json({ success: true, message: "Notificación eliminada" });
  } catch (error) {
    console.error("[notifications.controller] Error deleting notification:", error);
    res.status(500).json({ error: "Error al eliminar notificación" });
  }
};

export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { count, error } = await supabase
      .from("t_notifications")
      .select("*", { count: "exact", head: true })
      .eq("USER_ID", userId)
      .eq("READ", false);

    if (error) throw error;

    res.json({ success: true, count: count || 0 });
  } catch (error) {
    console.error("[notifications.controller] Error getting unread count:", error);
    res.status(500).json({ error: "Error al obtener conteo de notificaciones" });
  }
};

// ---------------------------------------------------------------------------
// Express Email
// ---------------------------------------------------------------------------

interface ExpressEmailRequest {
  subject: string;
  message: string;
  recipients: {
    roles?: string[];
    users?: Array<{ id: number }>;
    externalEmails?: string[];
  };
  templateId?: number;
}

export const expressEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subject, message, recipients, templateId } = req.body as ExpressEmailRequest;

    // Validar campos obligatorios
    if (!subject?.trim()) {
      res.status(400).json({ success: false, error: 'El asunto es obligatorio' });
      return;
    }
    if (!message?.trim()) {
      res.status(400).json({ success: false, error: 'El mensaje es obligatorio' });
      return;
    }

    const roles = recipients?.roles ?? [];
    const users = recipients?.users ?? [];
    const externalEmails = recipients?.externalEmails ?? [];

    if (roles.length === 0 && users.length === 0 && externalEmails.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Debe proporcionar al menos un destinatario (rol, usuario o email externo)',
      });
      return;
    }

    // 1. Resolver roles → usuarios del sistema
    let systemUserIds: number[] = [];
    for (const role of roles) {
      if (role === 'all') {
        const { data: allUsers, error } = await supabase
          .from('t_user')
          .select('USER_ID, NAME, SURNAME, EMAIL')
          .eq('STATUS', 1);

        if (error) throw error;
        systemUserIds = [
          ...systemUserIds,
          ...(allUsers || []).map((u: any) => u.USER_ID),
        ];
      } else {
        const roleId = ROLE_NAME_TO_ID[role.toLowerCase()];
        if (roleId == null) {
          console.warn(`[ExpressEmail] Rol desconocido: ${role}`);
          continue;
        }
        const { data: roleUsers, error } = await supabase
          .from('t_user_roles')
          .select('ID_USER')
          .eq('ID_ROLES', roleId);

        if (error) throw error;
        systemUserIds = [
          ...systemUserIds,
          ...(roleUsers || []).map((u: any) => u.ID_USER),
        ];
      }
    }

    // 2. Obtener datos de usuarios del sistema (resueltos + directos)
    const directUserIds = users.map(u => u.id);
    const allUserIds = [...new Set([...systemUserIds, ...directUserIds])];

    const systemRecipients: Array<{ email: string; name: string; userId: number }> = [];
    if (allUserIds.length > 0) {
      const { data: userData, error } = await supabase
        .from('t_user')
        .select('USER_ID, NAME, SURNAME, EMAIL')
        .in('USER_ID', allUserIds)
        .eq('STATUS', 1);

      if (error) throw error;

      for (const u of userData || []) {
        if (u.EMAIL) {
          systemRecipients.push({
            userId: u.USER_ID,
            email: u.EMAIL,
            name: [u.NAME, u.SURNAME].filter(Boolean).join(' ').trim() || 'Usuario',
          });
        }
      }
    }

    // 3. Preparar destinatarios externos
    const externalRecipients = externalEmails.map(email => ({
      email,
      name: 'Estimado/a',
    }));

    // 4. Unificar y deduplicar por email
    const allRecipients = [
      ...systemRecipients.map(r => ({ email: r.email, name: r.name, userId: r.userId })),
      ...externalRecipients.map(r => ({ email: r.email, name: r.name, userId: null })),
    ];

    const seenEmails = new Set<string>();
    const uniqueRecipients = allRecipients.filter(r => {
      if (seenEmails.has(r.email)) return false;
      seenEmails.add(r.email);
      return true;
    });

    console.log('[ExpressEmail] Unique recipients:', uniqueRecipients.map(r => r.email));

    // 5. Responder inmediatamente
    res.json({
      success: true,
      data: {
        total: uniqueRecipients.length,
        sent: uniqueRecipients.length,
        failed: 0,
      },
    });

    // 6. Enviar correos en background
    (async () => {
      try {
        const results = await Promise.all(
          uniqueRecipients.map(r => {
            const ctx: Record<string, string> = {
              nombre: r.name,
              fecha: new Date().toLocaleDateString('es-VE'),
              email: r.email,
            };
            const personalizedHtml = replaceVariables(message, ctx);
            const personalizedSubject = replaceVariables(subject, ctx);

            return sendEmail({
              to: r.email,
              subject: personalizedSubject,
              html: personalizedHtml,
            }).then(result => ({ ...result, recipientEmail: r.email }));
          })
        );

        // 7. Crear notificaciones en DB solo para usuarios del sistema
        if (systemRecipients.length > 0) {
          const sentSystem = uniqueRecipients.filter(r => r.userId !== null);
          if (sentSystem.length > 0) {
            await notificationsUnified.createBulk({
              userIds: sentSystem.map(r => r.userId!),
              type: 'system',
              title: subject,
              message,
            }).catch(err => console.error('[ExpressEmail] Error creating bulk notifications:', err));
          }
        }

        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        console.log('[ExpressEmail] Emails sent:', {
          total: uniqueRecipients.length,
          sent: successful.length,
          failed: failed.length,
        });
      } catch (err) {
        console.error('[ExpressEmail] Background error:', err);
      }
    })();
  } catch (error: any) {
    console.error('[ExpressEmail] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al enviar correo express',
      details: error?.message || String(error),
    });
  }
};

export const createNotification = async (
  userId: number,
  type: string,
  title: string,
  message: string,
  data?: Record<string, unknown>
): Promise<unknown> => {
  const result = await notificationsUnified.create({ userId, type, title, message, data });
  return result.notification ? true : null;
};

export const createBulkNotifications = async (
  userIds: number[],
  type: string,
  title: string,
  message: string,
  data?: Record<string, unknown>
): Promise<boolean> => {
  const count = await notificationsUnified.createBulk({ userIds, type, title, message, data });
  return count > 0;
};
