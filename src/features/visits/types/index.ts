export interface Visit {
  visitId: number;
  practiceId: number;
  tutorId: number;
  tutorName: string;
  tutorCi: string;
  studentName: string;
  studentCi: string;
  institutionName: string;
  visitDate: string;
  visitType: 'PRESENCIAL' | 'VIRTUAL' | 'TELEFONICA';
  hoursWorked: number;
  activitiesPerformed: string;
  observations: string;
  recommendations: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVisitPayload {
  practiceId: number;
  tutorId: number;
  visitDate: string;
  visitType: 'PRESENCIAL' | 'VIRTUAL' | 'TELEFONICA';
  hoursWorked: number;
  activitiesPerformed: string;
  observations: string;
  recommendations: string;
}

export interface UpdateVisitPayload {
  visitDate?: string;
  visitType?: 'PRESENCIAL' | 'VIRTUAL' | 'TELEFONICA';
  hoursWorked?: number;
  activitiesPerformed?: string;
  observations?: string;
  recommendations?: string;
}

export interface VisitStats {
  totalVisits: number;
  totalHours: number;
  visitsByType: Record<string, number>;
  visitsByMonth: Array<{ month: string; count: number }>;
}

export interface VisitsResponse {
  success: boolean;
  data: Visit[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface VisitResponse {
  success: boolean;
  data: Visit;
  message?: string;
}

export interface VisitStatsResponse {
  success: boolean;
  data: VisitStats;
}

export const VISIT_TYPES = [
  { value: 'PRESENCIAL', label: 'Presencial' },
  { value: 'VIRTUAL', label: 'Virtual' },
  { value: 'TELEFONICA', label: 'Telefónica' }
] as const;
