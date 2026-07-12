import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { dbManager } from '../lib/db-manager.js';
import { PRACTICES_STATUS } from '../constants/practice-status.constants.js';
import { getPersonField, getPersonFullName } from '../utils/person-utils.js';
import { checkSequentialPrerequisite } from '../utils/sequential-validation.js';
import { getEvalConfig, calculateWeightedGrade } from '../services/evaluation-config.service.js';
import { auditCreate } from '../utils/audit-helpers.js';

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
  periodId: number;
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

/**
 * Verifica que la práctica esté dentro del período de gracia para correcciones.
 * Permite cualquier estado (INSCRITO, REPROBADO) siempre que no se haya vencido
 * la ventana de corrección ni se haya certificado.
 */
const assertGracePeriod = async (
  supabase: any,
  practiceId: number | string,
  options?: { blockIfCertified?: boolean }
) => {
  const { data: practice, error: practiceError } = await supabase
    .from('t_professional_practices')
    .select('PROFESSIONAL_PRACTICE_ID, PERIOD_ID, PRACTICES_STATUS')
    .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
    .single();
  if (practiceError || !practice) throw Object.assign(new Error('Práctica no encontrada'), { status: 404 });

  const { data: period, error: periodError } = await supabase
    .from('t_internships_period')
    .select('END_DATE')
    .eq('PERIOD_ID', practice.PERIOD_ID)
    .single();
  if (periodError || !period) throw Object.assign(new Error('Período no encontrado'), { status: 404 });

  const evalConfig = await getEvalConfig();
  const graceDeadline = new Date(period.END_DATE);
  graceDeadline.setDate(graceDeadline.getDate() + evalConfig.evaluationWindowDays);

  if (new Date() > graceDeadline) {
    throw Object.assign(
      new Error(`Período de corrección vencido el ${graceDeadline.toLocaleDateString('es-VE')}`),
      { status: 403 }
    );
  }

  if (options?.blockIfCertified) {
    const { data: culmination } = await supabase
      .from('t_practice_culmination')
      .select('STATUS')
      .eq('PRACTICE_ID', practiceId)
      .maybeSingle();
    if (culmination?.STATUS === 2) {
      throw Object.assign(
        new Error('Certificado generado — no se puede modificar'),
        { status: 403 }
      );
    }
  }

  return { practice, graceDeadline };
};

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
          CAREER_NAME,
          MINIMUM_GRADE
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

    // 2b. Obtener evaluaciones para calcular nota ponderada en vivo
    const { data: allEvaluations } = await supabase
      .from('t_evaluation')
      .select('PROFESSIONAL_PRACTICE_ID, EVALUATOR_TYPE, TOTAL_SCORE')
      .eq('STATUS', 1)
      .in('PROFESSIONAL_PRACTICE_ID', practiceIds);

    const evalMap = new Map<number, Record<string, number>>();
    (allEvaluations || []).forEach((e: any) => {
      if (!evalMap.has(e.PROFESSIONAL_PRACTICE_ID)) {
        evalMap.set(e.PROFESSIONAL_PRACTICE_ID, {});
      }
      evalMap.get(e.PROFESSIONAL_PRACTICE_ID)![e.EVALUATOR_TYPE] = e.TOTAL_SCORE || 0;
    });

    // 2c. Obtener reversals activos
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
    const evalConfig = await getEvalConfig();
    const weights = evalConfig.weights;

    practices.forEach((p: any) => {
      const practiceId = p.PROFESSIONAL_PRACTICE_ID;
      const internshipType = p.t_internship_type || {};
      const hoursRequired = internshipType.HOURS_REQUIRED ?? 360;
      const totalHours = hoursMap.get(practiceId) || 0;
      const culm = culmMap.get(practiceId);

      const culminationStatus = getCulminationStatusLabel(culm?.STATUS ?? null);

      // Calcular nota ponderada en vivo desde las evaluaciones
      const evalScores = evalMap.get(practiceId) || {};
      const hasAllEvals = ['INSTITUCIONAL', 'ACADEMICO', 'COMITE'].every(type => evalScores[type] !== undefined);
      let computedGrade: number | null = null;
      if (hasAllEvals) {
        computedGrade = Object.entries(weights).reduce((sum, [type, weight]) => {
          return sum + ((evalScores[type] || 0) * weight);
        }, 0);
        computedGrade = Math.round(computedGrade * 100) / 100;
      }
      const grade = computedGrade;

      const careerMinGrade = p.t_career?.MINIMUM_GRADE ?? MINIMUM_GRADE;

      let result: 'approved' | 'failed' | 'pending' = 'pending';
      if (p.PRACTICES_STATUS === PRACTICES_STATUS.REPROBADO) {
        result = 'failed';
      } else if (p.EVALUATION_STATUS === 'completed' && grade != null) {
        result = grade >= careerMinGrade ? 'approved' : 'failed';
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
      const periodId = p.PERIOD_ID;
      const groupKey = `${studentCi}|${periodDesc}`;

      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, {
          studentCi,
          studentName,
          careerName,
          periodId,
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

    const total = groups.length;
    const completed = groups.filter(g => g.overallStatus === 'completed').length;
    const inProgress = groups.filter(g => g.overallStatus === 'in_progress').length;

    // Transformar a formato StudentCulminationRowData que el frontend espera
    const mappedGroups = groups.map(g => {
      const phases = g.practices.map((p, idx) => {
        // Determinar status de la fase
        let phaseStatus: 'pending' | 'approved' | 'certified' | 'failed' | 'withdrawn_justified' = 'pending';
        let statusLabel = 'Pendiente';

        if (p.culminationStatus === 'certified') {
          phaseStatus = 'certified';
          statusLabel = 'Certificado';
        } else if (p.result === 'approved') {
          phaseStatus = 'approved';
          statusLabel = 'Aprobado';
        } else if (p.result === 'failed') {
          phaseStatus = 'failed';
          statusLabel = 'Reprobado';
        }

        return {
          practiceId: Number(p.id),
          practiceTypeId: p.practiceTypeId,
          practiceTypeName: p.practiceType,
          priority: idx + 1,
          status: phaseStatus,
          statusLabel,
          grade: p.finalGrade,
          isFrozen: p.isFrozen,
          evaluationStatus: p.evaluationStatus,
          institutionName: p.institutionName,
          hoursCompleted: p.totalHours,
        };
      });

      const totalPractices = phases.length;
      const completedPractices = phases.filter(ph =>
        ph.status === 'approved' || ph.status === 'certified'
      ).length;

      // Determinar finalStatus
      const allCertified = phases.every(ph => ph.status === 'certified');
      const anyFailed = phases.some(ph => ph.status === 'failed');
      const allApprovedOrCertified = phases.every(ph =>
        ph.status === 'approved' || ph.status === 'certified'
      );

      let finalStatus: 'approved' | 'pending' | 'failed' | 'partial' = 'pending';
      let finalStatusLabel = 'Pendiente';
      if (allCertified) {
        finalStatus = 'approved';
        finalStatusLabel = 'Certificado';
      } else if (allApprovedOrCertified) {
        finalStatus = 'approved';
        finalStatusLabel = 'Aprobado';
      } else if (anyFailed) {
        finalStatus = 'failed';
        finalStatusLabel = 'Reprobado';
      } else if (completedPractices > 0) {
        finalStatus = 'partial';
        finalStatusLabel = 'Aprobado Parcial';
      }

      // canCertify: todas las fases aprobadas/certificadas y ninguna certificada aún
      const canCertify = allApprovedOrCertified && !allCertified && totalPractices > 0;

      // Certificado info (del primer práctica que tenga)
      const certPractice = g.practices.find(p => p.certificateNumber);

      return {
        studentCi: g.studentCi,
        studentName: g.studentName,
        careerName: g.careerName,
        periodId: g.periodId,
        periodName: g.period,
        phases,
        finalStatus,
        finalStatusLabel,
        canCertify,
        certificateNumber: certPractice?.certificateNumber || null,
        certifiedAt: certPractice?.certifiedAt || null,
        totalPractices,
        completedPractices,
      };
    });

    // Calcular stats de culminación (para compatibilidad con frontend CulminationGroupsResponse)
    const allPractices = groups.flatMap(g => g.practices);
    const stats = {
      total: allPractices.length,
      pending: allPractices.filter(p => p.culminationStatus === 'pending').length,
      approved: allPractices.filter(p => p.culminationStatus === 'approved').length,
      certified: allPractices.filter(p => p.culminationStatus === 'certified').length,
    };

    res.json({
      success: true,
      groups: mappedGroups,
      stats,
      meta: { total, completed, inProgress }
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
        GRADE,
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

    // Allow INSCRITO and REPROBADO within grace period (not just INSCRITO)
    const allowedStatuses = [PRACTICES_STATUS.INSCRITO, PRACTICES_STATUS.REPROBADO];
    if (!allowedStatuses.includes((practice as any).PRACTICES_STATUS)) {
      res.status(400).json({
        message: 'Solo se pueden culminar prácticas en estado INSCRITO o REPROBADO.'
      });
      return;
    }

    // Grace period check — blocks past deadline or certified
    try {
      await assertGracePeriod(supabase, practiceId, { blockIfCertified: true });
    } catch (err: any) {
      const status = err.status || 500;
      res.status(status).json({ success: false, message: err.message });
      return;
    }

    // 2. Validar que las evaluaciones estén completas
    if ((practice as any).EVALUATION_STATUS !== 'completed') {
      res.status(400).json({
        message: 'No se puede culminar la práctica: las evaluaciones no están completas.'
      });
      return;
    }

    // Grade validation — must meet minimum
    const grade = (practice as any).GRADE;
    if (grade == null) {
      res.status(400).json({
        message: 'No se puede culminar la práctica: no tiene calificación registrada.'
      });
      return;
    }

    // Fetch career minimum grade
    let minimumGrade = MINIMUM_GRADE;
    if ((practice as any).CAREER_ID) {
      const { data: career } = await supabase
        .from('t_career')
        .select('MINIMUM_GRADE')
        .eq('CAREER_ID', (practice as any).CAREER_ID)
        .single();
      minimumGrade = career?.MINIMUM_GRADE ?? MINIMUM_GRADE;
    }

    if (grade < minimumGrade) {
      res.status(400).json({
        message: `No se puede culminar la práctica: la calificación (${grade}) no alcanza el mínimo requerido (${minimumGrade}).`
      });
      return;
    }

    // 3. Validar prerrequisito secuencial (ej: COM debe estar culminada antes de culminar HOSP)
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

    // 6. Audit log
    try {
      await auditCreate(req, 't_professional_practices', {
        ACTION: 'APPROVE_CULMINATION',
        PROFESSIONAL_PRACTICE_ID: parseInt(practiceId),
        PRACTICES_STATUS: PRACTICES_STATUS.CULMINADO,
        GRADE: grade,
      }, ['ACTION', 'PROFESSIONAL_PRACTICE_ID', 'PRACTICES_STATUS', 'GRADE'], Number(practiceId));
    } catch (auditError) {
      console.error('[Audit] Error auditing culmination approval:', auditError);
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

    // ── Sequential practices (PRIORITY > 0) — COUNT-based joint cert ──
    // Scalable: works for N sequential practice types per career.

    // 1. Get ALL required sequential types for this career (PRIORITY > 0)
    const { data: careerTypes } = await supabase
      .from('t_career_internship_type')
      .select('INTERNSHIP_TYPE_ID')
      .eq('CAREER_ID', (practice as any).CAREER_ID);

    if (!careerTypes || careerTypes.length === 0) {
      res.status(400).json({ message: 'No se encontraron tipos de práctica para esta carrera' });
      return;
    }

    const allTypeIds = careerTypes.map((t: any) => t.INTERNSHIP_TYPE_ID);

    const { data: typePriorities } = await supabase
      .from('t_internship_type')
      .select('INTERNSHIP_TYPE_ID, PRIORITY, NAME')
      .in('INTERNSHIP_TYPE_ID', allTypeIds);

    const sequentialTypes = (typePriorities || [])
      .filter((t: any) => t.PRIORITY > 0)
      .sort((a: any, b: any) => a.PRIORITY - b.PRIORITY);

    if (sequentialTypes.length === 0) {
      res.status(400).json({ message: 'Esta carrera no tiene prácticas secuenciales para certificar' });
      return;
    }

    const sequentialTypeIds = sequentialTypes.map((t: any) => t.INTERNSHIP_TYPE_ID);

    // 2. Get ALL practices for this student + career for sequential types
    const { data: studentPractices } = await supabase
      .from('t_professional_practices')
      .select(`
        PROFESSIONAL_PRACTICE_ID,
        INTERNSHIP_TYPE_ID,
        PRACTICES_STATUS,
        GRADE,
        FROZEN_AT,
        t_practice_culmination ( STATUS, CERTIFICATE_NUMBER ),
        t_internship_type ( NAME, PRIORITY )
      `)
      .eq('STUDENTS_ID', (practice as any).STUDENTS_ID)
      .eq('CAREER_ID', (practice as any).CAREER_ID)
      .in('INTERNSHIP_TYPE_ID', sequentialTypeIds)
      .eq('STATUS', 1);

    // 3. Check completion status: CULMINADO + culmination STATUS=1 (approved)
    const completedTypes = new Set<number>();
    const practiceMap = new Map<number, any>();

    for (const p of studentPractices || []) {
      const culm = (p as any).t_practice_culmination;
      if (culm && culm.STATUS === 1 && (p as any).PRACTICES_STATUS === PRACTICES_STATUS.CULMINADO) {
        completedTypes.add((p as any).INTERNSHIP_TYPE_ID);
        practiceMap.set((p as any).INTERNSHIP_TYPE_ID, p);
      }
    }

    // 4. Verify ALL required sequential types are CULMINADO
    const missingTypes = sequentialTypes.filter((t: any) => !completedTypes.has(t.INTERNSHIP_TYPE_ID));

    if (missingTypes.length > 0) {
      const missingNames = missingTypes.map((t: any) => t.NAME).join(', ');
      res.status(400).json({
        message: `Faltan prácticas por culminar para generar el certificado: ${missingNames}`,
        missing: missingTypes.map((t: any) => ({ id: t.INTERNSHIP_TYPE_ID, name: t.NAME }))
      });
      return;
    }

    // 5. Verify ALL practices are frozen
    const notFrozen = sequentialTypes.filter((t: any) => {
      const p = practiceMap.get(t.INTERNSHIP_TYPE_ID);
      return !p?.FROZEN_AT;
    });

    if (notFrozen.length > 0) {
      const notFrozenNames = notFrozen.map((t: any) => t.NAME).join(', ');
      res.status(400).json({
        message: `Las siguientes prácticas no están congeladas: ${notFrozenNames}`,
        code: 'PRACTICE_NOT_FROZEN'
      });
      return;
    }

    // 6. Check no existing certificate for any practice
    const alreadyCertified = sequentialTypes.filter((t: any) => {
      const p = practiceMap.get(t.INTERNSHIP_TYPE_ID);
      const culm = (p as any).t_practice_culmination;
      return culm?.STATUS === 2;
    });

    if (alreadyCertified.length > 0) {
      const certifiedNames = alreadyCertified.map((t: any) => t.NAME).join(', ');
      res.status(409).json({
        message: `Ya existe certificado para: ${certifiedNames}`
      });
      return;
    }

    // 7. Generate single certificate number for ALL practices
    const certYear = new Date().getFullYear();
    const certRandom = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    const certificateNumber = `CERT-${certYear}-${certRandom}`;
    const now = new Date().toISOString();

    // 8. Update ALL culmination records with the same certificate number
    await Promise.all(
      sequentialTypes.map((t: any) => {
        const p = practiceMap.get(t.INTERNSHIP_TYPE_ID);
        return supabase
          .from('t_practice_culmination')
          .update({ STATUS: 2, CERTIFICATE_NUMBER: certificateNumber, CERTIFIED_AT: now })
          .eq('PRACTICE_ID', p.PROFESSIONAL_PRACTICE_ID);
      })
    );

    // 9. Build response (backward compatible + grades array for future use)
    const studentName = getPersonFullName((practice as any).t_persons);
    const allGrades = sequentialTypes.map((t: any) => {
      const p = practiceMap.get(t.INTERNSHIP_TYPE_ID);
      return { type: t.NAME, grade: (p as any).GRADE };
    });

    res.json({
      success: true,
      message: 'Certificado conjunto generado exitosamente para todas las prácticas',
      certificate: {
        number: certificateNumber,
        studentName,
        studentCi: getPersonField((practice as any).t_persons, 'ci') || '',
        career: (practice as any).t_career?.CAREER_NAME || '',
        institution: (practice as any).t_institution?.INSTITUTION_NAME || '',
        period: (practice as any).t_internships_period?.DESCRIPTION || '',
        grade: allGrades[0]?.grade,
        siblingGrade: allGrades[1]?.grade,
        grades: allGrades,
        generatedAt: now,
        isJoint: sequentialTypes.length > 1,
        practiceIds: sequentialTypes.map((t: any) => practiceMap.get(t.INTERNSHIP_TYPE_ID).PROFESSIONAL_PRACTICE_ID),
        practiceTypes: sequentialTypes.map((t: any) => t.NAME)
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
