/**
 * @file evaluation.config.ts
 * @description Configuración centralizada del sistema de evaluación.
 * 
 * Este archivo es la ÚNICA fuente de verdad para:
 * - Rango de puntuación por criterio (min/max)
 * - Escala de visualización de la nota final
 * - Pesos de cada tipo de evaluador en la nota final ponderada
 * 
 * Para cambiar estos valores, solo se modifica este archivo y se redeploya.
 * No requiere migraciones de BD ni cambios en tablas.
 */

export const evaluationConfig = {
  /** Configuración de puntuación por criterio individual */
  score: {
    /** Puntaje mínimo por criterio (debe coincidir con CHECK en DB si aplica) */
    min: 1,
    /** Puntaje máximo por criterio */
    max: 10,
    /** Escala a la que se proyecta la nota final (ej: 20 = nota sobre 20) */
    displayScale: 20,
  } as const,

  /** Pesos de cada tipo de evaluador en la nota final ponderada. Deben sumar 1. */
  weights: {
    INSTITUCIONAL: 0.40,
    ACADEMICO: 0.30,
    COMITE: 0.30,
  } as const,

  /**
   * Ventana de evaluación: días adicionales después del cierre del periodo
   * durante los cuales aún se permite evaluar.
   * 
   * - 0 (default): evaluación estricta, solo durante periodo "En Curso"
   * - N > 0: se permite evaluar hasta N días después del END_DATE
   * - -1: sin restricción (modo excepción)
   */
  evaluationWindowDays: 10,
} as const;

/** Tipo inferido de la configuración para usar en tipados */
export type EvaluationConfig = typeof evaluationConfig;

/** Helper: escala un promedio raw (en rango min-max) al display scale */
export const scaleToDisplay = (rawAverage: number): number => {
  const { min, max, displayScale } = evaluationConfig.score;
  const clamped = Math.max(min, Math.min(max, rawAverage));
  return parseFloat(((clamped / max) * displayScale).toFixed(2));
};

/** Helper: convierte un puntaje individual raw a su equivalente en display scale */
export const scoreToDisplay = (score: number): number => {
  const { min, max, displayScale } = evaluationConfig.score;
  const clamped = Math.max(min, Math.min(max, score));
  return parseFloat(((clamped / max) * displayScale).toFixed(2));
};

/** Helper: calcula la nota final ponderada a partir de los scores por tipo */
export const calculateWeightedGrade = (
  scores: Record<string, number>
): number => {
  const { weights } = evaluationConfig;
  let finalGrade = 0;
  for (const [type, weight] of Object.entries(weights)) {
    if (scores[type] !== undefined) {
      finalGrade += scores[type] * weight;
    }
  }
  return parseFloat(finalGrade.toFixed(2));
};

export default evaluationConfig;
