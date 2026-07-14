interface TutorStatusWidgetProps {
  data: Record<string, number>;
  loading: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  'pre-enrolled': 'Preinscriptos',
  'active': 'Activos',
  'completed': 'Completados',
  'suspended': 'Suspendidos',
  'unknown': 'Desconocido',
};

const STATUS_COLORS: Record<string, string> = {
  'pre-enrolled': 'bg-blue-500',
  'active': 'bg-green-500',
  'completed': 'bg-purple-500',
  'suspended': 'bg-red-500',
  'unknown': 'bg-gray-400',
};

const TutorStatusWidget = ({ data, loading }: TutorStatusWidgetProps) => {
  const entries = Object.entries(data ?? {});
  const total = entries.reduce((acc, [, v]) => acc + v, 0);

  return (
    <div className="rounded-2xl border border-border-light bg-white p-5 shadow-sm dark:border-border-dark dark:bg-gray-900">
      <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary mb-4">
        Estado de Pasantías
      </h3>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-bg-secondary dark:bg-bg-secondary" />
              <div className="h-4 flex-1 bg-bg-secondary dark:bg-bg-secondary rounded" />
              <div className="h-4 w-8 bg-bg-secondary dark:bg-bg-secondary rounded" />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-text-tertiary dark:text-text-tertiary text-center py-6">
          Sin datos de pasantías
        </p>
      ) : (
        <div className="space-y-3">
          {entries.map(([status, count]) => {
            const percentage = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={status}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${STATUS_COLORS[status] ?? 'bg-gray-400'}`} />
                    <span className="text-sm text-text-primary dark:text-text-primary">
                      {STATUS_LABELS[status] ?? status}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-text-primary dark:text-text-primary">
                    {count} ({percentage.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-bg-secondary dark:bg-bg-secondary">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${STATUS_COLORS[status] ?? 'bg-gray-400'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TutorStatusWidget;
