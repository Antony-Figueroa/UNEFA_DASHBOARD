/**
 * @file EvaluationStatsChart.tsx
 * @description Component showing evaluation status: completed vs pending
 */

import React from 'react';
import { motion } from 'framer-motion';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { FiCheckCircle, FiClock, FiClipboard } from 'react-icons/fi';
import { Skeleton } from '../../../components/ui/skeleton';
import { generateTooltipHTML, extractValueFromSeries } from '../utils/tooltipUtils';

interface EvaluationStatsChartProps {
  pending: number;
  completed: number;
  loading?: boolean;
}

const EvaluationStatsChart: React.FC<EvaluationStatsChartProps> = ({ pending, completed, loading }) => {
  const total = pending + completed;
  const completedPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const pendingPercentage = total > 0 ? Math.round((pending / total) * 100) : 0;

  const series = [completed, pending];
  
  const options: ApexOptions = {
    chart: {
      type: 'donut',
      fontFamily: 'Outfit, system-ui, sans-serif',
    },
    labels: ['Completadas', 'Pendientes'],
    colors: ['#12B76A', '#F59E0B'],
    legend: {
      show: false,
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '12px',
              fontWeight: 600,
              color: '#64748b',
              offsetY: -10,
            },
            value: {
              show: true,
              fontSize: '24px',
              fontWeight: 700,
              color: '#1f2937',
              offsetY: 5,
              formatter: (val) => val,
            },
            total: {
              show: true,
              showAlways: true,
              label: 'Total',
              fontSize: '12px',
              fontWeight: 500,
              color: '#94a3b8',
              formatter: () => total.toString()
            }
          }
        }
      }
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      theme: 'light',
      custom: ({ seriesIndex, dataPointIndex, w }: any) => {
        if (dataPointIndex === undefined || dataPointIndex < 0) return '';
        
        // Try multiple sources for the label
        let label = '';
        if (w.globals.labels && w.globals.labels[dataPointIndex]) {
          label = w.globals.labels[dataPointIndex];
        } else if (w.globals.categories && w.globals.categories[dataPointIndex]) {
          label = w.globals.categories[dataPointIndex];
        }
        
        // Get value safely using helper
        const seriesData = w.globals.series[seriesIndex];
        const value = extractValueFromSeries(seriesData, dataPointIndex);
        
        const icon = dataPointIndex === 0 ? '✅' : '⏳';
        
        return generateTooltipHTML({
          label: label || 'Sin estado',
          count: value,
          unit: 'evaluación',
          icon,
        });
      },
      style: { fontSize: '11px', fontFamily: 'Outfit, sans-serif' },
      marker: { show: true },
    },
    stroke: {
      width: 0,
    },
    states: {
      hover: {
        filter: { type: 'lighten' }
      }
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-border-light bg-white p-5 shadow-sm dark:border-border-dark dark:bg-gray-900">
        <Skeleton height={24} width="50%" className="mb-4" />
        <Skeleton height={200} className="rounded-xl" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border-light bg-white p-5 shadow-sm dark:border-border-dark dark:bg-gray-900"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20"
        >
          <FiClipboard className="size-5 text-white" />
        </motion.div>
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Evaluaciones
          </h3>
          <p className="text-xs text-text-secondary dark:text-text-tertiary">
            Estado de calificaciones
          </p>
        </div>
      </div>

      {/* Chart */}
      {total === 0 ? (
        <div className="text-center py-8">
          <div className="size-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
            <FiClipboard className="size-6 text-gray-400" />
          </div>
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Sin evaluaciones registradas
          </h4>
          <p className="text-xs text-gray-400 mt-1">
            Las evaluaciones aparecerán al calificar prácticas
          </p>
        </div>
      ) : (
        <div className="relative">
          <ReactApexChart
            options={options}
            series={series}
            type="donut"
            height={220}
          />
        </div>
      )}

      {/* Stats */}
      {total > 0 && (
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div className="text-center p-3 rounded-xl bg-success-50 dark:bg-success-500/10 border border-success-100 dark:border-success-800/30">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <FiCheckCircle className="size-4 text-success-500" />
              <span className="text-xs font-semibold text-success-600 dark:text-success-400">Completadas</span>
            </div>
            <p className="text-xl font-bold text-success-600 dark:text-success-400">{completed}</p>
            <p className="text-[10px] text-success-500/70">{completedPercentage}%</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-warning-50 dark:bg-warning-500/10 border border-warning-100 dark:border-warning-800/30">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <FiClock className="size-4 text-warning-500" />
              <span className="text-xs font-semibold text-warning-600 dark:text-warning-400">Pendientes</span>
            </div>
            <p className="text-xl font-bold text-warning-600 dark:text-warning-400">{pending}</p>
            <p className="text-[10px] text-warning-500/70">{pendingPercentage}%</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default EvaluationStatsChart;