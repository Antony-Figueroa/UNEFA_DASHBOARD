-- Agregar columnas faltantes a t_activity_logs si no existen
-- Ejecutar esto si la tabla ya existe pero falta la columna ACTIVITY_TYPE

-- Agregar columna ACTIVITY_TYPE si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 't_activity_logs' 
                 AND column_name = 'ACTIVITY_TYPE') THEN
    ALTER TABLE t_activity_logs ADD COLUMN "ACTIVITY_TYPE" VARCHAR(50) NOT NULL DEFAULT 'DIARIA';
  END IF;
END $$;

-- Agregar otras columnas que puedan faltar
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 't_activity_logs' 
                 AND column_name = 'ACTIVITY_DESCRIPTION') THEN
    ALTER TABLE t_activity_logs ADD COLUMN "ACTIVITY_DESCRIPTION" TEXT NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 't_activity_logs' 
                 AND column_name = 'TASKS_COMPLETED') THEN
    ALTER TABLE t_activity_logs ADD COLUMN "TASKS_COMPLETED" TEXT;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 't_activity_logs' 
                 AND column_name = 'CHALLENGES') THEN
    ALTER TABLE t_activity_logs ADD COLUMN "CHALLENGES" TEXT;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 't_activity_logs' 
                 AND column_name = 'LEARNINGS') THEN
    ALTER TABLE t_activity_logs ADD COLUMN "LEARNINGS" TEXT;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 't_activity_logs' 
                 AND column_name = 'SUPERVISOR_COMMENTS') THEN
    ALTER TABLE t_activity_logs ADD COLUMN "SUPERVISOR_COMMENTS" TEXT;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 't_activity_logs' 
                 AND column_name = 'SUPERVISOR_APPROVED') THEN
    ALTER TABLE t_activity_logs ADD COLUMN "SUPERVISOR_APPROVED" BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 't_activity_logs' 
                 AND column_name = 'SUPERVISOR_ID') THEN
    ALTER TABLE t_activity_logs ADD COLUMN "SUPERVISOR_ID" INT;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 't_activity_logs' 
                 AND column_name = 'APPROVED_AT') THEN
    ALTER TABLE t_activity_logs ADD COLUMN "APPROVED_AT" TIMESTAMP;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 't_activity_logs' 
                 AND column_name = 'WEEK_NUMBER') THEN
    ALTER TABLE t_activity_logs ADD COLUMN "WEEK_NUMBER" INT;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 't_activity_logs' 
                 AND column_name = 'HOURS_WORKED') THEN
    ALTER TABLE t_activity_logs ADD COLUMN "HOURS_WORKED" DECIMAL(5,2) NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 't_activity_logs' 
                 AND column_name = 'CREATED_BY') THEN
    ALTER TABLE t_activity_logs ADD COLUMN "CREATED_BY" INT;
  END IF;
END $$;

-- Comentarios
COMMENT ON TABLE t_activity_logs IS 'Registro de actividades diarias/semanales de estudiantes en prácticas profesionales';
