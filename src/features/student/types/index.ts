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

export interface CreateRequestPayload {
  typeId: number;
  subject: string;
  description: string;
}

export interface ActivityLogStats {
  totalHours: number;
  totalLogs: number;
  approvedLogs: number;
  pendingLogs: number;
  weeksCount: number;
}
