/**
 * @file RegistrationStatsChart.tsx
 * @description Component that renders student registration trends over time using an area chart.
 * Includes time-range filtering (7 days, 30 days, all) with animations.
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { DashboardStats } from '../types';
import { Skeleton } from '../../../components/ui/skeleton';
import { FiTrendingUp, FiCalendar, FiInfo } from 'react-icons/fi';

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

  // Verificar si hay datos suficientes para el filtro seleccionado
  const hasEnoughData = (filterKey: '7d' | '30d' | 'all') => {
    if (filterKey === '7d') return data.length >= 7;
    if (filterKey === '30d') return data.length >= 30;
    return data.length > 0;
  };

  const filteredData = useMemo(() => {
    if (filter === '7d') return data.slice(-7);
    if (filter === '30d') return data.slice(-30);
    return data;
  }, [data, filter]);

  const totalRegistrations = useMemo(() => {
    return filteredData.reduce((acc, curr) => acc + curr.count, 0);
  }, [filteredData]);

  const series = [{
    name: 'Estudiantes Registrados',
    data: filteredData.map(d => d.count)
  }];

  const options: ApexOptions = {
    chart: {
      type: 'area',
      height: 350,
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      },
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 3,
      colors: ['#054F94']
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.05,
        stops: [0, 100],
        colorStops: [
          { offset: 0, color: '#054F94', opacity: 0.4 },
          { offset: 100, color: '#054F94', opacity: 0.05 }
        ]
      }
    },
    xaxis: {
      categories: filteredData.map(d => d.date),
      labels: {
        rotate: -45,
        style: {
          fontSize: '11px',
          fontFamily: 'Inter, system-ui, sans-serif',
          colors: '#64748b'
        }
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      },
      crosshairs: {
        show: true,
        position: 'back',
        stroke: {
          color: '#054F94',
          width: 1,
          dashArray: 3,
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '11px',
          fontFamily: 'Inter, system-ui, sans-serif',
          colors: '#64748b'
        },
        formatter: (value) => Math.round(value).toString()
      }
    },
    colors: ['#054F94'],
    tooltip: {
      theme: 'light',
      x: {
        format: 'dd MMM yyyy'
      },
      y: {
        title: {
          formatter: () => 'Estudiantes:'
        }
      },
      style: {
        fontSize: '12px',
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      marker: {
        show: true,
      },
    },
    grid: {
      borderColor: '#f1f5f9',
      strokeDashArray: 4,
      xaxis: {
        lines: {
          show: false
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      },
      padding: {
        top: 10,
        right: 10,
        bottom: 0,
        left: 10
      }
    },
    markers: {
      size: 5,
      colors: ['#fff'],
      strokeColors: '#054F94',
      strokeWidth: 2,
      hover: {
        size: 7,
      }
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
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center justify-center size-8 rounded-lg bg-brand-50 dark:bg-brand-500/10">
              <FiTrendingUp className="size-4 text-brand-600 dark:text-brand-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Estadísticas de Registro
            </h3>
          </div>
          <p className="text-sm text-text-secondary dark:text-text-tertiary">
            Visualización de nuevos estudiantes registrados
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Total Counter */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-50 dark:bg-brand-500/10">
            <FiCalendar className="size-4 text-brand-600 dark:text-brand-400" />
            <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">
              {totalRegistrations} registros
            </span>
          </div>
          
          {/* Filter Buttons */}
          <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
            {(['7d', '30d', 'all'] as const).map((f) => {
              const isDisabled = !hasEnoughData(f);
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  disabled={isDisabled}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                    filter === f
                      ? 'bg-white text-brand-600 shadow-sm dark:bg-gray-700 dark:text-brand-400'
                      : isDisabled
                        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                  aria-label={`Filtrar por ${filterLabels[f]}${isDisabled ? ' (no disponible)' : ''}`}
                >
                  {filterLabels[f]}{isDisabled && ' ✕'}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chart or Empty State */}
      <div className="h-80">
        {loading ? (
          <Skeleton height={300} className="rounded-xl" />
        ) : data.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="size-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <FiTrendingUp className="size-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Sin datos de registro
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-500 max-w-xs">
              No hay registros de estudiantes todavía. Los datos aparecerán aquí cuando se inscriban nuevos estudiantes.
            </p>
          </div>
        ) : !hasEnoughData(filter) ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="size-16 rounded-full bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center mb-4">
              <FiInfo className="size-8 text-warning-600 dark:text-warning-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Datos insuficientes
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-500 max-w-xs">
              Solo hay {data.length} día{data.length !== 1 ? 's' : ''} de datos disponibles. 
              Selecciona "{filter === '7d' ? '30d' : 'Todo'}" para ver más información.
            </p>
          </div>
        ) : (
          <ReactApexChart 
            key={`chart-${filter}-${filteredData.length}`}
            options={options} 
            series={series} 
            type="area" 
            height={320} 
          />
        )}
      </div>

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
