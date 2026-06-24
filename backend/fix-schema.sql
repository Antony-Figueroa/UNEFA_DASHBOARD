-- Fix missing columns for dump-prod-to-local

ALTER TABLE IF EXISTS "t_user" ADD COLUMN IF NOT EXISTS "LAST_LOGIN" TIMESTAMP;
ALTER TABLE "t_professional_practices" ADD COLUMN IF NOT EXISTS "DEPARTMENT" VARCHAR(255) DEFAULT NULL;
ALTER TABLE "t_tutors" ADD COLUMN IF NOT EXISTS "ATTENTION_SCHEDULE" VARCHAR(255) DEFAULT NULL;
ALTER TABLE "t_professional_practices_tutor" ADD COLUMN IF NOT EXISTS tutor_person_id INTEGER;
ALTER TABLE "t_practice_visits" ADD COLUMN IF NOT EXISTS tutor_person_id INTEGER;
ALTER TABLE "t_professional_practices" ADD COLUMN IF NOT EXISTS student_person_id INTEGER;
ALTER TABLE "t_activity_logs" ADD COLUMN IF NOT EXISTS student_person_id INTEGER;
ALTER TABLE "t_student_requests" ADD COLUMN IF NOT EXISTS student_person_id INTEGER;
ALTER TABLE "t_student_documents" ADD COLUMN IF NOT EXISTS student_person_id INTEGER;

-- Verify
SELECT 'LAST_LOGIN' AS col, COUNT(*)::int AS found FROM information_schema.columns WHERE table_name='t_user' AND column_name='LAST_LOGIN'
UNION ALL
SELECT 'DEPARTMENT', COUNT(*)::int FROM information_schema.columns WHERE table_name='t_professional_practices' AND column_name='DEPARTMENT'
UNION ALL
SELECT 'ATTENTION_SCHEDULE', COUNT(*)::int FROM information_schema.columns WHERE table_name='t_tutors' AND column_name='ATTENTION_SCHEDULE'
UNION ALL
SELECT 'tutor_person_id(ppt)', COUNT(*)::int FROM information_schema.columns WHERE table_name='t_professional_practices_tutor' AND column_name='tutor_person_id'
UNION ALL
SELECT 'tutor_person_id(pv)', COUNT(*)::int FROM information_schema.columns WHERE table_name='t_practice_visits' AND column_name='tutor_person_id'
UNION ALL
SELECT 'student_person_id(pp)', COUNT(*)::int FROM information_schema.columns WHERE table_name='t_professional_practices' AND column_name='student_person_id';
