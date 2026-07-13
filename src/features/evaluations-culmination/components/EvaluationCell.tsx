/**
 * @file EvaluationCell.tsx
 * @description Celda de evaluación que muestra botón de evaluar/editar/ver según el estado
 */

import React from 'react';
import { CheckCircleIcon, TimeIcon, LockIcon } from '../../../icons';
import { EvaluatorType } from '../../../features/evaluations/types';

interface EvaluationSummary {
  completed: boolean;
  score: number;
  evaluatorName: string;
  evaluationId?: number;
  frozenAt?: string | null;
}

interface EvaluationCellProps {
  evaluation: EvaluationSummary;
  evaluatorType: EvaluatorType;
  onEvaluate: (type: EvaluatorType, existingEvalId?: number) => void;
  onViewDetails: (evaluationId: number) => void;
  displayScale: number;
  /** Si la práctica completa está congelada (actas cerradas), solo permite ver detalles */
  isFrozen?: boolean;
  /** Si la práctica está culminada o reprobada, solo permite ver detalles (sin editar/crear) */
  readOnly?: boolean;
  /** Código de estado de la práctica para mostrar badge informativo */
  practiceStatusCode?: string;
}

export const EvaluationCell: React.FC<EvaluationCellProps> = ({
  evaluation,
  evaluatorType,
  onEvaluate,
  onViewDetails,
  displayScale,
  isFrozen = false,
  readOnly = false,
  practiceStatusCode,
}) => {
  // Modo solo lectura (culminada, reprobada) o congelada: solo ver detalles
  const isReadOnly = isFrozen || readOnly;
  const isReprobada = practiceStatusCode === 'REPROBADO';

  // Congelada: muestra badge con candado
  if (isFrozen && evaluation.completed) {
    return (
      <div className="flex items-center justify-center gap-1">
        <span className="flex items-center gap-1 px-2 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg" title="Actas cerradas — evaluación congelada">
          <LockIcon className="w-3.5 h-3.5" />
          <span className="font-medium">{((evaluation.score / displayScale) * 100).toFixed(1)}%</span>
        </span>
      </div>
    );
  }

  // Reprobada: muestra badge rojo con lock — resultado no definitivo hasta cierre
  if (isReprobada) {
    return (
      <div className="flex items-center justify-center gap-1">
        <span
          className="flex items-center gap-1 px-2 py-1.5 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg"
          title="Práctica reprobada — sin resultado definitivo hasta cierre del período"
        >
          <LockIcon className="w-3.5 h-3.5" />
          <span className="font-medium">
            {evaluation.completed
              ? `${((evaluation.score / displayScale) * 100).toFixed(1)}%`
              : 'Reprobada'}
          </span>
        </span>
      </div>
    );
  }

  // Culminada o congelada sin evaluaciones: mostrar puntaje sin editar
  if (isReadOnly && evaluation.completed) {
    return (
      <div className="flex items-center justify-center gap-1">
        <span className="inline-flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-green-700 dark:text-green-400">
          {((evaluation.score / displayScale) * 100).toFixed(1)}%
        </span>
      </div>
    );
  }

  if (isReadOnly) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1.5 text-sm text-gray-400 dark:text-gray-500">
        <TimeIcon className="w-4 h-4" />
        <span>Pendiente</span>
      </span>
    );
  }

  if (evaluation.completed) {
    return (
      <div className="flex items-center justify-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEvaluate(evaluatorType, evaluation.evaluationId);
          }}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
          title={`Editar - Evaluador: ${evaluation.evaluatorName}`}
        >
          <CheckCircleIcon className="w-4 h-4" />
           <span>{((evaluation.score / displayScale) * 100).toFixed(1)}%</span>
        </button>
      </div>
    );
  }

  // Pendiente — si congelada, no permite crear
  if (isFrozen) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1.5 text-sm text-gray-400 dark:text-gray-500">
        <TimeIcon className="w-4 h-4" />
        <span>Pendiente</span>
        <LockIcon className="w-3 h-3" />
      </span>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onEvaluate(evaluatorType);
      }}
      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/30 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
    >
      <TimeIcon className="w-4 h-4" />
      <span>Pendiente</span>
    </button>
  );
};

export default EvaluationCell;
