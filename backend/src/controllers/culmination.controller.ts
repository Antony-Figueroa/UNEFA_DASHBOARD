import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';

export interface CulminationRecord {
  id: string;
  studentCi: string;
  studentName: string;
  careerId: number;
  careerName: string;
  institutionId: number;
  institutionName: string;
  period: string;
  practiceType: string;
  startDate: string;
  endDate: string;
  totalHours: number;
  status: 'pending' | 'approved' | 'certified';
  certificateNumber?: string;
  certifiedAt?: string;
}

export const getCulminationRecords = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const { status, period, search } = req.query;

    let query = supabase
      .from('t_enrollment')
      .select(`
        ENROLLMENT_ID,
        PERIOD_ID,
        STUDENT_ID,
        CAREER_ID,
        INSTITUTION_ID,
        PRACTICE_TYPE_ID,
        ENROLLMENT_DATE,
        STATUS,
        t_students!inner(STUDENT_ID, STUDENT_CI, NAME, SURNAME, CAREER_ID),
        t_career(CAREER_ID, CAREER_NAME),
        t_institution(INSTITUTION_ID, INSTITUTION_NAME),
        t_internships_period(PERIOD_ID, DESCRIPTION),
        t_internship_type(INTERNSHIP_TYPE_ID, NAME)
      `)
      .eq('STATUS', 1);

    const { data: enrollments, error } = await query;

    if (error) {
      console.error('Error fetching enrollments:', error);
      res.status(500).json({ message: 'Error al obtener registros' });
      return;
    }

    const { data: trackingData } = await supabase
      .from('t_tracking')
      .select('ENROLLMENT_ID, HOURS_WORKED, TRACKING_DATE')
      .eq('STATUS', 1);

    const hoursMap = new Map<number, { total: number; lastDate: string }>();
    (trackingData || []).forEach((t: any) => {
      const existing = hoursMap.get(t.ENROLLMENT_ID) || { total: 0, lastDate: '' };
      existing.total += t.HOURS_WORKED || 0;
      if (t.TRACKING_DATE > existing.lastDate) {
        existing.lastDate = t.TRACKING_DATE;
      }
      hoursMap.set(t.ENROLLMENT_ID, existing);
    });

    const { data: certificates } = await supabase
      .from('t_auth_log')
      .select('USER_ID, DETAILS, CREATED_AT')
      .eq('ACTION', 'CERTIFICATE_GENERATED');

    const certificateMap = new Map<number, { number: string; date: string }>();
    (certificates || []).forEach((c: any) => {
      const match = c.DETAILS?.match(/Certificado:\s*([A-Z0-9-]+)/);
      if (match) {
        certificateMap.set(c.USER_ID, {
          number: match[1],
          date: c.CREATED_AT
        });
      }
    });

    let records: CulminationRecord[] = (enrollments || []).map((e: any) => {
      const student = Array.isArray(e.t_students) ? e.t_students[0] : e.t_students;
      const career = Array.isArray(e.t_career) ? e.t_career[0] : e.t_career;
      const institution = Array.isArray(e.t_institution) ? e.t_institution[0] : e.t_institution;
      const period = Array.isArray(e.t_internships_period) ? e.t_internships_period[0] : e.t_internships_period;
      const practiceType = Array.isArray(e.t_internship_type) ? e.t_internship_type[0] : e.t_internship_type;
      
      const tracking = hoursMap.get(e.ENROLLMENT_ID) || { total: 0, lastDate: '' };
      const cert = certificateMap.get(student?.STUDENT_ID);
      
      let recordStatus: 'pending' | 'approved' | 'certified' = 'pending';
      if (cert) {
        recordStatus = 'certified';
      } else if (tracking.total >= 360) {
        recordStatus = 'approved';
      }

      return {
        id: String(e.ENROLLMENT_ID),
        studentCi: student?.STUDENT_CI || '',
        studentName: `${student?.NAME || ''} ${student?.SURNAME || ''}`.trim(),
        careerId: career?.CAREER_ID || 0,
        careerName: career?.CAREER_NAME || '',
        institutionId: institution?.INSTITUTION_ID || 0,
        institutionName: institution?.INSTITUTION_NAME || '',
        period: period?.DESCRIPTION || '',
        practiceType: practiceType?.NAME || '',
        startDate: e.ENROLLMENT_DATE || '',
        endDate: tracking.lastDate || '',
        totalHours: tracking.total,
        status: recordStatus,
        certificateNumber: cert?.number,
        certifiedAt: cert?.date
      };
    });

    if (status && status !== 'all') {
      records = records.filter(r => r.status === status);
    }
    if (period) {
      records = records.filter(r => r.period.toLowerCase().includes((period as string).toLowerCase()));
    }
    if (search) {
      const s = (search as string).toLowerCase();
      records = records.filter(r => 
        r.studentName.toLowerCase().includes(s) ||
        r.studentCi.includes(s) ||
        r.institutionName.toLowerCase().includes(s)
      );
    }

    res.json({
      success: true,
      data: records,
      meta: {
        total: records.length,
        pending: records.filter(r => r.status === 'pending').length,
        approved: records.filter(r => r.status === 'approved').length,
        certified: records.filter(r => r.status === 'certified').length
      }
    });

  } catch (error) {
    console.error('Culmination Records Error:', error);
    res.status(500).json({ message: 'Error al obtener registros de culminación', error });
  }
};

export const approveCulmination = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const { enrollmentId } = req.params;
    const userId = (req as any).user?.id;

    const { data: enrollment, error: fetchError } = await supabase
      .from('t_enrollment')
      .select('ENROLLMENT_ID, t_students(STUDENT_ID, NAME, SURNAME)')
      .eq('ENROLLMENT_ID', enrollmentId)
      .single();

    if (fetchError || !enrollment) {
      res.status(404).json({ message: 'Inscripción no encontrada' });
      return;
    }

    const student = Array.isArray(enrollment.t_students) ? enrollment.t_students[0] : enrollment.t_students;

    await supabase
      .from('t_auth_log')
      .insert({
        USER_ID: student?.STUDENT_ID || userId,
        ACTION: 'CULMINATION_APPROVED',
        DETAILS: `Práctica aprobada para inscripción ${enrollmentId}`,
        CREATED_AT: new Date().toISOString()
      });

    res.json({
      success: true,
      message: 'Culminación aprobada exitosamente'
    });

  } catch (error) {
    console.error('Approve Culmination Error:', error);
    res.status(500).json({ message: 'Error al aprobar culminación', error });
  }
};

export const generateCertificate = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const { enrollmentId } = req.params;
    const userId = (req as any).user?.id;

    const { data: enrollment, error: fetchError } = await supabase
      .from('t_enrollment')
      .select(`
        ENROLLMENT_ID,
        t_students(STUDENT_ID, STUDENT_CI, NAME, SURNAME),
        t_career(CAREER_NAME),
        t_institution(INSTITUTION_NAME),
        t_internships_period(DESCRIPTION)
      `)
      .eq('ENROLLMENT_ID', enrollmentId)
      .single();

    if (fetchError || !enrollment) {
      res.status(404).json({ message: 'Inscripción no encontrada' });
      return;
    }

    const student = Array.isArray(enrollment.t_students) ? enrollment.t_students[0] : enrollment.t_students;
    const career = Array.isArray(enrollment.t_career) ? enrollment.t_career[0] : enrollment.t_career;
    const institution = Array.isArray(enrollment.t_institution) ? enrollment.t_institution[0] : enrollment.t_institution;
    const period = Array.isArray(enrollment.t_internships_period) ? enrollment.t_internships_period[0] : enrollment.t_internships_period;

    const year = new Date().getFullYear();
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    const certificateNumber = `CERT-${year}-${random}`;

    await supabase
      .from('t_auth_log')
      .insert({
        USER_ID: student?.STUDENT_ID || userId,
        ACTION: 'CERTIFICATE_GENERATED',
        DETAILS: `Certificado: ${certificateNumber} - Estudiante: ${student?.NAME} ${student?.SURNAME} - Carrera: ${career?.CAREER_NAME} - Institución: ${institution?.INSTITUTION_NAME} - Período: ${period?.DESCRIPTION}`,
        CREATED_AT: new Date().toISOString()
      });

    res.json({
      success: true,
      message: 'Certificado generado exitosamente',
      certificate: {
        number: certificateNumber,
        studentName: `${student?.NAME} ${student?.SURNAME}`,
        studentCi: student?.STUDENT_CI,
        career: career?.CAREER_NAME,
        institution: institution?.INSTITUTION_NAME,
        period: period?.DESCRIPTION,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Generate Certificate Error:', error);
    res.status(500).json({ message: 'Error al generar certificado', error });
  }
};
