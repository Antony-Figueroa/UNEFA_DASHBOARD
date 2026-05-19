/**
 * @file TrackingStatsChart.tsx
 * @description Componente visual mejorado para mostrar estadísticas de seguimiento mediante gráficos.
 * Incluye comparación de períodos, indicadores de tendencia y mejor interactividad.
 */

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { TrackingStats } from "../services/trackingService";
import { Skeleton } from "../../../components/ui/skeleton";
import { FiTrendingUp, FiActivity, FiCalendar, FiLayers, FiArrowUp, FiArrowDown, FiMinus } from "react-icons/fi";

/**
 * Propiedades del componente TrackingStatsChart.
 */
interface TrackingStatsChartProps {
    /** Objeto con los datos estadísticos de seguimiento */
    stats: TrackingStats | null;
    /** Indica si los datos están en proceso de carga */
    loading: boolean;
}

/**
 * Componente TrackingStatsChart.
 * 
 * Renderiza un gráfico de área que muestra la tendencia histórica de seguimientos.
 * Permite filtrar la visualización por diferentes periodos de tiempo (7 días, 30 días, 6 meses).
 * Incluye comparación con período anterior y estadísticas resumidas.
 */
const TrackingStatsChart: React.FC<TrackingStatsChartProps> = ({ stats, loading }) => {
    const [filter, setFilter] = useState<'7d' | '30d' | 'all'>('30d');

    // Colores de marca
    const BRAND_COLOR = '#054F94';
    const BRAND_LIGHT = '#67baff';
    const SUCCESS_COLOR = '#12B76A';
    const WARNING_COLOR = '#F59E0B';

    /**
     * Filtra los datos de tendencia histórica según el periodo seleccionado.
     */
    const filteredTrend = useMemo(() => {
        if (!stats) return [];
        if (filter === '7d') return stats.historicalTrend.slice(-7);
        if (filter === '30d') return stats.historicalTrend.slice(-30);
        return stats.historicalTrend;
    }, [stats, filter]);

    /**
     * Calcula estadísticas del período filtrado.
     */
    const periodStats = useMemo(() => {
        if (!filteredTrend || filteredTrend.length === 0) {
            return { avg: 0, max: 0, min: 0, total: 0, trend: 0 };
        }
        
        const counts = filteredTrend.map(d => d.count);
        const total = counts.reduce((a, b) => a + b, 0);
        const avg = Math.round(total / counts.length);
        
        // Calcular tendencia comparando con período anterior
        const mid = Math.floor(counts.length / 2);
        const firstHalf = counts.slice(0, mid).reduce((a, b) => a + b, 0);
        const secondHalf = counts.slice(mid).reduce((a, b) => a + b, 0);
        const trend = firstHalf > 0 ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100) : 0;

        return {
            avg,
            max: Math.max(...counts),
            min: Math.min(...counts),
            total,
            trend
        };
    }, [filteredTrend]);

    /**
     * Configuración del gráfico ApexCharts mejorada.
     */
    const chartOptions: ApexOptions = useMemo(() => ({
        chart: {
            type: 'area',
            height: 320,
            toolbar: { show: false },
            zoom: { enabled: false },
            fontFamily: 'Outfit, system-ui, sans-serif',
            animations: {
                enabled: true,
                speed: 600,
                animateGradually: { enabled: true, delay: 100 },
                dynamicAnimation: { enabled: true, speed: 350 }
            },
            sparkline: { enabled: false },
        },
        colors: [BRAND_COLOR],
        dataLabels: { enabled: false },
        stroke: {
            curve: 'smooth',
            width: 2.5,
            lineCap: 'round',
        },
        fill: {
            type: 'linear',
            gradient: {
                shadeIntensity: 0.8,
                opacityFrom: 0.5,
                opacityTo: 0.1,
                stops: [0, 90, 100],
                inverseColors: false,
            }
        },
        xaxis: {
            categories: filteredTrend.map(d => d.label) || [],
            labels: {
                rotate: -45,
                style: {
                    fontSize: '9px',
                    fontFamily: 'Outfit, system-ui, sans-serif',
                    colors: '#98a2b3',
                },
                formatter: (val) => String(val).length > 5 ? String(val).slice(0, 5) : String(val),
            },
            axisBorder: { show: false },
            axisTicks: { show: false },
            crosshairs: {
                show: true,
                position: 'front',
                stroke: { color: BRAND_COLOR, width: 1, dashArray: 4 },
            },
            tooltip: { enabled: false },
        },
        yaxis: {
            labels: {
                style: {
                    fontSize: '10px',
                    fontFamily: 'Outfit, system-ui, sans-serif',
                    colors: '#98a2b3',
                },
                formatter: (value) => Math.round(value).toString(),
                offsetX: -10,
            },
            min: 0,
        },
        tooltip: {
            theme: 'light',
            x: { show: false },
            y: {
                title: { formatter: () => '' },
                formatter: (val) => `${val} seguimientos`,
            },
            style: { fontSize: '11px', fontFamily: 'Outfit, sans-serif' },
            marker: { show: true },
        },
        grid: {
            borderColor: '#f1f5f9',
            strokeDashArray: 3,
            xaxis: { lines: { show: false } },
            yaxis: { lines: { show: true } },
            padding: { top: 5, right: 15, bottom: 0, left: 0 },
        },
        markers: {
            size: 3,
            colors: ['#fff'],
            strokeColors: BRAND_COLOR,
            strokeWidth: 1.5,
            hover: { size: 5 },
        },
        annotations: {
            yaxis: periodStats.avg > 0 ? [{
                y: periodStats.avg,
                borderColor: SUCCESS_COLOR,
                borderDash: [4, 4],
                label: {
                    text: `Prom: ${periodStats.avg}`,
                    style: { background: SUCCESS_COLOR, color: '#fff', fontSize: '10px' }
                }
            }] : []
        }
    }), [filteredTrend, periodStats.avg]);

    /**
     * Datos de la serie para el gráfico.
     */
    const series = useMemo(() => [{
        name: 'Seguimientos',
        data: filteredTrend.map(d => d.count) || []
    }], [filteredTrend]);

    // Loading state
    if (loading && !stats) {
        return (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full w-full rounded-2xl border border-border-light bg-white p-6 shadow-sm dark:border-border-dark dark:bg-gray-900"
            >
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <Skeleton height={24} width={200} className="mb-2" />
                        <Skeleton height={16} width={160} />
                    </div>
                    <Skeleton height={36} width={140} />
                </div>
                <Skeleton height={280} className="rounded-xl" />
            </motion.div>
        );
    }

    const filterLabels = {
        '7d': '7 días',
        '30d': '30 días',
        'all': '6 meses'
    };

    // Trend indicator
    const getTrendIcon = () => {
        if (periodStats.trend > 0) return <FiArrowUp className="size-3" />;
        if (periodStats.trend < 0) return <FiArrowDown className="size-3" />;
        return <FiMinus className="size-3" />;
    };

    const getTrendColor = () => {
        if (periodStats.trend > 0) return 'text-success-600 dark:text-success-400';
        if (periodStats.trend < 0) return 'text-error-500 dark:text-error-400';
        return 'text-gray-500';
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full w-full rounded-2xl border border-border-light bg-white p-6 shadow-sm dark:border-border-dark dark:bg-gray-900"
        >
            {/* Header */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center size-8 rounded-lg bg-brand-50 dark:bg-brand-500/10">
                        <FiActivity className="size-3.5 text-brand-600 dark:text-brand-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                            Tendencia de Seguimientos
                        </h3>
                        <p className="text-[10px] text-text-secondary dark:text-text-tertiary">
                            Histórico de visitas y seguimientos
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {/* Total Counter */}
                    <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-md bg-brand-50 dark:bg-brand-500/10">
                        <FiCalendar className="size-3 text-brand-600 dark:text-brand-400" />
                        <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                            {periodStats.total}
                        </span>
                    </div>
                    
                    {/* Trend Badge */}
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${
                        periodStats.trend > 0 
                            ? 'bg-success-50 dark:bg-success-500/10' 
                            : periodStats.trend < 0 
                                ? 'bg-error-50 dark:bg-error-500/10'
                                : 'bg-gray-50 dark:bg-gray-800'
                    }`}>
                        <span className={getTrendColor()}>{getTrendIcon()}</span>
                        <span className={`text-xs font-bold ${getTrendColor()}`}>
                            {periodStats.trend > 0 ? '+' : ''}{periodStats.trend}%
                        </span>
                    </div>
                    
                    {/* Filter Buttons */}
                    <div className="flex rounded bg-gray-100 dark:bg-gray-800 p-0.5">
                        {(['7d', '30d', 'all'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`rounded text-[10px] font-medium px-2 py-0.5 transition-all ${
                                    filter === f
                                        ? 'bg-white text-brand-600 shadow-sm dark:bg-gray-700 dark:text-brand-400'
                                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                                }`}
                            >
                                {filterLabels[f]}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Chart or Empty State */}
            <div className="h-72">
                {filteredTrend.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 border border-dashed border-gray-200 dark:border-gray-700">
                        <div className="size-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                            <FiTrendingUp className="size-6 text-gray-400" />
                        </div>
                        <h4 className="text-base font-semibold text-gray-600 dark:text-gray-400 mb-2">
                            Sin seguimientos aún
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-500 max-w-sm mx-auto">
                            Los registros de seguimiento aparecerán aquí
                        </p>
                        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                            <span className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
                            <span>Esperando datos...</span>
                        </div>
                    </div>
                ) : (
                    <ReactApexChart
                        key={`chart-${filter}-${filteredTrend.length}`}
                        options={chartOptions}
                        series={series}
                        type="area"
                        height={280}
                    />
                )}
            </div>

            {/* Quick Stats */}
            {filteredTrend.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <div className="text-center p-2 rounded-lg bg-brand-50/50 dark:bg-brand-500/5">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <FiLayers className="size-3 text-brand-500" />
                            <span className="text-[9px] font-medium text-brand-600 dark:text-brand-400">PROMEDIO</span>
                        </div>
                        <span className="text-lg font-bold text-brand-600 dark:text-brand-400">{periodStats.avg}</span>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-success-50/50 dark:bg-success-500/5">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <FiTrendingUp className="size-3 text-success-500" />
                            <span className="text-[9px] font-medium text-success-600 dark:text-success-400">MÁXIMO</span>
                        </div>
                        <span className="text-lg font-bold text-success-600 dark:text-success-400">{periodStats.max}</span>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-gray-50/50 dark:bg-gray-800/50">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <FiActivity className="size-3 text-gray-400" />
                            <span className="text-[9px] font-medium text-gray-500">MÍNIMO</span>
                        </div>
                        <span className="text-lg font-bold text-gray-500 dark:text-gray-400">{periodStats.min}</span>
                    </div>
                </div>
            )}

            {/* Mobile Total */}
            <div className="mt-4 flex sm:hidden items-center justify-center gap-2 px-3 py-2 rounded-lg bg-brand-50 dark:bg-brand-500/10">
                <FiCalendar className="size-4 text-brand-600 dark:text-brand-400" />
                <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                    {periodStats.total} seguimientos en este período
                </span>
            </div>
        </motion.div>
    );
};

export default TrackingStatsChart;