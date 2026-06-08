export type EvaluatorType = 'INSTITUCIONAL' | 'ACADEMICO' | 'COMITE';

export interface EvaluationCriteria {
  criteriaId: number;
  itemNumber: number;
  description: string;
  evaluatorType: EvaluatorType;
}

export interface EvaluationDetail {
  detailId?: number;
  criteriaId: number;
  itemNumber: number;
  score: number;
}

export interface Evaluation {
  evaluationId: number;
  professionalPracticeId: number;
  evaluatorType: EvaluatorType;
  comiteMemberIndex?: number;
  evaluatorId?: number;
  evaluatorName: string;
  evaluatorCi?: string;
  totalScore: number;
  observations?: string;
  evaluationDate: string;
  registeredBy: number;
  weight: number;
}

export interface EvaluationWithDetails extends Evaluation {
  items: EvaluationDetail[];
}

export interface CreateEvaluationPayload {
  professionalPracticeId: number;
  evaluatorType: EvaluatorType;
  comiteMemberIndex?: number;
  evaluatorId?: number;
  evaluatorName: string;
  evaluatorCi?: string;
  observations?: string;
  items: {
    criteriaId: number;
    itemNumber: number;
    score: number;
  }[];
}

export interface UpdateEvaluationPayload {
  evaluatorName?: string;
  evaluatorCi?: string;
  observations?: string;
  items?: EvaluationDetail[];
}

export interface ComiteMemberStatus {
  memberIndex: number;
  score: number;
  evaluatorName: string;
  evaluationId: number;
}

export interface EvaluationStatus {
  practiceId: string;
  currentGrade: number | null;
  evaluationStatus: 'pending' | 'partial' | 'completed';
  evaluations: {
    INSTITUCIONAL: {
      completed: boolean;
      score: number;
      evaluatorName: string;
      evaluationId?: number;
    };
    ACADEMICO: {
      completed: boolean;
      score: number;
      evaluatorName: string;
      evaluationId?: number;
    };
    COMITE: {
      completed: boolean;
      score: number;
      evaluatorName: string;
      completedCount: string;
      members: ComiteMemberStatus[];
    };
  };
  finalGrade: string;
  completedCount: number;
  canEvaluate: boolean;
  periodMessage: string;
}

/**
 * Configuración del sistema de evaluación obtenida desde el backend.
 * Contiene rangos de puntuación, escala de visualización y pesos.
 */
export interface SystemEvaluationConfig {
  score: {
    min: number;
    max: number;
    displayScale: number;
  };
  weights: Record<string, number>;
}

/**
 * Valores por defecto del sistema de evaluación.
 * Se usan como fallback si no se puede obtener la configuración del backend.
 */
/** @deprecated Los valores reales vienen del backend via GET /api/evaluations/system-config */
export const DEFAULT_EVALUATION_CONFIG: SystemEvaluationConfig = {
  score: { min: 1, max: 10, displayScale: 20 },
  weights: { INSTITUCIONAL: 0.40, ACADEMICO: 0.30, COMITE: 0.30 }
};

/** @deprecated Usar SystemEvaluationConfig.weights del backend via useSystemEvaluationConfig hook */
export const EVALUATION_WEIGHTS: Record<EvaluatorType, number> = {
  'INSTITUCIONAL': 0.40,
  'ACADEMICO': 0.30,
  'COMITE': 0.30
};

export const EVALUATOR_TYPE_LABELS: Record<EvaluatorType, string> = {
  'INSTITUCIONAL': 'Evaluación Institucional',
  'ACADEMICO': 'Evaluación Académica',
  'COMITE': 'Evaluación Comité'
};

/**
 * @deprecated Usar SystemEvaluationConfig del backend via useSystemEvaluationConfig hook.
 * Los valores reales vienen de GET /api/evaluations/system-config.
 */
export const SCORE_RANGE = {
  MIN: 1,
  MAX: 10
} as const;

/** @deprecated Usar config.score.displayScale del backend */
export const DISPLAY_SCALE = 20 as const;

/** @deprecated La conversión la hace el backend con evaluationConfig.score */
export const SCORE_TO_DISPLAY_FACTOR = 2 as const;

/** @deprecated Usar el backend /api/evaluations/system-config */
export const scaleToDisplay = (average: number): number => {
  return parseFloat(((average / SCORE_RANGE.MAX) * DISPLAY_SCALE).toFixed(2));
};

/** @deprecated Usar el backend /api/evaluations/system-config */
export const scoreToDisplay = (score: number): number => {
  return parseFloat(((score / SCORE_RANGE.MAX) * DISPLAY_SCALE).toFixed(2));
};
