import { useEffect, useState, useMemo, useCallback } from 'react';
import ComponentCard from '../../../components/common/ComponentCard';
import Badge from '../../../components/ui/badge/Badge';
import type { BadgeColor } from '../../../components/ui/badge/Badge';
import Button from '../../../components/ui/button/Button';
import { Pagination } from '../../../components/ui/table';
import { CheckCircleIcon } from '../../../icons/actions';
import { matchSearch as fuzzyMatch } from '../../../utils/searchNormalizer';
import apiClient from '../../../api/apiClient';
import type { ActivityLog } from '../types';
import { AuditFilters } from './AuditFilters';

interface ActivityStats {
  total: number;
  hours: number;
  approved: number;
  pending: number;
}

interface ActivityLogFilters {
  activityType: string;
  status: string;
  searchTerm: string;
  startDate: string;
  endDate: string;
}

interface ActivityLogTabProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (val: string) => void;
  onDateToChange: (val: string) => void;
  onClearDates: () => void;
}

export function ActivityLogTab({ dateFrom, dateTo, onDateFromChange, onDateToChange, onClearDates }: ActivityLogTabProps) {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityPage, setActivityPage] = useState(1);
  const [activityItemsPerPage, setActivityItemsPerPage] = useState(10);
  const [activityFilters, setActivityFilters] = useState<ActivityLogFilters>({
    activityType: '',
    status: '',
    searchTerm: '',
    startDate: '',
    endDate: '',
  });
  const [activityStats, setActivityStats] = useState<ActivityStats>({ total: 0, hours: 0, approved: 0, pending: 0 });

  // Reset page when date changes
  useEffect(() => {
    setActivityPage(1);
  }, [dateFrom, dateTo]);

  // Fetch Activity Logs
  const fetchActivityLogs = useCallback(async () => {
    setActivityLoading(true);
    try {
      const response = await apiClient.get('/activity-logs');
      if (response.data.success) {
        const logs = response.data.data || [];
        setActivityLogs(logs);

        const totalHours = logs.reduce((sum: number, l: ActivityLog) => sum + (l.hoursWorked || 0), 0);
        setActivityStats({
          total: logs.length,
          hours: totalHours,
          approved: logs.filter((l: ActivityLog) => l.supervisorApproved).length,
          pending: logs.filter((l: ActivityLog) => !l.supervisorApproved).length,
        });
      }
    } catch (error) {
      console.error('[Auditoria] Error fetching activity logs:', error);
    } finally {
      setActivityLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchActivityLogs();
  }, [fetchActivityLogs]);

  // Reset page when filters change
  useEffect(() => {
    setActivityPage(1);
  }, [activityFilters]);

  // Filtered data
  const filteredActivityLogs = useMemo(() => {
    return activityLogs.filter((log) => {
      const matchType = !activityFilters.activityType || log.activityType === activityFilters.activityType;
      const matchStatus =
        activityFilters.status === '' ||
        (activityFilters.status === 'approved' && log.supervisorApproved) ||
        (activityFilters.status === 'pending' && !log.supervisorApproved);
      const matchesSearchText =
        !activityFilters.searchTerm ||
        fuzzyMatch(log.activityDescription ?? '', activityFilters.searchTerm) ||
        fuzzyMatch(log.studentName ?? '', activityFilters.searchTerm);

      const matchDate = (() => {
        if (!dateFrom && !dateTo) return true;
        const logDate = log.createdAt ? new Date(log.createdAt) : null;
        if (!logDate || isNaN(logDate.getTime())) return true;
        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          if (logDate < fromDate) return false;
        }
        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          if (logDate > toDate) return false;
        }
        return true;
      })();

      return matchType && matchStatus && matchesSearchText && matchDate;
    });
  }, [activityLogs, activityFilters, dateFrom, dateTo]);

  // Paged data
  const pagedActivityLogs = useMemo(() => {
    const start = (activityPage - 1) * activityItemsPerPage;
    return filteredActivityLogs.slice(start, start + activityItemsPerPage);
  }, [filteredActivityLogs, activityPage, activityItemsPerPage]);

  const handleApproveActivity = async (log: ActivityLog) => {
    try {
      await apiClient.put(`/activity-logs/${log.activityLogId}/approve`, {
        supervisorApproved: true,
      });
      fetchActivityLogs();
    } catch (error) {
      console.error('Error approving activity:', error);
    }
  };

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <ComponentCard title="Total Registros">
          <div className="text-center">
            <p className="text-2xl font-bold text-brand-500">{activityStats.total}</p>
            <p className="text-xs text-gray-500">registros</p>
          </div>
        </ComponentCard>
        <ComponentCard title="Total Horas">
          <div className="text-center">
            <p className="text-2xl font-bold text-info-500">{activityStats.hours}</p>
            <p className="text-xs text-gray-500">horas</p>
          </div>
        </ComponentCard>
        <ComponentCard title="Aprobados">
          <div className="text-center">
            <p className="text-2xl font-bold text-success-500">{activityStats.approved}</p>
            <p className="text-xs text-gray-500">aprobados</p>
          </div>
        </ComponentCard>
        <ComponentCard title="Pendientes">
          <div className="text-center">
            <p className="text-2xl font-bold text-warning-500">{activityStats.pending}</p>
            <p className="text-xs text-gray-500">pendientes</p>
          </div>
        </ComponentCard>
      </div>

      {/* Filters */}
      <AuditFilters
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={onDateFromChange}
        onDateToChange={onDateToChange}
        onClearDates={onClearDates}
        searchTerm={activityFilters.searchTerm}
        onSearchChange={(val) => setActivityFilters((prev) => ({ ...prev, searchTerm: val }))}
        searchPlaceholder="Buscar estudiante o descripción..."
        filters={[
          {
            value: activityFilters.activityType,
            onChange: (val) => setActivityFilters((prev) => ({ ...prev, activityType: val })),
            options: [
              { value: '', label: 'Todos los tipos' },
              { value: 'DIARIA', label: 'Diaria' },
              { value: 'SEMANAL', label: 'Semanal' },
            ],
            placeholder: 'Tipo',
          },
          {
            value: activityFilters.status,
            onChange: (val) => setActivityFilters((prev) => ({ ...prev, status: val })),
            options: [
              { value: '', label: 'Todos los estados' },
              { value: 'approved', label: 'Aprobados' },
              { value: 'pending', label: 'Pendientes' },
            ],
            placeholder: 'Estado',
          },
        ]}
        onRefresh={fetchActivityLogs}
        loading={activityLoading}
      />

      {/* Activity Logs Table */}
      <ComponentCard title={`Bitácora de Actividades (${filteredActivityLogs.length} registros)`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Estudiante</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Fecha</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Semana</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Tipo</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Horas</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Descripción</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Estado</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {activityLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="py-4">
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : pagedActivityLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    No hay registros de actividad
                  </td>
                </tr>
              ) : (
                pagedActivityLogs.map((log, index) => (
                  <tr
                    key={log.activityLogId || `activity-${index}`}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{log.studentName || '-'}</p>
                        <p className="text-xs text-gray-500">{log.studentCi}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(log.activityDate).toLocaleDateString('es-VE')}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{log.weekNumber || '-'}</td>
                    <td className="py-3 px-4">
                      <Badge variant="light" color={log.activityType === 'DIARIA' ? 'info' : 'warning'}>
                        {log.activityType === 'DIARIA' ? 'Diaria' : 'Semanal'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm font-medium">{log.hoursWorked}h</td>
                    <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">{log.activityDescription}</td>
                    <td className="py-3 px-4">
                      <Badge variant="light" color={log.supervisorApproved ? 'success' : 'warning'}>
                        {log.supervisorApproved ? 'Aprobado' : 'Pendiente'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!log.supervisorApproved && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleApproveActivity(log)}
                          className="text-success-600 hover:text-success-700"
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={activityPage}
          totalPages={Math.ceil(filteredActivityLogs.length / activityItemsPerPage) || 1}
          totalItems={filteredActivityLogs.length}
          itemsPerPage={activityItemsPerPage}
          onPageChange={setActivityPage}
          onItemsPerPageChange={(newItems) => {
            setActivityItemsPerPage(newItems);
            setActivityPage(1);
          }}
          itemsPerPageOptions={[10, 25, 50]}
        />
      </ComponentCard>
    </>
  );
}
