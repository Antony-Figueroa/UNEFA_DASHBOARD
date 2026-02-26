-- =============================================================================
-- MIGRACIÓN: Sistema de Reasignaciones (Corregida)
-- =============================================================================
-- Fecha: Feb 2026
-- Descripción: Agregar soporte para solicitudes de reasignación 
--              (Cambio de Tutor, Empresa, Carrera)
-- =============================================================================

-- 1. Agregar columna IS_REASSIGNMENT a t_request_types PRIMERO
ALTER TABLE t_request_types 
ADD COLUMN IF NOT EXISTS "IS_REASSIGNMENT" SMALLINT DEFAULT 0;

-- 2. Agregar columna CATEGORY a t_request_types
ALTER TABLE t_request_types 
ADD COLUMN IF NOT EXISTS "CATEGORY" VARCHAR(50) DEFAULT 'GENERAL';

-- 3. Actualizar categorías de tipos existentes
UPDATE t_request_types SET "CATEGORY" = 'GENERAL' WHERE "CATEGORY" IS NULL OR "CATEGORY" = '';

-- 4. Insertar nuevos tipos de solicitud de reasignación
INSERT INTO t_request_types ("NAME", "DESCRIPTION", "IS_ACTIVE", "IS_REASSIGNMENT", "CATEGORY") VALUES
('Cambio de Tutor', 'Solicitar cambio de tutor académico', 1, 1, 'REASSIGNMENT'),
('Cambio de Empresa', 'Solicitar cambio de empresa/institución donde realiza la pasantía', 1, 1, 'REASSIGNMENT'),
('Cambio de Carrera', 'Solicitar cambio de carrera', 1, 1, 'REASSIGNMENT')
ON CONFLICT DO NOTHING;

-- 5. Agregar columna para almacenar datos de reasignación (JSON) en solicitudes
ALTER TABLE t_student_requests 
ADD COLUMN IF NOT EXISTS "REASSIGNMENT_DATA" JSONB;

-- 6. Agregar columna para identificar si es reasignación
ALTER TABLE t_student_requests 
ADD COLUMN IF NOT EXISTS "IS_REASSIGNMENT" SMALLINT DEFAULT 0;

-- 7. Agregar columnas para el estado anterior (para auditoría)
ALTER TABLE t_student_requests 
ADD COLUMN IF NOT EXISTS "PREVIOUS_TUTOR_ID" INTEGER;

ALTER TABLE t_student_requests 
ADD COLUMN IF NOT EXISTS "PREVIOUS_INSTITUTION_ID" INTEGER;

ALTER TABLE t_student_requests 
ADD COLUMN IF NOT EXISTS "PREVIOUS_CAREER_ID" INTEGER;

-- 8. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_requests_is_reassignment ON t_student_requests("IS_REASSIGNMENT");
CREATE INDEX IF NOT EXISTS idx_request_types_category ON t_request_types("CATEGORY");

-- 9. Comentarios para documentación
COMMENT ON COLUMN t_student_requests."REASSIGNMENT_DATA" IS 'Datos JSON de la reasignación: {newTutorId, newInstitutionId, newCareerId, reason}';
COMMENT ON COLUMN t_student_requests."IS_REASSIGNMENT" IS '1 si es solicitud de reasignación, 0 si es solicitud general';
COMMENT ON COLUMN t_request_types."CATEGORY" IS 'Categoría: GENERAL, REASSIGNMENT, SUPPORT, DOCUMENTS';

-- =============================================================================
-- VERIFICACIÓN
-- =============================================================================
-- SELECT * FROM t_request_types ORDER BY "REQUEST_TYPE_ID";
-- SELECT "NAME", "DESCRIPTION", "IS_REASSIGNMENT", "CATEGORY" FROM t_request_types;
