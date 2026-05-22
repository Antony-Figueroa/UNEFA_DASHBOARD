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

export interface EvaluationStatus {
  practiceId: string;
  currentGrade: number | null;
  evaluationStatus: 'pending' | 'partial' | 'completed';
  evaluations: {
    [key in EvaluatorType]: {
      completed: boolean;
      score: number;
      evaluatorName: string;
      evaluationId?: number;
    };
  };
  finalGrade: string;
  completedCount: number;
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
export const DEFAULT_EVALUATION_CONFIG: SystemEvaluationConfig = {
  score: { min: 1, max: 5, displayScale: 20 },
  weights: { INSTITUCIONAL: 0.40, ACADEMICO: 0.30, COMITE: 0.30 }
};

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
 * Rango de puntuación por criterio en DB: CHECK "SCORE" >= 1 AND "SCORE" <= 5
 * La escala visible para el usuario es 1-5 por criterio.
 * TOTAL_SCORE se escala a 0-20 (promedio * 4) para la nota final ponderada.
 */
export const SCORE_RANGE = {
  MIN: 1,
  MAX: 5
} as const;

/** Escala visible (0-20) a la que se mapea el promedio */
export const DISPLAY_SCALE = 20 as const;

/** Factor de conversión de score promedio a escala 0-20 */
export const SCORE_TO_DISPLAY_FACTOR = 4 as const; // (MAX/MIN_RANGE) * MAX_SCORE? No: (avg / 5) * 20 = avg * 4

/** Escala el promedio de scores (1-5) a la escala visible (0-20) */
export const scaleToDisplay = (average: number): number => {
  return parseFloat(((average / SCORE_RANGE.MAX) * DISPLAY_SCALE).toFixed(2));
};

/** Convierte score individual (1-5) a su valor en escala 0-20 */
export const scoreToDisplay = (score: number): number => {
  return parseFloat(((score / SCORE_RANGE.MAX) * DISPLAY_SCALE).toFixed(2));
};
