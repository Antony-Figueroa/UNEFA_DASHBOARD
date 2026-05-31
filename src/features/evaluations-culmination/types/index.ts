/**
 * @file Tipos unificados para el módulo de Evaluaciones y Culminación
 * @description Define las interfaces para prácticas con evaluaciones y culminación
 */

import { EvaluatorType } from '../../evaluations/types';

/**
 * Pesos de cada tipo de evaluación.
 * @deprecated Los pesos reales vienen del backend. Si necesitás calcular en frontend,
 * obtenelos desde useSystemEvaluationConfig().config.weights en vez de este valor fijo.
 */
const EVALUATION_WEIGHTS: Record<EvaluatorType, number> = {
  'INSTITUCIONAL': 0.40,
  'ACADEMICO': 0.30,
  'COMITE': 0.30
};

/** Tipo de práctica profesional */
export type PracticeType = 'PASANTIA' | 'PROYECTO' | 'INVESTIGACION' | 'SERVICIO_COMUNITARIO';

/** Estado de evaluaciones de una práctica */
export type EvaluationStatus = 'pending' | 'partial' | 'completed';

/** Estado de culminación */
export type CulminationStatus = 'pending' | 'approved' | 'certified';

/** Resultado de la práctica */
export type PracticeResult = 'approved' | 'failed' | 'pending';

/** Información de una evaluación específica */
export interface EvaluationSummary {
  completed: boolean;
  score: number;
  evaluatorName: string;
  evaluationId?: number;
}

/** Estado de evaluaciones por tipo */
export interface EvaluationState {
  INSTITUCIONAL: EvaluationSummary;
  ACADEMICO: EvaluationSummary;
  COMITE: EvaluationSummary;
}

/** Una práctica profesional con información de evaluaciones y culminación */
export interface PracticeWithEvaluations {
  /** ID único de la práctica */
  practiceId: number;
  
  /** Información del estudiante */
  studentCi: string;
  studentName: string;
  
  /** Información académica */
  careerId: number;
  careerName: string;
  minimumGrade: number;
  
  /** Información de la institución */
  institutionId: number;
  institutionName: string;
  
  /** Período académico */
  periodId: number;
  periodName: string;
  
  /** Tipo de práctica */
  practiceTypeId: number;
  practiceTypeName: string;
  
  /** Fechas */
  startDate: string;
  endDate: string;
  
  /** Horas trabajadas */
  totalHours: number;
  
  /** Estado de evaluaciones */
  evaluationStatus: EvaluationStatus;
  evaluations: EvaluationState;
  
  /** Nota final calculada (null si no hay evaluaciones) */
  finalGrade: number | null;
  
  /** Estado de culminación */
  culminationStatus: CulminationStatus;
  
  /** Resultado de la práctica */
  result: PracticeResult;
  
  /** Información de certificado */
  certificateNumber?: string;
  certifiedAt?: string;
}

/** Datos para crear/actualizar una evaluación */
export interface EvaluationFormData {
  practiceId: number;
  evaluatorType: EvaluatorType;
  evaluatorName: string;
  evaluatorCi?: string;
  observations?: string;
  items: {
    criteriaId: number;
    itemNumber: number;
    score: number;
  }[];
}

/** Respuesta de estadísticas */
export interface EvaluationStats {
  total: number;
  completed: number;
  partial: number;
  pending: number;
  approved: number;
  failed: number;
}

/** Respuesta de estadísticas de culminación */
export interface CulminationStats {
  total: number;
  pending: number;
  approved: number;
  certified: number;
}

/** Respuesta de certificado */
export interface CertificateData {
  number: string;
  studentName: string;
  studentCi: string;
  career: string;
  institution: string;
  period: string;
  grade: number;
  totalHours: number;
  generatedAt: string;
}

/** Parámetros para filtrar prácticas */
export interface PracticeFilters {
  periodId?: number;
  careerId?: number;
  practiceTypeId?: number;
  evaluationStatus?: EvaluationStatus;
  culminationStatus?: CulminationStatus;
  result?: PracticeResult;
  search?: string;
}

/** Opciones para el dropdown de tipo de práctica */
export const PRACTICE_TYPES: { value: PracticeType; label: string }[] = [
  { value: 'PASANTIA', label: 'Pasantía' },
  { value: 'PROYECTO', label: 'Proyecto' },
  { value: 'INVESTIGACION', label: 'Investigación' },
  { value: 'SERVICIO_COMUNITARIO', label: 'Servicio Comunitario' }
];

/** Opciones de resultado */
export const RESULT_OPTIONS: { value: PracticeResult | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'approved', label: 'Aprobados' },
  { value: 'failed', label: 'Reprobados' },
  { value: 'pending', label: 'Pendientes' }
];

/** Opciones de estado de culminación */
export const CULMINATION_STATUS_OPTIONS: { value: CulminationStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'approved', label: 'Aprobado' },
  { value: 'certified', label: 'Certificado' }
];

/** Opciones de estado de evaluación */
export const EVALUATION_STATUS_OPTIONS: { value: EvaluationStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'partial', label: 'Parcial' },
  { value: 'completed', label: 'Completo' }
];

/** Configuración de colores para estados */
export const STATUS_COLORS = {
  evaluation: {
    pending: 'gray' as const,
    partial: 'warning' as const,
    completed: 'success' as const
  },
  culmination: {
    pending: 'warning' as const,
    approved: 'success' as const,
    certified: 'primary' as const
  },
  result: {
    approved: 'success' as const,
    failed: 'error' as const,
    pending: 'gray' as const
  }
};

/** Helper para obtener label de resultado */
export const getResultLabel = (result: PracticeResult): string => {
  switch (result) {
    case 'approved': return 'Aprobado';
    case 'failed': return 'Reprobado';
    case 'pending': return 'Pendiente';
  }
};