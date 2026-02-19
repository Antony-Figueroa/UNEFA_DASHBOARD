import apiClient from '../../../api/apiClient';
import {
  CreateVisitPayload,
  UpdateVisitPayload,
  VisitsResponse,
  VisitResponse,
  VisitStatsResponse
} from '../types';

export const visitsService = {
  getVisitsByPractice: async (practiceId: number): Promise<VisitsResponse> => {
    const response = await apiClient.get(`/visits/practice/${practiceId}`);
    return response.data;
  },

  getAllVisits: async (params?: {
    page?: number;
    limit?: number;
    tutorId?: number;
    studentCi?: string;
    visitType?: string;
  }): Promise<VisitsResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.tutorId) queryParams.append('tutorId', String(params.tutorId));
    if (params?.studentCi) queryParams.append('studentCi', params.studentCi);
    if (params?.visitType) queryParams.append('visitType', params.visitType);
    
    const response = await apiClient.get(`/visits?${queryParams.toString()}`);
    return response.data;
  },

  getVisitById: async (id: number): Promise<VisitResponse> => {
    const response = await apiClient.get(`/visits/${id}`);
    return response.data;
  },

  createVisit: async (payload: CreateVisitPayload): Promise<VisitResponse> => {
    const response = await apiClient.post('/visits', payload);
    return response.data;
  },

  updateVisit: async (id: number, payload: UpdateVisitPayload): Promise<VisitResponse> => {
    const response = await apiClient.put(`/visits/${id}`, payload);
    return response.data;
  },

  deleteVisit: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/visits/${id}`);
    return response.data;
  },

  getVisitStats: async (params?: {
    tutorId?: number;
    practiceId?: number;
  }): Promise<VisitStatsResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.tutorId) queryParams.append('tutorId', String(params.tutorId));
    if (params?.practiceId) queryParams.append('practiceId', String(params.practiceId));
    
    const response = await apiClient.get(`/visits/stats?${queryParams.toString()}`);
    return response.data;
  }
};

export default visitsService;
