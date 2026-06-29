-- Agregar columnas de congelamiento a t_evaluation
ALTER TABLE t_evaluation
  ADD COLUMN IF NOT EXISTS FROZEN_AT TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS UNFROZEN_AT TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS UNFREEZE_REASON TEXT,
  ADD COLUMN IF NOT EXISTS UNFREEZE_AUTHORIZED_BY INTEGER REFERENCES t_user("USER_ID");

COMMENT ON COLUMN t_evaluation.FROZEN_AT IS 'Fecha de congelamiento (cierre de actas). NULL = no congelado.';
COMMENT ON COLUMN t_evaluation.UNFROZEN_AT IS 'Fecha de descongelamiento para corrección. NULL = no descongelado.';
COMMENT ON COLUMN t_evaluation.UNFREEZE_REASON IS 'Motivo de la corrección post-cierre.';
COMMENT ON COLUMN t_evaluation.UNFREEZE_AUTHORIZED_BY IS 'Usuario que autorizó la corrección.';
