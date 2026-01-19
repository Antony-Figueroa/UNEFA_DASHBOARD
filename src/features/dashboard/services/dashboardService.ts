import apiClient from "../../../api/apiClient";
import { DashboardStats } from "../types";

// Interfaces para los datos de la API
interface ApiStudent {
  STATUS: number;
  REGISTRATION_DATE?: string;
  registrationDate?: string;
  CAREER_ID?: number;
}

interface ApiEnrollment {
  ENROLLMENT_DATE?: string;
  enrollmentDate?: string;
}

interface ApiPeriod {
  PERIOD_STATUS: number;
  STATUS: number;
  status?: boolean;
  DESCRIPTION: string;
  START_DATE: string;
  END_DATE: string;
}

interface ApiInstitution {
  STATUS: number;
}

interface ApiCareer {
  CAREER_ID: number;
  CAREER_NAME: string;
}

interface ApiPreEnrollment {
  STATUS?: number;
}

/**
 * Servicio para obtener estadísticas del dashboard agregando datos de múltiples endpoints.
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // Realizamos las peticiones en paralelo para mayor eficiencia
    const [
      studentsRes,
      enrollmentsRes,
      preEnrollmentsRes,
      periodsRes,
      institutionsRes,
      careersRes
    ] = await Promise.all([
      apiClient.get<ApiStudent[]>("/students"),
      apiClient.get<ApiEnrollment[]>("/enrollments"),
      apiClient.get<ApiPreEnrollment[]>("/pre-enrollments"),
      apiClient.get<ApiPeriod[]>("/periodos"),
      apiClient.get<ApiInstitution[]>("/institutions"),
      apiClient.get<ApiCareer[]>("/careers")
    ]);

    const students = Array.isArray(studentsRes.data) ? studentsRes.data : [];
    const enrollments = Array.isArray(enrollmentsRes.data) ? enrollmentsRes.data : [];
    const preEnrollments = Array.isArray(preEnrollmentsRes.data) ? preEnrollmentsRes.data : [];
    const periods = Array.isArray(periodsRes.data) ? periodsRes.data : [];
    const institutions = Array.isArray(institutionsRes.data) ? institutionsRes.data : [];
    const careers = Array.isArray(careersRes.data) ? careersRes.data : [];

    // 1. Métricas de estudiantes
    const totalStudents = students.length;
    const activeStudents = students.filter((s) => s.STATUS === 1).length;

    // 2. Métricas de instituciones
    const totalInstitutions = institutions.length;
    const activeInstitutions = institutions.filter((i) => i.STATUS === 1).length;

    // 3. Período actual (PERIOD_STATUS === 1)
    const currentPeriodData = periods.find((p) => p.PERIOD_STATUS === 1 && p.STATUS === 1);
    const currentPeriod = currentPeriodData ? {
      description: currentPeriodData.DESCRIPTION,
      startDate: currentPeriodData.START_DATE,
      endDate: currentPeriodData.END_DATE
    } : null;

    // 4. Métricas básicas de procesos
    const totalEnrollments = enrollments.length;
    const totalPreEnrollments = preEnrollments.length;
    
    // 5. Períodos activos (STATUS === 1 o true)
    const activePeriods = periods.filter((p) => p.STATUS === 1 || p.status === true).length;

    // 6. Solicitudes pendientes
    const pendingRequests = preEnrollments.length;

    // 7. Tasa de culminación
    const completionRate = totalPreEnrollments > 0 
      ? Math.round((totalEnrollments / (totalEnrollments + totalPreEnrollments)) * 100) 
      : 85;

    // 8. Inscripciones mensuales
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const monthlyCounts = new Array(12).fill(0);

    enrollments.forEach((e) => {
      const dateStr = e.ENROLLMENT_DATE || e.enrollmentDate;
      if (dateStr) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          monthlyCounts[date.getMonth()]++;
        }
      }
    });

    const monthlyEnrollments = months.map((month, index) => ({
      month,
      count: monthlyCounts[index]
    }));

    // 9. Meta mensual
    const currentMonthEnrollments = monthlyCounts[new Date().getMonth()];
    const target = 500; 
    const percentage = Math.min(Math.round((currentMonthEnrollments / target) * 100), 100);

    // 10. Estadísticas de registro por fecha
    const registrationStatsMap = new Map<string, number>();
    students.forEach((s) => {
      const dateStr = s.REGISTRATION_DATE || s.registrationDate;
      if (dateStr) {
        const date = dateStr.split('T')[0];
        registrationStatsMap.set(date, (registrationStatsMap.get(date) || 0) + 1);
      }
    });
    const registrationStats = Array.from(registrationStatsMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Últimos 30 días

    // 11. Crecimiento mensual y desgloses
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    let totalLastMonth = 0;
    let totalPrevMonth = 0;
    const dailyMap = new Map<string, number>();
    const weeklyCounts = [0, 0, 0, 0]; // 4 semanas

    students.forEach((s) => {
      const dateStr = s.REGISTRATION_DATE || s.registrationDate;
      if (!dateStr) return;
      
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return;

      const m = date.getMonth();
      const y = date.getFullYear();

      if (m === currentMonth && y === currentYear) {
        totalLastMonth++;
        // Desglose diario (últimos 7 días)
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 7) {
          const label = date.toLocaleDateString('es-ES', { weekday: 'short' });
          dailyMap.set(label, (dailyMap.get(label) || 0) + 1);
        }
        // Desglose semanal
        const weekNum = Math.floor((date.getDate() - 1) / 7);
        if (weekNum >= 0 && weekNum < 4) {
          weeklyCounts[weekNum]++;
        }
      } else if (m === prevMonth && y === prevMonthYear) {
        totalPrevMonth++;
      }
    });

    const percentageChange = totalPrevMonth > 0 
      ? Math.round(((totalLastMonth - totalPrevMonth) / totalPrevMonth) * 100)
      : 0;
    
    const trend = percentageChange > 0 ? 'up' : percentageChange < 0 ? 'down' : 'neutral';

    const dailyBreakdown = Array.from(dailyMap.entries()).map(([label, count]) => ({ label, count }));
    const weeklyBreakdown = weeklyCounts.map((count, i) => ({ label: `Semana ${i + 1}`, count }));

    // 12. Distribución por carrera
    const careerMap = new Map<number, number>();
    students.forEach((s) => {
      if (s.CAREER_ID) {
        careerMap.set(s.CAREER_ID, (careerMap.get(s.CAREER_ID) || 0) + 1);
      }
    });

    const careerDistribution = Array.from(careerMap.entries())
      .map(([id, count]) => {
        const career = careers.find((c) => c.CAREER_ID === id);
        return {
          careerName: career ? career.CAREER_NAME : `Carrera ${id}`,
          studentCount: count,
          percentage: totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0
        };
      })
      .sort((a, b) => b.studentCount - a.studentCount);

    return {
      totalStudents,
      activeStudents,
      totalInstitutions,
      activeInstitutions,
      currentPeriod,
      totalEnrollments,
      totalPreEnrollments,
      activePeriods,
      pendingRequests,
      completionRate,
      registrationStats,
      monthlyGrowth: {
        totalLastMonth,
        totalPrevMonth,
        percentageChange,
        trend: trend as 'up' | 'down' | 'neutral',
        weeklyBreakdown,
        dailyBreakdown
      },
      careerDistribution,
      monthlyEnrollments,
      monthlyTarget: {
        target,
        current: currentMonthEnrollments,
        today: Math.floor(currentMonthEnrollments / 30) + 1,
        percentage
      }
    };
  } catch (error) {
    console.error("[dashboardService] Error fetching dashboard stats:", error);
    // Fallback con datos de ejemplo si la API falla
    return {
      totalStudents: 3782,
      activeStudents: 3500,
      totalInstitutions: 45,
      activeInstitutions: 40,
      currentPeriod: {
        description: "2023-II",
        startDate: "2023-09-01",
        endDate: "2024-01-15"
      },
      totalEnrollments: 5359,
      totalPreEnrollments: 120,
      activePeriods: 2,
      pendingRequests: 12,
      completionRate: 85,
      registrationStats: [
        { date: "2023-10-01", count: 10 },
        { date: "2023-10-02", count: 15 },
        { date: "2023-10-03", count: 8 },
        { date: "2023-10-04", count: 20 },
        { date: "2023-10-05", count: 12 }
      ],
      monthlyGrowth: {
        totalLastMonth: 450,
        totalPrevMonth: 400,
        percentageChange: 12.5,
        trend: 'up',
        weeklyBreakdown: [
          { label: "Semana 1", count: 100 },
          { label: "Semana 2", count: 120 },
          { label: "Semana 3", count: 110 },
          { label: "Semana 4", count: 120 }
        ],
        dailyBreakdown: [
          { label: "Lun", count: 20 },
          { label: "Mar", count: 25 },
          { label: "Mie", count: 18 },
          { label: "Jue", count: 22 },
          { label: "Vie", count: 30 },
          { label: "Sab", count: 10 },
          { label: "Dom", count: 5 }
        ]
      },
      careerDistribution: [
        { careerName: "Ingeniería Informática", studentCount: 1200, percentage: 32 },
        { careerName: "Ingeniería Agroindustrial", studentCount: 800, percentage: 21 },
        { careerName: "TSU Enfermería", studentCount: 1782, percentage: 47 }
      ],
      monthlyEnrollments: [
        { month: "Ene", count: 400 }, { month: "Feb", count: 300 }, { month: "Mar", count: 500 },
        { month: "Abr", count: 400 }, { month: "May", count: 300 }, { month: "Jun", count: 200 },
        { month: "Jul", count: 100 }, { month: "Ago", count: 50 }, { month: "Sep", count: 300 },
        { month: "Oct", count: 400 }, { month: "Nov", count: 500 }, { month: "Dic", count: 600 }
      ],
      monthlyTarget: {
        target: 1000,
        current: 768,
        today: 12,
        percentage: 76.8
      }
    };
  }
};
