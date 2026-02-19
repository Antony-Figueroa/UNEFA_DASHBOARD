export interface ActivityLog {
  activityLogId: number;
  professionalPracticeId: number;
  studentId: number;
  studentName?: string;
  studentCi?: string;
  activityDate: string;
  weekNumber: number | null;
  hoursWorked: number;
  activityType: 'DIARIA' | 'SEMANAL';
  activityDescription: string;
  tasksCompleted: string;
  challenges: string;
  learnings: string;
  supervisorComments: string;
  supervisorApproved: boolean;
  supervisorId: number | null;
  approvedAt: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateActivityLogPayload {
  professionalPracticeId: number;
  studentId: number;
  activityDate: string;
  weekNumber?: number;
  hoursWorked: number;
  activityType: 'DIARIA' | 'SEMANAL';
  activityDescription: string;
  tasksCompleted?: string;
  challenges?: string;
  learnings?: string;
}

export interface UpdateActivityLogPayload {
  activityDate?: string;
  weekNumber?: number;
  hoursWorked?: number;
  activityType?: 'DIARIA' | 'SEMANAL';
  activityDescription?: string;
  tasksCompleted?: string;
  challenges?: string;
  learnings?: string;
}

export interface ActivityLogStats {
  totalHours: number;
  totalLogs: number;
  approvedLogs: number;
  pendingLogs: number;
  weeksCount: number;
  hoursByWeek: Array<{
    week: number;
    hours: number;
  }>;
}

export interface ActivityLogsResponse {
  success: boolean;
  data: ActivityLog[];
}

export interface ActivityLogResponse {
  success: boolean;
  data: ActivityLog;
}

export interface ActivityLogStatsResponse {
  success: boolean;
  data: ActivityLogStats;
}

export const ACTIVITY_TYPES = [
  { value: 'DIARIA', label: 'Diaria' },
  { value: 'SEMANAL', label: 'Semanal' }
] as const;
