import { Router, Request, Response } from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
} from "../controllers/notifications.controller.js";
import { supabase } from "../lib/supabase.js";

const router = Router();

// NOTE: Authentication is applied globally in app.ts for all /api routes

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/:id/read", markAsRead);
router.patch("/read-all", markAllAsRead);
router.delete("/:id", deleteNotification);

// Endpoint para crear notificaciones de prueba
router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { TITLE, MESSAGE, TYPE = 'info' } = req.body;

    if (!TITLE || !MESSAGE) {
      res.status(400).json({ error: "TITLE and MESSAGE are required" });
      return;
    }

    console.log('[notifications.routes] Creating notification:', { userId, TITLE, MESSAGE, TYPE });

    const { data, error } = await supabase
      .from("t_notifications")
      .insert({
        USER_ID: userId,
        TYPE: TYPE.toLowerCase(),
        TITLE,
        MESSAGE,
        READ: false,
      })
      .select();

    if (error) {
      console.error('[notifications.routes] Supabase error:', error);
      throw error;
    }

    console.log('[notifications.routes] Notification created:', data);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("[notifications.routes] Error creating notification:", error);
    res.status(500).json({ 
      error: "Error creating notification",
      details: error?.message || error?.details || String(error)
    });
  }
});

export default router;
