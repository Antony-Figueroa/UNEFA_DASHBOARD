import type { RequestStatus } from '../types';

interface CardConfig {
  key: string;
  label: string;
  bgClass: string;
  textClass: string;
  ringClass: string;
}

const DEFAULT_CARDS: CardConfig[] = [
  {
    key: 'pending',
    label: 'Pendientes',
    bgClass: 'bg-yellow-50 dark:bg-yellow-900/20',
    textClass: 'text-yellow-600',
    ringClass: 'ring-yellow-500'
  },
  {
    key: 'in_review',
    label: 'En Revisión',
    bgClass: 'bg-blue-50 dark:bg-blue-900/20',
    textClass: 'text-blue-600',
    ringClass: 'ring-blue-500'
  },
  {
    key: 'approved',
    label: 'Aprobadas',
    bgClass: 'bg-green-50 dark:bg-green-900/20',
    textClass: 'text-green-600',
    ringClass: 'ring-green-500'
  },
  {
    key: 'rejected',
    label: 'Rechazadas',
    bgClass: 'bg-red-50 dark:bg-red-900/20',
    textClass: 'text-red-600',
    ringClass: 'ring-red-500'
  }
];

interface RequestsStatsCardsProps {
  stats: Record<string, number>;
  activeFilter?: string;
  onFilterChange?: (key: string) => void;
  showTotal?: boolean;
}

export const RequestsStatsCards = ({
  stats,
  activeFilter,
  onFilterChange,
  showTotal = false
}: RequestsStatsCardsProps) => {
  const gridCols = showTotal ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4';

  return (
    <div className={`grid ${gridCols} gap-4`}>
      {showTotal && (
        <div
          className={`p-4 rounded-lg text-center cursor-pointer transition-colors ${
            activeFilter === 'all'
              ? 'bg-brand-50 dark:bg-brand-900/20 ring-2 ring-brand-500'
              : 'bg-gray-50 dark:bg-gray-800'
          }`}
          onClick={() => onFilterChange?.('all')}
        >
          <p className="text-2xl font-bold">{stats.total ?? 0}</p>
          <p className="text-sm text-text-secondary">Total</p>
        </div>
      )}

      {DEFAULT_CARDS.map(card => {
        const isActive = activeFilter === card.key;
        const isClickable = !!onFilterChange;

        let className = 'p-4 rounded-lg text-center';
        if (isClickable) {
          className += ' cursor-pointer transition-colors';
          className += isActive
            ? ` ${card.bgClass} ring-2 ${card.ringClass}`
            : ' bg-gray-50 dark:bg-gray-800';
        } else {
          className += ` ${card.bgClass}`;
        }

        return (
          <div
            key={card.key}
            className={className}
            onClick={() => onFilterChange?.(card.key)}
          >
            <p className={`text-2xl font-bold ${card.textClass}`}>
              {stats[card.key] ?? 0}
            </p>
            <p className={`text-sm ${isClickable ? 'text-text-secondary' : card.textClass}`}>
              {card.label}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default RequestsStatsCards;
