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

export const useActivityLogs = (tutorMode?: boolean) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<ActivityLogStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const { addToast } = useToast();

  // ponytail: lazy import para evitar circular
  const svc = tutorMode
    ? { getAll: (params?: any) => import('../../tutor/services/tutorService').then(m => m.tutorService.getActivityLogsByPractice(params?.practiceId)),
        create: (data: any) => import('../../tutor/services/tutorService').then(m => m.tutorService.createActivityLog(data)) }
    : activityLogsService;

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
      const response = await svc.getAll(effectiveParams);
      if (response.success) {
        setLogs(response.data);
      }
    } catch (error) {
      console.error('[useActivityLogs] Error fetching logs:', error);
      addToast(TOAST.loadError());
    } finally {
      setLoading(false);
    }
  }, [tutorMode]);

  const fetchStats = useCallback(async (practiceId: number) => {
    if (tutorMode) return; // no stats endpoint for tutors
    try {
      const response = await activityLogsService.getStats(practiceId);
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('[useActivityLogs] Error fetching stats:', error);
    }
  }, [tutorMode]);

  const createLog = useCallback(async (data: CreateActivityLogPayload): Promise<boolean> => {
    setLoadingAction(true);
    try {
      const response = await svc.create(data);
      if (response.success) {
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
  }, [fetchLogs, tutorMode]);

  const updateLog = useCallback(async (id: number, data: UpdateActivityLogPayload): Promise<boolean> => {
    if (tutorMode) return false;
    setLoadingAction(true);
    try {
      const response = await activityLogsService.update(id, data);
      if (response.success) {
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
  }, [fetchLogs, tutorMode]);

  const deleteLog = useCallback(async (id: number): Promise<boolean> => {
    if (tutorMode) return false;
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
  }, [fetchLogs, tutorMode]);

  const approveLog = useCallback(async (id: number, comments?: string): Promise<boolean> => {
    if (tutorMode) return false;
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
  }, [fetchLogs, tutorMode]);

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

export default useActivityLogs;
