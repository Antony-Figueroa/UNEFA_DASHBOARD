/**
 * @file PeriodTimeline.tsx
 * @description Componente de línea temporal visual para mostrar períodos académicos.
 * Muestra los períodos como una secuencia temporal con indicadores de estado.
 */

import { useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { PeriodoRowData } from "../types";
import { getSafePeriodStatus, getStatusLabel, getSafeProgress } from "./periodUtils";

interface PeriodTimelineProps {
  periods: PeriodoRowData[];
  activePeriodId?: string;
  onPeriodClick?: (period: PeriodoRowData) => void;
}

const STATUS_CONFIG = {
  1: { color: "bg-warning-500", dotColor: "bg-warning-500", borderColor: "border-warning-200" },
  2: { color: "bg-success-500", dotColor: "bg-success-500", borderColor: "border-success-200" },
  3: { color: "bg-brand-500", dotColor: "bg-brand-500", borderColor: "border-brand-200" },
} as const;

const PeriodTimeline: React.FC<PeriodTimelineProps> = ({ periods, activePeriodId, onPeriodClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Ordenar períodos: culminados primero, luego en curso, luego pendientes
  const sortedPeriods = useMemo(() => {
    return [...periods].sort((a, b) => {
      const statusA = getSafePeriodStatus(a);
      const statusB = getSafePeriodStatus(b);
      
      // Ordenar por status inverso: culminados(3) > en curso(2) > pendientes(1)
      if (statusA !== statusB) {
        return statusB - statusA;
      }
      
      // Si tienen el mismo status, ordenar por fecha de inicio
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
  }, [periods]);

  // Índice del período activo
  const activeIndex = useMemo(() => {
    if (!activePeriodId) return -1;
    return sortedPeriods.findIndex(p => p.periodId === activePeriodId);
  }, [sortedPeriods, activePeriodId]);

  // Centrar en el período activo cuando se monte el componente
  useEffect(() => {
    if (activeIndex >= 0 && containerRef.current) {
      const container = containerRef.current;
      const cards = container.querySelectorAll('.period-card');
      const activeCard = cards[activeIndex] as HTMLElement;
      if (activeCard) {
        const containerWidth = container.offsetWidth;
        const cardLeft = activeCard.offsetLeft;
        const cardWidth = activeCard.offsetWidth;
        const scrollPosition = cardLeft - (containerWidth / 2) + (cardWidth / 2);
        container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
      }
    }
  }, [activeIndex]);

  // Encontrar el rango total de fechas
  const { earliestDate, latestDate } = useMemo(() => {
    if (sortedPeriods.length === 0) return { earliestDate: new Date(), latestDate: new Date() };
    
    const dates = sortedPeriods.map(p => new Date(p.startDate).getTime());
    const earliest = Math.min(...dates);
    const latest = Math.max(...sortedPeriods.map(p => new Date(p.endDate).getTime()));
    
    return {
      earliestDate: new Date(earliest),
      latestDate: new Date(latest)
    };
  }, [sortedPeriods]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-VE", { day: "numeric", month: "short" });
  };

  if (sortedPeriods.length === 0) {
    return (
      <div className="text-center py-8 text-text-tertiary">
        No hay períodos para mostrar
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Leyenda */}
      <div className="flex items-center gap-8 text-xs px-4">
        <span className="text-text-tertiary font-medium">Estado:</span>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
          <span className="text-text-secondary">Culminado</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-success-500" />
          <span className="text-text-secondary">En Curso</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-warning-500" />
          <span className="text-text-secondary">Pendiente</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative py-8">
        {/* Línea base */}
        <div className="absolute top-1/2 left-8 right-8 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full -translate-y-1/2" />
        
        {/* Períodos */}
        <div ref={containerRef} className="relative flex items-stretch justify-between gap-8 px-8 overflow-x-auto py-6">
          {sortedPeriods.map((period, index) => {
            const status = getSafePeriodStatus(period);
            const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG[1];
            const isActive = status === 2;

            return (
              <motion.div
                key={period.periodId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
                className="period-card relative flex-1 min-w-[200px] max-w-[280px] cursor-pointer group"
                onClick={() => onPeriodClick?.(period)}
              >
                {/* Línea conectora (excepto último) */}
                {index < sortedPeriods.length - 1 && (
                  <div className="absolute top-5 left-1/2 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 -z-10" />
                )}

                {/* Punto de conexión */}
                <div className="absolute top-[18px] left-1/2 -translate-x-1/2 z-20">
                  <div className={`w-4 h-4 rounded-full ${config.dotColor} ${isActive ? 'ring-4 ring-success-500/30' : ''} transition-all group-hover:scale-125 shadow-sm`} />
                </div>

                {/* Card del período */}
                <div className={`
                  mt-10 p-5 rounded-2xl border-2 transition-all duration-300
                  ${config.borderColor} bg-white dark:bg-gray-800
                  group-hover:shadow-xl group-hover:-translate-y-2
                  ${isActive ? 'ring-2 ring-success-500/30 shadow-lg' : 'hover:shadow-md'}
                `}>
                  {/* Estado badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${config.color} text-white`}>
                      {getStatusLabel(status)}
                    </span>
                    {isActive && (
                      <span className="flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-success-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success-500"></span>
                      </span>
                    )}
                  </div>

                  {/* Nombre */}
                  <h4 className="text-base font-bold text-gray-900 dark:text-white truncate mb-2">
                    {period.description}
                  </h4>

                  {/* Fechas */}
                  <div className="text-sm text-text-tertiary mb-4">
                    {formatDate(period.startDate)} - {formatDate(period.endDate)}
                  </div>

                  {/* Progreso (si aplica) */}
                  {status === 2 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-text-tertiary font-medium">Progreso</span>
                        <span className="font-bold text-success-600">{getSafeProgress(period) || 0}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${getSafeProgress(period) || 0}%` }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                          className={`h-full rounded-full ${config.color}`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Escala de tiempo */}
      <div className="flex items-center justify-between text-sm text-text-tertiary pt-6 px-8 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gray-400" />
          <span>{earliestDate.toLocaleDateString("es-VE", { month: "long", year: "numeric" })}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>{latestDate.toLocaleDateString("es-VE", { month: "long", year: "numeric" })}</span>
          <div className="w-2 h-2 rounded-full bg-gray-400" />
        </div>
      </div>
    </div>
  );
};

export default PeriodTimeline;
