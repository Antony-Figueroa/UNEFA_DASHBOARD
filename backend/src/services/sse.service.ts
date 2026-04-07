import { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";
import { verifyToken, decodeToken } from "../utils/auth.utils.js";

const clients: Map<number, Set<Response>> = new Map();

export const subscribeToNotifications = (req: Request, res: Response) => {
  // SSE no puede usar middleware tradicional de cookies, leer directamente
  const token = req.cookies?.auth_token || req.query?.token as string;
  
  let userId: number | null = null;
  
  if (token) {
    // Verificar el token manualmente
    const payload = verifyToken(token) as { userId?: number } | null;
    if (payload?.userId) {
      userId = payload.userId;
    } else {
      // Intentar decodificar sin verificar (para casos de token expirado)
      const decoded = decodeToken(token) as { userId?: number } | null;
      if (decoded?.userId) {
        userId = decoded.userId;
      }
    }
  }

  if (!userId) {
    // Para desarrollo, permitir sin auth (pero loguear warning)
    console.warn('[SSE] Conexión sin token de auth - permitiendo en modo desarrollo');
    // En producción descomentar: return res.status(401).json({ error: "Unauthorized" });
  }

  // CORS: permitir el origen del frontend específico, no wildcard con credentials
  const origin = req.headers.origin || 
    (req.headers.referer ? req.headers.referer.replace(/\/[^\/]*$/, '') : null) || 
    'http://localhost:5173';
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  
  // Manejar preflight
  if (req.method === 'OPTIONS') {
    res.setHeader("Access-Control-Allow-Methods", "GET");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).end();
    return;
  }
  
  res.flushHeaders();

  // Si no hay userId, no podemos registrar al cliente en el Map
  if (!userId) {
    // Mantener conexión viva pero sin notificaciones específicas de usuario
    const heartbeatInterval = setInterval(() => {
      res.write(`: heartbeat\n\n`);
    }, 30000);

    req.on("close", () => {
      clearInterval(heartbeatInterval);
      console.log('[SSE] Client disconnected (no auth)');
    });
    return;
  }

  if (!clients.has(userId)) {
    clients.set(userId, new Set());
  }
  clients.get(userId)!.add(res);

  console.log(`[SSE] Client connected for user ${userId}. Total clients: ${clients.get(userId)?.size}`);

  const heartbeatInterval = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 30000);

  req.on("close", () => {
    clearInterval(heartbeatInterval);
    const userClients = clients.get(userId);
    if (userClients) {
      userClients.delete(res);
      if (userClients.size === 0) {
        clients.delete(userId);
      }
    }
    console.log(`[SSE] Client disconnected for user ${userId}`);
  });
};

export const sendNotificationToUser = async (
  userId: number,
  type: string,
  title: string,
  message: string,
  data?: Record<string, unknown>
) => {
  try {
    const { data: notification, error } = await supabase
      .from("t_notifications")
      .insert({
        USER_ID: userId,
        TYPE: type,
        TITLE: title,
        MESSAGE: message,
        DATA: data || null,
        READ: false,
      })
      .select()
      .single();

    if (error) throw error;

    const userClients = clients.get(userId);
    if (userClients && userClients.size > 0) {
      const eventData = JSON.stringify({
        id: notification.NOTIFICATION_ID,
        type,
        title,
        message,
        data,
        createdAt: notification.CREATED_AT,
      });

      userClients.forEach((client) => {
        client.write(`event: new_notification\n`);
        client.write(`data: ${eventData}\n\n`);
      });

      console.log(`[SSE] Notification sent to user ${userId}`);
    }

    return notification;
  } catch (error) {
    console.error("[SSE] Error sending notification:", error);
    return null;
  }
};

interface NotificationInsert {
  USER_ID: number;
  TYPE: string;
  TITLE: string;
  MESSAGE: string;
  DATA: Record<string, unknown> | null;
  READ: boolean;
}

interface NotificationRow {
  NOTIFICATION_ID: number;
  USER_ID: number;
  TYPE: string;
  TITLE: string;
  MESSAGE: string;
  DATA: Record<string, unknown> | null;
  READ: boolean;
  CREATED_AT: string;
}

interface UserRow {
  USER_ID: number;
}

export const sendNotificationToMultipleUsers = async (
  userIds: number[],
  type: string,
  title: string,
  message: string,
  data?: Record<string, unknown>
) => {
  try {
    const notifications: NotificationInsert[] = userIds.map((userId) => ({
      USER_ID: userId,
      TYPE: type,
      TITLE: title,
      MESSAGE: message,
      DATA: data || null,
      READ: false,
    }));

    const { data: insertedData, error } = await supabase
      .from("t_notifications")
      .insert(notifications)
      .select();

    if (error) throw error;

    const eventData = JSON.stringify({
      type,
      title,
      message,
      data,
      createdAt: new Date().toISOString(), // UTC por defecto
    });

    userIds.forEach((userId) => {
      const userClients = clients.get(userId);
      if (userClients && userClients.size > 0) {
        userClients.forEach((client) => {
          client.write(`event: new_notification\n`);
          client.write(`data: ${eventData}\n\n`);
        });
      }
    });

    console.log(`[SSE] Bulk notifications sent to ${userIds.length} users`);
    return insertedData;
  } catch (error) {
    console.error("[SSE] Error sending bulk notifications:", error);
    return null;
  }
};

export const sendNotificationByRole = async (
  role: string,
  type: string,
  title: string,
  message: string,
  data?: Record<string, unknown>
) => {
  try {
    const { data: users, error } = await supabase
      .from("t_user")
      .select("USER_ID")
      .eq("STATUS", 1);

    if (error || !users || users.length === 0) {
      console.log("[SSE] No users found with active status");
      return null;
    }

    const userIds = users.map((u: UserRow) => u.USER_ID);
    return sendNotificationToMultipleUsers(userIds, type, title, message, data);
  } catch (error) {
    console.error("[SSE] Error sending notification by role:", error);
    return null;
  }
};
