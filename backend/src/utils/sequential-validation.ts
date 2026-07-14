/**
 * @file Utilidad para validación secuencial de prácticas.
 * @description Verifica que las prácticas con priority MENOR estén culminadas
 * antes de permitir inscribir, evaluar o culminar prácticas de mayor priority.
 *
 * Convención: priority 1 = primera práctica, priority 2 = segunda, etc.
 * Ejemplo: COM (PRIORITY=1) debe estar CULMINADA antes de inscribir HOSP (PRIORITY=2).
 */

import { PRACTICES_STATUS } from '../constants/practice-status.constants.js';

interface ValidationResult {
  valid: boolean;
  message?: string;
  /** Cross-period blocking reason: 'reprobado' | 'retirado' | 'retiro_justificado' | null */
  blockingReason?: 'reprobado' | 'retirado' | 'retiro_justificado' | null;
}

// ponytail: overload for practiceId OR direct params
type SeqCheckParams =
  | { practiceId: number; studentsId?: never; careerId?: never; internshipTypeId?: never }
  | { practiceId?: never; studentsId: number; careerId: number; internshipTypeId: number };

/**
 * Verifica si una práctica tiene el prerrequisito secuencial cumplido.
 *
 * Para prácticas de tipo ÚNICA (PRIORITY=0) o como PRIMERA práctica (PRIORITY=1),
 * no hay prerrequisitos secuenciales → retorna { valid: true }.
 *
 * Para prácticas con PRIORITY > 1, se verifica que al menos una práctica
 * con priority MENOR (anterior en la secuencia) esté CULMINADA y APROBADA.
 *
 * @param supabase - Instancia del cliente Supabase
 * @param params - Practice ID (existente) O { studentsId, careerId, internshipTypeId } (pre-inscripción)
 */
export async function checkSequentialPrerequisite(supabase: any, params: SeqCheckParams): Promise<ValidationResult> {
  let studentsId: number;
  let careerId: number;
  let internshipTypeId: number;

  if (params.practiceId) {
    // Modo existente: obtener datos desde la práctica
    const { data: practice, error: practiceError } = await supabase
      .from('t_professional_practices')
      .select('STUDENTS_ID, CAREER_ID, INTERNSHIP_TYPE_ID')
      .eq('PROFESSIONAL_PRACTICE_ID', params.practiceId)
      .single();

    if (practiceError || !practice) {
      return { valid: false, message: 'Práctica no encontrada' };
    }
    if (!practice.STUDENTS_ID || !practice.CAREER_ID || !practice.INTERNSHIP_TYPE_ID) {
      return { valid: true };
    }
    studentsId = practice.STUDENTS_ID;
    careerId = practice.CAREER_ID;
    internshipTypeId = practice.INTERNSHIP_TYPE_ID;
  } else {
    // Modo pre-inscripción: usar parámetros directos
    // ponytail: type contract guarantees these are defined in the else branch
    studentsId = params.studentsId!;
    careerId = params.careerId!;
    internshipTypeId = params.internshipTypeId!;
  }

  if (!careerId) {
    return { valid: true }; // Sin carrera → no se puede validar secuencia
  }

  // 1. Obtener prioridad del tipo actual
  const { data: currentType } = await supabase
    .from('t_internship_type')
    .select('PRIORITY')
    .eq('INTERNSHIP_TYPE_ID', internshipTypeId)
    .single();

  if (!currentType) {
    return { valid: true };
  }

  if (currentType.PRIORITY <= 1) {
    return { valid: true }; // PRIORITY 0 = standalone, PRIORITY 1 = primera práctica (sin prerrequisitos)
  }

  // 2. Obtener todos los tipos asignados a esta carrera
  const { data: careerTypes } = await supabase
    .from('t_career_internship_type')
    .select('INTERNSHIP_TYPE_ID')
    .eq('CAREER_ID', careerId);

  if (!careerTypes || careerTypes.length <= 1) {
    return { valid: true };
  }

  const careerTypeIds = careerTypes.map((t: any) => t.INTERNSHIP_TYPE_ID);

  // 3. Obtener prioridades
  const { data: typePriorities } = await supabase
    .from('t_internship_type')
    .select('INTERNSHIP_TYPE_ID, PRIORITY')
    .in('INTERNSHIP_TYPE_ID', careerTypeIds);

  if (!typePriorities || typePriorities.length === 0) {
    return { valid: true };
  }

  // 4. Tipo INMEDIATAMENTE ANTERIOR en la secuencia (excluyendo standalone PRIORITY=0)
  //    Convención estricta: cada priority solo se inscribe si el anterior está CULMINADO+APROBADO
  const immediatePrereq = (typePriorities as Array<{ INTERNSHIP_TYPE_ID: number; PRIORITY: number }>)
    .filter((t: any) => t.PRIORITY > 0 && t.PRIORITY < currentType.PRIORITY)
    .sort((a: any, b: any) => b.PRIORITY - a.PRIORITY)[0]; // highest PRIORITY < current

  if (!immediatePrereq) {
    return { valid: true };
  }

  const prerequisiteIds = [immediatePrereq.INTERNSHIP_TYPE_ID];

  // 5. Obtener nota mínima de la carrera
  const { data: career } = await supabase
    .from('t_career')
    .select('MINIMUM_GRADE')
    .eq('CAREER_ID', careerId)
    .single();
  const minimumGrade = career?.MINIMUM_GRADE ?? 10;

  // 6. Verificar si el estudiante tiene ALGUNA práctica anterior (priority menor)
  //    CULMINADA + APROBADA (GRADE >= minimum) y sin reversal activo
  const { data: completedPrerequisite, error: prereqError } = await supabase
    .from('t_professional_practices')
    .select(`
      PROFESSIONAL_PRACTICE_ID,
      GRADE,
      t_culmination_reversals!left (
        REVERSAL_ID
      )
    `)
    .eq('STUDENTS_ID', studentsId)
    .eq('CAREER_ID', careerId)
    .in('INTERNSHIP_TYPE_ID', prerequisiteIds)
    .eq('PRACTICES_STATUS', PRACTICES_STATUS.CULMINADO)
    .eq('STATUS', 1);

  if (prereqError) {
    console.error('[checkSequentialPrerequisite] Error querying prerequisites:', prereqError);
    return { valid: false, message: 'Error al validar prerrequisitos secuenciales.' };
  }

  // Filtrar: solo cuentan las CULMINADO que:
  //   a) No tienen reversal activo
  //   b) Tienen nota >= mínima de la carrera (APROBADA)
  const validCulminations = (completedPrerequisite || []).filter(
    (p: any) =>
      (!p.t_culmination_reversals || p.t_culmination_reversals.length === 0) &&
      (p.GRADE != null && p.GRADE >= minimumGrade)
  );

  if (validCulminations.length === 0) {
    // ─── Cross-period validation (D-05) ───────────────────────────────
    // Check if student has REPROBADO/RETIRADO/RETIRO_JUSTIFICADO for prerequisites in ANY period
    const { data: failedPractices } = await supabase
      .from('t_professional_practices')
      .select('INTERNSHIP_TYPE_ID, PRACTICES_STATUS')
      .eq('STUDENTS_ID', studentsId)
      .eq('CAREER_ID', careerId)
      .in('INTERNSHIP_TYPE_ID', prerequisiteIds)
      .in('PRACTICES_STATUS', [
        PRACTICES_STATUS.REPROBADO,
        PRACTICES_STATUS.RETIRADO,
        PRACTICES_STATUS.RETIRO_JUSTIFICADO,
      ])
      .eq('STATUS', 1);

    const failedList = failedPractices || [];
    const hasReprobado = failedList.some((p: any) => p.PRACTICES_STATUS === PRACTICES_STATUS.REPROBADO);
    const hasRetirado = failedList.some((p: any) => p.PRACTICES_STATUS === PRACTICES_STATUS.RETIRADO);
    const hasRetiroJustificado = failedList.some((p: any) => p.PRACTICES_STATUS === PRACTICES_STATUS.RETIRO_JUSTIFICADO);

    // Get prerequisite type name for message
    const prerequisiteTypeNames = (typePriorities as any[])
      .filter((t: any) => prerequisiteIds.includes(t.INTERNSHIP_TYPE_ID))
      .sort((a: any, b: any) => a.PRIORITY - b.PRIORITY);

    let typeName = 'la práctica anterior';
    if (prerequisiteTypeNames.length > 0) {
      const { data: typeInfo } = await supabase
        .from('t_internship_type')
        .select('NAME')
        .eq('INTERNSHIP_TYPE_ID', prerequisiteTypeNames[0].INTERNSHIP_TYPE_ID)
        .single();
      if (typeInfo) typeName = `la práctica ${typeInfo.NAME}`;
    }

    // Priority: REPROBADO/RETIRADO > RETIRO_JUSTIFICADO > generic
    if (hasReprobado || hasRetirado) {
      const reason = hasReprobado ? 'reprobado' : 'retirado';
      return {
        valid: false,
        message: `${typeName} fue ${reason} en un período anterior. Debe esperar hasta el próximo año lectivo para reintentar.`,
        blockingReason: reason,
      };
    }

    if (hasRetiroJustificado) {
      return {
        valid: false,
        message: `${typeName} tiene un retiro justificado pendiente. Puede reinscribirse en el siguiente período.`,
        blockingReason: 'retiro_justificado',
      };
    }

    return {
      valid: false,
      message: `Debe completar y aprobar ${typeName} antes de continuar con esta práctica.`,
      blockingReason: null,
    };
  }

  return { valid: true };
}

// ============================================================
// PRE-ENROLLMENT ELIGIBILITY (comprehensive rules)
// ============================================================

export interface PreEnrollmentEligibilityResult {
  valid: boolean;
  message?: string;
  blockingReason?: 'cooldown' | 'career_completed' | 'retiro_justificado' | 'reprobado' | 'retirado' | null;
  /** Period ID when cooldown ends (for cooldown blocking) */
  cooldownEndPeriodId?: number;
  /** Period description when cooldown ends */
  cooldownEndPeriodDesc?: string;
  /** For RETIRO_JUSTIFICADO: practice history to show in choice modal */
  showChoiceModal?: boolean;
  approvedPractices?: Array<{
    internshipTypeName: string;
    priority: number;
    practicesStatus: number;
    grade: number | null;
  }>;
  /** Suggested next practice type (for continue option) */
  suggestedPracticeTypeId?: number;
  /** Suggested practice type name */
  suggestedPracticeTypeName?: string;
}

/**
 * Comprehensive pre-enrollment eligibility check.
 *
 * Rules:
 * 1. CULMINADO for ALL practices in career → BLOCK (career completed, can't retake)
 * 2. REPROBADO/RETIRADO → 2-period cooldown, then must restart from PRIORITY=1
 * 3. RETIRO_JUSTIFICADO → can enroll next period; if multi-type career, show choice modal
 * 4. Otherwise → sequential prerequisite check
 */
export async function checkPreEnrollmentEligibility(
  supabase: any,
  params: { studentsId: number; careerId: number; internshipTypeId: number }
): Promise<PreEnrollmentEligibilityResult> {
  const { studentsId, careerId, internshipTypeId } = params;

  // 1. Get all practices for this student in this career (any period, any status)
  const { data: allPractices } = await supabase
    .from('t_professional_practices')
    .select(`
      PROFESSIONAL_PRACTICE_ID,
      PRACTICES_STATUS,
      GRADE,
      PERIOD_ID,
      INTERNSHIP_TYPE_ID,
      t_internship_type (NAME, PRIORITY),
      t_internships_period (DESCRIPTION),
      t_culmination_reversals (REVERSAL_ID)
    `)
    .eq('STUDENTS_ID', studentsId)
    .eq('CAREER_ID', careerId)
    .eq('STATUS', 1);

  // No practices → no history, proceed with sequential check
  if (!allPractices || allPractices.length === 0) {
    return await checkSequentialPrerequisite(supabase, params);
  }

  // 2. Get career types to determine if multi-type
  const { data: careerTypes } = await supabase
    .from('t_career_internship_type')
    .select('INTERNSHIP_TYPE_ID')
    .eq('CAREER_ID', careerId);

  const totalCareerTypes = careerTypes?.length || 0;
  const isMultiType = totalCareerTypes > 1;

  // 3. Get minimum grade for the career
  const { data: career } = await supabase
    .from('t_career')
    .select('MINIMUM_GRADE')
    .eq('CAREER_ID', careerId)
    .single();
  const minimumGrade = career?.MINIMUM_GRADE ?? 10;

  // 4. Get current period
  const { data: currentPeriod } = await supabase
    .from('t_internships_period')
    .select('PERIOD_ID, DESCRIPTION')
    .eq('STATUS', 2) // EN_CURSO
    .maybeSingle();

  // If no active period, try pending
  let activePeriodId = currentPeriod?.PERIOD_ID;
  let activePeriodDesc = currentPeriod?.DESCRIPTION;
  if (!activePeriodId) {
    const { data: pendingPeriod } = await supabase
      .from('t_internships_period')
      .select('PERIOD_ID, DESCRIPTION')
      .eq('STATUS', 1)
      .order('START_DATE', { ascending: true })
      .limit(1)
      .maybeSingle();
    activePeriodId = pendingPeriod?.PERIOD_ID;
    activePeriodDesc = pendingPeriod?.DESCRIPTION;
  }

  // ── RULE 1: CULMINADO for ALL practices → career completed ─────────
  const validCulminations = allPractices.filter(
    (p: any) =>
      p.PRACTICES_STATUS === PRACTICES_STATUS.CULMINADO &&
      (!p.t_culmination_reversals || p.t_culmination_reversals.length === 0) &&
      (p.GRADE != null && p.GRADE >= minimumGrade)
  );

  if (totalCareerTypes > 0 && validCulminations.length >= totalCareerTypes) {
    return {
      valid: false,
      message: 'Ya tiene aprobadas todas las prácticas de esta carrera. Para cursar otra vez, debe inscribirse en una carrera diferente.',
      blockingReason: 'career_completed',
    };
  }

  // ── RULE 2: REPROBADO/RETIRADO → 2-period cooldown + restart from PRIORITY=1 ─
  const failedPractices = allPractices.filter(
    (p: any) =>
      p.PRACTICES_STATUS === PRACTICES_STATUS.REPROBADO ||
      p.PRACTICES_STATUS === PRACTICES_STATUS.RETIRADO
  );

  if (failedPractices.length > 0 && activePeriodId) {
    // Get the most recent failure (highest PERIOD_ID)
    const mostRecentFailure = failedPractices
      .sort((a: any, b: any) => (b.PERIOD_ID || 0) - (a.PERIOD_ID || 0))[0];

    const failurePeriodId = mostRecentFailure.PERIOD_ID;

    // Get all periods ordered by PERIOD_ID
    const { data: allPeriods } = await supabase
      .from('t_internships_period')
      .select('PERIOD_ID, DESCRIPTION')
      .order('PERIOD_ID', { ascending: true });

    if (allPeriods && failurePeriodId) {
      const failureIndex = allPeriods.findIndex((p: any) => p.PERIOD_ID === failurePeriodId);
      const currentIndex = allPeriods.findIndex((p: any) => p.PERIOD_ID === activePeriodId);

      if (failureIndex >= 0 && currentIndex >= 0) {
        const periodsPassed = currentIndex - failureIndex;

        if (periodsPassed < 2) {
          // Still in cooldown — block
          const cooldownEndIndex = failureIndex + 2;
          const cooldownEnd = cooldownEndIndex < allPeriods.length ? allPeriods[cooldownEndIndex] : null;

          const failType = mostRecentFailure.PRACTICES_STATUS === PRACTICES_STATUS.REPROBADO
            ? 'reprobada' : 'retirada';
          const failPeriod = mostRecentFailure.t_internships_period?.DESCRIPTION || '';

          return {
            valid: false,
            message: `Tuvo una práctica ${failType} en el período ${failPeriod}. Debe esperar 2 períodos para volver a inscribir.`,
            blockingReason: mostRecentFailure.PRACTICES_STATUS === PRACTICES_STATUS.REPROBADO ? 'reprobado' : 'retirado',
            cooldownEndPeriodId: cooldownEnd?.PERIOD_ID,
            cooldownEndPeriodDesc: cooldownEnd?.DESCRIPTION,
          };
        }
      }
    }

    // Cooldown passed → must restart from PRIORITY=1
    // Check what they're trying to enroll in
    const { data: currentType } = await supabase
      .from('t_internship_type')
      .select('PRIORITY, NAME')
      .eq('INTERNSHIP_TYPE_ID', internshipTypeId)
      .single();

    if (currentType && currentType.PRIORITY > 1 && isMultiType) {
      // Trying to enroll in PRIORITY > 1 after a failure → force restart
      return {
        valid: false,
        message: `Debe reiniciar la secuencia de prácticas desde el inicio. Seleccione la primera práctica de la carrera.`,
        blockingReason: mostRecentFailure.PRACTICES_STATUS === PRACTICES_STATUS.REPROBADO ? 'reprobado' : 'retirado',
      };
    }
  }

  // ── RULE 3: RETIRO_JUSTIFICADO → can enroll next period, show choice modal if multi-type ──
  const justifiedPractices = allPractices.filter(
    (p: any) => p.PRACTICES_STATUS === PRACTICES_STATUS.RETIRO_JUSTIFICADO
  );

  if (justifiedPractices.length > 0 && isMultiType) {
    // Build practice history for the choice modal
    const practiceHistory = allPractices.map((p: any) => ({
      internshipTypeName: p.t_internship_type?.NAME || '',
      priority: p.t_internship_type?.PRIORITY || 0,
      practicesStatus: p.PRACTICES_STATUS,
      grade: p.GRADE,
    })).sort((a: any, b: any) => a.priority - b.priority);

    // Find the next practice to suggest for "continue"
    const approvedPriorities = validCulminations.map((p: any) => {
      const type = (allPractices as any[]).find(
        (ap: any) => ap.INTERNSHIP_TYPE_ID === p.INTERNSHIP_TYPE_ID
      );
      return type?.t_internship_type?.PRIORITY || 0;
    });

    // Suggest the practice with the lowest unapproved priority
    const careerTypePriorities = (careerTypes || [])
      .map((ct: any) => {
        const tp = allPractices.find((p: any) => p.INTERNSHIP_TYPE_ID === ct.INTERNSHIP_TYPE_ID);
        return {
          typeId: ct.INTERNSHIP_TYPE_ID,
          priority: tp?.t_internship_type?.PRIORITY || 0,
          name: tp?.t_internship_type?.NAME || '',
          approved: approvedPriorities.includes(tp?.t_internship_type?.PRIORITY || -1),
        };
      })
      .sort((a: any, b: any) => a.priority - b.priority);

    const nextUnapproved = careerTypePriorities.find((ct: any) => !ct.approved);

    return {
      valid: false,
      message: 'Tiene un retiro justificado en esta carrera. Elija si desea continuar desde donde se retiró o reiniciar la secuencia.',
      blockingReason: 'retiro_justificado',
      showChoiceModal: true,
      approvedPractices: practiceHistory,
      suggestedPracticeTypeId: nextUnapproved?.typeId,
      suggestedPracticeTypeName: nextUnapproved?.name,
    };
  }

  // ── DEFAULT: sequential prerequisite check ───────────────────────
  return await checkSequentialPrerequisite(supabase, params);
}
