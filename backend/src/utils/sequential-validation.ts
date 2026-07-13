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

  // 4. Tipos con PRIORIDAD MENOR (anteriores en la secuencia, excluyendo standalone PRIORITY=0)
  const prerequisiteIds = (typePriorities as Array<{ INTERNSHIP_TYPE_ID: number; PRIORITY: number }>)
    .filter((t: any) => t.PRIORITY > 0 && t.PRIORITY < currentType.PRIORITY)
    .map((t: any) => t.INTERNSHIP_TYPE_ID);

  if (prerequisiteIds.length === 0) {
    return { valid: true };
  }

  // 5. Obtener nota mínima de la carrera
  const { data: career } = await supabase
    .from('t_career')
    .select('MINIMUM_GRADE')
    .eq('CAREER_ID', careerId)
    .single();
  const minimumGrade = career?.MINIMUM_GRADE ?? 10;

  // 6. Verificar si el estudiante tiene ALGUNA práctica anterior (priority menor)
  //    CULMINADA + APROBADA (GRADE >= minimum) y sin reversal activo
  const { data: completedPrerequisite } = await supabase
    .from('t_professional_practices')
    .select(`
      PROFESSIONAL_PRACTICE_ID,
      GRADE,
      t_culmination_reversals!left (
        CULMINATION_REVERSAL_ID
      )
    `)
    .eq('STUDENTS_ID', studentsId)
    .eq('CAREER_ID', careerId)
    .in('INTERNSHIP_TYPE_ID', prerequisiteIds)
    .eq('PRACTICES_STATUS', PRACTICES_STATUS.CULMINADO)
    .eq('STATUS', 1);

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
