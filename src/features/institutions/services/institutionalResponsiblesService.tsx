/**
 * @file institutionalResponsiblesService.tsx
 * @description Servicio para la gestión de responsables institucionales a través de la API.
 */

import { InstitutionalResponsible } from "../types";
import apiClient from "../../../api/apiClient";

const API_URL = "/institutional-responsibles";

/**
 * Obtiene la lista de responsables institucionales desde la API.
 */
export const getInstitutionalResponsibles = async (): Promise<InstitutionalResponsible[]> => {
  const response = await apiClient.get<InstitutionalResponsible[]>(API_URL);
  return response.data;
};

/**
 * Crea un nuevo responsable institucional.
 */
export const createInstitutionalResponsible = async (
  responsible: Omit<InstitutionalResponsible, "responsibleId" | "registrationDate">
): Promise<InstitutionalResponsible> => {
  const response = await apiClient.post<InstitutionalResponsible>(API_URL, responsible);
  return response.data;
};

/**
 * Actualiza un responsable institucional existente.
 */
export const updateInstitutionalResponsible = async (
  id: string,
  responsible: Partial<InstitutionalResponsible>
): Promise<InstitutionalResponsible> => {
  const response = await apiClient.patch<InstitutionalResponsible>(`${API_URL}/${id}`, responsible);
  return response.data;
};

/**
 * Elimina (inactiva) un responsable institucional.
 */
export const deleteInstitutionalResponsible = async (id: string): Promise<void> => {
  await apiClient.delete(`${API_URL}/${id}`);
};

/**
 * Cambia el estado de un responsable institucional.
 */
export const toggleInstitutionalResponsibleStatus = async (id: string, status: boolean): Promise<InstitutionalResponsible> => {
  const response = await apiClient.patch<InstitutionalResponsible>(`${API_URL}/${id}/status`, { status });
  return response.data;
};
