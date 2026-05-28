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
  requiredHours: number;
  tutorName: string;
  tutorPhone: string;
  tutorEmail: string;
  professionalPracticeId: number | null;
}

export interface ActivityLogSummary {
  totalHours: number;
  totalLogs: number;
  approvedLogs: number;
  pendingLogs: number;
  recentLogs: Array<{
    id: number;
    date: string;
    hours: number;
    description: string;
    type: string;
    approved: boolean;
  }>;
}

export interface DashboardStats {
  hasActiveInternship: boolean;
  pendingRequests: number;
  hoursProgress: {
    completed: number;
    required: number;
    percentage: number;
  };
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
  activityLogs: ActivityLogSummary;
  stats: DashboardStats;
}

export interface ActivityLogStats {
  totalHours: number;
  totalLogs: number;
  approvedLogs: number;
  pendingLogs: number;
  weeksCount: number;
}
