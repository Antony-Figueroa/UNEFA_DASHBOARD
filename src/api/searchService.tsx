/**
 * @file searchService.tsx
 * @description Servicio para búsqueda global desde el frontend
 * Llamadas al endpoint /api/search/global
 */

import apiClient from './apiClient';

export interface SearchStudent {
  id: string;
  name: string;
  ci: string;
  email: string;
  careerName?: string;
  semester?: number;
}

export interface SearchTutor {
  id: string;
  name: string;
  ci: string;
  email: string;
  department?: string;
}

export interface SearchInstitution {
  id: string;
  name: string;
  rif: string;
  phone?: string;
  region?: string;
}

export interface SearchCareer {
  id: string;
  name: string;
  code?: string;
}

export interface GlobalSearchResponse {
  success: boolean;
  data: {
    students: SearchStudent[];
    tutors: SearchTutor[];
    institutions: SearchInstitution[];
    careers: SearchCareer[];
  };
  total: number;
  query: string;
  searchedTypes: string[];
}

export interface GlobalSearchParams {
  q: string;
  types?: string; // Tipos separados por coma: "students,tutors"
  limit?: number;
}

/**
 * Realiza una búsqueda global en el sistema
 * @param params - Parámetros de búsqueda
 * @returns Respuesta con resultados categorizados
 */
export const globalSearch = async (params: GlobalSearchParams): Promise<GlobalSearchResponse> => {
  try {
    const response = await apiClient.get<GlobalSearchResponse>('/search/global', {
      params: {
        q: params.q,
        types: params.types,
        limit: params.limit || 5
      }
    });
    return response.data;
  } catch (error) {
    console.error('[searchService] Error en búsqueda global:', error);
    throw error;
  }
};

export default {
  globalSearch
};