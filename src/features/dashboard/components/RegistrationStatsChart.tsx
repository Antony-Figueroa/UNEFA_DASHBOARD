/**
 * @file RegistrationStatsChart.tsx
 * @description Component that renders student registration trends over time using an area chart.
 * Includes time-range filtering (7 days, 30 days, all).
 */

import React, { useState, useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { DashboardStats } from '../types';

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

  const filteredData = useMemo(() => {
    if (filter === '7d') return data.slice(-7);
    if (filter === '30d') return data.slice(-30);
    return data;
  }, [data, filter]);

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
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    xaxis: {
      categories: filteredData.map(d => d.date),
      labels: {
        rotate: -45,
        style: {
          fontSize: '12px',
          colors: '#64748b'
        }
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: '#64748b'
        }
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [20, 100, 100, 100]
      }
    },
    colors: ['#3b82f6'],
    tooltip: {
      x: {
        format: 'dd MMM yyyy'
      },
      y: {
        title: {
          formatter: () => 'Estudiantes:'
        }
      }
    },
    grid: {
      borderColor: '#f1f5f9',
      strokeDashArray: 4
    }
  };

  if (loading) {
    return (
      <div className="h-100 w-full animate-pulse bg-gray-100 rounded-xl dark:bg-gray-800/50 flex items-center justify-center">
        <span className="text-gray-400">Cargando estadísticas...</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border-light bg-white p-6 shadow-sm dark:bg-gray-900">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Estadísticas de Registro</h3>
          <p className="text-sm text-gray-500">Visualización de nuevos estudiantes registrados</p>
        </div>
        <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
          {(['7d', '30d', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                filter === f
                  ? 'bg-white text-brand-600 shadow-sm dark:bg-gray-700 dark:text-brand-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
              aria-label={`Filter by ${f === '7d' ? 'last 7 days' : f === '30d' ? 'last 30 days' : 'all time'}`}
            >
              {f === '7d' ? '7 días' : f === '30d' ? '30 días' : 'Todo'}
            </button>
          ))}
        </div>
      </div>
      <div className="h-87.5">
        <ReactApexChart options={options} series={series} type="area" height={350} />
      </div>
    </div>
  );
};

export default RegistrationStatsChart;
