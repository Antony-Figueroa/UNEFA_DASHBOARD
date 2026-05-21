export interface Visit {
  visitId: number;
  practiceId: number;
  tutorId: number;
  tutorName: string;
  tutorCi: string;
  studentName: string;
  studentCi: string;
  institutionName: string;
  visitDate: string;
  visitType: string;  // Dinámico: viene de t_list_values
  visitCase: string;   // Dinámico: viene de t_list_values
  hoursWorked: number;
  activitiesPerformed: string;
  observations: string;
  recommendations: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  /** Fecha de inicio del período académico */
  periodStartDate?: string;
  /** Fecha de fin del período académico */
  periodEndDate?: string;
}

export interface CreateVisitPayload {
  practiceId: number;
  tutorId: number;
  visitDate: string;
  visitType: string;   // Dinámico: viene de t_list_values
  visitCase: string;    // Dinámico: viene de t_list_values
  hoursWorked: number;
  activitiesPerformed: string;
  observations: string;
  recommendations: string;
}

export interface UpdateVisitPayload {
  /** ID de la práctica (necesario para validar duplicados de fecha) */
  practiceId?: number;
  visitDate?: string;
  visitType?: string;   // Dinámico: viene de t_list_values
  visitCase?: string;   // Dinámico: viene de t_list_values
  hoursWorked?: number;
  activitiesPerformed?: string;
  observations?: string;
  recommendations?: string;
}

/**
 * Tipo base para opciones de listas dinámicas.
 * Se usa para cargar valores desde t_list_values.
 */
export interface ListOption {
  value: string;
  label: string;
}

/**
 * Casos de seguimiento legacy (para backwards compatibility).
 * Estos valores existen en datos antiguos pero los nuevos vienen de t_list.
 */
export type LegacyVisitCase =
  | 'VISITA_INICIAL'
  | 'SEGUIMIENTO_REGULAR'
  | 'REVISION_BITACORAS'
  | 'EVALUACION_PARCIAL'
  | 'SEGUIMIENTO_PROBLEMAS'
  | 'CAMBIO_EMPRESA'
  | 'CAMBIO_TUTOR'
  | 'SUSPENSION'
  | 'REANUDACION'
  | 'EVALUACION_FINAL'
  | 'CERTIFICACION';

/**
 * Tipos de visita legacy (para backwards compatibility).
 */
export type LegacyVisitType = 'PRESENCIAL' | 'VIRTUAL' | 'TELEFONICA';

/**
 * Opciones legacy para casos de seguimiento.
 * Usar estas solo si no hay listas dinámicas disponibles.
 */
export const LEGACY_VISIT_CASES: { value: string; label: string }[] = [
  { value: 'VISITA_INICIAL', label: 'Visita Inicial' },
  { value: 'SEGUIMIENTO_REGULAR', label: 'Seguimiento Regular' },
  { value: 'REVISION_BITACORAS', label: 'Revisión de Bitácoras' },
  { value: 'EVALUACION_PARCIAL', label: 'Evaluación Parcial' },
  { value: 'SEGUIMIENTO_PROBLEMAS', label: 'Seguimiento a Problemas' },
  { value: 'CAMBIO_EMPRESA', label: 'Cambio de Empresa' },
  { value: 'CAMBIO_TUTOR', label: 'Cambio de Tutor' },
  { value: 'SUSPENSION', label: 'Suspensión' },
  { value: 'REANUDACION', label: 'Reanudación' },
  { value: 'EVALUACION_FINAL', label: 'Evaluación Final' },
  { value: 'CERTIFICACION', label: 'Certificación' }
];

/**
 * Opciones legacy para tipos de visita.
 * Usar estas solo si no hay listas dinámicas disponibles.
 */
export const LEGACY_VISIT_TYPES: { value: string; label: string }[] = [
  { value: 'PRESENCIAL', label: 'Presencial' },
  { value: 'VIRTUAL', label: 'Virtual' },
  { value: 'TELEFONICA', label: 'Telefónica' }
];

export interface VisitStats {
  totalVisits: number;
  totalHours: number;
  visitsByType: Record<string, number>;
  visitsByMonth: Array<{ month: string; count: number }>;
}

export interface VisitsResponse {
  success: boolean;
  data: Visit[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface VisitResponse {
  success: boolean;
  data: Visit;
  message?: string;
}

export interface VisitStatsResponse {
  success: boolean;
  data: VisitStats;
}

/**
 * Opciones para tipos de visita (legacy para backwards compatibility).
 * Usar listas dinámicas desde t_list cuando estén disponibles.
 */
export const VISIT_TYPES = LEGACY_VISIT_TYPES;


