/**
 * @file tutorsService.tsx
 * @description Servicio para la gestión de tutores a través de la API.
 */

import { Tutor } from "../types";
import apiClient from "../../../api/apiClient";

const API_URL = "/tutors";

/**
 * Obtiene la lista de tutores desde la API.
 */
export const getTutors = async (): Promise<Tutor[]> => {
  const response = await apiClient.get<Tutor[]>(API_URL);
  return response.data;
};

/**
 * Crea un nuevo tutor.
 */
export const createTutor = async (tutor: Omit<Tutor, "tutorId" | "registrationDate">): Promise<Tutor> => {
  const response = await apiClient.post<Tutor>(API_URL, tutor);
  return response.data;
};

/**
 * Actualiza un tutor existente.
 */
export const updateTutor = async (id: string, tutor: Partial<Tutor>): Promise<Tutor> => {
  const response = await apiClient.patch<Tutor>(`${API_URL}/${id}`, tutor);
  return response.data;
};

/**
 * Elimina (inactiva) un tutor.
 */
export const deleteTutor = async (id: string): Promise<void> => {
  await apiClient.delete(`${API_URL}/${id}`);
};

/**
 * Cambia el estado de un tutor.
 */
export const toggleTutorStatus = async (id: string, status: boolean): Promise<Tutor> => {
  const response = await apiClient.patch<Tutor>(`${API_URL}/${id}/status`, { status });
  return response.data;
};
