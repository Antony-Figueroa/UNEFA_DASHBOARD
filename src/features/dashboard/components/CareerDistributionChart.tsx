import React, { useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

interface CareerDistributionChartProps {
  data: { careerName: string; studentCount: number; percentage: number }[];
  loading?: boolean;
}

const CareerDistributionChart: React.FC<CareerDistributionChartProps> = ({ data, loading }) => {
  const [viewType, setViewType] = useState<'bar' | 'donut'>('bar');

  if (loading) {
    return (
      <div className="h-100 w-full animate-pulse bg-gray-100 rounded-xl dark:bg-gray-800/50 flex items-center justify-center">
        <span className="text-gray-400">Cargando distribución por carrera...</span>
      </div>
    );
  }

  // Bar Chart Options
  const barOptions: ApexOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: true,
        distributed: true,
        barHeight: '60%'
      }
    },
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
    dataLabels: {
      enabled: true,
      formatter: function (val, opt) {
        return `${val} (${data[opt.dataPointIndex].percentage}%)`;
      },
      textAnchor: 'start',
      style: { colors: ['#fff'] },
      offsetX: 0
    },
    xaxis: {
      categories: data.map(d => d.careerName),
      labels: { show: false }
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '12px',
          fontWeight: 500,
          colors: '#64748b'
        }
      }
    },
    grid: { show: false },
    tooltip: {
      theme: 'dark',
      y: {
        title: { formatter: () => 'Estudiantes:' }
      }
    },
    legend: { show: false }
  };

  const barSeries = [{
    data: data.map(d => d.studentCount)
  }];

  // Donut Chart Options
  const donutOptions: ApexOptions = {
    chart: { type: 'donut' },
    labels: data.map(d => d.careerName),
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      fontSize: '12px',
      markers: { size: 6 },
      itemMargin: { horizontal: 10, vertical: 5 }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              formatter: () => data.reduce((acc, curr) => acc + curr.studentCount, 0).toString()
            }
          }
        }
      }
    },
    dataLabels: { enabled: false }
  };

  const donutSeries = data.map(d => d.studentCount);

  return (
    <div className="rounded-xl border border-border-light bg-white p-6 shadow-sm dark:bg-gray-900">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Estudiantes por Carrera</h3>
          <p className="text-sm text-gray-500">Distribución académica actual</p>
        </div>
        <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
          <button
            onClick={() => setViewType('bar')}
            className={`rounded-md p-1.5 transition-all ${
              viewType === 'bar' ? 'bg-white shadow-sm dark:bg-gray-700' : 'text-gray-500'
            }`}
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>
          <button
            onClick={() => setViewType('donut')}
            className={`rounded-md p-1.5 transition-all ${
              viewType === 'donut' ? 'bg-white shadow-sm dark:bg-gray-700' : 'text-gray-500'
            }`}
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="min-h-87.5">
        {viewType === 'bar' ? (
          <ReactApexChart options={barOptions} series={barSeries} type="bar" height={350} />
        ) : (
          <ReactApexChart options={donutOptions} series={donutSeries} type="donut" height={350} />
        )}
      </div>

      <div className="mt-4 space-y-3">
        {data.slice(0, 3).map((career, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`size-2 rounded-full`} style={{ backgroundColor: barOptions.colors![i] }} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-50">
                {career.careerName}
              </span>
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-white">{career.studentCount}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CareerDistributionChart;
