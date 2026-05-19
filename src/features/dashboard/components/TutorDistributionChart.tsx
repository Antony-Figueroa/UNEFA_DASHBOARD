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
      y: {
        formatter: (val) => `${val} estudiante${val !== 1 ? 's' : ''}`
      }
    },
    stroke: { show: false }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-border-light bg-white p-5 shadow-sm dark:border-border-dark dark:bg-gray-900">
        <Skeleton height={24} width="50%" className="mb-4" />
        <Skeleton height={150} className="rounded-xl" />
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
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
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
        <div className="text-center py-8">
          <div className="size-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
            <FiUser className="size-6 text-gray-400" />
          </div>
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Sin tutores asignados
          </h4>
          <p className="text-xs text-gray-400 mt-1">
            Los tutores aparecerán al asignar prácticas
          </p>
        </div>
      ) : (
        <>
          <ReactApexChart
            options={options}
            series={[{ data: series }]}
            type="bar"
            height={Math.max(data.length * 40, 150)}
          />
          
          {/* Legend */}
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="grid grid-cols-2 gap-2">
              {data.slice(0, 4).map((tutor, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tutorColors[i % tutorColors.length] }}
                  />
                  <span className="text-gray-600 dark:text-gray-400 truncate">
                    {tutor.tutorName}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white ml-auto">
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