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
  visitType: 'PRESENCIAL' | 'VIRTUAL' | 'TELEFONICA';
  visitCase: VisitCase;
  hoursWorked: number;
  activitiesPerformed: string;
  observations: string;
  recommendations: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVisitPayload {
  practiceId: number;
  tutorId: number;
  visitDate: string;
  visitType: 'PRESENCIAL' | 'VIRTUAL' | 'TELEFONICA';
  visitCase: VisitCase;
  hoursWorked: number;
  activitiesPerformed: string;
  observations: string;
  recommendations: string;
}

export interface UpdateVisitPayload {
  visitDate?: string;
  visitType?: 'PRESENCIAL' | 'VIRTUAL' | 'TELEFONICA';
  visitCase?: VisitCase;
  hoursWorked?: number;
  activitiesPerformed?: string;
  observations?: string;
  recommendations?: string;
}

export type VisitCase = 
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

export const VISIT_CASES: { value: VisitCase; label: string; description: string }[] = [
  { value: 'VISITA_INICIAL', label: 'Visita Inicial', description: 'Primera visita de presentación y verificación de inicio' },
  { value: 'SEGUIMIENTO_REGULAR', label: 'Seguimiento Regular', description: 'Visita de monitoreo de progreso' },
  { value: 'REVISION_BITACORAS', label: 'Revisión de Bitácoras', description: 'Verificación de actividades registradas' },
  { value: 'EVALUACION_PARCIAL', label: 'Evaluación Parcial', description: 'Evaluación parcial del estudiante' },
  { value: 'SEGUIMIENTO_PROBLEMAS', label: 'Seguimiento de Problemas', description: 'Atención a dificultades reportadas' },
  { value: 'CAMBIO_EMPRESA', label: 'Cambio de Empresa', description: 'Verificación y aprobación de nueva empresa' },
  { value: 'CAMBIO_TUTOR', label: 'Cambio de Tutor', description: 'Asignación de nuevo tutor académico' },
  { value: 'SUSPENSION', label: 'Suspensión', description: 'Gestión de pausa de prácticas' },
  { value: 'REANUDACION', label: 'Reanudación', description: 'Verificación de reinicio de actividades' },
  { value: 'EVALUACION_FINAL', label: 'Evaluación Final', description: 'Cierre y calificación de prácticas' },
  { value: 'CERTIFICACION', label: 'Certificación', description: 'Verificación de documentos finales' }
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

export const VISIT_TYPES = [
  { value: 'PRESENCIAL', label: 'Presencial' },
  { value: 'VIRTUAL', label: 'Virtual' },
  { value: 'TELEFONICA', label: 'Telefónica' }
] as const;
