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
    };
  };
  finalGrade: string;
  completedCount: number;
}

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

export const SCORE_RANGE = {
  MIN: 0,
  MAX: 20
};
