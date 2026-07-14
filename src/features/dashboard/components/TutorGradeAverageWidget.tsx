interface TutorGradeAverageWidgetProps {
  stats: {
    averageGrade?: string | number;
    statusDistribution?: Record<string, number>;
  };
  loading: boolean;
}

const TutorGradeAverageWidget = ({ stats, loading }: TutorGradeAverageWidgetProps) => {
  const avg = stats?.averageGrade;
  const formatted = avg ? (typeof avg === 'string' ? parseFloat(avg) : avg) : null;

  return (
    <div className="rounded-2xl border border-border-light bg-white p-5 shadow-sm dark:border-border-dark dark:bg-gray-900">
      <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary mb-4">
        Promedio de Notas
      </h3>

      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-16 w-24 mx-auto bg-bg-secondary dark:bg-bg-secondary rounded-xl" />
          <div className="h-4 w-32 mx-auto bg-bg-secondary dark:bg-bg-secondary rounded" />
        </div>
      ) : formatted !== null ? (
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/30 dark:to-brand-800/30 mb-3">
            <span className="text-3xl font-bold text-brand-600 dark:text-brand-400">
              {formatted.toFixed(1)}
            </span>
          </div>
          <p className="text-sm text-text-secondary dark:text-text-secondary">
            Nota promedio general
          </p>
        </div>
      ) : (
        <p className="text-sm text-text-tertiary dark:text-text-tertiary text-center py-6">
          Sin datos de notas disponibles
        </p>
      )}
    </div>
  );
};

export default TutorGradeAverageWidget;
