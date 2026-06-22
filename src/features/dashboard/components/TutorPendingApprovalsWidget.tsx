import { CheckCircle } from 'lucide-react';

interface PendingApprovalLog {
  id: number;
  date: string;
  description: string;
  week: number;
  hours: number;
  studentName: string;
}

interface TutorPendingApprovalsWidgetProps {
  logs: PendingApprovalLog[];
  loading: boolean;
}

const TutorPendingApprovalsWidget = ({ logs, loading }: TutorPendingApprovalsWidgetProps) => {
  const safeLogs = Array.isArray(logs) ? logs.slice(0, 5) : [];

  return (
    <div className="rounded-2xl border border-border-light bg-white p-5 shadow-sm dark:border-border-dark dark:bg-gray-900">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Aprobaciones Pendientes
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Bitácora
        </span>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      ) : safeLogs.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-gray-400 dark:text-gray-500">
          <CheckCircle className="h-8 w-8" />
          <p className="text-sm">No hay actividades pendientes por aprobar</p>
        </div>
      ) : (
        <div className="space-y-2">
          {safeLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start justify-between rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-800"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {log.studentName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {new Date(log.date).toLocaleDateString('es-ES', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {log.description.length > 80
                    ? log.description.slice(0, 80) + '…'
                    : log.description}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Semana {log.week} · {log.hours}h
                </p>
              </div>
              <span className="ml-2 shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                Pendiente
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TutorPendingApprovalsWidget;
