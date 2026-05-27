interface StudentProgressWidgetProps {
  progress: {
    completed: number;
    required: number;
    percentage: number;
  };
  loading: boolean;
}

const StudentProgressWidget = ({ progress, loading }: StudentProgressWidgetProps) => {
  const pct = Math.min(progress?.percentage ?? 0, 100);
  const completed = progress?.completed ?? 0;
  const required = progress?.required ?? 1;

  return (
    <div className="rounded-2xl border border-border-light bg-white p-5 shadow-sm dark:border-border-dark dark:bg-gray-900">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
        Mi Progreso
      </h3>

      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      ) : (
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Horas completadas
            </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {completed} / {required}h
            </span>
          </div>

          <div className="h-3 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {pct.toFixed(0)}% completado
            </span>
            {pct >= 100 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-500/20 dark:text-green-400">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Completado
              </span>
            ) : (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {required - completed}h restantes
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProgressWidget;
