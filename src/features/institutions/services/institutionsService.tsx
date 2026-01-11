/**
 * @file institutionsService.tsx
 * @description Servicio para la gestión de instituciones a través de la API.
 */

import { Institution } from "../types";
import apiClient from "../../../api/apiClient";

const API_URL = "/institutions";

/**
 * Obtiene la lista de instituciones desde la API.
 */
export const getInstitutions = async (): Promise<Institution[]> => {
  const response = await apiClient.get<Institution[]>(API_URL);
  return response.data;
};

/**
 * Crea una nueva institución.
 */
export const createInstitution = async (institution: Omit<Institution, "institutionId" | "registrationDate">): Promise<Institution> => {
  const response = await apiClient.post<Institution>(API_URL, institution);
  return response.data;
};

/**
 * Actualiza una institución existente.
 */
export const updateInstitution = async (id: string, institution: Partial<Institution>): Promise<Institution> => {
  const response = await apiClient.patch<Institution>(`${API_URL}/${id}`, institution);
  return response.data;
};

/**
 * Elimina (inactiva) una institución.
 */
export const deleteInstitution = async (id: string): Promise<void> => {
  await apiClient.delete(`${API_URL}/${id}`);
};

/**
 * Cambia el estado de una institución.
 */
export const toggleInstitutionStatus = async (id: string, status: boolean): Promise<Institution> => {
  const response = await apiClient.patch<Institution>(`${API_URL}/${id}/status`, { status });
  return response.data;
};
