import { Calendar } from 'lucide-react';

interface UpcomingDeadline {
  practiceId: number;
  endDate: string;
  reportTitle: string;
  studentName: string;
}

interface TutorUpcomingDeadlinesWidgetProps {
  deadlines: UpcomingDeadline[];
  loading: boolean;
}

function getDaysRemaining(endDate: string): number {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getDaysColor(days: number): string {
  if (days <= 3) return 'text-red-600 dark:text-red-400';
  if (days <= 7) return 'text-amber-600 dark:text-amber-400';
  return 'text-green-600 dark:text-green-400';
}

function getBadgeColor(days: number): string {
  if (days <= 3) return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400';
  if (days <= 7) return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
  return 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400';
}

const TutorUpcomingDeadlinesWidget = ({ deadlines, loading }: TutorUpcomingDeadlinesWidgetProps) => {
  const safeDeadlines = Array.isArray(deadlines) ? deadlines.slice(0, 5) : [];

  return (
    <div className="rounded-2xl border border-border-light bg-white p-5 shadow-sm dark:border-border-dark dark:bg-gray-900">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Próximos Vencimientos
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Fechas de entrega
        </span>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      ) : safeDeadlines.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-gray-400 dark:text-gray-500">
          <Calendar className="h-8 w-8" />
          <p className="text-sm">No hay vencimientos próximos</p>
        </div>
      ) : (
        <div className="space-y-2">
          {safeDeadlines.map((d) => {
            const days = getDaysRemaining(d.endDate);
            return (
              <div
                key={d.practiceId}
                className="flex items-start justify-between rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-800"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {d.studentName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(d.endDate).toLocaleDateString('es-ES', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {d.reportTitle}
                  </p>
                </div>
                <span className={`ml-2 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${getBadgeColor(days)}`}>
                  {days <= 0
                    ? 'Vencido'
                    : `Faltan ${days} día${days !== 1 ? 's' : ''}`}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TutorUpcomingDeadlinesWidget;
