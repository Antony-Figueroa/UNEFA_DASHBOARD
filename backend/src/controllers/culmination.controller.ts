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

    const { data: practices, error: practicesError } = await supabase
      .from('t_professional_practices')
      .select(`
        PROFESSIONAL_PRACTICE_ID,
        START_DATE,
        END_DATE,
        GRADE,
        PRACTICES_STATUS,
        EVALUATION_STATUS,
        PERIOD_ID,
        INSTITUTION_ID,
        STUDENTS_ID,
        INTERNSHIP_TYPE_ID,
        STATUS,
        t_persons!inner (
          ci,
          first_name,
          middle_name,
          last_name,
          second_last_name
        ),
        t_career (
          CAREER_NAME
        ),
        t_institution (
          INSTITUTION_NAME
        ),
        t_internships_period (
          DESCRIPTION
        ),
        t_internship_type (
          NAME
        )
      `)
      .eq('STATUS', 1);

    if (practicesError) {
      console.error('[Culmination] Error fetching practices:', practicesError);
      res.status(500).json({ message: 'Error al obtener prácticas', error: practicesError.message });
      return;
    }

    if (!practices || practices.length === 0) {
      res.json({
        success: true,
        data: [],
        meta: { total: 0, pending: 0, approved: 0, certified: 0 }
      });
      return;
    }

    const practiceIds = practices.map((p: any) => p.PROFESSIONAL_PRACTICE_ID);

    const { data: tracking } = await supabase
      .from('t_tracking')
      .select('PROFESSIONAL_PRACTICE_ID, HOURS_WORKED, TRACKING_DATE')
      .eq('STATUS', 1)
      .in('PROFESSIONAL_PRACTICE_ID', practiceIds);

    const hoursMap = new Map<number, { total: number; lastDate: string }>();
    (tracking || []).forEach((t: any) => {
      const existing = hoursMap.get(t.PROFESSIONAL_PRACTICE_ID) || { total: 0, lastDate: '' };
      existing.total += t.HOURS_WORKED || 0;
      if (t.TRACKING_DATE && (!existing.lastDate || t.TRACKING_DATE > existing.lastDate)) {
        existing.lastDate = t.TRACKING_DATE;
      }
      hoursMap.set(t.PROFESSIONAL_PRACTICE_ID, existing);
    });

    let records: CulminationRecord[] = practices.map((p: any) => {
      const student = p.t_persons;
      const career = p.t_career;
      const trackingData = hoursMap.get(p.PROFESSIONAL_PRACTICE_ID) || { total: 0, lastDate: '' };
      
      const studentName = student 
        ? `${student.first_name || ''} ${student.middle_name || ''} ${student.last_name || ''} ${student.second_last_name || ''}`.trim().replace(/\s+/g, ' ')
        : '';

      let recordStatus: 'pending' | 'approved' | 'certified' = 'pending';
      if (p.EVALUATION_STATUS === 'completed' && p.GRADE && p.GRADE > 0) {
        recordStatus = 'approved';
      } else if (trackingData.total >= 360) {
        recordStatus = 'approved';
      }

      return {
        id: String(p.PROFESSIONAL_PRACTICE_ID),
        studentCi: student?.ci || '',
        studentName,
        careerName: career?.CAREER_NAME || '',
        institutionName: p.t_institution?.INSTITUTION_NAME || '',
        period: p.t_internships_period?.DESCRIPTION || '',
        practiceType: p.t_internship_type?.NAME || '',
        startDate: p.START_DATE || '',
        endDate: p.END_DATE || trackingData.lastDate || '',
        totalHours: trackingData.total,
        status: recordStatus
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
        r.studentCi.toLowerCase().includes(s) ||
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
    const userId = (req as any).user?.userId;

    const { data: practice, error: fetchError } = await supabase
      .from('t_professional_practices')
      .select('PROFESSIONAL_PRACTICE_ID, STUDENTS_ID')
      .eq('PROFESSIONAL_PRACTICE_ID', enrollmentId)
      .single();

    if (fetchError || !practice) {
      res.status(404).json({ message: 'Práctica no encontrada' });
      return;
    }

    const { error: updateError } = await supabase
      .from('t_professional_practices')
      .update({ PRACTICES_STATUS: 3 })
      .eq('PROFESSIONAL_PRACTICE_ID', enrollmentId);

    if (updateError) {
      console.error('[Culmination] Error updating practice:', updateError);
      res.status(500).json({ message: 'Error al aprobar práctica' });
      return;
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

    const { data: practice, error: fetchError } = await supabase
      .from('t_professional_practices')
      .select(`
        PROFESSIONAL_PRACTICE_ID,
        GRADE,
        START_DATE,
        END_DATE,
        t_persons!inner (
          ci,
          first_name,
          middle_name,
          last_name,
          second_last_name
        ),
        t_career ( CAREER_NAME ),
        t_institution ( INSTITUTION_NAME ),
        t_internships_period ( DESCRIPTION )
      `)
      .eq('PROFESSIONAL_PRACTICE_ID', enrollmentId)
      .single();

    if (fetchError || !practice) {
      res.status(404).json({ message: 'Práctica no encontrada' });
      return;
    }

    const student = (practice as any).t_persons;
    const studentName = student 
      ? `${student.first_name || ''} ${student.middle_name || ''} ${student.last_name || ''} ${student.second_last_name || ''}`.trim().replace(/\s+/g, ' ')
      : '';

    const year = new Date().getFullYear();
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    const certificateNumber = `CERT-${year}-${random}`;

    res.json({
      success: true,
      message: 'Certificado generado exitosamente',
      certificate: {
        number: certificateNumber,
        studentName,
        studentCi: student?.ci || '',
        career: (practice as any).t_career?.CAREER_NAME || '',
        institution: (practice as any).t_institution?.INSTITUTION_NAME || '',
        period: (practice as any).t_internships_period?.DESCRIPTION || '',
        grade: (practice as any).GRADE,
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
