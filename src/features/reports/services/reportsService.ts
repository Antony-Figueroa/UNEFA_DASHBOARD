import apiClient from '../../../api/apiClient';

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

  generateReport: async (type: string, period?: string, format?: string) => {
    const response = await apiClient.post('/reports/generate', {
      type,
      period,
      format
    });
    return response.data;
  }
};

export default reportsService;
