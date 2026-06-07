import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';
import { PERIOD_STATUS } from '../constants/practice-status.constants.js';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();

    // 1. Basic Stats (Students and Institutions)
    const [
      { count: totalStudents },
      { count: activeStudents },
      { count: totalInstitutions },
      { count: activeInstitutions },
      { count: activeCareers },
      { data: currentPeriodData }
    ] = await Promise.all([
      supabase.from('t_students').select('*', { count: 'exact', head: true }),
      supabase.from('t_students').select('*', { count: 'exact', head: true }).eq('STATUS', 1),
      supabase.from('t_institution').select('*', { count: 'exact', head: true }),
      supabase.from('t_institution').select('*', { count: 'exact', head: true }).eq('STATUS', 1),
      supabase.from('t_career').select('*', { count: 'exact', head: true }).eq('STATUS', 1),
      supabase.from('t_internships_period').select('*').eq('PERIOD_STATUS', PERIOD_STATUS.EN_CURSO).eq('STATUS', 1).order('START_DATE', { ascending: false }).limit(1).single()
    ]);

    // 2. Career Distribution - obtener desde t_professional_practices
    const { data: careerStats } = await supabase
      .from('t_professional_practices')
      .select('CAREER_ID, t_career(CAREER_NAME)')
      .eq('STATUS', 1);

    // Obtener todas las carreras activas primero
    const { data: allCareers } = await supabase
      .from('t_career')
      .select('CAREER_ID, CAREER_NAME')
      .eq('STATUS', 1);

    // Inicializar todas las carreras con 0
    const careerMap = new Map<string, number>();
    (allCareers || []).forEach((c) => {
      careerMap.set(c.CAREER_NAME, 0);
    });

    // Contar estudiantes por carrera desde t_professional_practices (que tiene CAREER_ID)
    const { data: practicesByCareer } = await supabase
      .from('t_professional_practices')
      .select('CAREER_ID, t_career(CAREER_NAME)')
      .eq('STATUS', 1)
      .not('CAREER_ID', 'is', null);

    interface PracticeCareerItem {
      CAREER_ID: number;
      t_career: { CAREER_NAME: string } | { CAREER_NAME: string }[] | null;
    }

    (practicesByCareer as unknown as PracticeCareerItem[])?.forEach((p) => {
      if (p.CAREER_ID) {
        const careerInfo = Array.isArray(p.t_career) ? p.t_career[0] : p.t_career;
        const name = careerInfo?.CAREER_NAME || 'Desconocida';
        careerMap.set(name, (careerMap.get(name) || 0) + 1);
      }
    });

    const careerEntries = Array.from(careerMap.entries());
    const careerTotal = careerEntries.reduce((sum, [, count]) => sum + count, 0) || 1;

    function computePercentages(values: number[], total: number): number[] {
      const raw = values.map((v) => (v / total) * 100);
      const floors = raw.map(Math.floor);
      const remainder = 100 - floors.reduce((s, v) => s + v, 0);
      const idxSorted = raw
        .map((_, i) => i)
        .sort((a, b) => raw[b] - floors[b] - (raw[a] - floors[a]));
      for (let i = 0; i < remainder && i < idxSorted.length; i++) {
        floors[idxSorted[i]] += 1;
      }
      return floors;
    }

    const percentages = computePercentages(
      careerEntries.map(([, count]) => count),
      careerTotal,
    );

    const careerDistribution = careerEntries
      .map(([careerName, studentCount], i) => ({
        careerName,
        studentCount,
        percentage: percentages[i],
      }))
      .sort((a, b) => b.studentCount - a.studentCount);

    // 3. Registration Stats - All students with dates and names
    const { data: registrationData } = await supabase
      .from('t_students')
      .select('REGISTRATION_DATE, person_id, t_persons!inner(ci, first_name, last_name)')
      .eq('STATUS', 1)
      .not('REGISTRATION_DATE', 'is', null)
      .order('REGISTRATION_DATE', { ascending: true });

    const regMap = new Map<string, { count: number; students: { firstName: string; lastName: string; idNumber: string }[] }>();
    
    (registrationData || [])?.forEach((s: any) => {
      if (s.REGISTRATION_DATE) {
        const date = new Date(s.REGISTRATION_DATE).toISOString().split('T')[0];
        if (!regMap.has(date)) {
          regMap.set(date, { count: 0, students: [] });
        }
        const entry = regMap.get(date)!;
        entry.count += 1;
        entry.students.push({
          firstName: s.t_persons?.first_name || '',
          lastName: s.t_persons?.last_name || '',
          idNumber: s.t_persons?.ci || ''
        });
      }
    });

    // Convert to array and sort by date
    const registrationStats = Array.from(regMap.entries())
      .map(([date, { count, students }]) => ({ date, count, students }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 4. Monthly Growth - Total active students (not just this month)
    // Students with STATUS = 1 (active) instead of registration date
    const [{ count: totalActiveStudents }, { count: totalAllStudents }] = await Promise.all([
      supabase.from('t_students').select('*', { count: 'exact', head: true }).eq('STATUS', 1),
      supabase.from('t_students').select('*', { count: 'exact', head: true })
    ]);

    // For comparison, get prev month's total (mock data based on 80% of current)
    const prevMonthTotal = Math.round((totalActiveStudents || 0) * 0.8);
    const percentageChange = prevMonthTotal ? (((totalActiveStudents || 0) - prevMonthTotal) / prevMonthTotal) * 100 : 0;

    // Weekly Breakdown (Last 4 weeks based on STATUS, not REGISTRATION_DATE)
    const weeklyBreakdown = [];
    for (let i = 3; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - (i + 1) * 7);
      const end = new Date();
      end.setDate(end.getDate() - i * 7);
      
      // Use STATUS = 1 (active students created in that week)
      const { count } = await supabase
        .from('t_students')
        .select('*', { count: 'exact', head: true })
        .eq('STATUS', 1)
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

    // Evaluaciones pendientes (sin calificar) y realizadas
    const [{ count: pendingEvaluationsCount }, { count: completedEvaluationsCount }] = await Promise.all([
      supabase.from('t_evaluation').select('*', { count: 'exact', head: true }).is('EVALUATION_DATE', null),
      supabase.from('t_evaluation').select('*', { count: 'exact', head: true }).not('EVALUATION_DATE', 'is', null)
    ]);

    // Distribución por Tutor (desde prácticas asignadas)
    const { data: tutorStats } = await supabase
      .from('t_professional_practices_tutor')
      .select('TUTOR_ID, t_tutors(TUTOR_ID, person_id, t_persons!inner(first_name, last_name))')
      .eq('TUTOR_TYPE', 'ACADEMICO');

    const tutorMap = new Map<string, number>();
    (tutorStats || []).forEach((t: any) => {
      const tutorInfo = Array.isArray(t.t_tutors) ? t.t_tutors[0] : t.t_tutors;
      const name = tutorInfo?.t_persons ? `${tutorInfo.t_persons.first_name} ${tutorInfo.t_persons.last_name}` : 'Sin asignar';
      tutorMap.set(name, (tutorMap.get(name) || 0) + 1);
    });

    const tutorDistribution = Array.from(tutorMap.entries())
      .map(([tutorName, count]) => ({ tutorName, count }))
      .sort((a, b) => b.count - a.count);

    // Distribución por Institución
    const { data: institutionStats } = await supabase
      .from('t_professional_practices')
      .select('INSTITUTION_ID, t_institution(INSTITUTION_NAME)')
      .not('INSTITUTION_ID', 'is', null)
      .eq('STATUS', 1);

    const institutionMap = new Map<string, number>();
    (institutionStats || []).forEach((p) => {
      if (p.INSTITUTION_ID) {
        const instInfo = Array.isArray(p.t_institution) ? p.t_institution[0] : p.t_institution;
        const name = instInfo?.INSTITUTION_NAME || 'Sin asignar';
        institutionMap.set(name, (institutionMap.get(name) || 0) + 1);
      }
    });

    const institutionDistribution = Array.from(institutionMap.entries())
      .map(([institutionName, count]) => ({ institutionName, count }))
      .sort((a, b) => b.count - a.count);

    // Visitas próximas (próximos 7 días)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const { count: upcomingVisitsCount } = await supabase
      .from('t_visit')
      .select('*', { count: 'exact', head: true })
      .gte('VISIT_DATE', new Date().toISOString())
      .lte('VISIT_DATE', nextWeek.toISOString());

    res.json({
      totalStudents: totalStudents || 0,
      activeStudents: activeStudents || 0,
      totalInstitutions: totalInstitutions || 0,
      activeInstitutions: activeInstitutions || 0,
      activeCareers: activeCareers || 0,
      currentPeriod: currentPeriodData ? {
        description: currentPeriodData.DESCRIPTION,
        startDate: currentPeriodData.START_DATE,
        endDate: currentPeriodData.END_DATE
      } : null,
      registrationStats,
      monthlyGrowth: {
        totalLastMonth: totalActiveStudents || 0,
        totalPrevMonth: prevMonthTotal,
        percentageChange: Math.round(percentageChange * 10) / 10,
        trend: percentageChange >= 0 ? 'up' : 'down',
        weeklyBreakdown,
        dailyBreakdown: []
      },
      careerDistribution,
      // Placeholder for other stats expected by frontend
      totalEnrollments: 0,
      totalPreEnrollments: 0,
      activePeriods: 0,
      pendingRequests: pendingRequestsCount || 0,
      pendingEvaluations: pendingEvaluationsCount || 0,
      completedEvaluations: completedEvaluationsCount || 0,
      upcomingVisits: upcomingVisitsCount || 0,
      tutorDistribution,
      institutionDistribution,
      completionRate: 0,
      monthlyEnrollments: [],
      monthlyTarget: { target: 1000, current: activeStudents || 0, today: 0, percentage: 0 }
    });

  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas del dashboard', error });
  }
};
