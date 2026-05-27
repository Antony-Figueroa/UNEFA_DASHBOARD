/**
 * @file EvaluationCell.tsx
 * @description Celda de evaluación que muestra botón de evaluar/editar/ver según el estado
 */

import React from 'react';
import { CheckCircleIcon, TimeIcon, EyeIcon } from '../../../icons';
import { EvaluatorType } from '../../../features/evaluations/types';

interface EvaluationSummary {
  completed: boolean;
  score: number;
  evaluatorName: string;
  evaluationId?: number;
}

interface EvaluationCellProps {
  evaluation: EvaluationSummary;
  evaluatorType: EvaluatorType;
  onEvaluate: (type: EvaluatorType, existingEvalId?: number) => void;
  onViewDetails: (evaluationId: number) => void;
}

export const EvaluationCell: React.FC<EvaluationCellProps> = ({
  evaluation,
  evaluatorType,
  onEvaluate,
  onViewDetails,
}) => {
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
          <span>{evaluation.score.toFixed(1)}</span>
        </button>
      </div>
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
