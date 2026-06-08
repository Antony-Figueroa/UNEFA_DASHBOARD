import { lazy, LazyExoticComponent, ComponentType } from 'react';

// ─── Tipos ─────────────────────────────────────────────────────────────────

export type WidgetSize = 'sm' | 'md' | 'lg' | 'xl';

export interface WidgetDefinition {
  key: string;
  displayName: string;
  description: string;
  icon: string;
  size: WidgetSize;
  /** Módulo funcional al que pertenece (para agrupar en el configurador) */
  module: string;
  /** Roles que pueden usar este widget (1=Admin, 2=Asistente, 3=Tutor, 4=Estudiante) */
  allowedRoles: number[];
  /** Componente React lazy-loadable */
  component: LazyExoticComponent<ComponentType<any>>;
  /** Extrae las props del data source genérico y las pasa al componente */
  getProps: (data: any) => Record<string, any>;
}

// ─── Grid classes según tamaño ──────────────────────────────────────────────

export const WIDGET_SIZE_CLASSES: Record<WidgetSize, string> = {
  sm: 'lg:col-span-4',  // 1/3 del ancho
  md: 'lg:col-span-6',  // 1/2 del ancho
  lg: 'lg:col-span-8',  // 2/3 del ancho
  xl: 'lg:col-span-12', // ancho completo
};

// ─── Catálogo de Widgets ────────────────────────────────────────────────────

export const WIDGET_REGISTRY: Record<string, WidgetDefinition> = {
  // ═════════════════════════════════════════════════════════════════════════
  // ADMIN WIDGETS (role=1)
  // ═════════════════════════════════════════════════════════════════════════

  'quick-stats': {
    key: 'quick-stats',
    displayName: 'Resumen Rápido',
    description: 'Tarjetas con métricas clave: período activo, estudiantes activos, instituciones activas',
    icon: 'bar-chart-3',
    size: 'xl',
    module: 'general',
    allowedRoles: [1, 2],
    component: lazy(() => import('../components/QuickStatsWidget')),
    getProps: (data: any) => ({ stats: data?.stats ?? data, loading: data?.loading ?? false }),
  },

  'registration-stats': {
    key: 'registration-stats',
    displayName: 'Registro de Estudiantes',
    description: 'Gráfico de área con registros de estudiantes por fecha',
    icon: 'activity',
    size: 'lg',
    module: 'students',
    allowedRoles: [1, 2],
    component: lazy(() => import('../components/RegistrationStatsChart')),
    getProps: (data: any) => ({
      data: data?.stats?.registrationStats ?? data?.registrationStats ?? [],
      loading: data?.loading ?? false,
      availablePeriods: data?.stats?.availablePeriods ?? data?.availablePeriods ?? [],
      selectedPeriodId: data?.selectedPeriodId ?? null,
      onPeriodChange: data?.handlePeriodChange ?? (() => {}),
    }),
  },

  'growth-metrics': {
    key: 'growth-metrics',
    displayName: 'Crecimiento Mensual',
    description: 'Métricas de crecimiento mes a mes con barras semanales',
    icon: 'trending-up',
    size: 'sm',
    module: 'students',
    allowedRoles: [1, 2],
    component: lazy(() => import('../components/GrowthMetrics')),
    getProps: (data: any) => ({
      growth: data?.stats?.monthlyGrowth ?? data?.monthlyGrowth ?? {
        totalLastMonth: 0, totalPrevMonth: 0, percentageChange: 0,
        trend: 'neutral', weeklyBreakdown: [], dailyBreakdown: [],
      },
      loading: data?.loading ?? false,
    }),
  },

  'career-distribution': {
    key: 'career-distribution',
    displayName: 'Distribución por Carrera',
    description: 'Distribución de estudiantes por carrera universitaria',
    icon: 'pie-chart',
    size: 'xl',
    module: 'students',
    allowedRoles: [1, 2],
    component: lazy(() => import('../components/CareerDistributionChart')),
    getProps: (data: any) => ({
      data: data?.stats?.careerDistribution ?? data?.careerDistribution ?? [],
      loading: data?.loading ?? false,
    }),
  },

  'evaluations': {
    key: 'evaluations',
    displayName: 'Evaluaciones',
    description: 'Gráfico de dona con evaluaciones completadas vs pendientes',
    icon: 'check-circle',
    size: 'sm',
    module: 'evaluations',
    allowedRoles: [1, 2],
    component: lazy(() => import('../components/EvaluationStatsChart')),
    getProps: (data: any) => ({
      pending: data?.stats?.pendingEvaluations ?? data?.pendingEvaluations ?? 0,
      completed: data?.stats?.completedEvaluations ?? data?.completedEvaluations ?? 0,
      loading: data?.loading ?? false,
    }),
  },

  'tutor-distribution': {
    key: 'tutor-distribution',
    displayName: 'Distribución por Tutor',
    description: 'Barras horizontales con cantidad de estudiantes por tutor',
    icon: 'users',
    size: 'sm',
    module: 'tutors',
    allowedRoles: [1, 2],
    component: lazy(() => import('../components/TutorDistributionChart')),
    getProps: (data: any) => ({
      data: data?.stats?.tutorDistribution ?? data?.tutorDistribution ?? [],
      loading: data?.loading ?? false,
    }),
  },

  'institution-distribution': {
    key: 'institution-distribution',
    displayName: 'Distribución por Institución',
    description: 'Gráfico de dona con distribución de estudiantes por institución',
    icon: 'building',
    size: 'sm',
    module: 'institutions',
    allowedRoles: [1, 2],
    component: lazy(() => import('../components/InstitutionDistributionChart')),
    getProps: (data: any) => ({
      data: data?.stats?.institutionDistribution ?? data?.institutionDistribution ?? [],
      loading: data?.loading ?? false,
    }),
  },

  'monthly-enrollments': {
    key: 'monthly-enrollments',
    displayName: 'Matrículas por Período',
    description: 'Gráfico de barras con inscripciones mensuales',
    icon: 'calendar',
    size: 'lg',
    module: 'enrollments',
    allowedRoles: [1, 2],
    component: lazy(() => import('../../../components/ecommerce/MonthlySalesChart')),
    getProps: (data: any) => ({
      stats: data?.stats ?? data,
    }),
  },

  'pending-requests': {
    key: 'pending-requests',
    displayName: 'Solicitudes Pendientes',
    description: 'Resumen de solicitudes de estudiantes pendientes por revisar',
    icon: 'inbox',
    size: 'sm',
    module: 'requests',
    allowedRoles: [1, 2],
    component: lazy(() => import('../components/PendingRequestsWidget')),
    getProps: (data: any) => ({
      count: data?.stats?.pendingRequests ?? data?.pendingRequests ?? 0,
      loading: data?.loading ?? false,
    }),
  },

  // ═════════════════════════════════════════════════════════════════════════
  // TUTOR WIDGETS (role=3)
  // ═════════════════════════════════════════════════════════════════════════

  'tutor-quick-stats': {
    key: 'tutor-quick-stats',
    displayName: 'Resumen del Tutor',
    description: 'Tarjetas con estadísticas: estudiantes, pasantías activas, notas pendientes',
    icon: 'bar-chart-3',
    size: 'xl',
    module: 'general',
    allowedRoles: [3],
    component: lazy(() => import('../components/TutorQuickStatsWidget')),
    getProps: (data: any) => ({ stats: data, loading: data?.loading ?? false }),
  },

  'tutor-students-chart': {
    key: 'tutor-students-chart',
    displayName: 'Mis Estudiantes',
    description: 'Lista de estudiantes asignados al tutor',
    icon: 'users',
    size: 'xl',
    module: 'students',
    allowedRoles: [3],
    component: lazy(() => import('../components/TutorStudentsWidget')),
    getProps: (data: any) => ({ students: data?.students ?? [], loading: data?.loading ?? false }),
  },

  'tutor-status-distribution': {
    key: 'tutor-status-distribution',
    displayName: 'Estado de Pasantías',
    description: 'Distribución de estados de las prácticas de los estudiantes',
    icon: 'pie-chart',
    size: 'md',
    module: 'tracking',
    allowedRoles: [3],
    component: lazy(() => import('../components/TutorStatusWidget')),
    getProps: (data: any) => ({ data: data?.statusDistribution ?? {}, loading: data?.loading ?? false }),
  },

  'tutor-grade-averages': {
    key: 'tutor-grade-averages',
    displayName: 'Promedio de Notas',
    description: 'Gráfico con el promedio de notas de los estudiantes',
    icon: 'trending-up',
    size: 'md',
    module: 'evaluations',
    allowedRoles: [3],
    component: lazy(() => import('../components/TutorGradeAverageWidget')),
    getProps: (data: any) => ({ stats: data, loading: data?.loading ?? false }),
  },

  // ═════════════════════════════════════════════════════════════════════════
  // STUDENT WIDGETS (role=4)
  // ═════════════════════════════════════════════════════════════════════════

  'student-progress': {
    key: 'student-progress',
    displayName: 'Mi Progreso',
    description: 'Barra de progreso de horas de pasantía completadas',
    icon: 'clock',
    size: 'md',
    module: 'tracking',
    allowedRoles: [4],
    component: lazy(() => import('../components/StudentProgressWidget')),
    getProps: (data: any) => ({
      progress: data?.stats?.hoursProgress ?? data?.hoursProgress ?? { completed: 0, required: 0, percentage: 0 },
      loading: data?.loading ?? false,
    }),
  },

  'student-internship-info': {
    key: 'student-internship-info',
    displayName: 'Datos de Pasantía',
    description: 'Información detallada de la pasantía activa',
    icon: 'briefcase',
    size: 'md',
    module: 'general',
    allowedRoles: [4],
    component: lazy(() => import('../components/StudentInternshipWidget')),
    getProps: (data: any) => ({
      internship: data?.internship ?? null,
      loading: data?.loading ?? false,
    }),
  },

  'student-activity-log': {
    key: 'student-activity-log',
    displayName: 'Actividades Recientes',
    description: 'Últimas actividades registradas en la bitácora',
    icon: 'list',
    size: 'xl',
    module: 'tracking',
    allowedRoles: [4],
    component: lazy(() => import('../components/StudentActivityLogWidget')),
    getProps: (data: any) => ({
      logs: data?.activityLogs ?? data?.recentLogs ?? { recentLogs: [], totalHours: 0, totalLogs: 0 },
      loading: data?.loading ?? false,
    }),
  },

  'student-quick-actions': {
    key: 'student-quick-actions',
    displayName: 'Acciones Rápidas',
    description: 'Accesos directos a las funciones más usadas',
    icon: 'zap',
    size: 'sm',
    module: 'general',
    allowedRoles: [4],
    component: lazy(() => import('../components/StudentQuickActionsWidget')),
    getProps: () => ({}),
  },

  'student-documents-status': {
    key: 'student-documents-status',
    displayName: 'Estado de Documentos',
    description: 'Estado de la documentación entregada',
    icon: 'file-text',
    size: 'sm',
    module: 'documents',
    allowedRoles: [4],
    component: lazy(() => import('../components/StudentDocumentsWidget')),
    getProps: (data: any) => ({
      documents: data?.documents ?? [],
      loading: data?.loading ?? false,
    }),
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

export const getWidgetsByRole = (roleId: number): WidgetDefinition[] =>
  Object.values(WIDGET_REGISTRY).filter(w => w.allowedRoles.includes(roleId));

export const getWidgetsByModule = (roleId: number): Record<string, WidgetDefinition[]> => {
  const widgets = getWidgetsByRole(roleId);
  return widgets.reduce((acc, w) => {
    if (!acc[w.module]) acc[w.module] = [];
    acc[w.module].push(w);
    return acc;
  }, {} as Record<string, WidgetDefinition[]>);
};

export const WIDGET_MODULES = [
  { key: 'general', label: 'General' },
  { key: 'students', label: 'Estudiantes' },
  { key: 'tutors', label: 'Tutores' },
  { key: 'institutions', label: 'Instituciones' },
  { key: 'enrollments', label: 'Inscripciones' },
  { key: 'tracking', label: 'Seguimiento' },
  { key: 'evaluations', label: 'Evaluaciones' },
  { key: 'requests', label: 'Solicitudes' },
  { key: 'documents', label: 'Documentos' },
];
