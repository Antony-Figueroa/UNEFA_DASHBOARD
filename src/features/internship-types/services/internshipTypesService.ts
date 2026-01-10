import apiClient from "../../../api/apiClient";
import { InternshipType, InternshipTypeOption } from "../types";

const API_URL = "/internship-types";

export const getInternshipTypes = async (): Promise<InternshipType[]> => {
  try {
    const response = await apiClient.get<InternshipType[]>(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error al obtener tipos de pasantías:", error);
    throw error;
  }
};

export const getInternshipTypesByCareer = async (careerId: string | number): Promise<InternshipType[]> => {
  try {
    const response = await apiClient.get<InternshipType[]>(`${API_URL}/career/${careerId}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener tipos de pasantías para la carrera ${careerId}:`, error);
    throw error;
  }
};

export const mapToOptions = (types: InternshipType[]): InternshipTypeOption[] => {
  return types.map((t) => {
    const label = t.NAME.charAt(0).toUpperCase() + t.NAME.slice(1).toLowerCase();
    return {
      value: t.NAME,
      label,
      text: label, // Para MultiSelect
    };
  });
};
