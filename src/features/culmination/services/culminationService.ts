import apiClient from '../../../api/apiClient';

// --- Backward compat types (used by CertificatePDF) ---
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

// --- New grouped types ---

export interface ReversalInfo {
  reason: string;
  resolutionNumber: string;
  createdAt: string;
}

export interface CulminationPractice {
  id: string;
  practiceType: string;
  practiceTypeId: number;
  institutionName: string;
  totalHours: number;
  hoursRequired: number;
  evaluationStatus: string;
  finalGrade: number | null;
  result: 'approved' | 'failed' | 'pending';
  culminationStatus: 'pending' | 'approved' | 'certified';
  certificateNumber?: string;
  certifiedAt?: string;
  reversal?: ReversalInfo;
}

export interface CulminationGroup {
  studentCi: string;
  studentName: string;
  careerName: string;
  period: string;
  practices: CulminationPractice[];
  overallStatus: 'completed' | 'in_progress';
}

export interface CulminationMeta {
  total: number;
  completed: number;
  inProgress: number;
}

export interface CulminationResponse {
  success: boolean;
  data: CulminationGroup[];
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

export interface ReversalPayload {
  reason: string;
  resolutionNumber: string;
}

export const culminationService = {
  getAll: (params?: { status?: string; period?: string; search?: string }) =>
    apiClient.get<CulminationResponse>('/api/culmination', { params }).then(r => r.data),

  approve: (practiceId: string) =>
    apiClient.post(`/api/culmination/${practiceId}/approve`).then(r => r.data),

  generateCertificate: (practiceId: string) =>
    apiClient.post<CertificateResponse>(`/api/culmination/${practiceId}/certificate`).then(r => r.data),

  reverse: (practiceId: string, payload: ReversalPayload) =>
    apiClient.post(`/api/culmination/${practiceId}/reverse`, payload).then(r => r.data),
};

export default culminationService;
