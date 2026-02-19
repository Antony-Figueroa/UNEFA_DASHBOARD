import apiClient from '../../../api/apiClient';
import type { 
  DashboardData, 
  StudentProfile, 
  StudentRequest, 
  RequestType,
  CreateRequestPayload 
} from '../types';

const API_URL = '/student';

export const studentService = {
  getDashboard: async (): Promise<DashboardData> => {
    const response = await apiClient.get(`${API_URL}/dashboard`);
    return response.data.data;
  },

  getProfile: async (): Promise<StudentProfile> => {
    const response = await apiClient.get(`${API_URL}/profile`);
    return response.data.data;
  },

  getRequestTypes: async (): Promise<RequestType[]> => {
    const response = await apiClient.get(`${API_URL}/request-types`);
    return response.data.data;
  },

  getRequests: async (): Promise<StudentRequest[]> => {
    const response = await apiClient.get(`${API_URL}/requests`);
    return response.data.data;
  },

  createRequest: async (data: CreateRequestPayload): Promise<{ id: number }> => {
    const response = await apiClient.post(`${API_URL}/requests`, data);
    return response.data.data;
  }
};

export default studentService;
