import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';

export interface CulminationRecord {
  id: string;
  studentCi: string;
  studentName: string;
  careerName: string;
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

    // 1. Obtener inscripciones activas
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('t_enrollment')
      .select('*')
      .eq('STATUS', 1);

    if (enrollmentError) {
      console.error('[Culmination] Error fetching enrollments:', enrollmentError);
      res.status(500).json({ message: 'Error al obtener inscripciones', error: enrollmentError.message });
      return;
    }

    if (!enrollments || enrollments.length === 0) {
      res.json({
        success: true,
        data: [],
        meta: { total: 0, pending: 0, approved: 0, certified: 0 }
      });
      return;
    }

    // 2. Obtener IDs únicos para consultas relacionadas
    const studentIds = [...new Set(enrollments.map((e: any) => e.STUDENT_ID).filter(Boolean))];
    const careerIds = [...new Set(enrollments.map((e: any) => e.CAREER_ID).filter(Boolean))];
    const institutionIds = [...new Set(enrollments.map((e: any) => e.INSTITUTION_ID).filter(Boolean))];
    const periodIds = [...new Set(enrollments.map((e: any) => e.PERIOD_ID).filter(Boolean))];
    const practiceTypeIds = [...new Set(enrollments.map((e: any) => e.PRACTICE_TYPE_ID).filter(Boolean))];
    const enrollmentIds = enrollments.map((e: any) => e.ENROLLMENT_ID);

    // 3. Consultas en paralelo
    const [
      studentsResult,
      careersResult,
      institutionsResult,
      periodsResult,
      practiceTypesResult,
      trackingResult,
      certificatesResult
    ] = await Promise.all([
      studentIds.length > 0 
        ? supabase.from('t_students').select('STUDENT_ID, STUDENT_CI, NAME, SURNAME').in('STUDENT_ID', studentIds)
        : { data: [], error: null },
      careerIds.length > 0
        ? supabase.from('t_career').select('CAREER_ID, CAREER_NAME').in('CAREER_ID', careerIds)
        : { data: [], error: null },
      institutionIds.length > 0
        ? supabase.from('t_institution').select('INSTITUTION_ID, INSTITUTION_NAME').in('INSTITUTION_ID', institutionIds)
        : { data: [], error: null },
      periodIds.length > 0
        ? supabase.from('t_internships_period').select('PERIOD_ID, DESCRIPTION').in('PERIOD_ID', periodIds)
        : { data: [], error: null },
      practiceTypeIds.length > 0
        ? supabase.from('t_internship_type').select('INTERNSHIP_TYPE_ID, NAME').in('INTERNSHIP_TYPE_ID', practiceTypeIds)
        : { data: [], error: null },
      enrollmentIds.length > 0
        ? supabase.from('t_tracking').select('ENROLLMENT_ID, HOURS_WORKED, TRACKING_DATE').eq('STATUS', 1).in('ENROLLMENT_ID', enrollmentIds)
        : { data: [], error: null },
      supabase.from('t_auth_log').select('USER_ID, DETAILS, CREATED_AT').eq('ACTION', 'CERTIFICATE_GENERATED')
    ]);

    // 4. Crear mapas para acceso rápido
    const studentsMap = new Map((studentsResult.data || []).map((s: any) => [s.STUDENT_ID, s]));
    const careersMap = new Map((careersResult.data || []).map((c: any) => [c.CAREER_ID, c]));
    const institutionsMap = new Map((institutionsResult.data || []).map((i: any) => [i.INSTITUTION_ID, i]));
    const periodsMap = new Map((periodsResult.data || []).map((p: any) => [p.PERIOD_ID, p]));
    const practiceTypesMap = new Map((practiceTypesResult.data || []).map((pt: any) => [pt.INTERNSHIP_TYPE_ID, pt]));

    // 5. Calcular horas por inscripción
    const hoursMap = new Map<number, { total: number; lastDate: string }>();
    (trackingResult.data || []).forEach((t: any) => {
      const existing = hoursMap.get(t.ENROLLMENT_ID) || { total: 0, lastDate: '' };
      existing.total += t.HOURS_WORKED || 0;
      if (t.TRACKING_DATE && (!existing.lastDate || t.TRACKING_DATE > existing.lastDate)) {
        existing.lastDate = t.TRACKING_DATE;
      }
      hoursMap.set(t.ENROLLMENT_ID, existing);
    });

    // 6. Crear mapa de certificados
    const certificateMap = new Map<number, { number: string; date: string }>();
    (certificatesResult.data || []).forEach((c: any) => {
      const match = c.DETAILS?.match(/Certificado:\s*([A-Z0-9-]+)/);
      if (match && c.USER_ID) {
        certificateMap.set(c.USER_ID, {
          number: match[1],
          date: c.CREATED_AT
        });
      }
    });

    // 7. Construir registros
    let records: CulminationRecord[] = enrollments.map((e: any) => {
      const student = studentsMap.get(e.STUDENT_ID);
      const career = careersMap.get(e.CAREER_ID);
      const institution = institutionsMap.get(e.INSTITUTION_ID);
      const periodData = periodsMap.get(e.PERIOD_ID);
      const practiceType = practiceTypesMap.get(e.PRACTICE_TYPE_ID);
      const tracking = hoursMap.get(e.ENROLLMENT_ID) || { total: 0, lastDate: '' };
      const cert = student ? certificateMap.get(student.STUDENT_ID) : null;

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
        careerName: career?.CAREER_NAME || '',
        institutionName: institution?.INSTITUTION_NAME || '',
        period: periodData?.DESCRIPTION || '',
        practiceType: practiceType?.NAME || '',
        startDate: e.ENROLLMENT_DATE || '',
        endDate: tracking.lastDate || '',
        totalHours: tracking.total,
        status: recordStatus,
        certificateNumber: cert?.number,
        certifiedAt: cert?.date
      };
    });

    // 8. Aplicar filtros
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
        r.studentCi.toLowerCase().includes(s) ||
        r.institutionName.toLowerCase().includes(s)
      );
    }

    // 9. Responder
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
    console.error('[Culmination] Unexpected error:', error);
    res.status(500).json({
      message: 'Error al obtener registros de culminación',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const approveCulmination = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const { enrollmentId } = req.params;
    const userId = (req as any).user?.id;

    // Obtener la inscripción
    const { data: enrollment, error: fetchError } = await supabase
      .from('t_enrollment')
      .select('ENROLLMENT_ID, STUDENT_ID')
      .eq('ENROLLMENT_ID', enrollmentId)
      .single();

    if (fetchError || !enrollment) {
      res.status(404).json({ message: 'Inscripción no encontrada' });
      return;
    }

    // Registrar la aprobación
    const { error: logError } = await supabase
      .from('t_auth_log')
      .insert({
        USER_ID: (enrollment as any).STUDENT_ID || userId,
        ACTION: 'CULMINATION_APPROVED',
        DETAILS: `Práctica aprobada para inscripción ${enrollmentId}`,
        CREATED_AT: new Date().toISOString()
      });

    if (logError) {
      console.error('[Culmination] Error logging approval:', logError);
    }

    res.json({
      success: true,
      message: 'Culminación aprobada exitosamente'
    });

  } catch (error) {
    console.error('[Culmination] Approve error:', error);
    res.status(500).json({
      message: 'Error al aprobar culminación',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const generateCertificate = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const { enrollmentId } = req.params;
    const userId = (req as any).user?.id;

    // Obtener datos de la inscripción
    const { data: enrollment, error: fetchError } = await supabase
      .from('t_enrollment')
      .select('*')
      .eq('ENROLLMENT_ID', enrollmentId)
      .single();

    if (fetchError || !enrollment) {
      res.status(404).json({ message: 'Inscripción no encontrada' });
      return;
    }

    // Obtener datos relacionados
    const studentId = (enrollment as any).STUDENT_ID;
    const careerId = (enrollment as any).CAREER_ID;
    const institutionId = (enrollment as any).INSTITUTION_ID;
    const periodId = (enrollment as any).PERIOD_ID;

    const [studentRes, careerRes, institutionRes, periodRes] = await Promise.all([
      studentId ? supabase.from('t_students').select('STUDENT_ID, STUDENT_CI, NAME, SURNAME').eq('STUDENT_ID', studentId).single() : { data: null },
      careerId ? supabase.from('t_career').select('CAREER_NAME').eq('CAREER_ID', careerId).single() : { data: null },
      institutionId ? supabase.from('t_institution').select('INSTITUTION_NAME').eq('INSTITUTION_ID', institutionId).single() : { data: null },
      periodId ? supabase.from('t_internships_period').select('DESCRIPTION').eq('PERIOD_ID', periodId).single() : { data: null }
    ]);

    const student = studentRes.data as any;
    const career = careerRes.data as any;
    const institution = institutionRes.data as any;
    const period = periodRes.data as any;

    // Generar número de certificado
    const year = new Date().getFullYear();
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    const certificateNumber = `CERT-${year}-${random}`;

    // Registrar el certificado
    const { error: logError } = await supabase
      .from('t_auth_log')
      .insert({
        USER_ID: student?.STUDENT_ID || userId,
        ACTION: 'CERTIFICATE_GENERATED',
        DETAILS: `Certificado: ${certificateNumber} - Estudiante: ${student?.NAME || ''} ${student?.SURNAME || ''} - Carrera: ${career?.CAREER_NAME || ''} - Institución: ${institution?.INSTITUTION_NAME || ''} - Período: ${period?.DESCRIPTION || ''}`,
        CREATED_AT: new Date().toISOString()
      });

    if (logError) {
      console.error('[Culmination] Error logging certificate:', logError);
    }

    res.json({
      success: true,
      message: 'Certificado generado exitosamente',
      certificate: {
        number: certificateNumber,
        studentName: `${student?.NAME || ''} ${student?.SURNAME || ''}`.trim(),
        studentCi: student?.STUDENT_CI || '',
        career: career?.CAREER_NAME || '',
        institution: institution?.INSTITUTION_NAME || '',
        period: period?.DESCRIPTION || '',
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Culmination] Certificate generation error:', error);
    res.status(500).json({
      message: 'Error al generar certificado',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
