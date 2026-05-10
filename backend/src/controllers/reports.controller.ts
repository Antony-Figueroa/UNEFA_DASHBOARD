import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';

export const getReportsStats = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const period = req.query.period as string || '';

    const [
      { count: activeStudents },
      { count: totalEnrollments },
      { data: activeTrackings },
      { data: authLogs }
    ] = await Promise.all([
      supabase.from('t_students').select('*', { count: 'exact', head: true }).eq('STATUS', 1),
      supabase.from('t_enrollment').select('*', { count: 'exact', head: true }).eq('STATUS', 1),
      supabase.from('t_tracking').select('TRACKING_ID').eq('STATUS', 1),
      supabase.from('t_auth_log').select('ACTION')
    ]);

    const trackingCount = activeTrackings?.length || 0;
    const certifiedCount = authLogs?.filter((log: any) => log.ACTION === 'CERTIFICATE_GENERATED').length || 0;

    res.json({
      metrics: [
        { label: 'Estudiantes Activos', value: activeStudents || 0, change: 12, trend: 'up' },
        { label: 'Inscripciones del Período', value: totalEnrollments || 0, change: -3, trend: 'down' },
        { label: 'Prácticas en Curso', value: trackingCount, change: 8, trend: 'up' },
        { label: 'Certificados Emitidos', value: certifiedCount, change: 15, trend: 'up' }
      ]
    });

  } catch (error) {
    console.error('Reports Stats Error:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas de reportes', error });
  }
};

export const getStudentsByCareer = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();

    const { data: students, count: totalActive } = await supabase
      .from('t_students')
      .select('CAREER_ID, t_career(CAREER_NAME, CAREER_ABBREVIATION)')
      .eq('STATUS', 1);

    const careerMap = new Map<string, { name: string; abbreviation: string; count: number }>();

    interface StudentWithCareer {
      CAREER_ID: number;
      t_career: { CAREER_NAME: string; CAREER_ABBREVIATION: string } | { CAREER_NAME: string; CAREER_ABBREVIATION: string }[] | null;
    }

    (students as unknown as StudentWithCareer[])?.forEach((s) => {
      const careerInfo = Array.isArray(s.t_career) ? s.t_career[0] : s.t_career;
      const name = careerInfo?.CAREER_NAME || 'Desconocida';
      const abbreviation = careerInfo?.CAREER_ABBREVIATION || 'N/A';
      const key = `${name}|${abbreviation}`;
      
      if (careerMap.has(key)) {
        careerMap.get(key)!.count++;
      } else {
        careerMap.set(key, { name, abbreviation, count: 1 });
      }
    });

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    const result = Array.from(careerMap.values())
      .map((c, i) => ({
        label: c.abbreviation || c.name,
        fullName: c.name,
        value: c.count,
        color: colors[i % colors.length],
        percentage: totalActive ? Math.round((c.count / totalActive) * 100) : 0
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
      .from('t_enrollment')
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
      .select('AUTH_LOG_ID, USER_ID, ACTION, DETAILS, CREATED_AT, t_user(USER_CI, NAME, SURNAME)')
      .in('ACTION', ['REPORT_GENERATED', 'PDF_EXPORTED', 'CERTIFICATE_GENERATED'])
      .order('CREATED_AT', { ascending: false })
      .limit(10);

    interface LogWithUser {
      AUTH_LOG_ID: number;
      USER_ID: number;
      ACTION: string;
      DETAILS: string;
      CREATED_AT: string;
      t_user: { USER_CI: string; NAME: string; SURNAME: string } | null;
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
        user: log.t_user ? `${log.t_user.NAME} ${log.t_user.SURNAME}` : 'Sistema'
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
    const { periodId, careerId } = req.query;
    const supabase = dbManager.getConnection();

    const { data: tutorPractices, error } = await supabase
      .from('t_professional_practices_tutor')
      .select(`
        TUTOR_ID,
        TUTOR_TYPE,
        t_tutors (
          TUTOR_ID,
          NAME,
          SECOND_NAME,
          SURNAME,
          SECOND_SURNAME,
          TUTOR_CI,
          CONDITION,
          DEDICATION,
          CATEGORY,
          CONTACT_PHONE,
          EMAIL
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

      const tutorKey = tutor.TUTOR_ID;

      if (tutorMap.has(tutorKey)) {
        tutorMap.get(tutorKey)!.studentCount++;
      } else {
        tutorMap.set(tutorKey, {
          tutor: {
            name: tutor.NAME,
            secondName: tutor.SECOND_NAME || '',
            surname: tutor.SURNAME,
            secondSurname: tutor.SECOND_SURNAME || '',
            ci: tutor.TUTOR_CI,
            condition: tutor.CONDITION,
            dedication: tutor.DEDICATION,
            category: tutor.CATEGORY,
            phone: tutor.CONTACT_PHONE,
            email: tutor.EMAIL
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

    res.json({
      success: true,
      data: reportData,
      meta: {
        total: reportData.length,
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
    const { periodId, careerId } = req.query;
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

    res.json({
      success: true,
      data: reportData,
      meta: {
        total: reportData.length
      }
    });

  } catch (error) {
    console.error('Resumen Pasantias Report Error:', error);
    res.status(500).json({ message: 'Error al obtener reporte de resumen pasantias', error });
  }
};

export const getCulminatedStudentsReport = async (req: Request, res: Response) => {
  try {
    const { periodId, careerId, status, institutionId } = req.query;
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
        t_students (
          STUDENTS_CI,
          NAME,
          SECOND_NAME,
          SURNAME,
          SECOND_SURNAME
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
            NAME,
            SECOND_NAME,
            SURNAME,
            SECOND_SURNAME
          )
        )
      `)
      .eq('STATUS', 1)
      .eq('PRACTICES_STATUS', 3);

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

    const { data: tracking } = await supabase
      .from('t_tracking')
      .select('PROFESSIONAL_PRACTICE_ID, TOTAL_HOURS')
      .in('PROFESSIONAL_PRACTICE_ID', practiceIds);

    const hoursMap = new Map<number, number>();
    (tracking || []).forEach((t: any) => {
      hoursMap.set(t.PROFESSIONAL_PRACTICE_ID, t.TOTAL_HOURS || 0);
    });

    let filteredPractices = practices.filter((p: any) => {
      if (periodId && p.PERIOD_ID !== Number(periodId)) return false;
      if (careerId && p.t_career?.CAREER_ID !== Number(careerId)) return false;
      if (institutionId && p.INSTITUTION_ID !== Number(institutionId)) return false;
      return true;
    });

    const reportData: CulminatedStudentReportRow[] = filteredPractices.map((p: any) => {
      const tutor = p.t_professional_practices_tutor?.[0]?.t_tutors;
      const student = p.t_students;
      
      return {
        id: p.PROFESSIONAL_PRACTICE_ID,
        studentCi: student?.STUDENTS_CI || '',
        studentName: `${student?.NAME || ''} ${student?.SECOND_NAME || ''} ${student?.SURNAME || ''} ${student?.SECOND_SURNAME || ''}`.trim(),
        careerName: p.t_career?.CAREER_NAME || '',
        institutionName: p.t_institution?.INSTITUTION_NAME || '',
        practiceType: p.t_internship_type?.NAME || '',
        tutorName: tutor ? `${tutor.NAME || ''} ${tutor.SECOND_NAME || ''} ${tutor.SURNAME || ''} ${tutor.SECOND_SURNAME || ''}`.trim() : '',
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

    if (status && status !== 'all') {
      reportData.filter(r => r.status === status);
    }

    res.json({
      success: true,
      data: reportData,
      meta: {
        total: reportData.length
      }
    });

  } catch (error) {
    console.error('Culminated Students Report Error:', error);
    res.status(500).json({ message: 'Error al obtener reporte de estudiantes culminados', error });
  }
};
