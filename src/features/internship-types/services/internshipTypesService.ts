import apiClient from "../../../api/apiClient";
import { InternshipType, InternshipTypeOption } from "../types";

const API_URL = "/internship-types";

export const getInternshipTypes = async (): Promise<InternshipType[]> => {
  try {
    const response = await apiClient.get<InternshipType[]>(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error al obtener tipos de prácticas profesionales:", error);
    throw error;
  }
};

export const getInternshipTypesByCareer = async (careerId: string | number): Promise<InternshipType[]> => {
  try {
    const response = await apiClient.get<InternshipType[]>(`${API_URL}/career/${careerId}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener tipos de prácticas profesionales para la carrera ${careerId}:`, error);
    throw error;
  }
};

export const createInternshipType = async (data: Omit<InternshipType, "INTERNSHIP_TYPE_ID" | "CREATION_DATE">): Promise<InternshipType> => {
  try {
    const response = await apiClient.post<InternshipType>(API_URL, data);
    return response.data;
  } catch (error) {
    console.error("Error al crear tipo de pasantía:", error);
    throw error;
  }
};

export const updateInternshipType = async (id: number, data: Partial<InternshipType>): Promise<InternshipType> => {
  try {
    const response = await apiClient.put<InternshipType>(`${API_URL}/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar tipo de pasantía ${id}:`, error);
    throw error;
  }
};

export const deleteInternshipType = async (id: number): Promise<void> => {
  try {
    await apiClient.delete(`${API_URL}/${id}`);
  } catch (error) {
    console.error(`Error al eliminar tipo de pasantía ${id}:`, error);
    throw error;
  }
};

export const toggleInternshipTypeStatus = async (id: number): Promise<void> => {
  try {
    await apiClient.patch(`${API_URL}/${id}/toggle-status`);
  } catch (error) {
    console.error(`Error al cambiar estado de tipo de pasantía ${id}:`, error);
    throw error;
  }
};

export const bulkDeleteInternshipTypes = async (ids: number[]): Promise<void> => {
  try {
    await apiClient.post(`${API_URL}/bulk-delete`, { ids });
  } catch (error) {
    console.error("Error en eliminación masiva de tipos de pasantías:", error);
    throw error;
  }
};

export const bulkRestoreInternshipTypes = async (ids: number[]): Promise<void> => {
  try {
    await apiClient.post(`${API_URL}/bulk-restore`, { ids });
  } catch (error) {
    console.error("Error en restauración masiva de tipos de pasantías:", error);
    throw error;
  }
};

export const mapToOptions = (types: InternshipType[]): InternshipTypeOption[] => {
  return types.map((t) => {
    const label = t.NAME.charAt(0).toUpperCase() + t.NAME.slice(1).toLowerCase();
    return {
      id: t.INTERNSHIP_TYPE_ID,
      value: t.NAME,
      label,
      text: label, // Para MultiSelect
    };
  });
};
