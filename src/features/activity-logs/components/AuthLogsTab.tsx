import { useEffect, useState, useMemo, useCallback } from 'react';
import ComponentCard from '../../../components/common/ComponentCard';
import Badge from '../../../components/ui/badge/Badge';
import type { BadgeColor } from '../../../components/ui/badge/Badge';
import { Pagination } from '../../../components/ui/table';
import { matchSearch as fuzzyMatch } from '../../../utils/searchNormalizer';
import apiClient from '../../../api/apiClient';
import { formatDate } from './utils';
import { AuditFilters } from './AuditFilters';
import type { AuditFiltersProps } from './AuditFilters';

// Types
interface AuthLog {
  AUTH_LOG_ID: number;
  USER_ID: number;
  USER_CI: string;
  ACTION: string;
  IP_ADDRESS: string;
  USER_AGENT: string;
  DETAILS: string;
  CREATION_DATE: string;
  user?: {
    NAME: string;
    SURNAME: string;
    USER_CI: string;
  };
}

interface AuthStats {
  total: number;
  success: number;
  failed: number;
  today: number;
}

interface AuthLogFilters {
  action: string;
  searchTerm: string;
  startDate: string;
  endDate: string;
}

const ACTION_CONFIGS: Record<string, { label: string; color: BadgeColor }> = {
  LOGIN_SUCCESS: { label: 'Inicio de sesión exitoso', color: 'success' },
  LOGIN_FAILED: { label: 'Inicio de sesión fallido', color: 'error' },
  LOGOUT: { label: 'Cierre de sesión', color: 'info' },
  SESSION_EXPIRED: { label: 'Sesión Expirada', color: 'warning' },
  ACCOUNT_LOCKED: { label: 'Cuenta Bloqueada', color: 'error' },
  PASSWORD_RESET_REQUESTED: { label: 'Restablecimiento solicitado', color: 'warning' },
  PASSWORD_RESET_COMPLETED: { label: 'Restablecimiento completado', color: 'success' },
  CREATE_USER: { label: 'Usuario Creado', color: 'success' },
  UPDATE_USER: { label: 'Usuario Actualizado', color: 'info' },
  DELETE_USER: { label: 'Usuario Eliminado', color: 'error' },
};

interface AuthLogsTabProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (val: string) => void;
  onDateToChange: (val: string) => void;
  onClearDates: () => void;
}

export function AuthLogsTab({ dateFrom, dateTo, onDateFromChange, onDateToChange, onClearDates }: AuthLogsTabProps) {
  const [authLogs, setAuthLogs] = useState<AuthLog[]>([]);
  const [authLoading, setAuthLoading] = useState(false);
  const [authTotal, setAuthTotal] = useState(0);
  const [authPage, setAuthPage] = useState(1);
  const [authItemsPerPage, setAuthItemsPerPage] = useState(10);
  const [authFilters, setAuthFilters] = useState<AuthLogFilters>({
    action: '',
    searchTerm: '',
    startDate: '',
    endDate: '',
  });
  const [authStats, setAuthStats] = useState<AuthStats>({ total: 0, success: 0, failed: 0, today: 0 });

  // Reset page when date changes
  useEffect(() => {
    setAuthPage(1);
  }, [dateFrom, dateTo]);

  // Fetch Auth Logs
  const fetchAuthLogs = useCallback(async () => {
    setAuthLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', '10000');
      if (authFilters.action) params.append('action', authFilters.action);
      if (authFilters.searchTerm) params.append('search', authFilters.searchTerm);

      const response = await apiClient.get(`/auth/all-logs?${params.toString()}`);
      if (response.data.success) {
        const allLogs = response.data.data || [];
        const total = response.data.meta?.total || allLogs.length;

        setAuthLogs(allLogs);
        setAuthTotal(total);

        const today = new Date().toDateString();
        const successLogs = allLogs.filter(
          (l: AuthLog) => l.ACTION === 'LOGIN_SUCCESS' || l.ACTION === 'LOGIN' || l.ACTION === 'success',
        );
        const failedLogs = allLogs.filter(
          (l: AuthLog) => l.ACTION === 'LOGIN_FAILED' || l.ACTION === 'failed' || l.ACTION === 'LOGIN_ERROR',
        );

        setAuthStats({
          total,
          success: successLogs.length,
          failed: failedLogs.length,
          today: allLogs.filter((l: AuthLog) => new Date(l.CREATION_DATE).toDateString() === today).length,
        });
      }
    } catch (error) {
      console.error('[Auditoria] Error fetching auth logs:', error);
    } finally {
      setAuthLoading(false);
    }
  }, [authFilters]);

  // Fetch on mount
  useEffect(() => {
    fetchAuthLogs();
  }, [fetchAuthLogs]);

  // Reset page when filters change
  useEffect(() => {
    setAuthPage(1);
  }, [authFilters]);

  // Filtered data
  const filteredAuthLogs = useMemo(() => {
    return authLogs.filter((log) => {
      const matchAction = !authFilters.action || log.ACTION === authFilters.action;
      const matchesSearchText =
        !authFilters.searchTerm ||
        fuzzyMatch(log.USER_CI ?? '', authFilters.searchTerm) ||
        fuzzyMatch(log.DETAILS ?? '', authFilters.searchTerm) ||
        fuzzyMatch(log.user?.NAME ?? '', authFilters.searchTerm);

      const matchDate = (() => {
        if (!dateFrom && !dateTo) return true;
        const logDate = log.CREATION_DATE ? new Date(log.CREATION_DATE) : null;
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

      return matchAction && matchesSearchText && matchDate;
    });
  }, [authLogs, authFilters, dateFrom, dateTo]);

  // Paged data
  const pagedAuthLogs = useMemo(() => {
    const start = (authPage - 1) * authItemsPerPage;
    return filteredAuthLogs.slice(start, start + authItemsPerPage);
  }, [filteredAuthLogs, authPage, authItemsPerPage]);

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <ComponentCard title="Total de registros">
          <div className="text-center">
            <p className="text-2xl font-bold text-brand-500">{authStats.total}</p>
            <p className="text-xs text-gray-500">registros</p>
          </div>
        </ComponentCard>
        <ComponentCard title="Inicios de sesión exitosos">
          <div className="text-center">
            <p className="text-2xl font-bold text-success-500">{authStats.success}</p>
            <p className="text-xs text-gray-500">exitosos</p>
          </div>
        </ComponentCard>
        <ComponentCard title="Inicios de sesión fallidos">
          <div className="text-center">
            <p className="text-2xl font-bold text-error-500">{authStats.failed}</p>
            <p className="text-xs text-gray-500">fallidos</p>
          </div>
        </ComponentCard>
        <ComponentCard title="Hoy">
          <div className="text-center">
            <p className="text-2xl font-bold text-info-500">{authStats.today}</p>
            <p className="text-xs text-gray-500">eventos</p>
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
        searchTerm={authFilters.searchTerm}
        onSearchChange={(val) => setAuthFilters((prev) => ({ ...prev, searchTerm: val }))}
        searchPlaceholder="Buscar por CI, usuario o detalles..."
        filters={[
          {
            value: authFilters.action,
            onChange: (val) => setAuthFilters((prev) => ({ ...prev, action: val })),
            options: [
              { value: '', label: 'Todas las acciones' },
              ...Object.entries(ACTION_CONFIGS).map(([key, config]) => ({
                value: key,
                label: config.label,
              })),
            ],
            placeholder: 'Acción',
          },
        ]}
        onRefresh={fetchAuthLogs}
        loading={authLoading}
      />

      {/* Auth Logs Table */}
      <ComponentCard title={`Registros de autenticación (${filteredAuthLogs.length} de ${authTotal} registros)`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Fecha/Hora</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Usuario</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">CI</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Acción</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">IP</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Detalles</th>
              </tr>
            </thead>
            <tbody>
              {authLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="py-4">
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : pagedAuthLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    No hay registros de autenticación
                  </td>
                </tr>
              ) : (
                pagedAuthLogs.map((log, index) => {
                  const config = ACTION_CONFIGS[log.ACTION] || { label: log.ACTION, color: 'primary' as BadgeColor };
                  return (
                    <tr
                      key={log.AUTH_LOG_ID || `auth-${index}`}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5"
                    >
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                        {formatDate(log.CREATION_DATE)}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {log.user ? `${log.user.NAME} ${log.user.SURNAME}` : '-'}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{log.USER_CI}</td>
                      <td className="py-3 px-4">
                        <Badge variant="light" color={config.color}>
                          {config.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500 font-mono">{log.IP_ADDRESS}</td>
                      <td className="py-3 px-4 text-sm text-gray-500 max-w-xs truncate">{log.DETAILS}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={authPage}
          totalPages={Math.ceil(filteredAuthLogs.length / authItemsPerPage) || 1}
          totalItems={filteredAuthLogs.length}
          itemsPerPage={authItemsPerPage}
          onPageChange={setAuthPage}
          onItemsPerPageChange={(newItems) => {
            setAuthItemsPerPage(newItems);
            setAuthPage(1);
          }}
          itemsPerPageOptions={[10, 25, 50]}
        />
      </ComponentCard>
    </>
  );
}
