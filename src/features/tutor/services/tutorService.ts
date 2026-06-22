import apiClient from "../../../api/apiClient";

export interface TutorStudent {
  enrollmentId: string;
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

export interface TutorTracking {
  trackingId: string;
  enrollmentId: string;
  studentCi: string;
  studentName: string;
  reportTitle: string;
  transfer: boolean;
  route: string;
  observations: string;
  creationDate: string;
  tutorType: string;
}

export interface TutorReportData {
  tutorInfo: {
    name: string;
    tutorId: number;
  };
  summary: {
    totalStudents: number;
    statusDistribution: Record<string, number>;
    periodDistribution: Record<string, number>;
    averageGrade: string;
  };
  students: Array<{
    studentCi: string;
    studentName: string;
    careerName: string;
    institutionName: string;
    period: string;
    status: string;
    grade: number;
    enrollmentDate: string;
    startDate: string;
    endDate: string;
  }>;
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

export const tutorService = {
  getDashboard: async (): Promise<TutorDashboardStats> => {
    const response = await apiClient.get(`${API_URL}/dashboard`);
    return response.data.data;
  },

  getStudents: async (params?: { status?: string; search?: string }): Promise<TutorStudent[]> => {
    const response = await apiClient.get(`${API_URL}/students`, { params });
    return response.data.data;
  },

  getTracking: async (enrollmentId?: string): Promise<TutorTracking[]> => {
    const response = await apiClient.get(`${API_URL}/tracking`, { 
      params: enrollmentId ? { enrollmentId } : undefined 
    });
    return response.data.data;
  },

  updateGrade: async (enrollmentId: string, grade: number, observations?: string): Promise<void> => {
    await apiClient.put(`${API_URL}/grades/${enrollmentId}`, { grade, observations });
  },

  getReports: async (): Promise<TutorReportData> => {
    const response = await apiClient.get(`${API_URL}/reports`);
    return response.data.data;
  },

  getProfile: async (): Promise<TutorProfile> => {
    const response = await apiClient.get(`${API_URL}/profile`);
    return response.data.data;
  },

  getActivityLogs: async (params?: { limit?: number; offset?: number; type?: string; status?: string }): Promise<{ data: any[]; meta: { total: number } }> => {
    const response = await apiClient.get(`${API_URL}/activity-logs`, { params });
    return response.data;
  }
};

export default tutorService;
