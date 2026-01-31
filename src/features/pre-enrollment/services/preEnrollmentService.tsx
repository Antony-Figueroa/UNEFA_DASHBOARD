/**
 * @file preEnrollmentService.ts
 * @description Servicio para la gestión de pre-inscripciones mediante API.
 * Implementa la capa de acceso a datos con normalización de respuestas.
 */

import { PreEnrollment, CreatePreEnrollmentPayload, UpdatePreEnrollmentPayload } from "../types";
import { createCrudService } from "../../../api/crudServiceFactory";

/** URL base para los endpoints de pre-inscripción */
const API_URL = "/pre-enrollments";

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

// Exportaciones individuales para mantener compatibilidad
export const getPreEnrollments = preEnrollmentService.getAll;
export const createPreEnrollment = preEnrollmentService.create;
export const updatePreEnrollment = preEnrollmentService.update;
export const deletePreEnrollment = preEnrollmentService.delete;
export const togglePreEnrollmentStatus = preEnrollmentService.toggleStatus!;
export const bulkDeletePreEnrollments = preEnrollmentService.bulkDelete;
export const bulkRestorePreEnrollments = preEnrollmentService.bulkRestore;
