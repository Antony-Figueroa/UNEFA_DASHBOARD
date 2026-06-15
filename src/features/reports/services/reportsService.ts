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
    page: number;
    limit: number;
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
    page: number;
    limit: number;
    totalEstudiantes: number;
  };
}

export interface PracticeSearchResult {
  practiceId: number;
  studentCi: string;
  studentName: string;
  careerName: string;
  institutionName?: string;
  status?: number;
  period?: string;
}

export interface TutorSearchResult {
  tutorId: number;
  fullName: string;
  ci: string;
  email: string;
  phone: string;
  careers: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
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

  getTutorsAcademicReport: async (periodId?: number, careerId?: number, page?: number, limit?: number, careerIds?: number[]) => {
    const params = new URLSearchParams();
    if (periodId) params.append('periodId', periodId.toString());
    if (careerId) params.append('careerId', careerId.toString());
    if (careerIds && careerIds.length > 0) params.append('careerIds', careerIds.join(','));
    if (page !== undefined) params.append('page', page.toString());
    if (limit !== undefined) params.append('limit', limit.toString());
    const response = await apiClient.get(`/reports/tutores-academicos?${params.toString()}`);
    return response.data as TutorAcademicReportResponse;
  },

  getResumenPasantiasReport: async (periodId?: number, careerId?: number, page?: number, limit?: number, careerIds?: number[]) => {
    const params = new URLSearchParams();
    if (periodId) params.append('periodId', periodId.toString());
    if (careerId) params.append('careerId', careerId.toString());
    if (careerIds && careerIds.length > 0) params.append('careerIds', careerIds.join(','));
    if (page !== undefined) params.append('page', page.toString());
    if (limit !== undefined) params.append('limit', limit.toString());
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
    careerIds?: number[];
    status?: string;
    institutionId?: number;
    page?: number;
    limit?: number;
  }): Promise<CulminatedStudentsResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.periodId) queryParams.append('periodId', params.periodId.toString());
    if (params?.careerIds && params.careerIds.length > 0) queryParams.append('careerIds', params.careerIds.join(','));
    if (params?.status) queryParams.append('status', params.status);
    if (params?.institutionId) queryParams.append('institutionId', params.institutionId.toString());
    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    
    const response = await apiClient.get(`/reports/culminated-students?${queryParams.toString()}`);
    return response.data;
  },

  getDocumentData: async (documentType: string, id: number) => {
    const response = await apiClient.get(`/institutional-documents/${documentType}/${id}`);
    return response.data;
  },

  searchPractices: async (q: string): Promise<{ success: boolean; data: PracticeSearchResult[] }> => {
    const response = await apiClient.get(`/institutional-documents/search-practices?q=${encodeURIComponent(q)}`);
    return response.data;
  },

  searchTutors: async (q: string): Promise<{ success: boolean; data: TutorSearchResult[] }> => {
    const response = await apiClient.get(`/institutional-documents/search-tutors?q=${encodeURIComponent(q)}`);
    return response.data;
  },

  listPractices: async (page = 0, limit = 10, q = '', documentType?: string): Promise<PaginatedResponse<PracticeSearchResult>> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (q) params.append('q', q);
    if (documentType) params.append('documentType', documentType);
    const response = await apiClient.get(`/institutional-documents/list-practices?${params.toString()}`);
    return response.data;
  },

  listTutors: async (page = 0, limit = 10, q = ''): Promise<PaginatedResponse<TutorSearchResult>> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (q) params.append('q', q);
    const response = await apiClient.get(`/institutional-documents/list-tutors?${params.toString()}`);
    return response.data;
  },

  getRelacionEmpresas: async (periodId?: number, careerId?: number, page?: number, limit?: number, careerIds?: number[]) => {
    const params = new URLSearchParams();
    if (periodId) params.append('periodId', periodId.toString());
    if (careerId) params.append('careerId', careerId.toString());
    if (careerIds && careerIds.length > 0) params.append('careerIds', careerIds.join(','));
    if (page !== undefined) params.append('page', page.toString());
    if (limit !== undefined) params.append('limit', limit.toString());
    const response = await apiClient.get(`/reports/relacion-empresas-demandan?${params.toString()}`);
    return response.data;
  },

  getDistribucionTutores: async (periodId?: number, careerId?: number, page?: number, limit?: number, careerIds?: number[]) => {
    const params = new URLSearchParams();
    if (periodId) params.append('periodId', periodId.toString());
    if (careerId) params.append('careerId', careerId.toString());
    if (careerIds && careerIds.length > 0) params.append('careerIds', careerIds.join(','));
    if (page !== undefined) params.append('page', page.toString());
    if (limit !== undefined) params.append('limit', limit.toString());
    const response = await apiClient.get(`/reports/distribucion-tutores?${params.toString()}`);
    return response.data;
  },

  getDistribucionTutoresV2: async (periodId?: number, careerId?: number, page?: number, limit?: number, careerIds?: number[]) => {
    const params = new URLSearchParams();
    if (periodId) params.append('periodId', periodId.toString());
    if (careerId) params.append('careerId', careerId.toString());
    if (careerIds && careerIds.length > 0) params.append('careerIds', careerIds.join(','));
    if (page !== undefined) params.append('page', page.toString());
    if (limit !== undefined) params.append('limit', limit.toString());
    const response = await apiClient.get(`/reports/distribucion-tutores-v2?${params.toString()}`);
    return response.data;
  },

  getRelacionIndividualDocente: async (tutorId: number) => {
    const response = await apiClient.get(`/reports/relacion-individual-docente/${tutorId}`);
    return response.data;
  },

  getProyeccionByPeriod: async (periodId: number) => {
    const response = await apiClient.get(`/api/proyeccion?periodId=${periodId}`);
    return response.data;
  },

  getProyeccionStructure: async (periodId: number) => {
    const response = await apiClient.get(`/api/proyeccion/structure?periodId=${periodId}`);
    return response.data;
  },

  saveProyeccionBatch: async (periodId: number, items: { nucleusId: number; careerId: number; estudiantesProyectados: number }[]) => {
    const response = await apiClient.put('/api/proyeccion/batch', { periodId, items });
    return response.data;
  },

  exportReportExcel: async (type: string, periodId?: number, careerId?: number, careerIds?: number[]) => {
    const params = new URLSearchParams();
    if (periodId) params.append('periodId', periodId.toString());
    if (careerId) params.append('careerId', careerId.toString());
    if (careerIds && careerIds.length > 0) params.append('careerIds', careerIds.join(','));
    const response = await apiClient.get(`/reports/export/${type}?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};

export default reportsService;
