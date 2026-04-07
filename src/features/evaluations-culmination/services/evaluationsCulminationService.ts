/**
 * @file Servicio unificado para el módulo de Evaluaciones y Culminación
 * @description API para gestionar prácticas con evaluaciones y culminación
 */

import apiClient from '../../../api/apiClient';
import {
  PracticeWithEvaluations,
  PracticeFilters,
  EvaluationStats,
  CulminationStats,
  CertificateData,
  EvaluationFormData
} from '../types';

/** Respuesta de lista de prácticas con evaluaciones */
export interface PracticesResponse {
  success: boolean;
  data: PracticeWithEvaluations[];
  meta?: {
    total: number;
    periods: { id: number; name: string }[];
    careers: { id: number; name: string }[];
    practiceTypes: { id: number; name: string }[];
  };
}

/** Respuesta de estadísticas de evaluaciones */
export interface EvaluationStatsResponse {
  success: boolean;
  data: EvaluationStats;
}

/** Respuesta de estadísticas de culminación */
export interface CulminationStatsResponse {
  success: boolean;
  data: CulminationStats;
}

/** Respuesta de approve */
export interface ApproveResponse {
  success: boolean;
  message: string;
}

/** Respuesta de certificado */
export interface CertificateResponse {
  success: boolean;
  message: string;
  certificate: CertificateData;
}

/** Servicio unificado de Evaluaciones y Culminación */
export const evaluationsCulminationService = {
  /**
   * Obtiene todas las prácticas con información de evaluaciones y culminación
   */
  getPractices: async (filters?: PracticeFilters): Promise<PracticesResponse> => {
    const queryParams = new URLSearchParams();
    
    if (filters?.periodId) queryParams.append('periodId', String(filters.periodId));
    if (filters?.careerId) queryParams.append('careerId', String(filters.careerId));
    if (filters?.practiceTypeId) queryParams.append('practiceTypeId', String(filters.practiceTypeId));
    if (filters?.evaluationStatus) queryParams.append('evaluationStatus', filters.evaluationStatus);
    if (filters?.culminationStatus) queryParams.append('culminationStatus', filters.culminationStatus);
    if (filters?.result) queryParams.append('result', filters.result);
    if (filters?.search) queryParams.append('search', filters.search);
    
    const response = await apiClient.get(`/practices/evaluations?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Obtiene una práctica específica con todas sus evaluaciones
   */
  getPracticeById: async (practiceId: number): Promise<PracticeWithEvaluations> => {
    const response = await apiClient.get(`/practices/${practiceId}/evaluations`);
    return response.data.data;
  },

  /**
   * Obtiene estadísticas de evaluaciones (total, completadas, parciales, pendientes)
   */
  getEvaluationStats: async (filters?: PracticeFilters): Promise<EvaluationStatsResponse> => {
    const queryParams = new URLSearchParams();
    
    if (filters?.periodId) queryParams.append('periodId', String(filters.periodId));
    if (filters?.careerId) queryParams.append('careerId', String(filters.careerId));
    if (filters?.practiceTypeId) queryParams.append('practiceTypeId', String(filters.practiceTypeId));
    
    const response = await apiClient.get(`/practices/evaluations/stats?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Obtiene estadísticas de culminación (pendientes, aprobados, certificados)
   */
  getCulminationStats: async (filters?: PracticeFilters): Promise<CulminationStatsResponse> => {
    const queryParams = new URLSearchParams();
    
    if (filters?.periodId) queryParams.append('periodId', String(filters.periodId));
    if (filters?.careerId) queryParams.append('careerId', String(filters.careerId));
    if (filters?.practiceTypeId) queryParams.append('practiceTypeId', String(filters.practiceTypeId));
    
    const response = await apiClient.get(`/practices/culmination/stats?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Crea o actualiza una evaluación
   */
  saveEvaluation: async (data: EvaluationFormData): Promise<{ success: boolean; data?: any; message?: string }> => {
    // Si ya existe una evaluación de este tipo, actualizamos; si no, creamos
    // El endpoint POST creará o el PUT actualizará
    try {
      const response = await apiClient.post('/evaluations', data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('ya existe')) {
        // Ya existe, intentar actualizar
        const existingResponse = await apiClient.get(`/evaluations?practiceId=${data.practiceId}&evaluatorType=${data.evaluatorType}`);
        const existingEval = existingResponse.data.data.find((e: any) => e.evaluatorType === data.evaluatorType);
        if (existingEval) {
          const updateResponse = await apiClient.put(`/evaluations/${existingEval.evaluationId}`, data);
          return updateResponse.data;
        }
      }
      throw error;
    }
  },

  /**
   * Aprueba la culminación de una práctica
   */
  approveCulmination: async (practiceId: number): Promise<ApproveResponse> => {
    const response = await apiClient.post(`/culmination/${practiceId}/approve`);
    return response.data;
  },

  /**
   * Genera un certificado para una práctica aprobada
   */
  generateCertificate: async (practiceId: number): Promise<CertificateResponse> => {
    const response = await apiClient.post(`/culmination/${practiceId}/certificate`);
    return response.data;
  },

  /**
   * Obtiene el certificado de una práctica
   */
  getCertificate: async (practiceId: number): Promise<CertificateResponse> => {
    const response = await apiClient.get(`/culmination/${practiceId}/certificate`);
    return response.data;
  }
};

export default evaluationsCulminationService;