-- Tabla de solicitudes de estudiantes
-- Registra las solicitudes realizadas por estudiantes a coordinación

CREATE TABLE IF NOT EXISTS "t_student_requests" (
  "REQUEST_ID" SERIAL PRIMARY KEY,
  "STUDENT_ID" INT NOT NULL,
  "REQUEST_TYPE_ID" INT NOT NULL,
  "SUBJECT" VARCHAR(255) NOT NULL,
  "DESCRIPTION" TEXT NOT NULL,
  "STATUS" VARCHAR(20) NOT NULL DEFAULT 'pending',
  "RESPONSE" TEXT,
  "PROCESSED_BY" INT,
  "PROCESSED_AT" TIMESTAMP,
  "CREATION_DATE" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "MODIF_USER_ID" INT NOT NULL DEFAULT 0,
  "MODIF_USER_DATE" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ELIM_USER_ID" INT NOT NULL DEFAULT 0,
  "ELIM_USER_DATE" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "REST_USER_ID" INT NOT NULL DEFAULT 0,
  "REST_USER_DATE" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "STATUS_TABLE" SMALLINT NOT NULL DEFAULT 1,
  
  CONSTRAINT "fk_student_request_student" FOREIGN KEY ("STUDENT_ID") 
    REFERENCES "t_students" ("STUDENTS_ID") ON DELETE CASCADE,
  CONSTRAINT "fk_student_request_type" FOREIGN KEY ("REQUEST_TYPE_ID") 
    REFERENCES "t_request_types" ("REQUEST_TYPE_ID") ON DELETE RESTRICT
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS "idx_student_requests_student" ON "t_student_requests" ("STUDENT_ID");
CREATE INDEX IF NOT EXISTS "idx_student_requests_status" ON "t_student_requests" ("STATUS");
CREATE INDEX IF NOT EXISTS "idx_student_requests_type" ON "t_student_requests" ("REQUEST_TYPE_ID");

COMMENT ON TABLE "t_student_requests" IS 'Solicitudes realizadas por estudiantes';
COMMENT ON COLUMN "t_student_requests"."STATUS" IS 'Estado: pending, in_review, approved, rejected';
