/**
 * @file CareerDistributionChart.tsx
 * @description Componente rediseñado que muestra la distribución de estudiantes por carrera
 * con visualización moderna tipo tarjetas y gráfico circular mejorado.
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
  FiAward,
  FiBookOpen
} from 'react-icons/fi';

interface CareerDistributionChartProps {
  data: DashboardStats['careerDistribution'];
  loading?: boolean;
}

const STORAGE_KEY = 'dashboard-career-view-preference';

// Colores institucionales UNEFA extendidos
const careerColors = [
  '#054F94', // Azul UNEFA principal
  '#C5A059', // Dorado insignias
  '#065A99', // Azul oscuro
  '#D4AF37', // Oro brillante
  '#0A6FBF', // Azul medio
  '#B8860B', // Oro oscuro
  '#033563', // Azul muy oscuro
  '#FFD700', // Amarillo dorado
];

// Iconos para diferentes tipos de carreras (simulados)
const getCareerIcon = (index: number) => {
  const icons = ['⚙️', '💻', '🏗️', '⚡', '📊', '🔧', '🌐', '📡', '🏭', '🔬'];
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
      <div className="rounded-2xl border border-border-light bg-white p-6 shadow-sm dark:border-border-dark dark:bg-gray-900">
        <div className="flex items-center justify-between mb-6">
          <Skeleton height={28} width={220} />
          <Skeleton height={40} width={120} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} height={140} className="rounded-xl" />
          ))}
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
    <div className="rounded-2xl border border-border-light bg-white p-6 shadow-sm dark:border-border-dark dark:bg-gray-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg shadow-brand-500/30">
            <FiBookOpen className="size-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Distribución por Carrera
            </h3>
            <p className="text-sm text-text-secondary">
              {data.length} carreras activas • {totalStudents.toLocaleString()} estudiantes
            </p>
          </div>
        </div>
        
        {/* View Toggle */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-gray-100 dark:bg-gray-800">
          <button
            onClick={() => setViewType('cards')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              viewType === 'cards'
                ? 'bg-white text-brand-600 shadow-sm dark:bg-gray-700 dark:text-brand-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <FiAward className="size-4" />
            <span className="hidden sm:inline">Tarjetas</span>
          </button>
          <button
            onClick={() => setViewType('donut')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              viewType === 'donut'
                ? 'bg-white text-brand-600 shadow-sm dark:bg-gray-700 dark:text-brand-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <FiPieChart className="size-4" />
            <span className="hidden sm:inline">Circular</span>
          </button>
          <button
            onClick={() => setViewType('bar')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              viewType === 'bar'
                ? 'bg-white text-brand-600 shadow-sm dark:bg-gray-700 dark:text-brand-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <FiBarChart2 className="size-4" />
            <span className="hidden sm:inline">Barras</span>
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
            {/* Top 3 Highlight */}
            {topCareers.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <FiTrendingUp className="size-4 text-brand-500" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Carreras con más estudiantes
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {topCareers.map((career, i) => (
                    <motion.div
                      key={career.careerName}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="relative overflow-hidden rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 p-4 text-white shadow-lg"
                    >
                      <div className="absolute top-0 right-0 size-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{getCareerIcon(i)}</span>
                          <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">
                            #{i + 1}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-white/90 line-clamp-2 mb-1">
                          {career.careerName}
                        </p>
                        <p className="text-2xl font-bold">{career.studentCount}</p>
                        <p className="text-xs text-white/70">{career.percentage}% del total</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* All Careers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedData.map((career, i) => {
                const color = careerColors[i % careerColors.length];

                const progressWidth = (career.studentCount / maxStudents) * 100;
                
                return (
                  <motion.div
                    key={career.careerName}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 transition-all duration-300 hover:shadow-lg hover:border-brand-300 dark:border-gray-700 dark:bg-gray-800"
                  >
                    {/* Color accent */}
                    <div 
                      className="absolute top-0 left-0 w-1 h-full transition-all duration-300"
                      style={{ backgroundColor: color }}
                    />
                    
                    <div className="pl-3">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-2xl">{getCareerIcon(i)}</span>
                        <div className="flex items-center gap-1 text-xs font-semibold text-gray-500">
                          <FiUsers className="size-3" />
                          {career.percentage}%
                        </div>
                      </div>
                      
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2 min-h-[2.5rem]">
                        {career.careerName}
                      </h4>
                      
                      <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          {career.studentCount}
                        </span>
                        <span className="text-xs text-gray-500">estudiantes</span>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden dark:bg-gray-700">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressWidth}%` }}
                          transition={{ duration: 0.8, delay: i * 0.05 + 0.3 }}
                          className="absolute h-full rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      </div>
                    </div>
                    
                    {/* Hover effect overlay */}
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none"
                      style={{ backgroundColor: color }}
                    />
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
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            <div className="flex items-center justify-center">
              <ReactApexChart
                options={donutOptions}
                series={donutSeries}
                type="donut"
                height={400}
              />
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-2">
              {sortedData.map((career, i) => (
                <motion.div
                  key={career.careerName}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div
                    className="size-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: careerColors[i % careerColors.length] }}
                  />
                  <span className="text-2xl">{getCareerIcon(i)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {career.careerName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {career.percentage}% • {career.studentCount} estudiantes
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {career.studentCount}
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
              height={Math.max(data.length * 50, 300)}
            />
            
            {/* Summary stats below chart */}
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-xl bg-brand-50 dark:bg-brand-900/20">
                  <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                    {data.length}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Carreras</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-success-50 dark:bg-success-900/20">
                  <p className="text-2xl font-bold text-success-600 dark:text-success-400">
                    {Math.round(totalStudents / data.length)}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Promedio</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-warning-50 dark:bg-warning-900/20">
                  <p className="text-2xl font-bold text-warning-600 dark:text-warning-400">
                    {sortedData[0]?.studentCount || 0}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Máximo</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                    {sortedData[sortedData.length - 1]?.studentCount || 0}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Mínimo</p>
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
