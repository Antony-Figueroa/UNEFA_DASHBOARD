import { AlertTriangle, ThumbsUp } from 'lucide-react';

interface StudentAlert {
  practiceId: number;
  studentName: string;
  daysInactive: number;
}

interface TutorStudentAlertsWidgetProps {
  alerts: StudentAlert[];
  loading: boolean;
}

const TutorStudentAlertsWidget = ({ alerts, loading }: TutorStudentAlertsWidgetProps) => {
  const safeAlerts = Array.isArray(alerts) ? alerts.slice(0, 5) : [];

  return (
    <div className="rounded-2xl border border-border-light bg-white p-5 shadow-sm dark:border-border-dark dark:bg-gray-900">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Alertas de Estudiantes
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Sin actividad
        </span>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      ) : safeAlerts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-gray-400 dark:text-gray-500">
          <ThumbsUp className="h-8 w-8" />
          <p className="text-sm">Todos los estudiantes están al día</p>
        </div>
      ) : (
        <div className="space-y-2">
          {safeAlerts.map((a) => (
            <div
              key={a.practiceId}
              className="flex items-start gap-3 rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-800"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {a.studentName}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  Sin actividad reciente ({a.daysInactive} día{a.daysInactive !== 1 ? 's' : ''})
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TutorStudentAlertsWidget;
