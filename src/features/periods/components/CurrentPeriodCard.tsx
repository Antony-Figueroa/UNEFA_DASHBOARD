/**
 * @file CurrentPeriodCard.tsx
 * @description Card destacado para mostrar el período académico actual.
 * Diseño prominente para destacar el período en curso.
 */

import { motion } from "framer-motion";
import { PeriodoRowData } from "../types";
import { getSafeProgress } from "./periodUtils";

interface CurrentPeriodCardProps {
  period: PeriodoRowData;
  onEdit?: () => void;
  onView?: () => void;
  onCulminate?: () => void;
}

const CurrentPeriodCard: React.FC<CurrentPeriodCardProps> = ({ 
  period, 
  onEdit, 
  onView, 
  onCulminate 
}) => {
  const progress = getSafeProgress(period) || 0;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-VE", { 
      day: "numeric", 
      month: "long", 
      year: "numeric" 
    });
  };

  // Calcular días restantes
  const daysRemaining = (() => {
    const end = new Date(period.endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  })();

  // Calcular semanas transcurridas
  const weeksElapsed = (() => {
    const start = new Date(period.startDate);
    const now = new Date();
    const diff = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7));
    return diff > 0 ? diff : 0;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 text-white shadow-xl"
    >
      {/* Fondo con patrón */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Glow effect */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[#C5A059]/20 rounded-full blur-3xl" />

      {/* Contenido */}
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/70">
                Período Académico
              </p>
              <h3 className="text-lg font-bold">En Curso</h3>
            </div>
          </div>

          {/* Indicador de actividad */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-success-400"></span>
            </span>
            <span className="text-sm font-medium text-success-100">Activo</span>
          </div>
        </div>

        {/* Información principal */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">{period.description}</h2>
          <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatDate(period.startDate)} - {formatDate(period.endDate)}</span>
            </div>
          </div>
        </div>

        {/* Stats de progreso */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{progress}%</p>
            <p className="text-xs text-white/70 uppercase tracking-wider">Completado</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{weeksElapsed}</p>
            <p className="text-xs text-white/70 uppercase tracking-wider">Semanas</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{daysRemaining}</p>
            <p className="text-xs text-white/70 uppercase tracking-wider">Días restantes</p>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-white/80">Progreso del período</span>
            <span className="font-bold">{progress}%</span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-[#C5A059] to-yellow-400 rounded-full"
            />
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-3">
          {onView && (
            <button
              onClick={onView}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors font-medium text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Ver Detalles
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors font-medium text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar
            </button>
          )}
          {onCulminate && (
            <button
              onClick={onCulminate}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-[#C5A059] hover:bg-[#D4AF37] rounded-xl transition-colors font-medium text-sm text-brand-900"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Culminar
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CurrentPeriodCard;
