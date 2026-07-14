/**
 * @file preEnrollmentService.ts
 * @description Servicio para la gestión de pre-inscripciones mediante API.
 * Implementa la capa de acceso a datos con normalización de respuestas.
 */

import { PreEnrollment, CreatePreEnrollmentPayload, UpdatePreEnrollmentPayload } from "../types";
import { createCrudService } from "../../../api/crudServiceFactory";
import apiClient from "../../../api/apiClient";
import { invalidateCache } from "../../../api/requestCache";

/** URL base para los endpoints de pre-inscripción */
const API_URL = "/pre-enrollments";

/** Prefijo usado para invalidar cache por endpoint */
const crudCachePrefix = (endpoint: string) => `crud:${endpoint}:`;

/**
 * Interface for PreEnrollment Data Transfer Object (API Response).
 */
interface PreEnrollmentDTO extends Omit<PreEnrollment, 'preEnrollmentDate'> {
  preEnrollmentDate: string | Date;
}

/**
 * Mapea una respuesta de la API al modelo de dominio PreEnrollment.
 * 
 * @param dto - El DTO recibido de la API.
 * @returns Un objeto PreEnrollment con tipos de datos normalizados.
 */
const mapFromApi = (dto: PreEnrollmentDTO): PreEnrollment => ({
  ...dto,
  preEnrollmentDate: dto.preEnrollmentDate ? new Date(dto.preEnrollmentDate) : new Date(),
});

/**
 * Servicio de Pre-Inscripciones utilizando la factoría CRUD.
 */
export const preEnrollmentService = createCrudService<PreEnrollment, CreatePreEnrollmentPayload, UpdatePreEnrollmentPayload, PreEnrollmentDTO>({
  endpoint: API_URL,
  mapFromApi,
  idField: 'preEnrollmentId'
});

/**
 * Obtiene los IDs de tipos de práctica ya registrados para un estudiante en un período y carrera.
 */
export const getCompletedPracticeTypes = async (
  prefix: string,
  ci: string,
  period: string,
  careerId: string
): Promise<number[]> => {
  const response = await apiClient.get<{ typeIds: number[] }>('/pre-enrollments/types-by-student', {
    params: { prefix, ci, period, careerId }
  });
  return response.data.typeIds;
};

/**
 * Tipos para pre-inscripción por lote.
 */

/** Item de estudiante para batch */
export interface BatchStudentItem {
  identificationPrefix: string;
  identificationNumber: string;
}

/** Cuerpo de la solicitud de batch */
export interface BatchPreEnrollRequest {
  students: BatchStudentItem[];
  period: string;
  practiceType: string;
  careerId: string;
  semester: string;
  section: string;
  regime: string;
}

/** Resultado individual del batch */
export interface BatchResultItem {
  ci: string;
  status: 'created' | 'failed';
  message: string;
}

/** Resultado completo del batch */
export interface BatchResult {
  created: number;
  failed: number;
  results: BatchResultItem[];
}

/**
 * Crea pre-inscripciones en lote para múltiples estudiantes.
 * 
 * @param payload - Datos comunes + lista de estudiantes.
 * @returns Resultado del batch con contadores y detalles por estudiante.
 */
export const batchCreate = async (payload: BatchPreEnrollRequest): Promise<BatchResult> => {
  const response = await apiClient.post<BatchResult>('/pre-enrollments/batch', payload);
  return response.data;
};

// Exportaciones individuales para mantener compatibilidad
export const getPreEnrollments = preEnrollmentService.getAll;
export const createPreEnrollment = preEnrollmentService.create;
export const updatePreEnrollment = preEnrollmentService.update;
export const deletePreEnrollment = preEnrollmentService.delete;
export const togglePreEnrollmentStatus = async (id: string | number, status: boolean): Promise<void> => {
  await apiClient.put(`${API_URL}/${id}`, { status });
  invalidateCache(crudCachePrefix(API_URL));
};
export const bulkDeletePreEnrollments = preEnrollmentService.bulkDelete;
export const bulkRestorePreEnrollments = preEnrollmentService.bulkRestore;

/**
 * Retira una pre-inscripción (justificado o sin justificación).
 * 
 * @param practiceId - ID de la pre-inscripción
 * @param withdrawalType - 'justified' | 'unjustified'
 * @param justificationReason - Motivo requerido para retiro justificado
 * @param withdrawComment - Comentario opcional
 */
export const withdrawPreEnrollment = async (
  practiceId: string,
  withdrawalType: 'justified' | 'unjustified',
  justificationReason: string,
  withdrawComment?: string
): Promise<void> => {
  await apiClient.patch(`${API_URL}/${practiceId}/withdraw`, {
    withdrawalType,
    justificationReason,
    withdrawComment
  });
  invalidateCache(crudCachePrefix(API_URL));
};

/**
 * Pre-submit sequential validation check.
 * Returns whether the student can enroll in the selected practice type,
 * with detailed info for cooldown, career completion, and retiro justificado modal.
 */
export interface CheckSequentialResult {
  valid: boolean;
  message?: string;
  blockingReason?: 'cooldown' | 'career_completed' | 'retiro_justificado' | 'reprobado' | 'retirado' | null;
  cooldownEndPeriodId?: number;
  cooldownEndPeriodDesc?: string;
  showChoiceModal?: boolean;
  approvedPractices?: Array<{
    internshipTypeName: string;
    priority: number;
    practicesStatus: number;
    grade: number | null;
  }>;
  suggestedPracticeTypeId?: number;
  suggestedPracticeTypeName?: string;
}

export const checkSequential = async (
  identificationPrefix: string,
  identificationNumber: string,
  careerId: number,
  internshipTypeId: number
): Promise<CheckSequentialResult> => {
  const response = await apiClient.post<CheckSequentialResult>(
    `${API_URL}/check-sequential`,
    { identificationPrefix, identificationNumber, careerId, internshipTypeId }
  );
  return response.data;
};

/**
 * Practice history entry for a student across ALL periods.
 */
export interface PracticeHistoryEntry {
  practiceId: number;
  practicesStatus: number;
  grade: number;
  practiceType: string;
  priority: number;
  period: string;
  careerId: number;
  careerName: string;
}

/**
 * Get full practice history for a student across ALL periods.
 */
export const getStudentPracticeHistory = async (
  prefix: string,
  ci: string
): Promise<PracticeHistoryEntry[]> => {
  const response = await apiClient.get<PracticeHistoryEntry[]>(
    `/enrollments/student-history/${prefix}/${ci}`
  );
  return response.data;
};
