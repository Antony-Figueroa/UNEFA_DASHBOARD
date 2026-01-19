import React from 'react';
import { FiArrowUp, FiArrowDown, FiTrendingUp } from 'react-icons/fi';

interface GrowthMetricsProps {
  growth: {
    totalLastMonth: number;
    totalPrevMonth: number;
    percentageChange: number;
    trend: 'up' | 'down' | 'neutral';
    weeklyBreakdown: { label: string; count: number }[];
    dailyBreakdown: { label: string; count: number }[];
  };
  loading?: boolean;
}

const GrowthMetrics: React.FC<GrowthMetricsProps> = ({ growth, loading }) => {
  if (loading) {
    return (
      <div className="h-full animate-pulse rounded-xl border border-border-light bg-white p-6 shadow-sm dark:bg-gray-900">
        <div className="mb-4 h-6 w-1/2 rounded bg-gray-200 dark:bg-gray-800"></div>
        <div className="mb-6 h-10 w-1/3 rounded bg-gray-200 dark:bg-gray-800"></div>
        <div className="space-y-4">
          <div className="h-20 rounded bg-gray-100 dark:bg-gray-800"></div>
          <div className="h-20 rounded bg-gray-100 dark:bg-gray-800"></div>
        </div>
      </div>
    );
  }

  const { totalLastMonth, percentageChange, trend, weeklyBreakdown, dailyBreakdown } = growth;

  return (
    <div className="flex h-full flex-col rounded-xl border border-border-light bg-white p-6 shadow-sm dark:bg-gray-900">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Estudiantes este Mes</h3>
        <p className="text-sm text-gray-500">Comparativa con el mes anterior</p>
      </div>

      <div className="mb-8 flex items-end gap-4">
        <div className="text-4xl font-bold text-gray-900 dark:text-white">
          {totalLastMonth}
        </div>
        <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-sm font-medium ${
          trend === 'up' ? 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400' :
          trend === 'down' ? 'bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400' :
          'bg-gray-50 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400'
        }`}>
          {trend === 'up' ? <FiArrowUp /> : trend === 'down' ? <FiArrowDown /> : <FiTrendingUp />}
          {Math.abs(percentageChange)}%
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Desglose por Semana</h4>
          <div className="flex items-end justify-between gap-2">
            {weeklyBreakdown.map((item, i) => (
              <div key={i} className="group relative flex flex-1 flex-col items-center gap-2">
                <div className="flex h-16 w-full items-end overflow-hidden rounded-sm bg-gray-100 dark:bg-gray-800">
                  <div 
                    className="w-full bg-brand-500 transition-all group-hover:bg-brand-600"
                    style={{ height: `${(item.count / (Math.max(...weeklyBreakdown.map(w => w.count)) || 1)) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-medium text-gray-500">{item.label}</span>
                <div className="absolute -top-8 hidden rounded bg-gray-900 px-2 py-1 text-xs text-white group-hover:block">
                  {item.count} estudiantes
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Últimos 7 días</h4>
          <div className="grid grid-cols-7 gap-1">
            {dailyBreakdown.map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={`h-1.5 w-full rounded-full ${
                  item.count > 0 ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-800'
                }`} />
                <span className="text-[10px] font-medium text-gray-400">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrowthMetrics;
