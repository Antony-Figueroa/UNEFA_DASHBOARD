/**
 * @file Utilidad para validación secuencial de prácticas.
 * @description Verifica que las prácticas de mayor prioridad estén culminadas
 * antes de permitir evaluar o culminar prácticas de menor prioridad.
 *
 * Ejemplo: HOSP (PRIORITY=2) debe estar CULMINADO antes de evaluar COM (PRIORITY=1).
 */

import { PRACTICES_STATUS } from '../constants/practice-status.constants.js';

interface ValidationResult {
  valid: boolean;
  message?: string;
}

// ponytail: overload for practiceId OR direct params
type SeqCheckParams =
  | { practiceId: number; studentsId?: never; careerId?: never; internshipTypeId?: never }
  | { practiceId?: never; studentsId: number; careerId: number; internshipTypeId: number };

/**
 * Verifica si una práctica tiene el prerrequisito secuencial cumplido.
 *
 * Para prácticas de tipo ÚNICA (PRIORITY=0) o cuando no hay tipos de mayor prioridad
 * en la misma carrera, siempre retorna { valid: true }.
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
    studentsId = params.studentsId;
    careerId = params.careerId;
    internshipTypeId = params.internshipTypeId;
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

  if (currentType.PRIORITY === 0) {
    return { valid: true }; // PRIORITY 0 = standalone
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

  // 4. Tipos con PRIORIDAD ESTRICTAMENTE MAYOR
  const higherPriorityIds = (typePriorities as Array<{ INTERNSHIP_TYPE_ID: number; PRIORITY: number }>)
    .filter((t: any) => t.PRIORITY > currentType.PRIORITY)
    .map((t: any) => t.INTERNSHIP_TYPE_ID);

  if (higherPriorityIds.length === 0) {
    return { valid: true };
  }

  // 5. Obtener nota mínima de la carrera
  const { data: career } = await supabase
    .from('t_career')
    .select('MINIMUM_GRADE')
    .eq('CAREER_ID', careerId)
    .single();
  const minimumGrade = career?.MINIMUM_GRADE ?? 10;

  // 6. Verificar si el estudiante tiene ALGUNA práctica de mayor prioridad
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
    .in('INTERNSHIP_TYPE_ID', higherPriorityIds)
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
    const higherTypeNames = (typePriorities as any[])
      .filter((t: any) => higherPriorityIds.includes(t.INTERNSHIP_TYPE_ID))
      .sort((a: any, b: any) => b.PRIORITY - a.PRIORITY);

    let typeName = 'práctica de mayor prioridad';
    if (higherTypeNames.length > 0) {
      const { data: typeInfo } = await supabase
        .from('t_internship_type')
        .select('NAME')
        .eq('INTERNSHIP_TYPE_ID', higherTypeNames[0].INTERNSHIP_TYPE_ID)
        .single();
      if (typeInfo) typeName = `la práctica ${typeInfo.NAME}`;
    }

    return {
      valid: false,
      message: `Debe completar y aprobar ${typeName} antes de continuar con esta práctica.`
    };
  }

  return { valid: true };
}
