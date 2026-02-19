-- Activity Log Table for Professional Practices
-- Records daily/weekly student activities during their professional practice

CREATE TABLE IF NOT EXISTS t_activity_logs (
  "ACTIVITY_LOG_ID" SERIAL PRIMARY KEY,
  "PROFESSIONAL_PRACTICE_ID" INT NOT NULL REFERENCES t_professional_practices("PROFESSIONAL_PRACTICE_ID"),
  "STUDENT_ID" INT NOT NULL REFERENCES t_students("STUDENTS_ID"),
  "ACTIVITY_DATE" DATE NOT NULL,
  "WEEK_NUMBER" INT,
  "HOURS_WORKED" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "ACTIVITY_TYPE" VARCHAR(50) NOT NULL DEFAULT 'DIARIA',
  "ACTIVITY_DESCRIPTION" TEXT NOT NULL,
  "TASKS_COMPLETED" TEXT,
  "CHALLENGES" TEXT,
  "LEARNINGS" TEXT,
  "SUPERVISOR_COMMENTS" TEXT,
  "SUPERVISOR_APPROVED" BOOLEAN DEFAULT FALSE,
  "SUPERVISOR_ID" INT,
  "APPROVED_AT" TIMESTAMP,
  "STATUS" SMALLINT NOT NULL DEFAULT 1,
  "CREATED_AT" TIMESTAMP NOT NULL DEFAULT NOW(),
  "UPDATED_AT" TIMESTAMP NOT NULL DEFAULT NOW(),
  "CREATED_BY" INT
);

-- Comments
COMMENT ON TABLE t_activity_logs IS 'Registro de actividades diarias/semanales de estudiantes en prácticas profesionales';
COMMENT ON COLUMN t_activity_logs.ACTIVITY_TYPE IS 'Tipo de actividad: DIARIA (diaria), SEMANAL (semanal)';
COMMENT ON COLUMN t_activity_logs.WEEK_NUMBER IS 'Número de semana de la práctica';
COMMENT ON COLUMN t_activity_logs.SUPERVISOR_APPROVED IS 'Indica si el supervisor/tutor aprobó el registro';
