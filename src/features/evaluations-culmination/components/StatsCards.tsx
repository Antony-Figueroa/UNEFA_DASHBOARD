/**
 * @file StatsCards.tsx
 * @description Componente de tarjetas de estadísticas para evaluaciones y culminación.
 * Admite tanto el modelo plano (stats[]) como el modelo agrupado (meta con student-level counts).
 */

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  color?: 'default' | 'warning' | 'success' | 'primary' | 'error';
}

/** Meta estadísticas a nivel de estudiante para el modelo agrupado */
export interface GroupedMetaStats {
  total: number;
  completed: number;
  inProgress: number;
}

const colorClasses: Record<string, string> = {
  default: 'bg-gray-50 dark:bg-gray-800/50',
  warning: 'bg-warning-50 dark:bg-warning-500/10',
  success: 'bg-success-50 dark:bg-success-500/10',
  primary: 'bg-brand-50 dark:bg-brand-500/10',
  error: 'bg-error-50 dark:bg-error-500/10',
};

const valueColorClasses: Record<string, string> = {
  default: 'text-text-primary dark:text-white',
  warning: 'text-warning-600 dark:text-warning-400',
  success: 'text-success-600 dark:text-success-400',
  primary: 'text-brand-600 dark:text-brand-400',
  error: 'text-error-600 dark:text-error-400',
};

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  color = 'default',
}) => (
  <div
    className={`rounded-xl border border-border-default dark:border-border-dark p-4 sm:p-5 ${colorClasses[color]}`}
  >
    <div className="flex items-center gap-3">
      <div
        className={`flex items-center justify-center w-10 h-10 rounded-lg bg-white dark:bg-gray-800/50 ${valueColorClasses[color]}`}
      >
        <span className="text-xl font-bold">{value}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-text-tertiary truncate">{title}</p>
        {subtitle && (
          <p className="text-xs text-text-tertiary/70 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  </div>
);

interface StatsCardsGridProps {
  /** Array de estadísticas para renderizar tarjetas */
  stats?: {
    title: string;
    value: number | string;
    subtitle?: string;
    color?: StatsCardProps['color'];
  }[];
  /** Meta estadísticas a nivel de estudiante (modelo agrupado).
   *  Cuando se provee, genera automáticamente las tarjetas Total, Completados y En Progreso. */
  meta?: GroupedMetaStats;
  columns?: number;
}

export const StatsCardsGrid: React.FC<StatsCardsGridProps> = ({
  stats,
  meta,
  columns = 3,
}) => {
  const resolvedStats = meta
    ? [
        { title: 'Total Estudiantes', value: meta.total, color: 'default' as const },
        { title: 'Completados', value: meta.completed, color: 'success' as const },
        { title: 'En Progreso', value: meta.inProgress, color: 'warning' as const },
      ]
    : stats || [];

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
  }[meta ? 3 : columns] || 'grid-cols-1 sm:grid-cols-3';

  return (
    <div className={`grid ${gridCols} gap-4 mb-6`}>
      {resolvedStats.map((stat, i) => (
        <StatsCard key={i} {...stat} />
      ))}
    </div>
  );
};

export default StatsCardsGrid;
