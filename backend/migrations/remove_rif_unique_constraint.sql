-- Migration: Remover restricción única de RIF para permitir RIFs duplicados
-- Esto es necesario para el sistema de clínicas comunitarias que comparten RIF

-- 1. Remover la restricción UNIQUE del RIF (la约束)
ALTER TABLE "t_institution" DROP CONSTRAINT IF EXISTS "t_institution_RIF_key";

-- 2. Verificar que la migración de INSTITUTION_CODE se haya corrido
-- Si INSTITUTION_CODE no existe, crearla primero
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 't_institution' AND column_name = 'INSTITUTION_CODE'
    ) THEN
        RAISE NOTICE 'INSTITUTION_CODE column does not exist, please run add_institution_code_column.sql first';
    END IF;
END $$;

-- 3. Verificar que todas las instituciones tengan INSTITUTION_CODE
-- Si hay instituciones sin código, asignar uno
DO $$
DECLARE
    inst RECORD;
BEGIN
    FOR inst IN 
        SELECT "INSTITUTION_ID", "RIF"
        FROM "t_institution"
        WHERE "INSTITUTION_CODE" IS NULL OR "INSTITUTION_CODE" = ''
    LOOP
        UPDATE "t_institution" 
        SET "INSTITUTION_CODE" = inst."RIF" 
        WHERE "INSTITUTION_ID" = inst."INSTITUTION_ID";
    END LOOP;
END $$;

-- 4. Crear índice para búsquedas por RIF (si no existe)
CREATE INDEX IF NOT EXISTS "idx_institution_rif" ON "t_institution"("RIF");

-- 5. Crear índice para búsquedas por INSTITUTION_CODE (si no existe)
CREATE INDEX IF NOT EXISTS "idx_institution_code" ON "t_institution"("INSTITUTION_CODE");

SELECT 
    'RIF unique constraint removed successfully' as result,
    (SELECT COUNT(*) FROM "t_institution" WHERE "INSTITUTION_CODE" IS NOT NULL) as institutions_with_code,
    (SELECT COUNT(*) FROM "t_institution" WHERE "RIF" IS NOT NULL) as total_institutions;
