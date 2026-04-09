/**
 * @file Tipos para el detalle del estudiante
 * @description Define las interfaces para el modal de detalle del estudiante
 */

/** Datos personales del estudiante */
export interface StudentPersonalInfo {
  studentCi: string;
  studentName: string;
  email?: string;
  phone?: string;
  careerId: number;
  careerName: string;
}

/** Datos de la práctica profesional */
export interface PracticeInfo {
  practiceId: number;
  enrollment: string;
  startDate: string;
  endDate: string;
  institutionId: number;
  institutionName: string;
  periodId: number;
  periodName: string;
  practiceTypeId: number;
  practiceTypeName: string;
  totalHours: number;
  practicesStatus: number;
  practicesStatusLabel: string;
}

/** Una evaluación */
export interface EvaluationDetail {
  evaluationId: number;
  evaluatorType: 'INSTITUCIONAL' | 'ACADEMICO' | 'COMITE';
  evaluatorName: string;
  evaluatorCi?: string;
  totalScore: number;
  items: EvaluationItem[];
  observations?: string;
  createdAt: string;
  updatedAt: string;
}

/** Un ítem de evaluación (criterio) */
export interface EvaluationItem {
  criteriaId: number;
  itemNumber: number;
  score: number;
  maxScore: number;
  criteriaName: string;
}

/** Una visita de seguimiento */
export interface VisitDetail {
  visitId: number;
  visitDate: string;
  visitType: 'PRESENCIAL' | 'VIRTUAL' | 'TELEFONICA';
  visitCase: string;
  hoursWorked: number;
  activitiesPerformed: string;
  observations?: string;
  recommendations?: string;
}

/** Un documento */
export interface DocumentDetail {
  documentId: number;
  documentType: string;
  fileName: string;
  filePath: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  uploadedAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

/** Estado de evaluaciones resumido */
export interface EvaluationSummaryStatus {
  institucional: { completed: boolean; score: number | null };
  academico: { completed: boolean; score: number | null };
  comite: { completed: boolean; score: number | null };
  finalGrade: number | null;
  status: 'pending' | 'partial' | 'completed';
}

/** Estado de culminación */
export interface CulminationStatus {
  status: 'pending' | 'approved' | 'certified';
  certificateNumber?: string;
  certifiedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
}

/** Respuesta completa del detalle del estudiante */
export interface StudentDetail {
  student: StudentPersonalInfo;
  practice: PracticeInfo;
  evaluations: EvaluationSummaryStatus;
  visits: VisitDetail[];
  documents: DocumentDetail[];
  culmination: CulminationStatus;
}

/** Opciones de reporte */
export interface ReportOptions {
  includePersonalInfo: boolean;
  includePractice: boolean;
  includeEvaluations: boolean;
  includeVisits: boolean;
  includeDocuments: boolean;
}

/** Valores por defecto para opciones de reporte */
export const DEFAULT_REPORT_OPTIONS: ReportOptions = {
  includePersonalInfo: true,
  includePractice: true,
  includeEvaluations: true,
  includeVisits: true,
  includeDocuments: true
};

/** Labels para tipos de evaluación */
export const EVALUATION_TYPE_LABELS: Record<string, string> = {
  INSTITUCIONAL: 'Institucional (40%)',
  ACADEMICO: 'Académica (30%)',
  COMITE: 'Comité (30%)'
};

/** Labels para estados */
export const VISIT_TYPE_LABELS: Record<string, string> = {
  PRESENCIAL: 'Presencial',
  VIRTUAL: 'Virtual',
  TELEFONICA: 'Telefónica'
};

export const DOCUMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado'
};