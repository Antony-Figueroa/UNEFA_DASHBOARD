/**
 * @file TrackingStatsChart.tsx
 * @description Component that renders tracking history over days using an area chart.
 * Mirrors the design of RegistrationStatsChart from the dashboard.
 * Includes time-range filtering (7 days, 30 days, all) with smooth animations.
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { TrackingStats } from '../services/trackingService';
import { Skeleton } from '../../../components/ui/skeleton';
import { FiTrendingUp, FiCalendar, FiActivity, FiLayers, FiArrowUp, FiArrowDown, FiMinus } from 'react-icons/fi';

/**
 * Props for the TrackingStatsChart component.
 */
interface TrackingStatsChartProps {
  /** Object with tracking statistics data */
  stats: TrackingStats | null;
  /** Whether the data is currently being fetched */
  loading: boolean;
}

/**
 * TrackingStatsChart component.
 * Visualizes the history of tracking records with interactive daily filtering.
 */
const TrackingStatsChart: React.FC<TrackingStatsChartProps> = ({ stats, loading }) => {
  const [filter, setFilter] = useState<'7d' | '30d' | 'all'>('30d');

  const data = stats?.historicalTrend || [];

  // Filter data client-side without blocking
  const filteredData = useMemo(() => {
    if (data.length === 0) return [];
    if (filter === 'all') return data;
    const available = filter === '7d' ? 7 : 30;
    return data.slice(-available);
  }, [data, filter]);

  const totalRegistrations = useMemo(() => {
    if (filteredData.length === 0) return 0;
    return filteredData.reduce((acc, curr) => acc + curr.count, 0);
  }, [filteredData]);

  const statsCalc = useMemo(() => {
    if (filteredData.length === 0) return { avg: 0, max: 0, min: 0, trend: 0 };
    const counts = filteredData.map(d => d.count || 0);

    // Calculate trend by comparing halves
    const mid = Math.floor(counts.length / 2);
    const firstHalf = counts.slice(0, mid).reduce((a, b) => a + b, 0);
    const secondHalf = counts.slice(mid).reduce((a, b) => a + b, 0);
    const trend = firstHalf > 0 ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100) : 0;

    const total = counts.reduce((a, b) => a + b, 0);
    const avg = counts.length > 0 ? Math.round(total / counts.length) : 0;

    return {
      avg: isNaN(avg) || !isFinite(avg) ? 0 : avg,
      max: Math.max(...counts),
      min: Math.min(...counts),
      trend: isNaN(trend) || !isFinite(trend) ? 0 : trend
    };
  }, [filteredData]);

  const BRAND_COLOR = '#054F94';

  const series = [{
    name: 'Seguimientos',
    data: filteredData.map(d => d.count)
  }];

  const options: ApexOptions = {
    chart: {
      type: 'area',
      height: 320,
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: 'Outfit, system-ui, sans-serif',
      animations: {
        enabled: true,
        speed: 600,
        animateGradually: { enabled: true, delay: 100 },
      },
      sparkline: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth',
      width: 2.5,
      colors: [BRAND_COLOR],
      lineCap: 'round',
    },
    fill: {
      type: 'linear',
      gradient: {
        shadeIntensity: 0.8,
        opacityFrom: 0.5,
        opacityTo: 0.1,
        stops: [0, 90, 100],
        inverseColors: false,
      },
    },
    xaxis: {
      categories: filteredData.map(d => d.date),
      labels: {
        rotate: -45,
        style: {
          fontSize: '10px',
          fontFamily: 'Outfit, system-ui, sans-serif',
          colors: '#64748b',
        },
        formatter: (val: string) => {
          if (!val) return '';
          try {
            if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
              const parts = val.split('-');
              const day = parseInt(parts[2]).toString().padStart(2, '0');
              const month = parseInt(parts[1]) - 1;
              const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
              return `${day} ${months[month]}`;
            }
            const date = new Date(val);
            if (!isNaN(date.getTime())) {
              const day = date.getDate().toString().padStart(2, '0');
              const month = date.getMonth();
              const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
              return `${day} ${months[month] || ''}`;
            }
          } catch {
            return String(val).slice(0, 5);
          }
          return String(val).slice(0, 5);
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
      crosshairs: {
        show: true,
        position: 'front',
        stroke: { color: BRAND_COLOR, width: 1, dashArray: 4 },
      },
      tooltip: { enabled: false },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '10px',
          fontFamily: 'Outfit, system-ui, sans-serif',
          colors: '#98a2b3',
        },
        formatter: (value) => Math.round(value).toString(),
        offsetX: -10,
      },
      min: 0,
    },
    colors: [BRAND_COLOR],
    tooltip: {
      theme: 'light',
      x: { show: false },
      y: {
        title: { formatter: () => '' },
        formatter: (val) => `${val} seguimiento${val !== 1 ? 's' : ''}`,
      },
      style: { fontSize: '11px', fontFamily: 'Outfit, sans-serif' },
      marker: { show: true },
    },
    grid: {
      borderColor: '#f1f5f9',
      strokeDashArray: 3,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { top: 5, right: 15, bottom: 0, left: 0 },
    },
    markers: {
      size: 3,
      colors: ['#fff'],
      strokeColors: BRAND_COLOR,
      strokeWidth: 1.5,
      hover: { size: 5 },
    },
    annotations: {
      yaxis: statsCalc.avg > 0 && isFinite(statsCalc.avg) ? [{
        y: statsCalc.avg,
        borderColor: '#12B76A',
        strokeDashArray: 4,
        label: {
          text: `Promedio: ${statsCalc.avg}`,
          style: { background: '#12B76A', color: '#fff', fontSize: '10px' }
        }
      }] : []
    }
  };

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-full w-full rounded-2xl border border-border-light bg-white p-6 shadow-sm dark:border-border-dark dark:bg-gray-900"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton height={24} width={200} className="mb-2" />
            <Skeleton height={16} width={160} />
          </div>
          <Skeleton height={36} width={140} />
        </div>
        <Skeleton height={280} className="rounded-xl" />
      </motion.div>
    );
  }

  // Trend indicator helpers
  const getTrendIcon = () => {
    if (statsCalc.trend > 0) return <FiArrowUp className="size-3" />;
    if (statsCalc.trend < 0) return <FiArrowDown className="size-3" />;
    return <FiMinus className="size-3" />;
  };

  const getTrendColor = () => {
    if (statsCalc.trend > 0) return 'text-success-600 dark:text-success-400';
    if (statsCalc.trend < 0) return 'text-error-500 dark:text-error-400';
    return 'text-gray-500';
  };

  const filterLabels = {
    '7d': '7 días',
    '30d': '30 días',
    'all': 'Todo'
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="h-full w-full rounded-2xl border border-border-light bg-white p-6 shadow-sm dark:border-border-dark dark:bg-gray-900"
    >
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 dark:from-brand-600 dark:to-brand-700 shadow-lg shadow-brand-500/20"
          >
            <FiTrendingUp className="size-5 text-white" />
          </motion.div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
              Histórico de Seguimientos
            </h3>
            <p className="text-xs text-text-secondary dark:text-text-tertiary">
              Registros por día
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Total Counter */}
          <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-md bg-brand-50 dark:bg-brand-500/10">
            <FiCalendar className="size-3 text-brand-600 dark:text-brand-400" />
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
              {totalRegistrations}
            </span>
          </div>
          
          {/* Trend Badge */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${
            statsCalc.trend > 0 
              ? 'bg-success-50 dark:bg-success-500/10' 
              : statsCalc.trend < 0 
                ? 'bg-error-50 dark:bg-error-500/10'
                : 'bg-gray-50 dark:bg-gray-800'
          }`}>
            <span className={getTrendColor()}>{getTrendIcon()}</span>
            <span className={`text-xs font-bold ${getTrendColor()}`}>
              {statsCalc.trend > 0 ? '+' : ''}{statsCalc.trend}%
            </span>
          </div>
          
          {/* Filter Buttons */}
          <div className="flex rounded bg-gray-100 dark:bg-gray-800 p-0.5">
            {(['7d', '30d', 'all'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded text-[10px] font-medium px-2 py-0.5 transition-all ${
                  filter === f
                    ? 'bg-white text-brand-600 shadow-sm dark:bg-gray-700 dark:text-brand-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                {filterLabels[f]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart or Empty State */}
      <div className="h-72">
        {filteredData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 border border-dashed border-gray-200 dark:border-gray-700">
            <div className="size-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <FiTrendingUp className="size-6 text-gray-400" />
            </div>
            <h4 className="text-base font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Sin seguimientos en este período
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-500 max-w-sm mx-auto">
              Los registros de seguimiento aparecerán aquí cuando se creen
            </p>
          </div>
        ) : filteredData.length === 1 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center size-20 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 dark:from-brand-600 dark:to-brand-700 shadow-xl shadow-brand-500/20 mb-4">
                <span className="text-3xl font-bold text-white">{filteredData[0].count}</span>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                {filteredData[0].count === 1 ? '1 seguimiento' : `${filteredData[0].count} seguimientos`}
              </p>
              <p className="text-xs text-text-secondary dark:text-text-tertiary">
                registrado el {new Date(filteredData[0].date).toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </motion.div>
          </div>
        ) : (
          <ReactApexChart 
            key={`chart-${filter}-${filteredData.length}`}
            options={options} 
            series={series} 
            type="area" 
            height={280} 
          />
        )}
      </div>

      {/* Quick Stats */}
      {data.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <div className="text-center p-2 rounded-lg bg-brand-50/50 dark:bg-brand-500/5">
            <div className="flex items-center justify-center gap-1 mb-1">
              <FiLayers className="size-3 text-brand-500" />
              <span className="text-[9px] font-medium text-brand-600 dark:text-brand-400">PROMEDIO</span>
            </div>
            <span className="text-lg font-bold text-brand-600 dark:text-brand-400">{statsCalc.avg}</span>
          </div>
          <div className="text-center p-2 rounded-lg bg-success-50/50 dark:bg-success-500/5">
            <div className="flex items-center justify-center gap-1 mb-1">
              <FiTrendingUp className="size-3 text-success-500" />
              <span className="text-[9px] font-medium text-success-600 dark:text-success-400">MÁXIMO</span>
            </div>
            <span className="text-lg font-bold text-success-600 dark:text-success-400">{statsCalc.max}</span>
          </div>
          <div className="text-center p-2 rounded-lg bg-gray-50/50 dark:bg-gray-800/50">
            <div className="flex items-center justify-center gap-1 mb-1">
              <FiActivity className="size-3 text-gray-400" />
              <span className="text-[9px] font-medium text-gray-500">MÍNIMO</span>
            </div>
            <span className="text-lg font-bold text-gray-500 dark:text-gray-400">{statsCalc.min}</span>
          </div>
        </div>
      )}

      {/* Mobile Total */}
      <div className="mt-4 flex sm:hidden items-center justify-center gap-2 px-3 py-2 rounded-lg bg-brand-50 dark:bg-brand-500/10">
        <FiCalendar className="size-4 text-brand-600 dark:text-brand-400" />
        <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">
          {totalRegistrations} seguimientos en este período
        </span>
      </div>
    </motion.div>
  );
};

export default TrackingStatsChart;
