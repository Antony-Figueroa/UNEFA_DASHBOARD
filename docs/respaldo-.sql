-- ================================================================================
-- UNEFA Dashboard - Respaldo COMPLETO de Base de Datos
-- Nombre: respaldo-limpio
-- Fecha: 2026-02-24T15:40:54.129Z
-- Incluye: Estructura (CREATE TABLE) + Datos (INSERT)
-- ================================================================================
-- Tablas detectadas: 48
-- Tablas con datos: 19
-- Tablas vacías: 29
-- Total de registros: 316
-- ================================================================================

-- Desactivar verificación de foreign keys temporalmente
SET session_replication_role = replica;

-- ============================================================
-- SECCIÓN 1: ESTRUCTURA DE TABLAS (CREATE TABLE)
-- ============================================================

-- Tabla: t_activity_logs
CREATE TABLE IF NOT EXISTS "t_activity_logs" (
  "ACTIVITY_LOG_ID" integer(32) NOT NULL DEFAULT nextval('"t_activity_logs_ACTIVITY_LOG_ID_seq"'::regclass),
  "PROFESSIONAL_PRACTICE_ID" integer(32) NOT NULL,
  "STUDENT_ID" integer(32) NOT NULL,
  "ACTIVITY_DATE" date NOT NULL,
  "WEEK_NUMBER" integer(32),
  "HOURS_WORKED" numeric(5) NOT NULL DEFAULT 0,
  "ACTIVITY_TYPE" character varying(50) NOT NULL DEFAULT 'DIARIA'::character varying,
  "ACTIVITY_DESCRIPTION" text NOT NULL,
  "TASKS_COMPLETED" text,
  "CHALLENGES" text,
  "LEARNINGS" text,
  "SUPERVISOR_COMMENTS" text,
  "SUPERVISOR_APPROVED" boolean DEFAULT false,
  "SUPERVISOR_ID" integer(32),
  "APPROVED_AT" timestamp without time zone,
  "STATUS" smallint(16) NOT NULL DEFAULT 1,
  "CREATED_AT" timestamp without time zone NOT NULL DEFAULT now(),
  "UPDATED_AT" timestamp without time zone NOT NULL DEFAULT now(),
  "CREATED_BY" integer(32)
);

-- Tabla: t_auth_log
CREATE TABLE IF NOT EXISTS "t_auth_log" (
  "ID" integer(32) NOT NULL DEFAULT nextval('"t_auth_log_ID_seq"'::regclass),
  "USER_ID" integer(32),
  "USER_CI" character varying(20),
  "ACTION" character varying(50) NOT NULL,
  "IP_ADDRESS" character varying(45),
  "USER_AGENT" text,
  "DETAILS" text,
  "CREATED_AT" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: t_career
CREATE TABLE IF NOT EXISTS "t_career" (
  "CAREER_ID" integer(32) NOT NULL DEFAULT nextval('"t_career_CAREER_ID_seq"'::regclass),
  "CAREER_NAME" character varying(255) NOT NULL,
  "CAREER_CODE" character varying NOT NULL,
  "MINIMUM_GRADE" numeric(10) NOT NULL,
  "CAREER_ABBREVIATION" character varying(255) NOT NULL,
  "CREATION_DATE" timestamp without time zone NOT NULL,
  "MODIF_USER_ID" integer(32) NOT NULL,
  "MODIF_USER_DATE" timestamp without time zone NOT NULL,
  "ELIM_USER_ID" integer(32) NOT NULL,
  "ELIM_USER_DATE" timestamp without time zone NOT NULL,
  "REST_USER_ID" integer(32) NOT NULL,
  "REST_USER_DATE" timestamp without time zone NOT NULL,
  "STATUS" smallint(16) NOT NULL,
  "CAREER_TYPE" character varying(10) NOT NULL DEFAULT 'LARGA'::character varying
);

-- Tabla: t_career_internship_type
CREATE TABLE IF NOT EXISTS "t_career_internship_type" (
  "ID_CAREER_INTERNSHIP_TYPE_ID" integer(32) NOT NULL DEFAULT nextval('"t_career_internship_type_ID_CAREER_INTERNSHIP_TYPE_ID_seq"'::regclass),
  "CAREER_ID" integer(32) NOT NULL,
  "INTERNSHIP_TYPE_ID" integer(32) NOT NULL
);

-- Tabla: t_change_log
CREATE TABLE IF NOT EXISTS "t_change_log" (
  "CHANGE_LOG_ID" integer(32) NOT NULL DEFAULT nextval('"t_change_log_CHANGE_LOG_ID_seq"'::regclass),
  "DATE_TIME" timestamp without time zone NOT NULL,
  "TABLE_ID" integer(32) NOT NULL,
  "COLUMN_ID" integer(32) NOT NULL,
  "OPERATION_ID" integer(32) NOT NULL,
  "USER_ID" integer(32) NOT NULL,
  "NEW_VALUE" character varying(45) NOT NULL,
  "OLD_VALUE" character varying(45) NOT NULL,
  "IP_ADDRESS" character varying(45) NOT NULL,
  "FORM_ID" integer(32) NOT NULL,
  "PRINT_EMAIL" character varying(60) NOT NULL,
  "STATUS" smallint(16) NOT NULL
);

-- Tabla: t_chat_sessions
CREATE TABLE IF NOT EXISTS "t_chat_sessions" (
  "SESSION_ID" uuid NOT NULL DEFAULT gen_random_uuid(),
  "USER_ID" integer(32) NOT NULL,
  "TITLE" character varying(100) NOT NULL DEFAULT 'Nueva conversación'::character varying,
  "MESSAGES" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "CREATED_AT" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "UPDATED_AT" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "STATUS" smallint(16) NOT NULL DEFAULT 1
);

-- Tabla: t_columns
CREATE TABLE IF NOT EXISTS "t_columns" (
  "COLUMN_ID" integer(32) NOT NULL DEFAULT nextval('"t_columns_COLUMN_ID_seq"'::regclass),
  "TABLE_ID" integer(32) NOT NULL,
  "COLUMN_NAME" character varying(25) NOT NULL,
  "STATUS" smallint(16) NOT NULL
);

-- Tabla: t_config
CREATE TABLE IF NOT EXISTS "t_config" (
  "CONFIG_ID" integer(32) NOT NULL DEFAULT nextval('"t_config_CONFIG_ID_seq"'::regclass),
  "RECOVERY_EMAIL" smallint(16) NOT NULL,
  "BLOCKING_DAYS" smallint(16) NOT NULL,
  "WRONG_KEY_LOCK" smallint(16) NOT NULL,
  "ATTEMPTS_KEY_BLOCK" smallint(16) NOT NULL,
  "KEY_EXPIRATION" integer(32) NOT NULL,
  "EXPIRATION_DAYS" smallint(16) NOT NULL,
  "USER_UPPERCASE" smallint(16) NOT NULL,
  "USER_LOWERCASE" smallint(16) NOT NULL,
  "USER_NUMBERS" smallint(16) NOT NULL,
  "USER_SPECIAL_CHARACTERS" smallint(16) NOT NULL,
  "USER_NUM_UPPERCASE" integer(32) NOT NULL,
  "USER_NUM_LOWERCASE" integer(32) NOT NULL,
  "USER_NUM_NUMBERS" integer(32) NOT NULL,
  "USER_NUM_SPECIAL_CHARACTERS" integer(32) NOT NULL,
  "KEY_UPPERCASE" smallint(16) NOT NULL,
  "KEY_LOWERCASE" smallint(16) NOT NULL,
  "KEY_NUMBERS" smallint(16) NOT NULL,
  "KEY_SPECIAL_CHARACTERS" smallint(16) NOT NULL,
  "KEY_NUM_UPPERCASE" integer(32) NOT NULL,
  "KEY_NUM_LOWERCASE" integer(32) NOT NULL,
  "KEY_NUM_NUMBERS" integer(32) NOT NULL,
  "KEY_NUM_SPECIAL_CHARACTERS" integer(32) NOT NULL,
  "USER_LENGTH" integer(32) NOT NULL,
  "KEY_LEGTH" integer(32) NOT NULL,
  "SECURITY_QUESTIONS" smallint(16) NOT NULL,
  "TOTAL_QUESTIONS" integer(32) NOT NULL,
  "TOTAL_PRESET_QUESTIONS" integer(32) NOT NULL,
  "TOTAL_USER_QUESTIONS" integer(32) NOT NULL,
  "TOTAL_ANSWERS" integer(32) NOT NULL
);

-- Tabla: t_evaluation
CREATE TABLE IF NOT EXISTS "t_evaluation" (
  "EVALUATION_ID" integer(32) NOT NULL DEFAULT nextval('"t_evaluation_EVALUATION_ID_seq"'::regclass),
  "PROFESSIONAL_PRACTICE_ID" integer(32) NOT NULL,
  "EVALUATOR_TYPE" character varying(20) NOT NULL,
  "EVALUATOR_ID" integer(32),
  "EVALUATOR_NAME" character varying(255) NOT NULL,
  "EVALUATOR_CI" character varying(20),
  "TOTAL_SCORE" numeric(5) NOT NULL,
  "OBSERVATIONS" text,
  "EVALUATION_DATE" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  "REGISTERED_BY" integer(32),
  "STATUS" smallint(16) DEFAULT 1
);

-- Tabla: t_evaluation_criteria
CREATE TABLE IF NOT EXISTS "t_evaluation_criteria" (
  "CRITERIA_ID" integer(32) NOT NULL DEFAULT nextval('"t_evaluation_criteria_CRITERIA_ID_seq"'::regclass),
  "ITEM_NUMBER" integer(32) NOT NULL,
  "DESCRIPTION" character varying(500) NOT NULL,
  "EVALUATOR_TYPE" character varying(20) NOT NULL,
  "STATUS" smallint(16) DEFAULT 1
);

-- Tabla: t_evaluation_detail
CREATE TABLE IF NOT EXISTS "t_evaluation_detail" (
  "DETAIL_ID" integer(32) NOT NULL DEFAULT nextval('"t_evaluation_detail_DETAIL_ID_seq"'::regclass),
  "EVALUATION_ID" integer(32) NOT NULL,
  "CRITERIA_ID" integer(32),
  "ITEM_NUMBER" integer(32) NOT NULL,
  "SCORE" integer(32) NOT NULL,
  "STATUS" smallint(16) DEFAULT 1
);

-- Tabla: t_institution
CREATE TABLE IF NOT EXISTS "t_institution" (
  "INSTITUTION_ID" integer(32) NOT NULL DEFAULT nextval('"t_institution_INSTITUTION_ID_seq"'::regclass),
  "INSTITUTION_NAME" character varying(255) NOT NULL,
  "INSTITUTION_ADDRESS" character varying(255) NOT NULL,
  "INSTITUTION_CONTACT" character varying(12) NOT NULL,
  "PRACTICE_TYPE" character varying(255) NOT NULL,
  "REGION" character varying(255) NOT NULL,
  "NUCLEUS" character varying(255) NOT NULL,
  "EXTENSION" character varying(255) NOT NULL,
  "CREATION_DATE" timestamp without time zone NOT NULL,
  "INSTITUTION_TYPE" character varying(255) NOT NULL,
  "STATUS" smallint(16) NOT NULL,
  "RIF" character varying(11) NOT NULL,
  "CAREER_ID" integer(32) NOT NULL
);

-- Tabla: t_institution_career
CREATE TABLE IF NOT EXISTS "t_institution_career" (
  "INSTITUTION_CAREER_ID" bigint(64) NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "INSTITUTION_ID" integer(32) NOT NULL,
  "CAREER_ID" integer(32) NOT NULL
);

-- Tabla: t_institution_internship_type
CREATE TABLE IF NOT EXISTS "t_institution_internship_type" (
  "INSTITUTION_INTERNSHIP_TYPE_ID" bigint(64) NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "INSTITUTION_ID" integer(32) NOT NULL,
  "INTERNSHIP_TYPE_ID" integer(32) NOT NULL
);

-- Tabla: t_institution_manager
CREATE TABLE IF NOT EXISTS "t_institution_manager" (
  "MANAGER_ID" integer(32) NOT NULL DEFAULT nextval('"t_institution_manager_MANAGER_ID_seq"'::regclass),
  "MANAGER_CI" character varying(10) NOT NULL,
  "NAME" character varying(255) NOT NULL,
  "SECOND_NAME" character varying(255) DEFAULT NULL::character varying,
  "SURNAME" character varying(255) NOT NULL,
  "SECOND_SURNAME" character varying(255) DEFAULT NULL::character varying,
  "CONTACT_PHONE" character varying(12) NOT NULL,
  "EMAIL" character varying(255) NOT NULL,
  "CREATION_DATE" timestamp without time zone NOT NULL,
  "STATUS" smallint(16) NOT NULL,
  "INSTITUTION_ID" integer(32) NOT NULL
);

-- Tabla: t_internship_type
CREATE TABLE IF NOT EXISTS "t_internship_type" (
  "INTERNSHIP_TYPE_ID" integer(32) NOT NULL DEFAULT nextval('"t_internship_type_INTERNSHIP_TYPE_ID_seq"'::regclass),
  "NAME" character varying(40) NOT NULL,
  "PRIORITY" smallint(16) NOT NULL,
  "CREATION_DATE" timestamp without time zone NOT NULL,
  "STATUS" smallint(16) NOT NULL
);

-- Tabla: t_internships_period
CREATE TABLE IF NOT EXISTS "t_internships_period" (
  "PERIOD_ID" integer(32) NOT NULL DEFAULT nextval('"t_internships_period_PERIOD_ID_seq"'::regclass),
  "START_DATE" date NOT NULL,
  "END_DATE" date NOT NULL,
  "CREATION_DATE" timestamp without time zone NOT NULL,
  "DESCRIPTION" character varying(45) NOT NULL,
  "PERIOD_STATUS" character varying(45) NOT NULL,
  "STATUS" smallint(16) NOT NULL,
  "T_INTERNSHIPS_CODE" character varying(8) NOT NULL
);

-- Tabla: t_key_history
CREATE TABLE IF NOT EXISTS "t_key_history" (
  "KEY_HISTORY_ID" integer(32) NOT NULL DEFAULT nextval('"t_key_history_KEY_HISTORY_ID_seq"'::regclass),
  "USER_KEY_ID" integer(32) NOT NULL,
  "USER_ID" integer(32) NOT NULL,
  "END_DATE" character varying(45) NOT NULL,
  "STATUS" smallint(16) NOT NULL
);

-- Tabla: t_list
CREATE TABLE IF NOT EXISTS "t_list" (
  "LIST_ID" integer(32) NOT NULL DEFAULT nextval('"t_list_LIST_ID_seq"'::regclass),
  "NAME" character varying(40) NOT NULL,
  "CREATION_DATE" timestamp without time zone NOT NULL,
  "MODIF_USER_ID" integer(32) NOT NULL,
  "MODIF_USER_DATE" timestamp without time zone NOT NULL,
  "ELIM_USER_ID" integer(32) NOT NULL,
  "ELIM_USER_DATE" timestamp without time zone NOT NULL,
  "REST_USER_ID" integer(32) NOT NULL,
  "REST_USER_DATE" timestamp without time zone NOT NULL,
  "STATUS" smallint(16) NOT NULL
);

-- Tabla: t_notifications
CREATE TABLE IF NOT EXISTS "t_notifications" (
  "NOTIFICATION_ID" integer(32) NOT NULL DEFAULT nextval('"t_notifications_NOTIFICATION_ID_seq"'::regclass),
  "USER_ID" integer(32) NOT NULL,
  "TYPE" character varying(50) NOT NULL,
  "TITLE" character varying(255) NOT NULL,
  "MESSAGE" text NOT NULL,
  "READ" boolean DEFAULT false,
  "READ_AT" timestamp without time zone,
  "DATA" jsonb,
  "CREATED_AT" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: t_operation
CREATE TABLE IF NOT EXISTS "t_operation" (
  "OPERATION_ID" integer(32) NOT NULL DEFAULT nextval('"t_operation_OPERATION_ID_seq"'::regclass),
  "ACTION" character varying(45) NOT NULL,
  "DESCRIPTION" text,
  "STATUS" smallint(16) NOT NULL
);

-- Tabla: t_password_history
CREATE TABLE IF NOT EXISTS "t_password_history" (
  "HISTORY_ID" integer(32) NOT NULL DEFAULT nextval('"t_password_history_HISTORY_ID_seq"'::regclass),
  "USER_ID" integer(32) NOT NULL,
  "KEY" text NOT NULL,
  "CREATION_DATE" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: t_permissions
CREATE TABLE IF NOT EXISTS "t_permissions" (
  "PERMISSIONS_ID" integer(32) NOT NULL DEFAULT nextval('"t_permissions_PERMISSIONS_ID_seq"'::regclass),
  "NAME" character varying(30) NOT NULL,
  "DESCRIPTION" text,
  "MODIF_USER_ID" integer(32) NOT NULL,
  "MODIF_USER_DATE" timestamp without time zone NOT NULL,
  "ELIM_USER_ID" integer(32) NOT NULL,
  "ELIM_USER_DATE" timestamp without time zone NOT NULL,
  "REST_USER_ID" integer(32) NOT NULL,
  "REST_USER_DATE" timestamp without time zone NOT NULL,
  "STATUS" smallint(16) NOT NULL
);

-- Tabla: t_practice_visits
CREATE TABLE IF NOT EXISTS "t_practice_visits" (
  "VISIT_ID" integer(32) NOT NULL DEFAULT nextval('"t_practice_visits_VISIT_ID_seq"'::regclass),
  "PROFESSIONAL_PRACTICE_ID" integer(32) NOT NULL,
  "TUTOR_ID" integer(32) NOT NULL,
  "VISIT_DATE" timestamp without time zone NOT NULL DEFAULT now(),
  "VISIT_TYPE" character varying(50) NOT NULL DEFAULT 'PRESENCIAL'::character varying,
  "HOURS_WORKED" numeric(5) DEFAULT 0,
  "ACTIVITIES_PERFORMED" text,
  "OBSERVATIONS" text,
  "RECOMMENDATIONS" text,
  "STATUS" smallint(16) NOT NULL DEFAULT 1,
  "CREATED_AT" timestamp without time zone NOT NULL DEFAULT now(),
  "UPDATED_AT" timestamp without time zone NOT NULL DEFAULT now(),
  "CREATED_BY" integer(32),
  "VISIT_CASE" character varying(50) DEFAULT 'SEGUIMIENTO_REGULAR'::character varying
);

-- Tabla: t_preset_questions
CREATE TABLE IF NOT EXISTS "t_preset_questions" (
  "PRESET_QUESTION_ID" integer(32) NOT NULL DEFAULT nextval('"t_preset_questions_PRESET_QUESTION_ID_seq"'::regclass),
  "DESCRIPTION" character varying(255) NOT NULL,
  "ANSWER" character varying(255) NOT NULL,
  "MODIF_USER_ID" integer(32) NOT NULL,
  "MODIF_USER_DATE" timestamp without time zone NOT NULL,
  "ELIM_USER_ID" integer(32) NOT NULL,
  "ELIM_USER_DATE" timestamp without time zone NOT NULL,
  "REST_USER_ID" integer(32) NOT NULL,
  "REST_USER_DATE" timestamp without time zone NOT NULL,
  "STATUS" smallint(16) NOT NULL
);

-- Tabla: t_professional_practices
CREATE TABLE IF NOT EXISTS "t_professional_practices" (
  "PROFESSIONAL_PRACTICE_ID" integer(32) NOT NULL DEFAULT nextval('"t_professional_practices_PROFESSIONAL_PRACTICE_ID_seq"'::regclass),
  "START_DATE" date NOT NULL,
  "END_DATE" date NOT NULL,
  "REPORT_TITLE" character varying(255) NOT NULL,
  "REGISTRATION_DATE" timestamp without time zone NOT NULL,
  "CREATION_DATE" timestamp without time zone NOT NULL,
  "GRADE" numeric(5) NOT NULL,
  "TRANSFER" smallint(16) NOT NULL,
  "TOUR" character varying(255) NOT NULL,
  "PERIOD_ID" integer(32) NOT NULL,
  "INSTITUTION_ID" integer(32) NOT NULL,
  "STUDENTS_ID" integer(32) NOT NULL,
  "STATUS" smallint(16) NOT NULL,
  "MANAGER_ID" integer(32) NOT NULL,
  "OBSERVATION" character varying(255) NOT NULL,
  "ENROLLMENT" character varying(255) NOT NULL,
  "INTERNSHIP_STATUS" integer(32) NOT NULL,
  "INTERNSHIP_TYPE_ID" integer(32) NOT NULL,
  "PRACTICES_STATUS" integer(32) NOT NULL,
  "EVALUATION_STATUS" character varying(20) DEFAULT 'pending'::character varying
);

-- Tabla: t_professional_practices_tutor
CREATE TABLE IF NOT EXISTS "t_professional_practices_tutor" (
  "PROFESSIONAL_PRACTICES_TUTOR_ID" integer(32) NOT NULL DEFAULT nextval('"t_professional_practices_tuto_PROFESSIONAL_PRACTICES_TUTOR__seq"'::regclass),
  "TUTOR_ID" integer(32) NOT NULL,
  "PROFESSIONAL_PRACTICE_ID" integer(32) NOT NULL,
  "TUTOR_TYPE" character varying(45) NOT NULL
);

-- Tabla: t_recovery_tokens
CREATE TABLE IF NOT EXISTS "t_recovery_tokens" (
  "TOKEN_ID" integer(32) NOT NULL DEFAULT nextval('"t_recovery_tokens_TOKEN_ID_seq"'::regclass),
  "USER_ID" integer(32) NOT NULL,
  "TOKEN" character varying(255) NOT NULL,
  "EXPIRATION_DATE" timestamp without time zone NOT NULL,
  "STATUS" smallint(16) DEFAULT 1,
  "CREATION_DATE" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: t_request_types
CREATE TABLE IF NOT EXISTS "t_request_types" (
  "REQUEST_TYPE_ID" integer(32) NOT NULL DEFAULT nextval('"t_request_types_REQUEST_TYPE_ID_seq"'::regclass),
  "NAME" character varying(100) NOT NULL,
  "DESCRIPTION" text,
  "IS_ACTIVE" smallint(16) NOT NULL DEFAULT 1,
  "CREATION_DATE" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "MODIF_USER_ID" integer(32) NOT NULL DEFAULT 0,
  "MODIF_USER_DATE" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ELIM_USER_ID" integer(32) NOT NULL DEFAULT 0,
  "ELIM_USER_DATE" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "REST_USER_ID" integer(32) NOT NULL DEFAULT 0,
  "REST_USER_DATE" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "STATUS" smallint(16) NOT NULL DEFAULT 1
);

-- Tabla: t_roles
CREATE TABLE IF NOT EXISTS "t_roles" (
  "ID_ROLS" integer(32) NOT NULL DEFAULT nextval('"t_roles_ID_ROLS_seq"'::regclass),
  "NAME" character varying(30) NOT NULL,
  "DESCRIPTION" text,
  "MODIF_USER_ID" integer(32) NOT NULL,
  "MODIF_USER_DATE" timestamp without time zone NOT NULL,
  "ELIM_USER_ID" integer(32) NOT NULL,
  "ELIM_USER_DATE" timestamp without time zone NOT NULL,
  "REST_USER_ID" integer(32) NOT NULL,
  "REST_USER_DATE" timestamp without time zone NOT NULL,
  "STATUS" smallint(16) NOT NULL
);

-- Tabla: t_roles_permissions
CREATE TABLE IF NOT EXISTS "t_roles_permissions" (
  "ROLES_ID" integer(32) NOT NULL DEFAULT nextval('"t_roles_permissions_ROLES_ID_seq"'::regclass),
  "PERMISSIONS_ID" integer(32) NOT NULL
);

-- Tabla: t_security_questions
CREATE TABLE IF NOT EXISTS "t_security_questions" (
  "SECURITY_QUESTIONS_ID" integer(32) NOT NULL DEFAULT nextval('"t_security_questions_SECURITY_QUESTIONS_ID_seq"'::regclass),
  "USER_ID" integer(32) NOT NULL,
  "PRESET_QUESTION_ID" integer(32) NOT NULL,
  "ANSWER" text,
  "CUSTOM_QUESTION" text
);

-- Tabla: t_session
CREATE TABLE IF NOT EXISTS "t_session" (
  "SESSION_ID" integer(32) NOT NULL DEFAULT nextval('"t_session_SESSION_ID_seq"'::regclass),
  "USER_ID" integer(32) NOT NULL,
  "LOGIN_TIME" timestamp without time zone NOT NULL,
  "MODIF_USER_ID" integer(32) NOT NULL,
  "MODIF_USER_DATE" timestamp without time zone NOT NULL,
  "ELIM_USER_ID" integer(32) NOT NULL,
  "ELIM_USER_DATE" timestamp without time zone NOT NULL,
  "REST_USER_ID" integer(32) NOT NULL,
  "REST_USER_DATE" timestamp without time zone NOT NULL,
  "STATUS" smallint(16) NOT NULL
);

-- Tabla: t_session_attempts
CREATE TABLE IF NOT EXISTS "t_session_attempts" (
  "ATTEMPT_ID" integer(32) NOT NULL DEFAULT nextval('"t_session_attempts_ATTEMPT_ID_seq"'::regclass),
  "ATTEMPT_TIME" timestamp without time zone NOT NULL,
  "USER_ID" integer(32) NOT NULL,
  "ACTION" smallint(16) NOT NULL,
  "MODIF_USER_ID" integer(32) NOT NULL,
  "MODIF_USER_DATE" timestamp without time zone NOT NULL,
  "ELIM_USER_ID" integer(32) NOT NULL,
  "ELIM_USER_DATE" timestamp without time zone NOT NULL,
  "REST_USER_ID" integer(32) NOT NULL,
  "REST_USER_DATE" timestamp without time zone NOT NULL,
  "STATUS" smallint(16) NOT NULL
);

-- Tabla: t_session_history
CREATE TABLE IF NOT EXISTS "t_session_history" (
  "SESSION_HISTORY_ID" integer(32) NOT NULL DEFAULT nextval('"t_session_history_SESSION_HISTORY_ID_seq"'::regclass),
  "SESSION_ID" integer(32) NOT NULL,
  "USER_ID" integer(32) NOT NULL,
  "LOGIN_TIME" timestamp without time zone NOT NULL,
  "LOGOUT_TIME" timestamp without time zone NOT NULL,
  "STATUS" smallint(16) NOT NULL
);

-- Tabla: t_student_documents
CREATE TABLE IF NOT EXISTS "t_student_documents" (
  "DOCUMENT_ID" integer(32) NOT NULL DEFAULT nextval('"t_student_documents_DOCUMENT_ID_seq"'::regclass),
  "STUDENT_ID" integer(32) NOT NULL,
  "DOCUMENT_TYPE" character varying(50) NOT NULL,
  "TITLE" character varying(255) NOT NULL,
  "DESCRIPTION" text,
  "FILE_NAME" character varying(255) NOT NULL,
  "FILE_PATH" character varying(500) NOT NULL,
  "FILE_SIZE" integer(32),
  "FILE_TYPE" character varying(100),
  "STATUS" character varying(20) NOT NULL DEFAULT 'pending'::character varying,
  "REJECTION_REASON" text,
  "UPLOADED_AT" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "REVIEWED_AT" timestamp without time zone,
  "REVIEWED_BY" integer(32),
  "CREATION_DATE" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "MODIF_USER_ID" integer(32) NOT NULL DEFAULT 0,
  "MODIF_USER_DATE" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "STATUS_TABLE" smallint(16) NOT NULL DEFAULT 1
);

-- Tabla: t_student_requests
CREATE TABLE IF NOT EXISTS "t_student_requests" (
  "REQUEST_ID" integer(32) NOT NULL DEFAULT nextval('"t_student_requests_REQUEST_ID_seq"'::regclass),
  "STUDENT_ID" integer(32) NOT NULL,
  "REQUEST_TYPE_ID" integer(32) NOT NULL,
  "SUBJECT" character varying(255) NOT NULL,
  "DESCRIPTION" text NOT NULL,
  "STATUS" character varying(20) NOT NULL DEFAULT 'pending'::character varying,
  "RESPONSE" text,
  "PROCESSED_BY" integer(32),
  "PROCESSED_AT" timestamp without time zone,
  "CREATION_DATE" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "MODIF_USER_ID" integer(32) NOT NULL DEFAULT 0,
  "MODIF_USER_DATE" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ELIM_USER_ID" integer(32) NOT NULL DEFAULT 0,
  "ELIM_USER_DATE" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "REST_USER_ID" integer(32) NOT NULL DEFAULT 0,
  "REST_USER_DATE" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "STATUS_TABLE" smallint(16) NOT NULL DEFAULT 1
);

-- Tabla: t_students
CREATE TABLE IF NOT EXISTS "t_students" (
  "STUDENTS_ID" integer(32) NOT NULL DEFAULT nextval('"t_students_STUDENTS_ID_seq"'::regclass),
  "STUDENTS_CI" character varying(10) NOT NULL,
  "NAME" character varying(255) NOT NULL,
  "SECOND_NAME" character varying(255) DEFAULT NULL::character varying,
  "SURNAME" character varying(255) NOT NULL,
  "SECOND_SURNAME" character varying(255) DEFAULT NULL::character varying,
  "GENDER" character(10) NOT NULL,
  "BIRTHDATE" date NOT NULL,
  "CONTACT_PHONE" character varying(15) NOT NULL,
  "EMAIL" character varying(255) NOT NULL,
  "ADDRESS" character varying(255) NOT NULL,
  "MARITAL_STATUS" character varying(45) NOT NULL,
  "SEMESTER" character varying(45) NOT NULL,
  "SECTION" character varying(45) NOT NULL,
  "REGIME" character varying(45) NOT NULL,
  "STUDENT_TYPE" character varying(45) NOT NULL,
  "MILITARY_RANK" character varying(45) DEFAULT NULL::character varying,
  "EMPLOYMENT" character varying(2) NOT NULL,
  "STATUS" smallint(16) NOT NULL,
  "REGISTRATION_DATE" timestamp without time zone,
  "CAREER_ID" integer(32) NOT NULL,
  "USER_ID" integer(32)
);

-- Tabla: t_tables
CREATE TABLE IF NOT EXISTS "t_tables" (
  "TABLE_ID" integer(32) NOT NULL DEFAULT nextval('"t_tables_TABLE_ID_seq"'::regclass),
  "NAME" character varying(25) NOT NULL,
  "DESCRIPTION" text,
  "PHYSICAL_NAME" character varying(25) NOT NULL,
  "LOG" smallint(16) NOT NULL,
  "STATUS" smallint(16) NOT NULL
);

-- Tabla: t_tutor_career
CREATE TABLE IF NOT EXISTS "t_tutor_career" (
  "TUTOR_CAREER_ID" bigint(64) NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "TUTOR_ID" integer(32) NOT NULL,
  "CAREER_ID" integer(32) NOT NULL
);

-- Tabla: t_tutors
CREATE TABLE IF NOT EXISTS "t_tutors" (
  "TUTOR_ID" integer(32) NOT NULL DEFAULT nextval('"t_tutors_TUTOR_ID_seq"'::regclass),
  "TUTOR_CI" character varying(10) NOT NULL,
  "NAME" character varying(255) NOT NULL,
  "SECOND_NAME" character varying(255) DEFAULT NULL::character varying,
  "SURNAME" character varying(255) NOT NULL,
  "SECOND_SURNAME" character varying(255) DEFAULT NULL::character varying,
  "CONTACT_PHONE" character varying(12) NOT NULL,
  "GENDER" character varying(45) NOT NULL,
  "EMAIL" character varying(255) NOT NULL,
  "PROFESSION" character varying(255) NOT NULL,
  "CONDITION" character varying(45) NOT NULL,
  "DEDICATION" character varying(45) NOT NULL,
  "CATEGORY" character varying(45) NOT NULL,
  "CREATION_DATE" timestamp without time zone NOT NULL,
  "STATUS" smallint(16) NOT NULL,
  "USER_ID" integer(32)
);

-- Tabla: t_user
CREATE TABLE IF NOT EXISTS "t_user" (
  "USER_ID" integer(32) NOT NULL DEFAULT nextval('"t_user_USER_ID_seq"'::regclass),
  "USER" character varying(255) NOT NULL,
  "USER_CI" character varying(10) NOT NULL,
  "NAME" character varying(255) NOT NULL,
  "SECOND_NAME" character varying(255) DEFAULT NULL::character varying,
  "SURNAME" character varying(255) NOT NULL,
  "SECOND_SURNAME" character varying(255) DEFAULT NULL::character varying,
  "EMAIL" character varying(255) NOT NULL,
  "PHONE_NUMBER" character varying(12) DEFAULT NULL::character varying,
  "CREATION_DATE" timestamp without time zone NOT NULL,
  "LOGIN" smallint(16) NOT NULL,
  "TERMS_CONDITIONS" character varying(45) NOT NULL,
  "STATUS_SESSION" smallint(16) NOT NULL,
  "STATUS" smallint(16) NOT NULL,
  "FAILED_ATTEMPTS" integer(32) DEFAULT 0,
  "LOCK_DATE" timestamp with time zone,
  "FORCE_PASSWORD_CHANGE" boolean DEFAULT false
);

-- Tabla: t_user_key
CREATE TABLE IF NOT EXISTS "t_user_key" (
  "USER_KEY_ID" integer(32) NOT NULL DEFAULT nextval('"t_user_key_USER_KEY_ID_seq"'::regclass),
  "USER_ID" integer(32) NOT NULL,
  "KEY" character varying(255) NOT NULL,
  "START_DATE" timestamp without time zone NOT NULL,
  "END_DATE" timestamp without time zone NOT NULL,
  "MODIF_USER_ID" integer(32) NOT NULL,
  "MODIF_USER_DATE" timestamp without time zone NOT NULL,
  "ELIM_USER_ID" integer(32) NOT NULL,
  "ELIM_USER_DATE" timestamp without time zone NOT NULL,
  "REST_USER_ID" integer(32) NOT NULL,
  "REST_USER_DATE" timestamp without time zone NOT NULL,
  "STATUS" smallint(16) NOT NULL,
  "IS_TEMPORARY" boolean DEFAULT false
);

-- Tabla: t_user_questions
CREATE TABLE IF NOT EXISTS "t_user_questions" (
  "USER_QUESTION_ID" integer(32) NOT NULL DEFAULT nextval('"t_user_questions_USER_QUESTION_ID_seq"'::regclass),
  "USER_ID" integer(32) NOT NULL,
  "QUESTION_TYPE" character varying(20) NOT NULL DEFAULT 'PRESET'::character varying,
  "PRESET_QUESTION_ID" integer(32),
  "CUSTOM_QUESTION" character varying(255),
  "ANSWER" character varying(255) NOT NULL,
  "ORDER_NUM" smallint(16) NOT NULL DEFAULT 1,
  "CREATED_AT" timestamp without time zone NOT NULL DEFAULT now(),
  "UPDATED_AT" timestamp without time zone NOT NULL DEFAULT now(),
  "STATUS" smallint(16) NOT NULL DEFAULT 1
);

-- Tabla: t_user_roles
CREATE TABLE IF NOT EXISTS "t_user_roles" (
  "ID_USER" integer(32) NOT NULL,
  "ID_ROLES" integer(32) NOT NULL
);

-- Tabla: t_user_theme
CREATE TABLE IF NOT EXISTS "t_user_theme" (
  "USER_THEME_ID" integer(32) NOT NULL DEFAULT nextval('"t_user_theme_USER_THEME_ID_seq"'::regclass),
  "USER_ID" integer(32) NOT NULL,
  "BRAND_COLOR" character varying(20) NOT NULL DEFAULT 'blue'::character varying,
  "CREATION_DATE" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "MODIF_USER_ID" integer(32) NOT NULL DEFAULT 0,
  "MODIF_USER_DATE" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ELIM_USER_ID" integer(32) NOT NULL DEFAULT 0,
  "ELIM_USER_DATE" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "REST_USER_ID" integer(32) NOT NULL DEFAULT 0,
  "REST_USER_DATE" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "STATUS" smallint(16) NOT NULL DEFAULT 1
);

-- Tabla: t_value_list
CREATE TABLE IF NOT EXISTS "t_value_list" (
  "VALUE_LIST_ID" integer(32) NOT NULL DEFAULT nextval('"t_value_list_VALUE_LIST_ID_seq"'::regclass),
  "NAME" character varying(45) NOT NULL,
  "ABBREVIATION" character varying(8) DEFAULT NULL::character varying,
  "LIST_ID" integer(32) NOT NULL,
  "CREATION_DATE" timestamp without time zone NOT NULL,
  "MODIF_USER_ID" integer(32) NOT NULL,
  "MODIF_USER_DATE" timestamp without time zone NOT NULL,
  "ELIM_USER_ID" integer(32) NOT NULL,
  "ELIM_USER_DATE" timestamp without time zone NOT NULL,
  "REST_USER_ID" integer(32) NOT NULL,
  "REST_USER_DATE" timestamp without time zone NOT NULL,
  "STATUS" smallint(16) NOT NULL
);

-- Tabla: t_visit
CREATE TABLE IF NOT EXISTS "t_visit" (
  "VISIT_ID" integer(32) NOT NULL DEFAULT nextval('"t_visit_VISIT_ID_seq"'::regclass),
  "VISIT_DATE" date NOT NULL,
  "NOTE" character varying(255) DEFAULT NULL::character varying,
  "REQUESTED_ACTIVITY" character varying(45) NOT NULL,
  "CARRIED_ACTIVITY" character varying(45) NOT NULL,
  "STATUS" smallint(16) NOT NULL,
  "TUTOR_ID" integer(32) NOT NULL,
  "PROFESSIONAL_PRACTICE_ID" integer(32) NOT NULL
);

-- ============================================================
-- SECCIÓN 2: DATOS (INSERT)
-- ============================================================

-- --------------------------------------------------------
-- Tabla: t_auth_log (4 registros)
-- --------------------------------------------------------
INSERT INTO "t_auth_log" ("ID", "USER_ID", "USER_CI", "ACTION", "IP_ADDRESS", "USER_AGENT", "DETAILS", "CREATED_AT") VALUES (1, 1, 'V00000000', 'LOGIN_SUCCESS', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', 'Inicio de sesión exitoso', '2026-02-24T13:37:39.923384+00:00');
INSERT INTO "t_auth_log" ("ID", "USER_ID", "USER_CI", "ACTION", "IP_ADDRESS", "USER_AGENT", "DETAILS", "CREATED_AT") VALUES (2, 1, 'V00000000', 'LOGIN_SUCCESS', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', 'Inicio de sesión exitoso', '2026-02-24T13:38:32.694612+00:00');
INSERT INTO "t_auth_log" ("ID", "USER_ID", "USER_CI", "ACTION", "IP_ADDRESS", "USER_AGENT", "DETAILS", "CREATED_AT") VALUES (3, 1, 'V00000000', 'LOGIN_SUCCESS', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', 'Inicio de sesión exitoso', '2026-02-24T14:22:59.258183+00:00');
INSERT INTO "t_auth_log" ("ID", "USER_ID", "USER_CI", "ACTION", "IP_ADDRESS", "USER_AGENT", "DETAILS", "CREATED_AT") VALUES (4, 1, 'V00000000', 'LOGIN_SUCCESS', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', 'Inicio de sesión exitoso', '2026-02-24T15:33:13.014558+00:00');

-- --------------------------------------------------------
-- Tabla: t_columns (4 registros)
-- --------------------------------------------------------
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (1, 14, 'USER_CI', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (2, 14, 'NAME', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (3, 14, 'EMAIL', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (4, 14, 'STATUS', 1);

-- --------------------------------------------------------
-- Tabla: t_config (1 registros)
-- --------------------------------------------------------
INSERT INTO "t_config" ("CONFIG_ID", "RECOVERY_EMAIL", "BLOCKING_DAYS", "WRONG_KEY_LOCK", "ATTEMPTS_KEY_BLOCK", "KEY_EXPIRATION", "EXPIRATION_DAYS", "USER_UPPERCASE", "USER_LOWERCASE", "USER_NUMBERS", "USER_SPECIAL_CHARACTERS", "USER_NUM_UPPERCASE", "USER_NUM_LOWERCASE", "USER_NUM_NUMBERS", "USER_NUM_SPECIAL_CHARACTERS", "KEY_UPPERCASE", "KEY_LOWERCASE", "KEY_NUMBERS", "KEY_SPECIAL_CHARACTERS", "KEY_NUM_UPPERCASE", "KEY_NUM_LOWERCASE", "KEY_NUM_NUMBERS", "KEY_NUM_SPECIAL_CHARACTERS", "USER_LENGTH", "KEY_LEGTH", "SECURITY_QUESTIONS", "TOTAL_QUESTIONS", "TOTAL_PRESET_QUESTIONS", "TOTAL_USER_QUESTIONS", "TOTAL_ANSWERS") VALUES (1, 1, 0, 0, 3, 0, 120, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

-- --------------------------------------------------------
-- Tabla: t_evaluation_criteria (55 registros)
-- --------------------------------------------------------
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (1, 1, 'Cumplimiento del horario establecido', 'INSTITUCIONAL', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (2, 2, 'Capacidad para proponer sugerencias', 'INSTITUCIONAL', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (3, 3, 'Aporte de soluciones originales', 'INSTITUCIONAL', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (4, 4, 'Comunicación verbal y escrita', 'INSTITUCIONAL', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (5, 5, 'Receptividad a planteamientos', 'INSTITUCIONAL', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (6, 6, 'Responsabilidad en actividades asignadas', 'INSTITUCIONAL', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (7, 7, 'Cumplimiento de normas de seguridad', 'INSTITUCIONAL', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (8, 8, 'Disposición para colaborar', 'INSTITUCIONAL', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (9, 9, 'Adaptación a cambios', 'INSTITUCIONAL', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (10, 10, 'Participación y compromiso', 'INSTITUCIONAL', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (11, 11, 'Productividad en el trabajo', 'INSTITUCIONAL', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (12, 12, 'Calidad de resultados', 'INSTITUCIONAL', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (13, 13, 'Manejo de técnicas requeridas', 'INSTITUCIONAL', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (14, 14, 'Compromiso con metas organizacionales', 'INSTITUCIONAL', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (15, 15, 'Relaciones interpersonales', 'INSTITUCIONAL', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (16, 16, 'Manejo de herramientas informáticas', 'INSTITUCIONAL', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (17, 17, 'Disposición para aprender', 'INSTITUCIONAL', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (18, 18, 'Obtener y compartir información', 'INSTITUCIONAL', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (19, 19, 'Trabajo bajo presión', 'INSTITUCIONAL', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (20, 20, 'Trabajo en equipo', 'INSTITUCIONAL', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (21, 1, 'Cumplimiento del horario de prácticas', 'ACADEMICO', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (22, 2, 'Aplicación de conocimientos teóricos', 'ACADEMICO', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (23, 3, 'Capacidad de análisis', 'ACADEMICO', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (24, 4, 'Redacción y ortografía', 'ACADEMICO', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (25, 5, 'Organización del trabajo', 'ACADEMICO', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (26, 6, 'Puntualidad en entregas', 'ACADEMICO', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (27, 7, 'Seguimiento de instrucciones', 'ACADEMICO', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (28, 8, 'Iniciativa y proactividad', 'ACADEMICO', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (29, 9, 'Resolución de problemas', 'ACADEMICO', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (30, 10, 'Actitud hacia el aprendizaje', 'ACADEMICO', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (31, 11, 'Calidad del informe de práctica', 'ACADEMICO', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (32, 12, 'Profundidad en el desarrollo de actividades', 'ACADEMICO', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (33, 13, 'Uso de recursos y materiales', 'ACADEMICO', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (34, 14, 'Integración teoría-práctica', 'ACADEMICO', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (35, 15, 'Comunicación con el tutor', 'ACADEMICO', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (36, 16, 'Cumplimiento de objetivos', 'ACADEMICO', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (37, 17, 'Creatividad e innovación', 'ACADEMICO', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (38, 18, 'Responsabilidad ética', 'ACADEMICO', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (39, 19, 'Adaptabilidad al ambiente laboral', 'ACADEMICO', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (40, 20, 'Desempeño general', 'ACADEMICO', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (41, 1, 'Vocabulario apropiado', 'COMITE', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (42, 2, 'Volumen de voz adecuado', 'COMITE', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (43, 3, 'Contacto visual con el público', 'COMITE', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (44, 4, 'Elegancia en apariencia personal', 'COMITE', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (45, 5, 'Dominio del tema presentado', 'COMITE', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (46, 6, 'Uso adecuado del tiempo', 'COMITE', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (47, 7, 'Calidad de ayudas audiovisuales', 'COMITE', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (48, 8, 'Coherencia de ayudas visuales', 'COMITE', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (49, 9, 'Explicación de la razón de ser de la PP', 'COMITE', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (50, 10, 'Descripción de actividades realizadas', 'COMITE', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (51, 11, 'Conocimiento obtenido durante la práctica', 'COMITE', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (52, 12, 'Claridad en las conclusiones', 'COMITE', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (53, 13, 'Recomendaciones propuestas', 'COMITE', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (54, 14, 'Definición de conceptos técnicos', 'COMITE', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (55, 15, 'Respuestas a preguntas del comité', 'COMITE', 1);

-- --------------------------------------------------------
-- Tabla: t_internship_type (6 registros)
-- --------------------------------------------------------
INSERT INTO "t_internship_type" ("INTERNSHIP_TYPE_ID", "NAME", "PRIORITY", "CREATION_DATE", "STATUS") VALUES (2, 'HOSPITALARIA', 1, '2025-05-05T01:25:00', 1);
INSERT INTO "t_internship_type" ("INTERNSHIP_TYPE_ID", "NAME", "PRIORITY", "CREATION_DATE", "STATUS") VALUES (3, 'COMUNITARIA', 2, '2025-05-05T01:25:00', 1);
INSERT INTO "t_internship_type" ("INTERNSHIP_TYPE_ID", "NAME", "PRIORITY", "CREATION_DATE", "STATUS") VALUES (1, 'ÚNICA', 0, '2025-05-05T01:24:07', 1);
INSERT INTO "t_internship_type" ("INTERNSHIP_TYPE_ID", "NAME", "PRIORITY", "CREATION_DATE", "STATUS") VALUES (5, 'EMPRESARIAL', 0, '2026-01-21T23:24:46.584', 0);
INSERT INTO "t_internship_type" ("INTERNSHIP_TYPE_ID", "NAME", "PRIORITY", "CREATION_DATE", "STATUS") VALUES (7, 'TESTT', 2, '2026-02-17T00:23:47.409', 0);
INSERT INTO "t_internship_type" ("INTERNSHIP_TYPE_ID", "NAME", "PRIORITY", "CREATION_DATE", "STATUS") VALUES (6, 'TEST', 0, '2026-02-17T00:19:23.006', 0);

-- --------------------------------------------------------
-- Tabla: t_internships_period (1 registros)
-- --------------------------------------------------------
INSERT INTO "t_internships_period" ("PERIOD_ID", "START_DATE", "END_DATE", "CREATION_DATE", "DESCRIPTION", "PERIOD_STATUS", "STATUS", "T_INTERNSHIPS_CODE") VALUES (1, '2026-02-24', '2027-04-22', '2026-02-24T15:35:24.786', '1-2026', '1', 1, '1-2026');

-- --------------------------------------------------------
-- Tabla: t_list (26 registros)
-- --------------------------------------------------------
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (380, 'CODIGOS_AREA', '2026-02-19T17:22:04.086', 1, '2026-02-19T17:22:04.086', 1, '2026-02-19T17:22:04.086', 1, '2026-02-19T17:22:04.086', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (21, 'CARRERA', '2025-03-11T17:03:01', 1, '2026-02-19T17:42:31.28', 1, '2025-03-11T17:03:01', 1, '2025-03-11T17:03:01', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (11, 'CATEGORIA', '2025-03-11T17:03:01', 1, '2026-02-19T17:42:38.471', 1, '2025-03-11T17:03:01', 1, '2025-03-11T17:03:01', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (9, 'CONDICION', '2025-03-11T17:03:01', 1, '2026-02-19T17:42:42.79', 1, '2025-03-11T17:03:01', 1, '2025-03-11T17:03:01', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (10, 'DEDICACION', '2025-03-11T17:03:01', 1, '2026-02-19T17:42:47.478', 1, '2025-03-11T17:03:01', 1, '2025-03-11T17:03:01', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (14, 'ESTATUS PASANTIA', '2025-03-11T17:03:01', 1, '2026-02-19T17:42:52.238', 1, '2025-03-11T17:03:01', 1, '2025-03-11T17:03:01', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (15, 'ESTATUS PERIODO', '2025-03-11T17:03:01', 1, '2026-02-19T17:42:55.93', 1, '2025-03-11T17:03:01', 1, '2025-03-11T17:03:01', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (18, 'EXTENSIÓN', '2025-03-11T17:03:01', 1, '2026-02-19T17:42:59.348', 1, '2025-03-11T17:03:01', 1, '2025-03-11T17:03:01', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (17, 'NUCLEO', '2025-03-11T17:03:01', 1, '2026-02-19T17:43:11.987', 1, '2025-03-11T17:03:01', 1, '2025-03-11T17:03:01', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (3, 'NACIONALIDAD', '2025-03-11T17:03:01', 1, '2026-02-19T17:43:04.846', 1, '2025-06-22T20:22:06', 1, '2025-03-11T17:03:01', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (22, 'PRE FIJO', '2026-02-17T22:44:21', 1, '2026-02-19T17:43:33.768', 1, '2026-02-17T22:44:17', 1, '2026-02-17T22:44:15', 0);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (20, 'PROFESIÓN', '2025-03-11T17:03:01', 1, '2026-02-19T17:43:41.502', 1, '2025-03-11T17:03:01', 1, '2025-03-11T17:03:01', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (13, 'RANGO MILITAR', '2025-03-11T17:03:01', 1, '2026-02-19T17:43:45.016', 1, '2025-06-22T20:22:24', 1, '2025-03-11T17:03:01', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (381, 'REE', '2026-02-19T17:41:37.779', 1, '2026-02-19T17:43:49.736', 1, '2026-02-19T17:41:37.779', 1, '2026-02-19T17:41:37.779', 0);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (4, 'REGIMEN/TURNO', '2025-03-11T17:03:01', 1, '2026-02-19T17:43:54.968', 1, '2025-03-11T17:03:01', 1, '2025-03-11T17:03:01', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (16, 'REGION', '2025-03-11T17:03:01', 1, '2026-02-19T17:43:59.861', 1, '2025-03-11T17:03:01', 1, '2025-03-11T17:03:01', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (7, 'RIF', '2025-03-11T17:03:01', 1, '2026-02-19T17:44:02.893', 1, '2025-03-11T17:03:01', 1, '2025-03-11T17:03:01', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (1, 'SEXO', '2025-03-11T17:03:01', 1, '2026-02-19T17:44:06.014', 1, '2025-03-11T17:03:01', 1, '2025-03-11T17:03:01', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (6, 'TIPO DE EMPRESA', '2025-03-11T17:03:01', 1, '2026-02-19T17:44:12.681', 1, '2025-03-11T17:03:01', 1, '2025-03-11T17:03:01', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (12, 'TIPO DE ESTUDIANTE', '2025-03-11T17:03:01', 1, '2026-02-19T17:44:17.186', 1, '2025-03-11T17:03:01', 1, '2025-03-11T17:03:01', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (8, 'TIPO DE PRACTICA', '2025-03-11T17:03:01', 1, '2026-02-19T17:44:21.393', 1, '2025-03-11T17:03:01', 1, '2025-03-11T17:03:01', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (5, 'TRABAJO', '2025-03-11T17:03:01', 1, '2026-02-19T17:44:26.029', 1, '2025-03-11T17:03:01', 1, '2025-03-11T17:03:01', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (19, 'TRASLADO', '2025-03-11T17:03:01', 1, '2026-02-19T17:44:31.868', 1, '2025-03-11T17:03:01', 1, '2025-03-11T17:03:01', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (2, 'REGISTRO CIVIL', '2025-03-11T17:03:01', 1, '2026-02-19T17:44:45.569', 1, '2025-03-11T17:03:01', 1, '2025-03-11T17:03:01', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (388, 'ESTADOS_VENEZUELA', '2026-02-23T17:13:09.199', 1, '2026-02-23T17:13:09.199', 1, '2026-02-23T17:13:09.199', 1, '2026-02-23T17:13:09.199', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (391, 'Título', '2026-02-23T20:56:11.619883', 1, '2026-02-23T20:56:11.619883', 1, '2026-02-23T20:56:11.619883', 1, '2026-02-23T20:56:11.619883', 1);

-- --------------------------------------------------------
-- Tabla: t_operation (3 registros)
-- --------------------------------------------------------
INSERT INTO "t_operation" ("OPERATION_ID", "ACTION", "DESCRIPTION", "STATUS") VALUES (1, 'INSERT', 'Inserción de nuevo registro', 1);
INSERT INTO "t_operation" ("OPERATION_ID", "ACTION", "DESCRIPTION", "STATUS") VALUES (2, 'UPDATE', 'Actualización de registro', 1);
INSERT INTO "t_operation" ("OPERATION_ID", "ACTION", "DESCRIPTION", "STATUS") VALUES (3, 'DELETE', 'Eliminación de registro', 1);

-- --------------------------------------------------------
-- Tabla: t_permissions (40 registros)
-- --------------------------------------------------------
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (81, 'users:view', 'Ver lista de usuarios', 1, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (82, 'users:create', 'Crear nuevos usuarios', 1, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (83, 'users:edit', 'Editar usuarios existentes', 1, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (84, 'users:delete', 'Eliminar usuarios', 1, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (85, 'students:view', 'Ver lista de estudiantes', 1, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (86, 'students:create', 'Registrar nuevos estudiantes', 1, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (87, 'students:edit', 'Editar información de estudiantes', 1, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (88, 'students:delete', 'Eliminar estudiantes', 1, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (89, 'students:export', 'Exportar datos de estudiantes', 1, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (90, 'tutors:view', 'Ver lista de tutores', 1, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (91, 'tutors:create', 'Registrar nuevos tutores', 1, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (92, 'tutors:edit', 'Editar información de tutores', 1, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (93, 'tutors:delete', 'Eliminar tutores', 1, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (94, 'institutions:view', 'Ver lista de instituciones', 1, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (95, 'institutions:create', 'Registrar nuevas instituciones', 1, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (96, 'institutions:edit', 'Editar información de instituciones', 1, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (97, 'institutions:delete', 'Eliminar instituciones', 1, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (98, 'practices:view', 'Ver prácticas profesionales', 1, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (99, 'practices:create', 'Registrar nuevas prácticas', 1, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (100, 'practices:edit', 'Editar prácticas', 1, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (101, 'practices:delete', 'Eliminar prácticas', 1, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (102, 'practices:evaluate', 'Evaluar prácticas', 1, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (103, 'periods:view', 'Ver periodos académicos', 1, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (104, 'periods:create', 'Crear nuevos periodos', 1, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (105, 'periods:edit', 'Editar periodos', 1, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (106, 'periods:delete', 'Eliminar periodos', 1, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (107, 'backups:view', 'Ver lista de respaldos', 1, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (108, 'backups:create', 'Crear respaldos', 1, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (109, 'backups:restore', 'Restaurar respaldos', 1, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (110, 'backups:delete', 'Eliminar respaldos', 1, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (111, 'reports:view', 'Ver reportes', 1, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (112, 'reports:export', 'Exportar reportes', 1, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (113, 'config:view', 'Ver configuración del sistema', 1, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (114, 'config:edit', 'Modificar configuración del sistema', 1, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (115, 'careers:view', 'Ver carreras', 1, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (116, 'careers:create', 'Crear carreras', 1, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (117, 'careers:edit', 'Editar carreras', 1, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (118, 'careers:delete', 'Eliminar carreras', 1, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (119, 'requests:view', 'Ver solicitudes', 1, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (120, 'requests:approve', 'Aprobar/rechazar solicitudes', 1, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 0, '2026-02-20T17:17:19.25269', 1);

-- --------------------------------------------------------
-- Tabla: t_preset_questions (6 registros)
-- --------------------------------------------------------
INSERT INTO "t_preset_questions" ("PRESET_QUESTION_ID", "DESCRIPTION", "ANSWER", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (1, '¿Cuál era el apodo de tu mejor amigo de la infancia?', 'QWE', 0, '2025-01-01T00:00:00', 0, '2025-01-01T00:00:00', 0, '2025-01-01T00:00:00', 1);
INSERT INTO "t_preset_questions" ("PRESET_QUESTION_ID", "DESCRIPTION", "ANSWER", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (2, '¿En qué ciudad se conocieron sus padres?', 'ASD', 0, '2025-01-01T00:00:00', 0, '2025-01-01T00:00:00', 0, '2025-01-01T00:00:00', 1);
INSERT INTO "t_preset_questions" ("PRESET_QUESTION_ID", "DESCRIPTION", "ANSWER", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (3, '¿Cuál es el apellido de tu vecino?', 'ZXC', 0, '2025-01-01T00:00:00', 0, '2025-01-01T00:00:00', 0, '2025-01-01T00:00:00', 1);
INSERT INTO "t_preset_questions" ("PRESET_QUESTION_ID", "DESCRIPTION", "ANSWER", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (4, '¿En qué ciudad se conocieron sus padres?', 'QWE', 0, '2025-01-01T00:00:00', 0, '2025-01-01T00:00:00', 0, '2025-01-01T00:00:00', 1);
INSERT INTO "t_preset_questions" ("PRESET_QUESTION_ID", "DESCRIPTION", "ANSWER", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (5, '¿Cuántas mascotas tenías a los 10 años?', 'ASD', 0, '2025-01-01T00:00:00', 0, '2025-01-01T00:00:00', 0, '2025-01-01T00:00:00', 1);
INSERT INTO "t_preset_questions" ("PRESET_QUESTION_ID", "DESCRIPTION", "ANSWER", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (6, '¿Cuál es el apellido de tu vecino?', 'ZXC', 0, '2025-01-01T00:00:00', 0, '2025-01-01T00:00:00', 0, '2025-01-01T00:00:00', 1);

-- --------------------------------------------------------
-- Tabla: t_request_types (8 registros)
-- --------------------------------------------------------
INSERT INTO "t_request_types" ("REQUEST_TYPE_ID", "NAME", "DESCRIPTION", "IS_ACTIVE", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (1, 'Cambio de Empresa', 'Solicitud para cambiar la empresa donde se realizan las prácticas', 1, '2026-02-19T23:57:40.67571', 0, '2026-02-19T23:57:40.67571', 0, '2026-02-19T23:57:40.67571', 0, '2026-02-19T23:57:40.67571', 1);
INSERT INTO "t_request_types" ("REQUEST_TYPE_ID", "NAME", "DESCRIPTION", "IS_ACTIVE", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (2, 'Cambio de Tutor', 'Solicitud para cambiar el tutor académico asignado', 1, '2026-02-19T23:57:40.67571', 0, '2026-02-19T23:57:40.67571', 0, '2026-02-19T23:57:40.67571', 0, '2026-02-19T23:57:40.67571', 1);
INSERT INTO "t_request_types" ("REQUEST_TYPE_ID", "NAME", "DESCRIPTION", "IS_ACTIVE", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (3, 'Prórroga de Pasantía', 'Solicitud para extender el período de pasantía', 1, '2026-02-19T23:57:40.67571', 0, '2026-02-19T23:57:40.67571', 0, '2026-02-19T23:57:40.67571', 0, '2026-02-19T23:57:40.67571', 1);
INSERT INTO "t_request_types" ("REQUEST_TYPE_ID", "NAME", "DESCRIPTION", "IS_ACTIVE", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (4, 'Retiro de Pasantía', 'Solicitud para retirarse del programa de pasantías', 1, '2026-02-19T23:57:40.67571', 0, '2026-02-19T23:57:40.67571', 0, '2026-02-19T23:57:40.67571', 0, '2026-02-19T23:57:40.67571', 1);
INSERT INTO "t_request_types" ("REQUEST_TYPE_ID", "NAME", "DESCRIPTION", "IS_ACTIVE", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (5, 'Carta de Pasantía', 'Solicitud de carta de aceptación o culminación de pasantía', 1, '2026-02-19T23:57:40.67571', 0, '2026-02-19T23:57:40.67571', 0, '2026-02-19T23:57:40.67571', 0, '2026-02-19T23:57:40.67571', 1);
INSERT INTO "t_request_types" ("REQUEST_TYPE_ID", "NAME", "DESCRIPTION", "IS_ACTIVE", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (6, 'Constancia de Estudios', 'Solicitud de constancia de estudios con fines de pasantía', 1, '2026-02-19T23:57:40.67571', 0, '2026-02-19T23:57:40.67571', 0, '2026-02-19T23:57:40.67571', 0, '2026-02-19T23:57:40.67571', 1);
INSERT INTO "t_request_types" ("REQUEST_TYPE_ID", "NAME", "DESCRIPTION", "IS_ACTIVE", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (7, 'Revisión de Nota', 'Solicitud para revisar la calificación final de pasantía', 1, '2026-02-19T23:57:40.67571', 0, '2026-02-19T23:57:40.67571', 0, '2026-02-19T23:57:40.67571', 0, '2026-02-19T23:57:40.67571', 1);
INSERT INTO "t_request_types" ("REQUEST_TYPE_ID", "NAME", "DESCRIPTION", "IS_ACTIVE", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (8, 'Otro', 'Otro tipo de solicitud no contemplada', 1, '2026-02-19T23:57:40.67571', 0, '2026-02-19T23:57:40.67571', 0, '2026-02-19T23:57:40.67571', 0, '2026-02-19T23:57:40.67571', 1);

-- --------------------------------------------------------
-- Tabla: t_roles (4 registros)
-- --------------------------------------------------------
INSERT INTO "t_roles" ("ID_ROLS", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (4, 'ESTUDIANTE', 'Estudiante - visualización y solicitudes', 1, '2026-02-18T20:25:50.47111', 1, '2026-02-18T20:25:50.47111', 1, '2026-02-18T20:25:50.47111', 1);
INSERT INTO "t_roles" ("ID_ROLS", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (3, 'TUTOR', 'Tutor académico - gestión de seguimiento y notas', 1, '2026-02-18T20:25:50.47111', 1, '2026-02-18T20:25:50.47111', 1, '2026-02-18T20:25:50.47111', 1);
INSERT INTO "t_roles" ("ID_ROLS", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (1, 'ADMIN', 'Administrador con acceso total al sistema', 1, '2026-02-24T13:17:02.38', 1, '2026-02-24T13:17:02.38', 1, '2026-02-24T13:17:02.38', 1);
INSERT INTO "t_roles" ("ID_ROLS", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (2, 'ASISTENTE', 'Asistente con permisos de solo lectura', 1, '2026-02-24T13:17:02.862', 1, '2026-02-24T13:17:02.862', 1, '2026-02-24T13:17:02.862', 1);

-- --------------------------------------------------------
-- Tabla: t_roles_permissions (70 registros)
-- --------------------------------------------------------
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 81);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 82);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 83);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 84);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 85);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 86);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 87);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 88);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 89);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 90);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 91);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 92);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 93);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 94);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 95);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 96);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 97);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 98);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 99);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 100);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 101);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 102);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 103);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 104);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 105);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 106);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 107);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 108);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 109);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 110);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 111);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 112);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 113);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 114);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 115);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 116);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 117);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 118);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 119);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 120);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 81);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 82);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 85);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 86);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 87);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 89);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 90);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 91);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 92);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 94);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 95);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 96);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 98);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 99);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 100);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 103);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 104);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 105);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 115);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 116);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 117);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 119);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 120);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 111);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 112);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (3, 102);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (3, 111);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (3, 85);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (3, 89);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (3, 98);

-- --------------------------------------------------------
-- Tabla: t_tables (13 registros)
-- --------------------------------------------------------
INSERT INTO "t_tables" ("TABLE_ID", "NAME", "DESCRIPTION", "PHYSICAL_NAME", "LOG", "STATUS") VALUES (14, 'Usuarios', 'Tabla de usuarios del sistema', 't_user', 1, 1);
INSERT INTO "t_tables" ("TABLE_ID", "NAME", "DESCRIPTION", "PHYSICAL_NAME", "LOG", "STATUS") VALUES (15, 'Claves de Usuario', 'Historial de claves', 't_user_key', 1, 1);
INSERT INTO "t_tables" ("TABLE_ID", "NAME", "DESCRIPTION", "PHYSICAL_NAME", "LOG", "STATUS") VALUES (16, 'Roles', 'Roles del sistema', 't_roles', 1, 1);
INSERT INTO "t_tables" ("TABLE_ID", "NAME", "DESCRIPTION", "PHYSICAL_NAME", "LOG", "STATUS") VALUES (17, 'Permisos', 'Permisos del sistema', 't_permissions', 1, 1);
INSERT INTO "t_tables" ("TABLE_ID", "NAME", "DESCRIPTION", "PHYSICAL_NAME", "LOG", "STATUS") VALUES (18, 'Estudiantes', 'Estudiantes registrados', 't_students', 1, 1);
INSERT INTO "t_tables" ("TABLE_ID", "NAME", "DESCRIPTION", "PHYSICAL_NAME", "LOG", "STATUS") VALUES (19, 'Tutores', 'Tutores académicos', 't_tutors', 1, 1);
INSERT INTO "t_tables" ("TABLE_ID", "NAME", "DESCRIPTION", "PHYSICAL_NAME", "LOG", "STATUS") VALUES (20, 'Instituciones', 'Instituciones/empresas', 't_institution', 1, 1);
INSERT INTO "t_tables" ("TABLE_ID", "NAME", "DESCRIPTION", "PHYSICAL_NAME", "LOG", "STATUS") VALUES (21, 'Carreras', 'Carreras universitarias', 't_career', 1, 1);
INSERT INTO "t_tables" ("TABLE_ID", "NAME", "DESCRIPTION", "PHYSICAL_NAME", "LOG", "STATUS") VALUES (22, 'Periodos', 'Periodos académicos', 't_internships_period', 1, 1);
INSERT INTO "t_tables" ("TABLE_ID", "NAME", "DESCRIPTION", "PHYSICAL_NAME", "LOG", "STATUS") VALUES (23, 'Prácticas', 'Prácticas profesionales', 't_professional_practices', 1, 1);
INSERT INTO "t_tables" ("TABLE_ID", "NAME", "DESCRIPTION", "PHYSICAL_NAME", "LOG", "STATUS") VALUES (24, 'Evaluaciones', 'Evaluaciones de prácticas', 't_evaluation', 1, 1);
INSERT INTO "t_tables" ("TABLE_ID", "NAME", "DESCRIPTION", "PHYSICAL_NAME", "LOG", "STATUS") VALUES (25, 'Visitas', 'Visitas a instituciones', 't_practice_visits', 1, 1);
INSERT INTO "t_tables" ("TABLE_ID", "NAME", "DESCRIPTION", "PHYSICAL_NAME", "LOG", "STATUS") VALUES (26, 'Respaldos', 'Respaldos de BD', 't_backups', 0, 1);

-- --------------------------------------------------------
-- Tabla: t_user (1 registros)
-- --------------------------------------------------------
INSERT INTO "t_user" ("USER_ID", "USER", "USER_CI", "NAME", "SECOND_NAME", "SURNAME", "SECOND_SURNAME", "EMAIL", "PHONE_NUMBER", "CREATION_DATE", "LOGIN", "TERMS_CONDITIONS", "STATUS_SESSION", "STATUS", "FAILED_ATTEMPTS", "LOCK_DATE", "FORCE_PASSWORD_CHANGE") VALUES (1, 'master', 'V00000000', 'Administrador', 'Maestro', 'Sistema', '', 'admin@unefa.edu.ve', '04140000000', '2026-02-24T13:37:30.110134', 0, '', 0, 1, 0, NULL, FALSE);

-- --------------------------------------------------------
-- Tabla: t_user_key (1 registros)
-- --------------------------------------------------------
INSERT INTO "t_user_key" ("USER_KEY_ID", "USER_ID", "KEY", "START_DATE", "END_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS", "IS_TEMPORARY") VALUES (1, 1, '$2b$10$mSjlTWhc1Ar.SNHMcHgb3Oys/ju9zy6IYbg/KxW02yNpueBVXwsgW', '2026-02-24T13:37:30.110134', '2099-12-31T23:59:59', 1, '2026-02-24T13:37:30.110134', 1, '2026-02-24T13:37:30.110134', 1, '2026-02-24T13:37:30.110134', 1, FALSE);

-- --------------------------------------------------------
-- Tabla: t_user_roles (1 registros)
-- --------------------------------------------------------
INSERT INTO "t_user_roles" ("ID_USER", "ID_ROLES") VALUES (1, 1);

-- --------------------------------------------------------
-- Tabla: t_user_theme (1 registros)
-- --------------------------------------------------------
INSERT INTO "t_user_theme" ("USER_THEME_ID", "USER_ID", "BRAND_COLOR", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (1, 1, 'blue', '2026-02-24T13:37:30.110134', 1, '2026-02-24T13:37:30.110134', 1, '2026-02-24T13:37:30.110134', 1, '2026-02-24T13:37:30.110134', 1);

-- --------------------------------------------------------
-- Tabla: t_value_list (71 registros)
-- --------------------------------------------------------
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (1, 'FEMENINO', 'F', 1, '2025-03-22T18:38:48', 1, '2025-03-22T18:38:48', 1, '2025-03-22T18:38:48', 1, '2025-03-22T18:38:48', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (2, 'MASCULINO', 'M', 1, '2025-03-22T18:41:55', 1, '2025-03-22T18:41:55', 1, '2025-03-22T18:41:55', 1, '2025-03-22T18:41:55', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (3, 'SOLTERO', 'S', 2, '2025-03-22T18:42:40', 1, '2025-03-22T18:42:40', 1, '2025-03-22T18:42:40', 1, '2025-03-22T18:42:40', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (4, 'CASADO', 'C', 2, '2025-03-22T18:43:33', 1, '2025-03-22T18:43:33', 1, '2025-03-22T18:43:33', 1, '2025-03-22T18:43:33', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (5, 'DIVORCIADO', 'D', 2, '2025-03-22T18:44:03', 1, '2025-03-22T18:44:03', 1, '2025-03-22T18:44:03', 1, '2025-03-22T18:44:03', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (6, 'CONCUBINO', 'CB', 2, '2025-03-22T18:44:27', 1, '2025-03-22T18:44:27', 1, '2025-03-22T18:44:27', 1, '2025-03-22T18:44:27', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (7, 'VIUDO', 'V', 2, '2025-03-22T18:45:11', 1, '2025-03-22T18:45:11', 1, '2025-03-22T18:45:11', 1, '2025-03-22T18:45:11', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (8, 'VENEZOLANO', 'V', 3, '2025-03-22T18:45:36', 1, '2025-03-22T18:45:36', 1, '2025-03-22T18:45:36', 1, '2025-03-22T18:45:36', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (9, 'EXTRANJERO', 'E', 3, '2025-03-22T18:46:02', 1, '2025-03-22T18:46:02', 1, '2025-03-22T18:46:02', 1, '2025-03-22T18:46:02', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (10, 'DIURNO', 'D1', 4, '2025-03-22T18:46:52', 1, '2025-03-22T18:46:52', 1, '2025-03-22T18:46:52', 1, '2025-03-22T18:46:52', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (11, 'NOCTURNO', 'N2', 4, '2025-03-22T18:47:17', 1, '2025-03-22T18:47:17', 1, '2025-03-22T18:47:17', 1, '2025-03-22T18:47:17', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (12, 'SABATINO', 'S3', 4, '2025-03-22T18:47:41', 1, '2025-03-22T18:47:41', 1, '2025-03-22T18:47:41', 1, '2025-03-22T18:47:41', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (13, 'SI', 'SI', 5, '2025-03-22T18:48:08', 1, '2025-03-22T18:48:08', 1, '2025-03-22T18:48:08', 1, '2025-03-22T18:48:08', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (14, 'NO', 'NO', 5, '2025-03-22T18:48:35', 1, '2025-03-22T18:48:35', 1, '2025-03-22T18:48:35', 1, '2025-03-22T18:48:35', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (21, 'HOSPITALARIA', 'HOSP', 8, '2025-03-22T18:51:32', 1, '2025-03-22T18:51:32', 1, '2025-03-22T18:51:32', 1, '2025-03-22T18:51:32', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (22, 'COMUNITARIA', 'COM', 8, '2025-03-22T18:52:00', 1, '2025-03-22T18:52:00', 1, '2025-03-22T18:52:00', 1, '2025-03-22T18:52:00', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (24, 'ORDINARIO', 'ORD', 9, '2025-03-22T18:52:43', 1, '2025-03-22T18:52:43', 1, '2025-03-22T18:52:43', 1, '2025-03-22T18:52:43', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (25, 'CONTRATADO', 'CONT', 9, '2025-03-22T18:53:10', 1, '2025-03-22T18:53:10', 1, '2025-03-22T18:53:10', 1, '2025-03-22T18:53:10', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (26, 'DEDICACIÓN EXCLUSIVA', 'DE', 10, '2025-03-22T18:53:42', 1, '2025-03-22T18:53:42', 1, '2025-03-22T18:53:42', 1, '2025-03-22T18:53:42', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (27, 'TIEMPO COMPLETO', 'TC', 10, '2025-03-22T18:54:04', 1, '2025-03-22T18:54:04', 1, '2025-03-22T18:54:04', 1, '2025-03-22T18:54:04', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (28, 'TIEMPO CONVECIONAL', 'TV', 10, '2025-03-22T18:54:28', 1, '2025-03-22T18:54:28', 1, '2025-03-22T18:54:28', 1, '2025-03-22T18:54:28', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (29, 'MEDIO TIEMPO', 'MV', 10, '2025-03-22T18:54:49', 1, '2025-03-22T18:54:49', 1, '2025-03-22T18:54:49', 1, '2025-03-22T18:54:49', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (30, 'AUXILIAR DOCENTE', 'AUXILIAR', 11, '2025-03-22T18:55:11', 1, '2025-03-22T18:55:11', 1, '2025-03-22T18:55:11', 1, '2025-03-22T18:55:11', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (31, 'DOCENTE INSTRUCTOR', 'INSTRUCT', 11, '2025-03-22T18:55:46', 1, '2025-03-22T18:55:46', 1, '2025-03-22T18:55:46', 1, '2025-03-22T18:55:46', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (32, 'DOCENTE ASISTENTE', 'ASISTENT', 11, '2025-03-22T18:56:58', 1, '2025-03-22T18:56:58', 1, '2025-03-22T18:56:58', 1, '2025-03-22T18:56:58', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (33, 'DOCENTE AGREGADO', 'AGREGADO', 11, '2025-03-22T18:57:26', 1, '2025-03-22T18:57:26', 1, '2025-03-22T18:57:26', 1, '2025-03-22T18:57:26', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (34, 'DOCENTE ASOCIADO', 'ASOCIADO', 11, '2025-03-22T18:57:50', 1, '2025-03-22T18:57:50', 1, '2025-03-22T18:57:50', 1, '2025-03-22T18:57:50', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (35, 'DOCENTE TITULAR', 'TITULAR', 11, '2025-03-22T18:58:14', 1, '2025-03-22T18:58:14', 1, '2025-03-22T18:58:14', 1, '2025-03-22T18:58:14', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (36, 'CIVIL', 'CIV', 12, '2025-03-22T18:58:31', 1, '2025-03-22T18:58:31', 1, '2025-03-22T18:58:31', 1, '2025-03-22T18:58:31', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (37, 'MILITAR', 'MIL', 12, '2025-03-22T18:58:59', 1, '2025-03-22T18:58:59', 1, '2025-03-22T18:58:59', 1, '2025-03-22T18:58:59', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (38, 'SUBTENIENTE', 'SBTTE', 13, '2025-03-22T18:59:22', 1, '2025-03-22T18:59:22', 1, '2025-03-22T18:59:22', 1, '2025-03-22T18:59:22', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (39, 'TENIENTE', 'TTE', 13, '2025-03-22T18:59:43', 1, '2025-03-22T18:59:43', 1, '2025-03-22T18:59:43', 1, '2025-03-22T18:59:43', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (40, 'CAPITAN', 'CAP', 13, '2025-03-22T19:00:21', 1, '2025-03-22T19:00:21', 1, '2025-03-22T19:00:21', 1, '2025-03-22T19:00:21', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (41, 'MAYOR', 'MY', 13, '2025-03-22T19:00:41', 1, '2025-03-22T19:00:41', 1, '2025-03-22T19:00:41', 1, '2025-03-22T19:00:41', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (42, 'TENIENTE CORONEL', 'TTE CNEL', 13, '2025-03-22T19:01:00', 1, '2025-03-22T19:01:00', 1, '2025-03-22T19:01:00', 1, '2025-03-22T19:01:00', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (43, 'CORONEL', 'CNEL', 13, '2025-03-22T19:01:33', 1, '2025-03-22T19:01:33', 1, '2025-03-22T19:01:33', 1, '2025-03-22T19:01:33', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (44, 'APROBADO', 'A', 14, '2025-03-22T19:02:06', 1, '2025-03-22T19:02:06', 1, '2025-03-22T19:02:06', 1, '2025-03-22T19:02:06', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (45, 'REPROBADO', 'R', 14, '2025-03-22T19:02:24', 1, '2025-03-22T19:02:24', 1, '2025-03-22T19:02:24', 1, '2025-03-22T19:02:24', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (46, 'PENDIENTE', 'PEN', 15, '2025-03-22T19:02:46', 1, '2025-03-22T19:02:46', 1, '2025-03-22T19:02:46', 1, '2025-03-22T19:02:46', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (47, 'ABIERTO', 'ABT', 15, '2025-03-22T19:03:08', 1, '2025-03-22T19:03:08', 1, '2025-03-22T19:03:08', 1, '2025-03-22T19:03:08', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (48, 'CULMINADO', 'CULM', 15, '2025-03-22T19:03:28', 1, '2025-03-22T19:03:28', 1, '2025-03-22T19:03:28', 1, '2025-03-22T19:03:28', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (49, 'ANULADO', 'NULL', 15, '2025-03-22T19:03:51', 1, '2025-03-22T19:03:51', 1, '2025-03-22T19:03:51', 1, '2025-03-22T19:03:51', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (50, 'LOS LLANOS', 'LOS LLAN', 16, '2025-03-22T19:04:11', 1, '2025-03-22T19:04:11', 1, '2025-03-22T19:04:11', 1, '2025-03-22T19:04:11', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (51, 'PORTUGUESA', 'PORTUGUE', 17, '2025-03-22T19:04:35', 1, '2025-03-22T19:04:35', 1, '2025-03-22T19:04:35', 1, '2025-03-22T19:04:35', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (52, 'ACARIGUA', 'ACARIGUA', 18, '2025-03-22T19:05:21', 1, '2025-03-22T19:05:21', 1, '2025-03-22T19:05:21', 1, '2025-03-22T19:05:21', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (53, 'SI', 'SI', 19, '2025-03-22T19:05:45', 1, '2025-03-22T19:05:45', 1, '2025-03-22T19:05:45', 1, '2025-03-22T19:05:45', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (54, 'NO', 'NO', 19, '2025-03-22T19:06:11', 1, '2025-03-22T19:06:11', 1, '2025-03-22T19:06:11', 1, '2025-03-22T19:06:11', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (55, 'ENFERMERIA', 'ENF', 20, '2025-03-22T19:06:30', 1, '2025-03-22T19:06:30', 1, '2025-03-22T19:06:30', 1, '2025-03-22T19:06:30', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (56, 'INGENIERIA', 'ING', 20, '2025-03-22T19:08:26', 1, '2025-03-22T19:08:26', 1, '2025-03-22T19:08:26', 1, '2025-03-22T19:08:26', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (59, 'NO APLICA', ' ', 13, '2025-05-18T15:37:12', 1, '2025-05-18T15:37:12', 1, '2025-05-18T15:37:12', 1, '2025-05-18T15:37:12', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (23, 'ÚNICA', 'ORD', 8, '2025-03-22T18:52:22', 1, '2025-03-22T18:52:22', 1, '2025-03-22T18:52:22', 1, '2025-03-22T18:52:22', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (15, 'PUBLICA', 'PÚBLICA', 6, '2025-03-22T18:48:49', 1, '2025-03-22T18:48:49', 1, '2025-03-22T18:48:49', 1, '2025-03-22T18:48:49', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (16, 'PRIVADA', 'PRIVADA', 6, '2025-03-22T18:49:21', 1, '2025-03-22T18:49:21', 1, '2025-03-22T18:49:21', 1, '2025-03-22T18:49:21', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (17, 'MIXTA', 'MIXTA', 6, '2025-03-22T18:49:56', 1, '2025-03-22T18:49:56', 1, '2025-03-22T18:49:56', 1, '2025-03-22T18:49:56', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (57, 'ENFERMERIA', 'ENF', 21, '2025-03-22T19:06:48', 1, '2025-03-22T19:06:48', 1, '2025-03-22T19:06:48', 1, '2025-03-22T19:06:48', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (19, 'G', 'G', 7, '2025-03-22T18:50:43', 1, '2025-03-22T18:50:43', 1, '2025-03-22T18:50:43', 1, '2025-03-22T18:50:43', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (20, 'J', 'J', 7, '2025-03-22T18:50:20', 1, '2025-03-22T18:50:20', 1, '2025-03-22T18:50:20', 1, '2025-03-22T18:50:20', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (18, 'C', 'C', 7, '2025-03-22T18:51:04', 1, '2025-03-22T18:51:04', 1, '2025-03-22T18:51:04', 1, '2025-03-22T18:51:04', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (60, '0412', '0412', 22, '2026-02-17T22:46:04', 1, '2026-02-17T22:46:07', 1, '2026-02-17T22:46:11', 1, '2026-02-17T22:46:15', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (58, 'INGENIERIA', 'ING', 21, '2025-03-22T19:07:16', 1, '2025-03-22T19:07:16', 1, '2025-03-22T19:07:16', 1, '2025-03-22T19:07:16', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (86, '0412', NULL, 380, '2026-02-19T17:26:24.423', 1, '2026-02-19T17:26:24.423', 1, '2026-02-19T17:26:24.423', 1, '2026-02-19T17:26:24.423', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (87, '0414', NULL, 380, '2026-02-19T17:26:25.081', 1, '2026-02-19T17:26:25.081', 1, '2026-02-19T17:26:25.081', 1, '2026-02-19T17:26:25.081', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (88, '0424', NULL, 380, '2026-02-19T17:26:25.535', 1, '2026-02-19T17:26:25.535', 1, '2026-02-19T17:26:25.535', 1, '2026-02-19T17:26:25.535', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (89, '0416', NULL, 380, '2026-02-19T17:26:25.662', 1, '2026-02-19T17:26:25.662', 1, '2026-02-19T17:26:25.662', 1, '2026-02-19T17:26:25.662', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (90, '0426', NULL, 380, '2026-02-19T17:26:26.133', 1, '2026-02-19T17:26:26.133', 1, '2026-02-19T17:26:26.133', 1, '2026-02-19T17:26:26.133', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (91, '0212', NULL, 380, '2026-02-19T17:26:26.809', 1, '2026-02-19T17:26:26.809', 1, '2026-02-19T17:26:26.809', 1, '2026-02-19T17:26:26.809', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (94, 'PREGRADO', 'PRE', 391, '2026-02-23T20:56:11.619883', 1, '2026-02-23T20:56:11.619883', 1, '2026-02-23T20:56:11.619883', 1, '2026-02-23T20:56:11.619883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (95, 'ESPECIALIZACIÓN', 'ESP', 391, '2026-02-23T20:56:11.619883', 1, '2026-02-23T20:56:11.619883', 1, '2026-02-23T20:56:11.619883', 1, '2026-02-23T20:56:11.619883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (96, 'MAESTRÍA', 'MAE', 391, '2026-02-23T20:56:11.619883', 1, '2026-02-23T20:56:11.619883', 1, '2026-02-23T20:56:11.619883', 1, '2026-02-23T20:56:11.619883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (97, 'DOCTORADO', 'DOC', 391, '2026-02-23T20:56:11.619883', 1, '2026-02-23T20:56:11.619883', 1, '2026-02-23T20:56:11.619883', 1, '2026-02-23T20:56:11.619883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (92, 'PORTUGUESA', 'PORTUGUE', 388, '2026-02-23T17:14:12.566', 0, '2026-02-24T14:28:50.658', 1, '2026-02-23T17:14:12.566', 1, '2026-02-23T17:14:12.566', 1);

-- ============================================================
-- SECCIÓN 3: TABLAS SIN DATOS (vacías)
-- ============================================================
-- t_activity_logs (0 registros)
-- t_career (0 registros)
-- t_career_internship_type (0 registros)
-- t_change_log (0 registros)
-- t_chat_sessions (0 registros)
-- t_evaluation (0 registros)
-- t_evaluation_detail (0 registros)
-- t_institution (0 registros)
-- t_institution_career (0 registros)
-- t_institution_internship_type (0 registros)
-- t_institution_manager (0 registros)
-- t_key_history (0 registros)
-- t_notifications (0 registros)
-- t_password_history (0 registros)
-- t_practice_visits (0 registros)
-- t_professional_practices (0 registros)
-- t_professional_practices_tutor (0 registros)
-- t_recovery_tokens (0 registros)
-- t_security_questions (0 registros)
-- t_session (0 registros)
-- t_session_attempts (0 registros)
-- t_session_history (0 registros)
-- t_student_documents (0 registros)
-- t_student_requests (0 registros)
-- t_students (0 registros)
-- t_tutor_career (0 registros)
-- t_tutors (0 registros)
-- t_user_questions (0 registros)
-- t_visit (0 registros)

-- ============================================================
-- RESUMEN DEL RESPALDO
-- ============================================================
-- Total de tablas: 48
-- Tablas con datos: 19
-- Tablas vacías: 29
-- Total de registros: 316
-- Tablas con error: 0

-- Reactivar verificación de foreign keys
SET session_replication_role = DEFAULT;
-- ================================================================================
-- FIN DEL RESPALDO
-- ================================================================================