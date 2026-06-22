import { useEffect, useState, useMemo, useCallback } from 'react';
import ComponentCard from '../../../components/common/ComponentCard';
import Badge from '../../../components/ui/badge/Badge';
import type { BadgeColor } from '../../../components/ui/badge/Badge';
import { Pagination } from '../../../components/ui/table';
import { matchSearch as fuzzyMatch } from '../../../utils/searchNormalizer';
import apiClient from '../../../api/apiClient';
import { formatDate } from './utils';
import { AuditFilters } from './AuditFilters';

// Types
interface ChangeLog {
  id: number;
  dateTime: string;
  tableName: string;
  tableLabel: string;
  columnName: string;
  operation: string;
  userId: number;
  userName: string;
  userCi: string;
  oldValue: string;
  newValue: string;
  ipAddress: string;
  recordId: number;
}

interface ChangeStats {
  total: number;
  inserts: number;
  updates: number;
  deletes: number;
}

interface ChangeLogFilters {
  tableName: string;
  operation: string;
  searchTerm: string;
  startDate: string;
  endDate: string;
}

const OPERATION_CONFIGS: Record<string, { label: string; color: BadgeColor }> = {
  INSERT: { label: 'Creación', color: 'success' },
  UPDATE: { label: 'Actualización', color: 'warning' },
  DELETE: { label: 'Eliminación', color: 'error' },
};

interface DbChangesTabProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (val: string) => void;
  onDateToChange: (val: string) => void;
  onClearDates: () => void;
}

export function DbChangesTab({ dateFrom, dateTo, onDateFromChange, onDateToChange, onClearDates }: DbChangesTabProps) {
  const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([]);
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeTotal, setChangeTotal] = useState(0);
  const [changePage, setChangePage] = useState(1);
  const [changeItemsPerPage, setChangeItemsPerPage] = useState(10);
  const [changeFilters, setChangeFilters] = useState<ChangeLogFilters>({
    tableName: '',
    operation: '',
    searchTerm: '',
    startDate: '',
    endDate: '',
  });
  const [tables, setTables] = useState<{ value: string; label: string }[]>([]);
  const [changeStats, setChangeStats] = useState<ChangeStats>({ total: 0, inserts: 0, updates: 0, deletes: 0 });

  // Reset page when date changes
  useEffect(() => {
    setChangePage(1);
  }, [dateFrom, dateTo]);

  // Fetch Change Logs
  const fetchChangeLogs = useCallback(async () => {
    setChangeLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', String(changeItemsPerPage));
      params.append('offset', String((changePage - 1) * changeItemsPerPage));
      if (changeFilters.tableName) params.append('tableName', changeFilters.tableName);
      if (changeFilters.operation) params.append('operation', changeFilters.operation);
      if (changeFilters.startDate) params.append('startDate', changeFilters.startDate);
      if (changeFilters.endDate) params.append('endDate', changeFilters.endDate);

      const [logsResponse, statsResponse, tablesResponse] = await Promise.all([
        apiClient.get(`/audit?${params.toString()}`),
        apiClient.get('/audit/stats?days=7'),
        apiClient.get('/audit/tables'),
      ]);

      if (logsResponse.data.success) {
        setChangeLogs(logsResponse.data.data || []);
        setChangeTotal(logsResponse.data.meta?.total || 0);
      }

      if (statsResponse.data.success) {
        const stats = statsResponse.data.data;
        setChangeStats({
          total: stats.totalChanges || 0,
          inserts: stats.operations?.INSERT || 0,
          updates: stats.operations?.UPDATE || 0,
          deletes: stats.operations?.DELETE || 0,
        });
      }

      if (tablesResponse.data.success) {
        const validTables = (tablesResponse.data.data || [])
          .filter((t: any) => t.name || t.physicalName)
          .map((t: any, idx: number) => ({
            value: t.physicalName || t.name || `table-${idx}`,
            label: t.name || t.physicalName || `Tabla ${idx + 1}`,
          }));
        setTables(validTables);
      }
    } catch (error) {
      console.error('[Auditoria] Error fetching change logs:', error);
    } finally {
      setChangeLoading(false);
    }
  }, [changePage, changeFilters, changeItemsPerPage]);

  // Fetch on mount
  useEffect(() => {
    fetchChangeLogs();
  }, [fetchChangeLogs]);

  // Reset page when filters change
  useEffect(() => {
    setChangePage(1);
  }, [changeFilters]);

  // Filtered data
  const filteredChangeLogs = useMemo(() => {
    return changeLogs.filter((log) => {
      const matchesSearchText =
        !changeFilters.searchTerm ||
        fuzzyMatch(log.tableLabel ?? '', changeFilters.searchTerm) ||
        fuzzyMatch(log.columnName ?? '', changeFilters.searchTerm) ||
        fuzzyMatch(log.userName ?? '', changeFilters.searchTerm);

      const matchDate = (() => {
        if (!dateFrom && !dateTo) return true;
        const logDate = log.dateTime ? new Date(log.dateTime) : null;
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

      return matchesSearchText && matchDate;
    });
  }, [changeLogs, changeFilters, dateFrom, dateTo]);

  const pagedChangeLogs = useMemo(() => filteredChangeLogs, [filteredChangeLogs]);

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <ComponentCard title="Total Cambios">
          <div className="text-center">
            <p className="text-2xl font-bold text-brand-500">{changeStats.total}</p>
            <p className="text-xs text-gray-500">últimos 7 días</p>
          </div>
        </ComponentCard>
        <ComponentCard title="Creaciones">
          <div className="text-center">
            <p className="text-2xl font-bold text-success-500">{changeStats.inserts}</p>
            <p className="text-xs text-gray-500">INSERT</p>
          </div>
        </ComponentCard>
        <ComponentCard title="Actualizaciones">
          <div className="text-center">
            <p className="text-2xl font-bold text-warning-500">{changeStats.updates}</p>
            <p className="text-xs text-gray-500">UPDATE</p>
          </div>
        </ComponentCard>
        <ComponentCard title="Eliminaciones">
          <div className="text-center">
            <p className="text-2xl font-bold text-error-500">{changeStats.deletes}</p>
            <p className="text-xs text-gray-500">DELETE</p>
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
        searchTerm={changeFilters.searchTerm}
        onSearchChange={(val) => setChangeFilters((prev) => ({ ...prev, searchTerm: val }))}
        searchPlaceholder="Buscar..."
        filters={[
          {
            value: changeFilters.tableName,
            onChange: (val) => setChangeFilters((prev) => ({ ...prev, tableName: val })),
            options: [{ value: '', label: 'Todas las tablas' }, ...tables],
            placeholder: 'Tabla',
          },
          {
            value: changeFilters.operation,
            onChange: (val) => setChangeFilters((prev) => ({ ...prev, operation: val })),
            options: [
              { value: '', label: 'Todas las operaciones' },
              { value: 'INSERT', label: 'Creación' },
              { value: 'UPDATE', label: 'Actualización' },
              { value: 'DELETE', label: 'Eliminación' },
            ],
            placeholder: 'Operación',
          },
        ]}
        onRefresh={fetchChangeLogs}
        loading={changeLoading}
      />

      {/* Change Logs Table */}
      <ComponentCard title={`Cambios en Base de Datos (${changeTotal} registros)`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Fecha/Hora</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Tabla</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Columna</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Operación</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Usuario</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Valor Anterior</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Valor Nuevo</th>
              </tr>
            </thead>
            <tbody>
              {changeLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="py-4">
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : pagedChangeLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    No hay registros de cambios en la base de datos
                  </td>
                </tr>
              ) : (
                pagedChangeLogs.map((log, index) => {
                  const config = OPERATION_CONFIGS[log.operation] || {
                    label: log.operation,
                    color: 'primary' as BadgeColor,
                  };
                  return (
                    <tr
                      key={log.id || `change-${index}`}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5"
                    >
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                        {formatDate(log.dateTime)}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">{log.tableLabel}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{log.columnName}</td>
                      <td className="py-3 px-4">
                        <Badge variant="light" color={config.color}>
                          {config.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{log.userName}</td>
                      <td className="py-3 px-4 text-sm text-gray-500 max-w-xs truncate">{log.oldValue || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-500 max-w-xs truncate">{log.newValue || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={changePage}
          totalPages={Math.ceil(changeTotal / changeItemsPerPage) || 1}
          totalItems={changeTotal}
          itemsPerPage={changeItemsPerPage}
          onPageChange={setChangePage}
          onItemsPerPageChange={(newItems) => {
            setChangeItemsPerPage(newItems);
            setChangePage(1);
          }}
          itemsPerPageOptions={[10, 25, 50]}
        />
      </ComponentCard>
    </>
  );
}
