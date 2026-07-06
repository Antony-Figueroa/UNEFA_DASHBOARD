/**
 * @file EvaluationCell.tsx
 * @description Celda de evaluación que muestra botón de evaluar/editar/ver según el estado
 */

import React from 'react';
import { CheckCircleIcon, TimeIcon, EyeIcon, LockIcon } from '../../../icons';
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
}

export const EvaluationCell: React.FC<EvaluationCellProps> = ({
  evaluation,
  evaluatorType,
  onEvaluate,
  onViewDetails,
  displayScale,
  isFrozen = false,
}) => {
  // Congelada: solo permite ver detalles, no editar
  if (isFrozen && evaluation.completed) {
    return (
      <div className="flex items-center justify-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            evaluation.evaluationId && onViewDetails(evaluation.evaluationId);
          }}
          className="flex items-center gap-1 px-2 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
          title="Ver detalles"
        >
          <EyeIcon className="w-4 h-4" />
        </button>
        <span className="flex items-center gap-1 px-2 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg" title="Actas cerradas — evaluación congelada">
          <LockIcon className="w-3.5 h-3.5" />
          <span className="font-medium">{Math.round((evaluation.score / displayScale) * 100)}%</span>
        </span>
      </div>
    );
  }

  if (evaluation.completed) {
    return (
      <div className="flex items-center justify-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            evaluation.evaluationId && onViewDetails(evaluation.evaluationId);
          }}
          className="flex items-center gap-1 px-2 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
          title="Ver detalles"
        >
          <EyeIcon className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEvaluate(evaluatorType, evaluation.evaluationId);
          }}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
          title={`Editar - Evaluador: ${evaluation.evaluatorName}`}
        >
          <CheckCircleIcon className="w-4 h-4" />
          <span>{Math.round((evaluation.score / displayScale) * 100)}%</span>
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
