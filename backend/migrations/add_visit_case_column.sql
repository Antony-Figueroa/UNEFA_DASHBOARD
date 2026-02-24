-- Agregar columna VISIT_CASE a la tabla de visitas
-- Esta columna indica el caso/tipo de seguimiento de la visita

ALTER TABLE t_practice_visits 
ADD COLUMN IF NOT EXISTS "VISIT_CASE" VARCHAR(50) DEFAULT 'SEGUIMIENTO_REGULAR';

-- Actualizar valores existentes que sean NULL
UPDATE t_practice_visits 
SET "VISIT_CASE" = 'SEGUIMIENTO_REGULAR' 
WHERE "VISIT_CASE" IS NULL;

-- Agregar comentario
COMMENT ON COLUMN t_practice_visits."VISIT_CASE" IS 'Caso de seguimiento: VISITA_INICIAL, SEGUIMIENTO_REGULAR, REVISION_BITACORAS, EVALUACION_PARCIAL, SEGUIMIENTO_PROBLEMAS, CAMBIO_EMPRESA, CAMBIO_TUTOR, SUSPENSION, REANUDACION, EVALUACION_FINAL, CERTIFICACION';

-- Agregar índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_visits_case ON t_practice_visits("VISIT_CASE");
