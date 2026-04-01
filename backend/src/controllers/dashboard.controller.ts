import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();

    // 1. Basic Stats (Students and Institutions)
    const [
      { count: totalStudents },
      { count: activeStudents },
      { count: totalInstitutions },
      { count: activeInstitutions },
      { data: currentPeriodData }
    ] = await Promise.all([
      supabase.from('t_students').select('*', { count: 'exact', head: true }),
      supabase.from('t_students').select('*', { count: 'exact', head: true }).eq('STATUS', 1),
      supabase.from('t_institution').select('*', { count: 'exact', head: true }),
      supabase.from('t_institution').select('*', { count: 'exact', head: true }).eq('STATUS', 1),
      supabase.from('t_internships_period').select('*').eq('PERIOD_STATUS', '2').eq('STATUS', 1).order('START_DATE', { ascending: false }).limit(1).single()
    ]);

    // 2. Career Distribution
    const { data: careerStats } = await supabase
      .from('t_students')
      .select('CAREER_ID, t_career(CAREER_NAME)')
      .eq('STATUS', 1);

    const careerMap = new Map<string, number>();
    
    interface CareerStatItem {
      CAREER_ID: number;
      t_career: { CAREER_NAME: string } | { CAREER_NAME: string }[] | null;
    }

    (careerStats as unknown as CareerStatItem[])?.forEach((s) => {
      const careerInfo = Array.isArray(s.t_career) ? s.t_career[0] : s.t_career;
      const name = careerInfo?.CAREER_NAME || 'Desconocida';
      careerMap.set(name, (careerMap.get(name) || 0) + 1);
    });

    const careerDistribution = Array.from(careerMap.entries())
      .map(([careerName, studentCount]) => ({
        careerName,
        studentCount,
        percentage: activeStudents ? Math.round((studentCount / activeStudents) * 100) : 0
      }))
      .sort((a, b) => b.studentCount - a.studentCount);

    // 3. Registration Stats (Last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: registrationData } = await supabase
      .from('t_students')
      .select('REGISTRATION_DATE')
      .gte('REGISTRATION_DATE', thirtyDaysAgo.toISOString())
      .order('REGISTRATION_DATE', { ascending: true });

    const regMap = new Map<string, number>();
    
    interface RegStatItem {
      REGISTRATION_DATE: string;
    }

    (registrationData as unknown as RegStatItem[])?.forEach((s) => {
      const date = new Date(s.REGISTRATION_DATE).toISOString().split('T')[0];
      regMap.set(date, (regMap.get(date) || 0) + 1);
    });

    const registrationStats = Array.from(regMap.entries()).map(([date, count]) => ({ date, count }));

    // 4. Monthly Growth
    const now = new Date();
    const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      { count: lastMonthCount },
      { count: prevMonthCount }
    ] = await Promise.all([
      supabase.from('t_students').select('*', { count: 'exact', head: true }).gte('REGISTRATION_DATE', firstDayCurrentMonth.toISOString()),
      supabase.from('t_students').select('*', { count: 'exact', head: true })
        .gte('REGISTRATION_DATE', firstDayPrevMonth.toISOString())
        .lt('REGISTRATION_DATE', firstDayCurrentMonth.toISOString())
    ]);

    const percentageChange = prevMonthCount ? (( (lastMonthCount || 0) - prevMonthCount) / prevMonthCount) * 100 : 0;

    // Weekly Breakdown (Last 4 weeks)
    const weeklyBreakdown = [];
    for (let i = 3; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - (i + 1) * 7);
      const end = new Date();
      end.setDate(end.getDate() - i * 7);
      
      const { count } = await supabase
        .from('t_students')
        .select('*', { count: 'exact', head: true })
        .gte('REGISTRATION_DATE', start.toISOString())
        .lt('REGISTRATION_DATE', end.toISOString());
      
      weeklyBreakdown.push({ label: `Semana ${4-i}`, count: count || 0 });
    }

    // 5. Pending Tasks
    // Solicitudes pendientes (estado 'pending' o similar)
    const { count: pendingRequestsCount } = await supabase
      .from('t_student_requests')
      .select('*', { count: 'exact', head: true })
      .in('STATUS', ['pending', 'pending_review', 'Pendiente', 'pendiente']);

    // Evaluaciones pendientes (sin calificar)
    const { count: pendingEvaluationsCount } = await supabase
      .from('t_evaluations')
      .select('*', { count: 'exact', head: true })
      .is('EVALUATION_DATE', null);

    // Visitas próximas (próximos 7 días)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const { count: upcomingVisitsCount } = await supabase
      .from('t_visits')
      .select('*', { count: 'exact', head: true })
      .gte('VISIT_DATE', new Date().toISOString())
      .lte('VISIT_DATE', nextWeek.toISOString());

    res.json({
      totalStudents: totalStudents || 0,
      activeStudents: activeStudents || 0,
      totalInstitutions: totalInstitutions || 0,
      activeInstitutions: activeInstitutions || 0,
      currentPeriod: currentPeriodData ? {
        description: currentPeriodData.DESCRIPTION,
        startDate: currentPeriodData.START_DATE,
        endDate: currentPeriodData.END_DATE
      } : null,
      registrationStats,
      monthlyGrowth: {
        totalLastMonth: lastMonthCount || 0,
        totalPrevMonth: prevMonthCount || 0,
        percentageChange: Math.round(percentageChange * 10) / 10,
        trend: percentageChange >= 0 ? 'up' : 'down',
        weeklyBreakdown,
        dailyBreakdown: [] // Can be added similarly if needed
      },
      careerDistribution,
      // Placeholder for other stats expected by frontend
      totalEnrollments: 0,
      totalPreEnrollments: 0,
      activePeriods: 0,
      pendingRequests: pendingRequestsCount || 0,
      pendingEvaluations: pendingEvaluationsCount || 0,
      upcomingVisits: upcomingVisitsCount || 0,
      completionRate: 0,
      monthlyEnrollments: [],
      monthlyTarget: { target: 1000, current: activeStudents || 0, today: 0, percentage: 0 }
    });

  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas del dashboard', error });
  }
};
