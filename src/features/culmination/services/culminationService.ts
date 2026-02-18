import apiClient from '../../../api/apiClient';

export interface CulminationRecord {
  id: string;
  studentCi: string;
  studentName: string;
  careerId: number;
  careerName: string;
  institutionId: number;
  institutionName: string;
  period: string;
  practiceType: string;
  startDate: string;
  endDate: string;
  totalHours: number;
  status: 'pending' | 'approved' | 'certified';
  certificateNumber?: string;
  certifiedAt?: string;
}

export interface CulminationMeta {
  total: number;
  pending: number;
  approved: number;
  certified: number;
}

export interface CulminationResponse {
  success: boolean;
  data: CulminationRecord[];
  meta: CulminationMeta;
}

export interface CertificateResponse {
  success: boolean;
  message: string;
  certificate: {
    number: string;
    studentName: string;
    studentCi: string;
    career: string;
    institution: string;
    period: string;
    generatedAt: string;
  };
}

export const culminationService = {
  getRecords: async (params?: { status?: string; period?: string; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.period) queryParams.append('period', params.period);
    if (params?.search) queryParams.append('search', params.search);
    
    const queryString = queryParams.toString();
    const url = `/culmination${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient.get(url);
    return response.data as CulminationResponse;
  },

  approve: async (enrollmentId: string) => {
    const response = await apiClient.post(`/culmination/${enrollmentId}/approve`);
    return response.data;
  },

  generateCertificate: async (enrollmentId: string) => {
    const response = await apiClient.post(`/culmination/${enrollmentId}/certificate`);
    return response.data as CertificateResponse;
  }
};

export default culminationService;
