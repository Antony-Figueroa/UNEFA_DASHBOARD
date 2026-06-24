/**
 * @file GrowthMetrics.tsx
 * @description Component that displays monthly student growth metrics and breakdown.
 * Includes trend indicators and mini-bar charts for weekly/daily views with animations.
 * Enhanced with better clarity, hierarchy, and contextual tooltips.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { FiArrowUp, FiArrowDown, FiTrendingUp, FiUsers } from 'react-icons/fi';
import { DashboardStats } from '../types';
import { Skeleton } from '../../../components/ui/skeleton';

/**
 * Props for the GrowthMetrics component.
 */
interface GrowthMetricsProps {
  /** Growth data object containing totals, trends, and breakdowns */
  growth: DashboardStats['monthlyGrowth'];
  /** Whether the data is currently being fetched */
  loading?: boolean;
}

/**
 * Animated number counter component
 */
const AnimatedNumber: React.FC<{ value: number; duration?: number }> = ({ 
  value, 
  duration = 1.2 
}) => {
  const [displayValue, setDisplayValue] = React.useState(0);
  const hasAnimated = React.useRef(false);

  React.useEffect(() => {
    if (hasAnimated.current) {
      setDisplayValue(value);
      return;
    }

    let startTime: number | null = null;
    const startValue = 0;
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      
      // Easing function (easeOutQuart)
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(startValue + (value - startValue) * easeOutQuart);
      
      setDisplayValue(currentCount);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        hasAnimated.current = true;
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <>{displayValue.toLocaleString()}</>;
};

/**
 * GrowthMetrics component.
 * Visualizes student registration growth compared to previous periods.
 * 
 * @example
 * ```tsx
 * <GrowthMetrics growth={stats.monthlyGrowth} loading={false} />
 * ```
 */
const GrowthMetrics: React.FC<GrowthMetricsProps> = ({ growth, loading }) => {
  if (loading) {
    return (
      <div className="h-full rounded-2xl border border-border-light bg-white p-6 shadow-sm dark:bg-gray-900">
        <Skeleton height={24} width="60%" className="mb-2" />
        <Skeleton height={16} width="40%" className="mb-6" />
        <Skeleton height={48} width="50%" className="mb-6" />
        <div className="space-y-4">
          <Skeleton height={100} className="rounded-xl" />
          <Skeleton height={60} className="rounded-xl" />
        </div>
      </div>
    );
  }

  const { totalLastMonth, percentageChange, trend, weeklyBreakdown, dailyBreakdown } = growth;

  // Validar datos
  const safeWeeklyBreakdown = Array.isArray(weeklyBreakdown) ? weeklyBreakdown : [];
  const safeDailyBreakdown = Array.isArray(dailyBreakdown) ? dailyBreakdown : [];

  // Check if there's meaningful data
  const hasData = (totalLastMonth || 0) > 0 || safeWeeklyBreakdown.some(w => (w?.count || 0) > 0) || safeDailyBreakdown.some(d => (d?.count || 0) > 0);
  const hasWeeklyData = safeWeeklyBreakdown.length > 0 && safeWeeklyBreakdown.some(w => (w?.count || 0) > 0);
  const hasDailyData = safeDailyBreakdown.length > 0 && safeDailyBreakdown.some(d => (d?.count || 0) > 0);

  const getTrendColor = () => {
    if (trend === 'up') return 'text-success-600 dark:text-success-400';
    if (trend === 'down') return 'text-error-600 dark:text-error-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getTrendBg = () => {
    if (trend === 'up') return 'bg-success-50 dark:bg-success-500/10';
    if (trend === 'down') return 'bg-error-50 dark:bg-error-500/10';
    return 'bg-gray-50 dark:bg-gray-500/10';
  };

  const maxWeekly = Math.max(...safeWeeklyBreakdown.map(w => w?.count || 0), 1);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex h-full flex-col rounded-2xl border border-border-light bg-white p-6 shadow-sm dark:border-border-dark dark:bg-gray-900"
    >
      {/* Header - Enhanced */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 dark:from-brand-600 dark:to-brand-700 shadow-lg shadow-brand-500/20"
          >
            <FiUsers className="size-5 text-white" />
          </motion.div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
            Estudiantes este mes
          </h3>
        </div>
        <p className="text-sm text-text-secondary dark:text-text-tertiary ml-[52px]">
          Comparativa con el mes anterior
        </p>
      </div>

      {/* Main Stats or Empty State - Enhanced clarity */}
      <div className="mb-8">
        {!hasData ? (
          <div className="text-center py-8">
            <div className="size-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
              <FiUsers className="size-6 text-gray-400" />
            </div>
            <h4 className="text-base font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Sin datos este mes
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Los registros aparecerán al inscribir estudiantes
            </p>
          </div>
        ) : (
          <>
          <div className="flex items-end justify-between mb-3">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-baseline gap-2"
            >
              <span className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                <AnimatedNumber value={totalLastMonth} />
              </span>
              <span className="text-sm text-text-secondary dark:text-text-tertiary">
                estudiantes
              </span>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold ${getTrendBg()} ${getTrendColor()}`}
            >
              {trend === 'up' ? <FiArrowUp className="size-4" /> : 
              trend === 'down' ? <FiArrowDown className="size-4" /> : 
              <FiTrendingUp className="size-4" />}
              <span>{Math.abs(isNaN(percentageChange) || !isFinite(percentageChange) ? 0 : percentageChange)}%</span>
            </motion.div>
          </div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs text-text-secondary dark:text-text-tertiary bg-gray-50 dark:bg-gray-800/50 px-2.5 py-1.5 rounded-lg inline-block"
          >
            {trend === 'up' ? '↑ Incremento' : trend === 'down' ? '↓ Reducción' : '→ Sin cambios'} 
            {' '}vs mes anterior
          </motion.p>
          </>
        )}
      </div>

      {/* Weekly Breakdown - Enhanced with clearer labels and tooltips */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-text-secondary dark:text-text-tertiary uppercase tracking-wider">
            Semanas
          </h4>
          <span className="text-[10px] font-medium text-text-tertiary bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
            {safeWeeklyBreakdown.reduce((a, b) => a + (b?.count || 0), 0)} total
          </span>
        </div>
        
        {hasWeeklyData ? (
        <div className="flex items-end justify-between gap-2">
          {safeWeeklyBreakdown.map((item, i) => {
            const count = item?.count || 0;
            const height = count > 0 ? Math.max((count / maxWeekly) * 100, 20) : 8;
            const isMax = count === maxWeekly;
            return (
              <motion.div 
                key={i} 
                className="group relative flex flex-1 flex-col items-center gap-1.5"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.08 }}
              >
                <div className="flex h-20 w-full items-end overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800/50">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ duration: 0.6, delay: 0.7 + i * 0.08, ease: "easeOut" }}
                    className={`w-full transition-all duration-300 group-hover:opacity-80 ${
                      isMax 
                        ? 'bg-brand-600 dark:bg-brand-500' 
                        : 'bg-brand-400 dark:bg-brand-600'
                    }`}
                  />
                </div>
                <span className="text-[9px] font-medium text-text-tertiary">{item?.label || `S${i+1}`}</span>
                
                {/* Enhanced Tooltip with context */}
                <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                  <div className="bg-gray-900 dark:bg-gray-700 text-white text-[10px] px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
                    <div className="font-bold">{count} estudiante{count !== 1 ? 's' : ''}</div>
                    {isMax && <div className="text-brand-300 text-[9px] mt-0.5">★ Mayor actividad</div>}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        ) : (
          <div className="h-20 flex items-center justify-center text-xs text-text-tertiary">
            Sin datos disponibles
          </div>
        )}
      </div>

      {/* Daily Activity - Enhanced with tooltips */}
      <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
        <h4 className="text-xs font-semibold text-text-secondary dark:text-text-tertiary uppercase tracking-wider mb-3">
          Últimos 7 días
        </h4>
        {hasDailyData ? (
        <div className="flex items-end justify-between gap-1.5">
          {safeDailyBreakdown.map((item, i) => {
            const count = item?.count || 0;
            const hasActivity = count > 0;
            const maxCount = Math.max(...safeDailyBreakdown.map(d => d?.count || 0), 1);
            const height = hasActivity ? Math.max((count / maxCount) * 32, 8) : 4;
            
            return (
              <motion.div 
                key={i} 
                className="flex-1 flex flex-col items-center gap-1 group relative"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + i * 0.04 }}
              >
                <div className="relative w-full flex items-end justify-center">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: height }}
                    transition={{ duration: 0.3, delay: 1.05 + i * 0.04 }}
                    className={`w-3 rounded-sm ${hasActivity ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                  />
                  {/* Tooltip para días */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                    <div className="bg-gray-900 dark:bg-gray-700 text-white text-[9px] px-2 py-1 rounded whitespace-nowrap">
                      {count} {count === 1 ? 'registro' : 'registros'}
                    </div>
                  </div>
                </div>
                <span className="text-[9px] font-medium text-text-tertiary">{item?.label || '-'}</span>
              </motion.div>
            );
          })}
        </div>
        ) : (
          <div className="flex items-end justify-between gap-1.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-3 h-2 rounded-sm bg-gray-200 dark:bg-gray-700" />
                <span className="text-[9px] text-text-tertiary">-</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default GrowthMetrics;
