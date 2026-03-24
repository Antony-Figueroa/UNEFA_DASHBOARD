import { Router, Request, Response } from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
} from "../controllers/notifications.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { supabase } from "../lib/supabase.js";

const router = Router();

router.use(authenticateToken);

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/:id/read", markAsRead);
router.patch("/read-all", markAllAsRead);
router.delete("/:id", deleteNotification);

// Endpoint para crear notificaciones de prueba
router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { TITLE, MESSAGE, TYPE = 'INFO', PRIORITY = 'low' } = req.body;

    if (!TITLE || !MESSAGE) {
      res.status(400).json({ error: "TITLE and MESSAGE are required" });
      return;
    }

    const { error } = await supabase
      .from("t_notifications")
      .insert({
        USER_ID: userId,
        TYPE,
        TITLE,
        MESSAGE,
        PRIORITY,
        READ: false,
      });

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error("[notifications.routes] Error creating notification:", error);
    res.status(500).json({ error: "Error creating notification" });
  }
});

export default router;
