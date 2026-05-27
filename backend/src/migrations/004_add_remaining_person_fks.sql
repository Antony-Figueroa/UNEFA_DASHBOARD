-- Migration 004: Add PERSON_ID foreign keys to remaining entity tables
-- Normaliza la BD para que todas las tablas que referencian personas
-- tengan un FK directo a t_persons, eliminando la necesidad de
-- joins anidados a través de t_students / t_tutors.

-- 1. t_professional_practices → t_persons (vía student)
-- Tabla central: prácticas profesionales. Cada práctica tiene UN estudiante.
ALTER TABLE "t_professional_practices" ADD COLUMN IF NOT EXISTS student_person_id INTEGER;
UPDATE "t_professional_practices" pp
  SET student_person_id = s.person_id
  FROM "t_students" s
  WHERE pp."STUDENTS_ID" = s."STUDENTS_ID";
ALTER TABLE "t_professional_practices" ALTER COLUMN student_person_id SET NOT NULL;
ALTER TABLE "t_professional_practices" ADD CONSTRAINT fk_pp_student_person
  FOREIGN KEY (student_person_id) REFERENCES t_persons(person_id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS idx_pp_student_person_id ON "t_professional_practices"(student_person_id);

-- 2. t_activity_logs → t_persons (vía student)
ALTER TABLE "t_activity_logs" ADD COLUMN IF NOT EXISTS student_person_id INTEGER;
UPDATE "t_activity_logs" al
  SET student_person_id = s.person_id
  FROM "t_students" s
  WHERE al."STUDENT_ID" = s."STUDENTS_ID";
ALTER TABLE "t_activity_logs" ALTER COLUMN student_person_id SET NOT NULL;
ALTER TABLE "t_activity_logs" ADD CONSTRAINT fk_activity_logs_student_person
  FOREIGN KEY (student_person_id) REFERENCES t_persons(person_id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS idx_activity_logs_student_person_id ON "t_activity_logs"(student_person_id);

-- 3. t_student_requests → t_persons (vía student)
ALTER TABLE "t_student_requests" ADD COLUMN IF NOT EXISTS student_person_id INTEGER;
UPDATE "t_student_requests" sr
  SET student_person_id = s.person_id
  FROM "t_students" s
  WHERE sr."STUDENT_ID" = s."STUDENTS_ID";
ALTER TABLE "t_student_requests" ALTER COLUMN student_person_id SET NOT NULL;
ALTER TABLE "t_student_requests" ADD CONSTRAINT fk_student_requests_student_person
  FOREIGN KEY (student_person_id) REFERENCES t_persons(person_id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS idx_student_requests_student_person_id ON "t_student_requests"(student_person_id);

-- 4. t_student_documents → t_persons (vía student)
ALTER TABLE "t_student_documents" ADD COLUMN IF NOT EXISTS student_person_id INTEGER;
UPDATE "t_student_documents" sd
  SET student_person_id = s.person_id
  FROM "t_students" s
  WHERE sd."STUDENT_ID" = s."STUDENTS_ID";
ALTER TABLE "t_student_documents" ALTER COLUMN student_person_id SET NOT NULL;
ALTER TABLE "t_student_documents" ADD CONSTRAINT fk_student_documents_student_person
  FOREIGN KEY (student_person_id) REFERENCES t_persons(person_id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS idx_student_documents_student_person_id ON "t_student_documents"(student_person_id);

-- 5. t_professional_practices_tutor → t_persons (vía tutor)
ALTER TABLE "t_professional_practices_tutor" ADD COLUMN IF NOT EXISTS tutor_person_id INTEGER;
UPDATE "t_professional_practices_tutor" ppt
  SET tutor_person_id = t.person_id
  FROM "t_tutors" t
  WHERE ppt."TUTOR_ID" = t."TUTOR_ID";
ALTER TABLE "t_professional_practices_tutor" ALTER COLUMN tutor_person_id SET NOT NULL;
ALTER TABLE "t_professional_practices_tutor" ADD CONSTRAINT fk_ppt_tutor_person
  FOREIGN KEY (tutor_person_id) REFERENCES t_persons(person_id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS idx_ppt_tutor_person_id ON "t_professional_practices_tutor"(tutor_person_id);

-- 6. t_practice_visits → t_persons (vía tutor)
-- Las visitas siempre tienen un tutor asignado
ALTER TABLE "t_practice_visits" ADD COLUMN IF NOT EXISTS tutor_person_id INTEGER;
UPDATE "t_practice_visits" pv
  SET tutor_person_id = t.person_id
  FROM "t_tutors" t
  WHERE pv."TUTOR_ID" = t."TUTOR_ID";
ALTER TABLE "t_practice_visits" ALTER COLUMN tutor_person_id SET NOT NULL;
ALTER TABLE "t_practice_visits" ADD CONSTRAINT fk_practice_visits_tutor_person
  FOREIGN KEY (tutor_person_id) REFERENCES t_persons(person_id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS idx_practice_visits_tutor_person_id ON "t_practice_visits"(tutor_person_id);
