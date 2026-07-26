import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';
import { PRACTICES_STATUS } from '../constants/practice-status.constants.js';
import { getPersonField, getPersonFullName } from '../utils/person-utils.js';
import { generateWorkbook, generateTutoresAcademicosWorkbook, generateResumenPasantiasWorkbook, generateRelacionEmpresasWorkbook, generateRelacionInstitucionesSolicitanWorkbook } from '../services/excel-export.service.js';
import type { IndividualTutorSheetConfig, IndividualTutorRow, ResumenPasantiaRow } from '../services/excel-export.service.js';

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

async function getSystemLocation(supabase: any): Promise<{ region: string; nucleus: string; extension: string }> {
  try {
    const { data } = await supabase
      .from('t_system_institution')
      .select('region, nucleus, extension')
      .eq('status', 1)
      .maybeSingle();
    return {
      region: data?.region || '',
      nucleus: data?.nucleus || '',
      extension: data?.extension || '',
    };
  } catch {
    return { region: '', nucleus: '', extension: '' };
  }
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
        user: getPersonFullName(log.t_user?.t_persons) || 'Sistema'
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
    const sysLoc = await getSystemLocation(supabase);

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
            name: getPersonField(tutor.t_persons, 'first_name') || '',
            secondName: getPersonField(tutor.t_persons, 'middle_name') || '',
            surname: getPersonField(tutor.t_persons, 'last_name') || '',
            secondSurname: getPersonField(tutor.t_persons, 'second_last_name') || '',
            ci: getPersonField(tutor.t_persons, 'ci'),
            condition: tutor.CONDITION,
            dedication: tutor.DEDICATION,
            category: tutor.CATEGORY,
            phone: getPersonField(tutor.t_persons, 'phone') || '',
            email: getPersonField(tutor.t_persons, 'email'),
            gender: tutor.GENDER,
            tutorId: tutor.TUTOR_ID,
            titulo: tutor.TITULO
          },
          career: career?.CAREER_NAME || '',
          region: sysLoc.region,
          nucleus: sysLoc.nucleus,
          extension: sysLoc.extension,
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
        cantidadEstudiantes: item.studentCount,
        sexo: item.tutor.gender,
        codigoTutor: item.tutor.tutorId,
        titulo: item.tutor.titulo
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

// getRegionName removed — now reads from t_system_institution directly

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
    const sysLoc = await getSystemLocation(supabase);

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
          TUTOR_TYPE,
          t_tutors (TUTOR_ID)
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

      const key = `${sysLoc.region}-${sysLoc.nucleus}-${sysLoc.extension}-${career.CAREER_ID}-${institution.INSTITUTION_ID}`;

      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          region: sysLoc.region,
          nucleo: sysLoc.nucleus,
          extension: sysLoc.extension,
          carrera: career.CAREER_NAME,
          empresa: institution.INSTITUTION_NAME,
          tipo: institution.INSTITUTION_TYPE,
          estudiantes: new Set(),
          tutoresAcad: new Set<number>(),
          tutoresInst: new Set<number>(),
          observacion: ''
        });
      }

      const record = summaryMap.get(key)!;
      record.estudiantes.add(student.STUDENTS_ID);

      // Contar tutores ÚNICOS por su TUTOR_ID (Sets evitan duplicados)
      const tutores = practice.t_professional_practices_tutor || [];
      tutores.forEach((t: any) => {
        const tutorId = t.t_tutors?.TUTOR_ID;
        if (t.TUTOR_TYPE === 'ACADEMICO' && tutorId) record.tutoresAcad.add(tutorId);
        if (t.TUTOR_TYPE === 'INSTITUCIONAL' && tutorId) record.tutoresInst.add(tutorId);
      });
    });

    const reportData = Array.from(summaryMap.values()).map((item, index) => ({
      nro: index + 1,
      region: item.region,
      nucleo: item.nucleo,
      extension: item.extension,
      carrera: item.carrera,
      cantidadTutoresAcad: item.tutoresAcad.size,
      cantidadEstudiantes: item.estudiantes.size,
      empresa: item.empresa,
      tipo: item.tipo,
      cantidadTutoresInst: item.tutoresInst.size,
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
      
      const sFirst = getPersonField(p.t_persons, 'first_name') || '';
      const sMiddle = getPersonField(p.t_persons, 'middle_name') || '';
      const sLast = getPersonField(p.t_persons, 'last_name') || '';
      const sSecondLast = getPersonField(p.t_persons, 'second_last_name') || '';
      const studentName = [sFirst, sMiddle, sLast, sSecondLast].filter(Boolean).join(' ').trim();

      const tFirst = getPersonField(tutor?.t_persons, 'first_name') || '';
      const tMiddle = getPersonField(tutor?.t_persons, 'middle_name') || '';
      const tLast = getPersonField(tutor?.t_persons, 'last_name') || '';
      const tSecondLast = getPersonField(tutor?.t_persons, 'second_last_name') || '';
      const tutorName = [tFirst, tMiddle, tLast, tSecondLast].filter(Boolean).join(' ').trim();
      
      return {
        id: p.PROFESSIONAL_PRACTICE_ID,
        studentCi: getPersonField(p.t_persons, 'ci') || '',
        studentName,
        careerName: p.t_career?.CAREER_NAME || '',
        institutionName: p.t_institution?.INSTITUTION_NAME || '',
        practiceType: p.t_internship_type?.NAME || '',
        tutorName,
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
    const sysLoc = await getSystemLocation(supabase);
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
          region: sysLoc.region,
          nucleo: sysLoc.nucleus,
          extension: sysLoc.extension,
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
      publica: (e.tipo || '').toUpperCase() === 'PÚBLICA' ? 'X' : '',
      privada: (e.tipo || '').toUpperCase() === 'PRIVADA' ? 'X' : '',
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

export const getRelacionInstitucionesSolicitan = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const { periodId, careerId, careerIds: careerIdsQuery, page: pageQuery, limit: limitQuery } = req.query;
    const pageNum = Math.max(0, parseInt(pageQuery as string) || 0);
    const limitNum = Math.min(Math.max(1, parseInt(limitQuery as string) || 50), 500);
    const careerIds = careerIdsQuery
      ? String(careerIdsQuery).split(',').map(Number).filter(id => !isNaN(id))
      : [];

    // Query with manager join
    let query = supabase
      .from('t_professional_practices')
      .select(`
        PROFESSIONAL_PRACTICE_ID,
        t_institution (INSTITUTION_NAME, RIF, INSTITUTION_TYPE, INSTITUTION_CONTACT),
        t_institution_manager!inner (MANAGER_ID, NAME, SECOND_NAME, SURNAME, SECOND_SURNAME, CONTACT_PHONE),
        t_career (CAREER_NAME)
      `)
      .eq('STATUS', 1);

    if (periodId) query = query.eq('PERIOD_ID', Number(periodId));
    if (careerId) query = query.eq('CAREER_ID', Number(careerId));
    if (careerIds.length > 0) query = query.in('CAREER_ID', careerIds);

    const { data: practices, error } = await query;
    if (error) throw error;

    let practicesWithManager = practices || [];
    let practicesWithoutManager: any[] = [];

    // Fallback: query without manager inner join if no results
    if (practicesWithManager.length === 0) {
      let fallbackQuery = supabase
        .from('t_professional_practices')
        .select(`
          PROFESSIONAL_PRACTICE_ID,
          t_institution (INSTITUTION_NAME, RIF, INSTITUTION_TYPE, INSTITUTION_CONTACT),
          t_career (CAREER_NAME)
        `)
        .eq('STATUS', 1);

      if (periodId) fallbackQuery = fallbackQuery.eq('PERIOD_ID', Number(periodId));
      if (careerId) fallbackQuery = fallbackQuery.eq('CAREER_ID', Number(careerId));
      if (careerIds.length > 0) fallbackQuery = fallbackQuery.in('CAREER_ID', careerIds);

      const { data: fallbackPractices } = await fallbackQuery;
      practicesWithoutManager = fallbackPractices || [];
    }

    const instMap = new Map<string, {
      empresa: string; rif: string; tipo: string; telefono: string;
      manager: any; carreras: Set<string>; estudiantes: number;
    }>();

    // Process practices with managers
    for (const p of practicesWithManager) {
      const inst: any = p.t_institution;
      const mgr: any = p.t_institution_manager;
      if (!inst) continue;
      const key = inst.INSTITUTION_NAME || 'unknown';
      const carrera = (p.t_career as any)?.CAREER_NAME || '';

      if (!instMap.has(key)) {
        const phone = inst.INSTITUTION_CONTACT || mgr?.CONTACT_PHONE || 'N/A';
        instMap.set(key, {
          empresa: inst.INSTITUTION_NAME || '',
          rif: inst.RIF || '',
          tipo: inst.INSTITUTION_TYPE || '',
          telefono: phone,
          manager: mgr,
          carreras: new Set(),
          estudiantes: 0,
        });
      }
      const entry = instMap.get(key)!;
      entry.carreras.add(carrera);
      entry.estudiantes++;
    }

    // Process practices without managers (fallback)
    for (const p of practicesWithoutManager) {
      const inst: any = p.t_institution;
      if (!inst) continue;
      const key = inst.INSTITUTION_NAME || 'unknown';
      const carrera = (p.t_career as any)?.CAREER_NAME || '';

      if (!instMap.has(key)) {
        const phone = inst.INSTITUTION_CONTACT || 'N/A';
        instMap.set(key, {
          empresa: inst.INSTITUTION_NAME || '',
          rif: inst.RIF || '',
          tipo: inst.INSTITUTION_TYPE || '',
          telefono: phone,
          manager: null,
          carreras: new Set(),
          estudiantes: 0,
        });
      }
      const entry = instMap.get(key)!;
      entry.carreras.add(carrera);
      entry.estudiantes++;
    }

    const result = Array.from(instMap.values()).map(e => ({
      empresa: e.empresa,
      rif: e.rif,
      tipoEmpresa: e.tipo,
      carreras: Array.from(e.carreras).join(', '),
      cantidadEstudiantes: e.estudiantes,
    }));

    const totalCount = result.length;
    const paginatedResult = result.slice(pageNum * limitNum, (pageNum + 1) * limitNum);
    res.json({ success: true, data: paginatedResult, meta: { total: totalCount, page: pageNum, limit: limitNum } });
  } catch (error) {
    console.error('[reports] getRelacionInstitucionesSolicitan error:', error);
    res.status(500).json({ message: 'Error al obtener relación de instituciones que solicitan' });
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
        estudianteCi: estudiante?.STUDENTS_CI || '',
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

export const exportReportExcel = async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const { periodId, careerIds: careerIdsQuery, tutorId: tutorIdQuery } = req.query;
    const careerIds = careerIdsQuery
      ? String(careerIdsQuery).split(',').map(Number).filter(id => !isNaN(id))
      : [];
    const supabase = dbManager.getConnection();
    const sysLoc = await getSystemLocation(supabase);

    // generateWorkbook imported from excel-export.service.js

    let workbook;

    switch (type) {
      case 'tutores-academicos': {
        // Helper: limpia el string "null" literal y espacios
        const cleanVal = (v: string | null | undefined): string =>
          (!v || v.trim().toLowerCase() === 'null') ? '' : v.trim();

        // Helper: formatea teléfono como XXXX - XXXXXXX
        const formatPhone = (phone: string): string => {
          if (!phone) return '';
          const digits = phone.replace(/[\s\-\(\)]/g, '');
          if (digits.length === 11) {
            return `${digits.slice(0, 4)} - ${digits.slice(4)}`;
          }
          return phone;
        };

        // Helper: formatea RIF como X-XXXXXXXX-X
        const formatRif = (rif: string): string => {
          if (!rif) return '';
          const clean = rif.replace(/[\s\-]/g, '');
          if (rif.includes('-')) return rif;
          if (clean.length >= 2) {
            const letter = clean.charAt(0).toUpperCase();
            const numbers = clean.slice(1);
            if (numbers.length >= 9) {
              return `${letter}-${numbers.slice(0, 8)}-${numbers.slice(8, 9)}`;
            }
          }
          return rif;
        };

        // Helper: formatea cédula solo con números y puntos: 12.345.678
        const formatCI = (ci: string | null | undefined): string => {
          if (!ci) return '';
          const raw = ci.trim();
          // Extraer solo dígitos (ignorar prefijo V-, E-, etc.)
          const digits = raw.replace(/\D/g, '');
          if (!digits) return raw;
          // Formatear con separadores de puntos cada 3 dígitos desde la derecha
          const parts: string[] = [];
          for (let i = digits.length - 1, j = 0; i >= 0; i--, j++) {
            if (j > 0 && j % 3 === 0) parts.unshift('.');
            parts.unshift(digits[i]);
          }
          return parts.join('');
        };

        // Helper: normaliza STUDENT_TYPE a texto completo
        const normalizeStudentType = (type: string | null | undefined): string => {
          if (!type) return '';
          const t = type.trim().toUpperCase();
          if (t === 'CIV' || t === 'CIVIL') return 'CIVIL';
          if (t === 'MIL' || t === 'MILITAR') return 'MILITAR';
          return t;
        };

        // ── 1. Query principal: tutores académicos con sus prácticas ──
        // NOTA: NO anidar t_professional_practices_tutor dentro de t_professional_practices
        // porque PostgREST no maneja auto-referencias anidadas de forma confiable.
        const { data: tutorPractices } = await supabase
          .from('t_professional_practices_tutor')
          .select(`
            TUTOR_ID,
            TUTOR_TYPE,
            t_tutors (
              TUTOR_ID,
              CONDITION, DEDICATION, CATEGORY, EMAIL,
              person_id,
              t_persons!inner (
                ci, first_name, middle_name, last_name, second_last_name, phone, email, gender
              )
            ),
            t_professional_practices (
              PROFESSIONAL_PRACTICE_ID, PERIOD_ID, student_person_id,
              t_institution (
                INSTITUTION_ID, INSTITUTION_NAME, REGION, NUCLEUS, EXTENSION,
                INSTITUTION_TYPE, INSTITUTION_ADDRESS, RIF
              ),
              t_students (
                STUDENTS_ID, STUDENT_TYPE, MILITARY_RANK
              ),
              t_career (CAREER_ID, CAREER_NAME)
            )
          `)
          .eq('TUTOR_TYPE', 'ACADEMICO');

        if (!tutorPractices) break;

        // ── 2. Recolectar practice_ids y person_ids de estudiantes ──
        const raw = tutorPractices as any[];
        const practiceIds = new Set<number>();
        const studentPersonIds = new Set<number>();
        raw.forEach((tp) => {
          const practice = tp.t_professional_practices;
          if (!practice) return;
          practiceIds.add(practice.PROFESSIONAL_PRACTICE_ID);
          if (practice.student_person_id) studentPersonIds.add(practice.student_person_id);
        });

        // ── 2b. Fetch tutores institucionales separadamente (evita self-reference) ──
        let instTutorMapByPractice = new Map<number, any>(); // practiceId → { TUTOR_ID, TITULO, person_id }
        let instTutorPersonMap = new Map<number, any>();

        const practiceIdArray = [...practiceIds];
        if (practiceIdArray.length > 0) {
          const { data: instTutorAssignments } = await supabase
            .from('t_professional_practices_tutor')
            .select(`
              TUTOR_ID,
              TUTOR_TYPE,
              t_tutors (
                TUTOR_ID, TITULO, person_id
              )
            `)
            .in('PROFESSIONAL_PRACTICE_ID', practiceIdArray)
            .eq('TUTOR_TYPE', 'INSTITUCIONAL');

          if (instTutorAssignments) {
            const instPersonIds = new Set<number>();
            for (const assignment of instTutorAssignments as any[]) {
              const practiceId = assignment.PROFESSIONAL_PRACTICE_ID;
              const tutorData = assignment.t_tutors;
              if (tutorData) {
                instTutorMapByPractice.set(practiceId, tutorData);
                if (tutorData.person_id) instPersonIds.add(tutorData.person_id);
              }
            }

            // Fetch person data for institutional tutors
            if (instPersonIds.size > 0) {
              const { data: instPersons } = await supabase
                .from('t_persons')
                .select('person_id, ci, first_name, middle_name, last_name, second_last_name, phone, email, gender')
                .in('person_id', [...instPersonIds]);

              if (instPersons) {
                for (const p of instPersons as any[]) {
                  instTutorPersonMap.set(p.person_id, p);
                }
              }
            }
          }
        }

        // ── 2c. Fetch person data for students ──
        let studentPersonMap = new Map<number, any>();
        const studentPersonIdArray = [...studentPersonIds];
        if (studentPersonIdArray.length > 0) {
          const { data: studentPersons } = await supabase
            .from('t_persons')
            .select('person_id, ci, first_name, middle_name, last_name, second_last_name, phone, email, gender')
            .in('person_id', studentPersonIdArray);

          if (studentPersons) {
            for (const p of studentPersons as any[]) {
              studentPersonMap.set(p.person_id, p);
            }
          }
        }

        // ── 3. Procesar datos ──
        const periodDesc = await getPeriodDescription(supabase, periodId as string);
        const generalMap = new Map<string, Map<number, any>>();
        const individualMap = new Map<number, { tutorFirstNames: string; tutorLastNames: string; rows: IndividualTutorRow[] }>();

        raw.forEach((tp) => {
          const tutor = tp.t_tutors;
          const practice = tp.t_professional_practices;
          if (!tutor || !practice) return;
          if (periodId && practice.PERIOD_ID !== parseInt(periodId as string)) return;
          if (careerIds.length > 0 && (!practice.t_career || !careerIds.includes(practice.t_career.CAREER_ID))) return;

          const careerName = practice.t_career?.CAREER_NAME || 'Sin Carrera';
          const institution = practice.t_institution;
          const studentPerson = practice.student_person_id ? studentPersonMap.get(practice.student_person_id) : null;
          const estudianteEntity = practice.t_students; // STUDENT_TYPE, MILITARY_RANK
          const instTutor = instTutorMapByPractice.get(practice.PROFESSIONAL_PRACTICE_ID);
          const instTutorPerson = instTutor?.person_id ? instTutorPersonMap.get(instTutor.person_id) : null;

          // ── General: agregar por tutor ──
          if (!generalMap.has(careerName)) generalMap.set(careerName, new Map<number, any>());
          const genTutorMap = generalMap.get(careerName)!;
          const tutorKey = tutor.TUTOR_ID;

          if (genTutorMap.has(tutorKey)) {
            genTutorMap.get(tutorKey)!.cantidadEstudiantes++;
          } else {
            genTutorMap.set(tutorKey, {
              region: sysLoc.region,
              nucleo: sysLoc.nucleus,
              extension: sysLoc.extension,
              carrera: careerName,
              nombreTutor: `${getPersonField(tutor.t_persons, 'first_name') || ''} ${getPersonField(tutor.t_persons, 'middle_name') || ''}`.trim(),
              apellidoTutor: `${getPersonField(tutor.t_persons, 'last_name') || ''} ${getPersonField(tutor.t_persons, 'second_last_name') || ''}`.trim(),
              cedula: formatCI(getPersonField(tutor.t_persons, 'ci')),
              condicion: tutor.CONDITION || '',
              dedicacion: tutor.DEDICATION || '',
              categoria: tutor.CATEGORY || '',
               telefono: formatPhone(cleanVal(getPersonField(tutor.t_persons, 'phone'))),
              correo: getPersonField(tutor.t_persons, 'email') || '',
              cantidadEstudiantes: 1,
            });
          }

          // ── Individual: detalle por estudiante ──
          const tutorFirstNames = `${getPersonField(tutor.t_persons, 'first_name') || ''} ${getPersonField(tutor.t_persons, 'middle_name') || ''}`.trim();
          const tutorLastNames = `${getPersonField(tutor.t_persons, 'last_name') || ''} ${getPersonField(tutor.t_persons, 'second_last_name') || ''}`.trim();

          if (!individualMap.has(tutorKey)) {
            individualMap.set(tutorKey, { tutorFirstNames, tutorLastNames, rows: [] });
          }

          // Construir tutor institucional concatenado desde t_persons
          const instName = instTutorPerson
            ? `${instTutorPerson.first_name || ''} ${instTutorPerson.middle_name || ''}`.trim()
            : '';
          const instSurname = instTutorPerson
            ? `${instTutorPerson.last_name || ''} ${instTutorPerson.second_last_name || ''}`.trim()
            : '';
          const instPhone = cleanVal(instTutorPerson?.phone || '');
          const instTitulo = instTutor?.TITULO || '';
          const tutorInstConcat = instTutorPerson
            ? `${instTitulo} ${instName} ${instSurname}.TELEFONO:  ${formatPhone(instPhone)}`
            : '';

          individualMap.get(tutorKey)!.rows.push({
            nro: 0,
            region: sysLoc.region,
            nucleo: sysLoc.nucleus,
            extension: sysLoc.extension,
            carrera: careerName,
            estudianteNombre: studentPerson ? `${studentPerson.first_name || ''} ${studentPerson.middle_name || ''}`.trim() : '',
            estudianteApellido: studentPerson ? `${studentPerson.last_name || ''} ${studentPerson.second_last_name || ''}`.trim() : '',
            estudianteCi: formatCI(studentPerson?.ci),
            sexo: studentPerson?.gender || '',
            tipo: normalizeStudentType(estudianteEntity?.STUDENT_TYPE),
            rango: estudianteEntity?.MILITARY_RANK || '',
            telefono: formatPhone(cleanVal(studentPerson?.phone || '')),
            institucion: institution?.INSTITUTION_NAME || '',
            rifInstitucion: formatRif(institution?.RIF || ''),
            tipoInstitucion: institution?.INSTITUTION_TYPE || '',
            tutorInst: tutorInstConcat,
            direccion: institution?.INSTITUTION_ADDRESS || '',
            observaciones: '',
          });
        });

          // ── Construir hoja "RELACIÓN GENERAL" ──
          const ANEXO_FOOTER_NOTES = [
            'Nota:',
            '1.-Los soportes anexados a este formato, deberán estar ordenados según la numeración correspondiente a cada tutor (a).',
            '2. Las pestañas deben estar enumeradas de acuerdo al orden numerico del docente en la relacion general.',
            '2.-Debe realizar un archivo por cada carrera.',
          ];

          const ANEXO_SIGNATURES = [
            'NOMBRE APELLIDO\nFIRMA Y SELLO DEL COORDINADOR DE PRÁCTICAS PROFESIONALES',
            'NOMBRE APELLIDO\nFIRMA Y SELLO DEL JEFE ÁREA ACADÉMICA',
            'NOMBRE APELLIDO\nFIRMA Y SELLO DEL DECANO (A)',
          ];

          // Todas las carreras en una sola sección general (una hoja)
          const generalRows: any[] = [];
          generalMap.forEach((tutorMap) => {
            tutorMap.forEach((r) => {
              generalRows.push(r);
            });
          });
          // Ordenar por apellido para mantener consistencia con individuales
          generalRows.sort((a, b) => a.apellidoTutor.localeCompare(b.apellidoTutor));
          const generalSection = {
            title: 'RELACIÓN GENERAL\nDE TUTORES ACADÉMICOS CONTRATADOS U ORDINARIOS CON DEDICACIÓN MT, TC Y DE QUE SE ENCUENTRAN TUTORANDO ESTUDIANTES DE PRACTICAS PROFESIONALES ( PASANTIAS )',
            periodLabel: periodDesc,
            columns: [
              { header: 'N°', key: 'nro', width: 5 },
              { header: 'REGIÓN', key: 'region', width: 14 },
              { header: 'NÚCLEO', key: 'nucleo', width: 16 },
              { header: 'EXTENSIÓN', key: 'extension', width: 14 },
              { header: 'CARRERA', key: 'carrera', width: 24 },
              { header: 'NOMBRE DEL TUTOR (A)', key: 'nombreTutor', width: 20 },
              { header: 'APELLIDO DEL TUTOR (A)', key: 'apellidoTutor', width: 20 },
              { header: 'CÉDULA', key: 'cedula', width: 14 },
              { header: 'CONDICIÓN', key: 'condicion', width: 14 },
              { header: 'DEDICACIÓN', key: 'dedicacion', width: 14 },
              { header: 'CATEGORÍA', key: 'categoria', width: 14 },
              { header: 'TELÉFONO', key: 'telefono', width: 14 },
              { header: 'CORREO ELECTRÓNICO', key: 'correo', width: 22 },
              { header: 'CANTIDAD DE ESTUDIANTES ATENDIDOS', key: 'cantidadEstudiantes', width: 16 },
            ],
            rows: generalRows.map((r, i) => ({ nro: i + 1, ...r })),
            footerNotes: ANEXO_FOOTER_NOTES,
            signatures: ANEXO_SIGNATURES,
          };

          // ── Construir hojas individuales ──
          const individualSections: IndividualTutorSheetConfig[] = [];
          let tutorCounter = 0;
          // Ordenar tutores por apellido para consistencia
          const sortedTutors = Array.from(individualMap.entries()).sort((a, b) => {
            return a[1].tutorLastNames.localeCompare(b[1].tutorLastNames);
          });

          sortedTutors.forEach(([_tid, info]) => {
            tutorCounter++;
            const sortedRows = info.rows.sort((a, b) =>
              `${a.estudianteApellido} ${a.estudianteNombre}`.localeCompare(`${b.estudianteApellido} ${b.estudianteNombre}`),
            );
            individualSections.push({
              sheetIndex: tutorCounter,
              tutorName: info.tutorFirstNames,
              tutorApellido: info.tutorLastNames,
              periodLabel: periodDesc,
              rows: sortedRows.map((r, i) => ({ ...r, nro: i + 1 })),
            });
          });

          workbook = await generateTutoresAcademicosWorkbook(generalSection, individualSections);
        break;
      }

      case 'resumen-pasantias': {
        const { data: practices } = await supabase
          .from('t_professional_practices')
          .select(`
            PROFESSIONAL_PRACTICE_ID, PERIOD_ID, INSTITUTION_ID, STUDENTS_ID,
            t_institution (INSTITUTION_ID, INSTITUTION_NAME, REGION, NUCLEUS, EXTENSION, INSTITUTION_TYPE),
            t_students (STUDENTS_ID),
            t_career (CAREER_ID, CAREER_NAME),
            t_professional_practices_tutor (TUTOR_TYPE, t_tutors (TUTOR_ID))
          `)
          .eq('STATUS', 1);

        if (practices) {
          const periodDesc = await getPeriodDescription(supabase, periodId as string);

          // Agrupar por (Region, Nucleo, Extension, Carrera, Empresa)
          const summaryMap = new Map<string, any>();

          (practices as any[]).forEach((practice) => {
            const institution = practice.t_institution;
            const student = practice.t_students;
            const career = practice.t_career;
            if (!institution || !student || !career) return;
            if (periodId && practice.PERIOD_ID !== parseInt(periodId as string)) return;
            if (careerIds.length > 0 && !careerIds.includes(career.CAREER_ID)) return;

            const key = `${sysLoc.region}-${sysLoc.nucleus}-${sysLoc.extension}-${career.CAREER_ID}-${institution.INSTITUTION_ID}`;

            if (!summaryMap.has(key)) {
              summaryMap.set(key, {
                region: sysLoc.region,
                nucleo: sysLoc.nucleus,
                extension: sysLoc.extension,
                carrera: career.CAREER_NAME || '',
                empresa: institution.INSTITUTION_NAME || '',
                tipo: institution.INSTITUTION_TYPE || '',
                estudiantes: new Set<number>(),
                tutoresAcad: new Set<number>(),
                tutoresInst: new Set<number>(), // IDs, para contar
                observacion: '',
              });
            }

            const record = summaryMap.get(key)!;
            record.estudiantes.add(student.STUDENTS_ID);

            const tutores = practice.t_professional_practices_tutor || [];
            tutores.forEach((t: any) => {
              if (t.TUTOR_TYPE === 'ACADEMICO') record.tutoresAcad.add(t.t_tutors?.TUTOR_ID);
              if (t.TUTOR_TYPE === 'INSTITUCIONAL') record.tutoresInst.add(t.t_tutors?.TUTOR_ID);
            });
          });

          // Convertir a array plano, ordenar globalmente
          const sortedRows = Array.from(summaryMap.values()).sort((a, b) => {
            const c1 = (a.region || '').localeCompare(b.region || '');
            if (c1 !== 0) return c1;
            const c2 = (a.nucleo || '').localeCompare(b.nucleo || '');
            if (c2 !== 0) return c2;
            const c3 = (a.extension || '').localeCompare(b.extension || '');
            if (c3 !== 0) return c3;
            const c4 = (a.carrera || '').localeCompare(b.carrera || '');
            if (c4 !== 0) return c4;
            return (a.empresa || '').localeCompare(b.empresa || '');
          });

          const dataRows: ResumenPasantiaRow[] = sortedRows.map((r) => ({
            region: r.region,
            nucleo: r.nucleo,
            extension: r.extension,
            carrera: r.carrera,
            cantidadTutoresAcad: r.tutoresAcad.size,
            cantidadEstudiantes: r.estudiantes.size,
            empresa: r.empresa,
            tipo: r.tipo,
            cantidadTutoresInst: r.tutoresInst.size,
            observacion: r.observacion,
          }));

          workbook = await generateResumenPasantiasWorkbook(dataRows, periodDesc);
        }
        break;
      }

      case 'distribucion-tutores': {
        let query = supabase
          .from('t_professional_practices')
          .select(`
            PROFESSIONAL_PRACTICE_ID,
            t_career (CAREER_NAME),
            t_students (STUDENTS_CI, NAME, SECOND_NAME, SURNAME, SECOND_SURNAME),
            t_professional_practices_tutor (
              TUTOR_TYPE,
              t_tutors (TUTOR_CI, NAME, SECOND_NAME, SURNAME, SECOND_SURNAME,
                TITULO, CONTACT_PHONE, EMAIL, ATTENTION_SCHEDULE)
            )
          `)
          .eq('STATUS', 1);

        if (periodId) query = query.eq('PERIOD_ID', Number(periodId));
        if (careerIds.length > 0) query = query.in('CAREER_ID', careerIds);

        const { data: practices } = await query;
        const periodDesc = await getPeriodDescription(supabase, periodId as string);

        // Agrupar por carrera
        const careerGroups = new Map<string, any[]>();
        (practices || []).forEach((p: any) => {
          const careerName = (p.t_career as any)?.CAREER_NAME || 'Sin Carrera';
          const tutors: any[] = p.t_professional_practices_tutor || [];
          const getTutor = (type: string) => tutors.find((t: any) => t.TUTOR_TYPE === type)?.t_tutors;
          const tutorAcad = getTutor('ACADEMICO');
          const tutorMeto = getTutor('METODOLOGICO');
          const evaluador = getTutor('INSTITUCIONAL');
          const estudiante: any = p.t_students;

          if (!careerGroups.has(careerName)) careerGroups.set(careerName, []);
          careerGroups.get(careerName)!.push({
            estudiante: estudiante ? `${estudiante.NAME || ''} ${estudiante.SURNAME || ''}`.trim() : '',
            estudianteCi: estudiante?.STUDENTS_CI || '',
            tutorAcademicoTitulo: tutorAcad?.TITULO || '',
            tutorAcademicoNombre: tutorAcad ? `${tutorAcad.NAME || ''} ${tutorAcad.SURNAME || ''}`.trim() : '',
            tutorAcademicoContacto: tutorAcad?.CONTACT_PHONE || '',
            tutorAcademicoEmail: tutorAcad?.EMAIL || '',
            tutorMetodologicoNombre: tutorMeto ? `${tutorMeto.NAME || ''} ${tutorMeto.SURNAME || ''}`.trim() : '',
            tutorMetodologicoContacto: tutorMeto?.CONTACT_PHONE || '',
            tutorMetodologicoHorario: tutorMeto?.ATTENTION_SCHEDULE || '',
            evaluadorNombre: evaluador ? `${evaluador.NAME || ''} ${evaluador.SURNAME || ''}`.trim() : '',
            evaluadorContacto: evaluador?.CONTACT_PHONE || '',
          });
        });

        const sections = Array.from(careerGroups.entries()).map(([career, rows]) => ({
          title: 'Distribución de Tutores por Estudiante',
          periodLabel: periodDesc,
          columns: [
            { header: 'N°', key: 'nro', width: 5 },
            { header: 'Carrera', key: 'carrera', width: 22 },
            { header: 'Estudiante', key: 'estudiante', width: 22 },
            { header: 'Cédula Estudiante', key: 'estudianteCi', width: 16 },
            { header: 'Título TA', key: 'tutorAcademicoTitulo', width: 14 },
            { header: 'Nombre TA', key: 'tutorAcademicoNombre', width: 20 },
            { header: 'Contacto TA', key: 'tutorAcademicoContacto', width: 14 },
            { header: 'Correo TA', key: 'tutorAcademicoEmail', width: 22 },
            { header: 'Nombre TM', key: 'tutorMetodologicoNombre', width: 20 },
            { header: 'Contacto TM', key: 'tutorMetodologicoContacto', width: 14 },
            { header: 'Horario TM', key: 'tutorMetodologicoHorario', width: 18 },
            { header: 'Nombre Eval.', key: 'evaluadorNombre', width: 20 },
            { header: 'Contacto Eval.', key: 'evaluadorContacto', width: 14 },
          ],
          rows: rows.map((r, i) => ({ nro: i + 1, carrera: career, ...r })),
        }));

        workbook = await generateWorkbook(sections);
        break;
      }

      case 'relacion-individual-docente': {
        const tutorId = parseInt(tutorIdQuery as string) || 0;
        if (!tutorId) {
          return res.status(400).json({ message: 'tutorId es requerido para este reporte' });
        }

        const { data: tutor } = await supabase
          .from('t_tutors')
          .select(`TUTOR_ID, TUTOR_CI, NAME, SECOND_NAME, SURNAME, SECOND_SURNAME, TITULO, CONDITION, DEDICATION, CATEGORY, CONTACT_PHONE, EMAIL`)
          .eq('TUTOR_ID', tutorId)
          .single();

        if (!tutor) {
          return res.status(404).json({ message: 'Tutor no encontrado' });
        }

        const { data: assignments } = await supabase
          .from('t_professional_practices_tutor')
          .select(`
            PROFESSIONAL_PRACTICE_ID,
            t_professional_practices!inner(
              START_DATE, END_DATE, REGIME, SEMESTER, SECTION,
              t_students (STUDENTS_CI, NAME, SECOND_NAME, SURNAME, SECOND_SURNAME,
                GENDER, STUDENT_TYPE, CONTACT_PHONE),
              t_career (CAREER_NAME),
              t_institution (INSTITUTION_NAME, INSTITUTION_TYPE, INSTITUTION_ADDRESS,
                REGION, NUCLEUS, EXTENSION),
              t_professional_practices_tutor!inner(
                t_tutors!inner (TUTOR_CI, NAME, SECOND_NAME, SURNAME,
                  SECOND_SURNAME, TITULO, CONTACT_PHONE, EMAIL)
              )
            )
          `)
          .eq('TUTOR_ID', tutorId)
          .eq('TUTOR_TYPE', 'ACADEMICO');

        const tutorName = `${tutor.TITULO || ''} ${tutor.NAME || ''} ${tutor.SURNAME || ''}`.trim();
        const periodDesc = await getPeriodDescription(supabase, periodId as string);

        // Agrupar por carrera
        const careerGroups = new Map<string, any[]>();
        (assignments || []).forEach((a: any) => {
          const pp: any = a.t_professional_practices;
          if (!pp) return;
          const careerName = pp.t_career?.CAREER_NAME || 'Sin Carrera';
          const estudiante: any = pp.t_students;
          const inst: any = pp.t_institution;
          const tutorInstArr = pp.t_professional_practices_tutor || [];
          const tutorInst = tutorInstArr.find((t: any) => t.TUTOR_TYPE === 'INSTITUCIONAL')?.t_tutors;

          if (!careerGroups.has(careerName)) careerGroups.set(careerName, []);
          careerGroups.get(careerName)!.push({
            region: sysLoc.region,
            nucleo: sysLoc.nucleus,
            extension: sysLoc.extension,
            carrera: careerName,
            estudianteNombre: `${estudiante?.NAME || ''} ${estudiante?.SECOND_NAME || ''}`.trim(),
            estudianteApellido: `${estudiante?.SURNAME || ''} ${estudiante?.SECOND_SURNAME || ''}`.trim(),
            estudianteCi: estudiante?.STUDENTS_CI || '',
            sexo: estudiante?.GENDER || '',
            tipo: estudiante?.STUDENT_TYPE || '',
            telefono: estudiante?.CONTACT_PHONE || '',
            institucion: inst?.INSTITUTION_NAME || '',
            tipoInstitucion: inst?.INSTITUTION_TYPE || '',
            tutorInstNombre: `${tutorInst?.NAME || ''} ${tutorInst?.SECOND_NAME || ''}`.trim(),
            tutorInstApellido: `${tutorInst?.SURNAME || ''} ${tutorInst?.SECOND_SURNAME || ''}`.trim(),
            tutorInstCi: tutorInst?.TUTOR_CI || '',
            tutorInstTelefono: tutorInst?.CONTACT_PHONE || '',
            tutorInstCorreo: tutorInst?.EMAIL || '',
            direccion: inst?.INSTITUTION_ADDRESS || '',
            observaciones: '',
          });
        });

        const sections = Array.from(careerGroups.entries()).map(([career, rows]) => ({
          title: `Relación Individual Docente — ${tutorName}`,
          periodLabel: periodDesc,
          columns: [
            { header: 'N°', key: 'nro', width: 5 },
            { header: 'Región', key: 'region', width: 12 },
            { header: 'Núcleo', key: 'nucleo', width: 14 },
            { header: 'Extensión', key: 'extension', width: 14 },
            { header: 'Carrera', key: 'carrera', width: 22 },
            { header: 'Nombre', key: 'estudianteNombre', width: 16 },
            { header: 'Apellido', key: 'estudianteApellido', width: 16 },
            { header: 'Cédula', key: 'estudianteCi', width: 14 },
            { header: 'Sexo', key: 'sexo', width: 8 },
            { header: 'Tipo', key: 'tipo', width: 12 },
            { header: 'Teléfono', key: 'telefono', width: 14 },
            { header: 'Institución', key: 'institucion', width: 22 },
            { header: 'Tipo Inst.', key: 'tipoInstitucion', width: 14 },
            { header: 'Tutor Inst.', key: 'tutorInstNombre', width: 18 },
            { header: 'CI Tutor Inst.', key: 'tutorInstCi', width: 14 },
            { header: 'Tel. Tutor Inst.', key: 'tutorInstTelefono', width: 14 },
            { header: 'Correo Tutor Inst.', key: 'tutorInstCorreo', width: 22 },
            { header: 'Dirección', key: 'direccion', width: 24 },
            { header: 'Observaciones', key: 'observaciones', width: 20 },
          ],
          rows: rows.map((r, i) => ({ nro: i + 1, ...r })),
        }));

        workbook = await generateWorkbook(sections);
        break;
      }

      case 'relacion-empresas': {
        let query = supabase
          .from('t_professional_practices')
          .select(`
            PROFESSIONAL_PRACTICE_ID,
            t_institution (INSTITUTION_NAME, RIF, INSTITUTION_TYPE, REGION, NUCLEUS, EXTENSION, INSTITUTION_CONTACT),
            t_career (CAREER_NAME),
            STUDENTS_ID
          `)
          .eq('STATUS', 1);

        if (periodId) query = query.eq('PERIOD_ID', Number(periodId));
        if (careerIds.length > 0) query = query.in('CAREER_ID', careerIds);

        const { data: practices } = await query;
        const periodDesc = await getPeriodDescription(supabase, periodId as string);

        const empresaMap = new Map<string, {
          region: string; nucleo: string; extension: string;
          empresa: string; rif: string; tipo: string;
          carreras: Set<string>; estudiantes: number;
        }>();

        (practices || []).forEach((p: any) => {
          const inst: any = p.t_institution;
          if (!inst) return;
          const key = inst.INSTITUTION_NAME || 'unknown';
          const carrera = (p.t_career as any)?.CAREER_NAME || '';
          if (!empresaMap.has(key)) {
            empresaMap.set(key, {
              region: inst.REGION || sysLoc.region,
              nucleo: inst.NUCLEUS || sysLoc.nucleus,
              extension: inst.EXTENSION || sysLoc.extension,
              empresa: inst.INSTITUTION_NAME || '',
              rif: inst.RIF || '',
              tipo: inst.INSTITUTION_TYPE || '',
              carreras: new Set(),
              estudiantes: 0,
            });
          }
          const entry = empresaMap.get(key)!;
          entry.carreras.add(carrera);
          entry.estudiantes++;
        });

        const rows = Array.from(empresaMap.values()).map((e) => ({
          region: e.region,
          nucleo: e.nucleo,
          extension: e.extension,
          empresa: e.empresa,
          rif: e.rif,
          tipo: e.tipo,
          publica: (e.tipo || '').toUpperCase() === 'PÚBLICA' ? 'X' : '',
          privada: (e.tipo || '').toUpperCase() === 'PRIVADA' ? 'X' : '',
          carrera: Array.from(e.carreras).join(', '),
          cantidadEstudiantes: e.estudiantes,
        }));

        workbook = await generateRelacionEmpresasWorkbook(rows, periodDesc);
        break;
      }

      case 'relacion-instituciones-solicitan': {
        let query = supabase
          .from('t_professional_practices')
          .select(`
            PROFESSIONAL_PRACTICE_ID,
            PERIOD_ID,
            CAREER_ID,
            t_institution (INSTITUTION_NAME, RIF, INSTITUTION_TYPE, INSTITUTION_CONTACT),
            t_institution_manager!inner (MANAGER_ID, NAME, SECOND_NAME, SURNAME, SECOND_SURNAME, CONTACT_PHONE),
            t_career (CAREER_NAME)
          `)
          .eq('STATUS', 1);

        if (periodId) query = query.eq('PERIOD_ID', Number(periodId));
        if (careerIds.length > 0) query = query.in('CAREER_ID', careerIds);

        const { data: practices } = await query;

        // If no practices with managers found, try without manager join
        let practicesWithManager = practices || [];
        let practicesWithoutManager: any[] = [];

        if (practicesWithManager.length === 0) {
          // Try query without inner join to get institutions without managers
          let fallbackQuery = supabase
            .from('t_professional_practices')
            .select(`
              PROFESSIONAL_PRACTICE_ID,
              PERIOD_ID,
              CAREER_ID,
              t_institution (INSTITUTION_NAME, RIF, INSTITUTION_TYPE, INSTITUTION_CONTACT),
              t_career (CAREER_NAME)
            `)
            .eq('STATUS', 1);

          if (periodId) fallbackQuery = fallbackQuery.eq('PERIOD_ID', Number(periodId));
          if (careerIds.length > 0) fallbackQuery = fallbackQuery.in('CAREER_ID', careerIds);

          const { data: fallbackPractices } = await fallbackQuery;
          practicesWithoutManager = fallbackPractices || [];
        }

        const periodDesc = await getPeriodDescription(supabase, periodId as string);

        const instMap = new Map<string, {
          empresa: string; rif: string; tipo: string; telefono: string;
          manager: any; carreras: Set<string>; estudiantes: number;
        }>();

        // Process practices with managers (from inner join)
        (practicesWithManager || []).forEach((p: any) => {
          const inst: any = p.t_institution;
          const mgr: any = p.t_institution_manager;
          if (!inst) return;
          const key = inst.INSTITUTION_NAME || 'unknown';
          const carrera = (p.t_career as any)?.CAREER_NAME || '';

          if (!instMap.has(key)) {
            // Phone priority: INSTITUTION_CONTACT → manager CONTACT_PHONE → 'N/A'
            const phone = inst.INSTITUTION_CONTACT || mgr?.CONTACT_PHONE || 'N/A';
            instMap.set(key, {
              empresa: inst.INSTITUTION_NAME || '',
              rif: inst.RIF || '',
              tipo: inst.INSTITUTION_TYPE || '',
              telefono: phone,
              manager: mgr,
              carreras: new Set(),
              estudiantes: 0,
            });
          }
          const entry = instMap.get(key)!;
          entry.carreras.add(carrera);
          entry.estudiantes++;
        });

        // Process practices without managers (from fallback query)
        (practicesWithoutManager || []).forEach((p: any) => {
          const inst: any = p.t_institution;
          if (!inst) return;
          const key = inst.INSTITUTION_NAME || 'unknown';
          const carrera = (p.t_career as any)?.CAREER_NAME || '';

          if (!instMap.has(key)) {
            // No manager: use N/A for responsable, INSTITUTION_CONTACT for phone
            const phone = inst.INSTITUTION_CONTACT || 'N/A';
            instMap.set(key, {
              empresa: inst.INSTITUTION_NAME || '',
              rif: inst.RIF || '',
              tipo: inst.INSTITUTION_TYPE || '',
              telefono: phone,
              manager: null,
              carreras: new Set(),
              estudiantes: 0,
            });
          }
          const entry = instMap.get(key)!;
          entry.carreras.add(carrera);
          entry.estudiantes++;
        });

        const rows = Array.from(instMap.values()).map((e) => {
          const mgr = e.manager;
          const responsable = mgr
            ? `${mgr.NAME || ''} ${mgr.SECOND_NAME || ''} ${mgr.SURNAME || ''} ${mgr.SECOND_SURNAME || ''}`.replace(/\s+/g, ' ').trim()
            : 'N/A';
          const telefono = e.telefono || 'N/A';
          return {
            region: sysLoc.region,
            nucleo: sysLoc.nucleus,
            extension: sysLoc.extension,
            empresa: e.empresa,
            responsable,
            telefonoContacto: telefono,
            tipoEmpresa: e.tipo,
            carreras: Array.from(e.carreras).join(', '),
            cantidadEstudiantes: e.estudiantes,
          };
        });

        workbook = await generateRelacionInstitucionesSolicitanWorkbook(rows, periodDesc);
        break;
      }

      default:
        return res.status(400).json({ message: 'Tipo de reporte inválido' });
    }

    if (!workbook) {
      return res.status(500).json({ message: 'Error al generar el workbook' });
    }

    const fileName = `${type}-${periodId || 'todos'}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    const buffer = await workbook.xlsx.writeBuffer();
    res.send(buffer);

  } catch (error) {
    console.error('[reports] exportReportExcel error:', error);
    res.status(500).json({ message: 'Error al exportar reporte a Excel', error });
  }
};

/**
 * Obtiene la descripción del período académico.
 */
async function getPeriodDescription(supabase: any, periodId?: string): Promise<string> {
  if (!periodId) return 'Período: Todos';
  const { data } = await supabase
    .from('t_internships_period')
    .select('DESCRIPTION')
    .eq('PERIOD_ID', parseInt(periodId))
    .single();
  return `Período: ${data?.DESCRIPTION || periodId}`;
}

export const getRelacionIndividualDocente = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const sysLoc = await getSystemLocation(supabase);
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
                  SECOND_SURNAME, TITULO, CONTACT_PHONE, EMAIL)
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
        region: sysLoc.region,
        nucleo: sysLoc.nucleus,
        extension: sysLoc.extension,
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
          telefono: tutorInst?.CONTACT_PHONE || '',
          correo: tutorInst?.EMAIL || '',
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
