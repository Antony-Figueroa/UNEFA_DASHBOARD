/**
 * @file CareerCards.tsx
 * @description Componente de cards visuales para mostrar carreras.
 * Diseño alternativo a la tabla tradicional con mejor jerarquía visual.
 */

import { motion } from "framer-motion";
import { CareerRowData } from "../types";
import { InternshipTypeOption } from "../../internship-types/types";

interface CareerCardsProps {
  careers: CareerRowData[];
  practiceOptions?: InternshipTypeOption[];
  onEdit?: (career: CareerRowData) => void;
  onToggleStatus?: (careerId: string | number) => void;
  onView?: (career: CareerRowData) => void;
  inactiveMode?: boolean;
}

const getCareerColor = (careerName: string): string => {
  const colors = [
    "from-blue-500 to-blue-600",
    "from-emerald-500 to-emerald-600", 
    "from-purple-500 to-purple-600",
    "from-amber-500 to-amber-600",
    "from-rose-500 to-rose-600",
    "from-cyan-500 to-cyan-600",
    "from-indigo-500 to-indigo-600",
    "from-teal-500 to-teal-600",
  ];
  let hash = 0;
  for (let i = 0; i < careerName.length; i++) {
    hash = careerName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const CareerCards: React.FC<CareerCardsProps> = ({
  careers,
  practiceOptions = [],
  onEdit,
  onToggleStatus,
  onView,
  inactiveMode = false,
}) => {
  const formatDecimal = (n: number) => Number(n).toFixed(2);

  if (careers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">No se encontraron carreras</h3>
        <p className="text-xs text-gray-500 mt-1">Intenta ajustar los filtros</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {careers.map((career, index) => {
        const colorClass = getCareerColor(career.careerName);
        
        return (
          <motion.div
            key={career.careerId}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className="group relative bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200"
          >
            {/* Color accent bar */}
            <div className={`h-1 bg-gradient-to-r ${colorClass}`} />

            <div className="p-3">
              {/* Header: Código */}
              <div className="flex items-center justify-between mb-2">
                <div className={`inline-flex items-center px-2 py-0.5 rounded-md bg-gradient-to-r ${colorClass} text-white text-[10px] font-bold`}>
                  {career.careerCode}
                </div>
                <div className="flex items-center gap-0.5">
                  {onView && (
                    <button
                      onClick={() => onView(career)}
                      className="p-1 text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                      title="Ver detalles"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={() => onEdit(career)}
                      className="p-1 text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                      title="Editar"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                  {onToggleStatus && (
                    <button
                      onClick={() => onToggleStatus(career.careerId)}
                      className={`p-1 rounded transition-colors ${
                        inactiveMode 
                          ? "text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20" 
                          : "text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      }`}
                      title={inactiveMode ? "Restaurar" : "Eliminar"}
                    >
                      {inactiveMode ? (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Nombre de la carrera */}
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-tight" title={career.careerName}>
                {career.careerName}
              </h3>

              {/* Abreviatura */}
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-2">
                {career.careerAbbreviation}
              </p>

              {/* Tipos de práctica - Compacto */}
              <div className="mb-2">
                <div className="flex flex-wrap gap-1">
                  {career.internshipTypeIds && career.internshipTypeIds.length > 0 ? (
                    career.internshipTypeIds.slice(0, 2).map((id, i) => {
                      const opt = practiceOptions.find(o => Number(o.id) === Number(id));
                      return (
                        <span 
                          key={i} 
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        >
                          {opt?.label || id}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-[9px] text-gray-400 italic">Sin tipos</span>
                  )}
                  {career.internshipTypeIds && career.internshipTypeIds.length > 2 && (
                    <span className="text-[9px] text-gray-500 font-medium">+{career.internshipTypeIds.length - 2}</span>
                  )}
                </div>
              </div>

              {/* Footer: Nota mínima */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-[10px] text-gray-500">
                    Nota: <span className="font-bold text-gray-700 dark:text-gray-300">{formatDecimal(Number(career.minimumGrade))}</span>
                  </span>
                </div>
                
                {/* Estado */}
                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${
                  career.status 
                    ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400' 
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  {career.status ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            </div>

            {/* Hover glow effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className={`absolute inset-0 bg-gradient-to-br ${colorClass} opacity-5`} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default CareerCards;
