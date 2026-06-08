import { useState, useCallback, useRef } from 'react';
import { TOAST_SUCCESS, TOAST_ERROR } from '@/components/ui/dialog/DialogConfig';
import activityLogsService from '../services/activityLogsService';
import {
  ActivityLog,
  CreateActivityLogPayload,
  UpdateActivityLogPayload,
  ActivityLogStats
} from '../types';
import toast from 'react-hot-toast';

const resourceName = 'Registro de actividad';

export const useActivityLogs = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<ActivityLogStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  // Almacena los últimos filtros usados para refrescar después de mutaciones
  const lastParamsRef = useRef<{
    practiceId?: number;
    studentId?: number;
    type?: string;
    week?: number;
    status?: string;
  }>({});

  const fetchLogs = useCallback(async (params?: {
    practiceId?: number;
    studentId?: number;
    type?: string;
    week?: number;
    status?: string;
  }) => {
    setLoading(true);
    const effectiveParams = params || lastParamsRef.current;
    if (params) lastParamsRef.current = params;
    try {
      const response = await activityLogsService.getAll(effectiveParams);
      if (response.success) {
        setLogs(response.data);
      }
    } catch (error) {
      console.error('[useActivityLogs] Error fetching logs:', error);
      toast.error(TOAST_ERROR.load(resourceName));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async (practiceId: number) => {
    try {
      const response = await activityLogsService.getStats(practiceId);
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('[useActivityLogs] Error fetching stats:', error);
    }
  }, []);

  const createLog = useCallback(async (data: CreateActivityLogPayload): Promise<boolean> => {
    setLoadingAction(true);
    try {
      const response = await activityLogsService.create(data);
      if (response.success) {
        // Refrescar desde el servidor en vez de mutar localmente
        await fetchLogs({ practiceId: data.professionalPracticeId });
        toast.success(TOAST_SUCCESS.created(resourceName));
        return true;
      }
      return false;
    } catch (error) {
      console.error('[useActivityLogs] Error creating log:', error);
      toast.error(TOAST_ERROR.create(resourceName));
      return false;
    } finally {
      setLoadingAction(false);
    }
  }, [fetchLogs]);

  const updateLog = useCallback(async (id: number, data: UpdateActivityLogPayload): Promise<boolean> => {
    setLoadingAction(true);
    try {
      const response = await activityLogsService.update(id, data);
      if (response.success) {
        // Refrescar desde el servidor en vez de mutar localmente
        await fetchLogs();
        toast.success(TOAST_SUCCESS.updated(resourceName));
        return true;
      }
      return false;
    } catch (error) {
      console.error('[useActivityLogs] Error updating log:', error);
      toast.error(TOAST_ERROR.update(resourceName));
      return false;
    } finally {
      setLoadingAction(false);
    }
  }, [fetchLogs]);

  const deleteLog = useCallback(async (id: number): Promise<boolean> => {
    setLoadingAction(true);
    try {
      await activityLogsService.delete(id);
      await fetchLogs();
      toast.success(TOAST_SUCCESS.deleted(resourceName));
      return true;
    } catch (error) {
      console.error('[useActivityLogs] Error deleting log:', error);
      toast.error(TOAST_ERROR.delete(resourceName));
      return false;
    } finally {
      setLoadingAction(false);
    }
  }, [fetchLogs]);

  const approveLog = useCallback(async (id: number, comments?: string): Promise<boolean> => {
    setLoadingAction(true);
    try {
      const response = await activityLogsService.approve(id, comments);
      if (response.success) {
        await fetchLogs();
        toast.success(TOAST_SUCCESS.updated(resourceName));
        return true;
      }
      return false;
    } catch (error) {
      console.error('[useActivityLogs] Error approving log:', error);
      toast.error(TOAST_ERROR.update(resourceName));
      return false;
    } finally {
      setLoadingAction(false);
    }
  }, [fetchLogs]);

  return {
    logs,
    stats,
    loading,
    loadingAction,
    fetchLogs,
    fetchStats,
    createLog,
    updateLog,
    deleteLog,
    approveLog
  };
};
