import apiClient from '../../../api/apiClient';
import type {
  StudentRequest,
  RequestType,
  CreateRequestPayload
} from '../types';

const API_URL = '/student';

export const studentRequestsService = {
  getRequestTypes: async (): Promise<RequestType[]> => {
    const response = await apiClient.get(`${API_URL}/request-types`);
    return response.data.data;
  },

  getRequests: async (): Promise<StudentRequest[]> => {
    const response = await apiClient.get(`${API_URL}/requests`);
    return response.data.data;
  },

  createRequest: async (data: CreateRequestPayload): Promise<{ id: number }> => {
    const payload: Record<string, unknown> = {
      typeId: data.typeId,
      subject: data.subject,
      description: data.description
    };

    if (data.reassignmentData) {
      payload.reassignmentData = data.reassignmentData;
    }

    const response = await apiClient.post(`${API_URL}/requests`, payload);
    return response.data.data;
  }
};

export default studentRequestsService;
