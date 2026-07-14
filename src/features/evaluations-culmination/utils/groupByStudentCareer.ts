/**
 * @file groupByStudentCareer.ts
 * @description Agrupa un array de prácticas por studentCi + careerId.
 * Utilizado por EvaluationCard para mostrar una tarjeta por combinación estudiante-carrera.
 */

import type { PracticeWithEvaluations, EvaluationGroup } from '../types';

/**
 * Agrupa prácticas por la combinación `studentCi + careerId`.
 * Las prácticas dentro de cada grupo mantienen el orden original de inserción.
 * Los grupos se devuelven ordenados por `studentCi` y luego por `careerId`.
 *
 * @param practices - Array plano de prácticas con evaluaciones
 * @returns Array de EvaluationGroup, cada uno con las prácticas de un estudiante-carrera
 */
export function groupByStudentCareer(
  practices: PracticeWithEvaluations[]
): EvaluationGroup[] {
  if (practices.length === 0) return [];

  // Mapa temporal: clave "studentCi:careerId" → grupo
  const map = new Map<string, EvaluationGroup>();

  for (const practice of practices) {
    const key = `${practice.studentCi}:${practice.careerId}`;

    if (!map.has(key)) {
      map.set(key, {
        studentCi: practice.studentCi,
        studentName: practice.studentName,
        careerId: practice.careerId,
        careerName: practice.careerName,
        practices: [],
      });
    }

    map.get(key)!.practices.push(practice);
  }

  // Ordenar por studentCi, luego careerId
  return Array.from(map.values()).sort((a, b) => {
    const ciCompare = a.studentCi.localeCompare(b.studentCi);
    if (ciCompare !== 0) return ciCompare;
    return a.careerId - b.careerId;
  });
}
