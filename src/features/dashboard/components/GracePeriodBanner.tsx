import { Clock } from 'lucide-react';

interface GracePeriodBannerProps {
  period?: {
    graceEndDate?: string;
    evaluationGraceEndDate?: string;
    enrollmentGraceDays?: number;
    endDate?: string;
  };
}

export default function GracePeriodBanner({ period }: GracePeriodBannerProps) {
  if (!period?.graceEndDate && !period?.evaluationGraceEndDate) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const enrollmentEnd = period.graceEndDate ? new Date(period.graceEndDate) : null;
  const evaluationEnd = period.evaluationGraceEndDate ? new Date(period.evaluationGraceEndDate) : null;

  const enrollmentRemaining = enrollmentEnd
    ? Math.ceil((enrollmentEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const evaluationRemaining = evaluationEnd
    ? Math.ceil((evaluationEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const getColorClass = (remaining: number | null) => {
    if (remaining === null) return 'text-text-tertiary';
    if (remaining > 7) return 'text-success-600 dark:text-success-400';
    if (remaining > 0) return 'text-warning-600 dark:text-warning-400';
    return 'text-error-600 dark:text-error-400';
  };

  const getBgClass = (remaining: number | null) => {
    if (remaining === null) return 'bg-gray-200 dark:bg-gray-700';
    if (remaining > 7) return 'bg-success-500';
    if (remaining > 0) return 'bg-warning-500';
    return 'bg-error-500';
  };

  const getProgressPercent = (remaining: number | null, totalDays: number | undefined) => {
    if (remaining === null || !totalDays || totalDays <= 0) return 0;
    const elapsed = totalDays - remaining;
    return Math.min(100, Math.max(0, (elapsed / totalDays) * 100));
  };

  const enrollmentTotal = period.enrollmentGraceDays ?? 30;
  const enrollmentProgress = getProgressPercent(enrollmentRemaining, enrollmentTotal);

  return (
    <div className="rounded-2xl border border-border-light bg-white dark:bg-bg-dark shadow-theme-md p-5">
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 shrink-0">
          <Clock className="w-5 h-5 text-brand-600 dark:text-brand-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-sm font-semibold text-text-emphasis dark:text-white">
              Período de inscripción
            </h3>
            {enrollmentRemaining !== null && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getColorClass(enrollmentRemaining)}`}>
                {enrollmentRemaining > 0
                  ? `${enrollmentRemaining} día${enrollmentRemaining !== 1 ? 's' : ''} restante${enrollmentRemaining !== 1 ? 's' : ''}`
                  : enrollmentRemaining === 0
                    ? 'Vence hoy'
                    : 'Vencido'}
              </span>
            )}
          </div>

          {/* Progress bar */}
          {enrollmentTotal > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-text-tertiary mb-1">
                <span>Progreso</span>
                <span>{Math.round(enrollmentProgress)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getBgClass(enrollmentRemaining)}`}
                  style={{ width: `${enrollmentProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-text-tertiary mt-1">
                <span>Inicio del período</span>
                <span>{period.graceEndDate ? new Date(period.graceEndDate).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' }) : ''}</span>
              </div>
            </div>
          )}

          {evaluationEnd && (
            <p className={`mt-2 text-xs flex items-center gap-1.5 ${getColorClass(evaluationRemaining)}`}>
              <Clock className="w-3 h-3" />
              Evaluaciones hasta: {evaluationEnd.toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' })}
              {evaluationRemaining !== null && (
                <span className="font-medium">
                  ({evaluationRemaining > 0 ? `${evaluationRemaining} días` : 'Vencido'})
                </span>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
