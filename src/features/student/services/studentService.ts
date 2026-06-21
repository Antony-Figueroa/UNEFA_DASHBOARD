import apiClient from '../../../api/apiClient';
import type { 
  DashboardData, 
  StudentProfile,
  StudentTrackingData
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

  getTracking: async (): Promise<StudentTrackingData> => {
    const response = await apiClient.get(`${API_URL}/tracking`);
    return response.data.data;
  },

};

export default studentService;
