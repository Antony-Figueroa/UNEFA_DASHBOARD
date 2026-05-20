/**
 * @file CareerDistributionChart.tsx
 * @description Componente rediseñado que muestra la distribución de estudiantes por carrera
 * con visualización moderna tipo tarjetas y gráfico circular mejorado.
 * Enhanced with clearer interactions and consistent states.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { DashboardStats } from '../types';
import { Skeleton } from '../../../components/ui/skeleton';
import { generateTooltipHTML, extractValueFromSeries } from '../utils/tooltipUtils';
import { 
  FiPieChart, 
  FiBarChart2, 
  FiUsers,
  FiTrendingUp,
  FiTrendingDown,
  FiMinus,
  FiBookOpen,
  FiGrid,
  FiStar,
  FiArchive
} from 'react-icons/fi';

interface CareerDistributionChartProps {
  data: DashboardStats['careerDistribution'];
  loading?: boolean;
}

// Colores institucionales UNEFA
const careerColors = [
  '#054F94', // Azul UNEFA principal
  '#C5A059', // Dorado insignias
  '#065A99', // Azul oscuro
  '#D4AF37', // Oro brillante
  '#0A6FBF', // Azul medio
  '#B8860B', // Oro oscuro
  '#033563', // Azul muy oscuro
  '#12B76A', // Verde success
];

// Iconos para carreras usando react-icons
const getCareerIcon = (index: number) => {
  const icons = [
    <FiArchive key="0" className="text-brand-600" />,
    <FiUsers key="1" className="text-brand-500" />,
    <FiTrendingUp key="2" className="text-success-500" />,
    <FiBarChart2 key="3" className="text-warning-500" />,
    <FiPieChart key="4" className="text-brand-400" />,
    <FiBookOpen key="5" className="text-brand-600" />,
    <FiGrid key="6" className="text-gray-500" />,
    <FiStar key="7" className="text-yellow-500" />,
  ];
  return icons[index % icons.length];
};

const CareerDistributionChart: React.FC<CareerDistributionChartProps> = ({ data, loading }) => {
  const [viewType, setViewType] = useState<'donut' | 'bar'>('donut');

  const totalStudents = useMemo(() => 
    data.reduce((acc, curr) => acc + curr.studentCount, 0),
  [data]);

  const maxStudents = useMemo(() => 
    Math.max(...data.map(d => d.studentCount), 1),
  [data]);

  // Ordenar carreras por cantidad de estudiantes
  const sortedData = useMemo(() => 
    [...data].sort((a, b) => b.studentCount - a.studentCount),
  [data]);

  // Top 3 carreras
  const topCareers = useMemo(() => sortedData.slice(0, 3), [sortedData]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border-light bg-white p-5 shadow-sm dark:border-border-dark dark:bg-gray-900">
        <div className="flex items-center justify-between mb-5">
          <Skeleton height={24} width={180} />
          <Skeleton height={32} width={100} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} height={100} className="rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-border-light bg-white p-5 shadow-sm dark:border-border-dark dark:bg-gray-900">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center justify-center size-9 rounded-xl bg-brand-50 dark:bg-brand-500/10">
            <FiBookOpen className="size-4 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Distribución por Carrera
            </h3>
            <p className="text-xs text-text-secondary dark:text-text-tertiary">
              Sin datos disponibles
            </p>
          </div>
        </div>
        <div className="h-64 flex flex-col items-center justify-center text-center p-6 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 border border-dashed border-gray-200 dark:border-gray-700">
          <div className="size-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <FiBookOpen className="size-6 text-gray-400" />
          </div>
          <h4 className="text-base font-semibold text-gray-600 dark:text-gray-400 mb-2">
            Sin carreras registradas
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-500 max-w-sm mx-auto">
            Las carreras y su distribución aparecerán aquí cuando se agreguen al sistema
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
            <span>Esperando datos...</span>
          </div>
        </div>
      </div>
    );
  }

  // Configuración del gráfico de dona
  const donutOptions: ApexOptions = {
    chart: {
      type: 'donut',
      fontFamily: 'Outfit, system-ui, sans-serif',
    },
    labels: data.map(d => d.careerName),
    colors: careerColors,
    legend: {
      show: false // Ocultar leyenda del gráfico para usar la nuestra
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
              fontSize: '28px',
              fontWeight: 700,
              color: '#054F94',
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
              formatter: () => totalStudents.toLocaleString()
            }
          }
        }
      }
    },
    dataLabels: { enabled: false },
    tooltip: {
      theme: 'light',
      custom: ({ seriesIndex, dataPointIndex, w }: any) => {
        if (dataPointIndex === undefined || dataPointIndex < 0) return '';
        
        // Get label - try multiple sources
        let label = '';
        if (w.globals.labels && w.globals.labels[dataPointIndex]) {
          label = w.globals.labels[dataPointIndex];
        } else if (w.globals.categories && w.globals.categories[dataPointIndex]) {
          label = w.globals.categories[dataPointIndex];
        }
        
        // Get value - handle different series structures
        let value = 0;
        
        // For donut charts: w.globals.series is a simple array [10, 20, 30]
        if (w.globals.series && Array.isArray(w.globals.series)) {
          // Check if it's array of arrays (bar/line) or simple array (donut/pie)
          if (Array.isArray(w.globals.series[0])) {
            // Multi-series: [[10, 20], [30, 40]]
            const seriesItem = w.globals.series[seriesIndex];
            if (Array.isArray(seriesItem)) {
              value = seriesItem[dataPointIndex] ?? 0;
            }
          } else {
            // Single series: [10, 20, 30] - typical for donut/pie
            value = w.globals.series[dataPointIndex] ?? 0;
          }
        }
        
        // Handle 0 or undefined values - show appropriate message
        if (value === 0 || value === undefined) {
          return generateTooltipHTML({
            label: label || 'Sin carrera',
            count: 0,
            unit: 'estudiantes',
            icon: '🎓',
          });
        }
        
        return generateTooltipHTML({
          label: label || 'Sin carrera',
          count: value,
          unit: 'estudiantes',
          icon: '🎓',
        });
      },
      style: { fontSize: '11px', fontFamily: 'Outfit, sans-serif' },
      marker: { show: true }
    },
    stroke: {
      show: true,
      width: 3,
      colors: ['#fff']
    },
  };

  const donutSeries = data.map(d => d.studentCount);

  // Configuración del gráfico de barras horizontales
  const barOptions: ApexOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        horizontal: true,
        distributed: true,
        barHeight: '50%',
        dataLabels: {
          position: 'center'
        }
      }
    },
    colors: careerColors,
    dataLabels: {
      enabled: true,
      formatter: function (val, opt) {
        const percentage = data[opt.dataPointIndex]?.percentage || 0;
        return `${val} est. (${percentage}%)`;
      },
      style: {
        colors: ['#fff'],
        fontSize: '11px',
        fontWeight: 600,
      },
      dropShadow: {
        enabled: true,
        top: 1,
        left: 1,
        blur: 2,
        color: '#000',
        opacity: 0.3
      }
    },
    xaxis: {
      categories: data.map(d => d.careerName),
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '12px',
          fontWeight: 600,
          colors: '#374151',
        },
      }
    },
    grid: {
      show: false,
    },
    tooltip: {
      theme: 'light',
      custom: ({ seriesIndex, dataPointIndex, w }: any) => {
        if (dataPointIndex === undefined || dataPointIndex < 0) return '';
        
        // Get label from multiple sources
        let label = '';
        if (w.globals.categories && w.globals.categories[dataPointIndex]) {
          label = w.globals.categories[dataPointIndex];
        } else if (w.globals.labels && w.globals.labels[dataPointIndex]) {
          label = w.globals.labels[dataPointIndex];
        }
        
        // Get value - same logic as donut for consistency
        let value = 0;
        if (w.globals.series && Array.isArray(w.globals.series)) {
          if (Array.isArray(w.globals.series[0])) {
            const seriesItem = w.globals.series[seriesIndex];
            if (Array.isArray(seriesItem)) {
              value = seriesItem[dataPointIndex] ?? 0;
            }
          } else {
            value = w.globals.series[dataPointIndex] ?? 0;
          }
        }
        
        return generateTooltipHTML({
          label: label || 'Sin carrera',
          count: value,
          unit: 'estudiantes',
          icon: '🎓',
        });
      },
      style: { fontSize: '11px', fontFamily: 'Outfit, sans-serif' },
      marker: { show: true },
    },
  };

  const barSeries = [{
    data: data.map(d => d.studentCount)
  }];

  return (
    <div className="rounded-2xl border border-border-light bg-white p-5 shadow-sm dark:border-border-dark dark:bg-gray-900">
      {/* Header - Enhanced */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 dark:from-brand-600 dark:to-brand-700 shadow-lg shadow-brand-500/20"
          >
            <FiBookOpen className="size-5 text-white" />
          </motion.div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
              Distribución por Carrera
            </h3>
            <p className="text-xs text-text-secondary dark:text-text-tertiary">
              {data.length} carrera{data.length !== 1 ? 's' : ''} • {totalStudents.toLocaleString()} est.
            </p>
          </div>
        </div>
        
        {/* View Toggle - Compact */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-gray-100 dark:bg-gray-800">
          <button
            onClick={() => setViewType('donut')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all ${
              viewType === 'donut'
                ? 'bg-white text-brand-600 shadow-sm dark:bg-gray-700 dark:text-brand-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <FiPieChart className="size-3" />
          </button>
          <button
            onClick={() => setViewType('bar')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all ${
              viewType === 'bar'
                ? 'bg-white text-brand-600 shadow-sm dark:bg-gray-700 dark:text-brand-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <FiBarChart2 className="size-3" />
          </button>
        </div>
      </div>

      {/* Content */}
<AnimatePresence mode="wait">
        {viewType === 'donut' && (
          <motion.div
            key="donut"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-5 gap-5"
          >
            {/* Gráfico circular más grande */}
            <div className="lg:col-span-2 flex items-center justify-center">
              <ReactApexChart
                options={donutOptions}
                series={donutSeries}
                type="donut"
                height={320}
              />
            </div>
            
            {/* Leyenda detallada */}
            <div className="lg:col-span-3 space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-2">
              {sortedData.map((career, i) => (
                <motion.div
                  key={career.careerName}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all hover:shadow-sm"
                >
                  <div
                    className="size-4 rounded-full flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: careerColors[i % careerColors.length] }}
                  />
                  <span className="text-base">{getCareerIcon(i)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {career.careerName}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${career.percentage}%` }}
                          transition={{ delay: i * 0.05 + 0.2, duration: 0.5 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: careerColors[i % careerColors.length] }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-right min-w-[60px]">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {career.studentCount}
                    </span>
                    <p className="text-[9px] text-text-secondary dark:text-text-tertiary">
                      {career.percentage}%
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {viewType === 'bar' && (
          <motion.div
            key="bar"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header stats */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-50 dark:bg-brand-500/10">
                <FiUsers className="size-4 text-brand-600 dark:text-brand-400" />
                <span className="text-sm font-bold text-brand-600 dark:text-brand-400">
                  {totalStudents}
                </span>
                <span className="text-[10px] text-brand-500">est.</span>
              </div>
              <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
              <span className="text-xs font-medium text-text-secondary dark:text-text-tertiary">
                {data.length} carreras registradas
              </span>
            </div>
            
            <ReactApexChart
              options={barOptions}
              series={barSeries}
              type="bar"
              height={Math.max(data.length * 45, 250)}
            />
            
            {/* Quick stats - Enhanced */}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-3 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/30 dark:to-brand-800/20 border border-brand-100 dark:border-brand-800">
                  <p className="text-lg font-bold text-brand-600 dark:text-brand-400">
                    {data.length}
                  </p>
                  <p className="text-[10px] font-medium text-brand-500 dark:text-brand-400">Carreras</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-gradient-to-br from-success-50 to-success-100 dark:from-success-900/30 dark:to-success-800/20 border border-success-100 dark:border-success-800">
                  <p className="text-lg font-bold text-success-600 dark:text-success-400">
                    {data.length > 0 ? Math.round(totalStudents / data.length) : 0}
                  </p>
                  <p className="text-[10px] font-medium text-success-500 dark:text-success-400">Promedio</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-gradient-to-br from-warning-50 to-warning-100 dark:from-warning-900/30 dark:to-warning-800/20 border border-warning-100 dark:border-warning-800">
                  <p className="text-lg font-bold text-warning-600 dark:text-warning-400">
                    {sortedData[0]?.studentCount || 0}
                  </p>
                  <p className="text-[10px] font-medium text-warning-500 dark:text-warning-400">Máximo</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/30 dark:to-gray-700/20 border border-gray-100 dark:border-gray-700">
                  <p className="text-lg font-bold text-gray-600 dark:text-gray-400">
                    {sortedData[sortedData.length - 1]?.studentCount || 0}
                  </p>
                  <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Mínimo</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CareerDistributionChart;
