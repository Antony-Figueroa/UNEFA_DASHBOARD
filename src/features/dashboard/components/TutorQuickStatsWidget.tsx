interface TutorQuickStatsWidgetProps {
  stats: {
    totalStudents?: number;
    activeInternships?: number;
    pendingGrades?: number;
    completedInternships?: number;
  };
  loading: boolean;
}

const StatCard = ({ label, value, color }: { label: string; value: number | string; color: string }) => (
  <div className={`rounded-xl border border-border-light bg-white p-4 shadow-sm dark:border-border-dark dark:bg-gray-900 ${color}`}>
    <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
  </div>
);

const TutorQuickStatsWidget = ({ stats, loading }: TutorQuickStatsWidgetProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border-light bg-white p-4 shadow-sm dark:border-border-dark dark:bg-gray-900 animate-pulse">
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label="Total Estudiantes" value={stats?.totalStudents ?? 0} color="border-l-4 border-l-blue-500" />
      <StatCard label="Pasantías Activas" value={stats?.activeInternships ?? 0} color="border-l-4 border-l-green-500" />
      <StatCard label="Notas Pendientes" value={stats?.pendingGrades ?? 0} color="border-l-4 border-l-amber-500" />
      <StatCard label="Completadas" value={stats?.completedInternships ?? 0} color="border-l-4 border-l-purple-500" />
    </div>
  );
};

export default TutorQuickStatsWidget;
