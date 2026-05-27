-- Migration 004b: Triggers para auto-setear student_person_id / tutor_person_id
-- Elimina la necesidad de actualizar CADA INSERT manualmente.
-- Los triggers se ejecutan BEFORE INSERT y setean el person_id
-- automáticamente desde STUDENT_ID / TUTOR_ID si no se proveyó explícitamente.

-- 1. Trigger para t_professional_practices: auto-setear student_person_id desde STUDENTS_ID
CREATE OR REPLACE FUNCTION trg_set_student_person_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.student_person_id IS NULL AND NEW."STUDENTS_ID" IS NOT NULL THEN
    SELECT person_id INTO NEW.student_person_id
    FROM "t_students"
    WHERE "STUDENTS_ID" = NEW."STUDENTS_ID";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_professional_practices_set_student_person ON "t_professional_practices";
CREATE TRIGGER trg_professional_practices_set_student_person
  BEFORE INSERT ON "t_professional_practices"
  FOR EACH ROW
  EXECUTE FUNCTION trg_set_student_person_id();

-- 2. Trigger para t_activity_logs: auto-setear student_person_id desde STUDENT_ID
DROP TRIGGER IF EXISTS trg_activity_logs_set_student_person ON "t_activity_logs";
CREATE TRIGGER trg_activity_logs_set_student_person
  BEFORE INSERT ON "t_activity_logs"
  FOR EACH ROW
  EXECUTE FUNCTION trg_set_student_person_id();

-- 3. Trigger para t_student_requests: auto-setear student_person_id desde STUDENT_ID
DROP TRIGGER IF EXISTS trg_student_requests_set_student_person ON "t_student_requests";
CREATE TRIGGER trg_student_requests_set_student_person
  BEFORE INSERT ON "t_student_requests"
  FOR EACH ROW
  EXECUTE FUNCTION trg_set_student_person_id();

-- 4. Trigger para t_student_documents: auto-setear student_person_id desde STUDENT_ID
DROP TRIGGER IF EXISTS trg_student_documents_set_student_person ON "t_student_documents";
CREATE TRIGGER trg_student_documents_set_student_person
  BEFORE INSERT ON "t_student_documents"
  FOR EACH ROW
  EXECUTE FUNCTION trg_set_student_person_id();

-- 5. Trigger para t_professional_practices_tutor: auto-setear tutor_person_id desde TUTOR_ID
CREATE OR REPLACE FUNCTION trg_set_tutor_person_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tutor_person_id IS NULL AND NEW."TUTOR_ID" IS NOT NULL THEN
    SELECT person_id INTO NEW.tutor_person_id
    FROM "t_tutors"
    WHERE "TUTOR_ID" = NEW."TUTOR_ID";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ppt_set_tutor_person ON "t_professional_practices_tutor";
CREATE TRIGGER trg_ppt_set_tutor_person
  BEFORE INSERT ON "t_professional_practices_tutor"
  FOR EACH ROW
  EXECUTE FUNCTION trg_set_tutor_person_id();

-- 6. Trigger para t_practice_visits: auto-setear tutor_person_id desde TUTOR_ID
DROP TRIGGER IF EXISTS trg_practice_visits_set_tutor_person ON "t_practice_visits";
CREATE TRIGGER trg_practice_visits_set_tutor_person
  BEFORE INSERT ON "t_practice_visits"
  FOR EACH ROW
  EXECUTE FUNCTION trg_set_tutor_person_id();
