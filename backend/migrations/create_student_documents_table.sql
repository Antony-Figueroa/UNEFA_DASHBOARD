-- Tabla de documentos de estudiantes
-- Almacena documentos subidos por estudiantes (cartas, informes, etc.)

CREATE TABLE IF NOT EXISTS "t_student_documents" (
  "DOCUMENT_ID" SERIAL PRIMARY KEY,
  "STUDENT_ID" INT NOT NULL,
  "DOCUMENT_TYPE" VARCHAR(50) NOT NULL,
  "TITLE" VARCHAR(255) NOT NULL,
  "DESCRIPTION" TEXT,
  "FILE_NAME" VARCHAR(255) NOT NULL,
  "FILE_PATH" VARCHAR(500) NOT NULL,
  "FILE_SIZE" INT,
  "FILE_TYPE" VARCHAR(100),
  "STATUS" VARCHAR(20) NOT NULL DEFAULT 'pending',
  "REJECTION_REASON" TEXT,
  "UPLOADED_AT" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "REVIEWED_AT" TIMESTAMP,
  "REVIEWED_BY" INT,
  "CREATION_DATE" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "MODIF_USER_ID" INT NOT NULL DEFAULT 0,
  "MODIF_USER_DATE" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "STATUS_TABLE" SMALLINT NOT NULL DEFAULT 1,
  
  CONSTRAINT "fk_document_student" FOREIGN KEY ("STUDENT_ID") 
    REFERENCES "t_students" ("STUDENTS_ID") ON DELETE CASCADE,
  CONSTRAINT "fk_document_reviewer" FOREIGN KEY ("REVIEWED_BY") 
    REFERENCES "t_user" ("USER_ID") ON DELETE SET NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_documents_student" ON "t_student_documents" ("STUDENT_ID");
CREATE INDEX IF NOT EXISTS "idx_documents_type" ON "t_student_documents" ("DOCUMENT_TYPE");
CREATE INDEX IF NOT EXISTS "idx_documents_status" ON "t_student_documents" ("STATUS");

COMMENT ON TABLE "t_student_documents" IS 'Documentos subidos por estudiantes';
COMMENT ON COLUMN "t_student_documents"."DOCUMENT_TYPE" IS 'Tipo: carta_aceptacion, informe_mensual, informe_final, constancia, otro';
COMMENT ON COLUMN "t_student_documents"."STATUS" IS 'Estado: pending, approved, rejected';
