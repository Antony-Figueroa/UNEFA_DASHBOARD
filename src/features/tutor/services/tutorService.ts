import apiClient from "../../../api/apiClient";

export interface TutorStudent {
  enrollmentId: string;
  tutorType: string;
  studentId: string;
  studentCi: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  careerName: string;
  institutionName: string;
  period: string;
  practiceType: string;
  enrollmentDate: string;
  startDate: string;
  endDate: string;
  status: 'pre-enrolled' | 'active' | 'completed' | 'suspended' | 'unknown';
  grade: number;
  totalHours: number;
}

export interface TutorDashboardStats {
  totalStudents: number;
  activeInternships: number;
  pendingGrades: number;
  completedInternships: number;
  pendingApprovals?: number;
  pendingApprovalLogs?: Array<{
    id: number;
    date: string;
    description: string;
    week: number;
    hours: number;
    studentName: string;
  }>;
  upcomingDeadlines?: Array<{
    practiceId: number;
    endDate: string;
    reportTitle: string;
    studentName: string;
  }>;
  studentAlerts?: Array<{
    practiceId: number;
    studentName: string;
    daysInactive: number;
  }>;
  unreadNotifications?: number;
}

export interface TutorProfile {
  tutorId: number;
  ci: string;
  name: string;
  secondName: string;
  surname: string;
  secondSurname: string;
  fullName: string;
  phone: string;
  gender: string;
  email: string;
  profession: string;
  titulo: string;
  condition: string;
  dedication: string;
  category: string;
  status: number;
}

const API_URL = "/tutor";

export interface TutorReportData {
  summary: {
    totalStudents: number;
    averageGrade: string;
    periodDistribution: Record<string, number>;
    statusDistribution: Record<string, number>;
  };
  tutorInfo: {
    name: string;
  };
  students: Array<{
    studentName: string;
    studentCi: string;
    careerName: string;
    institutionName: string;
    period: string;
    status: string;
    grade: number;
  }>;
}

export interface ActivityLogsResponse {
  data: any[];
  total?: number;
}

export const tutorService = {
  getDashboard: async (): Promise<TutorDashboardStats> => {
    const response = await apiClient.get(`${API_URL}/dashboard`);
    return response.data.data;
  },

  getStudents: async (params?: { status?: string; search?: string }): Promise<TutorStudent[]> => {
    const response = await apiClient.get(`${API_URL}/students`, { params });
    return response.data.data;
  },

  updateGrade: async (enrollmentId: string, grade: number, observations?: string): Promise<void> => {
    await apiClient.put(`${API_URL}/grades/${enrollmentId}`, { grade, observations });
  },

  getProfile: async (): Promise<TutorProfile> => {
    const response = await apiClient.get(`${API_URL}/profile`);
    return response.data.data;
  },

  // ── Visitas ───────────────────────────────────
  getVisitsByPractice: async (practiceId: number, includeInactive?: boolean): Promise<any> => {
    const params = includeInactive ? '?includeInactive=true' : '';
    const response = await apiClient.get(`${API_URL}/visits/practice/${practiceId}${params}`);
    return response.data;
  },

  createVisit: async (payload: any): Promise<any> => {
    const response = await apiClient.post(`${API_URL}/visits`, payload);
    return response.data;
  },

  // ── Activity Logs ─────────────────────────────
  getActivityLogsByPractice: async (practiceId: number): Promise<any> => {
    const response = await apiClient.get(`${API_URL}/activity-logs/practice/${practiceId}`);
    return response.data;
  },

  getActivityLogs: async (params?: { limit?: number }): Promise<ActivityLogsResponse> => {
    const response = await apiClient.get(`${API_URL}/activity-logs`, { params });
    return response.data;
  },

  createActivityLog: async (payload: any): Promise<any> => {
    const response = await apiClient.post(`${API_URL}/activity-logs`, payload);
    return response.data;
  },

  // ── Reports ───────────────────────────────────
  getReports: async (): Promise<TutorReportData> => {
    const response = await apiClient.get(`${API_URL}/reports`);
    return response.data;
  }
};

export default tutorService;
