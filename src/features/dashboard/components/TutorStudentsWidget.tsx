import { useNavigate } from 'react-router';

interface TutorStudent {
  enrollmentId?: string;
  studentName?: string;
  studentCi?: string;
  careerName?: string;
  status?: string;
}

interface TutorStudentsWidgetProps {
  students: TutorStudent[];
  loading: boolean;
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
  'pre-enrolled': 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  completed: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
  suspended: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
};

const TutorStudentsWidget = ({ students, loading }: TutorStudentsWidgetProps) => {
  const navigate = useNavigate();

  const safeStudents = Array.isArray(students) ? students.slice(0, 5) : [];

  return (
    <div className="rounded-2xl border border-border-light bg-white p-5 shadow-sm dark:border-border-dark dark:bg-gray-900">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary">
          Mis Estudiantes
        </h3>
        <span className="text-xs text-text-secondary dark:text-text-secondary">
          Últimos 5
        </span>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-bg-secondary dark:bg-bg-secondary rounded-lg" />
          ))}
        </div>
      ) : safeStudents.length === 0 ? (
        <p className="text-sm text-text-tertiary dark:text-text-tertiary text-center py-6">
          No tienes estudiantes asignados
        </p>
      ) : (
        <div className="space-y-2">
          {safeStudents.map((student, i) => (
            <div
              key={student.enrollmentId ?? i}
              className="flex items-center justify-between rounded-lg border border-border-light px-3 py-2 
                         dark:border-border-dark"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary dark:text-text-primary truncate">
                  {student.studentName ?? 'Sin nombre'}
                </p>
                <p className="text-xs text-text-secondary dark:text-text-secondary">
                  {student.studentCi ?? ''} · {student.careerName ?? ''}
                </p>
              </div>
              <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[student.status ?? ''] ?? 'bg-bg-secondary text-text-secondary'}`}>
                {student.status ?? 'unknown'}
              </span>
            </div>
          ))}
        </div>
      )}

<button
        onClick={() => navigate('/tutor/students')}
        className="mt-4 w-full rounded-lg border border-border-light px-4 py-2 text-sm font-medium text-text-primary 
                   hover:bg-bg-secondary dark:border-border-dark dark:text-text-primary dark:hover:bg-bg-secondary 
                   transition-colors"
      >
        Ver todos los estudiantes
      </button>
    </div>
  );
};

export default TutorStudentsWidget;
