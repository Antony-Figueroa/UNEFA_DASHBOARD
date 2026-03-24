import { useEffect } from 'react';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import { useAuditLogs } from '../../features/audit-logs/hooks/useAuditLogs';
import AuditLogsTable from '../../features/audit-logs/components/AuditLogsTable';
import AuditLogsFilters from '../../features/audit-logs/components/AuditLogsFilters';

export default function AuditLogsPage() {
  const {
    logs,
    stats,
    tables,
    loading,
    total,
    currentPage,
    totalPages,
    fetchLogs,
    fetchStats,
    fetchTables
  } = useAuditLogs();

  useEffect(() => {
    fetchLogs();
    fetchStats(7);
    fetchTables();
  }, [fetchLogs, fetchStats, fetchTables]);

  const handleFilterChange = (filters: {
    tableName?: string;
    operation?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    fetchLogs({
      ...filters,
      operation: filters.operation as 'INSERT' | 'UPDATE' | 'DELETE' | undefined
    });
  };

  const handleReset = () => {
    fetchLogs();
  };

  const handlePageChange = (page: number) => {
    const offset = (page - 1) * 50;
    fetchLogs({ offset });
  };

  return (
    <>
      <PageMeta
        title="Logs de Auditoría"
        description="Visualiza el registro de auditoría del sistema"
      />
      <PageBreadcrumb pageTitle="Logs de Auditoría" />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <ComponentCard title="Inserciones">
            <div className="text-center">
              <p className="text-3xl font-bold text-brand-500">{stats.operations.INSERT}</p>
            </div>
          </ComponentCard>
          <ComponentCard title="Actualizaciones">
            <div className="text-center">
              <p className="text-3xl font-bold text-warning-500">{stats.operations.UPDATE}</p>
            </div>
          </ComponentCard>
          <ComponentCard title="Eliminaciones">
            <div className="text-center">
              <p className="text-3xl font-bold text-error-500">{stats.operations.DELETE}</p>
            </div>
          </ComponentCard>
          <ComponentCard title={`Total (${stats.period} días)`}>
            <div className="text-center">
              <p className="text-3xl font-bold text-info-500">{stats.totalChanges}</p>
            </div>
          </ComponentCard>
        </div>
      )}

      {/* Filters */}
      <AuditLogsFilters
        tables={tables}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        isLoading={loading}
      />

      {/* Table */}
      <ComponentCard title={`Registros de Auditoría (${total} total)`}>
        <AuditLogsTable data={logs} loading={loading} />
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-text-secondary">
              Mostrando página {currentPage} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm rounded border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-white/5"
              >
                Anterior
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm rounded border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-white/5"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </ComponentCard>
    </>
  );
}
