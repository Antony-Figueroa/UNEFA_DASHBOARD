import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';
import { PRACTICES_STATUS } from '../constants/practice-status.constants.js';
import { getPersonField, getPersonFullName } from '../utils/person-utils.js';

// ── Tipos ─────────────────────────────────────────────────────────────────

interface CulminationPractice {
  id: string;
  practiceType: string;
  practiceTypeId: number;
  institutionName: string;
  totalHours: number;
  hoursRequired: number;
  evaluationStatus: string;
  finalGrade: number | null;
  result: 'approved' | 'failed' | 'pending';
  culminationStatus: 'pending' | 'approved' | 'certified';
  certificateNumber?: string;
  certifiedAt?: string;
}

interface CulminationGroup {
  studentCi: string;
  studentName: string;
  careerName: string;
  period: string;
  practices: CulminationPractice[];
  overallStatus: 'completed' | 'in_progress';
}

// ── Helpers ────────────────────────────────────────────────────────────────

const getCulminationStatusLabel = (status: number | null): 'pending' | 'approved' | 'certified' => {
  if (status === 1) return 'approved';
  if (status === 2) return 'certified';
  return 'pending';
};

const MINIMUM_GRADE = 10; // nota mínima para aprobar

// ── GET /api/culmination ──────────────────────────────────────────────────

export const getCulminationRecords = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const { status, period, search } = req.query;

    // 1. Obtener prácticas con STATUS=1 y PRACTICES_STATUS IN (INSCRITO, CULMINADO)
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
          INTERNSHIP_TYPE_ID,
          NAME,
          HOURS_REQUIRED
        )
      `)
      .eq('STATUS', 1)
      .in('PRACTICES_STATUS', [PRACTICES_STATUS.INSCRITO, PRACTICES_STATUS.CULMINADO]);

    if (practicesError) {
      console.error('[Culmination] Error fetching practices:', practicesError);
      res.status(500).json({ message: 'Error al obtener prácticas', error: practicesError.message });
      return;
    }

    if (!practices || practices.length === 0) {
      res.json({
        success: true,
        data: [],
        meta: { total: 0, completed: 0, inProgress: 0 }
      });
      return;
    }

    const practiceIds = practices.map((p: any) => p.PROFESSIONAL_PRACTICE_ID);

    // 2. Obtener culminaciones existentes
    const { data: culminations } = await supabase
      .from('t_practice_culmination')
      .select('PRACTICE_ID, STATUS, CERTIFICATE_NUMBER, CERTIFIED_AT')
      .in('PRACTICE_ID', practiceIds);

    const culmMap = new Map<number, any>();
    (culminations || []).forEach((c: any) => {
      culmMap.set(c.PRACTICE_ID, c);
    });

    // 3. Obtener horas totales por práctica
    const { data: visits } = await supabase
      .from('t_practice_visits')
      .select('PROFESSIONAL_PRACTICE_ID, HOURS_WORKED')
      .in('PROFESSIONAL_PRACTICE_ID', practiceIds);

    const hoursMap = new Map<number, number>();
    (visits || []).forEach((v: any) => {
      const current = hoursMap.get(v.PROFESSIONAL_PRACTICE_ID) || 0;
      hoursMap.set(v.PROFESSIONAL_PRACTICE_ID, current + (v.HOURS_WORKED || 0));
    });

    // 4. Armar grupos
    const groupsMap = new Map<string, CulminationGroup>();

    practices.forEach((p: any) => {
      const practiceId = p.PROFESSIONAL_PRACTICE_ID;
      const internshipType = p.t_internship_type || {};
      const hoursRequired = internshipType.HOURS_REQUIRED ?? 360;
      const totalHours = hoursMap.get(practiceId) || 0;
      const culm = culmMap.get(practiceId);

      const culminationStatus = getCulminationStatusLabel(culm?.STATUS ?? null);
      const grade = p.GRADE;

      let result: 'approved' | 'failed' | 'pending' = 'pending';
      if (p.EVALUATION_STATUS === 'completed' && grade != null) {
        result = grade >= MINIMUM_GRADE ? 'approved' : 'failed';
      }

      const practice: CulminationPractice = {
        id: String(practiceId),
        practiceType: internshipType.NAME || '',
        practiceTypeId: internshipType.INTERNSHIP_TYPE_ID || 0,
        institutionName: p.t_institution?.INSTITUTION_NAME || '',
        totalHours,
        hoursRequired,
        evaluationStatus: p.EVALUATION_STATUS || '',
        finalGrade: grade,
        result,
        culminationStatus,
        certificateNumber: culm?.CERTIFICATE_NUMBER || undefined,
        certifiedAt: culm?.CERTIFIED_AT || undefined,
      };

      const studentCi = getPersonField(p.t_persons, 'ci') || '';
      const studentName = getPersonFullName(p.t_persons);
      const careerName = p.t_career?.CAREER_NAME || '';
      const periodDesc = p.t_internships_period?.DESCRIPTION || '';
      const groupKey = `${studentCi}|${periodDesc}`;

      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, {
          studentCi,
          studentName,
          careerName,
          period: periodDesc,
          practices: [],
          overallStatus: 'in_progress',
        });
      }

      groupsMap.get(groupKey)!.practices.push(practice);
    });

    // 5. Calcular overallStatus y convertir a array
    let groups = Array.from(groupsMap.values()).map(g => ({
      ...g,
      overallStatus: g.practices.every(p => p.culminationStatus === 'certified')
        ? 'completed' as const
        : 'in_progress' as const,
    }));

    // 6. Aplicar filtros
    if (status && status !== 'all') {
      groups = groups.filter(g => g.overallStatus === status);
    }
    if (period) {
      groups = groups.filter(g =>
        g.period.toLowerCase().includes((period as string).toLowerCase())
      );
    }
    if (search) {
      const s = (search as string).toLowerCase();
      groups = groups.filter(g =>
        g.studentName.toLowerCase().includes(s) ||
        g.studentCi.toLowerCase().includes(s)
      );
    }

    res.json({
      success: true,
      data: groups,
      meta: {
        total: groups.length,
        completed: groups.filter(g => g.overallStatus === 'completed').length,
        inProgress: groups.filter(g => g.overallStatus === 'in_progress').length,
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

// ── POST /api/culmination/:practiceId/approve ────────────────────────────

export const approveCulmination = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const { practiceId } = req.params;

    // 1. Obtener práctica con tipo
    const { data: practice, error: fetchError } = await supabase
      .from('t_professional_practices')
      .select(`
        PROFESSIONAL_PRACTICE_ID,
        t_internship_type (
          HOURS_REQUIRED
        )
      `)
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
      .single();

    if (fetchError || !practice) {
      res.status(404).json({ message: 'Práctica no encontrada' });
      return;
    }

    const hoursRequired = (practice as any).t_internship_type?.HOURS_REQUIRED ?? 360;

    // 2. Calcular horas totales
    const { data: visits } = await supabase
      .from('t_practice_visits')
      .select('HOURS_WORKED')
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId);

    const totalHours = (visits || []).reduce((sum: number, v: any) => sum + (v.HOURS_WORKED || 0), 0);

    // 3. Validar horas mínimas
    if (totalHours < hoursRequired) {
      res.status(400).json({
        message: `El estudiante no ha completado las horas requeridas (${totalHours}/${hoursRequired})`
      });
      return;
    }

    // 4. Upsert en t_practice_culmination
    const { data: existing } = await supabase
      .from('t_practice_culmination')
      .select('PRACTICE_ID')
      .eq('PRACTICE_ID', practiceId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('t_practice_culmination')
        .update({ STATUS: 1 })
        .eq('PRACTICE_ID', practiceId);
    } else {
      await supabase
        .from('t_practice_culmination')
        .insert({ PRACTICE_ID: practiceId, STATUS: 1 });
    }

    // 5. Actualizar PRACTICES_STATUS
    await supabase
      .from('t_professional_practices')
      .update({ PRACTICES_STATUS: PRACTICES_STATUS.CULMINADO })
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId);

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

// ── POST /api/culmination/:practiceId/certificate ─────────────────────────

export const generateCertificate = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const { practiceId } = req.params;

    // 1. Leer culminación
    const { data: culm, error: culmError } = await supabase
      .from('t_practice_culmination')
      .select('PRACTICE_ID, STATUS')
      .eq('PRACTICE_ID', practiceId)
      .maybeSingle();

    if (culmError || !culm) {
      res.status(404).json({ message: 'Culminación no encontrada. Apruebe la práctica primero.' });
      return;
    }

    // 2. Verificar STATUS=1 (approved)
    if (culm.STATUS !== 1) {
      res.status(409).json({
        message: culm.STATUS === 2
          ? 'El certificado ya fue generado previamente'
          : 'La culminación debe estar aprobada antes de generar el certificado'
      });
      return;
    }

    // 3. Obtener datos del estudiante para el certificado
    const { data: practice } = await supabase
      .from('t_professional_practices')
      .select(`
        PROFESSIONAL_PRACTICE_ID,
        GRADE,
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
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
      .single();

    if (!practice) {
      res.status(404).json({ message: 'Práctica no encontrada' });
      return;
    }

    const studentName = getPersonFullName((practice as any).t_persons);

    // 4. Generar número de certificado
    const year = new Date().getFullYear();
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    const certificateNumber = `CERT-${year}-${random}`;

    // 5. Actualizar culminación
    await supabase
      .from('t_practice_culmination')
      .update({
        STATUS: 2,
        CERTIFICATE_NUMBER: certificateNumber,
        CERTIFIED_AT: new Date().toISOString()
      })
      .eq('PRACTICE_ID', practiceId);

    res.json({
      success: true,
      message: 'Certificado generado exitosamente',
      certificate: {
        number: certificateNumber,
        studentName,
        studentCi: getPersonField((practice as any).t_persons, 'ci') || '',
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
