-- Migration: Agregar INSTITUTION_CODE para permitir RIFs duplicados en instituciones
-- Problema: Clínicas comunitarias comparten el mismo RIF pero son instituciones diferentes
-- Solución: Agregar código interno único basado en RIF + sufijo secuencial

-- 1. Agregar columna INSTITUTION_CODE
ALTER TABLE "t_institution" 
ADD COLUMN IF NOT EXISTS "INSTITUTION_CODE" VARCHAR(25) UNIQUE;

-- 2. Hacer INSTITUTION_CODE nullable temporalmente para la migración
ALTER TABLE "t_institution" 
ALTER COLUMN "INSTITUTION_CODE" DROP NOT NULL;

-- 3. Migrar datos existentes: la primera institución con cada RIF se queda con el RIF tal cual
-- Generar código único para instituciones que ya existen
DO $$
DECLARE
    inst RECORD;
    counter INTEGER;
    rif_count INTEGER;
    base_code VARCHAR(20);
BEGIN
    -- Para cada grupo de RIFs, numerar las instituciones
    FOR inst IN 
        SELECT "INSTITUTION_ID", "RIF", 
               ROW_NUMBER() OVER (PARTITION BY "RIF" ORDER BY "INSTITUTION_ID") as rn,
               COUNT(*) OVER (PARTITION BY "RIF") as cnt
        FROM "t_institution"
        ORDER BY "INSTITUTION_ID"
    LOOP
        IF inst.cnt = 1 THEN
            -- Solo una institución con ese RIF, usar RIF tal cual
            UPDATE "t_institution" 
            SET "INSTITUTION_CODE" = inst."RIF" 
            WHERE "INSTITUTION_ID" = inst."INSTITUTION_ID";
        ELSE
            -- Múltiples instituciones con el mismo RIF
            -- La primera se queda con el RIF tal cual, las demás get sufijo
            IF inst.rn = 1 THEN
                UPDATE "t_institution" 
                SET "INSTITUTION_CODE" = inst."RIF" 
                WHERE "INSTITUTION_ID" = inst."INSTITUTION_ID";
            ELSE
                -- Formato: J-30123456-001, J-30123456-002, etc.
                UPDATE "t_institution" 
                SET "INSTITUTION_CODE" = inst."RIF" || '-' || LPAD((inst.rn - 1)::TEXT, 3, '0')
                WHERE "INSTITUTION_ID" = inst."INSTITUTION_ID";
            END IF;
        END IF;
    END LOOP;
END $$;

-- 4. Hacer INSTITUTION_CODE NOT NULL después de la migración
ALTER TABLE "t_institution" 
ALTER COLUMN "INSTITUTION_CODE" SET NOT NULL;

-- 5. (Opcional) Quitar el UNIQUE del RIF si ya no es necesario
-- Nota: Comentar esta línea si el RIF único es requerido por otras razones
-- ALTER TABLE "t_institution" DROP CONSTRAINT IF EXISTS "t_institution_RIF_key";

-- 6. Crear índice para búsquedas por INSTITUTION_CODE
CREATE INDEX IF NOT EXISTS "idx_institution_code" ON "t_institution"("INSTITUTION_CODE");

SELECT 'Migración completada: INSTITUTION_CODE agregado' as result;
