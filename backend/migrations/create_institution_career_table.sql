-- Migración: Agregar relación N:M entre Instituciones y Carreras
-- Permite que una institución acepte múltiples carreras

-- 1. Crear tabla de relación N:M
CREATE TABLE IF NOT EXISTS "t_institution_career" (
  "INSTITUTION_ID" INT NOT NULL,
  "CAREER_ID" INT NOT NULL,
  "CREATION_DATE" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "pk_institution_career" PRIMARY KEY ("INSTITUTION_ID", "CAREER_ID"),
  CONSTRAINT "fk_institution_career_institution" 
    FOREIGN KEY ("INSTITUTION_ID") 
    REFERENCES "t_institution" ("INSTITUTION_ID") ON DELETE CASCADE,
  CONSTRAINT "fk_institution_career_career" 
    FOREIGN KEY ("CAREER_ID") 
    REFERENCES "t_career" ("CAREER_ID") ON DELETE CASCADE
);

-- 2. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS "idx_institution_career_institution" 
  ON "t_institution_career" ("INSTITUTION_ID");
CREATE INDEX IF NOT EXISTS "idx_institution_career_career" 
  ON "t_institution_career" ("CAREER_ID");

-- 3. Migrar datos existentes de CAREER_ID a la nueva tabla
-- Solo para instituciones activas que tienen una carrera asignada
INSERT INTO "t_institution_career" ("INSTITUTION_ID", "CAREER_ID")
SELECT "INSTITUTION_ID", "CAREER_ID" 
FROM "t_institution" 
WHERE "CAREER_ID" IS NOT NULL 
  AND "STATUS" = 1
  AND NOT EXISTS (
    SELECT 1 FROM "t_institution_career" 
    WHERE "t_institution_career"."INSTITUTION_ID" = "t_institution"."INSTITUTION_ID"
  );

-- 4. Hacer nullable la columna CAREER_ID en t_institution (mantener por compatibilidad)
-- Nota: En Supabase/Postgres, ejecutar manualmente si es necesario:
-- ALTER TABLE "t_institution" ALTER COLUMN "CAREER_ID" DROP NOT NULL;

-- Comentarios
COMMENT ON TABLE "t_institution_career" IS 'Relación N:M entre instituciones y carreras que aceptan';
COMMENT ON COLUMN "t_institution_career"."INSTITUTION_ID" IS 'ID de la institución';
COMMENT ON COLUMN "t_institution_career"."CAREER_ID" IS 'ID de la carrera que la institución acepta';
