-- Add SEMESTER column to t_career table
-- This column stores the number of semesters for the career (1-10)

ALTER TABLE "t_career" ADD COLUMN IF NOT EXISTS "SEMESTER" VARCHAR(10);

COMMENT ON COLUMN "t_career"."SEMESTER" IS 'Número de semestres de la carrera (1-10)';