/**
 * @file preEnrollmentService.ts
 * @description Servicio para la gestión de pre-inscripciones mediante API.
 * Implementa la capa de acceso a datos con normalización de respuestas.
 */

import { PreEnrollment, CreatePreEnrollmentPayload, UpdatePreEnrollmentPayload } from "../types";
import apiClient from "../../../api/apiClient";

/** URL base para los endpoints de pre-inscripción */
const API_URL = "/pre-enrollments";

/**
 * Mapea una respuesta de la API al modelo de dominio PreEnrollment.
 * 
 * @param data - Los datos crudos recibidos de la API.
 * @returns Un objeto PreEnrollment con tipos de datos normalizados.
 */
const mapToPreEnrollment = (data: any): PreEnrollment => ({
  ...data,
  preEnrollmentDate: data.preEnrollmentDate ? new Date(data.preEnrollmentDate) : new Date(),
});

/**
 * Obtiene la lista completa de pre-inscripciones.
 * 
 * @returns Una promesa que resuelve a un array de PreEnrollment.
 * @throws Error si la petición falla.
 */
export const getPreEnrollments = async (): Promise<PreEnrollment[]> => {
  try {
    const response = await apiClient.get<any[]>(API_URL);
    return response.data.map(mapToPreEnrollment);
  } catch (error) {
    console.error("[preEnrollmentService] Error al obtener pre-inscripciones:", error);
    throw error;
  }
};

/**
 * Crea una nueva pre-inscripción en el sistema.
 * 
 * @param payload - Los datos de la nueva pre-inscripción.
 * @returns Una promesa que resuelve a la pre-inscripción creada.
 * @throws Error si la creación falla.
 */
export const createPreEnrollment = async (payload: CreatePreEnrollmentPayload): Promise<PreEnrollment> => {
  try {
    const response = await apiClient.post<any>(API_URL, payload);
    return mapToPreEnrollment(response.data);
  } catch (error) {
    console.error("[preEnrollmentService] Error al crear pre-inscripción:", error);
    throw error;
  }
};

/**
 * Actualiza una pre-inscripción existente.
 * 
 * @param payload - Los datos a actualizar, incluyendo el preEnrollmentId.
 * @returns Una promesa que resuelve a la pre-inscripción actualizada.
 * @throws Error si la actualización falla.
 */
export const updatePreEnrollment = async (payload: UpdatePreEnrollmentPayload): Promise<PreEnrollment> => {
  try {
    const { preEnrollmentId, ...updates } = payload;
    const response = await apiClient.put<any>(`${API_URL}/${preEnrollmentId}`, updates);
    return mapToPreEnrollment(response.data);
  } catch (error) {
    console.error(`[preEnrollmentService] Error al actualizar pre-inscripción ${payload.preEnrollmentId}:`, error);
    throw error;
  }
};

/**
 * Elimina o desactiva una pre-inscripción por su identificador.
 * 
 * @param id - El identificador único de la pre-inscripción.
 * @returns Una promesa que se resuelve cuando la operación se completa.
 * @throws Error si la eliminación falla.
 */
export const deletePreEnrollment = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`${API_URL}/${id}`);
  } catch (error) {
    console.error(`[preEnrollmentService] Error al eliminar pre-inscripción ${id}:`, error);
    throw error;
  }
};
