/**
 * @file enrollmentService.tsx
 * @description Servicio para la gestión de inscripciones mediante API.
 */

import { Enrollment } from "../types";
import apiClient from "../../../api/apiClient";

const API_URL = "/enrollments";

/**
 * Obtiene la lista de inscripciones desde la API.
 */
export const getEnrollments = async (): Promise<Enrollment[]> => {
  const response = await apiClient.get<Enrollment[]>(API_URL);
  return response.data.map(e => ({
    ...e,
    enrollmentDate: new Date(e.enrollmentDate)
  }));
};

/**
 * Crea una inscripción en la API.
 */
export const createEnrollment = async (data: Omit<Enrollment, "enrollmentId" | "enrollmentDate">): Promise<Enrollment> => {
  const response = await apiClient.post<Enrollment>(API_URL, data);
  return {
    ...response.data,
    enrollmentDate: new Date(response.data.enrollmentDate)
  };
};

/**
 * Actualiza una inscripción en la API.
 */
export const updateEnrollment = async (data: Enrollment): Promise<Enrollment> => {
  const { enrollmentId, ...updates } = data;
  const response = await apiClient.put<Enrollment>(`${API_URL}/${enrollmentId}`, updates);
  return {
    ...response.data,
    enrollmentDate: new Date(response.data.enrollmentDate)
  };
};

/**
 * Elimina (desactivar) una inscripción en la API.
 */
export const deleteEnrollment = async (id: string): Promise<void> => {
  await apiClient.delete(`${API_URL}/${id}`);
};
