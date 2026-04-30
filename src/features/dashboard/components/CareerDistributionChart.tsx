/**
 * @file CareerDistributionChart.tsx
 * @description Componente rediseñado que muestra la distribución de estudiantes por carrera
 * con visualización moderna tipo tarjetas y gráfico circular mejorado.
 * Enhanced with clearer interactions and consistent states.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { DashboardStats } from '../types';
import { Skeleton } from '../../../components/ui/skeleton';
import { 
  FiPieChart, 
  FiBarChart2, 
  FiUsers,
  FiTrendingUp,
  FiBookOpen,
  FiGrid,
  FiStar,
  FiArchive
} from 'react-icons/fi';

interface CareerDistributionChartProps {
  data: DashboardStats['careerDistribution'];
  loading?: boolean;
}

const STORAGE_KEY = 'dashboard-career-view-preference';

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
  const [viewType, setViewType] = useState<'cards' | 'donut' | 'bar'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'cards' || saved === 'donut' || saved === 'bar') {
        return saved;
      }
    }
    return 'cards';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, viewType);
  }, [viewType]);

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
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    labels: data.map(d => d.careerName),
    colors: careerColors,
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '13px',
              fontWeight: 600,
              color: '#64748b',
            },
            value: {
              show: true,
              fontSize: '32px',
              fontWeight: 700,
              color: '#1f2937',
              formatter: (val) => val,
            },
            total: {
              show: true,
              showAlways: true,
              label: 'Total Estudiantes',
              fontSize: '13px',
              fontWeight: 600,
              color: '#64748b',
              formatter: () => totalStudents.toLocaleString()
            }
          }
        }
      }
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    tooltip: {
      theme: 'dark',
      style: {
        fontSize: '13px',
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      y: {
        formatter: (val) => `${val} estudiantes`,
        title: {
          formatter: () => ''
        }
      },
      marker: {
        show: true
      }
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
      y: {
        title: { formatter: () => 'Estudiantes:' }
      }
    },
  };

  const barSeries = [{
    data: data.map(d => d.studentCount)
  }];

  return (
    <div className="rounded-2xl border border-border-light bg-white p-4 shadow-sm dark:border-border-dark dark:bg-gray-900">
      {/* Header - Compact */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center size-8 rounded-lg bg-brand-50 dark:bg-brand-500/10">
            <FiBookOpen className="size-3.5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Distribución por Carrera
            </h3>
            <p className="text-[10px] text-text-secondary dark:text-text-tertiary">
              {data.length} carrera{data.length !== 1 ? 's' : ''} • {totalStudents.toLocaleString()} est.
            </p>
          </div>
        </div>
        
        {/* View Toggle - Compact */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-gray-100 dark:bg-gray-800">
          <button
            onClick={() => setViewType('cards')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all ${
              viewType === 'cards'
                ? 'bg-white text-brand-600 shadow-sm dark:bg-gray-700 dark:text-brand-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <FiGrid className="size-3" />
          </button>
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
        {viewType === 'cards' && (
          <motion.div
            key="cards"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Top 3 Highlight - Enhanced */}
            {topCareers.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <FiStar className="size-3 text-yellow-500" />
                  <span className="text-[10px] font-medium text-text-secondary dark:text-text-tertiary uppercase tracking-wider">
                    Top 3
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {topCareers.map((career, i) => (
                    <motion.div
                      key={career.careerName}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.06 }}
                      className="relative overflow-hidden rounded-lg bg-gradient-to-br from-brand-600 to-brand-500 p-3 text-white"
                    >
                      <div className="absolute top-0 right-0 size-12 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                      <div className="relative">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-base">{getCareerIcon(i)}</span>
                          <span className="text-[9px] font-semibold bg-white/20 px-1.5 py-0.5 rounded">
                            #{i + 1}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-white/90 line-clamp-2 mb-0.5">
                          {career.careerName}
                        </p>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-bold">{career.studentCount}</span>
                          <span className="text-[9px] text-white/70">({career.percentage}%)</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* All Careers Grid - Compact cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {sortedData.map((career, i) => {
                const color = careerColors[i % careerColors.length];
                const progressWidth = (career.studentCount / maxStudents) * 100;
                
                return (
                  <motion.div
                    key={career.careerName}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="group relative overflow-hidden rounded-md border border-gray-100 bg-white p-2.5 transition-all duration-150 hover:shadow-sm hover:border-brand-200 dark:border-gray-700 dark:bg-gray-800"
                  >
                    {/* Color accent bar */}
                    <div 
                      className="absolute top-0 left-0 w-0.5 h-full transition-all duration-200 group-hover:w-1"
                      style={{ backgroundColor: color }}
                    />
                    
                    <div className="pl-1.5">
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-sm">{getCareerIcon(i)}</span>
                        <span className="text-[9px] font-medium text-text-tertiary">
                          {career.percentage}%
                        </span>
                      </div>
                      
                      <h4 className="text-[11px] font-medium text-gray-900 dark:text-white mb-1.5 line-clamp-2 leading-tight">
                        {career.careerName}
                      </h4>
                      
                      <span className="text-base font-bold text-gray-900 dark:text-white">
                        {career.studentCount}
                      </span>
                      
                      {/* Progress bar */}
                      <div className="relative h-0.5 bg-gray-100 rounded-full overflow-hidden mt-1.5 dark:bg-gray-700">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressWidth}%` }}
                          transition={{ duration: 0.4, delay: i * 0.02 + 0.1 }}
                          className="absolute h-full rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {viewType === 'donut' && (
          <motion.div
            key="donut"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            <div className="flex items-center justify-center">
              <ReactApexChart
                options={donutOptions}
                series={donutSeries}
                type="donut"
                height={280}
              />
            </div>
            
            <div className="space-y-1.5 max-h-72 overflow-y-auto custom-scrollbar pr-2">
              {sortedData.map((career, i) => (
                <motion.div
                  key={career.careerName}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div
                    className="size-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: careerColors[i % careerColors.length] }}
                  />
                  <span className="text-sm">{getCareerIcon(i)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-gray-900 dark:text-white truncate">
                      {career.careerName}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      {career.studentCount}
                    </span>
                    <span className="text-[9px] text-text-tertiary ml-1">
                      {career.percentage}%
                    </span>
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
            <ReactApexChart
              options={barOptions}
              series={barSeries}
              type="bar"
              height={Math.max(data.length * 35, 200)}
            />
            
            {/* Quick stats */}
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="grid grid-cols-4 gap-1.5">
                <div className="text-center p-1.5 rounded-md bg-brand-50 dark:bg-brand-900/20">
                  <p className="text-sm font-bold text-brand-600 dark:text-brand-400">
                    {data.length}
                  </p>
                  <p className="text-[9px] text-gray-500">Carreras</p>
                </div>
                <div className="text-center p-1.5 rounded-md bg-success-50 dark:bg-success-900/20">
                  <p className="text-sm font-bold text-success-600 dark:text-success-400">
                    {data.length > 0 ? Math.round(totalStudents / data.length) : 0}
                  </p>
                  <p className="text-[9px] text-gray-500">Prom.</p>
                </div>
                <div className="text-center p-1.5 rounded-md bg-warning-50 dark:bg-warning-900/20">
                  <p className="text-sm font-bold text-warning-600 dark:text-warning-400">
                    {sortedData[0]?.studentCount || 0}
                  </p>
                  <p className="text-[9px] text-gray-500">Máx</p>
                </div>
                <div className="text-center p-1.5 rounded-md bg-gray-50 dark:bg-gray-800">
                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
                    {sortedData[sortedData.length - 1]?.studentCount || 0}
                  </p>
                  <p className="text-[9px] text-gray-500">Mín</p>
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
