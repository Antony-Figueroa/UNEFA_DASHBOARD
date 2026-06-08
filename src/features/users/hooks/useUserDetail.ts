/**
 * @file useUserDetail.ts
 * @description Hook personalizado para obtener el detalle e historial de login de un usuario.
 */

import { useState, useCallback } from "react";
import { UserDetail, AuthLog } from "../types";
import { getUserById, getLoginHistory } from "../services/userService";

export const useUserDetail = () => {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [logs, setLogs] = useState<AuthLog[]>([]);
  const [logTotal, setLogTotal] = useState(0);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);

  const fetchUser = useCallback(async (userId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserById(userId);
      setUser(data);
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.message || (err as Error).message || "Error al cargar detalle del usuario";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async (userId: number) => {
    setLogsLoading(true);
    setLogsError(null);
    try {
      const data = await getLoginHistory(userId);
      setLogs(data.logs);
      setLogTotal(data.totalCount);
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.message || (err as Error).message || "Error al cargar historial de login";
      setLogsError(msg);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setUser(null);
    setLoading(false);
    setError(null);
    setLogs([]);
    setLogTotal(0);
    setLogsLoading(false);
    setLogsError(null);
  }, []);

  return {
    user, loading, error,
    logs, logTotal, logsLoading, logsError,
    fetchUser, fetchLogs, reset
  };
};
