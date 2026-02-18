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
