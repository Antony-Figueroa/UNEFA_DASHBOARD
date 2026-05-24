-- Migration 003: Add PERSON_ID foreign keys to specialized tables

-- 1. t_students → t_persons
ALTER TABLE "t_students" ADD COLUMN IF NOT EXISTS person_id INTEGER;
UPDATE "t_students" s SET person_id = m.person_id
FROM _migration_person_id_map m WHERE m.source_table = 't_students' AND m.source_id = s."STUDENTS_ID";
ALTER TABLE "t_students" ALTER COLUMN person_id SET NOT NULL;
ALTER TABLE "t_students" ADD CONSTRAINT fk_students_person FOREIGN KEY (person_id) REFERENCES t_persons(person_id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS idx_students_person_id ON "t_students"(person_id);

-- 2. t_tutors → t_persons
ALTER TABLE "t_tutors" ADD COLUMN IF NOT EXISTS person_id INTEGER;
UPDATE "t_tutors" t SET person_id = m.person_id
FROM _migration_person_id_map m WHERE m.source_table = 't_tutors' AND m.source_id = t."TUTOR_ID";
ALTER TABLE "t_tutors" ALTER COLUMN person_id SET NOT NULL;
ALTER TABLE "t_tutors" ADD CONSTRAINT fk_tutors_person FOREIGN KEY (person_id) REFERENCES t_persons(person_id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS idx_tutors_person_id ON "t_tutors"(person_id);

-- 3. t_user → t_persons
ALTER TABLE "t_user" ADD COLUMN IF NOT EXISTS person_id INTEGER;
UPDATE "t_user" u SET person_id = m.person_id
FROM _migration_person_id_map m WHERE m.source_table = 't_user' AND m.source_id = u."USER_ID";
ALTER TABLE "t_user" ALTER COLUMN person_id SET NOT NULL;
ALTER TABLE "t_user" ADD CONSTRAINT fk_user_person FOREIGN KEY (person_id) REFERENCES t_persons(person_id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS idx_user_person_id ON "t_user"(person_id);

-- 4. t_institution_manager → t_persons
ALTER TABLE "t_institution_manager" ADD COLUMN IF NOT EXISTS person_id INTEGER;
UPDATE "t_institution_manager" im SET person_id = m.person_id
FROM _migration_person_id_map m WHERE m.source_table = 't_institution_manager' AND m.source_id = im."MANAGER_ID";
ALTER TABLE "t_institution_manager" ALTER COLUMN person_id SET NOT NULL;
ALTER TABLE "t_institution_manager" ADD CONSTRAINT fk_manager_person FOREIGN KEY (person_id) REFERENCES t_persons(person_id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS idx_manager_person_id ON "t_institution_manager"(person_id);
