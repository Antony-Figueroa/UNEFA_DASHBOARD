/**
 * @file TutorDistributionChart.tsx
 * @description Component showing student distribution by tutor
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { FiUsers, FiUserCheck, FiUser } from 'react-icons/fi';
import { Skeleton } from '../../../components/ui/skeleton';
import { generateTooltipHTML, extractValueFromSeries } from '../utils/tooltipUtils';

interface TutorData {
  tutorName: string;
  count: number;
}

interface TutorDistributionChartProps {
  data: TutorData[];
  loading?: boolean;
}

const tutorColors = [
  '#054F94', '#12B76A', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316'
];

const TutorDistributionChart: React.FC<TutorDistributionChartProps> = ({ data, loading }) => {
  const total = data.reduce((acc, d) => acc + d.count, 0);
  const maxCount = Math.max(...data.map(d => d.count), 1);

  const series = data.map(d => d.count);
  
  const options: ApexOptions = {
    chart: {
      type: 'bar',
      fontFamily: 'Outfit, system-ui, sans-serif',
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 6,
        barHeight: '60%',
        distributed: true,
      }
    },
    colors: tutorColors,
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '11px',
        fontWeight: 600,
        colors: ['#fff']
      },
      formatter: (val: string | number) => Number(val) > 0 ? String(val) : ''
    },
    legend: { show: false },
    xaxis: {
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '11px',
          fontWeight: 500,
          colors: '#64748b'
        }
      }
    },
    grid: {
      borderColor: '#f1f5f9',
      strokeDashArray: 3,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: false } },
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
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
          label: label || 'Sin tutor',
          count: value,
          unit: 'estudiante',
          icon: '',
        });
      },
      style: { fontSize: '11px', fontFamily: 'Outfit, sans-serif' },
      marker: { show: true },
    },
    stroke: { show: false }
  };

  if (loading) {
    return (
      <div className="flex min-h-[360px] flex-col rounded-2xl border border-border-light bg-white p-5 shadow-sm dark:border-border-dark dark:bg-gray-900">
        <Skeleton height={24} width="50%" className="mb-4" />
        <Skeleton height={150} className="rounded-xl flex-1" />
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
            className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg shadow-purple-500/20"
          >
            <FiUserCheck className="size-5 text-white" />
          </motion.div>
          <div>
            <h3 className="text-base font-bold text-text-primary">
              Tutores
            </h3>
            <p className="text-xs text-text-secondary dark:text-text-tertiary">
              Estudiantes por tutor
            </p>
          </div>
        </div>
        {total > 0 && (
          <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-2 py-1 rounded-full">
            {total} total
          </span>
        )}
      </div>

      {/* Chart or Empty State */}
      {data.length === 0 || total === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
          <div className="size-14 rounded-xl bg-bg-secondary dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
            <FiUser className="size-6 text-text-tertiary" />
          </div>
          <h4 className="text-sm font-medium text-text-secondary dark:text-gray-400">
            Sin tutores asignados
          </h4>
          <p className="text-xs text-text-tertiary mt-1">
            Los tutores aparecerán al asignar prácticas
          </p>
        </div>
      ) : (
        <>
          <ReactApexChart
            options={options}
            series={[{ data: series }]}
            type="bar"
            height={Math.min(Math.max(data.length * 40, 150), 240)}
          />
          
          {/* Legend */}
          <div className="mt-auto pt-3 border-t border-border-light dark:border-border-dark">
            <div className="grid grid-cols-2 gap-2">
              {data.slice(0, 4).map((tutor, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tutorColors[i % tutorColors.length] }}
                  />
                  <span className="text-text-secondary truncate">
                    {tutor.tutorName}
                  </span>
                  <span className="font-semibold text-text-primary ml-auto">
                    {tutor.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default TutorDistributionChart;