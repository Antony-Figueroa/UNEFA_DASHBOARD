-- Agregar columnas de carga extemporánea a t_professional_practices
ALTER TABLE t_professional_practices
  ADD COLUMN IF NOT EXISTS EXTENSION_GRANTED BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS EXTENSION_REASON TEXT,
  ADD COLUMN IF NOT EXISTS EXTENSION_GRANTED_BY INTEGER REFERENCES t_user("USER_ID"),
  ADD COLUMN IF NOT EXISTS EXTENSION_GRANTED_AT TIMESTAMPTZ;

COMMENT ON COLUMN t_professional_practices.EXTENSION_GRANTED IS 'Indica si se autorizó carga extemporánea de evaluaciones fuera del período';
COMMENT ON COLUMN t_professional_practices.EXTENSION_REASON IS 'Motivo de la autorización de carga extemporánea';
COMMENT ON COLUMN t_professional_practices.EXTENSION_GRANTED_BY IS 'Usuario que autorizó la extensión';
COMMENT ON COLUMN t_professional_practices.EXTENSION_GRANTED_AT IS 'Fecha de autorización de la extensión';
