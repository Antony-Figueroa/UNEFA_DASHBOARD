import { useAuth } from "../../context/auth";
import { useLoginHistory } from "../../features/auth/hooks/useLoginHistory";
import { Skeleton } from "../ui/skeleton";

export default function UserLoginHistoryCard() {
  const { user } = useAuth();
  const { records, loading } = useLoginHistory();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-VE', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionConfig = (action: string) => {
    switch (action) {
      case 'LOGIN_SUCCESS':
        return { label: 'Sesión iniciada', color: 'success' as const, icon: '↵' };
      case 'LOGIN_FAILED':
        return { label: 'Intento fallido', color: 'error' as const, icon: '✕' };
      case 'LOGOUT':
        return { label: 'Sesión cerrada', color: 'info' as const, icon: '→' };
      default:
        return { label: action, color: 'light' as const, icon: '•' };
    }
  };

  const getDeviceSummary = (userAgent: string) => {
    const ua = userAgent.toLowerCase();
    if (ua.includes('android')) return 'Android';
    if (ua.includes('iphone')) return 'iPhone';
    if (ua.includes('ipad')) return 'iPad';
    if (ua.includes('mac')) return 'Mac';
    if (ua.includes('windows')) return 'Windows';
    if (ua.includes('linux')) return 'Linux';
    return 'Dispositivo';
  };

  return (
    <div className="p-5 border border-border-light rounded-2xl dark:border-white/10 lg:p-6 bg-white dark:bg-bg-dark">
      <div className="flex items-start gap-4 mb-5">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-success-50 dark:bg-success-500/10">
          <svg className="w-6 h-6 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h4 className="text-base font-semibold text-text-emphasis dark:text-white">
            Actividad Reciente
          </h4>
          <p className="text-sm text-text-secondary dark:text-text-tertiary">
            Tus últimos accesos al sistema
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton width={32} height={32} className="rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton height={12} width={96} className="rounded" />
                <Skeleton height={8} width={128} className="rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-sm text-text-tertiary">Sin actividad registrada</p>
        </div>
      ) : (
        <div className="space-y-1">
          {records.slice(0, 5).map((record) => {
            const config = getActionConfig(record.ACTION);
            return (
              <div 
                key={record.ID} 
                className="flex items-center gap-3 py-2.5 px-3 -mx-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium
                  ${config.color === 'success' ? 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400' : ''}
                  ${config.color === 'error' ? 'bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400' : ''}
                  ${config.color === 'info' ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' : ''}
                  ${config.color === 'light' ? 'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400' : ''}
                `}>
                  {config.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-emphasis dark:text-white">
                    {config.label}
                  </p>
                  <p className="text-xs text-text-tertiary">
                    {getDeviceSummary(record.USER_AGENT || '')} · {formatDate(record.CREATED_AT)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
