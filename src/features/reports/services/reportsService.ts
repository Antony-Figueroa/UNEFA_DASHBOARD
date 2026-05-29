import apiClient from '../../../api/apiClient';

export interface CulminatedStudentReportRow {
  id: number;
  studentCi: string;
  studentName: string;
  careerName: string;
  institutionName: string;
  practiceType: string;
  tutorName: string;
  period: string;
  startDate: string;
  endDate: string;
  totalHours: number;
  grade: number;
  status: 'pending' | 'approved' | 'certified';
  certificateNumber?: string;
  certifiedAt?: string;
}

export interface CulminatedStudentsResponse {
  success: boolean;
  data: CulminatedStudentReportRow[];
  meta: {
    total: number;
  };
}

export interface ReportMetric {
  label: string;
  value: number | string;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
}

export interface CareerData {
  label: string;
  fullName: string;
  value: number;
  color?: string;
  percentage: number;
}

export interface PeriodData {
  label: string;
  periodId: number;
  value: number;
}

export interface RecentReport {
  id: number;
  name: string;
  date: string;
  type: string;
  status: string;
  user?: string;
}

export interface TutorAcademicReportRow {
  nro: number;
  region: string;
  nucleo: string;
  extension: string;
  carrera: string;
  nombreTutor: string;
  apellidoTutor: string;
  cedula: string;
  condicion: string;
  dedicacion: string;
  categoria: string;
  telefono: string;
  correo: string;
  cantidadEstudiantes: number;
}

export interface TutorAcademicReportResponse {
  success: boolean;
  data: TutorAcademicReportRow[];
  meta: {
    total: number;
    totalEstudiantes: number;
  };
}

export const reportsService = {
  getStats: async (period?: string) => {
    const params = period ? `?period=${period}` : '';
    const response = await apiClient.get(`/reports/stats${params}`);
    return response.data;
  },

  getStudentsByCareer: async () => {
    const response = await apiClient.get('/reports/students-by-career');
    return response.data as CareerData[];
  },

  getEnrollmentsByPeriod: async () => {
    const response = await apiClient.get('/reports/enrollments-by-period');
    return response.data as PeriodData[];
  },

  getRecentReports: async () => {
    const response = await apiClient.get('/reports/recent');
    return response.data as RecentReport[];
  },

  getTutorsAcademicReport: async (periodId?: number, careerId?: number) => {
    const params = new URLSearchParams();
    if (periodId) params.append('periodId', periodId.toString());
    if (careerId) params.append('careerId', careerId.toString());
    const response = await apiClient.get(`/reports/tutores-academicos?${params.toString()}`);
    return response.data as TutorAcademicReportResponse;
  },

  getResumenPasantiasReport: async (periodId?: number, careerId?: number) => {
    const params = new URLSearchParams();
    if (periodId) params.append('periodId', periodId.toString());
    if (careerId) params.append('careerId', careerId.toString());
    const response = await apiClient.get(`/reports/resumen-pasantias?${params.toString()}`);
    return response.data;
  },

  generateReport: async (type: string, period?: string, format?: string) => {
    const response = await apiClient.post('/reports/generate', {
      type,
      period,
      format
    });
    return response.data;
  },

  getCulminatedStudents: async (params?: {
    periodId?: number;
    careerId?: number;
    status?: string;
    institutionId?: number;
  }): Promise<CulminatedStudentsResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.periodId) queryParams.append('periodId', params.periodId.toString());
    if (params?.careerId) queryParams.append('careerId', params.careerId.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.institutionId) queryParams.append('institutionId', params.institutionId.toString());
    
    const response = await apiClient.get(`/reports/culminated-students?${queryParams.toString()}`);
    return response.data;
  },

  getDocumentData: async (documentType: string, id: number) => {
    const response = await apiClient.get(`/documents/${documentType}/${id}`);
    return response.data;
  },

  getRelacionEmpresas: async (periodId?: number, careerId?: number) => {
    const params = new URLSearchParams();
    if (periodId) params.append('periodId', periodId.toString());
    if (careerId) params.append('careerId', careerId.toString());
    const response = await apiClient.get(`/reports/relacion-empresas-demandan?${params.toString()}`);
    return response.data;
  },

  getDistribucionTutores: async (periodId?: number, careerId?: number) => {
    const params = new URLSearchParams();
    if (periodId) params.append('periodId', periodId.toString());
    if (careerId) params.append('careerId', careerId.toString());
    const response = await apiClient.get(`/reports/distribucion-tutores?${params.toString()}`);
    return response.data;
  },

  getDistribucionTutoresV2: async (periodId?: number, careerId?: number) => {
    const params = new URLSearchParams();
    if (periodId) params.append('periodId', periodId.toString());
    if (careerId) params.append('careerId', careerId.toString());
    const response = await apiClient.get(`/reports/distribucion-tutores-v2?${params.toString()}`);
    return response.data;
  },

  getRelacionIndividualDocente: async (tutorId: number) => {
    const response = await apiClient.get(`/reports/relacion-individual-docente/${tutorId}`);
    return response.data;
  },

  exportReportExcel: async (type: string, periodId?: number, careerId?: number) => {
    const params = new URLSearchParams();
    if (periodId) params.append('periodId', periodId.toString());
    if (careerId) params.append('careerId', careerId.toString());
    const response = await apiClient.get(`/reports/export/${type}?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};

export default reportsService;
