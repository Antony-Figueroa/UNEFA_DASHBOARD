/**
 * @file AuditoriaPage.tsx
 * @description Página unificada de Auditoría - Combina Autenticación, Cambios BD y Bitácora de Actividades
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import Button from '../../components/ui/button/Button';
import Badge from '../../components/ui/badge/Badge';
import type { BadgeColor } from '../../components/ui/badge/Badge';
import Input from '../../components/form/input/InputField';
import CustomSelect from '../../components/form/CustomSelect';
import { Pagination } from '../../components/ui/table';
import apiClient from '../../api/apiClient';

// Icons
import { 
  CheckCircleIcon, 
  RefreshIcon,
  SearchIcon,
  EyeIcon,
  EditIcon,
  CalendarIcon
} from '../../icons/actions';

// Types
type TabType = 'auth' | 'changes' | 'activities';

interface FilterConfig {
  value: string;
  onChange: (val: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
  className?: string;
}

interface AuditFiltersProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (val: string) => void;
  onDateToChange: (val: string) => void;
  onClearDates: () => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder: string;
  filters: FilterConfig[];
  onRefresh: () => void;
  loading?: boolean;
}

/**
 * Reusable Audit Filter Section Component
 * Provides consistent filter layout across all tabs with:
 * - Compact inline date range
 * - Responsive search + dropdown grid
 * - Proper spacing and alignment
 */
const AuditFilters: React.FC<AuditFiltersProps> = ({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onClearDates,
  searchTerm,
  onSearchChange,
  searchPlaceholder,
  filters,
  onRefresh,
  loading = false
}) => {
  return (
    <div className="space-y-4">
      {/* Row 1: Date Range - compact inline */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[140px] max-w-[180px]">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">
            Desde
          </label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="h-10 text-sm"
          />
        </div>
        <div className="flex-1 min-w-[140px] max-w-[180px]">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">
            Hasta
          </label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="h-10 text-sm"
          />
        </div>
        {(dateFrom || dateTo) && (
          <button
            onClick={onClearDates}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 underline mb-2"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Row 2: Search + Dropdowns - responsive grid */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10"
          />
        </div>
        {filters.map((filter, index) => (
          <div
            key={index}
            className={filter.className || 'w-full sm:w-[180px]'}
          >
            <CustomSelect
              options={filter.options}
              placeholder={filter.placeholder}
              onChange={(val) => filter.onChange(val as string)}
              value={filter.value}
            />
          </div>
        ))}
        <Button
          variant="primary"
          onClick={onRefresh}
          disabled={loading}
          className="h-10"
        >
          <RefreshIcon className="w-4 h-4 mr-1.5" />
          Actualizar
        </Button>
      </div>
    </div>
  );
};

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

interface ActivityLog {
  activityLogId: number;
  professionalPracticeId: number;
  studentId: number;
  studentName?: string;
  studentCi?: string;
  activityDate: string;
  weekNumber: number | null;
  hoursWorked: number;
  activityType: 'DIARIA' | 'SEMANAL';
  activityDescription: string;
  tasksCompleted: string;
  challenges: string;
  learnings: string;
  supervisorComments: string;
  supervisorApproved: boolean;
  supervisorId: number | null;
  approvedAt: string | null;
  status: number;
  createdAt: string;
}

const ACTION_CONFIGS: Record<string, { label: string; color: BadgeColor }> = {
  'LOGIN_SUCCESS': { label: 'Login Exitoso', color: 'success' },
  'LOGIN_FAILED': { label: 'Login Fallido', color: 'error' },
  'LOGOUT': { label: 'Logout', color: 'info' },
  'SESSION_EXPIRED': { label: 'Sesión Expirada', color: 'warning' },
  'ACCOUNT_LOCKED': { label: 'Cuenta Bloqueada', color: 'error' },
  'PASSWORD_RESET_REQUESTED': { label: 'Reset Solicitado', color: 'warning' },
  'PASSWORD_RESET_COMPLETED': { label: 'Reset Completado', color: 'success' },
  'CREATE_USER': { label: 'Usuario Creado', color: 'success' },
  'UPDATE_USER': { label: 'Usuario Actualizado', color: 'info' },
  'DELETE_USER': { label: 'Usuario Eliminado', color: 'error' },
};

const OPERATION_CONFIGS: Record<string, { label: string; color: BadgeColor }> = {
  'INSERT': { label: 'Creación', color: 'success' },
  'UPDATE': { label: 'Actualización', color: 'warning' },
  'DELETE': { label: 'Eliminación', color: 'error' },
};

export default function AuditoriaPage() {
  const [activeTab, setActiveTab] = useState<TabType>('auth');
  
  // Auth Logs State
  const [authLogs, setAuthLogs] = useState<AuthLog[]>([]);
  const [authLoading, setAuthLoading] = useState(false);
  const [authTotal, setAuthTotal] = useState(0);
  const [authPage, setAuthPage] = useState(1);
  const [authItemsPerPage, setAuthItemsPerPage] = useState(10);
  const [authFilters, setAuthFilters] = useState({ action: '', searchTerm: '', startDate: '', endDate: '' });
  
  // Change Logs State
  const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([]);
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeTotal, setChangeTotal] = useState(0);
  const [changePage, setChangePage] = useState(1);
  const [changeItemsPerPage, setChangeItemsPerPage] = useState(10);
  const [changeFilters, setChangeFilters] = useState({ tableName: '', operation: '', searchTerm: '', startDate: '', endDate: '' });
  const [tables, setTables] = useState<{ value: string; label: string }[]>([]);
  
  // Activity Logs State
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityPage, setActivityPage] = useState(1);
  const [activityItemsPerPage, setActivityItemsPerPage] = useState(10);
  const [activityFilters, setActivityFilters] = useState({ activityType: '', status: '', searchTerm: '', startDate: '', endDate: '' });

  // Stats
  const [authStats, setAuthStats] = useState({ total: 0, success: 0, failed: 0, today: 0 });
  const [changeStats, setChangeStats] = useState({ total: 0, inserts: 0, updates: 0, deletes: 0 });
  const [activityStats, setActivityStats] = useState({ total: 0, hours: 0, approved: 0, pending: 0 });

  // Date Range Filter State
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Estado para cambios sin ver
  const [lastViewedChange, setLastViewedChange] = useState<string>('');
  const [hasNewChanges, setHasNewChanges] = useState(false);

  // Cargar contadores al inicio (solo para mostrar en tabs)
  useEffect(() => {
    const loadCounts = async () => {
      try {
        // Cargar solo el conteo de cambios en BD (sin datos completos)
        const statsRes = await apiClient.get('/audit/stats?days=7');
        if (statsRes.data.success && statsRes.data.data) {
          setChangeStats({
            total: statsRes.data.data.totalChanges || 0,
            inserts: statsRes.data.data.operations?.INSERT || 0,
            updates: statsRes.data.data.operations?.UPDATE || 0,
            deletes: statsRes.data.data.operations?.DELETE || 0
          });
          // Obtener la fecha del último cambio para comparar
          const logsRes = await apiClient.get('/audit?limit=1');
          if (logsRes.data.success && logsRes.data.data?.length > 0) {
            const lastDate = logsRes.data.data[0].dateTime;
            const lastViewed = localStorage.getItem('lastViewedChangeLog');
            if (lastViewed && lastDate > lastViewed) {
              setHasNewChanges(true);
            }
          }
        }
        
        // Cargar stats de auth
        const authRes = await apiClient.get('/auth/all-logs?limit=1');
        if (authRes.data.success) {
          setAuthStats(prev => ({ ...prev, total: authRes.data.meta?.total || 0 }));
        }
        
        // Cargar stats de activity
        const actRes = await apiClient.get('/activity-logs?limit=1');
        if (actRes.data.success) {
          setActivityStats(prev => ({ ...prev, total: actRes.data.meta?.total || 0 }));
        }
      } catch (error) {
        console.error('[Auditoria] Error cargando contadores:', error);
      }
    };
    
    loadCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset page when date filters change
  useEffect(() => {
    setAuthPage(1);
    setChangePage(1);
    setActivityPage(1);
  }, [dateFrom, dateTo]);

  // Fetch Auth Logs - loads ALL data for accurate stats
  const fetchAuthLogs = useCallback(async () => {
    setAuthLoading(true);
    try {
      // Fetch ALL logs (high limit) to calculate accurate stats
      const params = new URLSearchParams();
      params.append('limit', '10000'); // Get all records for accurate stats
      if (authFilters.action) params.append('action', authFilters.action);
      if (authFilters.searchTerm) params.append('search', authFilters.searchTerm);
      
      const response = await apiClient.get(`/auth/all-logs?${params.toString()}`);
      if (response.data.success) {
        const allLogs = response.data.data || [];
        const total = response.data.meta?.total || allLogs.length;
        
        // Store all logs
        setAuthLogs(allLogs);
        setAuthTotal(total);
        
        // Calculate stats from ALL data (not just current page)
        const today = new Date().toDateString();
        const successLogs = allLogs.filter((l: AuthLog) => 
          l.ACTION === 'LOGIN_SUCCESS' || 
          l.ACTION === 'LOGIN' ||
          l.ACTION === 'success'
        );
        const failedLogs = allLogs.filter((l: AuthLog) => 
          l.ACTION === 'LOGIN_FAILED' || 
          l.ACTION === 'failed' ||
          l.ACTION === 'LOGIN_ERROR'
        );
        
        setAuthStats({
          total,
          success: successLogs.length,
          failed: failedLogs.length,
          today: allLogs.filter((l: AuthLog) => {
            return new Date(l.CREATION_DATE).toDateString() === today;
          }).length
        });
      }
    } catch (error) {
      console.error('[Auditoria] Error fetching auth logs:', error);
    } finally {
      setAuthLoading(false);
    }
  }, [authFilters]);

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
        apiClient.get('/audit/tables')
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
          deletes: stats.operations?.DELETE || 0
        });
      }
      
      if (tablesResponse.data.success) {
        // Filtrar opciones sin nombre y agregar clave única
        const validTables = (tablesResponse.data.data || [])
          .filter((t: any) => t.name || t.physicalName)
          .map((t: any, idx: number) => ({
            value: t.physicalName || t.name || `table-${idx}`,
            label: t.name || t.physicalName || `Tabla ${idx + 1}`
          }));
        setTables(validTables);
      }
    } catch (error) {
      console.error('[Auditoria] Error fetching change logs:', error);
    } finally {
      setChangeLoading(false);
    }
  }, [changePage, changeFilters]);

  // Fetch Activity Logs
  const fetchActivityLogs = useCallback(async () => {
    setActivityLoading(true);
    try {
      const response = await apiClient.get('/activity-logs');
      if (response.data.success) {
        const logs = response.data.data || [];
        setActivityLogs(logs);
        
        // Calculate stats
        const totalHours = logs.reduce((sum: number, l: ActivityLog) => sum + (l.hoursWorked || 0), 0);
        setActivityStats({
          total: logs.length,
          hours: totalHours,
          approved: logs.filter((l: ActivityLog) => l.supervisorApproved).length,
          pending: logs.filter((l: ActivityLog) => !l.supervisorApproved).length
        });
      }
    } catch (error) {
      console.error('[Auditoria] Error fetching activity logs:', error);
    } finally {
      setActivityLoading(false);
    }
  }, []);

  // Load data based on active tab
  useEffect(() => {
    switch (activeTab) {
      case 'auth':
        fetchAuthLogs();
        break;
      case 'changes':
        fetchChangeLogs();
        break;
      case 'activities':
        fetchActivityLogs();
        break;
    }
  }, [activeTab, fetchAuthLogs, fetchChangeLogs, fetchActivityLogs]);

  // Reset pages when filters change
  useEffect(() => { setAuthPage(1); }, [authFilters]);
  useEffect(() => { setChangePage(1); }, [changeFilters]);
  useEffect(() => { setActivityPage(1); }, [activityFilters]);

  // Filtered data
  const filteredAuthLogs = useMemo(() => {
    return authLogs.filter(log => {
      const matchAction = !authFilters.action || log.ACTION === authFilters.action;
      const matchSearch = !authFilters.searchTerm ||
        log.USER_CI?.toLowerCase().includes(authFilters.searchTerm.toLowerCase()) ||
        log.DETAILS?.toLowerCase().includes(authFilters.searchTerm.toLowerCase()) ||
        log.user?.NAME?.toLowerCase().includes(authFilters.searchTerm.toLowerCase());
      
      // Date range filter
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
      
      return matchAction && matchSearch && matchDate;
    });
  }, [authLogs, authFilters, dateFrom, dateTo]);

  const filteredChangeLogs = useMemo(() => {
    return changeLogs.filter(log => {
      const matchSearch = !changeFilters.searchTerm ||
        log.tableLabel?.toLowerCase().includes(changeFilters.searchTerm.toLowerCase()) ||
        log.columnName?.toLowerCase().includes(changeFilters.searchTerm.toLowerCase()) ||
        log.userName?.toLowerCase().includes(changeFilters.searchTerm.toLowerCase());
      
      // Date range filter
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
      
      return matchSearch && matchDate;
    });
  }, [changeLogs, changeFilters, dateFrom, dateTo]);

  const filteredActivityLogs = useMemo(() => {
    return activityLogs.filter(log => {
      const matchType = !activityFilters.activityType || log.activityType === activityFilters.activityType;
      const matchStatus = activityFilters.status === '' || 
        (activityFilters.status === 'approved' && log.supervisorApproved) ||
        (activityFilters.status === 'pending' && !log.supervisorApproved);
      const matchSearch = !activityFilters.searchTerm ||
        log.activityDescription?.toLowerCase().includes(activityFilters.searchTerm.toLowerCase()) ||
        log.studentName?.toLowerCase().includes(activityFilters.searchTerm.toLowerCase());
      
      // Date range filter
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
      
      return matchType && matchStatus && matchSearch && matchDate;
    });
  }, [activityLogs, activityFilters, dateFrom, dateTo]);

  // Paged data for tables - Auth logs now use CLIENT-SIDE pagination 
  // since we fetch all data for accurate stats
  const pagedAuthLogs = useMemo(() => {
    const start = (authPage - 1) * authItemsPerPage;
    return filteredAuthLogs.slice(start, start + authItemsPerPage);
  }, [filteredAuthLogs, authPage, authItemsPerPage]);

  const pagedChangeLogs = useMemo(() => {
    return filteredChangeLogs; // Server already paginated
  }, [filteredChangeLogs]);

  const pagedActivityLogs = useMemo(() => {
    const start = (activityPage - 1) * activityItemsPerPage;
    return filteredActivityLogs.slice(start, start + activityItemsPerPage);
  }, [filteredActivityLogs, activityPage, activityItemsPerPage]);

  const handleApproveActivity = async (log: ActivityLog) => {
    try {
      await apiClient.put(`/activity-logs/${log.activityLogId}/approve`, {
        supervisorApproved: true
      });
      fetchActivityLogs();
    } catch (error) {
      console.error('Error approving activity:', error);
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    
    try {
      let date: Date;
      
      // Manejar formatos comunes de PostgreSQL: "2024-01-15T10:30:00" o "2024-01-15 10:30:00"
      if (typeof dateStr === 'string') {
        // Si ya tiene timezone (contiene T y Z o +), usarla directamente
        // Si es formato PostgreSQL sin timezone (2024-01-15 10:30:00), tratarla como hora local
        if (dateStr.includes('Z') || dateStr.includes('+')) {
          date = new Date(dateStr);
        } else if (dateStr.includes('T') && !dateStr.includes('Z')) {
          // tiene T pero no Z, agregar timezone local
          date = new Date(dateStr);
        } else if (dateStr.includes(' ') && !dateStr.includes('T')) {
          // formato "2024-01-15 10:30:00" - tratarlo como hora local
          const normalized = dateStr.replace(' ', 'T');
          date = new Date(normalized);
        } else {
          date = new Date(dateStr);
        }
      } else {
        date = new Date(dateStr);
      }
      
      if (isNaN(date.getTime())) {
        return String(dateStr);
      }
      
      return date.toLocaleString('es-VE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return String(dateStr || '-');
    }
  };

  const tabs = [
    { id: 'auth' as TabType, label: 'Autenticación', icon: EyeIcon, count: authTotal },
    { id: 'changes' as TabType, label: 'Cambios en BD', icon: EditIcon, count: changeStats.total, hasNew: hasNewChanges },
    { id: 'activities' as TabType, label: 'Bitácora Actividades', icon: CalendarIcon, count: activityLogs.length }
  ];

  // Marcar cambios como vistos al entrar a la pestaña
  const handleTabClick = (tabId: TabType) => {
    setActiveTab(tabId);
    if (tabId === 'changes') {
      setHasNewChanges(false);
      localStorage.setItem('lastViewedChangeLog', new Date().toISOString());
    }
  };

  return (
    <>
      <PageMeta
        title="Auditoría"
        description="Sistema unificado de auditoría - Autenticación, Cambios y Bitácora"
      />
      <PageBreadcrumb pageTitle="Auditoría" />

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`relative flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700">
                {tab.count}
              </span>
              {/* Indicador de cambios nuevos */}
              {(tab as any).hasNew && activeTab !== tab.id && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-error-500 animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ========== AUTH LOGS TAB ========== */}
      {activeTab === 'auth' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <ComponentCard title="Total Logs">
              <div className="text-center">
                <p className="text-2xl font-bold text-brand-500">{authStats.total}</p>
                <p className="text-xs text-gray-500">registros</p>
              </div>
            </ComponentCard>
            <ComponentCard title="Logins Exitosos">
              <div className="text-center">
                <p className="text-2xl font-bold text-success-500">{authStats.success}</p>
                <p className="text-xs text-gray-500">exitosos</p>
              </div>
            </ComponentCard>
            <ComponentCard title="Logins Fallidos">
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

          {/* Filters - Reusable Component */}
          <AuditFilters
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            onClearDates={() => { setDateFrom(''); setDateTo(''); }}
            searchTerm={authFilters.searchTerm}
            onSearchChange={(val) => setAuthFilters(prev => ({ ...prev, searchTerm: val }))}
            searchPlaceholder="Buscar por CI, usuario o detalles..."
            filters={[
              {
                value: authFilters.action,
                onChange: (val) => setAuthFilters(prev => ({ ...prev, action: val })),
                options: [
                  { value: '', label: 'Todas las acciones' },
                  ...Object.entries(ACTION_CONFIGS).map(([key, config]) => ({
                    value: key,
                    label: config.label
                  }))
                ],
                placeholder: 'Acción'
              }
            ]}
            onRefresh={fetchAuthLogs}
            loading={authLoading}
          />

          {/* Auth Logs Table */}
          <ComponentCard title={`Logs de Autenticación (${filteredAuthLogs.length} de ${authTotal} registros)`}>
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
                        <tr key={log.AUTH_LOG_ID || `auth-${index}`} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5">
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
                            <Badge variant="light" color={config.color}>{config.label}</Badge>
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
            
            {/* Pagination - using filtered data for client-side pagination */}
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
      )}

      {/* ========== CHANGE LOGS TAB ========== */}
      {activeTab === 'changes' && (
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

          {/* Filters - Reusable Component */}
          <AuditFilters
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            onClearDates={() => { setDateFrom(''); setDateTo(''); }}
            searchTerm={changeFilters.searchTerm}
            onSearchChange={(val) => setChangeFilters(prev => ({ ...prev, searchTerm: val }))}
            searchPlaceholder="Buscar..."
            filters={[
              {
                value: changeFilters.tableName,
                onChange: (val) => setChangeFilters(prev => ({ ...prev, tableName: val })),
                options: [
                  { value: '', label: 'Todas las tablas' },
                  ...tables
                ],
                placeholder: 'Tabla'
              },
              {
                value: changeFilters.operation,
                onChange: (val) => setChangeFilters(prev => ({ ...prev, operation: val })),
                options: [
                  { value: '', label: 'Todas las operaciones' },
                  { value: 'INSERT', label: 'Creación' },
                  { value: 'UPDATE', label: 'Actualización' },
                  { value: 'DELETE', label: 'Eliminación' }
                ],
                placeholder: 'Operación'
              }
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
                      const config = OPERATION_CONFIGS[log.operation] || { label: log.operation, color: 'primary' as BadgeColor };
                      return (
                        <tr key={log.id || `change-${index}`} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5">
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                            {formatDate(log.dateTime)}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                            {log.tableLabel}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">{log.columnName}</td>
                          <td className="py-3 px-4">
                            <Badge variant="light" color={config.color}>{config.label}</Badge>
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
            
            {/* Pagination */}
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
      )}

      {/* ========== ACTIVITY LOGS TAB ========== */}
      {activeTab === 'activities' && (
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

          {/* Filters - Reusable Component */}
          <AuditFilters
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            onClearDates={() => { setDateFrom(''); setDateTo(''); }}
            searchTerm={activityFilters.searchTerm}
            onSearchChange={(val) => setActivityFilters(prev => ({ ...prev, searchTerm: val }))}
            searchPlaceholder="Buscar estudiante o descripción..."
            filters={[
              {
                value: activityFilters.activityType,
                onChange: (val) => setActivityFilters(prev => ({ ...prev, activityType: val })),
                options: [
                  { value: '', label: 'Todos los tipos' },
                  { value: 'DIARIA', label: 'Diaria' },
                  { value: 'SEMANAL', label: 'Semanal' }
                ],
                placeholder: 'Tipo'
              },
              {
                value: activityFilters.status,
                onChange: (val) => setActivityFilters(prev => ({ ...prev, status: val })),
                options: [
                  { value: '', label: 'Todos los estados' },
                  { value: 'approved', label: 'Aprobados' },
                  { value: 'pending', label: 'Pendientes' }
                ],
                placeholder: 'Estado'
              }
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
                      <tr key={log.activityLogId || `activity-${index}`} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5">
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
            
            {/* Pagination */}
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
      )}
    </>
  );
}
