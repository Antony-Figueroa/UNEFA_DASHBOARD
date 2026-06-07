import { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";
import { notificationsUnified } from "../services/notifications-unified.service.js";

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
