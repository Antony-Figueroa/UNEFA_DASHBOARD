-- Migration: Add EVALUATION_CONFIG JSONB column to t_config
-- Description: Permite configurar pesos de evaluación, rango de puntuación
-- y ventana de evaluación desde la UI en lugar de hardcode en evaluation.config.ts

ALTER TABLE t_config ADD COLUMN IF NOT EXISTS "EVALUATION_CONFIG" JSONB;

-- Valores por defecto (coinciden con evaluation.config.ts)
UPDATE t_config SET "EVALUATION_CONFIG" = '{
  "weights": {
    "INSTITUCIONAL": 0.40,
    "ACADEMICO": 0.30,
    "COMITE": 0.30
  },
  "score": {
    "min": 1,
    "max": 10,
    "displayScale": 20
  },
  "evaluationWindowDays": 10
}' WHERE "CONFIG_ID" = 1 AND "EVALUATION_CONFIG" IS NULL;
