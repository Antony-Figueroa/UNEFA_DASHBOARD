/**
 * @file evaluation-config.service.ts
 * @description Servicio para leer configuración de evaluación desde t_config (DB)
 * con fallback a los valores hardcode de evaluation.config.ts.
 *
 * Sigue el mismo patrón que config.service.ts (cache con TTL).
 */

import { dbManager } from '../lib/db-manager.js';
import { evaluationConfig as fallbackConfig } from '../config/evaluation.config.js';

// ── Cache ────────────────────────────────────────────────────────────────
let cachedEvalConfig: { data: EvalDbConfig | null; expiry: number } | null = null;
const CACHE_TTL = 30_000; // 30s

export const invalidateEvalConfigCache = (): void => {
  cachedEvalConfig = null;
};

// ── Tipos ────────────────────────────────────────────────────────────────

export interface EvalDbWeights {
  INSTITUCIONAL: number;
  ACADEMICO: number;
  COMITE: number;
}

export interface EvalDbScore {
  min: number;
  max: number;
  displayScale: number;
}

export interface EvalDbConfig {
  weights: EvalDbWeights;
  score: EvalDbScore;
  evaluationWindowDays: number;
  committeeMinMembers?: number;
}

// ── Lectura desde DB ─────────────────────────────────────────────────────

const loadFromDb = async (): Promise<EvalDbConfig | null> => {
  const supabase = dbManager.getConnection();
  const { data, error } = await supabase
    .from('t_config')
    .select('EVALUATION_CONFIG')
    .eq('CONFIG_ID', 1)
    .maybeSingle();

  if (error || !data?.EVALUATION_CONFIG) {
    return null;
  }

  return data.EVALUATION_CONFIG as unknown as EvalDbConfig;
};

// ── API pública ──────────────────────────────────────────────────────────

/** Obtiene la config de evaluación: DB > fallback hardcode */
export const getEvalConfig = async (): Promise<EvalDbConfig> => {
  // Cache warm?
  if (cachedEvalConfig && Date.now() < cachedEvalConfig.expiry) {
    return cachedEvalConfig.data ?? fallbackConfig;
  }

  const dbConfig = await loadFromDb();

  // Merge: los valores de DB pisán los del fallback
  const merged: EvalDbConfig = {
    weights: {
      INSTITUCIONAL: dbConfig?.weights?.INSTITUCIONAL ?? fallbackConfig.weights.INSTITUCIONAL,
      ACADEMICO: dbConfig?.weights?.ACADEMICO ?? fallbackConfig.weights.ACADEMICO,
      COMITE: dbConfig?.weights?.COMITE ?? fallbackConfig.weights.COMITE,
    },
    score: {
      min: dbConfig?.score?.min ?? fallbackConfig.score.min,
      max: dbConfig?.score?.max ?? fallbackConfig.score.max,
      displayScale: dbConfig?.score?.displayScale ?? fallbackConfig.score.displayScale,
    },
    evaluationWindowDays: dbConfig?.evaluationWindowDays ?? fallbackConfig.evaluationWindowDays,
    committeeMinMembers: dbConfig?.committeeMinMembers ?? fallbackConfig.committeeMinMembers,
  };

  cachedEvalConfig = { data: merged, expiry: Date.now() + CACHE_TTL };
  return merged;
};

/** Helper: calcula la nota final ponderada */
export const calculateWeightedGrade = async (scores: Record<string, number>): Promise<number> => {
  const cfg = await getEvalConfig();
  let finalGrade = 0;
  for (const [type, weight] of Object.entries(cfg.weights)) {
    if (scores[type] !== undefined) {
      finalGrade += scores[type] * weight;
    }
  }
  return parseFloat(finalGrade.toFixed(1));
};

/** Helper: escala un promedio raw al display scale */
export const scaleToDisplay = async (rawAverage: number): Promise<number> => {
  const cfg = await getEvalConfig();
  const { min, max, displayScale } = cfg.score;
  const clamped = Math.max(min, Math.min(max, rawAverage));
  return parseFloat(((clamped / max) * displayScale).toFixed(1));
};

/** Helper: convierte puntaje individual a display scale */
export const scoreToDisplay = async (score: number): Promise<number> => {
  const cfg = await getEvalConfig();
  const { min, max, displayScale } = cfg.score;
  const clamped = Math.max(min, Math.min(max, score));
  return parseFloat(((clamped / max) * displayScale).toFixed(1));
};
