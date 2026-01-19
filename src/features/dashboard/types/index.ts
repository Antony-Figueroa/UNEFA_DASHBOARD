export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalInstitutions: number;
  activeInstitutions: number;
  currentPeriod: {
    description: string;
    startDate: string;
    endDate: string;
  } | null;
  totalEnrollments: number;
  totalPreEnrollments: number;
  activePeriods: number;
  pendingRequests: number;
  completionRate: number;
  
  // Estadísticas de registro (Gráficos interactivos)
  registrationStats: {
    date: string;
    count: number;
  }[];

  // Métricas de crecimiento mensual
  monthlyGrowth: {
    totalLastMonth: number;
    totalPrevMonth: number;
    percentageChange: number;
    trend: 'up' | 'down' | 'neutral';
    weeklyBreakdown: {
      label: string;
      count: number;
    }[];
    dailyBreakdown: {
      label: string;
      count: number;
    }[];
  };

  // Distribución por carrera
  careerDistribution: {
    careerName: string;
    studentCount: number;
    percentage: number;
  }[];

  // Datos para gráficos de barras/pastel
  monthlyEnrollments: {
    month: string;
    count: number;
  }[];
  monthlyTarget: {
    target: number;
    current: number;
    today: number;
    percentage: number;
  };
}
