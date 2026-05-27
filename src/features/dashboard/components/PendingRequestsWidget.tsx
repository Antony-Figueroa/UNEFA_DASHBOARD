import { useNavigate } from 'react-router';

interface PendingRequestsWidgetProps {
  count: number;
  loading: boolean;
}

const PendingRequestsWidget = ({ count, loading }: PendingRequestsWidgetProps) => {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-border-light bg-white p-5 shadow-sm dark:border-border-dark dark:bg-gray-900">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Solicitudes Pendientes
        </h3>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-500/20">
          <svg className="h-5 w-5 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      ) : (
        <div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {count}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            solicitudes por revisar
          </p>
        </div>
      )}

      <button
        onClick={() => navigate('/admin/requests')}
        className="mt-4 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 
                   hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 
                   transition-colors"
      >
        Ver solicitudes
      </button>
    </div>
  );
};

export default PendingRequestsWidget;
