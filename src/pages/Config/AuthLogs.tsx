import { useState, useEffect, useMemo } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { useAuth } from "../../context/auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  Pagination,
} from "../../components/ui/table";
import { EmptyState } from "../../components/ui/table/EmptyState";
import { TableSkeleton } from "../../components/ui/skeleton";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import InputField from "../../components/form/input/InputField";
import CustomSelect from "../../components/form/CustomSelect";

interface AuthLog {
  ID: number;
  USER_ID: number;
  USER_CI: string;
  ACTION: string;
  IP_ADDRESS: string;
  USER_AGENT: string;
  DETAILS: string;
  CREATED_AT: string;
  t_user?: {
    USER_CI: string;
    NAME: string;
    SURNAME: string;
  };
}

interface LogsResponse {
  success: boolean;
  data: AuthLog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface User {
  id: number;
  name: string;
  surname: string;
  userCi: string;
}

const ACTION_CONFIGS: Record<string, { label: string; color: "success" | "error" | "warning" | "brand" }> = {
  'LOGIN_SUCCESS': { label: 'Login', color: 'success' },
  'LOGIN_FAILED': { label: 'Fallido', color: 'error' },
  'LOGOUT': { label: 'Logout', color: 'brand' },
  'SESSION_EXPIRED': { label: 'Expirada', color: 'warning' },
  'ACCOUNT_LOCKED': { label: 'Bloqueado', color: 'error' },
  'PASSWORD_RESET_REQUESTED': { label: 'Reset solicitado', color: 'warning' },
  'PASSWORD_RESET_COMPLETED': { label: 'Reset completado', color: 'success' },
  'CREATE_USER': { label: 'Usuario creado', color: 'success' },
  'UPDATE_USER': { label: 'Actualizado', color: 'brand' },
  'DELETE_USER': { label: 'Eliminado', color: 'warning' },
};

const getActionConfig = (action: string) => {
  return ACTION_CONFIGS[action] || { label: action, color: 'brand' as const };
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('es-VE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function AuthLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuthLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/users?limit=100`, {
          credentials: 'include'
        });
        const data = await response.json();
        const usersList = data.users || data.data || [];
        if (usersList.length > 0) {
          const uniqueUsers = usersList.reduce((acc: User[], u: any) => {
            if (!acc.find(x => x.id === u.id)) {
              acc.push({
                id: u.id,
                name: u.name,
                surname: u.surname,
                userCi: u.userCi
              });
            }
            return acc;
          }, []);
          setUsers(uniqueUsers);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    
    if (user) fetchUsers();
  }, [user]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const userIdParam = selectedUserId ? `&userId=${selectedUserId}` : '';
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/all-logs?page=${currentPage}&limit=${itemsPerPage}${userIdParam}`,
        { credentials: 'include' }
      );
      const data: LogsResponse = await response.json();
      if (data.success) {
        setLogs(data.data);
      } else {
        setError(new Error('Error al cargar los registros'));
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchLogs();
  }, [user, currentPage, itemsPerPage, selectedUserId]);

  const clearFilters = () => {
    setSearchTerm("");
    setActionFilter("");
    setSelectedUserId("");
    setCurrentPage(1);
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = searchTerm 
        ? log.ACTION.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.t_user?.NAME?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.t_user?.SURNAME?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.t_user?.USER_CI?.includes(searchTerm) ||
          log.DETAILS?.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      
      const matchesAction = actionFilter 
        ? log.ACTION === actionFilter 
        : true;
      
      return matchesSearch && matchesAction;
    });
  }, [logs, searchTerm, actionFilter]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="table-container">
        <TableSkeleton columns={4} rows={itemsPerPage} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-alert-error-border bg-alert-error-bg p-8 text-center dark:border-error-800 dark:bg-error-950 animate-fadeIn">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error-100 dark:bg-error-900/30">
          <svg className="h-6 w-6 text-error-600 dark:text-error-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-alert-error-text dark:text-error-400">Error de conexión</h3>
        <p className="mt-2 text-text-secondary dark:text-text-tertiary font-medium">
          {error.message}
        </p>
        <div className="mt-6">
          <Button variant="outline" onClick={() => fetchLogs()} className="mx-auto">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Registro de Actividad" description="Historial de acciones del sistema" />
      <PageBreadcrumb pageTitle="Registro de Actividad" />

      <div className="space-y-4 animate-fadeIn">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mt-1 text-sm text-text-secondary dark:text-text-tertiary">
              {filteredLogs.length.toLocaleString()} registros encontrados
            </p>
          </div>

          <Button
            variant="outline"
            onClick={fetchLogs}
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar
          </Button>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="w-full sm:w-64">
            <InputField
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          
          <CustomSelect
            options={[
              { value: "", label: "Todos los usuarios" },
              ...users.map(u => ({ 
                value: String(u.id), 
                label: `${u.name} ${u.surname} (${u.userCi})` 
              }))
            ]}
            value={selectedUserId}
            onChange={(e) => { setSelectedUserId(e as unknown as string); setCurrentPage(1); }}
            placeholder="Filtrar por usuario"
            className="w-full sm:w-56"
          />
          
          <CustomSelect
            options={[
              { value: "", label: "Todas las acciones" },
              { value: "LOGIN_SUCCESS", label: "Login" },
              { value: "LOGIN_FAILED", label: "Fallido" },
              { value: "LOGOUT", label: "Logout" },
              { value: "SESSION_EXPIRED", label: "Expirada" },
              { value: "CREATE_USER", label: "Usuario creado" },
              { value: "UPDATE_USER", label: "Actualizado" },
              { value: "DELETE_USER", label: "Eliminado" },
            ]}
            value={actionFilter}
            onChange={(e) => { setActionFilter(e as unknown as string); setCurrentPage(1); }}
            placeholder="Filtrar por acción"
            className="w-full sm:w-48"
          />
          
          {(searchTerm || actionFilter || selectedUserId) && (
            <Button variant="ghost" onClick={clearFilters} className="text-text-secondary hover:text-text-primary">
              Limpiar
            </Button>
          )}
        </div>

        {filteredLogs.length === 0 ? (
          <EmptyState title="No hay registros de actividad" description="No se encontraron registros que coincidan con los filtros aplicados." />
        ) : (
          <>
            <div className="hidden md:block overflow-hidden rounded-lg border border-border-default dark:border-border-dark bg-bg-surface dark:bg-bg-dark-surface shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader>Fecha</TableCell>
                    <TableCell isHeader>Usuario</TableCell>
                    <TableCell isHeader>Acción</TableCell>
                    <TableCell isHeader>Detalles</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLogs.map((log) => {
                    const config = getActionConfig(log.ACTION);
                    return (
                      <TableRow key={log.ID} className="hover:bg-bg-subtle/50 dark:hover:bg-bg-dark-subtle/50 transition-colors">
                        <TableCell className="text-text-secondary dark:text-text-tertiary tabular-nums">
                          {formatDate(log.CREATED_AT)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium text-text-primary dark:text-text-emphasis">
                            {log.t_user ? `${log.t_user.NAME} ${log.t_user.SURNAME}` : 'Sistema'}
                          </div>
                          <div className="text-xs text-text-tertiary">
                            CI: {log.t_user?.USER_CI || log.USER_CI || '—'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge color={config.color} variant="light" shape="rounded" className="font-semibold">
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-text-secondary dark:text-text-tertiary line-clamp-1" title={log.DETAILS}>
                            {log.DETAILS || '—'}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="md:hidden flex flex-col gap-4">
              {paginatedLogs.map((log) => {
                const config = getActionConfig(log.ACTION);
                return (
                  <div 
                    key={log.ID}
                    className="bg-bg-surface dark:bg-bg-dark-surface rounded-lg border border-border-default dark:border-border-dark p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-text-primary dark:text-text-emphasis">
                          {log.t_user ? `${log.t_user.NAME} ${log.t_user.SURNAME}` : 'Sistema'}
                        </p>
                        <p className="text-xs text-text-tertiary">
                          CI: {log.t_user?.USER_CI || log.USER_CI || '—'}
                        </p>
                      </div>
                      <Badge color={config.color} variant="light" shape="rounded">
                        {config.label}
                      </Badge>
                    </div>
                    <div className="text-xs text-text-secondary dark:text-text-tertiary mb-2">
                      {formatDate(log.CREATED_AT)}
                    </div>
                    {log.DETAILS && (
                      <p className="text-xs text-text-tertiary border-t border-border-default dark:border-border-dark pt-2 mt-2">
                        {log.DETAILS}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredLogs.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
                itemsPerPageOptions={[10, 25, 50]}
              />
            )}
          </>
        )}
      </div>
    </>
  );
}
