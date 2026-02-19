import apiClient from "../../../api/apiClient";

export interface StudentInternship {
  enrollmentId: string;
  studentCi: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  careerName: string;
  institutionName: string;
  institutionAddress: string;
  institutionPhone: string;
  period: string;
  practiceType: string;
  enrollmentDate: string;
  startDate: string;
  endDate: string;
  status: string;
  grade: number;
  totalHours: number;
  tutorName: string;
  tutorPhone: string;
  tutorEmail: string;
}

export interface StudentProfile {
  id: number;
  ci: string;
  name: string;
  secondName: string;
  surname: string;
  secondSurname: string;
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  birthdate: string;
  address: string;
  maritalStatus: string;
  semester: string;
  section: string;
  regime: string;
  studentType: string;
  militaryRank: string;
  employment: string;
  careerName: string;
  status: number;
  registrationDate: string;
}

export interface RequestType {
  id: number;
  name: string;
  description: string;
}

export interface StudentRequest {
  id: number;
  typeId: number;
  typeName: string;
  subject: string;
  description: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  response: string | null;
  createdAt: string;
  processedAt: string | null;
}

export interface DashboardData {
  student: {
    id: number;
    ci: string;
    name: string;
    surname: string;
    email: string;
    phone: string;
  };
  internship: StudentInternship | null;
  stats: {
    hasActiveInternship: boolean;
    pendingRequests: number;
  };
}

const API_URL = "/student";

export const studentService = {
  getDashboard: async (): Promise<DashboardData> => {
    const response = await apiClient.get(`${API_URL}/dashboard`);
    return response.data.data;
  },

  getProfile: async (): Promise<StudentProfile> => {
    const response = await apiClient.get(`${API_URL}/profile`);
    return response.data.data;
  },

  getRequestTypes: async (): Promise<RequestType[]> => {
    const response = await apiClient.get(`${API_URL}/request-types`);
    return response.data.data;
  },

  getRequests: async (): Promise<StudentRequest[]> => {
    const response = await apiClient.get(`${API_URL}/requests`);
    return response.data.data;
  },

  createRequest: async (data: { typeId: number; subject: string; description: string }): Promise<{ id: number }> => {
    const response = await apiClient.post(`${API_URL}/requests`, data);
    return response.data.data;
  }
};

const ADMIN_API = "/requests";

export const adminRequestsService = {
  getAll: async (params?: { status?: string; typeId?: string }): Promise<{ data: any[]; stats: any }> => {
    const response = await apiClient.get(ADMIN_API, { params });
    return { data: response.data.data, stats: response.data.stats };
  },

  getById: async (id: string): Promise<any> => {
    const response = await apiClient.get(`${ADMIN_API}/${id}`);
    return response.data.data;
  },

  updateStatus: async (id: string, data: { status: string; response?: string }): Promise<void> => {
    await apiClient.put(`${ADMIN_API}/${id}`, data);
  },

  getTypes: async (): Promise<RequestType[]> => {
    const response = await apiClient.get(`${ADMIN_API}/types`);
    return response.data.data;
  }
};

export default studentService;
