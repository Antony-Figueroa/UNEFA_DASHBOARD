import React, { useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { TrackingStats } from "../services/trackingService";

interface TrackingStatsChartProps {
  stats: TrackingStats | null;
  loading: boolean;
}

const TrackingStatsChart: React.FC<TrackingStatsChartProps> = ({ stats, loading }) => {
  const [filter, setFilter] = useState<'7d' | '30d' | 'all'>('all');

  const filteredTrend = useMemo(() => {
    if (!stats) return [];
    if (filter === '7d') return stats.historicalTrend.slice(-7);
    if (filter === '30d') return stats.historicalTrend.slice(-30);
    return stats.historicalTrend;
  }, [stats, filter]);

  const chartOptions: ApexOptions = useMemo(() => ({
    chart: {
      type: 'area',
      height: 350,
      toolbar: { show: false },
      zoom: { enabled: false }
    },
    colors: ['#4F46E5'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [20, 100, 100, 100]
      }
    },
    xaxis: {
      categories: filteredTrend.map(d => d.label) || [],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: '#64748b' }
      }
    },
    yaxis: {
      labels: {
        formatter: (val) => val.toFixed(0),
        style: { colors: '#64748b' }
      }
    },
    tooltip: {
      theme: 'light',
    },
    grid: {
      borderColor: '#f1f1f1',
      strokeDashArray: 4
    }
  }), [filteredTrend]);

  const series = useMemo(() => [{
    name: 'Seguimientos',
    data: filteredTrend.map(d => d.count) || []
  }], [filteredTrend]);

  if (loading && !stats) {
    return (
      <div className="flex h-[350px] items-center justify-center rounded-2xl bg-white p-6 shadow-sm dark:bg-bg-dark border border-border-light dark:border-border-dark">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
          <span className="text-sm text-text-secondary">Cargando estadísticas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-bg-dark border border-border-light dark:border-border-dark">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-text-primary dark:text-white">Tendencia de Seguimientos</h3>
          <p className="text-sm text-text-secondary dark:text-text-tertiary">Visualización de actividad histórica</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
          <button
            onClick={() => setFilter('7d')}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
              filter === '7d' 
                ? 'bg-white text-brand-600 shadow-sm dark:bg-gray-700 dark:text-brand-400' 
                : 'text-text-secondary hover:text-text-primary dark:text-text-tertiary'
            }`}
          >
            7d
          </button>
          <button
            onClick={() => setFilter('30d')}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
              filter === '30d' 
                ? 'bg-white text-brand-600 shadow-sm dark:bg-gray-700 dark:text-brand-400' 
                : 'text-text-secondary hover:text-text-primary dark:text-text-tertiary'
            }`}
          >
            30d
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
              filter === 'all' 
                ? 'bg-white text-brand-600 shadow-sm dark:bg-gray-700 dark:text-brand-400' 
                : 'text-text-secondary hover:text-text-primary dark:text-text-tertiary'
            }`}
          >
            6m
          </button>
        </div>
      </div>
      <ReactApexChart
        options={chartOptions}
        series={series}
        type="area"
        height={350}
      />
    </div>
  );
};

export default TrackingStatsChart;
