/**
 * @file StatsCards.tsx
 * @description Componente de tarjetas de estadísticas para evaluaciones y culminación
 */

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  color?: 'default' | 'warning' | 'success' | 'primary' | 'error';
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
  stats: {
    title: string;
    value: number | string;
    subtitle?: string;
    color?: StatsCardProps['color'];
  }[];
  columns?: number;
}

export const StatsCardsGrid: React.FC<StatsCardsGridProps> = ({
  stats,
  columns = 3,
}) => {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
  }[columns] || 'grid-cols-1 sm:grid-cols-3';

  return (
    <div className={`grid ${gridCols} gap-4 mb-6`}>
      {stats.map((stat, i) => (
        <StatsCard key={i} {...stat} />
      ))}
    </div>
  );
};

export default StatsCardsGrid;
