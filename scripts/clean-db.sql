--
-- Clean DB — UNEFA Dashboard
-- Elimina datos operacionales/de prueba, preservando datos de sistema y referencia.
-- Uso: psql "postgresql://..." -f scripts/clean-db.sql
--
-- ⚠  Las secuencias se resetean con quoted names porque el schema usa
--    identificadores con mayúsculas ("t_activity_logs"."ACTIVITY_LOG_ID").
--    En Supabase, setval requiere doble quoting.
--
-- Generado: 2026-05-31 | Ejecutado con éxito en prod
--

BEGIN;

-- ============================================================
-- 1. TABLAS OPERACIONALES (hijas primero, padres después)
-- ============================================================

-- NIVEL 1: Tablas que solo dependen de otras operacionales
DELETE FROM "t_evaluation_detail";
DELETE FROM "t_activity_logs";
DELETE FROM "t_practice_visits";
DELETE FROM "t_professional_practices_tutor";
DELETE FROM "t_student_documents";
DELETE FROM "t_student_requests";
DELETE FROM "t_visit";
DELETE FROM "t_tutor_career";
DELETE FROM "t_institution_manager_institution";
DELETE FROM "t_session_history";
DELETE FROM "t_key_history";
DELETE FROM "t_prospect_list_items";
DELETE FROM "t_prospect_lists";
DELETE FROM "t_coordinadores";

-- NIVEL 2: Tablas que dependen de t_user + operacionales
DELETE FROM "t_evaluation";
DELETE FROM "t_session_attempts";
DELETE FROM "t_session";
DELETE FROM "t_change_log";
DELETE FROM "t_auth_log";
DELETE FROM "t_recovery_tokens";
DELETE FROM "t_password_history";
DELETE FROM "t_security_questions";
DELETE FROM "t_notifications";
DELETE FROM "t_chat_sessions";
DELETE FROM "t_backups";

-- NIVEL 3: Padres operacionales
DELETE FROM "t_professional_practices";
DELETE FROM "t_institution_manager";
DELETE FROM "t_institution_career";
DELETE FROM "t_institution_internship_type";
DELETE FROM "t_institution";
DELETE FROM "t_students";
DELETE FROM "t_tutors";

-- NIVEL 4: Tablas del usuario (preservar solo admin, USER_ID = 3)
DELETE FROM "t_user_key"      WHERE "USER_ID" != 3;
DELETE FROM "t_user_roles"    WHERE "ID_USER" != 3;
DELETE FROM "t_user_theme"    WHERE "USER_ID" != 3;
DELETE FROM "t_user_questions" WHERE "USER_ID" != 3;
DELETE FROM "t_user"          WHERE "USER_ID" != 3;

-- NIVEL 5: Raíces (sin dependencias)
DELETE FROM "t_internships_period";
DELETE FROM "t_persons" WHERE "person_id" != 125;

COMMIT;

-- ============================================================
-- 2. RESETEAR SECUENCIAS (usar quoted names para mayúsculas)
-- ============================================================

SELECT setval('"t_activity_logs_ACTIVITY_LOG_ID_seq"', 1, false);
SELECT setval('"t_auth_log_ID_seq"', 1, false);
SELECT setval('"t_change_log_CHANGE_LOG_ID_seq"', 1, false);
SELECT setval('"t_evaluation_EVALUATION_ID_seq"', 1, false);
SELECT setval('"t_evaluation_detail_DETAIL_ID_seq"', 1, false);
SELECT setval('"t_institution_INSTITUTION_ID_seq"', 1, false);
SELECT setval('"t_institution_manager_MANAGER_ID_seq"', 1, false);
SELECT setval('"t_internships_period_PERIOD_ID_seq"', 1, false);
SELECT setval('"t_key_history_KEY_HISTORY_ID_seq"', 1, false);
SELECT setval('"t_notifications_NOTIFICATION_ID_seq"', 1, false);
SELECT setval('"t_password_history_HISTORY_ID_seq"', 1, false);
SELECT setval('"t_persons_person_id_seq"', 1, false);
SELECT setval('"t_practice_visits_VISIT_ID_seq"', 1, false);
SELECT setval('"t_professional_practices_PROFESSIONAL_PRACTICE_ID_seq"', 1, false);
SELECT setval('"t_professional_practices_tuto_PROFESSIONAL_PRACTICES_TUTOR__seq"', 1, false);
SELECT setval('"t_recovery_tokens_TOKEN_ID_seq"', 1, false);
SELECT setval('"t_security_questions_SECURITY_QUESTIONS_ID_seq"', 1, false);
SELECT setval('"t_session_SESSION_ID_seq"', 1, false);
SELECT setval('"t_session_attempts_ATTEMPT_ID_seq"', 1, false);
SELECT setval('"t_session_history_SESSION_HISTORY_ID_seq"', 1, false);
SELECT setval('"t_student_documents_DOCUMENT_ID_seq"', 1, false);
SELECT setval('"t_student_requests_REQUEST_ID_seq"', 1, false);
SELECT setval('"t_students_STUDENTS_ID_seq"', 1, false);
SELECT setval('"t_tutors_TUTOR_ID_seq"', 1, false);
SELECT setval('"t_user_questions_USER_QUESTION_ID_seq"', 1, false);
SELECT setval('"t_user_theme_USER_THEME_ID_seq"', 1, false);
SELECT setval('"t_visit_VISIT_ID_seq"', 1, false);
SELECT setval('"t_prospect_list_items_ITEM_ID_seq"', 1, false);
SELECT setval('"t_prospect_lists_LIST_ID_seq"', 1, false);
SELECT setval('"t_coordinadores_COORDINADOR_ID_seq"', 1, false);
-- Admin-specific: saltar IDs del admin
SELECT setval('"t_user_USER_ID_seq"', 4, false);
SELECT setval('"t_user_key_USER_KEY_ID_seq"', 11, false);
