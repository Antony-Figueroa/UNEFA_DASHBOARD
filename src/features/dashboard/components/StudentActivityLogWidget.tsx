interface ActivityLog {
  id?: number;
  date?: string;
  hours?: number;
  description?: string;
  type?: string;
  approved?: boolean;
}

interface StudentActivityLogWidgetProps {
  logs: {
    recentLogs?: ActivityLog[];
    totalHours?: number;
    totalLogs?: number;
  };
  loading: boolean;
}

const StudentActivityLogWidget = ({ logs, loading }: StudentActivityLogWidgetProps) => {
  const recentLogs = Array.isArray(logs?.recentLogs) ? logs.recentLogs.slice(0, 4) : [];

  return (
    <div className="rounded-2xl border border-border-light bg-white p-5 shadow-sm dark:border-border-dark dark:bg-gray-900">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Actividades Recientes
        </h3>
        <div className="text-right">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {logs?.totalLogs ?? 0} registros · {logs?.totalHours ?? 0}h totales
          </p>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : recentLogs.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
          Sin actividades recientes
        </p>
      ) : (
        <div className="space-y-3">
          {recentLogs.map((log, i) => (
            <div key={log.id ?? i} className="flex items-start gap-3">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold
                ${log.approved
                  ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                  : log.approved === false
                    ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                }`}>
                {log.hours ?? 0}h
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">
                  {log.description ?? 'Sin descripción'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {log.date ? new Date(log.date).toLocaleDateString() : ''}
                  {log.type ? ` · ${log.type}` : ''}
                  {log.approved != null && (
                    <span className={`ml-1 ${log.approved ? 'text-green-500' : 'text-red-500'}`}>
                      · {log.approved ? 'Aprobado' : 'Rechazado'}
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentActivityLogWidget;
