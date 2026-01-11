/**
 * @file preEnrollmentService.tsx
 * @description Servicio para la gestión de pre-inscripciones mediante API.
 */

import { PreEnrollment } from "../types";
import apiClient from "../../../api/apiClient";

const API_URL = "/pre-enrollments";

/**
 * Obtiene la lista de pre-inscripciones desde la API.
 */
export const getPreEnrollments = async (): Promise<PreEnrollment[]> => {
  const response = await apiClient.get<PreEnrollment[]>(API_URL);
  return response.data.map(p => ({
    ...p,
    preEnrollmentDate: new Date(p.preEnrollmentDate)
  }));
};

/**
 * Crea una pre-inscripción en la API.
 */
export const createPreEnrollment = async (data: Omit<PreEnrollment, "preEnrollmentId" | "preEnrollmentDate">): Promise<PreEnrollment> => {
  const response = await apiClient.post<PreEnrollment>(API_URL, data);
  return {
    ...response.data,
    preEnrollmentDate: new Date(response.data.preEnrollmentDate)
  };
};

/**
 * Actualiza una pre-inscripción en la API.
 */
export const updatePreEnrollment = async (data: PreEnrollment): Promise<PreEnrollment> => {
  const { preEnrollmentId, ...updates } = data;
  const response = await apiClient.put<PreEnrollment>(`${API_URL}/${preEnrollmentId}`, updates);
  return {
    ...response.data,
    preEnrollmentDate: new Date(response.data.preEnrollmentDate)
  };
};

/**
 * Elimina (desactivar) una pre-inscripción en la API.
 */
export const deletePreEnrollment = async (id: string): Promise<void> => {
  await apiClient.delete(`${API_URL}/${id}`);
};
