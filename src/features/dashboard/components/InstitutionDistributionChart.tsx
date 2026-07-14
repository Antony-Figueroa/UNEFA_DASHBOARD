/**
 * @file InstitutionDistributionChart.tsx
 * @description Component showing student distribution by institution
 */

import React from 'react';
import { motion } from 'framer-motion';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { FiHome, FiGrid } from 'react-icons/fi';
import { Skeleton } from '../../../components/ui/skeleton';
import { generateTooltipHTML, extractValueFromSeries } from '../utils/tooltipUtils';

interface InstitutionData {
  institutionName: string;
  count: number;
}

interface InstitutionDistributionChartProps {
  data: InstitutionData[];
  loading?: boolean;
}

const institutionColors = [
  '#06B6D4', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1', '#EF4444', '#14B8A6'
];

const InstitutionDistributionChart: React.FC<InstitutionDistributionChartProps> = ({ data, loading }) => {
  const total = data.reduce((acc, d) => acc + d.count, 0);

  // Take top 8 institutions for chart
  const chartData = data.slice(0, 8);
  
  const options: ApexOptions = {
    chart: {
      type: 'donut',
      fontFamily: 'Outfit, system-ui, sans-serif',
      sparkline: { enabled: false },
    },
    labels: chartData.map(d => d.institutionName),
    colors: institutionColors,
    legend: {
      show: true,
      position: 'bottom',
      horizontalAlign: 'left',
      offsetY: 0,
      fontSize: '11px',
      fontWeight: 500,
      markers: { size: 6 },
      itemMargin: { horizontal: 8, vertical: 2 },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
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
              fontSize: '22px',
              fontWeight: 700,
              color: '#1f2937',
              offsetY: 5,
              formatter: (val) => val,
            },
            total: {
              show: true,
              showAlways: true,
              label: 'Instituciones',
              fontSize: '12px',
              fontWeight: 500,
              color: '#94a3b8',
              formatter: () => chartData.length.toString()
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
        
        return generateTooltipHTML({
          label: label || 'Sin institución',
          count: value,
          unit: 'estudiante',
          icon: '',
        });
      },
      style: { fontSize: '11px', fontFamily: 'Outfit, sans-serif' },
      marker: { show: true },
    },
    stroke: {
      width: 2,
      colors: ['var(--color-bg-primary, #fff)'],
    },
  };

  if (loading) {
    return (
      <div className="flex min-h-[360px] flex-col rounded-2xl border border-border-light bg-white p-5 shadow-sm dark:border-border-dark dark:bg-gray-900">
        <Skeleton height={24} width="50%" className="mb-4" />
        <Skeleton height={200} className="rounded-xl flex-1" />
      </div>
    );
  }

  return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex min-h-[360px] flex-col rounded-2xl border border-border-light bg-white p-5 shadow-sm dark:border-border-dark dark:bg-gray-900"
      >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 shadow-lg shadow-cyan-500/20"
          >
            <FiHome className="size-5 text-white" />
          </motion.div>
          <div>
            <h3 className="text-base font-bold text-text-primary">
              Instituciones
            </h3>
            <p className="text-xs text-text-secondary dark:text-text-tertiary">
              Distribución por institución
            </p>
          </div>
        </div>
        {total > 0 && (
          <span className="text-xs font-medium text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 px-2 py-1 rounded-full">
            {total} estudiantes
          </span>
        )}
      </div>

      {/* Chart or Empty State */}
      {data.length === 0 || total === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
          <div className="size-14 rounded-xl bg-bg-secondary dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
            <FiHome className="size-6 text-text-tertiary" />
          </div>
          <h4 className="text-sm font-medium text-text-secondary dark:text-gray-400">
            Sin instituciones asignadas
          </h4>
          <p className="text-xs text-text-tertiary mt-1">
            Las instituciones aparecerán al asignar prácticas
          </p>
        </div>
      ) : (
        <div className="relative">
          <ReactApexChart
            options={options}
            series={chartData.map(d => d.count)}
            type="donut"
            height={240}
          />
        </div>
      )}

      {/* Top Institutions Summary */}
      {data.length > 0 && total > 0 && (
        <div className="mt-auto pt-3 border-t border-border-light dark:border-border-dark">
          <div className="flex flex-wrap gap-2">
            {data.slice(0, 3).map((inst, i) => (
              <div 
                key={i}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-bg-secondary dark:bg-gray-800 border border-border-light dark:border-border-dark"
              >
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: institutionColors[i % institutionColors.length] }}
                />
                <span className="text-xs font-medium text-text-primary dark:text-gray-300 truncate max-w-[100px]">
                  {inst.institutionName}
                </span>
                <span className="text-xs font-bold text-text-primary dark:text-white">
                  {inst.count}
                </span>
              </div>
            ))}
            {data.length > 3 && (
              <div className="flex items-center px-2.5 py-1.5 rounded-lg bg-bg-secondary dark:bg-gray-800 border border-border-light dark:border-border-dark">
                <span className="text-xs text-text-secondary">+{data.length - 3} más</span>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default InstitutionDistributionChart;