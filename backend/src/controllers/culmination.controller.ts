import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { dbManager } from '../lib/db-manager.js';
import { PRACTICES_STATUS } from '../constants/practice-status.constants.js';
import { getPersonField, getPersonFullName } from '../utils/person-utils.js';
import { checkSequentialPrerequisite } from '../utils/sequential-validation.js';

// ── Tipos ─────────────────────────────────────────────────────────────────

interface ReversalInfo {
  reason: string;
  resolutionNumber: string;
  createdAt: string;
}

interface CulminationPractice {
  id: string;
  practiceType: string;
  practiceTypeId: number;
  institutionName: string;
  totalHours: number;
  hoursRequired: number;
  evaluationStatus: string;
  finalGrade: number | null;
  isFrozen: boolean;
  result: 'approved' | 'failed' | 'pending';
  culminationStatus: 'pending' | 'approved' | 'certified';
  certificateNumber?: string;
  certifiedAt?: string;
  reversal?: ReversalInfo;
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
        FROZEN_AT,
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
      .in('PRACTICES_STATUS', [PRACTICES_STATUS.INSCRITO, PRACTICES_STATUS.CULMINADO, PRACTICES_STATUS.REPROBADO]);

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

    // 2b. Obtener reversals activos
    const { data: reversals } = await supabase
      .from('t_culmination_reversals')
      .select('PROFESSIONAL_PRACTICE_ID, REASON, RESOLUTION_NUMBER, CREATED_AT')
      .in('PROFESSIONAL_PRACTICE_ID', practiceIds)
      .eq('STATUS', 1);

    const reversalMap = new Map<number, any>();
    (reversals || []).forEach((r: any) => {
      reversalMap.set(r.PROFESSIONAL_PRACTICE_ID, r);
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

      const rev = reversalMap.get(practiceId);

      const practice: CulminationPractice = {
        id: String(practiceId),
        practiceType: internshipType.NAME || '',
        practiceTypeId: internshipType.INTERNSHIP_TYPE_ID || 0,
        institutionName: p.t_institution?.INSTITUTION_NAME || '',
        totalHours,
        hoursRequired,
        evaluationStatus: p.EVALUATION_STATUS || '',
        finalGrade: grade,
        isFrozen: !!p.FROZEN_AT,
        result,
        culminationStatus,
        certificateNumber: culm?.CERTIFICATE_NUMBER || undefined,
        certifiedAt: culm?.CERTIFIED_AT || undefined,
        reversal: rev ? {
          reason: rev.REASON,
          resolutionNumber: rev.RESOLUTION_NUMBER,
          createdAt: rev.CREATED_AT,
        } : undefined,
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
    const { overrideHours, overrideReason } = req.body as { overrideHours?: boolean; overrideReason?: string };

    // 1. Obtener práctica con tipo y estado de evaluación
    const { data: practice, error: fetchError } = await supabase
      .from('t_professional_practices')
      .select(`
        PROFESSIONAL_PRACTICE_ID,
        STUDENTS_ID,
        CAREER_ID,
        INTERNSHIP_TYPE_ID,
        PRACTICES_STATUS,
        EVALUATION_STATUS,
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

    // Solo se puede culminar una práctica en estado INSCRITO
    if ((practice as any).PRACTICES_STATUS !== PRACTICES_STATUS.INSCRITO) {
      res.status(400).json({
        message: 'Solo se pueden culminar prácticas en estado INSCRITO.'
      });
      return;
    }

    // 2. Validar que las evaluaciones estén completas
    //    NOTA: horas validation eliminada (spec culmination R2.1 — modelo Enfermería)
    if ((practice as any).EVALUATION_STATUS !== 'completed') {
      res.status(400).json({
        message: 'No se puede culminar la práctica: las evaluaciones no están completas.'
      });
      return;
    }

    // 3. Validar prerrequisito secuencial (ej: HOSP debe estar culminado antes de culminar COM)
    const seqCheck = await checkSequentialPrerequisite(supabase, { practiceId: parseInt(practiceId) });
    if (!seqCheck.valid) {
      res.status(400).json({ message: seqCheck.message });
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

    // ── 0. Get practice with internship type and PRIORITY ──
    const { data: practice } = await supabase
      .from('t_professional_practices')
      .select(`
        PROFESSIONAL_PRACTICE_ID,
        GRADE,
        FROZEN_AT,
        PREVIOUS_PRACTICE_ID,
        STUDENTS_ID,
        CAREER_ID,
        INTERNSHIP_TYPE_ID,
        t_internship_type ( PRIORITY ),
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

    const priority = (practice as any).t_internship_type?.PRIORITY ?? 0;

    // ── ÚNICA guard (PRIORITY = 0) — single practice flow ──
    if (priority === 0) {
      // Read culmination for single practice
      const { data: culm, error: culmError } = await supabase
        .from('t_practice_culmination')
        .select('PRACTICE_ID, STATUS')
        .eq('PRACTICE_ID', practiceId)
        .maybeSingle();

      if (culmError || !culm) {
        res.status(404).json({ message: 'Culminación no encontrada. Apruebe la práctica primero.' });
        return;
      }

      if (culm.STATUS !== 1) {
        res.status(409).json({
          message: culm.STATUS === 2
            ? 'El certificado ya fue generado previamente'
            : 'La culminación debe estar aprobada antes de generar el certificado'
        });
        return;
      }

      const studentName = getPersonFullName((practice as any).t_persons);

      // Generate certificate number
      const year = new Date().getFullYear();
      const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
      const certificateNumber = `CERT-${year}-${random}`;

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
          generatedAt: new Date().toISOString(),
          isJoint: false,
          practiceId: parseInt(practiceId),
          practiceType: 'ÚNICA'
        }
      });
      return;
    }

    // ── Sequential practices (PRIORITY > 0) — joint cert logic ──

    // Find sibling practice:
    // For COM → HOSP: follow PREVIOUS_PRACTICE_ID
    // For HOSP → COM: find practice that has PREVIOUS_PRACTICE_ID pointing to this one
    let siblingPracticeId: number | null = null;

    if ((practice as any).PREVIOUS_PRACTICE_ID) {
      // This is COM → HOSP
      siblingPracticeId = (practice as any).PREVIOUS_PRACTICE_ID;
    } else {
      // This is HOSP or other — find COM that points to this
      const { data: childPractice } = await supabase
        .from('t_professional_practices')
        .select('PROFESSIONAL_PRACTICE_ID')
        .eq('PREVIOUS_PRACTICE_ID', parseInt(practiceId))
        .eq('STUDENTS_ID', (practice as any).STUDENTS_ID)
        .eq('STATUS', 1)
        .limit(1)
        .maybeSingle();

      if (childPractice) {
        siblingPracticeId = childPractice.PROFESSIONAL_PRACTICE_ID;
      }
    }

    if (!siblingPracticeId) {
      res.status(400).json({
        message: 'No se encontró la práctica complementaria para el certificado conjunto. Verifique que PREVIOUS_PRACTICE_ID esté configurado.'
      });
      return;
    }

    // Read culminations for BOTH practices
    const sourceCulmPromise = supabase
      .from('t_practice_culmination')
      .select('PRACTICE_ID, STATUS')
      .eq('PRACTICE_ID', practiceId)
      .maybeSingle();

    const siblingCulmPromise = supabase
      .from('t_practice_culmination')
      .select('PRACTICE_ID, STATUS')
      .eq('PRACTICE_ID', siblingPracticeId)
      .maybeSingle();

    const [sourceCulmResult, siblingCulmResult] = await Promise.all([sourceCulmPromise, siblingCulmPromise]);

    const sourceCulm = sourceCulmResult.data;
    const siblingCulm = siblingCulmResult.data;

    if (!sourceCulm || !siblingCulm) {
      res.status(400).json({
        message: 'Ambas prácticas deben estar culminadas para generar el certificado conjunto.'
      });
      return;
    }

    if (sourceCulm.STATUS !== 1 || siblingCulm.STATUS !== 1) {
      res.status(409).json({
        message: sourceCulm.STATUS === 2 || siblingCulm.STATUS === 2
          ? 'El certificado ya fue generado previamente para una de las prácticas'
          : 'Ambas prácticas deben estar aprobadas y congeladas para generar el certificado'
      });
      return;
    }

    // Get sibling practice data for freeze check
    const { data: siblingPractice } = await supabase
      .from('t_professional_practices')
      .select('FROZEN_AT, GRADE')
      .eq('PROFESSIONAL_PRACTICE_ID', siblingPracticeId)
      .single();

    // Verify BOTH practices are frozen
    if (!(practice as any).FROZEN_AT || !(siblingPractice as any)?.FROZEN_AT) {
      const notFrozenId = !(practice as any).FROZEN_AT ? practiceId : siblingPracticeId;
      res.status(400).json({
        message: `La práctica ${notFrozenId} no está congelada. Ambas prácticas deben estar congeladas para generar el certificado conjunto.`,
        code: 'PRACTICE_NOT_FROZEN'
      });
      return;
    }

    // Get sibling practice name for display
    const { data: siblingType } = await supabase
      .from('t_professional_practices')
      .select('t_internship_type ( NAME )')
      .eq('PROFESSIONAL_PRACTICE_ID', siblingPracticeId)
      .single();

    // Generate single certificate number for BOTH
    const year = new Date().getFullYear();
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    const certificateNumber = `CERT-${year}-${random}`;
    const now = new Date().toISOString();

    // Update BOTH culmination records with the same certificate number
    await Promise.all([
      supabase
        .from('t_practice_culmination')
        .update({ STATUS: 2, CERTIFICATE_NUMBER: certificateNumber, CERTIFIED_AT: now })
        .eq('PRACTICE_ID', practiceId),
      supabase
        .from('t_practice_culmination')
        .update({ STATUS: 2, CERTIFICATE_NUMBER: certificateNumber, CERTIFIED_AT: now })
        .eq('PRACTICE_ID', siblingPracticeId)
    ]);

    const studentName = getPersonFullName((practice as any).t_persons);
    const sourceType = (practice as any).t_internship_type;
    const siblingTypeName = (siblingType as any)?.t_internship_type?.NAME || '';

    res.json({
      success: true,
      message: 'Certificado conjunto generado exitosamente para ambas prácticas',
      certificate: {
        number: certificateNumber,
        studentName,
        studentCi: getPersonField((practice as any).t_persons, 'ci') || '',
        career: (practice as any).t_career?.CAREER_NAME || '',
        institution: (practice as any).t_institution?.INSTITUTION_NAME || '',
        period: (practice as any).t_internships_period?.DESCRIPTION || '',
        grade: (practice as any).GRADE,
        siblingGrade: (siblingPractice as any)?.GRADE,
        generatedAt: now,
        isJoint: true,
        practiceIds: [parseInt(practiceId), siblingPracticeId],
        practiceTypes: [sourceType?.NAME || '', siblingTypeName]
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

// ── POST /api/culmination/:practiceId/reverse ────────────────────────────

export const reverseCulmination = async (req: AuthRequest, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const { practiceId } = req.params;
    const { reason, resolutionNumber } = req.body;
    const userId: number | undefined = (req as any).user?.userId;

    if (!reason || !reason.trim()) {
      res.status(400).json({ message: 'El motivo de la reversión es obligatorio' });
      return;
    }
    if (!resolutionNumber || !resolutionNumber.trim()) {
      res.status(400).json({ message: 'El número de resolución administrativa es obligatorio' });
      return;
    }
    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    // 1. Verificar que la práctica existe y está CULMINADO
    const { data: practice, error: practiceError } = await supabase
      .from('t_professional_practices')
      .select('PROFESSIONAL_PRACTICE_ID, PRACTICES_STATUS')
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
      .single();

    if (practiceError || !practice) {
      res.status(404).json({ message: 'Práctica no encontrada' });
      return;
    }

    if (practice.PRACTICES_STATUS !== PRACTICES_STATUS.CULMINADO) {
      res.status(400).json({ message: 'Solo se pueden revertir prácticas en estado CULMINADO' });
      return;
    }

    // 2. Verificar que no tenga ya un reversal activo
    const { data: existingReversal } = await supabase
      .from('t_culmination_reversals')
      .select('CULMINATION_REVERSAL_ID')
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
      .eq('STATUS', 1)
      .maybeSingle();

    if (existingReversal) {
      res.status(409).json({ message: 'Esta culminación ya fue revertida anteriormente' });
      return;
    }

    // 3. Crear reversal (NO tocamos PRACTICES_STATUS ni t_practice_culmination)
    const { error: insertError } = await supabase
      .from('t_culmination_reversals')
      .insert({
        PROFESSIONAL_PRACTICE_ID: parseInt(practiceId),
        REASON: reason.trim(),
        RESOLUTION_NUMBER: resolutionNumber.trim(),
        USER_ID: userId,
        STATUS: 1
      });

    if (insertError) throw insertError;

    res.json({
      success: true,
      message: 'Reversión de culminación registrada exitosamente. La práctica conserva su estado CULMINADO histórico.'
    });

  } catch (error) {
    console.error('[Culmination] Reverse error:', error);
    res.status(500).json({
      message: 'Error al revertir culminación',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
