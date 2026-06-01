--
-- Clean DB — UNEFA Dashboard
-- Elimina datos operacionales/de prueba, preservando datos de sistema y referencia.
-- Uso: psql -f scripts/clean-db.sql
--       psql "postgresql://..." -f scripts/clean-db.sql
--
-- Compatible con Supabase PostgreSQL y PGlite.
-- Generado: 2026-05-31
--

BEGIN;

-- ============================================================
-- DESHABILITAR TRIGGERS (evita checks FK temporales)
-- ============================================================
SET session_replication_role = replica;

-- ============================================================
-- 1. TABLAS OPERACIONALES
-- ============================================================

-- Las tablas se listan respetando orden de FK para claridad,
-- pero con los triggers deshabilitados el orden no importa.

DELETE FROM t_evaluation_detail;
DELETE FROM t_evaluation;
DELETE FROM t_activity_logs;
DELETE FROM t_practice_visits;
DELETE FROM t_professional_practices_tutor;
DELETE FROM t_student_documents;
DELETE FROM t_student_requests;
DELETE FROM t_professional_practices;
DELETE FROM t_tutor_career;
DELETE FROM t_institution_manager_institution;
DELETE FROM t_institution_manager;
DELETE FROM t_institution_internship_type;
DELETE FROM t_institution_career;
DELETE FROM t_institution;
DELETE FROM t_students;
DELETE FROM t_tutors;
DELETE FROM t_visit;
DELETE FROM t_persons;
DELETE FROM t_auth_log;
DELETE FROM t_session_history;
DELETE FROM t_session_attempts;
DELETE FROM t_session;
DELETE FROM t_recovery_tokens;
DELETE FROM t_password_history;
DELETE FROM t_key_history;
DELETE FROM t_security_questions;
DELETE FROM t_notifications;
DELETE FROM t_chat_sessions;
DELETE FROM t_backups;
DELETE FROM t_change_log;

-- Tablas con datos mixtos — preservar solo admin (USER_ID = 3)
DELETE FROM t_user_theme   WHERE USER_ID != 3;
DELETE FROM t_user_questions WHERE USER_ID != 3;
DELETE FROM t_user_key      WHERE USER_ID != 3;
DELETE FROM t_user_roles    WHERE ID_USER != 3;
DELETE FROM t_user          WHERE USER_ID != 3;

-- ============================================================
-- 2. RESETEAR SECUENCIAS (dinámico, maneja quoting mixto)
-- ============================================================

DO $$
DECLARE
    seq_name TEXT;
    col_name TEXT;
    tbl_name TEXT;
    next_val INT;
BEGIN
    -- Tablas completamente limpiadas → reset a 1
    FOR tbl_name IN
        SELECT unnest(ARRAY[
            't_evaluation_detail',
            't_evaluation',
            't_activity_logs',
            't_practice_visits',
            't_professional_practices_tutor',
            't_student_documents',
            't_student_requests',
            't_professional_practices',
            't_tutor_career',
            't_institution_manager_institution',
            't_institution_manager',
            't_institution_internship_type',
            't_institution_career',
            't_institution',
            't_students',
            't_tutors',
            't_visit',
            't_persons',
            't_auth_log',
            't_session_history',
            't_session_attempts',
            't_session',
            't_recovery_tokens',
            't_password_history',
            't_key_history',
            't_security_questions',
            't_notifications',
            't_chat_sessions',
            't_backups',
            't_change_log',
            't_user_questions',
            't_user_theme'
        ])
    LOOP
        -- Buscar la columna serial o identity
        SELECT a.attname INTO col_name
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = i.indkey[0]
        WHERE i.indrelid = tbl_name::regclass
          AND i.indisprimary;

        IF col_name IS NOT NULL THEN
            seq_name := pg_get_serial_sequence(tbl_name, col_name);
            IF seq_name IS NOT NULL THEN
                EXECUTE format('ALTER SEQUENCE %I RESTART WITH 1', seq_name);
            END IF;
        END IF;
    END LOOP;

    -- Tablas con datos preservados: avanzar secuencia post-admin
    -- t_user: admin tiene USER_ID = 3 → próximo = 4
    seq_name := pg_get_serial_sequence('t_user', 'USER_ID');
    IF seq_name IS NOT NULL THEN
        EXECUTE format('ALTER SEQUENCE %I RESTART WITH 4', seq_name);
    END IF;

    -- t_user_key: admin tiene USER_KEY_ID = 10 → próximo = 11
    seq_name := pg_get_serial_sequence('t_user_key', 'USER_KEY_ID');
    IF seq_name IS NOT NULL THEN
        EXECUTE format('ALTER SEQUENCE %I RESTART WITH 11', seq_name);
    END IF;
END $$;

-- ============================================================
-- 3. REHABILITAR TRIGGERS
-- ============================================================
SET session_replication_role = DEFAULT;

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
DO $$
DECLARE
    tbl TEXT;
    rec RECORD;
    total BIGINT := 0;
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'RESUMEN DE LIMPIEZA';
    RAISE NOTICE '============================================';

    FOR rec IN
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename NOT IN (
            't_config', 't_roles', 't_permissions', 't_roles_permissions',
            't_internship_type', 't_career', 't_career_internship_type',
            't_internships_period', 't_list', 't_value_list',
            't_landing_config', 't_preset_questions', 't_request_types',
            't_evaluation_criteria', 't_operation', 't_tables', 't_columns',
            't_user', 't_user_key', 't_user_roles', 't_user_theme',
            't_user_questions'
          )
        ORDER BY tablename
    LOOP
        EXECUTE format('SELECT count(*) FROM %I', rec.tablename) INTO total;
        IF total > 0 THEN
            RAISE WARNING '⚠  % — % fila(s) restante(s)', rec.tablename, total;
        END IF;
    END LOOP;

    RAISE NOTICE '============================================';
    RAISE NOTICE 'Limpieza completada. Solo persisten datos de sistema.';
END $$;

COMMIT;
