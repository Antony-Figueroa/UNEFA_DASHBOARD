import { useNavigate } from 'react-router';

interface QuickAction {
  label: string;
  path: string;
  icon: string;
  color: string;
}

const ACTIONS: QuickAction[] = [
  { label: 'Registrar Actividad', path: '/student/activity-logs/new', icon: 'plus-circle', color: 'text-blue-600 dark:text-blue-400' },
  { label: 'Nueva Solicitud', path: '/student/requests', icon: 'edit', color: 'text-green-600 dark:text-green-400' },
  { label: 'Mis Documentos', path: '/student/documents', icon: 'file-text', color: 'text-purple-600 dark:text-purple-400' },
  { label: 'Mi Perfil', path: '/student/profile', icon: 'user', color: 'text-amber-600 dark:text-amber-400' },
];

const StudentQuickActionsWidget = () => {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-border-light bg-white p-5 shadow-sm dark:border-border-dark dark:bg-gray-900">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
        Acciones Rápidas
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {ACTIONS.map(action => (
          <button
            key={action.path}
            onClick={() => navigate(action.path)}
            className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 p-4 
                       hover:border-gray-200 hover:bg-gray-50 
                       dark:border-gray-800 dark:hover:border-gray-700 dark:hover:bg-gray-800
                       transition-all"
          >
            <svg className={`h-6 w-6 ${action.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {iconPaths[action.icon]}
            </svg>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

const iconPaths: Record<string, React.ReactNode> = {
  'plus-circle': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />,
  'edit': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
  'file-text': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  'user': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
};

export default StudentQuickActionsWidget;
