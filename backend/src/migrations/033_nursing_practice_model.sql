-- Migration 033: Nursing Practice Model
-- Agrega columnas de freeze/unfreeze, PREVIOUS_PRACTICE_ID (self-FK),
-- y nuevo estado RETIRO_JUSTIFICADO (5) para el modelo de dos prácticas de Enfermería.
--
-- Todas las columnas son NULLables (migración aditiva).
-- ÚNICA (PRIORITY=0) no se ve afectada.

BEGIN;

-- 1. Agregar columnas de freeze/unfreeze a nivel de práctica
ALTER TABLE t_professional_practices
  ADD COLUMN IF NOT EXISTS FROZEN_AT TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS UNFROZEN_AT TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS UNFREEZE_REASON TEXT,
  ADD COLUMN IF NOT EXISTS UNFREEZE_AUTHORIZED_BY INTEGER REFERENCES t_user("USER_ID");

COMMENT ON COLUMN t_professional_practices.FROZEN_AT IS 'Fecha de congelamiento (cierre de actas a nivel práctica). NULL = no congelado.';
COMMENT ON COLUMN t_professional_practices.UNFROZEN_AT IS 'Fecha de descongelamiento. NULL = no descongelado.';
COMMENT ON COLUMN t_professional_practices.UNFREEZE_REASON IS 'Motivo del descongelamiento. Requerido cuando UNFROZEN_AT se setea.';
COMMENT ON COLUMN t_professional_practices.UNFREEZE_AUTHORIZED_BY IS 'Usuario que autorizó el descongelamiento. FK a t_user.';

-- 2. Agregar PREVIOUS_PRACTICE_ID self-FK para encadenamiento HOSP→COM
ALTER TABLE t_professional_practices
  ADD COLUMN IF NOT EXISTS PREVIOUS_PRACTICE_ID INTEGER
    REFERENCES t_professional_practices("PROFESSIONAL_PRACTICE_ID") ON DELETE RESTRICT;

COMMENT ON COLUMN t_professional_practices.PREVIOUS_PRACTICE_ID IS 'Auto-referencia a la práctica previa (ej: HOSP→COM). Seteada al inscribirse en COM. ON DELETE RESTRICT para preservar cadena histórica.';

CREATE INDEX IF NOT EXISTS idx_practices_previous_practice_id
  ON t_professional_practices ("PREVIOUS_PRACTICE_ID");

-- 3. Agregar check constraint para PRACTICES_STATUS que acepte 0-5
--    Los valores actuales: 0=RETIRADO, 1=PRE_INSCRITO, 2=INSCRITO, 3=CULMINADO, 4=REPROBADO
--    Nuevo: 5=RETIRO_JUSTIFICADO
DO $$
BEGIN
  -- Solo crear si no existe el constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_practices_status_range'
      AND conrelid = 't_professional_practices'::regclass
  ) THEN
    ALTER TABLE t_professional_practices
      ADD CONSTRAINT chk_practices_status_range
      CHECK ("PRACTICES_STATUS" >= 0 AND "PRACTICES_STATUS" <= 5);
  END IF;
END $$;

COMMIT;
