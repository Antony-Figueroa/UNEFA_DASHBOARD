import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/context/toast';
import { TOAST } from '@/components/ui/dialog/DialogConfig';
import activityLogsService from '../services/activityLogsService';
import {
  ActivityLog,
  CreateActivityLogPayload,
  UpdateActivityLogPayload,
  ActivityLogStats
} from '../types';

const resourceName = 'Registro de actividad';

export const useActivityLogs = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<ActivityLogStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const { addToast } = useToast();

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
      addToast(TOAST.loadError());
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
        addToast(TOAST.created(resourceName));
        return true;
      }
      return false;
    } catch (error) {
      console.error('[useActivityLogs] Error creating log:', error);
      addToast(TOAST.createError(resourceName));
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
        addToast(TOAST.updated(resourceName));
        return true;
      }
      return false;
    } catch (error) {
      console.error('[useActivityLogs] Error updating log:', error);
      addToast(TOAST.updateError(resourceName));
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
      addToast(TOAST.deleted(resourceName));
      return true;
    } catch (error) {
      console.error('[useActivityLogs] Error deleting log:', error);
      addToast(TOAST.deleteError(resourceName));
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
        addToast(TOAST.updated(resourceName));
        return true;
      }
      return false;
    } catch (error) {
      console.error('[useActivityLogs] Error approving log:', error);
      addToast(TOAST.updateError(resourceName));
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
