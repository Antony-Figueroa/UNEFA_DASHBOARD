import { useState, useEffect, useCallback } from "react";
import {
  getActiveSessions,
  terminateSession as terminateSessionApi,
} from "../services/authService";
import type { ActiveSession } from "../types";
import toast from "react-hot-toast";

export const useActiveSessions = () => {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getActiveSessions();
      setSessions(data);
    } catch {
      toast.error("Error al cargar sesiones activas");
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
        toast.success("Sesión cerrada exitosamente");
        refresh();
      } else {
        toast.error(result.message || "Error al cerrar sesión");
      }
    } catch {
      toast.error("Error al cerrar sesión");
    }
  };

  return { sessions, loading, terminateSession, refresh };
};
