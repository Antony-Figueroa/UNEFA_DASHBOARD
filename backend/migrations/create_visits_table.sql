-- Tabla para registro de visitas de seguimiento a prácticas profesionales
-- Esta tabla almacena cada visita realizada por el tutor académico

CREATE TABLE IF NOT EXISTS t_practice_visits (
  "VISIT_ID" SERIAL PRIMARY KEY,
  "PROFESSIONAL_PRACTICE_ID" INT NOT NULL REFERENCES t_professional_practices("PROFESSIONAL_PRACTICE_ID"),
  "TUTOR_ID" INT NOT NULL REFERENCES t_tutors("TUTOR_ID"),
  "VISIT_DATE" TIMESTAMP NOT NULL DEFAULT NOW(),
  "VISIT_TYPE" VARCHAR(50) NOT NULL DEFAULT 'PRESENCIAL',
  "HOURS_WORKED" DECIMAL(5,2) DEFAULT 0,
  "ACTIVITIES_PERFORMED" TEXT,
  "OBSERVATIONS" TEXT,
  "RECOMMENDATIONS" TEXT,
  "STATUS" SMALLINT NOT NULL DEFAULT 1,
  "CREATED_AT" TIMESTAMP NOT NULL DEFAULT NOW(),
  "UPDATED_AT" TIMESTAMP NOT NULL DEFAULT NOW(),
  "CREATED_BY" INT
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_visits_practice_id ON t_practice_visits("PROFESSIONAL_PRACTICE_ID");
CREATE INDEX IF NOT EXISTS idx_visits_tutor_id ON t_practice_visits("TUTOR_ID");
CREATE INDEX IF NOT EXISTS idx_visits_date ON t_practice_visits("VISIT_DATE");
CREATE INDEX IF NOT EXISTS idx_visits_status ON t_practice_visits("STATUS");

-- Comentarios para documentación
COMMENT ON TABLE t_practice_visits IS 'Registro de visitas de seguimiento a prácticas profesionales';
COMMENT ON COLUMN t_practice_visits."VISIT_TYPE" IS 'Tipo de visita: PRESENCIAL, VIRTUAL, TELEFONICA';
COMMENT ON COLUMN t_practice_visits."HOURS_WORKED" IS 'Horas trabajadas registradas en la visita';
COMMENT ON COLUMN t_practice_visits."ACTIVITIES_PERFORMED" IS 'Descripción de actividades realizadas por el estudiante';
COMMENT ON COLUMN t_practice_visits."OBSERVATIONS" IS 'Observaciones generales del tutor';
COMMENT ON COLUMN t_practice_visits."RECOMMENDATIONS" IS 'Recomendaciones del tutor para mejorar el desempeño';
