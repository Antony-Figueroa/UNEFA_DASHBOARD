import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';
import { PRACTICES_STATUS } from '../constants/practice-status.constants.js';

interface PeriodInfo {
  PERIOD_ID: number;
  DESCRIPTION: string;
  START_DATE: string;
}

function calcTrend(current: number, previous: number): { change: number; trend: 'up' | 'down' | 'stable' } {
  if (previous === 0) {
    return { change: current > 0 ? 100 : 0, trend: current > 0 ? 'up' : 'stable' };
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  return {
    change: Math.abs(pct),
    trend: pct > 0 ? 'up' : pct < 0 ? 'down' : 'stable',
  };
}

export const getReportsStats = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const periodDesc = (req.query.period as string) || '';

    // ── Resolver períodos para filtros y comparaciones ──
    let currentPeriodId: number | null = null;
    let previousPeriodId: number | null = null;
    let currentPeriodStart: string | null = null;

    if (periodDesc) {
      const { data: periods } = await supabase
        .from('t_internships_period')
        .select('PERIOD_ID, DESCRIPTION, START_DATE')
        .eq('STATUS', 1)
        .order('START_DATE', { ascending: false });

      const list = (periods as PeriodInfo[] | null) || [];
      const matched = list.find((p) => p.DESCRIPTION === periodDesc);
      if (matched) {
        currentPeriodId = matched.PERIOD_ID;
        currentPeriodStart = matched.START_DATE;
        const idx = list.findIndex((p) => p.PERIOD_ID === currentPeriodId);
        if (idx < list.length - 1) {
          previousPeriodId = list[idx + 1].PERIOD_ID;
        }
      }
    }

    const [
      { count: activeStudents },

      { count: currentEnrollments },
      { count: prevEnrollments },

      { count: activeTrackings },

      { count: certifiedCount },
      { count: prevCertified },
    ] = await Promise.all([
      supabase.from('t_students').select('*', { count: 'exact', head: true }).eq('STATUS', 1),

      // Inscripciones (filtradas por período si corresponde)
      currentPeriodId
        ? supabase.from('t_professional_practices').select('*', { count: 'exact', head: true }).eq('STATUS', 1).eq('PERIOD_ID', currentPeriodId)
        : supabase.from('t_professional_practices').select('*', { count: 'exact', head: true }).eq('STATUS', 1),

      // Inscripciones del período anterior (para tendencia)
      previousPeriodId
        ? supabase.from('t_professional_practices').select('*', { count: 'exact', head: true }).eq('STATUS', 1).eq('PERIOD_ID', previousPeriodId)
        : Promise.resolve({ count: 0 }),

      supabase.from('t_professional_practices').select('PROFESSIONAL_PRACTICE_ID', { count: 'exact', head: true }).eq('STATUS', 1).eq('PRACTICES_STATUS', PRACTICES_STATUS.INSCRITO),

      // Certificados: filtramos en DB
      supabase.from('t_auth_log').select('*', { count: 'exact', head: true }).eq('ACTION', 'CERTIFICATE_GENERATED'),

      // Certificados emitidos antes del período actual (para tendencia)
      currentPeriodStart
        ? supabase.from('t_auth_log').select('*', { count: 'exact', head: true }).eq('ACTION', 'CERTIFICATE_GENERATED').lt('CREATED_AT', currentPeriodStart)
        : Promise.resolve({ count: 0 }),
    ]);

    const trackingCount = activeTrackings || 0;
    const enrollTrend = calcTrend(currentEnrollments || 0, prevEnrollments || 0);
    const certTrend = calcTrend(certifiedCount || 0, prevCertified || 0);

    res.json({
      metrics: [
        { label: 'Estudiantes Activos', value: activeStudents || 0 },
        { label: 'Inscripciones del Período', value: currentEnrollments || 0, change: enrollTrend.change, trend: enrollTrend.trend },
        { label: 'Prácticas en Curso', value: trackingCount },
        { label: 'Certificados Emitidos', value: certifiedCount || 0, change: certTrend.change, trend: certTrend.trend },
      ],
    });
  } catch (error) {
    console.error('Reports Stats Error:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas de reportes', error });
  }
};

export const getStudentsByCareer = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();

    // t_students no tiene CAREER_ID; obtenemos la relación desde t_professional_practices
    const { data: practices, error } = await supabase
      .from('t_professional_practices')
      .select(`
        CAREER_ID,
        STUDENTS_ID,
        t_career(CAREER_NAME, CAREER_ABBREVIATION)
      `)
      .eq('STATUS', 1);

    if (error) throw error;

    // Agrupar estudiantes únicos por carrera
    const careerMap = new Map<string, { name: string; abbreviation: string; count: number }>();
    const seenStudent = new Set<string>();

    interface PracticeWithCareer {
      CAREER_ID: number;
      STUDENTS_ID: number;
      t_career: { CAREER_NAME: string; CAREER_ABBREVIATION: string } | null;
    }

    (practices as unknown as PracticeWithCareer[])?.forEach((p) => {
      const careerInfo = p.t_career;
      if (!careerInfo || !p.STUDENTS_ID) return;

      const name = careerInfo.CAREER_NAME || 'Desconocida';
      const abbreviation = careerInfo.CAREER_ABBREVIATION || 'N/A';
      const studentKey = `${p.CAREER_ID}-${p.STUDENTS_ID}`;

      // Evitar duplicar el mismo estudiante en la misma carrera
      if (seenStudent.has(studentKey)) return;
      seenStudent.add(studentKey);

      const mapKey = `${name}|${abbreviation}`;
      if (careerMap.has(mapKey)) {
        careerMap.get(mapKey)!.count++;
      } else {
        careerMap.set(mapKey, { name, abbreviation, count: 1 });
      }
    });

    const totalActive = seenStudent.size;

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

    // Largest remainder method: asegura que los porcentajes sumen exactamente 100
    function computePercentages(values: number[], total: number): number[] {
      const raw = values.map((v) => (v / total) * 100);
      const floors = raw.map(Math.floor);
      const remainder = 100 - floors.reduce((s, v) => s + v, 0);
      // Ordenar índices por fracción decimal descendente
      const idxSorted = raw
        .map((_, i) => i)
        .sort((a, b) => raw[b] - floors[b] - (raw[a] - floors[a]));
      for (let i = 0; i < remainder && i < idxSorted.length; i++) {
        floors[idxSorted[i]] += 1;
      }
      return floors;
    }

    const careerValues = Array.from(careerMap.values());
    const percentages = totalActive
      ? computePercentages(careerValues.map((c) => c.count), totalActive)
      : careerValues.map(() => 0);

    const result = careerValues
      .map((c, i) => ({
        label: c.abbreviation || c.name,
        fullName: c.name,
        value: c.count,
        color: colors[i % colors.length],
        percentage: percentages[i],
      }))
      .sort((a, b) => b.value - a.value);

    res.json(result);

  } catch (error) {
    console.error('Students By Career Error:', error);
    res.status(500).json({ message: 'Error al obtener distribución por carrera', error });
  }
};

export const getEnrollmentsByPeriod = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();

    const { data: periods } = await supabase
      .from('t_internships_period')
      .select('PERIOD_ID, DESCRIPTION')
      .eq('STATUS', 1)
      .order('START_DATE', { ascending: false })
      .limit(6);

    if (!periods || periods.length === 0) {
      res.json([]);
      return;
    }

    const periodIds = periods.map((p: any) => p.PERIOD_ID);

    const { data: enrollments } = await supabase
      .from('t_professional_practices')
      .select('PERIOD_ID')
      .eq('STATUS', 1)
      .in('PERIOD_ID', periodIds);

    const enrollmentMap = new Map<number, number>();
    (enrollments as unknown as { PERIOD_ID: number }[])?.forEach((e) => {
      enrollmentMap.set(e.PERIOD_ID, (enrollmentMap.get(e.PERIOD_ID) || 0) + 1);
    });

    const result = periods
      .map((p: any) => ({
        label: p.DESCRIPTION,
        periodId: p.PERIOD_ID,
        value: enrollmentMap.get(p.PERIOD_ID) || 0
      }))
      .reverse();

    res.json(result);

  } catch (error) {
    console.error('Enrollments By Period Error:', error);
    res.status(500).json({ message: 'Error al obtener inscripciones por período', error });
  }
};

export const getRecentReports = async (req: Request, res: Response) => {
  try {
    const { data: logs } = await dbManager.getConnection()
      .from('t_auth_log')
      .select('AUTH_LOG_ID, USER_ID, ACTION, DETAILS, CREATED_AT, t_user(USER_CI, person_id, t_persons!inner(first_name, last_name))')
      .in('ACTION', ['REPORT_GENERATED', 'PDF_EXPORTED', 'CERTIFICATE_GENERATED'])
      .order('CREATED_AT', { ascending: false })
      .limit(10);

    interface LogWithUser {
      AUTH_LOG_ID: number;
      USER_ID: number;
      ACTION: string;
      DETAILS: string;
      CREATED_AT: string;
      t_user: { USER_CI: string; person_id: number; t_persons: { first_name: string; last_name: string } } | null;
    }

    const result = (logs as unknown as LogWithUser[])?.map((log) => {
      const typeMap: Record<string, string> = {
        'REPORT_GENERATED': 'Reporte',
        'PDF_EXPORTED': 'PDF',
        'CERTIFICATE_GENERATED': 'Certificado'
      };

      return {
        id: log.AUTH_LOG_ID,
        name: log.DETAILS || 'Reporte generado',
        date: log.CREATED_AT,
        type: typeMap[log.ACTION] || 'Otro',
        status: 'completed',
        user: log.t_user?.t_persons ? `${log.t_user.t_persons.first_name} ${log.t_user.t_persons.last_name}`.trim() : 'Sistema'
      };
    }) || [];

    res.json(result);

  } catch (error) {
    console.error('Recent Reports Error:', error);
    res.status(500).json({ message: 'Error al obtener reportes recientes', error });
  }
};

export const generateReport = async (req: Request, res: Response) => {
  try {
    const { type, period, format } = req.body;
    const userId = (req as any).user?.id;

    const typeMap: Record<string, string> = {
      'students': 'Estudiantes',
      'enrollments': 'Inscripciones',
      'tracking': 'Seguimiento',
      'certificates': 'Certificados',
      'institutions': 'Instituciones',
      'tutores-academicos': 'Relación de Tutores Académicos',
      'resumen-pasantias': 'Resumen Pasantias'
    };

    await dbManager.getConnection()
      .from('t_auth_log')
      .insert({
        USER_ID: userId,
        ACTION: 'REPORT_GENERATED',
        DETAILS: `Reporte de ${typeMap[type] || type} - Período: ${period || 'Todos'} - Formato: ${format || 'PDF'}`,
        CREATED_AT: new Date().toISOString()
      });

    res.json({
      success: true,
      message: 'Reporte generado exitosamente',
      downloadUrl: `/api/reports/download?type=${type}&period=${period}&format=${format}`
    });

  } catch (error) {
    console.error('Generate Report Error:', error);
    res.status(500).json({ message: 'Error al generar reporte', error });
  }
};

export const getTutorsAcademicReport = async (req: Request, res: Response) => {
  try {
    const { periodId, careerId, careerIds: careerIdsQuery, page: pageQuery, limit: limitQuery } = req.query;
    const pageNum = Math.max(0, parseInt(pageQuery as string) || 0);
    const limitNum = Math.min(Math.max(1, parseInt(limitQuery as string) || 50), 500);
    const careerIds = careerIdsQuery
      ? String(careerIdsQuery).split(',').map(Number).filter(id => !isNaN(id))
      : [];
    const supabase = dbManager.getConnection();

    const { data: tutorPractices, error } = await supabase
      .from('t_professional_practices_tutor')
      .select(`
        TUTOR_ID,
        TUTOR_TYPE,
        t_tutors (
          TUTOR_ID,
          CONDITION,
          DEDICATION,
          CATEGORY,
          EMAIL,
          t_persons!inner (
            ci,
            first_name,
            middle_name,
            last_name,
            second_last_name,
            phone,
            email
          )
        ),
        t_professional_practices (
          PROFESSIONAL_PRACTICE_ID,
          PERIOD_ID,
          PRACTICES_STATUS,
          INSTITUTION_ID,
          STUDENTS_ID,
          t_institution (
            INSTITUTION_ID,
            INSTITUTION_NAME,
            REGION,
            NUCLEUS,
            EXTENSION
          ),
          t_students (
            STUDENTS_ID
          ),
          t_career (
            CAREER_ID,
            CAREER_NAME,
            CAREER_ABBREVIATION
          )
        )
      `)
      .eq('TUTOR_TYPE', 'ACADEMICO');

    if (error) {
      console.error('Error in query:', error);
      throw error;
    }

    const tutorMap = new Map<number, {
      tutor: any;
      career: string;
      region: string;
      nucleus: string;
      extension: string;
      studentCount: number;
    }>();

    (tutorPractices as unknown as any[])?.forEach((tp) => {
      const tutor = tp.t_tutors;
      const practice = tp.t_professional_practices;
      const student = practice?.t_students;
      const career = practice?.t_career;
      const institution = practice?.t_institution;

      if (!tutor || !practice) return;

      if (periodId && practice.PERIOD_ID !== parseInt(periodId as string)) return;
      if (careerId && career?.CAREER_ID !== parseInt(careerId as string)) return;
      if (careerIds.length > 0 && (!career || !careerIds.includes(career.CAREER_ID))) return;

      const tutorKey = tutor.TUTOR_ID;

      if (tutorMap.has(tutorKey)) {
        tutorMap.get(tutorKey)!.studentCount++;
      } else {
        tutorMap.set(tutorKey, {
          tutor: {
            name: tutor.t_persons?.first_name || '',
            secondName: tutor.t_persons?.middle_name || '',
            surname: tutor.t_persons?.last_name || '',
            secondSurname: tutor.t_persons?.second_last_name || '',
            ci: tutor.t_persons?.ci,
            condition: tutor.CONDITION,
            dedication: tutor.DEDICATION,
            category: tutor.CATEGORY,
            phone: tutor.t_persons?.phone || '',
            email: tutor.t_persons?.email
          },
          career: career?.CAREER_NAME || '',
          region: getRegionName(institution?.REGION),
          nucleus: institution?.NUCLEUS || '',
          extension: institution?.EXTENSION || '',
          studentCount: 1
        });
      }
    });

    const reportData = Array.from(tutorMap.values())
      .filter(t => t.studentCount > 0)
      .sort((a, b) => {
        const nameA = `${a.tutor.surname} ${a.tutor.name}`.toLowerCase();
        const nameB = `${b.tutor.surname} ${b.tutor.name}`.toLowerCase();
        return nameA.localeCompare(nameB);
      })
      .map((item, index) => ({
        nro: index + 1,
        region: item.region,
        nucleo: item.nucleus,
        extension: item.extension,
        carrera: item.career,
        nombreTutor: `${item.tutor.name} ${item.tutor.secondName}`.trim(),
        apellidoTutor: `${item.tutor.surname} ${item.tutor.secondSurname}`.trim(),
        cedula: item.tutor.ci,
        condicion: item.tutor.condition,
        dedicacion: item.tutor.dedication,
        categoria: item.tutor.category,
        telefono: item.tutor.phone,
        correo: item.tutor.email,
        cantidadEstudiantes: item.studentCount
      }));

    const totalCount = reportData.length;
    const paginatedData = reportData.slice(pageNum * limitNum, (pageNum + 1) * limitNum);
    res.json({
      success: true,
      data: paginatedData,
      meta: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalEstudiantes: reportData.reduce((sum, t) => sum + t.cantidadEstudiantes, 0)
      }
    });

  } catch (error) {
    console.error('Tutors Academic Report Error:', error);
    res.status(500).json({ message: 'Error al obtener reporte de tutores académicos', error });
  }
};

function getRegionName(code: string | undefined): string {
  const regionMap: Record<string, string> = {
    'LOS_LLANOS': 'LOS LLANOS',
    'CENTRAL': 'CENTRAL',
    'GUayana': 'GUAYANA',
    'ANDES': 'ANDES',
    'OCCIDENTAL': 'OCCIDENTAL',
    'ORIENTAL': 'ORIENTAL'
  };
  return regionMap[code || ''] || code || '';
}

export interface CulminatedStudentReportRow {
  id: number;
  studentCi: string;
  studentName: string;
  careerName: string;
  institutionName: string;
  practiceType: string;
  tutorName: string;
  period: string;
  startDate: string;
  endDate: string;
  totalHours: number;
  grade: number;
  status: 'pending' | 'approved' | 'certified';
  certificateNumber?: string;
  certifiedAt?: string;
}

export const getResumenPasantiasReport = async (req: Request, res: Response) => {
  try {
    const { periodId, careerId, careerIds: careerIdsQuery, institutionId, extensionFilter, regionFilter, nucleusFilter, page: pageQuery, limit: limitQuery } = req.query;
    const pageNum = Math.max(0, parseInt(pageQuery as string) || 0);
    const limitNum = Math.min(Math.max(1, parseInt(limitQuery as string) || 50), 500);
    const careerIds = careerIdsQuery
      ? String(careerIdsQuery).split(',').map(Number).filter(id => !isNaN(id))
      : [];
    const supabase = dbManager.getConnection();

    // Consultamos las practicas profesionales
    const { data: practices, error } = await supabase
      .from('t_professional_practices')
      .select(`
        PROFESSIONAL_PRACTICE_ID,
        PERIOD_ID,
        INSTITUTION_ID,
        STUDENTS_ID,
        t_institution (
          INSTITUTION_ID,
          INSTITUTION_NAME,
          REGION,
          NUCLEUS,
          EXTENSION,
          INSTITUTION_TYPE
        ),
        t_students (
          STUDENTS_ID
        ),
        t_career (
          CAREER_ID,
          CAREER_NAME
        ),
        t_professional_practices_tutor (
          TUTOR_TYPE
        )
      `)
      .eq('STATUS', 1);

    if (error) throw error;

    // Agrupamos por (Region, Nucleo, Extension, Carrera, Empresa)
    const summaryMap = new Map<string, any>();

    (practices as any[]).forEach(practice => {
      const institution = practice.t_institution;
      const student = practice.t_students;
      const career = practice?.t_career;

      if (!institution || !student || !career) return;

      if (periodId && practice.PERIOD_ID !== parseInt(periodId as string)) return;
      if (careerId && career.CAREER_ID !== parseInt(careerId as string)) return;
      if (careerIds.length > 0 && !careerIds.includes(career.CAREER_ID)) return;

      const key = `${institution.REGION}-${institution.NUCLEUS}-${institution.EXTENSION}-${career.CAREER_ID}-${institution.INSTITUTION_ID}`;

      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          region: getRegionName(institution.REGION) || institution.REGION,
          nucleo: institution.NUCLEUS,
          extension: institution.EXTENSION,
          carrera: career.CAREER_NAME,
          empresa: institution.INSTITUTION_NAME,
          tipoEmpresa: institution.INSTITUTION_TYPE,
          estudiantes: new Set(),
          tutoresAcad: 0,
          tutoresInst: 0,
          observacion: ''
        });
      }

      const record = summaryMap.get(key)!;
      record.estudiantes.add(student.STUDENTS_ID);

      // Contar tutores (evitar contar dobles si ya estaban, pero aquí es simple, contamos por práctica)
      const tutores = practice.t_professional_practices_tutor || [];
      const hasAcad = tutores.some((t: any) => t.TUTOR_TYPE === 'ACADEMICO');
      const hasInst = tutores.some((t: any) => t.TUTOR_TYPE === 'INSTITUCIONAL');

      if (hasAcad) record.tutoresAcad += 1;
      if (hasInst) record.tutoresInst += 1;
    });

    const reportData = Array.from(summaryMap.values()).map((item, index) => ({
      nro: index + 1,
      region: item.region,
      nucleo: item.nucleo,
      extension: item.extension,
      carrera: item.carrera,
      cantidadTutoresAcad: item.tutoresAcad,
      cantidadEstudiantes: item.estudiantes.size,
      empresa: item.empresa,
      tipoEmpresa: item.tipoEmpresa,
      cantidadTutoresInst: item.tutoresInst,
      observacion: item.observacion
    }));

    // Ordenar alfabéticamente
    reportData.sort((a, b) => {
      if (a.region !== b.region) return a.region.localeCompare(b.region);
      if (a.carrera !== b.carrera) return a.carrera.localeCompare(b.carrera);
      return a.empresa.localeCompare(b.empresa);
    });

    const totalCount = reportData.length;
    const paginatedData = reportData.slice(pageNum * limitNum, (pageNum + 1) * limitNum);
    res.json({
      success: true,
      data: paginatedData,
      meta: {
        total: totalCount,
        page: pageNum,
        limit: limitNum
      }
    });

  } catch (error) {
    console.error('Resumen Pasantias Report Error:', error);
    res.status(500).json({ message: 'Error al obtener reporte de resumen pasantias', error });
  }
};

export const getCulminatedStudentsReport = async (req: Request, res: Response) => {
  try {
    const { periodId, careerId, status, institutionId, page: pageQuery, limit: limitQuery } = req.query;
    const pageNum = Math.max(0, parseInt(pageQuery as string) || 0);
    const limitNum = Math.min(Math.max(1, parseInt(limitQuery as string) || 50), 500);
    const supabase = dbManager.getConnection();

    const { data: practices, error: practicesError } = await supabase
      .from('t_professional_practices')
      .select(`
        PROFESSIONAL_PRACTICE_ID,
        START_DATE,
        END_DATE,
        GRADE,
        PRACTICES_STATUS,
        PERIOD_ID,
        INSTITUTION_ID,
        STUDENTS_ID,
        INTERNSHIP_TYPE_ID,
        t_persons!inner (
          ci,
          first_name,
          middle_name,
          last_name,
          second_last_name
        ),
        t_career (
          CAREER_ID,
          CAREER_NAME
        ),
        t_institution (
          INSTITUTION_ID,
          INSTITUTION_NAME
        ),
        t_internships_period (
          PERIOD_ID,
          DESCRIPTION,
          START_DATE,
          END_DATE
        ),
        t_internship_type (
          INTERNSHIP_TYPE_ID,
          NAME
        ),
        t_professional_practices_tutor (
          TUTOR_ID,
          t_tutors (
            TUTOR_ID,
            t_persons!inner (
              first_name,
              middle_name,
              last_name,
              second_last_name
            )
          )
        )
      `)
      .eq('STATUS', 1)
      .eq('PRACTICES_STATUS', PRACTICES_STATUS.CULMINADO);

    if (practicesError) {
      console.error('[CulminatedReport] Error fetching practices:', practicesError);
      res.status(500).json({ message: 'Error al obtener prácticas', error: practicesError.message });
      return;
    }

    if (!practices || practices.length === 0) {
      res.json({
        success: true,
        data: [],
        meta: { total: 0 }
      });
      return;
    }

    const practiceIds = practices.map((p: any) => p.PROFESSIONAL_PRACTICE_ID);

    // t_tracking no existe; calculamos horas desde t_practice_visits
    const hoursMap = new Map<number, number>();
    if (practiceIds.length > 0) {
      const { data: visits } = await supabase
        .from('t_practice_visits')
        .select('PROFESSIONAL_PRACTICE_ID, HOURS_WORKED')
        .in('PROFESSIONAL_PRACTICE_ID', practiceIds);

      (visits || []).forEach((v: any) => {
        const current = hoursMap.get(v.PROFESSIONAL_PRACTICE_ID) || 0;
        hoursMap.set(v.PROFESSIONAL_PRACTICE_ID, current + Number(v.HOURS_WORKED || 0));
      });
    }

    let filteredPractices = practices.filter((p: any) => {
      if (periodId && p.PERIOD_ID !== Number(periodId)) return false;
      if (careerId && p.t_career?.CAREER_ID !== Number(careerId)) return false;
      if (institutionId && p.INSTITUTION_ID !== Number(institutionId)) return false;
      return true;
    });

    const totalCount = filteredPractices.length;
    const paginatedPractices = filteredPractices.slice(pageNum * limitNum, (pageNum + 1) * limitNum);
    const reportData: CulminatedStudentReportRow[] = paginatedPractices.map((p: any) => {
      const tutor = p.t_professional_practices_tutor?.[0]?.t_tutors;
      const student = p.t_persons;
      
      return {
        id: p.PROFESSIONAL_PRACTICE_ID,
        studentCi: student?.ci || '',
        studentName: `${student?.first_name || ''} ${student?.middle_name || ''} ${student?.last_name || ''} ${student?.second_last_name || ''}`.trim().replace(/\s+/g, ' '),
        careerName: p.t_career?.CAREER_NAME || '',
        institutionName: p.t_institution?.INSTITUTION_NAME || '',
        practiceType: p.t_internship_type?.NAME || '',
        tutorName: tutor?.t_persons ? `${tutor.t_persons.first_name || ''} ${tutor.t_persons.middle_name || ''} ${tutor.t_persons.last_name || ''} ${tutor.t_persons.second_last_name || ''}`.trim().replace(/\s+/g, ' ') : '',
        period: p.t_internships_period?.DESCRIPTION || '',
        startDate: p.START_DATE || '',
        endDate: p.END_DATE || '',
        totalHours: hoursMap.get(p.PROFESSIONAL_PRACTICE_ID) || 0,
        grade: p.GRADE || 0,
        status: 'approved',
        certificateNumber: undefined,
        certifiedAt: undefined
      };
    });

    res.json({
      success: true,
      data: reportData,
      meta: {
        total: totalCount,
        page: pageNum,
        limit: limitNum
      }
    });

  } catch (error) {
    console.error('Culminated Students Report Error:', error);
    res.status(500).json({ message: 'Error al obtener reporte de estudiantes culminados', error });
  }
};

export const getRelacionEmpresasDemandan = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const { periodId, careerId, careerIds: careerIdsQuery, page: pageQuery, limit: limitQuery } = req.query;
    const pageNum = Math.max(0, parseInt(pageQuery as string) || 0);
    const limitNum = Math.min(Math.max(1, parseInt(limitQuery as string) || 50), 500);
    const careerIds = careerIdsQuery
      ? String(careerIdsQuery).split(',').map(Number).filter(id => !isNaN(id))
      : [];

    let query = supabase
      .from('t_professional_practices')
      .select(`
        PROFESSIONAL_PRACTICE_ID,
        t_institution(INSTITUTION_NAME, RIF, INSTITUTION_TYPE, REGION, NUCLEUS, EXTENSION),
        t_career(CAREER_NAME),
        STUDENTS_ID
      `)
      .eq('STATUS', 1);

    if (periodId) query = query.eq('PERIOD_ID', Number(periodId));
    if (careerId) query = query.eq('CAREER_ID', Number(careerId));
    if (careerIds.length > 0) query = query.in('CAREER_ID', careerIds);

    const { data: practices, error } = await query;

    if (error) throw error;

    const empresaCount = new Map<string, {
      region: string; nucleo: string; extension: string;
      empresa: string; rif: string; tipo: string;
      carreras: Set<string>; estudiantes: number;
    }>();

    for (const p of practices || []) {
      const inst: any = p.t_institution;
      if (!inst) continue;
      const key = inst.INSTITUTION_NAME || 'unknown';
      const carrera = (p.t_career as any)?.CAREER_NAME || '';

      if (!empresaCount.has(key)) {
        empresaCount.set(key, {
          region: inst.REGION || '',
          nucleo: inst.NUCLEUS || '',
          extension: inst.EXTENSION || '',
          empresa: inst.INSTITUTION_NAME || '',
          rif: inst.RIF || '',
          tipo: inst.INSTITUTION_TYPE || '',
          carreras: new Set(),
          estudiantes: 0,
        });
      }
      const entry = empresaCount.get(key)!;
      entry.carreras.add(carrera);
      entry.estudiantes++;
    }

    const result = Array.from(empresaCount.values()).map(e => ({
      region: e.region,
      nucleo: e.nucleo,
      extension: e.extension,
      empresa: e.empresa,
      rif: e.rif,
      tipo: e.tipo,
      carrera: Array.from(e.carreras).join(', '),
      cantidadEstudiantes: e.estudiantes,
    }));

    const totalCount = result.length;
    const paginatedResult = result.slice(pageNum * limitNum, (pageNum + 1) * limitNum);
    res.json({ success: true, data: paginatedResult, meta: { total: totalCount, page: pageNum, limit: limitNum } });
  } catch (error) {
    console.error('[reports] getRelacionEmpresasDemandan error:', error);
    res.status(500).json({ message: 'Error al obtener relación de empresas' });
  }
};

export const getDistribucionTutores = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const { periodId, careerId, careerIds: careerIdsQuery, page: pageQuery, limit: limitQuery } = req.query;
    const pageNum = Math.max(0, parseInt(pageQuery as string) || 0);
    const limitNum = Math.min(Math.max(1, parseInt(limitQuery as string) || 50), 500);
    const careerIds = careerIdsQuery
      ? String(careerIdsQuery).split(',').map(Number).filter(id => !isNaN(id))
      : [];

    let query = supabase
      .from('t_professional_practices')
      .select(`
        PROFESSIONAL_PRACTICE_ID,
        t_career(CAREER_NAME),
        t_students(STUDENTS_CI, NAME, SECOND_NAME, SURNAME, SECOND_SURNAME),
        t_professional_practices_tutor(
          TUTOR_TYPE,
          t_tutors(TUTOR_CI, NAME, SECOND_NAME, SURNAME, SECOND_SURNAME,
            TITULO, CONTACT_PHONE, EMAIL, ATTENTION_SCHEDULE)
        )
      `)
      .eq('STATUS', 1);

    if (periodId) query = query.eq('PERIOD_ID', Number(periodId));
    if (careerId) query = query.eq('CAREER_ID', Number(careerId));
    if (careerIds.length > 0) query = query.in('CAREER_ID', careerIds);

    const { data: practices, error } = await query;

    if (error) throw error;

    const result = (practices || []).map((p: any, idx: number) => {
      const tutors: any[] = p.t_professional_practices_tutor || [];
      const getTutor = (type: string) => tutors.find((t: any) => t.TUTOR_TYPE === type)?.t_tutors;
      const tutorAcad = getTutor('ACADEMICO');
      const tutorMeto = getTutor('METODOLOGICO');
      const evaluador = getTutor('INSTITUCIONAL');
      const estudiante: any = p.t_students;

      return {
        nro: idx + 1,
        carrera: (p.t_career as any)?.CAREER_NAME || '',
        estudiante: estudiante ? `${estudiante.NAME || ''} ${estudiante.SURNAME || ''}`.trim() : '',
        tutorAcademico: {
          titulo: tutorAcad?.TITULO || '',
          nombre: tutorAcad ? `${tutorAcad.NAME || ''} ${tutorAcad.SURNAME || ''}`.trim() : '',
          contacto: tutorAcad?.CONTACT_PHONE || '',
          email: tutorAcad?.EMAIL || '',
        },
        tutorMetodologico: {
          titulo: tutorMeto?.TITULO || '',
          nombre: tutorMeto ? `${tutorMeto.NAME || ''} ${tutorMeto.SURNAME || ''}`.trim() : '',
          contacto: tutorMeto?.CONTACT_PHONE || '',
          horario: tutorMeto?.ATTENTION_SCHEDULE || '',
        },
        evaluador: {
          titulo: evaluador?.TITULO || '',
          nombre: evaluador ? `${evaluador.NAME || ''} ${evaluador.SURNAME || ''}`.trim() : '',
          contacto: evaluador?.CONTACT_PHONE || '',
        },
      };
    });

    const totalCount = result.length;
    const paginatedResult = result.slice(pageNum * limitNum, (pageNum + 1) * limitNum);
    res.json({ success: true, data: paginatedResult, meta: { total: totalCount, page: pageNum, limit: limitNum } });
  } catch (error) {
    console.error('[reports] getDistribucionTutores error:', error);
    res.status(500).json({ message: 'Error al obtener distribución de tutores' });
  }
};

export const getDistribucionTutoresV2 = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const { periodId, careerId, careerIds: careerIdsQuery, page: pageQuery, limit: limitQuery } = req.query;
    const pageNum = Math.max(0, parseInt(pageQuery as string) || 0);
    const limitNum = Math.min(Math.max(1, parseInt(limitQuery as string) || 50), 500);
    const careerIds = careerIdsQuery
      ? String(careerIdsQuery).split(',').map(Number).filter(id => !isNaN(id))
      : [];

    let query = supabase
      .from('t_professional_practices')
      .select(`
        PROFESSIONAL_PRACTICE_ID,
        t_career(CAREER_NAME),
        t_students(STUDENTS_CI, NAME, SECOND_NAME, SURNAME, SECOND_SURNAME),
        t_professional_practices_tutor(
          TUTOR_TYPE,
          t_tutors(TUTOR_CI, NAME, SECOND_NAME, SURNAME, SECOND_SURNAME,
            TITULO, CONTACT_PHONE, EMAIL, ATTENTION_SCHEDULE,
            CONDITION, DEDICATION, CATEGORY)
        )
      `)
      .eq('STATUS', 1);

    if (periodId) query = query.eq('PERIOD_ID', Number(periodId));
    if (careerId) query = query.eq('CAREER_ID', Number(careerId));
    if (careerIds.length > 0) query = query.in('CAREER_ID', careerIds);

    const { data: practices, error } = await query;

    if (error) throw error;

    const result = (practices || []).map((p: any, idx: number) => {
      const tutors: any[] = p.t_professional_practices_tutor || [];
      const getTutor = (type: string) => tutors.find((t: any) => t.TUTOR_TYPE === type)?.t_tutors;
      const tutorAcad = getTutor('ACADEMICO');
      const tutorMeto = getTutor('METODOLOGICO');
      const evaluador = getTutor('INSTITUCIONAL');
      const estudiante: any = p.t_students;

      return {
        nro: idx + 1,
        carrera: (p.t_career as any)?.CAREER_NAME || '',
        estudiante: estudiante ? `${estudiante.NAME || ''} ${estudiante.SURNAME || ''}`.trim() : '',
        tutorAcademico: {
          titulo: tutorAcad?.TITULO || '',
          nombre: tutorAcad ? `${tutorAcad.NAME || ''} ${tutorAcad.SURNAME || ''}`.trim() : '',
          contacto: tutorAcad?.CONTACT_PHONE || '',
          email: tutorAcad?.EMAIL || '',
        },
        tutorMetodologico: {
          titulo: tutorMeto?.TITULO || '',
          nombre: tutorMeto ? `${tutorMeto.NAME || ''} ${tutorMeto.SURNAME || ''}`.trim() : '',
          contacto: tutorMeto?.CONTACT_PHONE || '',
          horario: tutorMeto?.ATTENTION_SCHEDULE || '',
          horarioDetallado: tutorMeto?.ATTENTION_SCHEDULE || '',
        },
        evaluador: {
          titulo: evaluador?.TITULO || '',
          nombre: evaluador ? `${evaluador.NAME || ''} ${evaluador.SURNAME || ''}`.trim() : '',
          contacto: evaluador?.CONTACT_PHONE || '',
        },
      };
    });

    const totalCount = result.length;
    const paginatedResult = result.slice(pageNum * limitNum, (pageNum + 1) * limitNum);
    res.json({ success: true, data: paginatedResult, meta: { total: totalCount, page: pageNum, limit: limitNum } });
  } catch (error) {
    console.error('[reports] getDistribucionTutoresV2 error:', error);
    res.status(500).json({ message: 'Error al obtener distribución de tutores v2' });
  }
};

export const getRelacionIndividualDocente = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const tutorId = parseInt(String(req.params.tutorId));

    const { data: tutor } = await supabase
      .from('t_tutors')
      .select(`
        TUTOR_ID, TUTOR_CI, NAME, SECOND_NAME, SURNAME, SECOND_SURNAME,
        TITULO, CONDITION, DEDICATION, CATEGORY, CONTACT_PHONE, EMAIL
      `)
      .eq('TUTOR_ID', tutorId)
      .single();

    if (!tutor) {
      return res.status(404).json({ success: false, message: 'Tutor no encontrado' });
    }

    const { data: assignments } = await supabase
      .from('t_professional_practices_tutor')
      .select(`
        PROFESSIONAL_PRACTICE_ID,
        t_professional_practices!inner(
          START_DATE, END_DATE, REGIME, SEMESTER, SECTION,
          t_students(STUDENTS_CI, NAME, SECOND_NAME, SURNAME, SECOND_SURNAME,
            GENDER, STUDENT_TYPE, CONTACT_PHONE),
          t_career(CAREER_NAME),
          t_institution(INSTITUTION_NAME, INSTITUTION_TYPE, INSTITUTION_ADDRESS,
            REGION, NUCLEUS, EXTENSION),
          t_professional_practices_tutor!inner(
            t_tutors!inner(TUTOR_CI, NAME, SECOND_NAME, SURNAME,
              SECOND_SURNAME, TITULO)
          )
        )
      `)
      .eq('TUTOR_ID', tutorId)
      .eq('TUTOR_TYPE', 'ACADEMICO');

    const result = (assignments || []).map((a: any, idx: number) => {
      const pp: any = a.t_professional_practices;
      const estudiante: any = pp?.t_students;
      const carrera: any = pp?.t_career;
      const inst: any = pp?.t_institution;
      const tutorInstArr = pp?.t_professional_practices_tutor || [];
      const tutorInst = tutorInstArr.find((t: any) => t.TUTOR_TYPE === 'INSTITUCIONAL')?.t_tutors;

      return {
        nro: idx + 1,
        region: inst?.REGION || '',
        nucleo: inst?.NUCLEUS || '',
        extension: inst?.EXTENSION || '',
        carrera: carrera?.CAREER_NAME || '',
        estudiante: {
          nombre: `${estudiante?.NAME || ''} ${estudiante?.SECOND_NAME || ''}`.trim(),
          apellido: `${estudiante?.SURNAME || ''} ${estudiante?.SECOND_SURNAME || ''}`.trim(),
          ci: estudiante?.STUDENTS_CI || '',
          sexo: estudiante?.GENDER || '',
          tipo: estudiante?.STUDENT_TYPE || '',
          telefono: estudiante?.CONTACT_PHONE || '',
        },
        institucion: {
          nombre: inst?.INSTITUTION_NAME || '',
          tipo: inst?.INSTITUTION_TYPE || '',
        },
        tutorInstitucional: {
          nombre: `${tutorInst?.NAME || ''} ${tutorInst?.SECOND_NAME || ''}`.trim(),
          apellido: `${tutorInst?.SURNAME || ''} ${tutorInst?.SECOND_SURNAME || ''}`.trim(),
          ci: tutorInst?.TUTOR_CI || '',
          cargo: tutorInst?.TITULO || '',
        },
        direccion: inst?.INSTITUTION_ADDRESS || '',
        observaciones: '',
      };
    });

    res.json({ success: true, data: result, meta: { total: result.length } });
  } catch (error) {
    console.error('[reports] getRelacionIndividualDocente error:', error);
    res.status(500).json({ message: 'Error al obtener relación individual de docente' });
  }
};
