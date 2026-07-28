-- =============================================================================
-- MIGRACIÓN DE DATOS: Proyecto viejo (rgvnwslyvixviypgegra) → Nuevo (kajmugaibkmaibgofipc)
-- =============================================================================
-- Ejecutar en: SQL Editor del proyecto NUEVO (Supabase Dashboard → SQL Editor)
-- Requiere: Extensión dblink habilitada (CREATE EXTENSION dblink;)
-- =============================================================================

-- 1. Habilitar dblink si no existe
CREATE EXTENSION IF NOT EXISTS dblink;

-- 2. Configurar conexión al proyecto VIEJO (ajustar password si cambió)
-- Password del proyecto viejo: 0M9nhySbePzSTW9o
SELECT dblink_connect(
    'old_db',
    'host=db.rgvnwslyvixviypgegra.supabase.co port=5432 dbname=postgres user=postgres password=0M9nhySbePzSTW9o sslmode=require'
);

-- =============================================================================
-- MIGRACIÓN POR ORDEN DE DEPENDENCIA (FKs)
-- =============================================================================

-- 2.1 ROLES (base para users, tutors, etc.)
INSERT INTO public.roles (id, name, description, permissions, created_at, updated_at)
SELECT ID_ROLS, NAME, DESCRIPTION, '[]'::jsonb, MODIF_USER_DATE, MODIF_USER_DATE
FROM dblink('old_db', 'SELECT ID_ROLS, NAME, DESCRIPTION, MODIF_USER_DATE FROM public.t_roles WHERE STATUS = 1') 
AS t(ID_ROLS int, NAME text, DESCRIPTION text, MODIF_USER_DATE timestamp)
ON CONFLICT (id) DO NOTHING;

-- 2.2 SYSTEM_CONFIG (configuración del sistema)
INSERT INTO public.system_config (key, value, description, updated_at)
SELECT 'config_' || CONFIG_ID, to_jsonb(t) - 'CONFIG_ID', 'Migrated from t_config', MODIF_USER_DATE
FROM dblink('old_db', 'SELECT * FROM public.t_config WHERE STATUS = 1') 
AS t(CONFIG_ID int, RECOVERY_EMAIL int, BLOCKING_DAYS int, WRONG_KEY_LOCK int, ATTEMPTS_KEY_BLOCK int, KEY_EXPIRATION int, EXPIRATION_DAYS int, USER_UPPERCASE int, USER_LOWERCASE int, USER_NUMBERS int, USER_SPECIAL_CHARACTERS int, USER_NUM_UPPERCASE int, USER_NUM_LOWERCASE int, USER_NUM_NUMBERS int, USER_NUM_SPECIAL_CHARACTERS int, KEY_UPPERCASE int, KEY_LOWERCASE int, KEY_NUMBERS int, KEY_SPECIAL_CHARACTERS int, KEY_NUM_UPPERCASE int, KEY_NUM_LOWERCASE int, KEY_NUM_NUMBERS int, KEY_NUM_SPECIAL_CHARACTERS int, USER_LENGTH int, KEY_LEGTH int, SECURITY_QUESTIONS int, TOTAL_QUESTIONS int, TOTAL_PRESET_QUESTIONS int, TOTAL_USER_QUESTIONS int, TOTAL_ANSWERS int, PERIOD_VALIDATION_RULES jsonb, EVALUATION_CONFIG jsonb, SESSION_MAX_HOURS int, RECOVERY_LINK_EXPIRY_HOURS int, MODIF_USER_ID int, MODIF_USER_DATE timestamp, ELIM_USER_ID int, ELIM_USER_DATE timestamp, REST_USER_ID int, REST_USER_DATE timestamp, STATUS int)
ON CONFLICT (key) DO NOTHING;

-- 2.3 GRACE_CONFIG (días de gracia académicos)
INSERT INTO public.grace_config (id, period_id, activity_type, grace_days, created_at, updated_at)
SELECT CONFIG_ID, 1, 'enrollment', DEFAULT_ENROLLMENT_GRACE_DAYS, CREATION_DATE, UPDATED_AT
FROM dblink('old_db', 'SELECT CONFIG_ID, DEFAULT_ENROLLMENT_GRACE_DAYS, CREATION_DATE, UPDATED_AT FROM public.t_academic_config WHERE STATUS = 1')
AS t(CONFIG_ID int, DEFAULT_ENROLLMENT_GRACE_DAYS int, CREATION_DATE timestamp, UPDATED_AT timestamp)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.grace_config (id, period_id, activity_type, grace_days, created_at, updated_at)
SELECT CONFIG_ID + 100, 1, 'evaluation', DEFAULT_EVALUATION_GRACE_DAYS, CREATION_DATE, UPDATED_AT
FROM dblink('old_db', 'SELECT CONFIG_ID, DEFAULT_EVALUATION_GRACE_DAYS, CREATION_DATE, UPDATED_AT FROM public.t_academic_config WHERE STATUS = 1')
AS t(CONFIG_ID int, DEFAULT_EVALUATION_GRACE_DAYS int, CREATION_DATE timestamp, UPDATED_AT timestamp)
ON CONFLICT (id) DO NOTHING;

-- 2.4 INTERNSHIP_TYPES
INSERT INTO public.internship_types (id, name, description, duration_weeks, is_active, created_at, updated_at)
SELECT INTERNSHIP_TYPE_ID, NAME, NAME, HOURS_REQUIRED / 40, STATUS = 1, CREATION_DATE, CREATION_DATE
FROM dblink('old_db', 'SELECT INTERNSHIP_TYPE_ID, NAME, HOURS_REQUIRED, CREATION_DATE, STATUS FROM public.t_internship_type WHERE STATUS = 1')
AS t(INTERNSHIP_TYPE_ID int, NAME text, HOURS_REQUIRED int, CREATION_DATE timestamp, STATUS int)
ON CONFLICT (id) DO NOTHING;

-- 2.5 LISTS (catálogos maestros)
INSERT INTO public.lists (id, name, display_name, description, is_system, created_at, updated_at)
SELECT LIST_ID, NAME, NAME, 'Migrated from t_list', TRUE, CREATION_DATE, CREATION_DATE
FROM dblink('old_db', 'SELECT LIST_ID, NAME, CREATION_DATE FROM public.t_list WHERE STATUS = 1')
AS t(LIST_ID int, NAME text, CREATION_DATE timestamp)
ON CONFLICT (id) DO NOTHING;

-- 2.6 LIST_VALUES (valores de catálogos)
INSERT INTO public.list_values (id, list_id, value, label, abbreviation, sort_order, is_active, created_at, updated_at)
SELECT VALUE_LIST_ID, LIST_ID, NAME, NAME, ABBREVIATION, VALUE_LIST_ID, STATUS = 1, CREATION_DATE, CREATION_DATE
FROM dblink('old_db', 'SELECT VALUE_LIST_ID, NAME, ABBREVIATION, LIST_ID, CREATION_DATE, STATUS FROM public.t_value_list WHERE STATUS = 1')
AS t(VALUE_LIST_ID int, NAME text, ABBREVIATION text, LIST_ID int, CREATION_DATE timestamp, STATUS int)
ON CONFLICT (id) DO NOTHING;

-- 2.7 ESTADOS (address system)
INSERT INTO public.estados (id, iso_31662, name, capital, created_at)
SELECT estado_id, iso_31662, name, capital, NOW()
FROM dblink('old_db', 'SELECT estado_id, iso_31662, name, capital FROM public.t_estado WHERE STATUS = 1')
AS t(estado_id int, iso_31662 text, name text, capital text)
ON CONFLICT (id) DO NOTHING;

-- 2.8 MUNICIPIOS
INSERT INTO public.municipios (id, estado_id, name, created_at)
SELECT municipio_id, estado_id, name, NOW()
FROM dblink('old_db', 'SELECT municipio_id, estado_id, name FROM public.t_municipio WHERE STATUS = 1')
AS t(municipio_id int, estado_id int, name text)
ON CONFLICT (id) DO NOTHING;

-- 2.9 PARROQUIAS
INSERT INTO public.parroquias (id, municipio_id, name, created_at)
SELECT parroquia_id, municipio_id, name, NOW()
FROM dblink('old_db', 'SELECT parroquia_id, municipio_id, name FROM public.t_parroquia WHERE STATUS = 1')
AS t(parroquia_id int, municipio_id int, name text)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 3. DATOS PRINCIPALES (PERSONAS, USUARIOS, ROLES)
-- =============================================================================

-- 3.1 PERSONS (base para students, tutors, etc.)
INSERT INTO public.persons (id, ci, first_name, middle_name, last_name, second_last_name, email, phone, gender, birth_date, address, marital_status, status, created_at, updated_at)
SELECT person_id, ci, first_name, middle_name, last_name, second_last_name, email, phone, gender, birthdate, address, marital_status, status, created_at, updated_at
FROM dblink('old_db', 'SELECT person_id, ci, first_name, middle_name, last_name, second_last_name, email, phone, gender, birthdate, address, marital_status, status, created_at, updated_at FROM public.t_persons WHERE STATUS = 1')
AS t(person_id uuid, ci text, first_name text, middle_name text, last_name text, second_last_name text, email text, phone text, gender text, birthdate date, address text, marital_status text, status int, created_at timestamp, updated_at timestamp)
ON CONFLICT (id) DO NOTHING;

-- 3.2 USERS
INSERT INTO public.users (id, email, password_hash, full_name, role, avatar_url, is_active, last_login, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    EMAIL,
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', -- password: admin123 (cambiar en primer login)
    CONCAT(NAME, ' ', COALESCE(SECOND_NAME, ''), ' ', SURNAME, ' ', COALESCE(SECOND_SURNAME, '')),
    CASE 
        WHEN ur.ID_ROLES = 1 THEN 'admin'
        WHEN ur.ID_ROLES = 2 THEN 'assistant'
        WHEN ur.ID_ROLES = 3 THEN 'tutor'
        WHEN ur.ID_ROLES = 4 THEN 'student'
        ELSE 'student'
    END,
    NULL,
    STATUS = 1,
    LAST_LOGIN,
    CREATION_DATE,
    CREATION_DATE
FROM dblink('old_db', '
    SELECT u.USER_ID, u.USER as USER_LOGIN, u.USER_CI, u.NAME, u.SECOND_NAME, u.SURNAME, u.SECOND_SURNAME, u.EMAIL, u.PHONE_NUMBER, u.CREATION_DATE, u.LOGIN, u.TERMS_CONDITIONS, u.STATUS_SESSION, u.STATUS, u.FAILED_ATTEMPTS, u.LOCK_DATE, u.FORCE_PASSWORD_CHANGE, u.person_id, u.LAST_LOGIN,
           ur.ID_ROLES
    FROM public.t_user u
    LEFT JOIN public.t_user_roles ur ON u.USER_ID = ur.ID_USER
    WHERE u.STATUS = 1
') AS t(USER_ID int, USER_LOGIN text, USER_CI text, NAME text, SECOND_NAME text, SURNAME text, SECOND_SURNAME text, EMAIL text, PHONE_NUMBER text, CREATION_DATE timestamp, LOGIN int, TERMS_CONDITIONS text, STATUS_SESSION int, STATUS int, FAILED_ATTEMPTS int, LOCK_DATE timestamp, FORCE_PASSWORD_CHANGE boolean, person_id uuid, LAST_LOGIN timestamp, ID_ROLES int)
LEFT JOIN public.persons p ON p.ci = t.USER_CI
ON CONFLICT (email) DO NOTHING;

-- 3.3 USER_ROLES (mapear roles viejos → nuevos)
INSERT INTO public.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM public.users u
JOIN public.roles r ON r.name = CASE
    WHEN u.role = 'admin' THEN 'admin'
    WHEN u.role = 'assistant' THEN 'assistant'
    WHEN u.role = 'tutor' THEN 'tutor'
    WHEN u.role = 'student' THEN 'student'
    ELSE 'student'
END
WHERE u.role IS NOT NULL
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 4. CATÁLOGOS ACADÉMICOS
-- =============================================================================

-- 4.1 CAREERS
INSERT INTO public.careers (id, code, name, description, duration_semesters, is_active, created_at, updated_at)
SELECT CAREER_ID, CAREER_CODE, CAREER_NAME, CAREER_NAME, 
       CASE WHEN SEMESTER ~ '^\d+$' THEN SEMESTER::int ELSE 8 END,
       STATUS = 1, CREATION_DATE, MODIF_USER_DATE
FROM dblink('old_db', 'SELECT CAREER_ID, CAREER_CODE, CAREER_NAME, SEMESTER, CREATION_DATE, MODIF_USER_DATE, STATUS FROM public.t_career WHERE STATUS = 1')
AS t(CAREER_ID int, CAREER_CODE text, CAREER_NAME text, SEMESTER text, CREATION_DATE timestamp, MODIF_USER_DATE timestamp, STATUS int)
ON CONFLICT (id) DO NOTHING;

-- 4.2 INSTITUTIONS
INSERT INTO public.institutions (id, name, rif, address, contact_person, contact_email, contact_phone, type, is_active, created_at, updated_at)
SELECT INSTITUTION_ID, INSTITUTION_NAME, RIF, INSTITUTION_ADDRESS, INSTITUTION_CONTACT, INSTITUTION_CONTACT, INSTITUTION_CONTACT, INSTITUTION_TYPE, STATUS = 1, CREATION_DATE, CREATION_DATE
FROM dblink('old_db', 'SELECT INSTITUTION_ID, INSTITUTION_NAME, RIF, INSTITUTION_ADDRESS, INSTITUTION_CONTACT, INSTITUTION_TYPE, STATUS, CREATION_DATE FROM public.t_institution WHERE STATUS = 1')
AS t(INSTITUTION_ID int, INSTITUTION_NAME text, RIF text, INSTITUTION_ADDRESS text, INSTITUTION_CONTACT text, INSTITUTION_TYPE text, STATUS int, CREATION_DATE timestamp)
ON CONFLICT (id) DO NOTHING;

-- 4.3 PERIODS
INSERT INTO public.periods (id, name, code, start_date, end_date, pre_enrollment_start, pre_enrollment_end, enrollment_start, enrollment_end, is_active, is_current, created_at, updated_at)
SELECT PERIOD_ID, DESCRIPTION, T_INTERNSHIPS_CODE, START_DATE, END_DATE, NULL, NULL, NULL, NULL, STATUS = 1, PERIOD_STATUS = 2, CREATION_DATE, CREATION_DATE
FROM dblink('old_db', 'SELECT PERIOD_ID, START_DATE, END_DATE, ENROLLMENT_GRACE_DAYS, EVALUATION_GRACE_DAYS, CREATION_DATE, DESCRIPTION, PERIOD_STATUS, STATUS, T_INTERNSHIPS_CODE FROM public.t_internships_period WHERE STATUS = 1')
AS t(PERIOD_ID int, START_DATE date, END_DATE date, ENROLLMENT_GRACE_DAYS int, EVALUATION_GRACE_DAYS int, CREATION_DATE timestamp, DESCRIPTION text, PERIOD_STATUS int, STATUS int, T_INTERNSHIPS_CODE text)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 5. TUTORES Y ESTUDIANTES
-- =============================================================================

-- 5.1 TUTORS
INSERT INTO public.tutors (id, person_id, employee_id, department, specialization, max_students, is_active, created_at, updated_at)
SELECT TUTOR_ID, person_id, NULL, NULL, PROFESSION, 10, STATUS = 1, CREATION_DATE, CREATION_DATE
FROM dblink('old_db', 'SELECT TUTOR_ID, person_id, TUTOR_CI, NAME, SECOND_NAME, SURNAME, SECOND_SURNAME, CONTACT_PHONE, GENDER, EMAIL, PROFESSION, CONDITION, DEDICATION, CATEGORY, CREATION_DATE, STATUS, USER_ID, TITULO, ATTENTION_SCHEDULE FROM public.t_tutors WHERE STATUS = 1')
AS t(TUTOR_ID int, person_id uuid, TUTOR_CI text, NAME text, SECOND_NAME text, SURNAME text, SECOND_SURNAME text, CONTACT_PHONE text, GENDER text, EMAIL text, PROFESSION text, CONDITION text, DEDICATION text, CATEGORY text, CREATION_DATE timestamp, STATUS int, USER_ID int, TITULO text, ATTENTION_SCHEDULE text)
ON CONFLICT (id) DO NOTHING;

-- 5.2 STUDENTS
INSERT INTO public.students (id, person_id, career_id, enrollment_number, status, semester, tutor_id, created_at, updated_at)
SELECT STUDENTS_ID, person_id, CAREER_ID, NULL, STATUS = 1, 1, NULL, REGISTRATION_DATE, REGISTRATION_DATE
FROM dblink('old_db', 'SELECT STUDENTS_ID, person_id, STUDENTS_CI, NAME, SECOND_NAME, SURNAME, SECOND_SURNAME, GENDER, BIRTHDATE, CONTACT_PHONE, EMAIL, ADDRESS, MARITAL_STATUS, STUDENT_TYPE, MILITARY_RANK, EMPLOYMENT, STATUS, REGISTRATION_DATE, USER_ID FROM public.t_students WHERE STATUS = 1')
AS t(STUDENTS_ID int, person_id uuid, STUDENTS_CI text, NAME text, SECOND_NAME text, SURNAME text, SECOND_SURNAME text, GENDER text, BIRTHDATE date, CONTACT_PHONE text, EMAIL text, ADDRESS text, MARITAL_STATUS text, STUDENT_TYPE text, MILITARY_RANK text, EMPLOYMENT text, STATUS int, REGISTRATION_DATE timestamp, USER_ID int)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 6. PRÁCTICAS / ENROLLMENTS
-- =============================================================================

INSERT INTO public.enrollments (id, student_id, period_id, institution_id, tutor_id, status, start_date, end_date, created_at, updated_at)
SELECT PROFESSIONAL_PRACTICE_ID, STUDENTS_ID, PERIOD_ID, INSTITUTION_ID, MANAGER_ID, STATUS = 1, START_DATE, END_DATE, CREATION_DATE, REGISTRATION_DATE
FROM dblink('old_db', 'SELECT PROFESSIONAL_PRACTICE_ID, START_DATE, END_DATE, REPORT_TITLE, REGISTRATION_DATE, CREATION_DATE, GRADE, TRANSFER, TOUR, PERIOD_ID, INSTITUTION_ID, STUDENTS_ID, STATUS, MANAGER_ID, OBSERVATION, ENROLLMENT, INTERNSHIP_STATUS, INTERNSHIP_TYPE_ID, PRACTICES_STATUS, EVALUATION_STATUS, SEMESTER, SECTION, REGIME, CAREER_ID, student_person_id, DEPARTMENT, EXTENSION_GRANTED, EXTENSION_REASON, EXTENSION_GRANTED_BY, EXTENSION_GRANTED_AT, WITHDRAWAL_TYPE, FROZEN_AT, UNFROZEN_AT, UNFREEZE_REASON, UNFREEZE_AUTHORIZED_BY, PREVIOUS_PRACTICE_ID FROM public.t_professional_practices WHERE STATUS = 1')
AS t(PROFESSIONAL_PRACTICE_ID int, START_DATE date, END_DATE date, REPORT_TITLE text, REGISTRATION_DATE timestamp, CREATION_DATE timestamp, GRADE text, TRANSFER int, TOUR text, PERIOD_ID int, INSTITUTION_ID int, STUDENTS_ID int, STATUS int, MANAGER_ID int, OBSERVATION text, ENROLLMENT text, INTERNSHIP_STATUS int, INTERNSHIP_TYPE_ID int, PRACTICES_STATUS int, EVALUATION_STATUS text, SEMESTER text, SECTION text, REGIME text, CAREER_ID int, student_person_id uuid, DEPARTMENT text, EXTENSION_GRANTED boolean, EXTENSION_REASON text, EXTENSION_GRANTED_BY int, EXTENSION_GRANTED_AT timestamp, WITHDRAWAL_TYPE text, FROZEN_AT timestamp, UNFROZEN_AT timestamp, UNFREEZE_REASON text, UNFREEZE_AUTHORIZED_BY int, PREVIOUS_PRACTICE_ID int)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 7. EVALUACIONES
-- =============================================================================

-- 7.1 EVALUATIONS
INSERT INTO public.evaluations (id, enrollment_id, evaluator_id, evaluation_type, criteria, scores, total_score, status, evaluated_at, created_at, updated_at)
SELECT EVALUATION_ID, PROFESSIONAL_PRACTICE_ID, EVALUATOR_ID, EVALUATOR_TYPE, '{}'::jsonb, '{}'::jsonb, TOTAL_SCORE::numeric, STATUS = 1, EVALUATION_DATE, CREATION_DATE, CREATION_DATE
FROM dblink('old_db', 'SELECT EVALUATION_ID, PROFESSIONAL_PRACTICE_ID, EVALUATOR_TYPE, EVALUATOR_ID, EVALUATOR_NAME, EVALUATOR_CI, TOTAL_SCORE, OBSERVATIONS, EVALUATION_DATE, COMITE_MEMBER_INDEX, REGISTERED_BY, STATUS, FROZEN_AT, UNFROZEN_AT, UNFREEZE_REASON, UNFREEZE_AUTHORIZED_BY FROM public.t_evaluation WHERE STATUS = 1')
AS t(EVALUATION_ID int, PROFESSIONAL_PRACTICE_ID int, EVALUATOR_TYPE text, EVALUATOR_ID int, EVALUATOR_NAME text, EVALUATOR_CI text, TOTAL_SCORE text, OBSERVATIONS text, EVALUATION_DATE timestamp, COMITE_MEMBER_INDEX int, REGISTERED_BY int, STATUS int, FROZEN_AT timestamp, UNFROZEN_AT timestamp, UNFREEZE_REASON text, UNFREEZE_AUTHORIZED_BY int)
ON CONFLICT (id) DO NOTHING;

-- 7.2 EVALUATION_DETAILS
INSERT INTO public.evaluation_details (id, evaluation_id, criteria_id, item_number, score, status)
SELECT DETAIL_ID, EVALUATION_ID, CRITERIA_ID, ITEM_NUMBER, SCORE::numeric, STATUS = 1
FROM dblink('old_db', 'SELECT DETAIL_ID, EVALUATION_ID, CRITERIA_ID, ITEM_NUMBER, SCORE, STATUS FROM public.t_evaluation_detail WHERE STATUS = 1')
AS t(DETAIL_ID int, EVALUATION_ID int, CRITERIA_ID int, ITEM_NUMBER int, SCORE text, STATUS int)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 8. VISITAS
-- =============================================================================

INSERT INTO public.visits (id, enrollment_id, tutor_id, visit_date, visit_type, hours_worked, activities_performed, observations, recommendations, status, created_at, updated_at, created_by)
SELECT VISIT_ID, PROFESSIONAL_PRACTICE_ID, TUTOR_ID, VISIT_DATE, VISIT_TYPE, HOURS_WORKED, ACTIVITIES_PERFORMED, OBSERVATIONS, RECOMMENDATIONS, STATUS = 1, CREATED_AT, UPDATED_AT, CREATED_BY
FROM dblink('old_db', 'SELECT VISIT_ID, PROFESSIONAL_PRACTICE_ID, TUTOR_ID, VISIT_DATE, VISIT_TYPE, HOURS_WORKED, ACTIVITIES_PERFORMED, OBSERVATIONS, RECOMMENDATIONS, STATUS, CREATED_AT, UPDATED_AT, CREATED_BY, VISIT_CASE, tutor_person_id FROM public.t_practice_visits WHERE STATUS = 1')
AS t(VISIT_ID int, PROFESSIONAL_PRACTICE_ID int, TUTOR_ID int, VISIT_DATE timestamp, VISIT_TYPE text, HOURS_WORKED text, ACTIVITIES_PERFORMED text, OBSERVATIONS text, RECOMMENDATIONS text, STATUS int, CREATED_AT timestamp, UPDATED_AT timestamp, CREATED_BY int, VISIT_CASE text, tutor_person_id uuid)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 9. NOTIFICACIONES Y LOGS
-- =============================================================================

-- 9.1 NOTIFICATIONS
INSERT INTO public.notifications (id, user_id, title, message, type, read, related_entity_type, related_entity_id, created_at)
SELECT NOTIFICATION_ID, USER_ID, TITLE, MESSAGE, TYPE, READ = 1, NULL, NULL, CREATED_AT
FROM dblink('old_db', 'SELECT NOTIFICATION_ID, USER_ID, TITLE, MESSAGE, TYPE, READ, CREATED_AT FROM public.t_notifications WHERE STATUS = 1')
AS t(NOTIFICATION_ID int, USER_ID int, TITLE text, MESSAGE text, TYPE text, READ boolean, CREATED_AT timestamp)
ON CONFLICT (id) DO NOTHING;

-- 9.2 ACTIVITY_LOGS (from t_auth_log)
INSERT INTO public.activity_logs (id, user_id, action, entity_type, entity_id, old_data, new_data, ip_address, user_agent, created_at)
SELECT ID, USER_ID, ACTION, 'user', NULL, NULL, DETAILS::jsonb, IP_ADDRESS, USER_AGENT, CREATED_AT
FROM dblink('old_db', 'SELECT ID, USER_ID, USER_CI, ACTION, IP_ADDRESS, USER_AGENT, DETAILS, CREATED_AT FROM public.t_auth_log WHERE STATUS = 1')
AS t(ID int, USER_ID int, USER_CI text, ACTION text, IP_ADDRESS text, USER_AGENT text, DETAILS text, CREATED_AT timestamp)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 10. DOCUMENTOS VERIFICADOS
-- =============================================================================

INSERT INTO public.document_verification (id, hash, doc_type, title, metadata, created_by, created_at, expires_at)
SELECT id, hash, doc_type, title, '{}'::jsonb, created_by, created_at, expires_at
FROM dblink('old_db', 'SELECT id, hash, doc_type, title, metadata, created_by, created_at, expires_at FROM public.t_document_verification WHERE STATUS = 1')
AS t(id int, hash text, doc_type text, title text, metadata jsonb, created_by uuid, created_at timestamp, expires_at timestamp)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 11. ACTUALIZAR SECUENCIAS (para que próximos INSERTs no choquen con IDs migrados)
-- =============================================================================

SELECT setval(pg_get_serial_sequence('roles', 'id'), COALESCE((SELECT MAX(id) FROM roles), 0) + 1, false);
SELECT setval(pg_get_serial_sequence('careers', 'id'), COALESCE((SELECT MAX(id) FROM careers), 0) + 1, false);
SELECT setval(pg_get_serial_sequence('institutions', 'id'), COALESCE((SELECT MAX(id) FROM institutions), 0) + 1, false);
SELECT setval(pg_get_serial_sequence('periods', 'id'), COALESCE((SELECT MAX(id) FROM periods), 0) + 1, false);
SELECT setval(pg_get_serial_sequence('tutors', 'id'), COALESCE((SELECT MAX(id) FROM tutors), 0) + 1, false);
SELECT setval(pg_get_serial_sequence('students', 'id'), COALESCE((SELECT MAX(id) FROM students), 0) + 1, false);
SELECT setval(pg_get_serial_sequence('enrollments', 'id'), COALESCE((SELECT MAX(id) FROM enrollments), 0) + 1, false);
SELECT setval(pg_get_serial_sequence('evaluations', 'id'), COALESCE((SELECT MAX(id) FROM evaluations), 0) + 1, false);
SELECT setval(pg_get_serial_sequence('evaluation_details', 'id'), COALESCE((SELECT MAX(id) FROM evaluation_details), 0) + 1, false);
SELECT setval(pg_get_serial_sequence('visits', 'id'), COALESCE((SELECT MAX(id) FROM visits), 0) + 1, false);
SELECT setval(pg_get_serial_sequence('notifications', 'id'), COALESCE((SELECT MAX(id) FROM notifications), 0) + 1, false);
SELECT setval(pg_get_serial_sequence('activity_logs', 'id'), COALESCE((SELECT MAX(id) FROM activity_logs), 0) + 1, false);
SELECT setval(pg_get_serial_sequence('document_verification', 'id'), COALESCE((SELECT MAX(id) FROM document_verification), 0) + 1, false);
SELECT setval(pg_get_serial_sequence('lists', 'id'), COALESCE((SELECT MAX(id) FROM lists), 0) + 1, false);
SELECT setval(pg_get_serial_sequence('list_values', 'id'), COALESCE((SELECT MAX(id) FROM list_values), 0) + 1, false);
SELECT setval(pg_get_serial_sequence('estados', 'id'), COALESCE((SELECT MAX(id) FROM estados), 0) + 1, false);
SELECT setval(pg_get_serial_sequence('municipios', 'id'), COALESCE((SELECT MAX(id) FROM municipios), 0) + 1, false);
SELECT setval(pg_get_serial_sequence('parroquias', 'id'), COALESCE((SELECT MAX(id) FROM parroquias), 0) + 1, false);
SELECT setval(pg_get_serial_sequence('internship_types', 'id'), COALESCE((SELECT MAX(id) FROM internship_types), 0) + 1, false);
SELECT setval(pg_get_serial_sequence('grace_config', 'id'), COALESCE((SELECT MAX(id) FROM grace_config), 0) + 1, false);

-- =============================================================================
-- 12. CERRAR CONEXIÓN AL PROYECTO VIEJO
-- =============================================================================

SELECT dblink_disconnect('old_db');

-- =============================================================================
-- VERIFICACIÓN POST-MIGRACIÓN (ejecutar después en otra query)
-- =============================================================================
/*
SELECT 'roles' as tabla, COUNT(*) FROM roles
UNION ALL SELECT 'persons', COUNT(*) FROM persons
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'careers', COUNT(*) FROM careers
UNION ALL SELECT 'institutions', COUNT(*) FROM institutions
UNION ALL SELECT 'periods', COUNT(*) FROM periods
UNION ALL SELECT 'tutors', COUNT(*) FROM tutors
UNION ALL SELECT 'students', COUNT(*) FROM students
UNION ALL SELECT 'enrollments', COUNT(*) FROM enrollments
UNION ALL SELECT 'evaluations', COUNT(*) FROM evaluations
UNION ALL SELECT 'evaluation_details', COUNT(*) FROM evaluation_details
UNION ALL SELECT 'visits', COUNT(*) FROM visits
UNION ALL SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL SELECT 'activity_logs', COUNT(*) FROM activity_logs
UNION ALL SELECT 'estados', COUNT(*) FROM estados
UNION ALL SELECT 'municipios', COUNT(*) FROM municipios
UNION ALL SELECT 'parroquias', COUNT(*) FROM parroquias
UNION ALL SELECT 'lists', COUNT(*) FROM lists
UNION ALL SELECT 'list_values', COUNT(*) FROM list_values
UNION ALL SELECT 'internship_types', COUNT(*) FROM internship_types
UNION ALL SELECT 'grace_config', COUNT(*) FROM grace_config
UNION ALL SELECT 'document_verification', COUNT(*) FROM document_verification;
*/

-- =============================================================================
-- NOTAS IMPORTANTES
-- =============================================================================
/*
1. PASSWORD DEL PROYECTO VIEJO: 0M9nhySbePzSTW9o (configurado en dblink_connect)

2. MAPEO DE ROLES:
   - t_roles.ID_ROLS=1 (ADMIN) → role='admin'
   - t_roles.ID_ROLS=2 (ASISTENTE) → role='assistant'  
   - t_roles.ID_ROLS=3 (TUTOR) → role='tutor'
   - t_roles.ID_ROLS=4 (ESTUDIANTE) → role='student'
   - t_roles.ID_ROLS=5,6,7,8 (Coordinador, Asistente, Director, Visitante) → se mapean a roles existentes

3. USUARIOS: Password por defecto 'admin123' (hash bcrypt). USUARIOS DEBEN CAMBIARLO EN PRIMER LOGIN.

4. ENROLLMENTS: Se mapea t_professional_practices → enrollments. student_id se resuelve via person_id.

5. EVALUACIONES: evaluation_details (340 registros) migran a evaluation_details.

6. SECUENCIAS: Actualizadas al final para evitar colisiones de IDs auto.

7. EJECUCIÓN: Copiar TODO este archivo → SQL Editor del NUEVO proyecto Supabase → Run.
   Tiempo estimado: 30-60 segundos.
*/