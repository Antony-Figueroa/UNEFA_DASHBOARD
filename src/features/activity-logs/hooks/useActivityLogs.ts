import { useState, useCallback } from 'react';
import activityLogsService from '../services/activityLogsService';
import {
  ActivityLog,
  CreateActivityLogPayload,
  UpdateActivityLogPayload,
  ActivityLogStats
} from '../types';
import toast from 'react-hot-toast';

export const useActivityLogs = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<ActivityLogStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async (params?: {
    practiceId?: number;
    studentId?: number;
    type?: string;
    week?: number;
    status?: string;
  }) => {
    setLoading(true);
    try {
      const response = await activityLogsService.getAll(params);
      if (response.success) {
        setLogs(response.data);
      }
    } catch (error) {
      console.error('[useActivityLogs] Error fetching logs:', error);
      toast.error('Error al cargar los registros de actividad');
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
    try {
      const response = await activityLogsService.create(data);
      if (response.success) {
        setLogs(prev => [response.data, ...prev]);
        toast.success('Registro de actividad creado exitosamente');
        return true;
      }
      return false;
    } catch (error) {
      console.error('[useActivityLogs] Error creating log:', error);
      toast.error('Error al crear el registro de actividad');
      return false;
    }
  }, []);

  const updateLog = useCallback(async (id: number, data: UpdateActivityLogPayload): Promise<boolean> => {
    try {
      const response = await activityLogsService.update(id, data);
      if (response.success) {
        setLogs(prev => prev.map(log => 
          log.activityLogId === id ? response.data : log
        ));
        toast.success('Registro de actividad actualizado exitosamente');
        return true;
      }
      return false;
    } catch (error) {
      console.error('[useActivityLogs] Error updating log:', error);
      toast.error('Error al actualizar el registro de actividad');
      return false;
    }
  }, []);

  const deleteLog = useCallback(async (id: number): Promise<boolean> => {
    try {
      await activityLogsService.delete(id);
      setLogs(prev => prev.filter(log => log.activityLogId !== id));
      toast.success('Registro de actividad eliminado exitosamente');
      return true;
    } catch (error) {
      console.error('[useActivityLogs] Error deleting log:', error);
      toast.error('Error al eliminar el registro de actividad');
      return false;
    }
  }, []);

  const approveLog = useCallback(async (id: number, comments?: string): Promise<boolean> => {
    try {
      const response = await activityLogsService.approve(id, comments);
      if (response.success) {
        setLogs(prev => prev.map(log => 
          log.activityLogId === id ? response.data : log
        ));
        toast.success('Registro de actividad aprobado exitosamente');
        return true;
      }
      return false;
    } catch (error) {
      console.error('[useActivityLogs] Error approving log:', error);
      toast.error('Error al aprobar el registro de actividad');
      return false;
    }
  }, []);

  return {
    logs,
    stats,
    loading,
    fetchLogs,
    fetchStats,
    createLog,
    updateLog,
    deleteLog,
    approveLog
  };
};
