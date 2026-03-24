import { useState, useCallback } from 'react';
import auditLogsService from '../services/auditLogsService';
import { AuditLog, AuditStats, AuditTable, GetAuditLogsParams } from '../types';
import toast from 'react-hot-toast';

export const useAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [tables, setTables] = useState<AuditTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchLogs = useCallback(async (params?: GetAuditLogsParams) => {
    setLoading(true);
    try {
      const response = await auditLogsService.getAll(params);
      if (response.success) {
        setLogs(response.data);
        setTotal(response.meta.total);
        setCurrentPage(Math.floor(response.meta.offset / response.meta.limit) + 1);
      }
    } catch (error) {
      console.error('[useAuditLogs] Error fetching logs:', error);
      toast.error('Error al cargar los logs de auditoría');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async (days?: number) => {
    try {
      const response = await auditLogsService.getStats(days);
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('[useAuditLogs] Error fetching stats:', error);
    }
  }, []);

  const fetchTables = useCallback(async () => {
    try {
      const response = await auditLogsService.getTables();
      if (response.success) {
        setTables(response.data);
      }
    } catch (error) {
      console.error('[useAuditLogs] Error fetching tables:', error);
    }
  }, []);

  const fetchRecordHistory = useCallback(async (tableName: string, recordId: number) => {
    setLoading(true);
    try {
      const response = await auditLogsService.getRecordHistory(tableName, recordId);
      if (response.success) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('[useAuditLogs] Error fetching record history:', error);
      toast.error('Error al cargar el historial del registro');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const totalPages = Math.ceil(total / 50);

  return {
    logs,
    stats,
    tables,
    loading,
    total,
    currentPage,
    totalPages,
    fetchLogs,
    fetchStats,
    fetchTables,
    fetchRecordHistory
  };
};
