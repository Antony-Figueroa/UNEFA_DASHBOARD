-- Migration: 013_add_period_validation_config
-- Description: Add PERIOD_VALIDATION_RULES JSONB column to t_config for
-- configurable period validation rules per module/operation.
--
-- Este enfoque permite cambiar las reglas de validación de periodo
-- desde la UI de Parámetros del Sistema sin redeployar.
-- El middleware lee de esta columna con fallback al archivo
-- period-validation.config.ts si la columna no existe o es NULL.

ALTER TABLE t_config ADD COLUMN IF NOT EXISTS "PERIOD_VALIDATION_RULES" JSONB;

-- Seed initial values (match period-validation.config.ts defaults)
UPDATE t_config SET "PERIOD_VALIDATION_RULES" = '{
  "pre-enrollment": {
    "create": { "skipPeriodStatusCheck": false },
    "update": { "skipPeriodStatusCheck": true }
  },
  "enrollment": {
    "create": { "skipPeriodStatusCheck": false, "usePeriodGraceDays": true },
    "update": { "skipPeriodStatusCheck": false, "usePeriodGraceDays": true }
  },
  "evaluation": {
    "create": { "skipPeriodStatusCheck": false, "usePeriodGraceDays": true, "requirePracticesStatusInscribed": true, "extendEndDateDays": 10 },
    "update": { "skipPeriodStatusCheck": false, "usePeriodGraceDays": true, "requirePracticesStatusInscribed": true, "extendEndDateDays": 10 }
  },
  "visit": {
    "create": { "skipPeriodStatusCheck": false },
    "update": { "skipPeriodStatusCheck": false }
  }
}'::jsonb WHERE "CONFIG_ID" = 1;

-- Rollback:
-- ALTER TABLE t_config DROP COLUMN IF EXISTS "PERIOD_VALIDATION_RULES";
