/**
 * @file RegistrationStatsChart.tsx
 * @description Component that renders student registration trends over time using an area chart.
 * Includes time-range filtering (7 days, 30 days, all) with animations.
 * Enhanced with contextual tooltips and clearer visual hierarchy.
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { DashboardStats } from '../types';
import { Skeleton } from '../../../components/ui/skeleton';
import { FiTrendingUp, FiCalendar, FiActivity, FiLayers } from 'react-icons/fi';

/**
 * Props for the RegistrationStatsChart component.
 */
interface RegistrationStatsChartProps {
  /** Array of registration data points (date and count) */
  data: DashboardStats['registrationStats'];
  /** Whether the data is currently being fetched */
  loading?: boolean;
}

/**
 * RegistrationStatsChart component.
 * Visualizes the history of student registrations with interactive filtering.
 * 
 * @example
 * ```tsx
 * <RegistrationStatsChart data={stats.registrationStats} loading={false} />
 * ```
 */
const RegistrationStatsChart: React.FC<RegistrationStatsChartProps> = ({ data, loading }) => {
  const [filter, setFilter] = useState<'7d' | '30d' | 'all'>('30d');

  // Mostrar todos los datos disponibles sin bloquear filtros
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const available = filter === '7d' ? 7 : filter === '30d' ? 30 : data.length;
    return data.slice(-available);
  }, [data, filter]);

  const totalRegistrations = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return 0;
    return filteredData.reduce((acc, curr) => acc + curr.count, 0);
  }, [filteredData]);

  const stats = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return { avg: 0, max: 0, min: 0 };
    const counts = filteredData.map(d => d.count);
    return {
      avg: Math.round(counts.reduce((a, b) => a + b, 0) / counts.length),
      max: Math.max(...counts),
      min: Math.min(...counts)
    };
  }, [filteredData]);

  const series = [{
    name: 'Registros',
    data: filteredData?.map(d => d.count) || []
  }];

  const BRAND_COLOR = '#054F94';
  const BRAND_LIGHT = '#67baff';

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
      categories: filteredData?.map(d => d.date) || [],
      labels: {
        rotate: -45,
        style: {
          fontSize: '9px',
          fontFamily: 'Outfit, system-ui, sans-serif',
          colors: '#98a2b3',
        },
        formatter: (val) => String(val).length > 5 ? String(val).slice(0, 5) : String(val),
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
        formatter: (val) => `${val} registros`,
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
        <Skeleton height={300} className="rounded-xl" />
      </motion.div>
    );
  }

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
      {/* Header - Cleaner hierarchy */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center size-8 rounded-lg bg-brand-50 dark:bg-brand-500/10">
            <FiTrendingUp className="size-3.5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Registro de Estudiantes
            </h3>
            <p className="text-[10px] text-text-secondary dark:text-text-tertiary">
              Histórico de inscripciones
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Total Counter - Hidden on small screens, show on larger */}
          <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-md bg-brand-50 dark:bg-brand-500/10">
            <FiCalendar className="size-3 text-brand-600 dark:text-brand-400" />
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
              {totalRegistrations}
            </span>
          </div>
          
          {/* Filter Buttons - Always enabled */}
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
        {loading ? (
          <Skeleton height={280} className="rounded-xl" />
        ) : data.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 border border-dashed border-gray-200 dark:border-gray-700">
            <div className="size-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <FiTrendingUp className="size-6 text-gray-400" />
            </div>
            <h4 className="text-base font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Sin registros aún
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-500 max-w-sm mx-auto">
              Las inscripciones aparecerán aquí cuando se registren estudiantes
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
              <span>Esperando datos...</span>
            </div>
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
            <span className="text-lg font-bold text-brand-600 dark:text-brand-400">{stats.avg}</span>
          </div>
          <div className="text-center p-2 rounded-lg bg-success-50/50 dark:bg-success-500/5">
            <div className="flex items-center justify-center gap-1 mb-1">
              <FiTrendingUp className="size-3 text-success-500" />
              <span className="text-[9px] font-medium text-success-600 dark:text-success-400">MÁXIMO</span>
            </div>
            <span className="text-lg font-bold text-success-600 dark:text-success-400">{stats.max}</span>
          </div>
          <div className="text-center p-2 rounded-lg bg-gray-50/50 dark:bg-gray-800/50">
            <div className="flex items-center justify-center gap-1 mb-1">
              <FiActivity className="size-3 text-gray-400" />
              <span className="text-[9px] font-medium text-gray-500">MÍNIMO</span>
            </div>
            <span className="text-lg font-bold text-gray-500 dark:text-gray-400">{stats.min}</span>
          </div>
        </div>
      )}

      {/* Mobile Total */}
      <div className="mt-4 flex sm:hidden items-center justify-center gap-2 px-3 py-2 rounded-lg bg-brand-50 dark:bg-brand-500/10">
        <FiCalendar className="size-4 text-brand-600 dark:text-brand-400" />
        <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">
          {totalRegistrations} registros en este período
        </span>
      </div>
    </motion.div>
  );
};

export default RegistrationStatsChart;
