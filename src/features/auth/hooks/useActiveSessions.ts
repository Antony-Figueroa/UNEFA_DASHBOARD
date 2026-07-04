import { useState, useEffect, useCallback } from "react";
import {
  getActiveSessions,
  terminateSession as terminateSessionApi,
} from "../services/authService";
import type { ActiveSession } from "../types";
import { useToast } from "@/context/toast";
import { TOAST } from "@/components/ui/dialog/DialogConfig";

export const useActiveSessions = () => {
  const { addToast } = useToast();
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getActiveSessions();
      setSessions(data);
    } catch {
      addToast(TOAST.loadError());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const terminateSession = async (sessionId: number) => {
    try {
      const result = await terminateSessionApi(sessionId);
      if (result.success) {
        addToast({ variant: "success", title: "Sesión cerrada", message: "Sesión cerrada exitosamente" });
        refresh();
      } else {
        addToast({ variant: "error", title: "Error", message: result.message || "Error al cerrar sesión" });
      }
    } catch {
      addToast({ variant: "error", title: "Error", message: "Error al cerrar sesión" });
    }
  };

  return { sessions, loading, terminateSession, refresh };
};
