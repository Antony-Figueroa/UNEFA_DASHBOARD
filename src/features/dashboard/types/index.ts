/**
 * @file index.ts
 * @description Type definitions for the dashboard module.
 */

/**
 * Main interface for dashboard statistics data.
 */
export interface DashboardStats {
  /** Total number of students in the system */
  totalStudents: number;
  /** Number of students with 'active' status */
  activeStudents: number;
  /** Total number of institutions registered */
  totalInstitutions: number;
  /** Number of institutions with 'active' status */
  activeInstitutions: number;
  /** Information about the currently active period, if any */
  currentPeriod: {
    /** Period description or name */
    description: string;
    /** Period start date (ISO string) */
    startDate: string;
    /** Period end date (ISO string) */
    endDate: string;
  } | null;
  /** Total number of enrollments */
  totalEnrollments: number;
  /** Total number of pre-enrollments */
  totalPreEnrollments: number;
  /** Number of currently active periods */
  activePeriods: number;
  /** Number of pending requests awaiting action */
  pendingRequests: number;
  /** Number of pending evaluations */
  pendingEvaluations: number;
  /** Number of completed evaluations */
  completedEvaluations: number;
  /** Distribution of students by tutor */
  tutorDistribution: { tutorName: string; count: number }[];
  /** Distribution of students by institution */
  institutionDistribution: { institutionName: string; count: number }[];
  /** Overall completion rate percentage (0-100) */
  completionRate: number;
  
  /** Data for interactive registration timeline charts */
  registrationStats: {
    /** The date of the data point (ISO string) */
    date: string;
    /** Number of registrations on that date */
    count: number;
    /** Students registered on that date */
    students?: {
      firstName: string;
      lastName: string;
      idNumber: string;
    }[];
  }[];

  /** Metrics comparing current month performance with previous ones */
  monthlyGrowth: {
    /** Total count for the last completed month */
    totalLastMonth: number;
    /** Total count for the month before last */
    totalPrevMonth: number;
    /** Percentage change between months */
    percentageChange: number;
    /** Visual trend indicator */
    trend: 'up' | 'down' | 'neutral';
    /** Weekly breakdown for the current month */
    weeklyBreakdown: {
      /** Week label (e.g., 'Semana 1') */
      label: string;
      /** Count for the week */
      count: number;
    }[];
    /** Daily breakdown for the current month */
    dailyBreakdown: {
      /** Day label (e.g., 'Lunes') */
      label: string;
      /** Count for the day */
      count: number;
    }[];
  };

  /** Distribution of students across different academic careers */
  careerDistribution: {
    /** Name of the career */
    careerName: string;
    /** Number of students enrolled in this career */
    studentCount: number;
    /** Percentage of total students */
    percentage: number;
  }[];

  /** Monthly enrollment trends for bar/area charts */
  monthlyEnrollments: {
    /** Month name or label */
    month: string;
    /** Number of enrollments in that month */
    count: number;
  }[];

  /** Current enrollment performance against set targets */
  monthlyTarget: {
    /** Target enrollment count for the period */
    target: number;
    /** Current cumulative enrollment count */
    current: number;
    /** New enrollments recorded today */
    today: number;
    /** Percentage of target achieved */
    percentage: number;
  };
}
