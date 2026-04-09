/**
 * @file Servicio para obtener el detalle del estudiante
 */

import apiClient from '../../../api/apiClient';
import { StudentDetail, ReportOptions } from '../types';

/** Respuesta del detalle del estudiante */
export interface StudentDetailResponse {
  success: boolean;
  data: StudentDetail;
}

/** Servicio de detalle del estudiante */
export const studentDetailService = {
  /**
   * Obtiene el detalle completo de un estudiante y su práctica
   */
  getDetail: async (practiceId: number): Promise<StudentDetailResponse> => {
    // Usar el endpoint específico para obtener detalle por practiceId
    const response = await apiClient.get(`/practices/detail/${practiceId}`);
    return response.data;
  },

  /**
   * Genera el reporte PDF del estudiante
   */
  generateReport: async (practiceId: number, options: ReportOptions): Promise<Blob> => {
    const response = await apiClient.post(
      `/practices/${practiceId}/report`,
      options,
      { responseType: 'blob' }
    );
    return response.data;
  }
};

export default studentDetailService;