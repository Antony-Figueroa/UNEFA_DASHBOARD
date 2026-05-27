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
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
        Promedio de Notas
      </h3>

      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-16 w-24 mx-auto bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="h-4 w-32 mx-auto bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      ) : formatted !== null ? (
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 mb-3">
            <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {formatted.toFixed(1)}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nota promedio general
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
          Sin datos de notas disponibles
        </p>
      )}
    </div>
  );
};

export default TutorGradeAverageWidget;
