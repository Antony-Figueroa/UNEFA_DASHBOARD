-- ================================================================================
-- UNEFA Dashboard — Seed VACÍA (solo datos de sistema)
-- ================================================================================
-- Schema completo: Tablas + Funciones + FK + Índices + RLS + Triggers
-- Datos de sistema: roles, permisos, carreras, config, estados/municipios/parroquias, listas
-- SIN datos transaccionales: estudiantes, tutores, instituciones, evaluaciones, usuarios
-- Compatible con: PGlite offline y Supabase cloud/local
-- ================================================================================
-- Tablas: 76 | Con datos de sistema: 25
-- Sequences: 68 | Índices: 107 | FK: 102 | Funciones: 17
-- Total registros: ~2087 (solo sistema)
-- Total registros: ~1800 (solo sistema, sin setval)

-- Extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA public SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA public;

-- ============================================================
-- SECCIÓN 1: SEQUENCES
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS "t_activity_logs_ACTIVITY_LOG_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_address_address_id_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_auth_log_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_career_CAREER_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_career_internship_type_ID_CAREER_INTERNSHIP_TYPE_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_change_log_CHANGE_LOG_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_columns_COLUMN_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_committee_assignment_ASSIGNMENT_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_config_CONFIG_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_coordinadores_COORDINADOR_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_credential_tokens_id_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_culmination_reversals_REVERSAL_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_email_templates_id_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_enrollment_field_changes_CHANGE_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_evaluation_EVALUATION_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_evaluation_criteria_CRITERIA_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_evaluation_detail_DETAIL_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_institution_INSTITUTION_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_institution_address_institution_address_id_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_institution_career_INSTITUTION_CAREER_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_institution_internship_type_INSTITUTION_INTERNSHIP_TYPE_ID_se" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_institution_manager_MANAGER_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_institution_manager_institution_INSTITUTION_MANAGER_INSTITUTI" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_internship_type_INTERNSHIP_TYPE_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_internships_period_PERIOD_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_key_history_KEY_HISTORY_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_landing_config_config_id_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_list_LIST_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_municipio_municipio_id_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_notifications_NOTIFICATION_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_nucleus_career_nucleus_career_id_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_operation_OPERATION_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_parroquia_parroquia_id_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_password_history_HISTORY_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_permissions_PERMISSIONS_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_person_address_person_address_id_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_person_merge_log_log_id_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_persons_person_id_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_practice_visits_VISIT_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_preset_questions_PRESET_QUESTION_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_professional_practices_PROFESSIONAL_PRACTICE_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_professional_practices_tuto_PROFESSIONAL_PRACTICES_TUTOR__seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_prospect_list_items_ITEM_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_prospect_lists_LIST_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_recovery_tokens_TOKEN_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_report_text_templates_TEMPLATE_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_request_types_REQUEST_TYPE_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_roles_ID_ROLS_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_security_questions_SECURITY_QUESTIONS_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_session_SESSION_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_session_attempts_ATTEMPT_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_session_history_SESSION_HISTORY_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_student_documents_DOCUMENT_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_student_requests_REQUEST_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_students_STUDENTS_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_system_institution_system_institution_id_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_system_nucleus_nucleus_id_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_tables_TABLE_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_tutor_career_TUTOR_CAREER_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_tutors_TUTOR_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_user_USER_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_user_key_USER_KEY_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_user_notification_prefs_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_user_questions_USER_QUESTION_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_user_theme_USER_THEME_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_value_list_VALUE_LIST_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_visit_VISIT_ID_seq" START WITH 1;

CREATE SEQUENCE IF NOT EXISTS "t_list_list_id_seq" START WITH 1;

-- ============================================================
-- SECCIÓN 2: FUNCIONES (RPCs)
-- ============================================================

CREATE OR REPLACE FUNCTION public.execute_sql(sql text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    EXECUTE sql;
END;
$function$;


CREATE OR REPLACE FUNCTION public.get_all_constraints()
 RETURNS TABLE(table_name text, constraint_name text, constraint_type text, definition text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    c.conrelid::regclass::text AS table_name,
    c.conname::text AS constraint_name,
    CASE c.contype
      WHEN 'f' THEN 'FOREIGN KEY'
      WHEN 'u' THEN 'UNIQUE'
      WHEN 'c' THEN 'CHECK'
      ELSE 'OTHER'
    END::text AS constraint_type,
    pg_get_constraintdef(c.oid)::text AS definition
  FROM pg_constraint c
  JOIN pg_namespace n ON n.oid = c.connamespace
  WHERE n.nspname = 'public'
    AND c.contype IN ('f', 'u', 'c')
    AND c.conname NOT LIKE '%_pkey%'  -- PKs already in CREATE TABLE
  ORDER BY
    CASE c.contype
      WHEN 'u' THEN 1
      WHEN 'f' THEN 2
      ELSE 3
    END,
    c.conrelid::regclass::text;
END;
$function$;


CREATE OR REPLACE FUNCTION public.get_all_functions()
 RETURNS TABLE(function_name text, definition text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    (p.proname::text || '(' || pg_get_function_arguments(p.oid) || ')')::text AS function_name,
    pg_get_functiondef(p.oid)::text AS definition
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prokind = 'f'  -- only normal functions, not aggregates
    AND p.proname NOT LIKE 'pgrst_%'  -- exclude Supabase internal
    AND NOT EXISTS (     -- exclude extension-owned functions
      SELECT 1 FROM pg_depend d
      WHERE d.objid = p.oid
        AND d.classid = 'pg_proc'::regclass
        AND d.deptype = 'e'
        AND d.refclassid = 'pg_extension'::regclass
    )
  ORDER BY p.proname;
END;
$function$;


CREATE OR REPLACE FUNCTION public.get_all_indexes()
 RETURNS TABLE(index_name text, table_name text, index_def text, is_unique boolean, is_primary boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    i.indexname::text,
    i.tablename::text,
    i.indexdef::text,
    i.indexdef LIKE 'CREATE UNIQUE%' AS is_unique,
    i.indexdef LIKE 'CREATE UNIQUE INDEX%' AND i.indexdef LIKE '%pkey%' AS is_primary
  FROM pg_indexes i
  WHERE i.schemaname = 'public'
    AND i.tablename NOT IN ('_prisma_migrations')
    AND i.indexdef NOT LIKE '%_pkey%'  -- PKs already in CREATE TABLE
  ORDER BY i.tablename, i.indexname;
END;
$function$;


CREATE OR REPLACE FUNCTION public.get_all_sequences()
 RETURNS TABLE(seq_name text, table_name text, column_name text, current_value bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  WITH seqs AS (
    SELECT
      c.relname::text AS seq_name,
      COALESCE(
        (SELECT refn.nspname || '.' || refc.relname
         FROM pg_depend d
         JOIN pg_class refc ON refc.oid = d.refobjid
         JOIN pg_namespace refn ON refn.oid = refc.relnamespace
         WHERE d.objid = c.oid
           AND d.deptype = 'a'
           AND d.classid = 'pg_class'::regclass
           AND d.refclassid = 'pg_class'::regclass
           AND refc.relkind = 'r'),
        'public.unknown'
      )::text AS table_ref,
      COALESCE(
        (SELECT a.attname::text
         FROM pg_depend d
         JOIN pg_attribute a ON a.attrelid = d.refobjid AND a.attnum = d.refobjsubid
         WHERE d.objid = c.oid
           AND d.deptype = 'a'
           AND d.classid = 'pg_class'::regclass
           AND d.refclassid = 'pg_class'::regclass
           AND a.attnum > 0),
        'unknown'
      )::text AS col_name,
      pg_sequence_last_value(c.oid)::bigint AS cur_val
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'S' AND n.nspname = 'public'
  )
  SELECT
    seqs.seq_name,
    split_part(seqs.table_ref, '.', 2)::text AS table_name,
    seqs.col_name,
    COALESCE(seqs.cur_val, 0)::bigint
  FROM seqs
  ORDER BY seqs.table_ref, seqs.col_name;
END;
$function$;


CREATE OR REPLACE FUNCTION public.get_all_table_definitions()
 RETURNS TABLE(table_name text, definition text, has_data boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  rec RECORD;
  col_rec RECORD;
  pk_cols text[];
  def text;
  has_rows boolean;
BEGIN
  FOR rec IN
    SELECT tablename::text AS tname
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  LOOP
    def := 'CREATE TABLE IF NOT EXISTS public.' || quote_ident(rec.tname) || ' (' || E'\n';

    FOR col_rec IN
      SELECT
        c.column_name,
        c.is_nullable,
        c.column_default,
        c.udt_name,
        c.character_maximum_length,
        c.numeric_precision,
        c.numeric_scale
      FROM information_schema.columns c
      WHERE c.table_schema = 'public' AND c.table_name = rec.tname
      ORDER BY c.ordinal_position
    LOOP
      def := def || '  ' || quote_ident(col_rec.column_name) || ' ';
      CASE col_rec.udt_name
        WHEN 'int4' THEN def := def || 'INTEGER';
        WHEN 'int8' THEN def := def || 'BIGINT';
        WHEN 'int2' THEN def := def || 'SMALLINT';
        WHEN 'varchar' THEN
          IF col_rec.character_maximum_length IS NOT NULL THEN
            def := def || 'VARCHAR(' || col_rec.character_maximum_length || ')';
          ELSE
            def := def || 'VARCHAR';
          END IF;
        WHEN 'text' THEN def := def || 'TEXT';
        WHEN 'bool' THEN def := def || 'BOOLEAN';
        WHEN 'float4' THEN def := def || 'REAL';
        WHEN 'float8' THEN def := def || 'DOUBLE PRECISION';
        WHEN 'numeric' THEN
          IF col_rec.numeric_precision IS NOT NULL AND col_rec.numeric_scale IS NOT NULL THEN
            def := def || 'NUMERIC(' || col_rec.numeric_precision || ', ' || col_rec.numeric_scale || ')';
          ELSE
            def := def || 'NUMERIC';
          END IF;
        WHEN 'timestamp' THEN def := def || 'TIMESTAMP';
        WHEN 'timestamptz' THEN def := def || 'TIMESTAMPTZ';
        WHEN 'date' THEN def := def || 'DATE';
        WHEN 'time' THEN def := def || 'TIME';
        WHEN 'uuid' THEN def := def || 'UUID';
        WHEN 'json' THEN def := def || 'JSON';
        WHEN 'jsonb' THEN def := def || 'JSONB';
        ELSE def := def || col_rec.udt_name;
      END CASE;

      IF col_rec.column_default IS NOT NULL THEN
        def := def || ' DEFAULT ' || col_rec.column_default;
      END IF;
      IF col_rec.is_nullable = 'NO' THEN
        def := def || ' NOT NULL';
      END IF;
      def := def || ',' || E'\n';
    END LOOP;

    SELECT array_agg(kcu.column_name::text) INTO pk_cols
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_schema = 'public'
      AND tc.table_name = rec.tname
      AND tc.constraint_type = 'PRIMARY KEY';

    IF pk_cols IS NOT NULL AND array_length(pk_cols, 1) > 0 THEN
      def := def || '  PRIMARY KEY (' || (SELECT string_agg(quote_ident(p), ', ') FROM unnest(pk_cols) p) || '),' || E'\n';
    END IF;

    -- Remove trailing comma
    IF def LIKE '%,' || E'\n' THEN
      def := left(def, length(def) - 2) || E'\n';
    END IF;
    def := def || ');';

    EXECUTE format('SELECT EXISTS (SELECT 1 FROM %I LIMIT 1)', rec.tname) INTO has_rows;
    RETURN QUERY SELECT rec.tname::text, def::text, has_rows::boolean;
  END LOOP;
END;
$function$;


CREATE OR REPLACE FUNCTION public.get_all_tables()
 RETURNS TABLE(table_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT tablename::text
  FROM pg_catalog.pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename;
END;
$function$;


CREATE OR REPLACE FUNCTION public.get_all_triggers()
 RETURNS TABLE(table_name text, trigger_name text, definition text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    tg.tgrelid::regclass::text AS table_name,
    tg.tgname::text AS trigger_name,
    pg_get_triggerdef(tg.oid, true)::text AS definition
  FROM pg_trigger tg
  WHERE tg.tgrelid IN (
    SELECT c.oid FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
  )
  AND NOT tg.tgisinternal  -- exclude internal triggers (FK enforcement etc.)
  ORDER BY tg.tgrelid::regclass::text, tg.tgname;
END;
$function$;


CREATE OR REPLACE FUNCTION public.get_coincidence_stats()
 RETURNS TABLE(level text, count bigint, percentage numeric)
 LANGUAGE plpgsql
AS $function$
DECLARE
  total_enrollments BIGINT;
BEGIN
  SELECT COUNT(*) INTO total_enrollments
  FROM t_professional_practices pp
  WHERE pp."INTERNSHIP_STATUS" IS NOT NULL
    AND pp."STATUS" = 1;

  IF total_enrollments = 0 THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH enrollment_addresses AS (
    SELECT
      pp."PROFESSIONAL_PRACTICE_ID" AS practice_id,
      s.person_id AS student_person_id,
      pp."INSTITUTION_ID" AS institution_id
    FROM t_professional_practices pp
    JOIN t_students s ON s."STUDENTS_ID" = pp."STUDENTS_ID"
    WHERE pp."INTERNSHIP_STATUS" IS NOT NULL
      AND pp."STATUS" = 1
  ),
  student_primary AS (
    SELECT ea.practice_id, p.parroquia_id, p.municipio_id, m.estado_id
    FROM enrollment_addresses ea
    JOIN t_person_address pa ON pa.person_id = ea.student_person_id AND pa.is_primary = TRUE
    JOIN t_address a ON a.address_id = pa.address_id
    JOIN t_parroquia p ON p.parroquia_id = a.parroquia_id
    JOIN t_municipio m ON m.municipio_id = p.municipio_id
  ),
  institution_primary AS (
    SELECT ea.practice_id, p.parroquia_id, p.municipio_id, m.estado_id
    FROM enrollment_addresses ea
    JOIN t_institution_address ia ON ia.institution_id = ea.institution_id AND ia.is_primary = TRUE
    JOIN t_address a ON a.address_id = ia.address_id
    JOIN t_parroquia p ON p.parroquia_id = a.parroquia_id
    JOIN t_municipio m ON m.municipio_id = p.municipio_id
  ),
  level_counts AS (
    SELECT
      CASE
        WHEN sp.parroquia_id = ip.parroquia_id THEN 'SAME_PARROQUIA'
        WHEN sp.municipio_id = ip.municipio_id THEN 'SAME_MUNICIPIO'
        WHEN sp.estado_id = ip.estado_id THEN 'SAME_STATE'
        ELSE 'DIFFERENT_STATE'
      END AS match_level
    FROM student_primary sp
    JOIN institution_primary ip ON ip.practice_id = sp.practice_id
  )
  SELECT
    lc.match_level AS level,
    COUNT(*)::BIGINT AS count,
    ROUND((COUNT(*)::NUMERIC / total_enrollments) * 100, 1) AS percentage
  FROM level_counts lc
  GROUP BY lc.match_level
  ORDER BY
    CASE lc.match_level
      WHEN 'SAME_PARROQUIA' THEN 1
      WHEN 'SAME_MUNICIPIO' THEN 2
      WHEN 'SAME_STATE' THEN 3
      WHEN 'DIFFERENT_STATE' THEN 4
    END;
END;
$function$;


CREATE OR REPLACE FUNCTION public.get_institution_suggestions(p_person_id integer, p_career_id integer, p_internship_type_id integer DEFAULT NULL::integer)
 RETURNS TABLE(institution_id integer, institution_name character varying, institution_address text, estado character varying, municipio character varying, proximity_score integer)
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_student_parroquia_id INT;
  v_student_municipio_id BIGINT;
  v_student_estado_id INT;
BEGIN
  SELECT p.parroquia_id, p.municipio_id, m.estado_id
  INTO v_student_parroquia_id, v_student_municipio_id, v_student_estado_id
  FROM t_person_address pa
  JOIN t_address a ON a.address_id = pa.address_id
  JOIN t_parroquia p ON p.parroquia_id = a.parroquia_id
  JOIN t_municipio m ON m.municipio_id = p.municipio_id
  WHERE pa.person_id = p_person_id
    AND pa.is_primary = TRUE
  LIMIT 1;

  IF v_student_parroquia_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    i."INSTITUTION_ID"::INT,
    i."INSTITUTION_NAME"::VARCHAR(255),
    i."INSTITUTION_ADDRESS"::TEXT,
    e.name::VARCHAR(100),
    m.name::VARCHAR(100),
    CASE
      WHEN p.parroquia_id = v_student_parroquia_id THEN 10
      WHEN p.municipio_id = v_student_municipio_id THEN 5
      WHEN m.estado_id = v_student_estado_id THEN 3
      ELSE 0
    END::INT AS proximity_score
  FROM t_institution i
  JOIN t_institution_career ic ON ic."INSTITUTION_ID" = i."INSTITUTION_ID"
  JOIN t_institution_address ia ON ia.institution_id = i."INSTITUTION_ID" AND ia.is_primary = TRUE
  JOIN t_address a ON a.address_id = ia.address_id
  JOIN t_parroquia p ON p.parroquia_id = a.parroquia_id
  JOIN t_municipio m ON m.municipio_id = p.municipio_id
  JOIN t_estado e ON e.estado_id = m.estado_id
  WHERE ic."CAREER_ID" = p_career_id
    AND i."STATUS" = 1
    AND (p_internship_type_id IS NULL
      OR i."PRACTICE_TYPE" = p_internship_type_id::TEXT
      OR EXISTS (
        SELECT 1 FROM t_institution_internship_type iit
        WHERE iit."INSTITUTION_ID" = i."INSTITUTION_ID"
          AND iit."INTERNSHIP_TYPE_ID" = p_internship_type_id
      ))
  ORDER BY proximity_score DESC, i."INSTITUTION_NAME";
END;
$function$;


CREATE OR REPLACE FUNCTION public.get_primary_address(p_entity_type text, p_entity_id integer)
 RETURNS TABLE(address_id bigint, street_address character varying, reference text, parroquia_id bigint, parroquia_name character varying, municipio_id bigint, municipio_name character varying, estado_id integer, estado_name character varying)
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF p_entity_type = 'person' THEN
    RETURN QUERY
    SELECT
      a.address_id,
      a.street_address,
      a.reference,
      p.parroquia_id,
      p.name::VARCHAR(200),
      m.municipio_id,
      m.name::VARCHAR(100),
      e.estado_id,
      e.name::VARCHAR(100)
    FROM t_person_address pa
    JOIN t_address a ON a.address_id = pa.address_id
    JOIN t_parroquia p ON p.parroquia_id = a.parroquia_id
    JOIN t_municipio m ON m.municipio_id = p.municipio_id
    JOIN t_estado e ON e.estado_id = m.estado_id
    WHERE pa.person_id = p_entity_id
      AND pa.is_primary = TRUE
    LIMIT 1;
  ELSIF p_entity_type = 'institution' THEN
    RETURN QUERY
    SELECT
      a.address_id,
      a.street_address,
      a.reference,
      p.parroquia_id,
      p.name::VARCHAR(200),
      m.municipio_id,
      m.name::VARCHAR(100),
      e.estado_id,
      e.name::VARCHAR(100)
    FROM t_institution_address ia
    JOIN t_address a ON a.address_id = ia.address_id
    JOIN t_parroquia p ON p.parroquia_id = a.parroquia_id
    JOIN t_municipio m ON m.municipio_id = p.municipio_id
    JOIN t_estado e ON e.estado_id = m.estado_id
    WHERE ia.institution_id = p_entity_id
      AND ia.is_primary = TRUE
    LIMIT 1;
  END IF;
END;
$function$;


CREATE OR REPLACE FUNCTION public.get_rls_policies()
 RETURNS TABLE(table_name text, definition text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  WITH policy_sql AS (
    SELECT
      n.nspname::text || '.' || c.relname::text AS full_table,
      c.relname::text AS tname,
      p.polname::text AS polname,
      CASE
        WHEN p.polpermissive THEN 'PERMISSIVE'
        ELSE 'RESTRICTIVE'
      END AS permissive,
      CASE p.polcmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
        ELSE 'ALL'
      END AS cmd,
      COALESCE(
        (SELECT string_agg(rolname, ', ') FROM pg_catalog.pg_roles WHERE oid = ANY(p.polroles)),
        'public'
      ) AS roles,
      pg_get_expr(p.polqual, p.polrelid) AS using_expr,
      COALESCE(pg_get_expr(p.polwithcheck, p.polrelid), '') AS withcheck_expr
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
  )
  SELECT
    ps.tname::text AS table_name,
    format(
      'CREATE POLICY %s ON %s AS %s FOR %s TO %s%s%s;',
      quote_ident(ps.polname),
      quote_ident(ps.tname),
      ps.permissive,
      ps.cmd,
      ps.roles,
      CASE WHEN ps.using_expr != '' THEN ' USING (' || ps.using_expr || ')' ELSE '' END,
      CASE WHEN ps.withcheck_expr != '' THEN ' WITH CHECK (' || ps.withcheck_expr || ')' ELSE '' END
    )::text AS definition
  FROM policy_sql ps
  ORDER BY ps.tname, ps.polname;
END;
$function$;


CREATE OR REPLACE FUNCTION public.get_table_definition(table_name_param text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    definition text := '';
    col_record record;
    constraint_record record;
    first_col boolean := true;
BEGIN
    definition := 'CREATE TABLE IF NOT EXISTS "' || table_name_param || '" (' || E'\n';
    
    FOR col_record IN 
        SELECT column_name, data_type, character_maximum_length,
               numeric_precision, numeric_scale, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = table_name_param
        ORDER BY ordinal_position
    LOOP
        IF NOT first_col THEN definition := definition || ',' || E'\n'; END IF;
        first_col := false;
        definition := definition || '  "' || col_record.column_name || '" ';
        IF col_record.character_maximum_length IS NOT NULL THEN
            definition := definition || col_record.data_type || '(' || col_record.character_maximum_length || ')';
        ELSIF col_record.numeric_precision IS NOT NULL THEN
            definition := definition || col_record.data_type || '(' || col_record.numeric_precision || ')';
        ELSE
            definition := definition || col_record.data_type;
        END IF;
        IF col_record.is_nullable = 'NO' THEN definition := definition || ' NOT NULL'; END IF;
        IF col_record.column_default IS NOT NULL THEN
            definition := definition || ' DEFAULT ' || col_record.column_default;
        END IF;
    END LOOP;
    definition := definition || E'\n' || ');';
    RETURN definition;
END;
$function$;


CREATE OR REPLACE FUNCTION public.search_knowledge_base(query_embedding vector, match_threshold double precision DEFAULT 0.7, match_limit integer DEFAULT 5, filter_category text DEFAULT NULL::text, filter_roles integer[] DEFAULT NULL::integer[])
 RETURNS TABLE(id uuid, title text, category text, content text, metadata jsonb, similarity double precision)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        kb.id,
        kb.title,
        kb.category,
        kb.content,
        kb.metadata,
        1 - (kb.embedding <=> query_embedding) AS similarity
    FROM t_knowledge_base kb
    WHERE kb.is_active = true
      AND (filter_category IS NULL OR kb.category = filter_category)
      AND (filter_roles IS NULL OR kb.roles IS NULL OR kb.roles && filter_roles)
      AND 1 - (kb.embedding <=> query_embedding) >= match_threshold
    ORDER BY kb.embedding <=> query_embedding
    LIMIT match_limit;
END;
$function$;


CREATE OR REPLACE FUNCTION public.trg_set_student_person_id()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.student_person_id IS NULL AND NEW."STUDENTS_ID" IS NOT NULL THEN
    SELECT person_id INTO NEW.student_person_id
    FROM "t_students"
    WHERE "STUDENTS_ID" = NEW."STUDENTS_ID";
  END IF;
  RETURN NEW;
END;
$function$;


CREATE OR REPLACE FUNCTION public.trg_set_tutor_person_id()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.tutor_person_id IS NULL AND NEW."TUTOR_ID" IS NOT NULL THEN
    SELECT person_id INTO NEW.tutor_person_id
    FROM "t_tutors"
    WHERE "TUTOR_ID" = NEW."TUTOR_ID";
  END IF;
  RETURN NEW;
END;
$function$;


CREATE OR REPLACE FUNCTION public.update_kb_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;


-- ============================================================
-- SECCIÓN 3: ESTRUCTURA DE TABLAS (CREATE TABLE)
-- ============================================================

-- Tabla: t_academic_config
CREATE TABLE IF NOT EXISTS public.t_academic_config (
  "CONFIG_ID" SMALLINT DEFAULT 1 NOT NULL,
  "DEFAULT_ENROLLMENT_GRACE_DAYS" SMALLINT DEFAULT 21 NOT NULL,
  "DEFAULT_EVALUATION_GRACE_DAYS" SMALLINT DEFAULT 10 NOT NULL,
  "UPDATED_AT" TIMESTAMP DEFAULT now() NOT NULL,
  "UPDATED_BY" INTEGER,
  allow_multiple_visits_per_day BOOLEAN DEFAULT true,
  max_visits_per_day INTEGER,
  "ALLOW_MULTIPLE_VISITS_PER_DAY" BOOLEAN DEFAULT true,
  "MAX_VISITS_PER_DAY" INTEGER,
  "LOCK_API_LOADED_FIELDS" BOOLEAN DEFAULT true NOT NULL,
  PRIMARY KEY ("CONFIG_ID")
);

-- Tabla: t_activity_logs
CREATE TABLE IF NOT EXISTS public.t_activity_logs (
  "ACTIVITY_LOG_ID" INTEGER DEFAULT nextval('"t_activity_logs_ACTIVITY_LOG_ID_seq"'::regclass) NOT NULL,
  "PROFESSIONAL_PRACTICE_ID" INTEGER NOT NULL,
  "STUDENT_ID" INTEGER NOT NULL,
  "ACTIVITY_DATE" DATE NOT NULL,
  "WEEK_NUMBER" INTEGER,
  "HOURS_WORKED" NUMERIC(5, 2) DEFAULT 0 NOT NULL,
  "ACTIVITY_TYPE" VARCHAR(50) DEFAULT 'DIARIA'::character varying NOT NULL,
  "ACTIVITY_DESCRIPTION" TEXT NOT NULL,
  "TASKS_COMPLETED" TEXT,
  "CHALLENGES" TEXT,
  "LEARNINGS" TEXT,
  "SUPERVISOR_COMMENTS" TEXT,
  "SUPERVISOR_APPROVED" BOOLEAN DEFAULT false,
  "SUPERVISOR_ID" INTEGER,
  "APPROVED_AT" TIMESTAMP,
  "STATUS" SMALLINT DEFAULT 1 NOT NULL,
  "CREATED_AT" TIMESTAMP DEFAULT now() NOT NULL,
  "UPDATED_AT" TIMESTAMP DEFAULT now() NOT NULL,
  "CREATED_BY" INTEGER,
  student_person_id INTEGER NOT NULL,
  PRIMARY KEY ("ACTIVITY_LOG_ID")
);

-- Tabla: t_address
CREATE TABLE IF NOT EXISTS public.t_address (
  address_id BIGINT DEFAULT nextval('t_address_address_id_seq'::regclass) NOT NULL,
  parroquia_id BIGINT,
  street_address VARCHAR(300) NOT NULL,
  reference TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  uuid UUID DEFAULT gen_random_uuid() NOT NULL,
  full_address VARCHAR(500),
  updated_at TIMESTAMPTZ DEFAULT now(),
  version INTEGER DEFAULT 1,
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (address_id)
);

-- Tabla: t_address_type
CREATE TABLE IF NOT EXISTS public.t_address_type (
  address_type_id BIGINT NOT NULL,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  status SMALLINT DEFAULT 1 NOT NULL,
  PRIMARY KEY (address_type_id)
);

-- Tabla: t_auth_log
CREATE TABLE IF NOT EXISTS public.t_auth_log (
  "ID" INTEGER DEFAULT nextval('"t_auth_log_ID_seq"'::regclass) NOT NULL,
  "USER_ID" INTEGER,
  "USER_CI" VARCHAR(20),
  "ACTION" VARCHAR(50) NOT NULL,
  "IP_ADDRESS" VARCHAR(45),
  "USER_AGENT" TEXT,
  "DETAILS" TEXT,
  "CREATED_AT" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("ID")
);

-- Tabla: t_career
CREATE TABLE IF NOT EXISTS public.t_career (
  "CAREER_ID" INTEGER DEFAULT nextval('"t_career_CAREER_ID_seq"'::regclass) NOT NULL,
  "CAREER_NAME" VARCHAR(255) NOT NULL,
  "CAREER_CODE" VARCHAR(255) NOT NULL,
  "MINIMUM_GRADE" NUMERIC(10, 2) NOT NULL,
  "CAREER_ABBREVIATION" VARCHAR(255) NOT NULL,
  "CREATION_DATE" TIMESTAMP NOT NULL,
  "MODIF_USER_ID" INTEGER NOT NULL,
  "MODIF_USER_DATE" TIMESTAMP NOT NULL,
  "ELIM_USER_ID" INTEGER NOT NULL,
  "ELIM_USER_DATE" TIMESTAMP NOT NULL,
  "REST_USER_ID" INTEGER NOT NULL,
  "REST_USER_DATE" TIMESTAMP NOT NULL,
  "STATUS" SMALLINT NOT NULL,
  "CAREER_TYPE" VARCHAR(10) DEFAULT 'LARGA'::character varying NOT NULL,
  "SEMESTER" VARCHAR(10),
  PRIMARY KEY ("CAREER_ID")
);

-- Tabla: t_career_internship_type
CREATE TABLE IF NOT EXISTS public.t_career_internship_type (
  "ID_CAREER_INTERNSHIP_TYPE_ID" INTEGER DEFAULT nextval('"t_career_internship_type_ID_CAREER_INTERNSHIP_TYPE_ID_seq"'::regclass) NOT NULL,
  "CAREER_ID" INTEGER NOT NULL,
  "INTERNSHIP_TYPE_ID" INTEGER NOT NULL,
  PRIMARY KEY ("ID_CAREER_INTERNSHIP_TYPE_ID")
);

-- Tabla: t_change_log
CREATE TABLE IF NOT EXISTS public.t_change_log (
  "CHANGE_LOG_ID" INTEGER DEFAULT nextval('"t_change_log_CHANGE_LOG_ID_seq"'::regclass) NOT NULL,
  "DATE_TIME" TIMESTAMP NOT NULL,
  "TABLE_ID" INTEGER NOT NULL,
  "COLUMN_ID" INTEGER NOT NULL,
  "OPERATION_ID" INTEGER NOT NULL,
  "USER_ID" INTEGER NOT NULL,
  "NEW_VALUE" VARCHAR(45) NOT NULL,
  "OLD_VALUE" VARCHAR(45) NOT NULL,
  "IP_ADDRESS" VARCHAR(45) NOT NULL,
  "FORM_ID" INTEGER NOT NULL,
  "PRINT_EMAIL" VARCHAR(60) NOT NULL,
  "STATUS" SMALLINT NOT NULL,
  PRIMARY KEY ("CHANGE_LOG_ID", "TABLE_ID", "COLUMN_ID", "OPERATION_ID", "USER_ID")
);

-- Tabla: t_chat_config
CREATE TABLE IF NOT EXISTS public.t_chat_config (
  config_id UUID DEFAULT gen_random_uuid() NOT NULL,
  user_id INTEGER NOT NULL,
  persona VARCHAR(20) DEFAULT 'formal'::character varying,
  quick_actions JSONB DEFAULT '[]'::jsonb,
  show_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (config_id)
);

-- Tabla: t_chat_sessions
CREATE TABLE IF NOT EXISTS public.t_chat_sessions (
  "SESSION_ID" UUID DEFAULT gen_random_uuid() NOT NULL,
  "USER_ID" INTEGER NOT NULL,
  "TITLE" VARCHAR(100) DEFAULT 'Nueva conversación'::character varying NOT NULL,
  "MESSAGES" JSONB DEFAULT '[]'::jsonb NOT NULL,
  "CREATED_AT" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "UPDATED_AT" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "STATUS" SMALLINT DEFAULT 1 NOT NULL,
  PRIMARY KEY ("SESSION_ID")
);

-- Tabla: t_columns
CREATE TABLE IF NOT EXISTS public.t_columns (
  "COLUMN_ID" INTEGER DEFAULT nextval('"t_columns_COLUMN_ID_seq"'::regclass) NOT NULL,
  "TABLE_ID" INTEGER NOT NULL,
  "COLUMN_NAME" VARCHAR(25) NOT NULL,
  "STATUS" SMALLINT NOT NULL,
  PRIMARY KEY ("COLUMN_ID")
);

-- Tabla: t_committee_assignment
CREATE TABLE IF NOT EXISTS public.t_committee_assignment (
  "ASSIGNMENT_ID" INTEGER DEFAULT nextval('"t_committee_assignment_ASSIGNMENT_ID_seq"'::regclass) NOT NULL,
  "PROFESSIONAL_PRACTICE_ID" INTEGER NOT NULL,
  "COMITE_MEMBER_INDEX" INTEGER NOT NULL,
  "EVALUATOR_NAME" TEXT NOT NULL,
  "EVALUATOR_CI" TEXT,
  "REGISTERED_BY" INTEGER,
  "CREATED_AT" TIMESTAMPTZ DEFAULT now(),
  "UPDATED_AT" TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY ("ASSIGNMENT_ID")
);

-- Tabla: t_config
CREATE TABLE IF NOT EXISTS public.t_config (
  "CONFIG_ID" INTEGER DEFAULT nextval('"t_config_CONFIG_ID_seq"'::regclass) NOT NULL,
  "RECOVERY_EMAIL" SMALLINT NOT NULL,
  "BLOCKING_DAYS" SMALLINT NOT NULL,
  "WRONG_KEY_LOCK" SMALLINT NOT NULL,
  "ATTEMPTS_KEY_BLOCK" SMALLINT NOT NULL,
  "KEY_EXPIRATION" INTEGER NOT NULL,
  "EXPIRATION_DAYS" SMALLINT NOT NULL,
  "USER_UPPERCASE" SMALLINT NOT NULL,
  "USER_LOWERCASE" SMALLINT NOT NULL,
  "USER_NUMBERS" SMALLINT NOT NULL,
  "USER_SPECIAL_CHARACTERS" SMALLINT NOT NULL,
  "USER_NUM_UPPERCASE" INTEGER NOT NULL,
  "USER_NUM_LOWERCASE" INTEGER NOT NULL,
  "USER_NUM_NUMBERS" INTEGER NOT NULL,
  "USER_NUM_SPECIAL_CHARACTERS" INTEGER NOT NULL,
  "KEY_UPPERCASE" SMALLINT NOT NULL,
  "KEY_LOWERCASE" SMALLINT NOT NULL,
  "KEY_NUMBERS" SMALLINT NOT NULL,
  "KEY_SPECIAL_CHARACTERS" SMALLINT NOT NULL,
  "KEY_NUM_UPPERCASE" INTEGER NOT NULL,
  "KEY_NUM_LOWERCASE" INTEGER NOT NULL,
  "KEY_NUM_NUMBERS" INTEGER NOT NULL,
  "KEY_NUM_SPECIAL_CHARACTERS" INTEGER NOT NULL,
  "USER_LENGTH" INTEGER NOT NULL,
  "KEY_LEGTH" INTEGER NOT NULL,
  "SECURITY_QUESTIONS" SMALLINT NOT NULL,
  "TOTAL_QUESTIONS" INTEGER NOT NULL,
  "TOTAL_PRESET_QUESTIONS" INTEGER NOT NULL,
  "TOTAL_USER_QUESTIONS" INTEGER NOT NULL,
  "TOTAL_ANSWERS" INTEGER NOT NULL,
  "PERIOD_VALIDATION_RULES" JSONB,
  "EVALUATION_CONFIG" JSONB,
  "SESSION_MAX_HOURS" INTEGER DEFAULT 24 NOT NULL,
  "RECOVERY_LINK_EXPIRY_HOURS" INTEGER DEFAULT 48 NOT NULL,
  PRIMARY KEY ("CONFIG_ID")
);

-- Tabla: t_coordinadores
CREATE TABLE IF NOT EXISTS public.t_coordinadores (
  "COORDINADOR_ID" INTEGER DEFAULT nextval('"t_coordinadores_COORDINADOR_ID_seq"'::regclass) NOT NULL,
  "TIPO" VARCHAR(20) NOT NULL,
  "CAREER_ID" INTEGER,
  "NAME" VARCHAR(255) NOT NULL,
  "SECOND_NAME" VARCHAR(255) DEFAULT NULL::character varying,
  "SURNAME" VARCHAR(255) NOT NULL,
  "SECOND_SURNAME" VARCHAR(255) DEFAULT NULL::character varying,
  "CI" VARCHAR(20) NOT NULL,
  "CARGO" VARCHAR(255),
  "CREATION_DATE" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "STATUS" SMALLINT DEFAULT 1,
  PRIMARY KEY ("COORDINADOR_ID")
);

-- Tabla: t_credential_tokens
CREATE TABLE IF NOT EXISTS public.t_credential_tokens (
  id INTEGER DEFAULT nextval('t_credential_tokens_id_seq'::regclass) NOT NULL,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL,
  temp_password TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: t_culmination_reversals
CREATE TABLE IF NOT EXISTS public.t_culmination_reversals (
  "REVERSAL_ID" INTEGER DEFAULT nextval('"t_culmination_reversals_REVERSAL_ID_seq"'::regclass) NOT NULL,
  "PRACTICE_ID" INTEGER NOT NULL,
  "REASON" TEXT NOT NULL,
  "RESOLUTION_NUMBER" VARCHAR(100) NOT NULL,
  "REVERSED_BY" INTEGER NOT NULL,
  "CREATED_AT" TIMESTAMP DEFAULT now(),
  "UPDATED_AT" TIMESTAMP DEFAULT now(),
  PRIMARY KEY ("REVERSAL_ID")
);

-- Tabla: t_email_templates
CREATE TABLE IF NOT EXISTS public.t_email_templates (
  id INTEGER DEFAULT nextval('t_email_templates_id_seq'::regclass) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'general'::character varying NOT NULL,
  subject VARCHAR(500) NOT NULL,
  body_html TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: t_enrollment_field_changes
CREATE TABLE IF NOT EXISTS public.t_enrollment_field_changes (
  "CHANGE_ID" INTEGER DEFAULT nextval('"t_enrollment_field_changes_CHANGE_ID_seq"'::regclass) NOT NULL,
  "PROFESSIONAL_PRACTICE_ID" INTEGER NOT NULL,
  "FIELD_NAME" VARCHAR(100) NOT NULL,
  "OLD_VALUE" TEXT,
  "NEW_VALUE" TEXT,
  "CHANGED_BY" INTEGER,
  "CHANGED_AT" TIMESTAMP DEFAULT now(),
  PRIMARY KEY ("CHANGE_ID")
);

-- Tabla: t_estado
CREATE TABLE IF NOT EXISTS public.t_estado (
  estado_id INTEGER NOT NULL,
  iso_31662 VARCHAR(6) NOT NULL,
  name VARCHAR(100) NOT NULL,
  capital VARCHAR(100),
  PRIMARY KEY (estado_id)
);

-- Tabla: t_evaluation
CREATE TABLE IF NOT EXISTS public.t_evaluation (
  "EVALUATION_ID" INTEGER DEFAULT nextval('"t_evaluation_EVALUATION_ID_seq"'::regclass) NOT NULL,
  "PROFESSIONAL_PRACTICE_ID" INTEGER NOT NULL,
  "EVALUATOR_TYPE" VARCHAR(20) NOT NULL,
  "EVALUATOR_ID" INTEGER,
  "EVALUATOR_NAME" VARCHAR(255) NOT NULL,
  "EVALUATOR_CI" VARCHAR(20),
  "TOTAL_SCORE" NUMERIC(5, 2) NOT NULL,
  "OBSERVATIONS" TEXT,
  "EVALUATION_DATE" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "COMITE_MEMBER_INDEX" INTEGER,
  "REGISTERED_BY" INTEGER,
  "STATUS" SMALLINT DEFAULT 1,
  frozen_at TIMESTAMPTZ,
  unfrozen_at TIMESTAMPTZ,
  unfreeze_reason TEXT,
  unfreeze_authorized_by INTEGER,
  PRIMARY KEY ("EVALUATION_ID")
);

-- Tabla: t_evaluation_criteria
CREATE TABLE IF NOT EXISTS public.t_evaluation_criteria (
  "CRITERIA_ID" INTEGER DEFAULT nextval('"t_evaluation_criteria_CRITERIA_ID_seq"'::regclass) NOT NULL,
  "ITEM_NUMBER" INTEGER NOT NULL,
  "DESCRIPTION" VARCHAR(500) NOT NULL,
  "EVALUATOR_TYPE" VARCHAR(20) NOT NULL,
  "STATUS" SMALLINT DEFAULT 1,
  PRIMARY KEY ("CRITERIA_ID")
);

-- Tabla: t_evaluation_detail
CREATE TABLE IF NOT EXISTS public.t_evaluation_detail (
  "DETAIL_ID" INTEGER DEFAULT nextval('"t_evaluation_detail_DETAIL_ID_seq"'::regclass) NOT NULL,
  "EVALUATION_ID" INTEGER NOT NULL,
  "CRITERIA_ID" INTEGER,
  "ITEM_NUMBER" INTEGER NOT NULL,
  "SCORE" NUMERIC(5, 2) NOT NULL,
  "STATUS" SMALLINT DEFAULT 1,
  PRIMARY KEY ("DETAIL_ID")
);

-- Tabla: t_institution
CREATE TABLE IF NOT EXISTS public.t_institution (
  "INSTITUTION_ID" INTEGER DEFAULT nextval('"t_institution_INSTITUTION_ID_seq"'::regclass) NOT NULL,
  "INSTITUTION_NAME" VARCHAR(255) NOT NULL,
  "INSTITUTION_ADDRESS" VARCHAR(255) NOT NULL,
  "INSTITUTION_CONTACT" VARCHAR(12) NOT NULL,
  "PRACTICE_TYPE" VARCHAR(255) NOT NULL,
  "REGION" VARCHAR(255) NOT NULL,
  "NUCLEUS" VARCHAR(255) NOT NULL,
  "EXTENSION" VARCHAR(255) NOT NULL,
  "CREATION_DATE" TIMESTAMP NOT NULL,
  "INSTITUTION_TYPE" VARCHAR(255) NOT NULL,
  "STATUS" SMALLINT NOT NULL,
  "RIF" VARCHAR(11) NOT NULL,
  "INSTITUTION_CODE" VARCHAR(25) NOT NULL,
  PRIMARY KEY ("INSTITUTION_ID")
);

-- Tabla: t_institution_address
CREATE TABLE IF NOT EXISTS public.t_institution_address (
  institution_address_id BIGINT DEFAULT nextval('t_institution_address_institution_address_id_seq'::regclass) NOT NULL,
  institution_id INTEGER NOT NULL,
  address_id BIGINT NOT NULL,
  address_type_id BIGINT NOT NULL,
  is_primary BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  uuid UUID DEFAULT gen_random_uuid() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  version INTEGER DEFAULT 1,
  PRIMARY KEY (institution_address_id)
);

-- Tabla: t_institution_career
CREATE TABLE IF NOT EXISTS public.t_institution_career (
  "INSTITUTION_CAREER_ID" BIGINT DEFAULT nextval('"t_institution_career_INSTITUTION_CAREER_ID_seq"'::regclass) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  "INSTITUTION_ID" INTEGER NOT NULL,
  "CAREER_ID" INTEGER NOT NULL,
  PRIMARY KEY ("INSTITUTION_CAREER_ID")
);

-- Tabla: t_institution_internship_type
CREATE TABLE IF NOT EXISTS public.t_institution_internship_type (
  "INSTITUTION_INTERNSHIP_TYPE_ID" BIGINT DEFAULT nextval('"t_institution_internship_type_INSTITUTION_INTERNSHIP_TYPE_ID_se"'::regclass) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  "INSTITUTION_ID" INTEGER NOT NULL,
  "INTERNSHIP_TYPE_ID" INTEGER NOT NULL,
  PRIMARY KEY ("INSTITUTION_INTERNSHIP_TYPE_ID")
);

-- Tabla: t_institution_manager
CREATE TABLE IF NOT EXISTS public.t_institution_manager (
  "MANAGER_ID" INTEGER DEFAULT nextval('"t_institution_manager_MANAGER_ID_seq"'::regclass) NOT NULL,
  person_id INTEGER,
  "MANAGER_CI" VARCHAR(20),
  "NAME" VARCHAR(100),
  "SECOND_NAME" VARCHAR(100),
  "SURNAME" VARCHAR(100),
  "SECOND_SURNAME" VARCHAR(100),
  "CONTACT_PHONE" VARCHAR(20),
  "EMAIL" VARCHAR(100),
  "CREATION_DATE" TIMESTAMP NOT NULL,
  "STATUS" SMALLINT NOT NULL,
  "INSTITUTION_ID" INTEGER,
  cargo VARCHAR(100),
  "TITLE" VARCHAR(100) DEFAULT NULL::character varying,
  PRIMARY KEY ("MANAGER_ID")
);

-- Tabla: t_institution_manager_institution
CREATE TABLE IF NOT EXISTS public.t_institution_manager_institution (
  "INSTITUTION_MANAGER_INSTITUTION_ID" BIGINT DEFAULT nextval('"t_institution_manager_institution_INSTITUTION_MANAGER_INSTITUTI"'::regclass) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  "MANAGER_ID" INTEGER NOT NULL,
  "INSTITUTION_ID" INTEGER NOT NULL,
  cargo VARCHAR(100),
  PRIMARY KEY ("INSTITUTION_MANAGER_INSTITUTION_ID")
);

-- Tabla: t_internship_type
CREATE TABLE IF NOT EXISTS public.t_internship_type (
  "INTERNSHIP_TYPE_ID" INTEGER DEFAULT nextval('"t_internship_type_INTERNSHIP_TYPE_ID_seq"'::regclass) NOT NULL,
  "NAME" VARCHAR(40) NOT NULL,
  "PRIORITY" SMALLINT NOT NULL,
  "CREATION_DATE" TIMESTAMP NOT NULL,
  "STATUS" SMALLINT NOT NULL,
  "HOURS_REQUIRED" INTEGER DEFAULT 360,
  PRIMARY KEY ("INTERNSHIP_TYPE_ID")
);

-- Tabla: t_internships_period
CREATE TABLE IF NOT EXISTS public.t_internships_period (
  "PERIOD_ID" INTEGER DEFAULT nextval('"t_internships_period_PERIOD_ID_seq"'::regclass) NOT NULL,
  "START_DATE" DATE NOT NULL,
  "END_DATE" DATE NOT NULL,
  "ENROLLMENT_GRACE_DAYS" SMALLINT DEFAULT 21 NOT NULL,
  "EVALUATION_GRACE_DAYS" SMALLINT DEFAULT 10 NOT NULL,
  "CREATION_DATE" TIMESTAMP NOT NULL,
  "DESCRIPTION" VARCHAR(45) NOT NULL,
  "PERIOD_STATUS" VARCHAR(45) NOT NULL,
  "STATUS" SMALLINT NOT NULL,
  "T_INTERNSHIPS_CODE" VARCHAR(8) NOT NULL,
  PRIMARY KEY ("PERIOD_ID")
);

-- Tabla: t_key_history
CREATE TABLE IF NOT EXISTS public.t_key_history (
  "KEY_HISTORY_ID" INTEGER DEFAULT nextval('"t_key_history_KEY_HISTORY_ID_seq"'::regclass) NOT NULL,
  "USER_KEY_ID" INTEGER NOT NULL,
  "USER_ID" INTEGER NOT NULL,
  "END_DATE" VARCHAR(45) NOT NULL,
  "STATUS" SMALLINT NOT NULL,
  PRIMARY KEY ("KEY_HISTORY_ID", "USER_KEY_ID", "USER_ID")
);

-- Tabla: t_knowledge_base
CREATE TABLE IF NOT EXISTS public.t_knowledge_base (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector,
  metadata JSONB DEFAULT '{}'::jsonb,
  roles _text,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: t_landing_config
CREATE TABLE IF NOT EXISTS public.t_landing_config (
  config_id INTEGER DEFAULT nextval('t_landing_config_config_id_seq'::regclass) NOT NULL,
  config_key VARCHAR(100) NOT NULL,
  config_value JSONB,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(50) DEFAULT 'system'::character varying,
  PRIMARY KEY (config_id)
);

-- Tabla: t_list
CREATE TABLE IF NOT EXISTS public.t_list (
  "LIST_ID" INTEGER DEFAULT nextval('t_list_list_id_seq'::regclass) NOT NULL,
  "NAME" VARCHAR(40) NOT NULL,
  "CREATION_DATE" TIMESTAMP NOT NULL,
  "MODIF_USER_ID" INTEGER NOT NULL,
  "MODIF_USER_DATE" TIMESTAMP NOT NULL,
  "ELIM_USER_ID" INTEGER NOT NULL,
  "ELIM_USER_DATE" TIMESTAMP NOT NULL,
  "REST_USER_ID" INTEGER NOT NULL,
  "REST_USER_DATE" TIMESTAMP NOT NULL,
  "STATUS" SMALLINT NOT NULL,
  PRIMARY KEY ("LIST_ID")
);

-- Tabla: t_municipio
CREATE TABLE IF NOT EXISTS public.t_municipio (
  municipio_id BIGINT DEFAULT nextval('t_municipio_municipio_id_seq'::regclass) NOT NULL,
  estado_id INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  PRIMARY KEY (municipio_id)
);

-- Tabla: t_notifications
CREATE TABLE IF NOT EXISTS public.t_notifications (
  "NOTIFICATION_ID" INTEGER DEFAULT nextval('"t_notifications_NOTIFICATION_ID_seq"'::regclass) NOT NULL,
  "USER_ID" INTEGER NOT NULL,
  "TYPE" VARCHAR(50) NOT NULL,
  "TITLE" VARCHAR(255) NOT NULL,
  "MESSAGE" TEXT NOT NULL,
  "READ" BOOLEAN DEFAULT false,
  "READ_AT" TIMESTAMP,
  "DATA" JSONB,
  "CREATED_AT" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("NOTIFICATION_ID")
);

-- Tabla: t_nucleus_career
CREATE TABLE IF NOT EXISTS public.t_nucleus_career (
  nucleus_career_id INTEGER DEFAULT nextval('t_nucleus_career_nucleus_career_id_seq'::regclass) NOT NULL,
  nucleus_id INTEGER NOT NULL,
  career_id INTEGER NOT NULL,
  status SMALLINT DEFAULT 1 NOT NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  PRIMARY KEY (nucleus_career_id)
);

-- Tabla: t_operation
CREATE TABLE IF NOT EXISTS public.t_operation (
  "OPERATION_ID" INTEGER DEFAULT nextval('"t_operation_OPERATION_ID_seq"'::regclass) NOT NULL,
  "ACTION" VARCHAR(45) NOT NULL,
  "DESCRIPTION" TEXT,
  "STATUS" SMALLINT NOT NULL,
  PRIMARY KEY ("OPERATION_ID")
);

-- Tabla: t_parroquia
CREATE TABLE IF NOT EXISTS public.t_parroquia (
  parroquia_id BIGINT DEFAULT nextval('t_parroquia_parroquia_id_seq'::regclass) NOT NULL,
  municipio_id BIGINT NOT NULL,
  name VARCHAR(200) NOT NULL,
  PRIMARY KEY (parroquia_id)
);

-- Tabla: t_password_history
CREATE TABLE IF NOT EXISTS public.t_password_history (
  "HISTORY_ID" INTEGER DEFAULT nextval('"t_password_history_HISTORY_ID_seq"'::regclass) NOT NULL,
  "USER_ID" INTEGER NOT NULL,
  "KEY" TEXT NOT NULL,
  "CREATION_DATE" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("HISTORY_ID")
);

-- Tabla: t_permissions
CREATE TABLE IF NOT EXISTS public.t_permissions (
  "PERMISSIONS_ID" INTEGER DEFAULT nextval('"t_permissions_PERMISSIONS_ID_seq"'::regclass) NOT NULL,
  "NAME" VARCHAR(30) NOT NULL,
  "MODULE" VARCHAR(50) DEFAULT 'General'::character varying NOT NULL,
  "DESCRIPTION" TEXT,
  "MODIF_USER_ID" INTEGER NOT NULL,
  "MODIF_USER_DATE" TIMESTAMP NOT NULL,
  "ELIM_USER_ID" INTEGER NOT NULL,
  "ELIM_USER_DATE" TIMESTAMP NOT NULL,
  "REST_USER_ID" INTEGER NOT NULL,
  "REST_USER_DATE" TIMESTAMP NOT NULL,
  "STATUS" SMALLINT NOT NULL,
  PRIMARY KEY ("PERMISSIONS_ID")
);

-- Tabla: t_person_address
CREATE TABLE IF NOT EXISTS public.t_person_address (
  person_address_id BIGINT DEFAULT nextval('t_person_address_person_address_id_seq'::regclass) NOT NULL,
  person_id INTEGER NOT NULL,
  address_id BIGINT NOT NULL,
  address_type_id BIGINT NOT NULL,
  is_primary BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  uuid UUID DEFAULT gen_random_uuid() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  version INTEGER DEFAULT 1,
  PRIMARY KEY (person_address_id)
);

-- Tabla: t_person_merge_log
CREATE TABLE IF NOT EXISTS public.t_person_merge_log (
  log_id INTEGER DEFAULT nextval('t_person_merge_log_log_id_seq'::regclass) NOT NULL,
  ci VARCHAR(10) NOT NULL,
  source_table VARCHAR(50) NOT NULL,
  source_id INTEGER NOT NULL,
  field_name VARCHAR(50) NOT NULL,
  value_used TEXT,
  value_over TEXT,
  overridden_from VARCHAR(50),
  severity VARCHAR(10) DEFAULT 'INFO'::character varying,
  created_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (log_id)
);

-- Tabla: t_persons
CREATE TABLE IF NOT EXISTS public.t_persons (
  person_id INTEGER DEFAULT nextval('t_persons_person_id_seq'::regclass) NOT NULL,
  ci VARCHAR(10) NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  middle_name VARCHAR(255),
  last_name VARCHAR(255) NOT NULL,
  second_last_name VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(15),
  gender VARCHAR(10),
  birthdate DATE,
  address VARCHAR(255),
  marital_status VARCHAR(45),
  status SMALLINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (person_id)
);

-- Tabla: t_practice_culmination
CREATE TABLE IF NOT EXISTS public.t_practice_culmination (
  "PRACTICE_ID" INTEGER NOT NULL,
  "STATUS" SMALLINT DEFAULT 0 NOT NULL,
  "CERTIFICATE_NUMBER" VARCHAR(50),
  "CERTIFIED_AT" TIMESTAMP,
  "APPROVED_AT" TIMESTAMP DEFAULT now(),
  "APPROVED_BY" INTEGER,
  "CREATED_AT" TIMESTAMP DEFAULT now(),
  "UPDATED_AT" TIMESTAMP DEFAULT now(),
  PRIMARY KEY ("PRACTICE_ID")
);

-- Tabla: t_practice_visits
CREATE TABLE IF NOT EXISTS public.t_practice_visits (
  "VISIT_ID" INTEGER DEFAULT nextval('"t_practice_visits_VISIT_ID_seq"'::regclass) NOT NULL,
  "PROFESSIONAL_PRACTICE_ID" INTEGER NOT NULL,
  "TUTOR_ID" INTEGER NOT NULL,
  "VISIT_DATE" TIMESTAMP DEFAULT now() NOT NULL,
  "VISIT_TYPE" VARCHAR(50) DEFAULT 'PRESENCIAL'::character varying NOT NULL,
  "HOURS_WORKED" NUMERIC(5, 2) DEFAULT 0,
  "ACTIVITIES_PERFORMED" TEXT,
  "OBSERVATIONS" TEXT,
  "RECOMMENDATIONS" TEXT,
  "STATUS" SMALLINT DEFAULT 1 NOT NULL,
  "CREATED_AT" TIMESTAMP DEFAULT now() NOT NULL,
  "UPDATED_AT" TIMESTAMP DEFAULT now() NOT NULL,
  "CREATED_BY" INTEGER,
  "VISIT_CASE" VARCHAR(50) DEFAULT 'SEGUIMIENTO_REGULAR'::character varying,
  tutor_person_id INTEGER NOT NULL,
  PRIMARY KEY ("VISIT_ID")
);

-- Tabla: t_preset_questions
CREATE TABLE IF NOT EXISTS public.t_preset_questions (
  "PRESET_QUESTION_ID" INTEGER DEFAULT nextval('"t_preset_questions_PRESET_QUESTION_ID_seq"'::regclass) NOT NULL,
  "DESCRIPTION" VARCHAR(255) NOT NULL,
  "ANSWER" VARCHAR(255) NOT NULL,
  "MODIF_USER_ID" INTEGER NOT NULL,
  "MODIF_USER_DATE" TIMESTAMP NOT NULL,
  "ELIM_USER_ID" INTEGER NOT NULL,
  "ELIM_USER_DATE" TIMESTAMP NOT NULL,
  "REST_USER_ID" INTEGER NOT NULL,
  "REST_USER_DATE" TIMESTAMP NOT NULL,
  "STATUS" SMALLINT NOT NULL,
  PRIMARY KEY ("PRESET_QUESTION_ID")
);

-- Tabla: t_professional_practices
CREATE TABLE IF NOT EXISTS public.t_professional_practices (
  "PROFESSIONAL_PRACTICE_ID" INTEGER DEFAULT nextval('"t_professional_practices_PROFESSIONAL_PRACTICE_ID_seq"'::regclass) NOT NULL,
  "START_DATE" DATE NOT NULL,
  "END_DATE" DATE NOT NULL,
  "REPORT_TITLE" VARCHAR(255) NOT NULL,
  "REGISTRATION_DATE" TIMESTAMP NOT NULL,
  "CREATION_DATE" TIMESTAMP NOT NULL,
  "GRADE" NUMERIC(5, 2) NOT NULL,
  "TRANSFER" SMALLINT NOT NULL,
  "TOUR" VARCHAR(255) NOT NULL,
  "PERIOD_ID" INTEGER NOT NULL,
  "INSTITUTION_ID" INTEGER,
  "STUDENTS_ID" INTEGER NOT NULL,
  "STATUS" SMALLINT NOT NULL,
  "MANAGER_ID" INTEGER,
  "OBSERVATION" VARCHAR(255) NOT NULL,
  "ENROLLMENT" VARCHAR(255) NOT NULL,
  "INTERNSHIP_STATUS" INTEGER NOT NULL,
  "INTERNSHIP_TYPE_ID" INTEGER NOT NULL,
  "PRACTICES_STATUS" INTEGER NOT NULL,
  "EVALUATION_STATUS" VARCHAR(20) DEFAULT 'pending'::character varying,
  "SEMESTER" VARCHAR(255) NOT NULL,
  "SECTION" VARCHAR(255) NOT NULL,
  "REGIME" VARCHAR(255) NOT NULL,
  "CAREER_ID" INTEGER NOT NULL,
  student_person_id INTEGER,
  "DEPARTMENT" VARCHAR(255) DEFAULT NULL::character varying,
  "EXTENSION_GRANTED" BOOLEAN DEFAULT false,
  "EXTENSION_REASON" TEXT,
  "EXTENSION_GRANTED_BY" INTEGER,
  "EXTENSION_GRANTED_AT" TIMESTAMPTZ,
  withdrawal_type VARCHAR(20),
  PRIMARY KEY ("PROFESSIONAL_PRACTICE_ID")
);

-- Tabla: t_professional_practices_tutor
CREATE TABLE IF NOT EXISTS public.t_professional_practices_tutor (
  "PROFESSIONAL_PRACTICES_TUTOR_ID" INTEGER DEFAULT nextval('"t_professional_practices_tuto_PROFESSIONAL_PRACTICES_TUTOR__seq"'::regclass) NOT NULL,
  "TUTOR_ID" INTEGER NOT NULL,
  "PROFESSIONAL_PRACTICE_ID" INTEGER NOT NULL,
  "TUTOR_TYPE" VARCHAR(45) NOT NULL,
  tutor_person_id INTEGER,
  "ACTIVE" BOOLEAN DEFAULT true,
  "CREATED_AT" TIMESTAMP DEFAULT now(),
  "UPDATED_AT" TIMESTAMP DEFAULT now(),
  PRIMARY KEY ("PROFESSIONAL_PRACTICES_TUTOR_ID")
);

-- Tabla: t_prospect_list_items
CREATE TABLE IF NOT EXISTS public.t_prospect_list_items (
  "ITEM_ID" INTEGER DEFAULT nextval('"t_prospect_list_items_ITEM_ID_seq"'::regclass) NOT NULL,
  "LIST_ID" INTEGER NOT NULL,
  "STUDENTS_ID" INTEGER NOT NULL,
  "ENROLLED" BOOLEAN DEFAULT false NOT NULL,
  "NOTES" TEXT,
  "ADDED_AT" TIMESTAMP DEFAULT now() NOT NULL,
  "ADDED_BY" INTEGER,
  PRIMARY KEY ("ITEM_ID")
);

-- Tabla: t_prospect_lists
CREATE TABLE IF NOT EXISTS public.t_prospect_lists (
  "LIST_ID" INTEGER DEFAULT nextval('"t_prospect_lists_LIST_ID_seq"'::regclass) NOT NULL,
  "NAME" VARCHAR(255) NOT NULL,
  "DESCRIPTION" TEXT,
  "PERIOD_ID" INTEGER NOT NULL,
  "STATUS" SMALLINT DEFAULT 1 NOT NULL,
  "CREATED_AT" TIMESTAMP DEFAULT now() NOT NULL,
  "UPDATED_AT" TIMESTAMP DEFAULT now() NOT NULL,
  "CREATED_BY" INTEGER,
  PRIMARY KEY ("LIST_ID")
);

-- Tabla: t_recovery_tokens
CREATE TABLE IF NOT EXISTS public.t_recovery_tokens (
  "TOKEN_ID" INTEGER DEFAULT nextval('"t_recovery_tokens_TOKEN_ID_seq"'::regclass) NOT NULL,
  "USER_ID" INTEGER NOT NULL,
  "TOKEN" VARCHAR(255) NOT NULL,
  "EXPIRATION_DATE" TIMESTAMP NOT NULL,
  "STATUS" SMALLINT DEFAULT 1,
  "CREATION_DATE" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("TOKEN_ID")
);

-- Tabla: t_report_text_templates
CREATE TABLE IF NOT EXISTS public.t_report_text_templates (
  "TEMPLATE_ID" INTEGER DEFAULT nextval('"t_report_text_templates_TEMPLATE_ID_seq"'::regclass) NOT NULL,
  "REPORT_TYPE" VARCHAR(50) NOT NULL,
  "SECTION" VARCHAR(50) NOT NULL,
  "CONTENT_TEMPLATE" TEXT NOT NULL,
  "UPDATED_BY" INTEGER,
  "UPDATED_AT" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "STATUS" SMALLINT DEFAULT 1,
  PRIMARY KEY ("TEMPLATE_ID")
);

-- Tabla: t_request_types
CREATE TABLE IF NOT EXISTS public.t_request_types (
  "REQUEST_TYPE_ID" INTEGER DEFAULT nextval('"t_request_types_REQUEST_TYPE_ID_seq"'::regclass) NOT NULL,
  "NAME" VARCHAR(100) NOT NULL,
  "DESCRIPTION" TEXT,
  "IS_ACTIVE" SMALLINT DEFAULT 1 NOT NULL,
  "CREATION_DATE" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "MODIF_USER_ID" INTEGER DEFAULT 0 NOT NULL,
  "MODIF_USER_DATE" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "ELIM_USER_ID" INTEGER DEFAULT 0 NOT NULL,
  "ELIM_USER_DATE" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "REST_USER_ID" INTEGER DEFAULT 0 NOT NULL,
  "REST_USER_DATE" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "STATUS" SMALLINT DEFAULT 1 NOT NULL,
  "IS_REASSIGNMENT" SMALLINT DEFAULT 0,
  "CATEGORY" VARCHAR(50) DEFAULT 'GENERAL'::character varying,
  PRIMARY KEY ("REQUEST_TYPE_ID")
);

-- Tabla: t_roles
CREATE TABLE IF NOT EXISTS public.t_roles (
  "ID_ROLS" INTEGER DEFAULT nextval('"t_roles_ID_ROLS_seq"'::regclass) NOT NULL,
  "NAME" VARCHAR(30) NOT NULL,
  "DESCRIPTION" TEXT,
  "MODIF_USER_ID" INTEGER NOT NULL,
  "MODIF_USER_DATE" TIMESTAMP NOT NULL,
  "ELIM_USER_ID" INTEGER NOT NULL,
  "ELIM_USER_DATE" TIMESTAMP NOT NULL,
  "REST_USER_ID" INTEGER NOT NULL,
  "REST_USER_DATE" TIMESTAMP NOT NULL,
  "STATUS" SMALLINT NOT NULL,
  "IS_SYSTEM" BOOLEAN DEFAULT false NOT NULL,
  PRIMARY KEY ("ID_ROLS")
);

-- Tabla: t_roles_permissions
CREATE TABLE IF NOT EXISTS public.t_roles_permissions (
  "ROLES_ID" INTEGER NOT NULL,
  "PERMISSIONS_ID" INTEGER NOT NULL,
  PRIMARY KEY ("ROLES_ID", "PERMISSIONS_ID")
);

-- Tabla: t_security_questions
CREATE TABLE IF NOT EXISTS public.t_security_questions (
  "SECURITY_QUESTIONS_ID" INTEGER DEFAULT nextval('"t_security_questions_SECURITY_QUESTIONS_ID_seq"'::regclass) NOT NULL,
  "USER_ID" INTEGER NOT NULL,
  "PRESET_QUESTION_ID" INTEGER NOT NULL,
  "ANSWER" TEXT,
  "CUSTOM_QUESTION" TEXT,
  PRIMARY KEY ("SECURITY_QUESTIONS_ID")
);

-- Tabla: t_session
CREATE TABLE IF NOT EXISTS public.t_session (
  "SESSION_ID" INTEGER DEFAULT nextval('"t_session_SESSION_ID_seq"'::regclass) NOT NULL,
  "USER_ID" INTEGER NOT NULL,
  "LOGIN_TIME" TIMESTAMP NOT NULL,
  "MODIF_USER_ID" INTEGER NOT NULL,
  "MODIF_USER_DATE" TIMESTAMP NOT NULL,
  "ELIM_USER_ID" INTEGER NOT NULL,
  "ELIM_USER_DATE" TIMESTAMP NOT NULL,
  "REST_USER_ID" INTEGER NOT NULL,
  "REST_USER_DATE" TIMESTAMP NOT NULL,
  "STATUS" SMALLINT NOT NULL,
  PRIMARY KEY ("SESSION_ID", "USER_ID")
);

-- Tabla: t_session_attempts
CREATE TABLE IF NOT EXISTS public.t_session_attempts (
  "ATTEMPT_ID" INTEGER DEFAULT nextval('"t_session_attempts_ATTEMPT_ID_seq"'::regclass) NOT NULL,
  "ATTEMPT_TIME" TIMESTAMP NOT NULL,
  "USER_ID" INTEGER NOT NULL,
  "ACTION" SMALLINT NOT NULL,
  "MODIF_USER_ID" INTEGER NOT NULL,
  "MODIF_USER_DATE" TIMESTAMP NOT NULL,
  "ELIM_USER_ID" INTEGER NOT NULL,
  "ELIM_USER_DATE" TIMESTAMP NOT NULL,
  "REST_USER_ID" INTEGER NOT NULL,
  "REST_USER_DATE" TIMESTAMP NOT NULL,
  "STATUS" SMALLINT NOT NULL,
  PRIMARY KEY ("ATTEMPT_ID", "USER_ID")
);

-- Tabla: t_session_history
CREATE TABLE IF NOT EXISTS public.t_session_history (
  "SESSION_HISTORY_ID" INTEGER DEFAULT nextval('"t_session_history_SESSION_HISTORY_ID_seq"'::regclass) NOT NULL,
  "SESSION_ID" INTEGER NOT NULL,
  "USER_ID" INTEGER NOT NULL,
  "LOGIN_TIME" TIMESTAMP NOT NULL,
  "LOGOUT_TIME" TIMESTAMP NOT NULL,
  "STATUS" SMALLINT NOT NULL,
  PRIMARY KEY ("SESSION_HISTORY_ID", "SESSION_ID", "USER_ID")
);

-- Tabla: t_student_documents
CREATE TABLE IF NOT EXISTS public.t_student_documents (
  "DOCUMENT_ID" INTEGER DEFAULT nextval('"t_student_documents_DOCUMENT_ID_seq"'::regclass) NOT NULL,
  "STUDENT_ID" INTEGER NOT NULL,
  "DOCUMENT_TYPE" VARCHAR(50) NOT NULL,
  "TITLE" VARCHAR(255) NOT NULL,
  "DESCRIPTION" TEXT,
  "FILE_NAME" VARCHAR(255) NOT NULL,
  "FILE_PATH" VARCHAR(500) NOT NULL,
  "FILE_SIZE" INTEGER,
  "FILE_TYPE" VARCHAR(100),
  "STATUS" VARCHAR(20) DEFAULT 'pending'::character varying NOT NULL,
  "REJECTION_REASON" TEXT,
  "UPLOADED_AT" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "REVIEWED_AT" TIMESTAMP,
  "REVIEWED_BY" INTEGER,
  "CREATION_DATE" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "MODIF_USER_ID" INTEGER DEFAULT 0 NOT NULL,
  "MODIF_USER_DATE" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "STATUS_TABLE" SMALLINT DEFAULT 1 NOT NULL,
  student_person_id INTEGER NOT NULL,
  PRIMARY KEY ("DOCUMENT_ID")
);

-- Tabla: t_student_requests
CREATE TABLE IF NOT EXISTS public.t_student_requests (
  "REQUEST_ID" INTEGER DEFAULT nextval('"t_student_requests_REQUEST_ID_seq"'::regclass) NOT NULL,
  "STUDENT_ID" INTEGER NOT NULL,
  "REQUEST_TYPE_ID" INTEGER NOT NULL,
  "SUBJECT" VARCHAR(255) NOT NULL,
  "DESCRIPTION" TEXT NOT NULL,
  "STATUS" VARCHAR(20) DEFAULT 'pending'::character varying NOT NULL,
  "RESPONSE" TEXT,
  "PROCESSED_BY" INTEGER,
  "PROCESSED_AT" TIMESTAMP,
  "CREATION_DATE" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "MODIF_USER_ID" INTEGER DEFAULT 0 NOT NULL,
  "MODIF_USER_DATE" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "ELIM_USER_ID" INTEGER DEFAULT 0 NOT NULL,
  "ELIM_USER_DATE" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "REST_USER_ID" INTEGER DEFAULT 0 NOT NULL,
  "REST_USER_DATE" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "STATUS_TABLE" SMALLINT DEFAULT 1 NOT NULL,
  "REASSIGNMENT_DATA" JSONB,
  "IS_REASSIGNMENT" SMALLINT DEFAULT 0,
  "PREVIOUS_TUTOR_ID" INTEGER,
  "PREVIOUS_INSTITUTION_ID" INTEGER,
  "PREVIOUS_CAREER_ID" INTEGER,
  student_person_id INTEGER NOT NULL,
  PRIMARY KEY ("REQUEST_ID")
);

-- Tabla: t_students
CREATE TABLE IF NOT EXISTS public.t_students (
  "STUDENTS_ID" INTEGER DEFAULT nextval('"t_students_STUDENTS_ID_seq"'::regclass) NOT NULL,
  person_id INTEGER,
  "STUDENTS_CI" VARCHAR(20),
  "NAME" VARCHAR(100),
  "SECOND_NAME" VARCHAR(100),
  "SURNAME" VARCHAR(100),
  "SECOND_SURNAME" VARCHAR(100),
  "GENDER" bpchar,
  "BIRTHDATE" DATE,
  "CONTACT_PHONE" VARCHAR(20),
  "EMAIL" VARCHAR(100),
  "ADDRESS" TEXT,
  "MARITAL_STATUS" VARCHAR(1),
  "STUDENT_TYPE" VARCHAR(45) NOT NULL,
  "MILITARY_RANK" VARCHAR(45) DEFAULT NULL::character varying,
  "EMPLOYMENT" VARCHAR(2) NOT NULL,
  "STATUS" SMALLINT NOT NULL,
  "REGISTRATION_DATE" TIMESTAMP,
  "USER_ID" INTEGER,
  PRIMARY KEY ("STUDENTS_ID")
);

-- Tabla: t_system_institution
CREATE TABLE IF NOT EXISTS public.t_system_institution (
  system_institution_id INTEGER DEFAULT nextval('t_system_institution_system_institution_id_seq'::regclass) NOT NULL,
  legal_name VARCHAR(500) NOT NULL,
  commercial_name VARCHAR(255) NOT NULL,
  acronym VARCHAR(50) NOT NULL,
  rif VARCHAR(20),
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(500),
  logo_url VARCHAR(500),
  resolution_number VARCHAR(100),
  foundation_date DATE,
  status SMALLINT DEFAULT 1 NOT NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL,
  region VARCHAR(255) DEFAULT ''::character varying NOT NULL,
  nucleus VARCHAR(255) DEFAULT ''::character varying NOT NULL,
  extension VARCHAR(255) DEFAULT ''::character varying NOT NULL,
  PRIMARY KEY (system_institution_id)
);

-- Tabla: t_system_nucleus
CREATE TABLE IF NOT EXISTS public.t_system_nucleus (
  nucleus_id INTEGER DEFAULT nextval('t_system_nucleus_nucleus_id_seq'::regclass) NOT NULL,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  region VARCHAR(255) NOT NULL,
  nucleus_type VARCHAR(20) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  is_main BOOLEAN DEFAULT false NOT NULL,
  status SMALLINT DEFAULT 1 NOT NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL,
  PRIMARY KEY (nucleus_id)
);

-- Tabla: t_tables
CREATE TABLE IF NOT EXISTS public.t_tables (
  "TABLE_ID" INTEGER DEFAULT nextval('"t_tables_TABLE_ID_seq"'::regclass) NOT NULL,
  "NAME" VARCHAR(25) NOT NULL,
  "DESCRIPTION" TEXT,
  "PHYSICAL_NAME" VARCHAR(25) NOT NULL,
  "LOG" SMALLINT NOT NULL,
  "STATUS" SMALLINT NOT NULL,
  PRIMARY KEY ("TABLE_ID")
);

-- Tabla: t_tutor_career
CREATE TABLE IF NOT EXISTS public.t_tutor_career (
  "TUTOR_CAREER_ID" BIGINT DEFAULT nextval('"t_tutor_career_TUTOR_CAREER_ID_seq"'::regclass) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  "TUTOR_ID" INTEGER NOT NULL,
  "CAREER_ID" INTEGER NOT NULL,
  PRIMARY KEY ("TUTOR_CAREER_ID")
);

-- Tabla: t_tutors
CREATE TABLE IF NOT EXISTS public.t_tutors (
  "TUTOR_ID" INTEGER DEFAULT nextval('"t_tutors_TUTOR_ID_seq"'::regclass) NOT NULL,
  person_id INTEGER,
  "TUTOR_CI" VARCHAR(20),
  "NAME" VARCHAR(100),
  "SECOND_NAME" VARCHAR(100),
  "SURNAME" VARCHAR(100),
  "SECOND_SURNAME" VARCHAR(100),
  "CONTACT_PHONE" VARCHAR(20),
  "GENDER" bpchar,
  "EMAIL" VARCHAR(100),
  "PROFESSION" VARCHAR(255) NOT NULL,
  "CONDITION" VARCHAR(45) NOT NULL,
  "DEDICATION" VARCHAR(45) NOT NULL,
  "CATEGORY" VARCHAR(45) NOT NULL,
  "CREATION_DATE" TIMESTAMP NOT NULL,
  "STATUS" SMALLINT NOT NULL,
  "USER_ID" INTEGER,
  "TITULO" VARCHAR(50) DEFAULT NULL::character varying,
  "ATTENTION_SCHEDULE" VARCHAR(255) DEFAULT NULL::character varying,
  PRIMARY KEY ("TUTOR_ID")
);

-- Tabla: t_user
CREATE TABLE IF NOT EXISTS public.t_user (
  "USER_ID" INTEGER DEFAULT nextval('"t_user_USER_ID_seq"'::regclass) NOT NULL,
  "USER" VARCHAR(255) NOT NULL,
  "USER_CI" VARCHAR(10) NOT NULL,
  "NAME" VARCHAR(100),
  "SECOND_NAME" VARCHAR(100),
  "SURNAME" VARCHAR(100),
  "SECOND_SURNAME" VARCHAR(100),
  "EMAIL" VARCHAR(100),
  "PHONE_NUMBER" VARCHAR(20),
  "CREATION_DATE" TIMESTAMP NOT NULL,
  "LOGIN" SMALLINT NOT NULL,
  "TERMS_CONDITIONS" VARCHAR(45) NOT NULL,
  "STATUS_SESSION" SMALLINT NOT NULL,
  "STATUS" SMALLINT NOT NULL,
  "FAILED_ATTEMPTS" INTEGER DEFAULT 0,
  "LOCK_DATE" TIMESTAMPTZ,
  "FORCE_PASSWORD_CHANGE" BOOLEAN DEFAULT false,
  person_id INTEGER,
  "LAST_LOGIN" TIMESTAMP,
  PRIMARY KEY ("USER_ID")
);

-- Tabla: t_user_key
CREATE TABLE IF NOT EXISTS public.t_user_key (
  "USER_KEY_ID" INTEGER DEFAULT nextval('"t_user_key_USER_KEY_ID_seq"'::regclass) NOT NULL,
  "USER_ID" INTEGER NOT NULL,
  "KEY" VARCHAR(255) NOT NULL,
  "START_DATE" TIMESTAMP NOT NULL,
  "END_DATE" TIMESTAMP NOT NULL,
  "MODIF_USER_ID" INTEGER NOT NULL,
  "MODIF_USER_DATE" TIMESTAMP NOT NULL,
  "ELIM_USER_ID" INTEGER NOT NULL,
  "ELIM_USER_DATE" TIMESTAMP NOT NULL,
  "REST_USER_ID" INTEGER NOT NULL,
  "REST_USER_DATE" TIMESTAMP NOT NULL,
  "STATUS" SMALLINT NOT NULL,
  "IS_TEMPORARY" BOOLEAN DEFAULT false,
  PRIMARY KEY ("USER_KEY_ID", "USER_ID")
);

-- Tabla: t_user_notification_prefs
CREATE TABLE IF NOT EXISTS public.t_user_notification_prefs (
  "ID" INTEGER DEFAULT nextval('"t_user_notification_prefs_ID_seq"'::regclass) NOT NULL,
  "USER_ID" INTEGER NOT NULL,
  "TYPE" VARCHAR(30) NOT NULL,
  "CHANNEL" VARCHAR(10) NOT NULL,
  "ENABLED" BOOLEAN DEFAULT true,
  "CREATED_AT" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  "UPDATED_AT" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("ID")
);

-- Tabla: t_user_questions
CREATE TABLE IF NOT EXISTS public.t_user_questions (
  "USER_QUESTION_ID" INTEGER DEFAULT nextval('"t_user_questions_USER_QUESTION_ID_seq"'::regclass) NOT NULL,
  "USER_ID" INTEGER NOT NULL,
  "QUESTION_TYPE" VARCHAR(20) DEFAULT 'PRESET'::character varying NOT NULL,
  "PRESET_QUESTION_ID" INTEGER,
  "CUSTOM_QUESTION" VARCHAR(255),
  "ANSWER" VARCHAR(255) NOT NULL,
  "ORDER_NUM" SMALLINT DEFAULT 1 NOT NULL,
  "CREATED_AT" TIMESTAMP DEFAULT now() NOT NULL,
  "UPDATED_AT" TIMESTAMP DEFAULT now() NOT NULL,
  "STATUS" SMALLINT DEFAULT 1 NOT NULL,
  PRIMARY KEY ("USER_QUESTION_ID")
);

-- Tabla: t_user_roles
CREATE TABLE IF NOT EXISTS public.t_user_roles (
  "ID_USER" INTEGER NOT NULL,
  "ID_ROLES" INTEGER NOT NULL,
  PRIMARY KEY ("ID_USER", "ID_ROLES")
);

-- Tabla: t_user_theme
CREATE TABLE IF NOT EXISTS public.t_user_theme (
  "USER_THEME_ID" INTEGER DEFAULT nextval('"t_user_theme_USER_THEME_ID_seq"'::regclass) NOT NULL,
  "USER_ID" INTEGER NOT NULL,
  "BRAND_COLOR" VARCHAR(20) DEFAULT 'blue'::character varying NOT NULL,
  "CREATION_DATE" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "MODIF_USER_ID" INTEGER DEFAULT 0 NOT NULL,
  "MODIF_USER_DATE" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "ELIM_USER_ID" INTEGER DEFAULT 0 NOT NULL,
  "ELIM_USER_DATE" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "REST_USER_ID" INTEGER DEFAULT 0 NOT NULL,
  "REST_USER_DATE" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "STATUS" SMALLINT DEFAULT 1 NOT NULL,
  PRIMARY KEY ("USER_THEME_ID")
);

-- Tabla: t_value_list
CREATE TABLE IF NOT EXISTS public.t_value_list (
  "VALUE_LIST_ID" INTEGER DEFAULT nextval('"t_value_list_VALUE_LIST_ID_seq"'::regclass) NOT NULL,
  "NAME" VARCHAR(45) NOT NULL,
  "ABBREVIATION" VARCHAR(20) DEFAULT NULL::character varying,
  "LIST_ID" INTEGER NOT NULL,
  "CREATION_DATE" TIMESTAMP NOT NULL,
  "MODIF_USER_ID" INTEGER NOT NULL,
  "MODIF_USER_DATE" TIMESTAMP NOT NULL,
  "ELIM_USER_ID" INTEGER NOT NULL,
  "ELIM_USER_DATE" TIMESTAMP NOT NULL,
  "REST_USER_ID" INTEGER NOT NULL,
  "REST_USER_DATE" TIMESTAMP NOT NULL,
  "STATUS" SMALLINT NOT NULL,
  PRIMARY KEY ("VALUE_LIST_ID")
);

-- Tabla: t_visit
CREATE TABLE IF NOT EXISTS public.t_visit (
  "VISIT_ID" INTEGER DEFAULT nextval('"t_visit_VISIT_ID_seq"'::regclass) NOT NULL,
  "VISIT_DATE" DATE NOT NULL,
  "NOTE" VARCHAR(255) DEFAULT NULL::character varying,
  "REQUESTED_ACTIVITY" VARCHAR(45) NOT NULL,
  "CARRIED_ACTIVITY" VARCHAR(45) NOT NULL,
  "STATUS" SMALLINT NOT NULL,
  "TUTOR_ID" INTEGER NOT NULL,
  "PROFESSIONAL_PRACTICE_ID" INTEGER NOT NULL,
  PRIMARY KEY ("VISIT_ID")
);

-- Tablas excluidas del backup (solo estructura)
CREATE TABLE IF NOT EXISTS "t_backups" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "file_name" VARCHAR(255) NOT NULL,
  "size" BIGINT,
  "tables" TEXT[],
  "created_by" INTEGER,
  "data" JSONB,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- SECCIÓN 4: DATOS (INSERT)
-- ============================================================

-- --------------------------------------------------------
-- Tabla: t_persons (1 registro base - requerido por FKs)
-- --------------------------------------------------------
INSERT INTO "t_persons" ("person_id", "ci", "first_name", "last_name", "email", "status", "created_at", "updated_at") VALUES (1, 'V12345678', 'Admin', 'Sistema', 'admin@unefa.edu.ve', 1, NOW(), NOW()) ON CONFLICT (ci) DO NOTHING;

-- --------------------------------------------------------
-- Tabla: t_user (1 registro base - requerido por FKs)
-- USER_ID serial, USER_CI = ci de persona
-- --------------------------------------------------------
INSERT INTO "t_user" ("USER", "USER_CI", "NAME", "SECOND_NAME", "SURNAME", "SECOND_SURNAME", "EMAIL", "PHONE_NUMBER", "CREATION_DATE", "LOGIN", "TERMS_CONDITIONS", "STATUS_SESSION", "STATUS", "FAILED_ATTEMPTS", "FORCE_PASSWORD_CHANGE", "person_id") VALUES ('V12345678', 'V12345678', 'Admin', '', 'Sistema', '', 'admin@unefa.edu.ve', '', NOW(), 1, 'ACEPTADO', 1, 1, 0, FALSE, 1) ON CONFLICT ("USER_CI") DO NOTHING;

-- --------------------------------------------------------
-- Tabla: t_user_key (password hash para admin)
-- password: Admin123 (bcrypt cost 10)
-- --------------------------------------------------------
INSERT INTO "t_user_key" ("USER_KEY_ID", "USER_ID", "KEY", "START_DATE", "END_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS", "IS_TEMPORARY") VALUES (1, 1, '$2a$10$a1b/i/c3NnRd6qx4pIWjnOqsHa/qsuxGpz4MNBaRvD545hPCGVz4a', NOW(), NOW() + INTERVAL '1 year', 1, NOW(), 1, NOW(), 1, NOW(), 1, FALSE) ON CONFLICT ("USER_KEY_ID", "USER_ID") DO NOTHING;

-- --------------------------------------------------------
-- Tabla: t_academic_config (1 registros)
-- --------------------------------------------------------
INSERT INTO "t_academic_config" ("CONFIG_ID", "DEFAULT_ENROLLMENT_GRACE_DAYS", "DEFAULT_EVALUATION_GRACE_DAYS", "UPDATED_AT", "UPDATED_BY", "allow_multiple_visits_per_day", "max_visits_per_day", "ALLOW_MULTIPLE_VISITS_PER_DAY", "MAX_VISITS_PER_DAY", "LOCK_API_LOADED_FIELDS") VALUES (1, 64, 31, '2026-06-26T13:05:21.928', 1, TRUE, 3, TRUE, 3, TRUE);

-- --------------------------------------------------------
-- Tabla: t_address (24 registros)
-- --------------------------------------------------------
INSERT INTO "t_address_type" ("address_type_id", "code", "name", "description", "status") VALUES (1, 'HOME', 'Residencial', 'Dirección de residencia habitual', 1);
INSERT INTO "t_address_type" ("address_type_id", "code", "name", "description", "status") VALUES (2, 'WORK', 'Laboral', 'Dirección del lugar de trabajo', 1);
INSERT INTO "t_address_type" ("address_type_id", "code", "name", "description", "status") VALUES (3, 'FISCAL', 'Fiscal', 'Dirección fiscal registrada', 1);
INSERT INTO "t_address_type" ("address_type_id", "code", "name", "description", "status") VALUES (4, 'TEMPORAL', 'Temporal', 'Dirección temporal o de contacto', 1);

-- --------------------------------------------------------
-- Tabla: t_auth_log (613 registros)
-- --------------------------------------------------------
INSERT INTO "t_career" ("CAREER_ID", "CAREER_NAME", "CAREER_CODE", "MINIMUM_GRADE", "CAREER_ABBREVIATION", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS", "CAREER_TYPE", "SEMESTER") VALUES (3, 'INGENIERIA AGRONOMICA', '2016', 16, 'ING-AGRONO', '2026-06-16T12:28:03.968', 1, '2026-06-16T12:28:03.968', 1, '2026-06-16T12:28:03.968', 1, '2026-06-16T12:28:03.968', 1, 'LARGA', '9');
INSERT INTO "t_career" ("CAREER_ID", "CAREER_NAME", "CAREER_CODE", "MINIMUM_GRADE", "CAREER_ABBREVIATION", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS", "CAREER_TYPE", "SEMESTER") VALUES (4, 'TECNICO SUPERIOR EN ENFERMERÍA', '0316', 16, 'TSU-ENF', '2026-06-16T12:28:37.376', 1, '2026-06-16T12:28:37.376', 1, '2026-06-16T12:28:37.376', 1, '2026-06-16T12:28:37.376', 1, 'CORTA', '8');
INSERT INTO "t_career" ("CAREER_ID", "CAREER_NAME", "CAREER_CODE", "MINIMUM_GRADE", "CAREER_ABBREVIATION", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS", "CAREER_TYPE", "SEMESTER") VALUES (2, 'INGENIERIA AGROINDUSTRIAL', '1916', 16, 'ING-AGRO', '2026-06-16T12:27:10.689', 1, '2026-06-16T12:27:10.689', 1, '2026-06-20T22:42:44.921', 1, '2026-06-20T22:44:40.322', 1, 'LARGA', '8');
INSERT INTO "t_career" ("CAREER_ID", "CAREER_NAME", "CAREER_CODE", "MINIMUM_GRADE", "CAREER_ABBREVIATION", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS", "CAREER_TYPE", "SEMESTER") VALUES (6, 'INGENIERIA EN APROBAR ', '32123', 16, 'TSU ENFDED', '2026-06-22T01:58:56.552', 1, '2026-06-22T01:58:56.552', 1, '2026-06-22T01:58:56.552', 1, '2026-06-22T01:58:56.552', 1, 'CORTA', '6');
INSERT INTO "t_career" ("CAREER_ID", "CAREER_NAME", "CAREER_CODE", "MINIMUM_GRADE", "CAREER_ABBREVIATION", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS", "CAREER_TYPE", "SEMESTER") VALUES (1, 'CARRERA TESTS', '1234', 16, 'CAREERTEST', '2026-06-16T03:54:07.398', 1, '2026-06-16T03:54:07.398', 9, '2026-07-02T13:30:35.42', 9, '2026-07-02T13:36:49.338', 1, 'CORTA', '5');
INSERT INTO "t_career" ("CAREER_ID", "CAREER_NAME", "CAREER_CODE", "MINIMUM_GRADE", "CAREER_ABBREVIATION", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS", "CAREER_TYPE", "SEMESTER") VALUES (7, 'REPUESTOS AUTOMOTRIZ', '1013', 15, 'IRA', '2026-07-02T15:05:45.738', 9, '2026-07-02T15:05:45.738', 9, '2026-07-02T15:05:45.738', 9, '2026-07-02T15:05:45.738', 1, 'LARGA', '8');
INSERT INTO "t_career" ("CAREER_ID", "CAREER_NAME", "CAREER_CODE", "MINIMUM_GRADE", "CAREER_ABBREVIATION", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS", "CAREER_TYPE", "SEMESTER") VALUES (5, 'CARRERA DE PRUEBA', '12348', 16, 'CAREER-P', '2026-06-22T01:42:06.519', 1, '2026-07-03T02:12:11.594', 1, '2026-06-22T01:42:06.519', 1, '2026-06-22T01:42:06.519', 1, 'LARGA', '8');

-- --------------------------------------------------------
-- Tabla: t_career_internship_type (17 registros)
-- --------------------------------------------------------
INSERT INTO "t_career_internship_type" ("ID_CAREER_INTERNSHIP_TYPE_ID", "CAREER_ID", "INTERNSHIP_TYPE_ID") VALUES (1, 1, 1);
INSERT INTO "t_career_internship_type" ("ID_CAREER_INTERNSHIP_TYPE_ID", "CAREER_ID", "INTERNSHIP_TYPE_ID") VALUES (2, 2, 1);
INSERT INTO "t_career_internship_type" ("ID_CAREER_INTERNSHIP_TYPE_ID", "CAREER_ID", "INTERNSHIP_TYPE_ID") VALUES (3, 3, 1);
INSERT INTO "t_career_internship_type" ("ID_CAREER_INTERNSHIP_TYPE_ID", "CAREER_ID", "INTERNSHIP_TYPE_ID") VALUES (5, 4, 3);
INSERT INTO "t_career_internship_type" ("ID_CAREER_INTERNSHIP_TYPE_ID", "CAREER_ID", "INTERNSHIP_TYPE_ID") VALUES (4, 4, 1);
INSERT INTO "t_career_internship_type" ("ID_CAREER_INTERNSHIP_TYPE_ID", "CAREER_ID", "INTERNSHIP_TYPE_ID") VALUES (7, 1, 2);
INSERT INTO "t_career_internship_type" ("ID_CAREER_INTERNSHIP_TYPE_ID", "CAREER_ID", "INTERNSHIP_TYPE_ID") VALUES (8, 1, 3);
INSERT INTO "t_career_internship_type" ("ID_CAREER_INTERNSHIP_TYPE_ID", "CAREER_ID", "INTERNSHIP_TYPE_ID") VALUES (10, 3, 2);
INSERT INTO "t_career_internship_type" ("ID_CAREER_INTERNSHIP_TYPE_ID", "CAREER_ID", "INTERNSHIP_TYPE_ID") VALUES (11, 3, 3);
INSERT INTO "t_career_internship_type" ("ID_CAREER_INTERNSHIP_TYPE_ID", "CAREER_ID", "INTERNSHIP_TYPE_ID") VALUES (13, 4, 2);
INSERT INTO "t_career_internship_type" ("ID_CAREER_INTERNSHIP_TYPE_ID", "CAREER_ID", "INTERNSHIP_TYPE_ID") VALUES (14, 4, 3);
INSERT INTO "t_career_internship_type" ("ID_CAREER_INTERNSHIP_TYPE_ID", "CAREER_ID", "INTERNSHIP_TYPE_ID") VALUES (16, 2, 2);
INSERT INTO "t_career_internship_type" ("ID_CAREER_INTERNSHIP_TYPE_ID", "CAREER_ID", "INTERNSHIP_TYPE_ID") VALUES (17, 2, 3);
INSERT INTO "t_career_internship_type" ("ID_CAREER_INTERNSHIP_TYPE_ID", "CAREER_ID", "INTERNSHIP_TYPE_ID") VALUES (19, 6, 2);
INSERT INTO "t_career_internship_type" ("ID_CAREER_INTERNSHIP_TYPE_ID", "CAREER_ID", "INTERNSHIP_TYPE_ID") VALUES (20, 6, 3);
INSERT INTO "t_career_internship_type" ("ID_CAREER_INTERNSHIP_TYPE_ID", "CAREER_ID", "INTERNSHIP_TYPE_ID") VALUES (21, 7, 1);
INSERT INTO "t_career_internship_type" ("ID_CAREER_INTERNSHIP_TYPE_ID", "CAREER_ID", "INTERNSHIP_TYPE_ID") VALUES (22, 5, 1);

-- --------------------------------------------------------
-- Tabla: t_change_log (584 registros)
-- --------------------------------------------------------
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (106, 21, 'CAREER_TYPE', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (120, 23, 'GRADE', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (151, 15, 'KEY', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (119, 23, 'REPORT_TITLE', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (101, 20, 'INSTITUTION_CODE', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (82, 19, 'TUTOR_ID', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (137, 24, 'CREATION_DATE', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (136, 24, 'OBSERVATION', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (149, 15, 'USER_KEY_ID', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (93, 20, 'INSTITUTION_CONTACT', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (135, 24, 'SCORE', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (131, 23, 'EVALUATION_STATUS', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (142, 25, 'VISIT_DATE', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (66, 18, 'SECOND_SURNAME', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (89, 19, 'STATUS', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (109, 22, 'PERIOD_ID', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (57, 17, 'PERMISSIONS_ID', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (146, 25, 'OBSERVATIONS', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (139, 25, 'VISIT_ID', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (143, 25, 'VISIT_TYPE', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (98, 20, 'INSTITUTION_TYPE', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (64, 18, 'SECOND_NAME', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (145, 25, 'ACTIVITIES_PERFORMED', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (104, 21, 'CAREER_CODE', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (102, 21, 'CAREER_ID', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (71, 18, 'EMAIL', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (2, 14, 'NAME', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (72, 18, 'ADDRESS', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (83, 19, 'USER_ID', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (125, 23, 'MANAGER_ID', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (77, 18, 'STUDENT_TYPE', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (140, 25, 'PROFESSIONAL_PRACTICE_ID', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (153, 15, 'END_DATE', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (73, 18, 'CAREER_ID', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (56, 16, 'STATUS', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (123, 23, 'STUDENTS_ID', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (91, 20, 'INSTITUTION_NAME', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (152, 15, 'START_DATE', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (112, 22, 'DESCRIPTION', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (96, 20, 'NUCLEUS', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (107, 21, 'MINIMUM_GRADE', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (108, 21, 'STATUS', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (65, 18, 'SURNAME', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (85, 19, 'NAME', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (78, 18, 'MILITARY_RANK', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (133, 24, 'PRACTICE_ID', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (100, 20, 'RIF', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (113, 22, 'PERIOD_STATUS', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (55, 16, 'DESCRIPTION', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (68, 18, 'BIRTHDATE', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (128, 23, 'INTERNSHIP_STATUS', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (129, 23, 'INTERNSHIP_TYPE_ID', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (80, 18, 'STATUS', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (110, 22, 'START_DATE', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (99, 20, 'STATUS', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (94, 20, 'PRACTICE_TYPE', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (95, 20, 'REGION', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (122, 23, 'INSTITUTION_ID', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (62, 18, 'STUDENTS_CI', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (127, 23, 'ENROLLMENT', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (117, 23, 'START_DATE', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (155, 15, 'IS_TEMPORARY', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (97, 20, 'EXTENSION', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (114, 22, 'STATUS', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (156, 14, 'LAST_LOGIN', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (126, 23, 'OBSERVATION', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (132, 24, 'EVALUATION_ID', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (67, 18, 'GENDER', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (76, 18, 'REGIME', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (69, 18, 'MARITAL_STATUS', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (81, 18, 'USER_ID', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (79, 18, 'EMPLOYMENT', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (90, 20, 'INSTITUTION_ID', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (134, 24, 'EVALUATOR_ID', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (59, 17, 'DESCRIPTION', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (116, 23, 'PROFESSIONAL_PRACTICE_ID', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (84, 19, 'TUTOR_CI', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (74, 18, 'SEMESTER', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (141, 25, 'TUTOR_ID', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (138, 24, 'STATUS', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (54, 16, 'NAME', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (103, 21, 'CAREER_NAME', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (115, 22, 'T_INTERNSHIPS_CODE', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (148, 25, 'STATUS', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (4, 14, 'STATUS', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (53, 16, 'ID_ROLS', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (92, 20, 'INSTITUTION_ADDRESS', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (58, 17, 'NAME', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (1, 14, 'USER_CI', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (111, 22, 'END_DATE', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (86, 19, 'SURNAME', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (70, 18, 'CONTACT_PHONE', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (60, 17, 'STATUS', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (105, 21, 'CAREER_ABBREVIATION', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (75, 18, 'SECTION', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (124, 23, 'STATUS', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (3, 14, 'EMAIL', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (61, 18, 'STUDENTS_ID', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (87, 19, 'EMAIL', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (147, 25, 'RECOMMENDATIONS', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (121, 23, 'PERIOD_ID', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (154, 15, 'STATUS', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (150, 15, 'USER_ID', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (63, 18, 'NAME', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (118, 23, 'END_DATE', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (88, 19, 'PHONE', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (130, 23, 'PRACTICES_STATUS', 1);
INSERT INTO "t_columns" ("COLUMN_ID", "TABLE_ID", "COLUMN_NAME", "STATUS") VALUES (144, 25, 'HOURS_WORKED', 1);

-- --------------------------------------------------------
-- Tabla: t_config (1 registros)
-- --------------------------------------------------------
INSERT INTO "t_config" ("CONFIG_ID", "RECOVERY_EMAIL", "BLOCKING_DAYS", "WRONG_KEY_LOCK", "ATTEMPTS_KEY_BLOCK", "KEY_EXPIRATION", "EXPIRATION_DAYS", "USER_UPPERCASE", "USER_LOWERCASE", "USER_NUMBERS", "USER_SPECIAL_CHARACTERS", "USER_NUM_UPPERCASE", "USER_NUM_LOWERCASE", "USER_NUM_NUMBERS", "USER_NUM_SPECIAL_CHARACTERS", "KEY_UPPERCASE", "KEY_LOWERCASE", "KEY_NUMBERS", "KEY_SPECIAL_CHARACTERS", "KEY_NUM_UPPERCASE", "KEY_NUM_LOWERCASE", "KEY_NUM_NUMBERS", "KEY_NUM_SPECIAL_CHARACTERS", "USER_LENGTH", "KEY_LEGTH", "SECURITY_QUESTIONS", "TOTAL_QUESTIONS", "TOTAL_PRESET_QUESTIONS", "TOTAL_USER_QUESTIONS", "TOTAL_ANSWERS", "PERIOD_VALIDATION_RULES", "EVALUATION_CONFIG", "SESSION_MAX_HOURS", "RECOVERY_LINK_EXPIRY_HOURS") VALUES (1, 1, 0, 1, 4, 2, 90, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 6, 20, 1, 3, 3, 0, 3, '{"visit":{"create":{"skipPeriodStatusCheck":false},"update":{"skipPeriodStatusCheck":false}},"enrollment":{"create":{"usePeriodGraceDays":true,"skipPeriodStatusCheck":false},"update":{"usePeriodGraceDays":true,"skipPeriodStatusCheck":false}},"evaluation":{"create":{"extendEndDateDays":10,"usePeriodGraceDays":true,"skipPeriodStatusCheck":false,"requirePracticesStatusInscribed":true},"update":{"extendEndDateDays":10,"usePeriodGraceDays":true,"skipPeriodStatusCheck":false,"requirePracticesStatusInscribed":true}},"pre-enrollment":{"create":{"skipPeriodStatusCheck":false},"update":{"skipPeriodStatusCheck":true}}}', '{"score":{"max":20,"min":1,"displayScale":20},"weights":{"COMITE":0.3,"ACADEMICO":0.3,"INSTITUCIONAL":0.4},"evaluationWindowDays":10}', 24, 78);

-- --------------------------------------------------------
-- Tabla: t_coordinadores (2 registros)
-- --------------------------------------------------------
INSERT INTO "t_email_templates" ("id", "name", "description", "category", "subject", "body_html", "created_at", "updated_at") VALUES (5, 'Inicio de Lapso Académico', 'Notificar a estudiantes sobre el inicio de un nuevo período académico', 'periodo', '📢 Inicio de lapso {{periodo}}', '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: #1e40af; padding: 20px; text-align: center; color: white;"><h1 style="margin: 0;">SIGP UNEFA</h1></div><div style="padding: 24px; color: #1e293b;"><h2>¡Bienvenido al {{periodo}}, {{nombre}}!</h2><p>Informamos que el lapso académico <strong>{{periodo}}</strong> ha dado inicio el día <strong>{{fecha_inicio}}</strong>.</p><p>Te recordamos mantener tus datos al día y revisar las actividades programadas para este período.</p><hr style="border-top: 1px solid #e2e8f0;"><p style="font-size: 12px; color: #94a3b8; text-align: center;">SIGP UNEFA — Sistema de Gestión de Personal</p></div></div>', '2026-06-16T03:24:37.541816+00:00', '2026-06-16T03:24:37.541816+00:00');
INSERT INTO "t_email_templates" ("id", "name", "description", "category", "subject", "body_html", "created_at", "updated_at") VALUES (6, 'Fin de Lapso Académico', 'Notificar a estudiantes sobre el cierre del período académico', 'periodo', '⏰ Cierre de lapso {{periodo}}', '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: #1e40af; padding: 20px; text-align: center; color: white;"><h1 style="margin: 0;">SIGP UNEFA</h1></div><div style="padding: 24px; color: #1e293b;"><h2>Cierre del {{periodo}}</h2><p>Hola {{nombre}},</p><p>Te informamos que el lapso académico <strong>{{periodo}}</strong> finaliza el <strong>{{fecha_fin}}</strong>.</p><p>Asegurate de tener toda tu documentación al día antes del cierre.</p><hr style="border-top: 1px solid #e2e8f0;"><p style="font-size: 12px; color: #94a3b8; text-align: center;">SIGP UNEFA — Sistema de Gestión de Personal</p></div></div>', '2026-06-16T03:24:37.541816+00:00', '2026-06-16T03:24:37.541816+00:00');
INSERT INTO "t_email_templates" ("id", "name", "description", "category", "subject", "body_html", "created_at", "updated_at") VALUES (7, 'Reporte de Evaluación', 'Notificar a tutores sobre reportes de evaluación disponibles', 'evaluacion', '📋 Reporte de evaluación disponible', '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: #1e40af; padding: 20px; text-align: center; color: white;"><h1 style="margin: 0;">SIGP UNEFA</h1></div><div style="padding: 24px; color: #1e293b;"><h2>Reporte de Evaluación</h2><p>Hola {{nombre}},</p><p>Tenés disponible el reporte de evaluación del período <strong>{{periodo}}</strong>.</p><p>Ingresá al sistema para revisar los resultados y completar las evaluaciones pendientes de tus estudiantes asignados.</p><hr style="border-top: 1px solid #e2e8f0;"><p style="font-size: 12px; color: #94a3b8; text-align: center;">SIGP UNEFA — Sistema de Gestión de Personal</p></div></div>', '2026-06-16T03:24:37.541816+00:00', '2026-06-16T03:24:37.541816+00:00');
INSERT INTO "t_email_templates" ("id", "name", "description", "category", "subject", "body_html", "created_at", "updated_at") VALUES (8, 'Aviso General', 'Plantilla genérica para comunicados institucionales', 'general', '{{asunto}}', '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: #1e40af; padding: 20px; text-align: center; color: white;"><h1 style="margin: 0;">SIGP UNEFA</h1></div><div style="padding: 24px; color: #1e293b;"><h2>{{asunto}}</h2><p>Hola {{nombre}},</p><p>{{mensaje}}</p><hr style="border-top: 1px solid #e2e8f0;"><p style="font-size: 12px; color: #94a3b8; text-align: center;">SIGP UNEFA — Sistema de Gestión de Personal</p></div></div>', '2026-06-16T03:24:37.541816+00:00', '2026-06-16T03:24:37.541816+00:00');

-- --------------------------------------------------------
-- Tabla: t_enrollment_field_changes (13 registros)
-- --------------------------------------------------------
INSERT INTO "t_estado" ("estado_id", "iso_31662", "name", "capital") VALUES (1, 'VE-X', 'Amazonas', 'Puerto Ayacucho');
INSERT INTO "t_estado" ("estado_id", "iso_31662", "name", "capital") VALUES (2, 'VE-B', 'Anzoátegui', 'Barcelona');
INSERT INTO "t_estado" ("estado_id", "iso_31662", "name", "capital") VALUES (3, 'VE-C', 'Apure', 'San Fernando de Apure');
INSERT INTO "t_estado" ("estado_id", "iso_31662", "name", "capital") VALUES (4, 'VE-D', 'Aragua', 'Maracay');
INSERT INTO "t_estado" ("estado_id", "iso_31662", "name", "capital") VALUES (5, 'VE-E', 'Barinas', 'Barinas');
INSERT INTO "t_estado" ("estado_id", "iso_31662", "name", "capital") VALUES (6, 'VE-F', 'Bolívar', 'Ciudad Bolívar');
INSERT INTO "t_estado" ("estado_id", "iso_31662", "name", "capital") VALUES (7, 'VE-G', 'Carabobo', 'Valencia');
INSERT INTO "t_estado" ("estado_id", "iso_31662", "name", "capital") VALUES (8, 'VE-H', 'Cojedes', 'San Carlos');
INSERT INTO "t_estado" ("estado_id", "iso_31662", "name", "capital") VALUES (9, 'VE-Y', 'Delta Amacuro', 'Tucupita');
INSERT INTO "t_estado" ("estado_id", "iso_31662", "name", "capital") VALUES (10, 'VE-I', 'Falcón', 'Coro');
INSERT INTO "t_estado" ("estado_id", "iso_31662", "name", "capital") VALUES (11, 'VE-J', 'Guárico', 'San Juan de Los Morros');
INSERT INTO "t_estado" ("estado_id", "iso_31662", "name", "capital") VALUES (12, 'VE-K', 'Lara', 'Barquisimeto');
INSERT INTO "t_estado" ("estado_id", "iso_31662", "name", "capital") VALUES (13, 'VE-L', 'Mérida', 'Mérida');
INSERT INTO "t_estado" ("estado_id", "iso_31662", "name", "capital") VALUES (14, 'VE-M', 'Miranda', 'Los Teques');
INSERT INTO "t_estado" ("estado_id", "iso_31662", "name", "capital") VALUES (15, 'VE-N', 'Monagas', 'Maturín');
INSERT INTO "t_estado" ("estado_id", "iso_31662", "name", "capital") VALUES (16, 'VE-O', 'Nueva Esparta', 'La Asunción');
INSERT INTO "t_estado" ("estado_id", "iso_31662", "name", "capital") VALUES (17, 'VE-P', 'Portuguesa', 'Guanare');
INSERT INTO "t_estado" ("estado_id", "iso_31662", "name", "capital") VALUES (18, 'VE-R', 'Sucre', 'Cumaná');
INSERT INTO "t_estado" ("estado_id", "iso_31662", "name", "capital") VALUES (19, 'VE-S', 'Táchira', 'San Cristóbal');
INSERT INTO "t_estado" ("estado_id", "iso_31662", "name", "capital") VALUES (20, 'VE-T', 'Trujillo', 'Trujillo');
INSERT INTO "t_estado" ("estado_id", "iso_31662", "name", "capital") VALUES (21, 'VE-W', 'Vargas', 'La Guaira');
INSERT INTO "t_estado" ("estado_id", "iso_31662", "name", "capital") VALUES (22, 'VE-U', 'Yaracuy', 'San Felipe');
INSERT INTO "t_estado" ("estado_id", "iso_31662", "name", "capital") VALUES (23, 'VE-V', 'Zulia', 'Maracaibo');
INSERT INTO "t_estado" ("estado_id", "iso_31662", "name", "capital") VALUES (24, 'VE-A', 'Distrito Capital', 'Caracas');

-- --------------------------------------------------------
-- Tabla: t_evaluation (34 registros)
-- --------------------------------------------------------
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (41, 1, 'Usa vocabulario apropiado para la audiencia', 'COMITE', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (42, 2, 'El volumen de voz proyectado es lo suficientemente alto para ser escuchado por todos los presentes.', 'COMITE', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (43, 3, 'Mantiene el contacto visual con el público.', 'COMITE', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (44, 4, 'Actitud de elegancia en apariencia y modales ante el Comité Evaluador.', 'COMITE', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (45, 5, 'Demuestra un completo entendimiento y dominio del tema.', 'COMITE', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (46, 6, 'Hace un uso adecuado del tiempo disponible.', 'COMITE', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (47, 7, 'Utiliza adecuadamente las ayudas audiovisuales.', 'COMITE', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (48, 8, 'Las ayudas audiovisuales son coherentes y pertinentes con el trabajo presentado.', 'COMITE', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (49, 9, 'Expresa la razón de ser de la práctica profesional, señalando el por qué y para qué de las mismas.', 'COMITE', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (50, 10, 'Reseña las actividades realizadas en el Centro de Práctica Profesional.', 'COMITE', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (51, 11, 'Describe el conocimiento teórico o práctico obtenido en la práctica profesional.', 'COMITE', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (52, 12, 'Explica las conclusiones derivadas del proceso de práctica profesional', 'COMITE', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (53, 13, 'Refiere las recomendaciones pertinentes a la Universidad, Institución y futuros pasantes.', 'COMITE', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (54, 14, 'Define palabras o conceptos que pueden ser nuevos.', 'COMITE', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (55, 15, 'El estudiante contesta con precisión las preguntas planteadas sobre el tema.', 'COMITE', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (21, 1, 'Cumple con el horario de las asesorías académicas pautadas', 'ACADEMICO', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (22, 2, 'Diseña plan de trabajo para atender sus necesidades académicas de acuerdo con los objetivos planteados.', 'ACADEMICO', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (23, 3, 'Mantiene comunicación con el (la) tutor(a) académico sobre sus avances durante la práctica profesional', 'ACADEMICO', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (24, 4, 'Demuestra interés frente a las recomendaciones y observaciones hechas a su desempeño', 'ACADEMICO', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (25, 5, 'Aplica conocimientos teóricos en el desarrollo de las actividades que le asignan en la institución', 'ACADEMICO', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (26, 6, 'Muestra disposición hacia la autogestión de su conocimiento', 'ACADEMICO', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (27, 7, 'Mantiene una actitud respetuosa', 'ACADEMICO', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (28, 8, 'Mantuvo un seguimiento sistemático de las actividades y acuerdos establecidos durante la tutoría', 'ACADEMICO', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (29, 9, 'Comunica sus ideas en forma clara, coherente y precisa', 'ACADEMICO', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (30, 10, 'Maneja en forma asertiva los conocimientos técnicos adquiridos en su formación', 'ACADEMICO', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (31, 11, '¿La Estructura del Informe está organizado de acuerdo a los parámetros establecidos en el Manual y Reglamento de las Prácticas Profesionales?', 'ACADEMICO', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (32, 12, '¿En la elaboración del Informe se evidencia el uso de los conocimientos técnicos adquiridos durante la carrera?', 'ACADEMICO', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (33, 13, '¿El Informe es redactado con coherencia, claridad y consistencia de la información?', 'ACADEMICO', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (34, 14, '¿El (la) estudiante demuestra en el informe, tener habilidades para describir y analizar los hechos de la realidad observada?', 'ACADEMICO', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (35, 15, '¿El (la) estudiante maneja con precisión y eficacia los aspectos teóricos inherentes a las actividades realizadas?', 'ACADEMICO', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (36, 16, '¿Son relevantes los aportes hechos por el (la) estudiante hacia la institución y hacia la universidad?', 'ACADEMICO', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (37, 17, '¿El Informe describe en forma detallada las actividades desarrolladas en la práctica profesional?', 'ACADEMICO', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (38, 18, '¿Los argumentos utilizados por el (la) estudiante son adecuados a las soluciones técnicas que propuso?', 'ACADEMICO', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (39, 19, '¿Demuestra el (la) estudiante, tener capacidad de síntesis?', 'ACADEMICO', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (40, 20, '¿El Informe cumple con las exigencias de presentación, redacción y ortografía?', 'ACADEMICO', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (1, 1, 'Cumplimiento del horario normal de trabajo.', 'INSTITUCIONAL', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (2, 2, 'Capacidad para proponer espontánea y oportunamente sugerencias útiles para la organización, tomar acciones para mejorar prácticas o procedimientos que contribuyen a eliminar obstáculos.', 'INSTITUCIONAL', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (3, 3, 'Aporte original de soluciones para mejorar situaciones de trabajo.', 'INSTITUCIONAL', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (4, 4, 'Facilidad de comunicación verbal y escrita: habilidad para dar a conocer y defender sus ideas.', 'INSTITUCIONAL', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (5, 5, 'Receptividad a planteamientos diferentes a los presentados por él o la estudiante', 'INSTITUCIONAL', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (6, 6, 'Responsabilidad en la ejecución de las actividades cumpliendo con las condiciones de tiempo y calidad preestablecidas.', 'INSTITUCIONAL', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (7, 7, 'Cumplimiento y aplicación de normas de seguridad y de prevención de accidentes.', 'INSTITUCIONAL', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (8, 8, 'Disposición para colaborar con los (las) compañeros(as) de trabajo, y con los (las) supervisores(as) en forma permanente y espontánea.', 'INSTITUCIONAL', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (9, 9, 'Adaptación a situaciones cambiantes o demandas del entorno.', 'INSTITUCIONAL', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (10, 10, 'Participación y compromiso en la realización de los trabajos asignados', 'INSTITUCIONAL', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (12, 12, 'Calidad de los resultados que presenta como producto de su trabajo', 'INSTITUCIONAL', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (11, 11, 'Productividad en función de las metas planificadas y alcanzadas durante el período de práctica', 'INSTITUCIONAL', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (13, 13, 'Manejo y conocimiento de técnicas y procedimientos inherentes a las actividades asignadas.', 'INSTITUCIONAL', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (14, 14, 'Compromiso con las metas de la empresa u organización', 'INSTITUCIONAL', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (15, 15, 'Habilidades para establecer relaciones interpersonales y facilidad para trabajo en equipo', 'INSTITUCIONAL', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (16, 16, 'Habilidades y destrezas en el manejo de herramientas informáticas para la solución de problemas', 'INSTITUCIONAL', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (17, 17, 'Disposición favorable para aprender significativamente', 'INSTITUCIONAL', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (18, 18, 'Capacidad para obtener información respecto a su entorno y compartirla con el resto del personal', 'INSTITUCIONAL', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (19, 19, 'Capacidad de trabajo bajo condiciones adversas de tiempo', 'INSTITUCIONAL', 1);
INSERT INTO "t_evaluation_criteria" ("CRITERIA_ID", "ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES (20, 20, 'Habilidades para el trabajo en equipo por encima de las diferencias personales', 'INSTITUCIONAL', 1);

-- --------------------------------------------------------
-- Tabla: t_evaluation_detail (345 registros)
-- --------------------------------------------------------
INSERT INTO "t_internship_type" ("INTERNSHIP_TYPE_ID", "NAME", "PRIORITY", "CREATION_DATE", "STATUS", "HOURS_REQUIRED") VALUES (1, 'ÚNICA', 0, '2026-06-16T03:12:17.850399', 1, 360);
INSERT INTO "t_internship_type" ("INTERNSHIP_TYPE_ID", "NAME", "PRIORITY", "CREATION_DATE", "STATUS", "HOURS_REQUIRED") VALUES (2, 'HOSPITALARIA', 2, '2026-06-16T03:12:17.850399', 1, 480);
INSERT INTO "t_internship_type" ("INTERNSHIP_TYPE_ID", "NAME", "PRIORITY", "CREATION_DATE", "STATUS", "HOURS_REQUIRED") VALUES (3, 'COMUNITARIA', 1, '2026-06-16T03:12:17.850399', 1, 360);

-- --------------------------------------------------------
-- Tabla: t_internships_period (9 registros)
-- --------------------------------------------------------
INSERT INTO "t_knowledge_base" ("id", "title", "category", "content", "embedding", "metadata", "roles", "is_active", "created_at", "updated_at") VALUES ('88396492-eef6-457c-a326-530e576abd8e', 'Inscripción de Estudiante', 'process', '## Inscripción de Estudiante

### Requisitos
- CI del estudiante (original y copia)
- Datos de contacto (teléfono, email, dirección)
- Partida de nacimiento (original y copia)
- Título de bachiller (original y copia)

### Paso a Paso
1. **Navegar al módulo**: Ve a Estudiantes > Nuevo Estudiante
2. **Datos personales**: Completa CI, nombre, apellido, fecha de nacimiento, lugar de nacimiento
3. **Datos académicos**: Selecciona carrera, período, turno (mañana/tarde/noche)
4. **Contacto**: Ingresa teléfono, email, dirección de habitación
5. **Guardar**: Haz clic en Guardar. El sistema crea el usuario automáticamente.
6. **Verificar**: Confirma que el estudiante aparezca en el listado de estudiantes

### Tiempo estimado
10-15 minutos

### Rol requerido
Administrador o Asistente', NULL, '{"tags":["estudiantes","inscripcion","nuevo","registro"],"screen":"/students","relatedModules":["students","users"]}', '{"0","1","2"}', TRUE, '2026-06-16T03:26:39.285393+00:00', '2026-06-16T03:26:39.285393+00:00');
INSERT INTO "t_knowledge_base" ("id", "title", "category", "content", "embedding", "metadata", "roles", "is_active", "created_at", "updated_at") VALUES ('b7b8254e-50cc-4787-84b1-276a6754059c', 'Registro de Pasantía', 'process', '## Registro de Pasantía / Práctica Profesional

### Requisitos
- Estudiante activo en el sistema
- Institución/empresa registrada
- Tutor académico asignado
- Período académico activo

### Paso a Paso
1. **Ir a Pasantías**: Ve al módulo de Pasantías desde el menú principal
2. **Nuevo registro**: Haz clic en "Nueva Pasantía"
3. **Seleccionar estudiante**: Busca y selecciona el estudiante por CI o nombre
4. **Datos de la pasantía**: Completa institución, tutor, fechas de inicio y fin
5. **Tipo de pasantía**: Selecciona si es académica, metodológica o profesional
6. **Guardar**: Haz clic en Guardar
7. **Asignar tutor**: Si no se asignó antes, ve a la sección de Tutores

### Tiempo estimado
15-20 minutos

### Rol requerido
Administrador o Asistente', NULL, '{"tags":["pasantias","practicas","registro","tutores"],"screen":"/tracking","relatedModules":["tracking","tutors","institutions"]}', '{"0","1","2"}', TRUE, '2026-06-16T03:26:39.668961+00:00', '2026-06-16T03:26:39.668961+00:00');
INSERT INTO "t_knowledge_base" ("id", "title", "category", "content", "embedding", "metadata", "roles", "is_active", "created_at", "updated_at") VALUES ('65a05f0a-5ae0-44c6-9d6c-4d685eb76ec6', 'Solicitud de Documentos', 'process', '## Solicitud de Documentos (Estudiante)

### Requisitos
- Estudiante activo en el sistema
- Haber iniciado sesión como estudiante

### Paso a Paso
1. **Iniciar sesión**: Ingresa con tu usuario de estudiante
2. **Ir a solicitudes**: Ve a Solicitudes o Documentos desde el panel
3. **Nueva solicitud**: Haz clic en "Nueva Solicitud"
4. **Tipo de documento**: Selecciona el tipo (certificado de estudio, constancia, etc.)
5. **Motivo**: Describe brevemente el motivo de la solicitud
6. **Enviar**: Haz clic en Enviar
7. **Seguimiento**: Puedes ver el estado de tu solicitud en Mis Solicitudes

### Tiempo estimado
5 minutos

### Rol requerido
Estudiante', NULL, '{"tags":["documentos","solicitudes","estudiante","certificados"],"screen":"/student/requests","relatedModules":["student-requests","documents"]}', '{"3","4"}', TRUE, '2026-06-16T03:26:40.072496+00:00', '2026-06-16T03:26:40.072496+00:00');
INSERT INTO "t_knowledge_base" ("id", "title", "category", "content", "embedding", "metadata", "roles", "is_active", "created_at", "updated_at") VALUES ('545bbcda-1beb-4492-93ce-adec657b3c59', 'Configuración de Período Académico', 'process', '## Configuración de Período Académico

### Requisitos
- Ser administrador del sistema

### Paso a Paso
1. **Ir a Períodos**: Ve al módulo de Períodos desde el menú principal
2. **Nuevo período**: Haz clic en "Nuevo Período"
3. **Completar datos**: Ingresa nombre del período, fecha de inicio y fecha de fin
4. **Estado**: Actívalo si es el período actual
5. **Guardar**: Haz clic en Guardar
6. **Verificar**: El período debe aparecer en el calendario y en los listados

### Consejos
- No actives más de un período a la vez
- Las fechas deben ser coherentes (inicio anterior a fin)
- Puedes editar un período después de creado

### Tiempo estimado
5 minutos

### Rol requerido
Administrador', NULL, '{"tags":["periodos","configuracion","calendario","semestre"],"screen":"/periods","relatedModules":["periods"]}', '{"0","1"}', TRUE, '2026-06-16T03:26:40.476273+00:00', '2026-06-16T03:26:40.476273+00:00');
INSERT INTO "t_knowledge_base" ("id", "title", "category", "content", "embedding", "metadata", "roles", "is_active", "created_at", "updated_at") VALUES ('11ab8521-f400-4335-bbf0-db94269503ba', '¿Cómo crear un reporte?', 'process', '## Creación de Reportes

### Paso a Paso
1. **Ir a Reportes**: Ve al módulo de Reportes desde el menú principal
2. **Seleccionar tipo**: Elige el tipo de reporte (estudiantes, pasantías, evaluaciones, etc.)
3. **Filtros**: Completa los filtros disponibles (período, carrera, fechas, etc.)
4. **Vista previa**: Haz clic en "Vista Previa" para ver el resultado
5. **Exportar**: Puedes exportar a PDF, Excel o imprimir directamente
6. **Guardar**: Si lo deseas, guarda el reporte para consultarlo después

### Formatos disponibles
- PDF (para imprimir o enviar)
- Excel (para análisis de datos)
- Vista en pantalla

### Tiempo estimado
5-10 minutos

### Rol requerido
Administrador, Asistente o Tutor (según el tipo de reporte)', NULL, '{"tags":["reportes","exportar","pdf","excel","estadisticas"],"screen":"/reports","relatedModules":["reports"]}', NULL, TRUE, '2026-06-16T03:26:40.675843+00:00', '2026-06-16T03:26:40.675843+00:00');
INSERT INTO "t_knowledge_base" ("id", "title", "category", "content", "embedding", "metadata", "roles", "is_active", "created_at", "updated_at") VALUES ('d1b32c7e-3238-408c-89e9-1bd8d471a606', 'Preguntas Frecuentes del Sistema', 'faq', '## Preguntas Frecuentes

### ¿Cómo recupero mi contraseña?
Haz clic en "¿Olvidaste tu contraseña?" en la pantalla de inicio de sesión. Ingresa tu correo electrónico y sigue las instrucciones.

### ¿Qué hago si no puedo iniciar sesión?
Verifica que tu usuario y contraseña sean correctos. Si el problema persiste, contacta al administrador del sistema.

### ¿Cómo actualizo mis datos personales?
Ve a tu perfil (icono de usuario en la esquina superior derecha) y selecciona "Editar Perfil".

### ¿Cómo cambio mi contraseña?
En tu perfil, selecciona "Cambiar Contraseña". Ingresa tu contraseña actual y la nueva.

### El sistema no carga correctamente
- Verifica tu conexión a internet
- Limpia la caché del navegador
- Intenta con otro navegador (Chrome, Firefox, Edge)
- Si el problema persiste, contacta al administrador', NULL, '{"tags":["faq","preguntas","ayuda","soporte"]}', NULL, TRUE, '2026-06-16T03:26:40.920663+00:00', '2026-06-16T03:26:40.920663+00:00');
INSERT INTO "t_knowledge_base" ("id", "title", "category", "content", "embedding", "metadata", "roles", "is_active", "created_at", "updated_at") VALUES ('9e25e088-4cc7-4a8c-b7f1-9fb8380e42da', '¿Qué carreras ofrece la UNEFA?', 'faq', '## Carreras de la UNEFA

La Universidad Nacional Experimental Politécnica de la Fuerza Armada (UNEFA) ofrece diversas carreras en modalidad presencial y a distancia.

Para ver la lista actualizada de carreras disponibles:
1. Ve al módulo de Carreras si eres administrador
2. O consulta con el departamento de registro académico

Las carreras se dividen en:
- **Pregrado**: Ingenierías, licenciaturas y programas nacionales de formación
- **Postgrado**: Especializaciones, maestrías y doctorados

*Nota: Esta información es referencial. Consulta el pensum actualizado en el módulo de Carreras del sistema.*', NULL, '{"tags":["carreras","unefa","pregrado","postgrado","ingenieria"]}', NULL, TRUE, '2026-06-16T03:26:41.114055+00:00', '2026-06-16T03:26:41.114055+00:00');
INSERT INTO "t_knowledge_base" ("id", "title", "category", "content", "embedding", "metadata", "roles", "is_active", "created_at", "updated_at") VALUES ('f9f0ece0-02bf-4215-b1d2-7569bc99fa0c', 'Reglamento de Pasantías (Resumen)', 'regulation', '## Reglamento de Pasantías y Prácticas Profesionales

### Disposiciones Generales
- Las pasantías son obligatorias para la obtención del título
- Deben realizarse en instituciones públicas o privadas legalmente constituidas
- La duración mínima es de 160 horas académicas (o según lo establecido en cada pensum)

### Requisitos del Estudiante
- Haber aprobado el 75% de las unidades curriculares de la carrera
- Estar inscrito en el período académico correspondiente
- No tener sanciones disciplinarias vigentes

### Obligaciones
- Cumplir con el horario establecido por la institución receptora
- Presentar informes periódicos de avance
- Asistir a las reuniones de seguimiento con el tutor académico

### Evaluación
- El tutor académico evalúa el desempeño del estudiante
- La institución receptora emite una constancia de culminación
- La nota final se registra en el sistema de evaluaciones

*Fuente: Reglamento General de la UNEFA. Para el texto completo, contacta a la Dirección de Asuntos Académicos.*', NULL, '{"tags":["reglamento","pasantias","practicas","normativa"],"source":"Reglamento General UNEFA"}', '{"0","1","2"}', TRUE, '2026-06-16T03:26:41.326294+00:00', '2026-06-16T03:26:41.326294+00:00');

-- --------------------------------------------------------
-- Tabla: t_landing_config (13 registros)
-- --------------------------------------------------------
INSERT INTO "t_landing_config" ("config_id", "config_key", "config_value", "updated_at", "updated_by") VALUES (7, 'hero_title', '"Sistema de Seguimiento de Pasantías"', '2026-06-16T03:24:26.319296', 'system');
INSERT INTO "t_landing_config" ("config_id", "config_key", "config_value", "updated_at", "updated_by") VALUES (8, 'hero_subtitle', '"Gestioná y realizá el seguimiento de tus pasantías de manera eficiente"', '2026-06-16T03:24:26.319296', 'system');
INSERT INTO "t_landing_config" ("config_id", "config_key", "config_value", "updated_at", "updated_by") VALUES (9, 'features', '[{"icon":"Briefcase","title":"Gestión de Pasantías","description":"Administrá todo el ciclo de pasantías desde una sola plataforma"},{"icon":"Users","title":"Seguimiento Académico","description":"Realizá el seguimiento continuo del progreso de los estudiantes"},{"icon":"FileText","title":"Documentación Digital","description":"Gestioná toda la documentación requerida de forma digital"}]', '2026-06-16T03:24:26.319296', 'system');
INSERT INTO "t_landing_config" ("config_id", "config_key", "config_value", "updated_at", "updated_by") VALUES (10, 'stats', '[{"label":"Estudiantes Activos","value":0},{"label":"Instituciones","value":0},{"label":"Tutores Registrados","value":0},{"label":"Pasantías Completadas","value":0}]', '2026-06-16T03:24:26.319296', 'system');
INSERT INTO "t_landing_config" ("config_id", "config_key", "config_value", "updated_at", "updated_by") VALUES (11, 'about_title', 'Sobre el Sistema', '2026-06-16T03:24:26.319296', 'system');
INSERT INTO "t_landing_config" ("config_id", "config_key", "config_value", "updated_at", "updated_by") VALUES (12, 'about_content', 'El Sistema de Gestión de Pasantías (SGP) es una plataforma integral diseñada para facilitar la administración, seguimiento y evaluación de las pasantías profesionales.', '2026-06-16T03:24:26.319296', 'system');
INSERT INTO "t_landing_config" ("config_id", "config_key", "config_value", "updated_at", "updated_by") VALUES (13, 'reminder_rules', '[{"id":"seed_pending_eval","name":"Evaluaciones pendientes","type":"pending_evaluation","active":true,"createdAt":"2026-06-16T03:26:36.629Z","sendEmail":true,"updatedAt":"2026-06-16T03:26:36.629Z","description":"Notifica a tutores sobre evaluaciones sin calificar","daysThreshold":null,"templateTitle":"📋 Evaluación pendiente","targetRoleName":"tutor","templateMessage":"Tenés {{count}} evaluación(es) sin calificar."},{"id":"seed_upcoming_visit","name":"Visitas próximas","type":"upcoming_visit","active":true,"createdAt":"2026-06-16T03:26:36.630Z","sendEmail":true,"updatedAt":"2026-06-16T03:26:36.630Z","description":"Recuerda a tutores sobre visitas programadas","daysThreshold":3,"templateTitle":"📅 Visita programada","targetRoleName":"tutor","templateMessage":"Tenés una visita con {{student}} para el {{date}}."},{"id":"seed_overdue_report","name":"Bitácora vencida","type":"overdue_report","active":true,"createdAt":"2026-06-16T03:26:36.630Z","sendEmail":true,"updatedAt":"2026-06-16T03:26:36.630Z","description":"Notifica a estudiantes sin actividad por más de 7 días","daysThreshold":7,"templateTitle":"⚠️ Bitácora pendiente","targetRoleName":"estudiante","templateMessage":"No registrás actividades desde {{lastDate}}. Pasó el reporte semanal."},{"id":"seed_pending_doc","name":"Documentos pendientes","type":"pending_document","active":true,"createdAt":"2026-06-16T03:26:36.630Z","sendEmail":true,"updatedAt":"2026-06-16T03:26:36.630Z","description":"Recuerda a estudiantes sobre documentos rechazados o sin aprobar","daysThreshold":null,"templateTitle":"📄 Documentos pendientes","targetRoleName":"estudiante","templateMessage":"Tenés {{count}} documento(s) pendiente(s): {{docs}}."}]', '2026-06-16T03:26:51.945', 'system');
INSERT INTO "t_landing_config" ("config_id", "config_key", "config_value", "updated_at", "updated_by") VALUES (16, 'dashboard_layout_4', '{"widgets":[{"key":"student-progress","order":0,"visible":true},{"key":"student-internship-info","order":1,"visible":true},{"key":"student-activity-log","order":2,"visible":true},{"key":"student-quick-actions","size":"xl","order":3,"visible":true},{"key":"student-documents-status","size":"xl","order":4,"visible":false}]}', '2026-06-21T22:45:09.855', '1');
INSERT INTO "t_landing_config" ("config_id", "config_key", "config_value", "updated_at", "updated_by") VALUES (17, 'dashboard_layout_role_3', '{"widgets":[{"key":"tutor-quick-stats","order":0,"visible":true},{"key":"tutor-students-chart","order":1,"visible":true},{"key":"tutor-status-distribution","order":2,"visible":true},{"key":"tutor-grade-averages","order":3,"visible":false}]}', '2026-06-22T12:58:02.137152', '1');
INSERT INTO "t_landing_config" ("config_id", "config_key", "config_value", "updated_at", "updated_by") VALUES (18, 'dashboard_layout_1', '{"widgets":[{"key":"quick-stats","order":0,"visible":true},{"key":"registration-stats","size":"xl","order":1,"visible":true},{"key":"growth-metrics","size":"xl","order":2,"visible":true},{"key":"career-distribution","size":"xl","order":3,"visible":true},{"key":"evaluations","size":"xl","order":4,"visible":true},{"key":"tutor-distribution","size":"md","order":5,"visible":true},{"key":"institution-distribution","size":"md","order":6,"visible":true},{"key":"monthly-enrollments","size":"xl","order":7,"visible":true},{"key":"pending-requests","size":"xl","order":8,"visible":false}]}', '2026-06-24T12:13:25.204', '1');
INSERT INTO "t_landing_config" ("config_id", "config_key", "config_value", "updated_at", "updated_by") VALUES (15, 'dashboard_layout_3', '{"widgets":[{"key":"tutor-quick-stats","order":0,"visible":true},{"key":"tutor-students-chart","size":"md","order":1,"visible":true},{"key":"tutor-status-distribution","order":2,"visible":true},{"key":"tutor-pending-approvals","order":3,"visible":true},{"key":"tutor-upcoming-deadlines","order":4,"visible":true},{"key":"tutor-student-alerts","order":5,"visible":true},{"key":"tutor-grade-averages","size":"xl","order":6,"visible":false}]}', '2026-06-22T14:57:21.413285', '1');
INSERT INTO "t_landing_config" ("config_id", "config_key", "config_value", "updated_at", "updated_by") VALUES (14, 'dashboard_layout_2', '{"widgets":[{"key":"quick-stats","order":0,"visible":true},{"key":"growth-metrics","order":1,"visible":true},{"key":"evaluations","order":2,"visible":true},{"key":"geo-coincidence","order":3,"visible":true},{"key":"pending-requests","order":4,"visible":true},{"key":"registration-stats","order":5,"visible":true},{"key":"career-distribution","order":6,"visible":true},{"key":"tutor-distribution","order":7,"visible":true},{"key":"institution-distribution","order":8,"visible":true},{"key":"monthly-enrollments","order":9,"visible":true}]}', '2026-06-22T12:59:52.46', '1');
INSERT INTO "t_landing_config" ("config_id", "config_key", "config_value", "updated_at", "updated_by") VALUES (22, 'hero', '{"title":"Impulsa tu carrera con","subtitle":"Conectamos estudiantes talentosos de la UNEFA con las mejores oportunidades en el sector público y privado para transformar su potencial en experiencia real.","mainImage":"/unefa-img/9360.jpg","statsText":"estudiantes han impulsado su carrera con nosotros.","statsCount":3200,"highlightTexts":["Creatividad","Excelencia","Valor","Éxito","Logro"],"successCardTitle":"Éxito laboral","successCardValue":"+85%","primaryButtonLink":"/signin","primaryButtonText":"Comenzar ahora","companiesCardTitle":"Empresas aliadas","companiesCardValue":"+100","secondaryButtonText":"Saber más","successCardSubtitle":"Éxito laboral","companiesCardSubtitle":"Empresas aliadas"}', '2026-06-22T18:26:56.677', '1');

-- --------------------------------------------------------
-- Tabla: t_list (33 registros)
-- --------------------------------------------------------
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (16, 'REGION', '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (17, 'NUCLEO', '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (18, 'EXTENSIÓN', '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (19, 'TRASLADO', '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (20, 'TÍTULO', '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (21, 'CARRERA', '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (380, 'PREFIJO', '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (381, 'REE', '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 0);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (388, 'ESTADOS_VENEZUELA', '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (391, 'GRADO DE INSTRUCCIÓN', '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (396, 'SEMESTRE', '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (397, 'SECCION', '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (398, 'CODIGOS_AREA', '2026-06-16T03:23:20.453883', 0, '2026-06-16T03:23:20.453883', 0, '2026-06-16T03:23:20.453883', 0, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (500, 'VISIT_TYPE', '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (501, 'VISIT_CASE', '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (1, 'SEXO', '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (2, 'REGISTRO CIVIL', '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (3, 'NACIONALIDAD', '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (4, 'REGIMEN/TURNO', '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (5, 'TRABAJO', '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (6, 'TIPO DE EMPRESA', '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (7, 'RIF', '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (8, 'TIPO DE PRACTICA', '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (9, 'CONDICION', '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (10, 'DEDICACION', '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (11, 'CATEGORIA', '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (12, 'TIPO DE ESTUDIANTE', '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (13, 'RANGO MILITAR', '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (14, 'ESTATUS PASANTIA', '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (15, 'ESTATUS PERIODO', '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (503, 'TUTOR_TYPE', '2026-06-17T02:03:37.58322', 1, '2026-06-17T02:03:37.58322', 1, '2026-06-17T02:03:37.58322', 1, '2026-06-17T02:03:37.58322', 1);
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (504, 'PROFESION', '2026-06-17T02:04:44.651036', 1, '2026-06-17T02:04:44.651036', 1, '2026-06-17T02:04:44.651036', 1, '2026-06-17T02:04:44.651036', 1);

-- --------------------------------------------------------
-- Tabla: t_municipio (335 registros)
-- --------------------------------------------------------
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (1, 1, 'Alto Orinoco');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (2, 1, 'Atabapo');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (3, 1, 'Atures');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (4, 1, 'Autana');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (5, 1, 'Manapiare');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (6, 1, 'Maroa');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (7, 1, 'Río Negro');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (8, 2, 'Anaco');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (9, 2, 'Aragua');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (10, 2, 'Bolívar');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (11, 2, 'Bruzual');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (12, 2, 'Cajigal');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (13, 2, 'Carvajal');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (14, 2, 'Diego Bautista Urbaneja');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (15, 2, 'Freites');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (16, 2, 'Guanipa');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (17, 2, 'Guanta');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (18, 2, 'Independencia');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (19, 2, 'Libertad');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (20, 2, 'McGregor');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (21, 2, 'Miranda');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (22, 2, 'Monagas');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (23, 2, 'Peñalver');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (24, 2, 'Píritu');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (25, 2, 'San Juan de Capistrano');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (26, 2, 'Santa Ana');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (27, 2, 'Simón Rodríguez');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (28, 2, 'Sotillo');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (29, 3, 'Achaguas');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (30, 3, 'Biruaca');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (31, 3, 'Muñoz');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (32, 3, 'Páez');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (33, 3, 'Pedro Camejo');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (34, 3, 'Rómulo Gallegos');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (35, 3, 'San Fernando');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (36, 4, 'Bolívar');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (37, 4, 'Camatagua');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (38, 4, 'Francisco Linares Alcántara');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (39, 4, 'Girardot');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (40, 4, 'José Ángel Lamas');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (41, 4, 'José Félix Ribas');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (42, 4, 'José Rafael Revenga');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (43, 4, 'Libertador');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (44, 4, 'Mario Briceño Iragorry');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (45, 4, 'Ocumare de la Costa de Oro');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (46, 4, 'San Casimiro');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (47, 4, 'San Sebastián');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (48, 4, 'Santiago Mariño');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (49, 4, 'Santos Michelena');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (50, 4, 'Sucre');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (51, 4, 'Tovar');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (52, 4, 'Urdaneta');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (53, 4, 'Zamora');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (54, 5, 'Alberto Arvelo Torrealba');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (55, 5, 'Andrés Eloy Blanco');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (56, 5, 'Antonio José de Sucre');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (57, 5, 'Arismendi');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (58, 5, 'Barinas');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (59, 5, 'Bolívar');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (60, 5, 'Cruz Paredes');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (61, 5, 'Ezequiel Zamora');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (62, 5, 'Obispos');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (63, 5, 'Pedraza');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (64, 5, 'Rojas');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (65, 5, 'Sosa');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (66, 6, 'Angostura');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (67, 6, 'Caroní');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (68, 6, 'Cedeño');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (69, 6, 'El Callao');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (70, 6, 'Gran Sabana');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (71, 6, 'Heres');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (72, 6, 'Píar');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (73, 6, 'Roscio');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (74, 6, 'Sifontes');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (75, 6, 'Sucre');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (76, 6, 'Padre Pedro Chien');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (77, 7, 'Bejuma');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (78, 7, 'Carlos Arvelo');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (79, 7, 'Diego Ibarra');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (80, 7, 'Guacara');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (81, 7, 'Mora');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (82, 7, 'Libertador');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (83, 7, 'Los Guayos');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (84, 7, 'Miranda');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (85, 7, 'Montalbán');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (86, 7, 'Naguanagua');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (87, 7, 'Puerto Cabello');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (88, 7, 'San Diego');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (89, 7, 'San Joaquín');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (90, 7, 'Valencia');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (91, 8, 'Anzoátegui');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (92, 8, 'Tinaquillo');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (93, 8, 'Girardot');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (94, 8, 'Lima Blanco');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (95, 8, 'Pao de San Juan Bautista');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (96, 8, 'Ricaurte');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (97, 8, 'Rómulo Gallegos');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (98, 8, 'San Carlos');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (99, 8, 'Tinaco');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (100, 9, 'Antonio Díaz');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (101, 9, 'Casacoima');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (102, 9, 'Pedernales');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (103, 9, 'Tucupita');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (104, 10, 'Acosta');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (105, 10, 'Bolívar');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (106, 10, 'Buchivacoa');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (107, 10, 'Carirubana');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (108, 10, 'Colina');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (109, 10, 'Dabajuro');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (110, 10, 'Democracia');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (111, 10, 'Falcón');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (112, 10, 'Federación');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (113, 10, 'Jacura');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (114, 10, 'Los Taques');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (115, 10, 'Manaure');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (116, 10, 'Mauroa');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (117, 10, 'Miranda');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (118, 10, 'Monseñor Iturriza');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (119, 10, 'Palmasola');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (120, 10, 'Petit');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (121, 10, 'Píritu');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (122, 10, 'San Francisco');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (123, 10, 'Sucre');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (124, 10, 'Silva');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (125, 10, 'Tocópero');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (126, 10, 'Unión');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (127, 10, 'Urumaco');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (128, 10, 'Zamora');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (129, 11, 'Camaguán');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (130, 11, 'Chaguaramas');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (131, 11, 'El Socorro');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (132, 11, 'Infante');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (133, 11, 'Las Mercedes');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (134, 11, 'Mellado');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (135, 11, 'Miranda');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (136, 11, 'Monagas');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (137, 11, 'Ortiz');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (138, 11, 'Ribas');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (139, 11, 'Roscio');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (140, 11, 'San Gerónimo de Guayabal');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (141, 11, 'San José de Guaribe');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (142, 11, 'Santa María de Ipire');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (143, 11, 'Zaraza');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (144, 12, 'Andrés Eloy Blanco');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (145, 12, 'Crespo');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (146, 12, 'Iribarren');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (147, 12, 'Jiménez');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (148, 12, 'Morán');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (149, 12, 'Palavecino');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (150, 12, 'Simón Planas');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (151, 12, 'Torres');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (152, 12, 'Urdaneta');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (153, 13, 'Alberto Adriani');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (154, 13, 'Andrés Bello');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (155, 13, 'Antonio Pinto Salinas');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (156, 13, 'Aricagua');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (157, 13, 'Arzobispo Chacón');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (158, 13, 'Campo Elías');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (159, 13, 'Caracciolo Parra Olmedo');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (160, 13, 'Cardenal Quintero');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (161, 13, 'Guaraque');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (162, 13, 'Julio César Salas');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (163, 13, 'Justo Briceño');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (164, 13, 'Libertador');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (165, 13, 'Miranda');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (166, 13, 'Obispo Ramos de Lora');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (167, 13, 'Padre Noguera');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (168, 13, 'Pueblo Llano');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (169, 13, 'Rangel');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (170, 13, 'Rivas Dávila');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (171, 13, 'Santos Marquina');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (172, 13, 'Sucre');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (173, 13, 'Tovar');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (174, 13, 'Tulio Febres Cordero');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (175, 13, 'Zea');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (176, 14, 'Acevedo');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (177, 14, 'Andrés Bello');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (178, 14, 'Baruta');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (179, 14, 'Brión');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (180, 14, 'Buroz');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (181, 14, 'Carrizal');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (182, 14, 'Chacao');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (183, 14, 'Cristóbal Rojas');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (184, 14, 'El Hatillo');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (185, 14, 'Guaicaipuro');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (186, 14, 'Independencia');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (187, 14, 'Lander');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (188, 14, 'Los Salias');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (189, 14, 'Páez');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (190, 14, 'Paz Castillo');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (191, 14, 'Pedro Gual');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (192, 14, 'Plaza');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (193, 14, 'Simón Bolívar');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (194, 14, 'Sucre');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (195, 14, 'Urdaneta');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (196, 14, 'Zamora');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (197, 15, 'Acosta');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (198, 15, 'Aguasay');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (199, 15, 'Bolívar');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (200, 15, 'Caripe');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (201, 15, 'Cedeño');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (202, 15, 'Ezequiel Zamora');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (203, 15, 'Libertador');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (204, 15, 'Maturín');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (205, 15, 'Piar');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (206, 15, 'Punceres');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (207, 15, 'Santa Bárbara');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (208, 15, 'Sotillo');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (209, 15, 'Uracoa');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (210, 16, 'Antolín del Campo');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (211, 16, 'Arismendi');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (212, 16, 'Díaz');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (213, 16, 'García');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (214, 16, 'Gómez');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (215, 16, 'Maneiro');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (216, 16, 'Marcano');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (217, 16, 'Mariño');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (218, 16, 'Península de Macanao');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (219, 16, 'Tubores');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (220, 16, 'Villalba');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (221, 17, 'Agua Blanca');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (222, 17, 'Araure');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (223, 17, 'Esteller');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (224, 17, 'Guanare');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (225, 17, 'Guanarito');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (226, 17, 'Monseñor José Vicente de Unda');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (227, 17, 'Ospino');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (228, 17, 'Páez');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (229, 17, 'Papelón');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (230, 17, 'San Genaro de Boconoíto');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (231, 17, 'San Rafael de Onoto');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (232, 17, 'Santa Rosalía');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (233, 17, 'Sucre');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (234, 17, 'Turén');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (235, 18, 'Andrés Eloy Blanco');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (236, 18, 'Andrés Mata');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (237, 18, 'Arismendi');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (238, 18, 'Benítez');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (239, 18, 'Bermúdez');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (240, 18, 'Bolívar');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (241, 18, 'Cajigal');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (242, 18, 'Cruz Salmerón Acosta');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (243, 18, 'Libertador');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (244, 18, 'Mariño');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (245, 18, 'Mejía');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (246, 18, 'Montes');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (247, 18, 'Ribero');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (248, 18, 'Sucre');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (249, 18, 'Valdez');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (250, 19, 'Andrés Bello');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (251, 19, 'Antonio Rómulo Costa');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (252, 19, 'Ayacucho');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (253, 19, 'Bolívar');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (254, 19, 'Cárdenas');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (255, 19, 'Córdoba');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (256, 19, 'Fernández Feo');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (257, 19, 'Francisco de Miranda');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (258, 19, 'García de Hevia');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (259, 19, 'Guásimos');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (260, 19, 'Independencia');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (261, 19, 'Jáuregui');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (262, 19, 'José María Vargas');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (263, 19, 'Junín');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (264, 19, 'Libertad');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (265, 19, 'Libertador');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (266, 19, 'Lobatera');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (267, 19, 'Michelena');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (268, 19, 'Panamericano');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (269, 19, 'Pedro María Ureña');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (270, 19, 'Rafael Urdaneta');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (271, 19, 'Samuel Darío Maldonado');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (272, 19, 'San Cristóbal');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (273, 19, 'Seboruco');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (274, 19, 'Simón Rodríguez');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (275, 19, 'Sucre');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (276, 19, 'Torbes');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (277, 19, 'Uribante');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (278, 19, 'San Judas Tadeo');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (279, 20, 'Andrés Bello');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (280, 20, 'Boconó');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (281, 20, 'Bolívar');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (282, 20, 'Candelaria');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (283, 20, 'Carache');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (284, 20, 'Escuque');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (285, 20, 'José Felipe Márquez Cañizalez');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (286, 20, 'Juan Vicente Campos Elías');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (287, 20, 'La Ceiba');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (288, 20, 'Miranda');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (289, 20, 'Monte Carmelo');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (290, 20, 'Motatán');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (291, 20, 'Pampán');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (292, 20, 'Pampanito');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (293, 20, 'Rafael Rangel');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (294, 20, 'San Rafael de Carvajal');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (295, 20, 'Sucre');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (296, 20, 'Trujillo');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (297, 20, 'Urdaneta');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (298, 20, 'Valera');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (299, 21, 'Vargas');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (300, 22, 'Arístides Bastidas');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (301, 22, 'Bolívar');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (302, 22, 'Bruzual');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (303, 22, 'Cocorote');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (304, 22, 'Independencia');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (305, 22, 'José Antonio Páez');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (306, 22, 'La Trinidad');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (307, 22, 'Manuel Monge');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (308, 22, 'Nirgua');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (309, 22, 'Peña');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (310, 22, 'San Felipe');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (311, 22, 'Sucre');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (312, 22, 'Urachiche');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (313, 22, 'Veroes');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (314, 23, 'Almirante Padilla');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (315, 23, 'Baralt');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (316, 23, 'Cabimas');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (317, 23, 'Catatumbo');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (318, 23, 'Colón');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (319, 23, 'Francisco Javier Pulgar');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (320, 23, 'Páez');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (321, 23, 'Jesús Enrique Lossada');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (322, 23, 'Jesús María Semprún');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (323, 23, 'La Cañada de Urdaneta');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (324, 23, 'Lagunillas');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (325, 23, 'Machiques de Perijá');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (326, 23, 'Mara');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (327, 23, 'Maracaibo');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (328, 23, 'Miranda');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (329, 23, 'Rosario de Perijá');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (330, 23, 'San Francisco');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (331, 23, 'Santa Rita');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (332, 23, 'Simón Bolívar');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (333, 23, 'Sucre');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (334, 23, 'Valmore Rodríguez');
INSERT INTO "t_municipio" ("municipio_id", "estado_id", "name") VALUES (335, 24, 'Libertador');

-- --------------------------------------------------------
-- Tabla: t_notifications (203 registros)
-- --------------------------------------------------------
INSERT INTO "t_operation" ("OPERATION_ID", "ACTION", "DESCRIPTION", "STATUS") VALUES (1, 'INSERT', 'Inserción de nuevo registro', 1);
INSERT INTO "t_operation" ("OPERATION_ID", "ACTION", "DESCRIPTION", "STATUS") VALUES (2, 'UPDATE', 'Actualización de registro', 1);
INSERT INTO "t_operation" ("OPERATION_ID", "ACTION", "DESCRIPTION", "STATUS") VALUES (3, 'DELETE', 'Eliminación de registro', 1);

-- --------------------------------------------------------
-- Tabla: t_parroquia (1000 registros)
-- --------------------------------------------------------
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (1, 1, 'Alto Orinoco La Esmeralda');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (2, 1, 'Huachamacare Acanaña');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (3, 1, 'Marawaka Toky Shamanaña');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (4, 1, 'Mavaka Mavaka');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (5, 1, 'Sierra Parima Parimabé');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (6, 2, 'Ucata Laja Lisa');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (7, 2, 'Yapacana Macuruco');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (8, 2, 'Caname Guarinuma');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (9, 3, 'Fernando Girón Tovar');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (10, 3, 'Luis Alberto Gómez');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (11, 3, 'Pahueña Limón de Parhueña');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (12, 3, 'Platanillal Platanillal');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (13, 4, 'Samariapo Samariapo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (14, 4, 'Sipapo Pendare');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (15, 4, 'Munduapo Munduapo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (16, 4, 'Guayapo San Pedro del Orinoco');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (17, 5, 'Alto Ventuari Cacurí');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (18, 5, 'Medio Ventuari Manami');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (19, 5, 'Bajo Ventuari Marueta');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (20, 6, 'Victorino');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (21, 6, 'Comunidad');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (22, 7, 'Casiquiare Curimacare');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (23, 7, 'Cocuy');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (24, 7, 'San Carlos de Río Negro');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (25, 7, 'Solano Solano');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (26, 8, 'Anaco');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (27, 8, 'San Joaquín');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (28, 9, 'Cachipo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (29, 9, 'Aragua de Barcelona');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (30, 10, 'Bergatín');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (31, 10, 'Caigua');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (32, 10, 'El Carmen.');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (33, 10, 'El Pilar');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (34, 10, 'Naricual.');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (35, 10, 'San Cristóbal');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (36, 11, 'Clarines');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (37, 11, 'Guanape');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (38, 11, 'Sabana de Uchire');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (39, 12, 'Onoto');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (40, 12, 'San Pablo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (41, 13, 'Valle de Guanape');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (42, 13, 'Santa Bárbara');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (43, 14, 'Lechería');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (44, 14, 'El Morro');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (45, 15, 'Cantaura');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (46, 15, 'Libertador');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (47, 15, 'Santa Rosa');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (48, 15, 'Urica');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (49, 16, 'San José de Guanipa');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (50, 17, 'Guanta');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (51, 17, 'Chorrerón');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (52, 18, 'Mamo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (53, 18, 'Soledad');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (54, 19, 'San Mateo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (55, 19, 'El Carito');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (56, 19, 'Santa Inés');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (57, 19, 'La Romereña');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (58, 20, 'El Chaparro');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (59, 20, 'Tomás Alfaro');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (60, 20, 'Calatrava');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (61, 21, 'Atapirire');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (62, 21, 'Boca del Pao');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (63, 21, 'El Pao');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (64, 21, 'Pariaguán');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (65, 22, 'Mapire');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (66, 22, 'Piar');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (67, 22, 'Santa Clara');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (68, 22, 'San Diego de Cabrutica');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (69, 22, 'Uverito');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (70, 22, 'Zuata');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (71, 23, 'Puerto Píritu');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (72, 23, 'San Miguel');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (73, 23, 'Sucre');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (74, 24, 'Píritu');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (75, 24, 'San Francisco');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (76, 25, 'Boca de Uchire');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (77, 25, 'Boca de Chávez');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (78, 26, 'Pueblo Nuevo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (79, 26, 'Santa Ana');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (80, 27, 'Edmundo Barrios');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (81, 27, 'Miguel Otero Silva');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (82, 28, 'Puerto La Cruz');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (83, 28, 'Pozuelos');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (84, 29, 'Achaguas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (85, 29, 'Apurito');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (86, 29, 'El Yagual');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (87, 29, 'Guachara');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (88, 29, 'Mucuritas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (89, 29, 'Queseras del medio');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (90, 30, 'Biruaca');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (91, 31, 'Bruzual');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (92, 31, 'Mantecal');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (93, 31, 'Quintero');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (94, 31, 'Rincón Hondo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (95, 31, 'San Vicente');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (96, 32, 'Guasdualito');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (97, 32, 'Aramendi');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (98, 32, 'El Amparo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (99, 32, 'San Camilo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (100, 32, 'Urdaneta');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (101, 33, 'San Juan de Payara');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (102, 33, 'Codazzi');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (103, 33, 'Cunaviche');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (104, 34, 'Elorza');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (105, 34, 'La Trinidad');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (106, 35, 'San Fernando');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (107, 35, 'El Recreo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (108, 35, 'Peñalver');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (109, 35, 'San Rafael de Atamaica');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (110, 36, 'Bolívar');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (111, 37, 'Camatagua');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (112, 37, 'Carmen de Cura');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (113, 38, 'Santa Rita');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (114, 38, 'Francisco de Miranda');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (115, 38, 'Moseñor Feliciano González');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (116, 39, 'Pedro José Ovalles');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (117, 39, 'Joaquín Crespo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (118, 39, 'José Casanova Godoy');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (119, 39, 'Madre María de San José');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (120, 39, 'Andrés Eloy Blanco');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (121, 39, 'Los Tacarigua');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (122, 39, 'Las Delicias');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (123, 39, 'Choroní');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (124, 40, 'Santa Cruz');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (125, 41, 'José Félix Ribas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (126, 41, 'Castor Nieves Ríos');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (127, 41, 'Las Guacamayas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (128, 41, 'Pao de Zárate');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (129, 41, 'Zuata');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (130, 42, 'José Rafael Revenga');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (131, 43, 'Palo Negro');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (132, 43, 'San Martín de Porres');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (133, 44, 'El Limón');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (134, 44, 'Caña de Azúcar');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (135, 45, 'Ocumare de la Costa');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (136, 46, 'San Casimiro');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (137, 46, 'Güiripa');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (138, 46, 'Ollas de Caramacate');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (139, 46, 'Valle Morín');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (140, 47, 'San Sebastián');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (141, 48, 'Turmero');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (142, 48, 'Arevalo Aponte');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (143, 48, 'Chuao');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (144, 48, 'Samán de Güere');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (145, 48, 'Alfredo Pacheco Miranda');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (146, 49, 'Santos Michelena');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (147, 49, 'Tiara');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (148, 50, 'Cagua');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (149, 50, 'Bella Vista');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (150, 51, 'Tovar');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (151, 52, 'Urdaneta');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (152, 52, 'Las Peñitas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (153, 52, 'San Francisco de Cara');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (154, 52, 'Taguay');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (155, 53, 'Zamora');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (156, 53, 'Magdaleno');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (157, 53, 'San Francisco de Asís');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (158, 53, 'Valles de Tucutunemo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (159, 53, 'Augusto Mijares');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (160, 54, 'Sabaneta');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (161, 54, 'Juan Antonio Rodríguez Domínguez');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (162, 55, 'El Cantón');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (163, 55, 'Santa Cruz de Guacas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (164, 55, 'Puerto Vivas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (165, 56, 'Ticoporo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (166, 56, 'Nicolás Pulido');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (167, 56, 'Andrés Bello');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (168, 57, 'Arismendi');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (169, 57, 'Guadarrama');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (170, 57, 'La Unión');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (171, 57, 'San Antonio');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (172, 58, 'Barinas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (173, 58, 'Alberto Arvelo Larriva');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (174, 58, 'San Silvestre');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (175, 58, 'Santa Inés');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (176, 58, 'Santa Lucía');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (177, 58, 'Torunos');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (178, 58, 'El Carmen');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (179, 58, 'Rómulo Betancourt');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (180, 58, 'Corazón de Jesús');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (181, 58, 'Ramón Ignacio Méndez');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (182, 58, 'Alto Barinas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (183, 58, 'Manuel Palacio Fajardo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (184, 58, 'Juan Antonio Rodríguez Domínguez');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (185, 58, 'Dominga Ortiz de Páez');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (186, 59, 'Barinitas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (187, 59, 'Altamira de Cáceres');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (188, 59, 'Calderas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (189, 60, 'Barrancas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (190, 60, 'El Socorro');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (191, 60, 'Mazparrito');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (192, 61, 'Santa Bárbara');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (193, 61, 'Pedro Briceño Méndez');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (194, 61, 'Ramón Ignacio Méndez');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (195, 61, 'José Ignacio del Pumar');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (196, 62, 'Obispos');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (197, 62, 'Los Guasimitos');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (198, 62, 'El Real');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (199, 62, 'La Luz');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (200, 63, 'Ciudad Bolívia');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (201, 63, 'José Ignacio Briceño');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (202, 63, 'José Félix Ribas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (203, 63, 'Páez');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (204, 64, 'Libertad');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (205, 64, 'Dolores');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (206, 64, 'Santa Rosa');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (207, 64, 'Palacio Fajardo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (208, 64, 'Simón Rodríguez');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (209, 65, 'Ciudad de Nutrias');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (210, 65, 'El Regalo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (211, 65, 'Puerto Nutrias');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (212, 65, 'Santa Catalina');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (213, 65, 'Simón Bolívar');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (214, 66, 'Raúl Leoni');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (215, 66, 'Barceloneta');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (216, 66, 'Santa Bárbara');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (217, 66, 'San Francisco');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (218, 67, 'Cachamay');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (219, 67, 'Chirica');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (220, 67, 'Dalla Costa');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (221, 67, 'Once de Abril');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (222, 67, 'Simón Bolívar');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (223, 67, 'Unare');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (224, 67, 'Universidad');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (225, 67, 'Vista al Sol');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (226, 67, 'Pozo Verde');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (227, 67, 'Yocoima');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (228, 67, '5 de Julio');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (229, 68, 'Cedeño');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (230, 68, 'Altagracia');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (231, 68, 'Ascensión Farreras');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (232, 68, 'Guaniamo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (233, 68, 'La Urbana');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (234, 68, 'Pijiguaos');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (235, 69, 'El Callao');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (236, 70, 'Gran Sabana');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (237, 70, 'Ikabarú');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (238, 71, 'Catedral');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (239, 71, 'Zea');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (240, 71, 'Orinoco');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (241, 71, 'José Antonio Páez');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (242, 71, 'Marhuanta');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (243, 71, 'Agua Salada');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (244, 71, 'Vista Hermosa');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (245, 71, 'La Sabanita');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (246, 71, 'Panapana');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (247, 72, 'Andrés Eloy Blanco');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (248, 72, 'Pedro Cova');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (249, 73, 'Roscio');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (250, 73, 'Salóm');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (251, 74, 'Sifontes');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (252, 74, 'Dalla Costa');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (253, 74, 'San Isidro');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (254, 75, 'Sucre');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (255, 75, 'Aripao');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (256, 75, 'Guarataro');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (257, 75, 'Las Majadas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (258, 75, 'Moitaco');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (259, 76, 'Padre Pedro Chien');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (260, 76, 'Río Grande');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (261, 77, 'Bejuma');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (262, 77, 'Canoabo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (263, 77, 'Simón Bolívar');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (264, 78, 'Güigüe');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (265, 78, 'Carabobo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (266, 78, 'Tacarigua');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (267, 79, 'Mariara');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (268, 79, 'Aguas Calientes');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (269, 80, 'Ciudad Alianza');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (270, 80, 'Guacara');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (271, 80, 'Yagua');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (272, 81, 'Morón');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (273, 81, 'Urama');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (274, 82, 'Valencia');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (275, 82, 'Campo Carabobo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (276, 83, 'Los Guayos');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (277, 84, 'Miranda');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (278, 85, 'Montalbán');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (279, 86, 'Naguanagua');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (280, 87, 'Bartolomé Salóm');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (281, 87, 'Democracia');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (282, 87, 'Fraternidad');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (283, 87, 'Goaigoaza');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (284, 87, 'Juan José Flores');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (285, 87, 'Unión');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (286, 87, 'Borburata');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (287, 87, 'Patanemo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (288, 88, 'San Diego');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (289, 89, 'San Joaquín');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (290, 90, 'Urbana Candelaria');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (291, 90, 'Urbana Catedral');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (292, 90, 'Urbana El Socorro');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (293, 90, 'Urbana Miguel Peña');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (294, 90, 'Urbana Rafael Urdaneta');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (295, 90, 'Urbana San Blas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (296, 90, 'Urbana San José');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (297, 90, 'Urbana Santa Rosa');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (298, 90, 'No Urbana Negro Primero');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (299, 91, 'Cojedes');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (300, 91, 'Juan de Mata Suárez');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (301, 92, 'Tinaquillo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (302, 93, 'El Baúl');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (303, 93, 'Sucre');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (304, 94, 'La Aguadita');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (305, 94, 'Macapo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (306, 95, 'El Pao');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (307, 96, 'El Amparo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (308, 96, 'Libertad de Cojedes');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (309, 97, 'Rómulo Gallegos');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (310, 98, 'San Carlos de Austria');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (311, 98, 'Juan Ángel Bravo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (312, 98, 'Manuel Manrique');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (313, 99, 'General en Jefe José Laurencio Silva');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (314, 100, 'Curiapo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (315, 100, 'Almirante Luis Brión');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (316, 100, 'Francisco Aniceto Lugo Boca de Cuyubini');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (317, 100, 'Manuel Renaud');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (318, 100, 'Padre Barral');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (319, 100, 'Santos de Abelgas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (320, 101, 'Imataca Moruca');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (321, 101, 'Cinco de Julio Piacoa');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (322, 101, 'Juan Bautista Arismendi');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (323, 101, 'Manuel Piar Santa Catalina');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (324, 101, 'Rómulo Gallegos');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (325, 102, 'Pedernales');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (326, 102, 'Luis Beltrán Prieto Figueroa');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (327, 103, 'San José');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (328, 103, 'José Vidal Marcano Caparal de Guara');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (329, 103, 'Juan Millán');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (330, 103, 'Leonardo Ruíz Pineda Paloma');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (331, 103, 'Mariscal Antonio José de Sucre');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (332, 103, 'Monseñor Argimiro García San Rafael');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (333, 103, 'San Rafael');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (334, 103, 'Virgen del Valle');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (335, 104, 'Capadare');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (336, 104, 'La Pastora');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (337, 104, 'Libertador');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (338, 104, 'San Juan de los Cayos');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (339, 105, 'Aracua');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (340, 105, 'La Peña');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (341, 105, 'San Luis');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (342, 106, 'Bariro');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (343, 106, 'Borojó');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (344, 106, 'Capatárida');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (345, 106, 'Guajiro');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (346, 106, 'Seque');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (347, 106, 'Zazárida');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (348, 106, 'Valle de Eroa');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (349, 107, 'Norte');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (350, 107, 'Carirubana');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (351, 107, 'Santa Ana');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (352, 107, 'Urbana Punta Cardón');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (353, 108, 'La Vela de Coro');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (354, 108, 'Acurigua');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (355, 108, 'Guaibacoa');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (356, 108, 'Las Calderas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (357, 108, 'Macoruca');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (358, 109, 'Dabajuro');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (359, 110, 'Agua Clara');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (360, 110, 'Avaria');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (361, 110, 'Pedregal');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (362, 110, 'Piedra Grande');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (363, 110, 'Purureche');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (364, 111, 'Adaure');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (365, 111, 'Adícora');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (366, 111, 'Baraived');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (367, 111, 'Buena Vista');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (368, 111, 'Jadacaquiva');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (369, 111, 'El Vínculo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (370, 111, 'El Hato');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (371, 111, 'Moruy');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (372, 111, 'Pueblo Nuevo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (373, 112, 'Agua Larga');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (374, 112, 'Churuguara');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (375, 112, 'El Paují');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (376, 112, 'Independencia');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (377, 112, 'Mapararí');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (378, 113, 'Agua Linda');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (379, 113, 'Araurima');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (380, 113, 'Jacura');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (381, 114, 'Los Taques');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (382, 114, 'Judibana');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (383, 115, 'Cacique Manaure');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (384, 116, 'Mene de Mauroa');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (385, 116, 'San Félix');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (386, 116, 'Casigua');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (387, 117, 'Guzmán Guillermo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (388, 117, 'Mitare');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (389, 117, 'Río Seco');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (390, 117, 'Sabaneta');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (391, 117, 'San Antonio');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (392, 117, 'San Gabriel');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (393, 117, 'Santa Ana');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (394, 118, 'Boca del Tocuyo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (395, 118, 'Chichiriviche');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (396, 118, 'Tocuyo de la Costa');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (397, 119, 'Palmasola');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (398, 120, 'Cabure');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (399, 120, 'Colina');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (400, 120, 'Curimagua');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (401, 121, 'San José de la Costa');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (402, 121, 'Píritu');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (403, 122, 'Capital San Francisco');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (404, 123, 'Sucre');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (405, 123, 'Pecaya');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (406, 124, 'Tucacas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (407, 124, 'Boca de Aroa');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (408, 125, 'Tocópero');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (409, 126, 'El Charal');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (410, 126, 'Las Vegas del Tuy');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (411, 126, 'Santa Cruz de Bucaral');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (412, 127, 'Bruzual');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (413, 127, 'Urumaco');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (414, 128, 'Puerto Cumarebo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (415, 128, 'La Ciénaga');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (416, 128, 'La Soledad');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (417, 128, 'Pueblo Cumarebo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (418, 128, 'Zazárida');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (419, 129, 'Camaguán');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (420, 129, 'Puerto Miranda');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (421, 129, 'Uverito');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (422, 130, 'Chaguaramas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (423, 131, 'El Socorro');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (424, 132, 'Valle de la Pascua');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (425, 132, 'Espino');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (426, 133, 'Las Mercedes');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (427, 133, 'Cabruta');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (428, 133, 'Santa Rita de Manapire');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (429, 134, 'El Sombrero');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (430, 134, 'Sosa');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (431, 135, 'El Calvario');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (432, 135, 'El Rastro');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (433, 135, 'Guardatinajas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (434, 135, 'Capital Urbana Calabozo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (435, 136, 'Altagracia de Orituco');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (436, 136, 'San Rafael de Orituco');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (437, 136, 'San Francisco Javier de Lezama');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (438, 136, 'Paso Real de Macaira');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (439, 136, 'Carlos Soublette');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (440, 136, 'San Francisco de Macaira');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (441, 136, 'Libertad de Orituco');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (442, 137, 'San José de Tiznados');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (443, 137, 'San Francisco de Tiznados');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (444, 137, 'San Lorenzo de Tiznados');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (445, 137, 'Ortiz');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (446, 138, 'Tucupido');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (447, 138, 'San Rafael de Laya');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (448, 139, 'Cantagallo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (449, 139, 'San Juan de los Morros');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (450, 139, 'Parapara');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (451, 140, 'Guayabal');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (452, 140, 'Cazorla');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (453, 141, 'San José de Guaribe');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (454, 141, 'Uveral');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (455, 142, 'Santa María de Ipire');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (456, 142, 'Altamira');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (457, 143, 'Unare');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (458, 143, 'Zaraza');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (459, 144, 'Quebrada Honda de Guache');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (460, 144, 'Pío Tamayo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (461, 144, 'Yacambú');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (462, 145, 'Freitez');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (463, 145, 'José María Blanco');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (464, 146, 'Catedral');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (465, 146, 'Concepción');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (466, 146, 'El Cují');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (467, 146, 'Juan de Villegas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (468, 146, 'Santa Rosa');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (469, 146, 'Tamaca');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (470, 146, 'Unión');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (471, 146, 'Aguedo Felipe Alvarado');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (472, 146, 'Buena Vista');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (473, 146, 'Juárez');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (474, 147, 'Juan Bautista Rodríguez');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (475, 147, 'Cuara');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (476, 147, 'Diego de Lozada');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (477, 147, 'Paraíso de San José');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (478, 147, 'San Miguel');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (479, 147, 'Tintorero');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (480, 147, 'José Bernardo Dorante');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (481, 147, 'Coronel Mariano Peraza');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (482, 148, 'Anzoátegui');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (483, 148, 'Bolívar');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (484, 148, 'Guárico');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (485, 148, 'Hilario Luna y Luna');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (486, 148, 'Humocaro Bajo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (487, 148, 'Humocaro Alto');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (488, 148, 'La Candelaria');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (489, 148, 'Morán');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (490, 149, 'Cabudare');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (491, 149, 'José Gregorio Bastidas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (492, 149, 'Agua Viva');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (493, 150, 'Buría');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (494, 150, 'Gustavo Vega');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (495, 150, 'Sarare');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (496, 151, 'Altagracia');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (497, 151, 'Antonio Díaz');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (498, 151, 'Camacaro');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (499, 151, 'Castañeda');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (500, 151, 'Cecilio Zubillaga');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (501, 151, 'Chiquinquira');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (502, 151, 'El Blanco');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (503, 151, 'Espinoza de los Monteros');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (504, 151, 'Heriberto Arrollo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (505, 151, 'Lara');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (506, 151, 'Las Mercedes');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (507, 151, 'Manuel Morillo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (508, 151, 'Montaña Verde');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (509, 151, 'Montes de Oca');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (510, 151, 'Reyes de Vargas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (511, 151, 'Torres');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (512, 151, 'Trinidad Samuel');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (513, 152, 'Siquisique');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (514, 152, 'San Miguel');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (515, 152, 'Moroturo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (516, 152, 'Xaguas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (517, 153, 'Presidente Betancourt');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (518, 153, 'Presidente Páez');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (519, 153, 'Presidente Rómulo Gallegos');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (520, 153, 'Gabriel Picón González');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (521, 153, 'Héctor Amable Mora');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (522, 153, 'José Nucete Sardi');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (523, 153, 'Pulido Méndez');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (524, 154, 'La Azulita');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (525, 155, 'Santa Cruz de Mora');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (526, 155, 'Mesa Bolívar');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (527, 155, 'Mesa de Las Palmas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (528, 156, 'Aricagua');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (529, 156, 'San Antonio');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (530, 157, 'Canagua');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (531, 157, 'Capurí');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (532, 157, 'Chacantá');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (533, 157, 'El Molino');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (534, 157, 'Guaimaral');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (535, 157, 'Mucutuy');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (536, 157, 'Mucuchachí');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (537, 158, 'Fernández Peña');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (538, 158, 'Matriz');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (539, 158, 'Montalbán');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (540, 158, 'Acequias');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (541, 158, 'Jají');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (542, 158, 'La Mesa');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (543, 158, 'San José del Sur');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (544, 159, 'Tucaní');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (545, 159, 'Florencio Ramírez');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (546, 160, 'Santo Domingo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (547, 160, 'Las Piedras');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (548, 161, 'Guaraque');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (549, 161, 'Mesa de Quintero');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (550, 161, 'Río Negro');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (551, 162, 'Arapuey');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (552, 162, 'Palmira');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (553, 163, 'San Cristóbal de Torondoy');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (554, 163, 'Torondoy');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (555, 164, 'Antonio Spinetti Dini');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (556, 164, 'Arias');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (557, 164, 'Caracciolo Parra Pérez');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (558, 164, 'Domingo Peña');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (559, 164, 'El Llano');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (560, 164, 'Gonzalo Picón Febres');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (561, 164, 'Jacinto Plaza');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (562, 164, 'Juan Rodríguez Suárez');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (563, 164, 'Lasso de la Vega');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (564, 164, 'Mariano Picón Salas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (565, 164, 'Milla');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (566, 164, 'Osuna Rodríguez');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (567, 164, 'Sagrario');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (568, 164, 'El Morro');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (569, 164, 'Los Nevados');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (570, 165, 'Andrés Eloy Blanco');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (571, 165, 'La Venta');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (572, 165, 'Piñango');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (573, 165, 'Timotes');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (574, 166, 'Eloy Paredes');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (575, 166, 'San Rafael de Alcázar');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (576, 166, 'Santa Elena de Arenales');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (577, 167, 'Santa María de Caparo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (578, 168, 'Pueblo Llano');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (579, 169, 'Cacute');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (580, 169, 'La Toma');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (581, 169, 'Mucuchíes');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (582, 169, 'Mucurubá');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (583, 169, 'San Rafael');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (584, 170, 'Gerónimo Maldonado');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (585, 170, 'Bailadores');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (586, 171, 'Tabay');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (587, 172, 'Chiguará');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (588, 172, 'Estánquez');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (589, 172, 'Lagunillas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (590, 172, 'La Trampa');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (591, 172, 'Pueblo Nuevo del Sur');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (592, 172, 'San Juan');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (593, 173, 'El Amparo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (594, 173, 'El Llano');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (595, 173, 'San Francisco');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (596, 173, 'Tovar');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (597, 174, 'Independencia');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (598, 174, 'María de la Concepción Palacios Blanco');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (599, 174, 'Nueva Bolivia');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (600, 174, 'Santa Apolonia');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (601, 175, 'Caño El Tigre');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (602, 175, 'Zea');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (603, 176, 'Aragüita');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (604, 176, 'Arévalo González');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (605, 176, 'Capaya');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (606, 176, 'Caucagua');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (607, 176, 'Panaquire');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (608, 176, 'Ribas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (609, 176, 'El Café');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (610, 176, 'Marizapa');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (611, 177, 'Cumbo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (612, 177, 'San José de Barlovento');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (613, 178, 'El Cafetal');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (614, 178, 'Las Minas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (615, 178, 'Nuestra Señora del Rosario');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (616, 179, 'Higuerote');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (617, 179, 'Curiepe');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (618, 179, 'Tacarigua de Brión');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (619, 180, 'Mamporal');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (620, 181, 'Carrizal');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (621, 182, 'Chacao');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (622, 183, 'Charallave');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (623, 183, 'Las Brisas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (624, 184, 'El Hatillo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (625, 185, 'Altagracia de la Montaña');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (626, 185, 'Cecilio Acosta');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (627, 185, 'Los Teques');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (628, 185, 'El Jarillo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (629, 185, 'San Pedro.');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (630, 185, 'Tácata');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (631, 185, 'Paracotos');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (632, 186, 'Cartanal');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (633, 186, 'Santa Teresa del Tuy');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (634, 187, 'La Democracia');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (635, 187, 'Ocumare del Tuy');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (636, 187, 'Santa Bárbara');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (637, 188, 'San Antonio de los Altos');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (638, 189, 'Río Chico');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (639, 189, 'El Guapo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (640, 189, 'Tacarigua de la Laguna');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (641, 189, 'Paparo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (642, 189, 'San Fernando del Guapo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (643, 190, 'Santa Lucía del Tuy');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (644, 191, 'Cúpira');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (645, 191, 'Machurucuto');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (646, 192, 'Guarenas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (647, 193, 'San Antonio de Yare');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (648, 193, 'San Francisco de Yare');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (649, 194, 'Leoncio Martínez');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (650, 194, 'Petare');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (651, 194, 'Caucagüita');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (652, 194, 'Filas de Mariche');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (653, 194, 'La Dolorita');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (654, 195, 'Cúa');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (655, 195, 'Nueva Cúa');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (656, 196, 'Guatire');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (657, 196, 'Bolívar');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (658, 197, 'San Antonio de Maturín');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (659, 197, 'San Francisco de Maturín');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (660, 198, 'Aguasay');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (661, 199, 'Caripito');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (662, 200, 'El Guácharo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (663, 200, 'La Guanota');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (664, 200, 'Sabana de Piedra');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (665, 200, 'San Agustín');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (666, 200, 'Teresen');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (667, 200, 'Caripe');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (668, 201, 'Areo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (669, 201, 'Capital Cedeño');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (670, 201, 'San Félix de Cantalicio');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (671, 201, 'Viento Fresco');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (672, 202, 'El Tejero');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (673, 202, 'Punta de Mata');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (674, 203, 'Chaguaramas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (675, 203, 'Las Alhuacas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (676, 203, 'Tabasca');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (677, 203, 'Temblador');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (678, 204, 'Alto de los Godos');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (679, 204, 'Boquerón');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (680, 204, 'Las Cocuizas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (681, 204, 'La Cruz');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (682, 204, 'San Simón');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (683, 204, 'El Corozo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (684, 204, 'El Furrial');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (685, 204, 'Jusepín');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (686, 204, 'La Pica');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (687, 204, 'San Vicente');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (688, 205, 'Aparicio');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (689, 205, 'Aragua de Maturín');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (690, 205, 'Chaguamal');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (691, 205, 'El Pinto');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (692, 205, 'Guanaguana');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (693, 205, 'La Toscana');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (694, 205, 'Taguaya');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (695, 206, 'Cachipo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (696, 206, 'Quiriquire');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (697, 207, 'Santa Bárbara');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (698, 208, 'Barrancas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (699, 208, 'Los Barrancos de Fajardo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (700, 209, 'Uracoa');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (701, 210, 'Antolín del Campo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (702, 211, 'Arismendi');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (703, 212, 'San Juan Bautista');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (704, 212, 'Zabala');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (705, 213, 'García');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (706, 213, 'Francisco Fajardo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (707, 214, 'Bolívar');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (708, 214, 'Guevara');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (709, 214, 'Cerro de Matasiete');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (710, 214, 'Santa Ana');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (711, 214, 'Sucre');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (712, 215, 'Aguirre');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (713, 215, 'Maneiro');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (714, 216, 'Adrián');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (715, 216, 'Juan Griego');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (716, 216, 'Yaguaraparo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (717, 217, 'Porlamar');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (718, 218, 'San Francisco de Macanao');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (719, 218, 'Boca de Río');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (720, 219, 'Tubores');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (721, 219, 'Los Barales');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (722, 220, 'Vicente Fuentes');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (723, 220, 'Villalba');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (724, 221, 'Agua Blanca');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (725, 222, 'Araure');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (726, 222, 'Río Acarigua');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (727, 223, 'Píritu');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (728, 223, 'Uveral');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (729, 224, 'Cordova');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (730, 224, 'Guanare');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (731, 224, 'San José de la Montaña');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (732, 224, 'San Juan de Guanaguanare');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (733, 224, 'Virgen de Coromoto');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (734, 225, 'Guanarito');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (735, 225, 'Trinidad de la Capilla');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (736, 225, 'Divina Pastora');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (737, 226, 'Peña Blanca');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (738, 227, 'Aparición');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (739, 227, 'La Estación');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (740, 227, 'Ospino');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (741, 228, 'Acarigua');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (742, 228, 'Payara');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (743, 228, 'Pimpinela');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (744, 228, 'Ramón Peraza');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (745, 229, 'Caño Delgadito');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (746, 229, 'Papelón');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (747, 230, 'Antolín Tovar Anquino');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (748, 230, 'Boconoíto');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (749, 231, 'Santa Fé');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (750, 231, 'San Rafael de Onoto');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (751, 231, 'Thermo Morales');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (752, 232, 'Florida');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (753, 232, 'El Playón');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (754, 233, 'Biscucuy');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (755, 233, 'Concepción');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (756, 233, 'San José de Saguaz');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (757, 233, 'San Rafael de Palo Alzado');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (758, 233, 'Uvencio Antonio Velásquez');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (759, 233, 'Villa Rosa');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (760, 234, 'Canelones');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (761, 234, 'Santa Cruz');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (762, 234, 'San Isidro Labrador');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (763, 235, 'Mariño');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (764, 235, 'Rómulo Gallegos');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (765, 236, 'San José de Aerocuar');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (766, 236, 'Tavera Acosta');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (767, 237, 'Río Caribe');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (768, 237, 'Antonio José de Sucre');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (769, 237, 'El Morro de Puerto Santo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (770, 237, 'Puerto Santo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (771, 237, 'San Juan de las Galdonas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (772, 238, 'El Pilar');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (773, 238, 'El Rincón');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (774, 238, 'General Francisco Antonio Váquez');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (775, 238, 'Guaraúnos');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (776, 238, 'Tunapuicito');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (777, 238, 'Unión');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (778, 239, 'Santa Catalina');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (779, 239, 'Santa Rosa');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (780, 239, 'Santa Teresa');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (781, 239, 'Bolívar');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (782, 239, 'Maracapana');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (783, 241, 'Libertad');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (784, 241, 'El Paujil');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (785, 241, 'Yaguaraparo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (786, 242, 'Cruz Salmerón Acosta');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (787, 242, 'Chacopata');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (788, 242, 'Manicuare');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (789, 243, 'Tunapuy');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (790, 243, 'Campo Elías');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (791, 244, 'Irapa');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (792, 244, 'Campo Claro');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (793, 244, 'Maraval');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (794, 244, 'San Antonio de Irapa');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (795, 244, 'Soro');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (796, 245, 'Mejía');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (797, 246, 'Cumanacoa');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (798, 246, 'Arenas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (799, 246, 'Aricagua');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (800, 246, 'Cocollar');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (801, 246, 'San Fernando');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (802, 246, 'San Lorenzo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (803, 247, 'Villa Frontado (Muelle de Cariaco)');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (804, 247, 'Catuaro');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (805, 247, 'Rendón');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (806, 247, 'San Cruz');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (807, 247, 'Santa María');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (808, 248, 'Altagracia Cumaná');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (809, 248, 'Santa Inés Cumaná');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (810, 248, 'Valentín Valiente Cumaná');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (811, 248, 'Ayacucho Cumaná');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (812, 248, 'San Juan');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (813, 248, 'Raúl Leoni');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (814, 248, 'Gran Mariscal');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (815, 249, 'Cristóbal Colón');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (816, 249, 'Bideau');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (817, 249, 'Punta de Piedras');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (818, 249, 'Güiria');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (819, 250, 'Andrés Bello');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (820, 251, 'Antonio Rómulo Costa');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (821, 252, 'Ayacucho');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (822, 252, 'Rivas Berti');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (823, 252, 'San Pedro del Río');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (824, 253, 'Bolívar');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (825, 253, 'Palotal');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (826, 253, 'General Juan Vicente Gómez');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (827, 253, 'Isaías Medina Angarita');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (828, 254, 'Cárdenas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (829, 254, 'Amenodoro Rangel Lamus');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (830, 254, 'La Florida');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (831, 255, 'Córdoba');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (832, 256, 'Fernández Feo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (833, 256, 'Alberto Adriani');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (834, 256, 'Santo Domingo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (835, 257, 'Francisco de Miranda');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (836, 258, 'García de Hevia');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (837, 258, 'Boca de Grita');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (838, 258, 'José Antonio Páez');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (839, 259, 'Guásimos');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (840, 260, 'Independencia');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (841, 260, 'Juan Germán Roscio');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (842, 260, 'Román Cárdenas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (843, 261, 'Jáuregui');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (844, 261, 'Emilio Constantino Guerrero');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (845, 261, 'Monseñor Miguel Antonio Salas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (846, 262, 'José María Vargas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (847, 263, 'Junín');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (848, 263, 'La Petrólea');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (849, 263, 'Quinimarí');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (850, 263, 'Bramón');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (851, 264, 'Libertad');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (852, 264, 'Cipriano Castro');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (853, 264, 'Manuel Felipe Rugeles');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (854, 265, 'Capital Libertador');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (855, 265, 'Doradas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (856, 265, 'Emeterio Ochoa');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (857, 265, 'San Joaquín de Navay');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (858, 266, 'Lobatera');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (859, 266, 'Constitución');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (860, 267, 'Michelena');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (861, 268, 'Panamericano');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (862, 268, 'La Palmita');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (863, 269, 'Pedro María Ureña');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (864, 269, 'Nueva Arcadia');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (865, 270, 'Delicias');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (866, 270, 'Pecaya');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (867, 271, 'Samuel Darío Maldonado');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (868, 271, 'Boconó');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (869, 271, 'Hernández');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (870, 272, 'La Concordia');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (871, 272, 'San Juan Bautista');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (872, 272, 'Pedro María Morantes');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (873, 272, 'San Sebastián');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (874, 272, 'Dr. Francisco Romero Lobo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (875, 273, 'Seboruco');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (876, 274, 'Simón Rodríguez');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (877, 275, 'Sucre');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (878, 275, 'Eleazar López Contreras');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (879, 275, 'San Pablo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (880, 276, 'San José Obrero');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (881, 276, 'San Juan Eudes');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (882, 277, 'Uribante');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (883, 277, 'Cárdenas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (884, 277, 'Juan Pablo Peñalosa');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (885, 277, 'Potosí');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (886, 278, 'San Judas Tadeo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (887, 279, 'Araguaney');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (888, 279, 'El Jaguito');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (889, 279, 'La Esperanza');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (890, 279, 'Santa Isabel');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (891, 280, 'Boconó');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (892, 280, 'El Carmen');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (893, 280, 'Mosquey');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (894, 280, 'Ayacucho');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (895, 280, 'Burbusay');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (896, 280, 'General Ribas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (897, 280, 'Guaramacal');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (898, 280, 'Vega de Guaramacal');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (899, 280, 'Monseñor Jáuregui');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (900, 280, 'Rafael Rangel');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (901, 280, 'San Miguel');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (902, 280, 'San José');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (903, 281, 'Sabana Grande');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (904, 281, 'Cheregüé');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (905, 281, 'Granados');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (906, 282, 'Arnoldo Gabaldón');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (907, 282, 'Bolivia');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (908, 282, 'Carrillo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (909, 282, 'Cegarra');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (910, 282, 'Chejendé');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (911, 282, 'Manuel Salvador Ulloa');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (912, 282, 'San José');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (913, 283, 'Carache');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (914, 283, 'La Concepción');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (915, 283, 'Cuicas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (916, 283, 'Panamericana');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (917, 283, 'Santa Cruz');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (918, 284, 'Escuque');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (919, 284, 'La Unión (El Alto Escuque)');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (920, 284, 'Santa Rita');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (921, 284, 'Sabana Libre');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (922, 285, 'El Socorro');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (923, 285, 'Los Caprichos');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (924, 285, 'Antonio José de Sucre');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (925, 286, 'Campo Elías');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (926, 286, 'Arnoldo Gabaldón');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (927, 287, 'Santa Apolonia');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (928, 287, 'El Progreso');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (929, 287, 'La Ceiba');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (930, 287, 'Tres de Febrero');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (931, 288, 'El Dividive');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (932, 288, 'Agua Santa');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (933, 288, 'Agua Caliente');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (934, 288, 'El Cenizo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (935, 288, 'Valerita');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (936, 289, 'Monte Carmelo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (937, 289, 'Buena Vista');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (938, 289, 'Santa María del Horcón');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (939, 290, 'Motatán');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (940, 290, 'El Baño');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (941, 290, 'Jalisco');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (942, 291, 'Pampán');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (943, 291, 'Flor de Patria');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (944, 291, 'La Paz');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (945, 291, 'Santa Ana');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (946, 292, 'Pampanito');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (947, 292, 'La Concepción');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (948, 292, 'Pampanito II');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (949, 293, 'Betijoque');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (950, 293, 'José Gregorio Hernández');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (951, 293, 'La Pueblita');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (952, 293, 'Los Cedros');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (953, 294, 'Carvajal');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (954, 294, 'Campo Alegre');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (955, 294, 'Antonio Nicolás Briceño');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (956, 294, 'José Leonardo Suárez');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (957, 295, 'Sabana de Mendoza');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (958, 295, 'Junín');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (959, 295, 'Valmore Rodríguez');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (960, 295, 'El Paraíso');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (961, 296, 'Andrés Linares');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (962, 296, 'Chiquinquirá');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (963, 296, 'Cristóbal Mendoza');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (964, 296, 'Cruz Carrillo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (965, 296, 'Matriz');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (966, 296, 'Monseñor Carrillo');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (967, 296, 'Tres Esquinas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (968, 297, 'Cabimbú');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (969, 297, 'Jajó');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (970, 297, 'La Mesa de Esnujaque');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (971, 297, 'Santiago');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (972, 297, 'Tuñame');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (973, 297, 'La Quebrada');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (974, 298, 'Juan Ignacio Montilla');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (975, 298, 'La Beatriz');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (976, 298, 'La Puerta');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (977, 298, 'Mendoza del Valle de Momboy');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (978, 298, 'Mercedes Díaz');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (979, 298, 'San Luis');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (980, 299, 'Caraballeda');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (981, 299, 'Carayaca');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (982, 299, 'Carlos Soublette');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (983, 299, 'Caruao Chuspa');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (984, 299, 'Catia La Mar');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (985, 299, 'El Junko');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (986, 299, 'La Guaira');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (987, 299, 'Macuto');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (988, 299, 'Maiquetía');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (989, 299, 'Naiguatá');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (990, 299, 'Urimare');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (991, 300, 'Arístides Bastidas');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (992, 301, 'Bolívar');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (993, 302, 'Chivacoa');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (994, 302, 'Campo Elías');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (995, 303, 'Cocorote');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (996, 304, 'Independencia');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (997, 305, 'José Antonio Páez');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (998, 306, 'La Trinidad');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (999, 307, 'Manuel Monge');
INSERT INTO "t_parroquia" ("parroquia_id", "municipio_id", "name") VALUES (1000, 308, 'Salóm');

-- --------------------------------------------------------
-- Tabla: t_password_history (3 registros)
-- --------------------------------------------------------
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (138, 'lists:edit', 'Listas', 'Editar listas del sistema', 0, '2026-07-05T21:56:55.448', 0, '2026-07-05T21:56:55.448', 0, '2026-07-05T21:56:55.448', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (131, 'evaluations:view', 'Evaluaciones', 'Ver evaluaciones', 0, '2026-07-05T21:56:54.091', 0, '2026-07-05T21:56:54.091', 0, '2026-07-05T21:56:54.091', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (107, 'backups:view', 'Respaldos', 'Ver lista de respaldos', 0, '2026-07-05T21:56:50.494', 0, '2026-07-05T21:56:50.494', 0, '2026-07-05T21:56:50.494', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (111, 'reports:view', 'Reportes', 'Ver reportes', 0, '2026-07-05T21:56:51.257', 0, '2026-07-05T21:56:51.257', 0, '2026-07-05T21:56:51.257', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (133, 'evaluations:edit', 'Evaluaciones', 'Editar evaluaciones', 0, '2026-07-05T21:56:54.297', 0, '2026-07-05T21:56:54.297', 0, '2026-07-05T21:56:54.297', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (113, 'config:view', 'Configuración', 'Ver configuración del sistema', 0, '2026-07-05T21:56:51.643', 0, '2026-07-05T21:56:51.643', 0, '2026-07-05T21:56:51.643', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (146, 'activity-logs:create', 'Bitácora', 'Registrar en bitácora', 0, '2026-07-05T21:56:56.482', 0, '2026-07-05T21:56:56.482', 0, '2026-07-05T21:56:56.482', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (135, 'notifications:view', 'Notificaciones', 'Ver notificaciones', 0, '2026-07-05T21:56:55', 0, '2026-07-05T21:56:55', 0, '2026-07-05T21:56:55', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (83, 'users:edit', 'Usuarios', 'Editar usuarios existentes', 0, '2026-07-05T21:56:47.006', 0, '2026-07-05T21:56:47.006', 0, '2026-07-05T21:56:47.006', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (140, 'manuals:edit', 'Manuales', 'Crear/editar manuales', 0, '2026-07-05T21:56:55.868', 0, '2026-07-05T21:56:55.868', 0, '2026-07-05T21:56:55.868', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (120, 'requests:approve', 'Solicitudes', 'Aprobar/rechazar solicitudes', 0, '2026-07-05T21:56:52.373', 0, '2026-07-05T21:56:52.373', 0, '2026-07-05T21:56:52.373', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (126, 'enrollments:delete', 'Inscripciones', 'Eliminar inscripciones', 0, '2026-07-05T21:56:53.441', 0, '2026-07-05T21:56:53.441', 0, '2026-07-05T21:56:53.441', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (85, 'students:view', 'Estudiantes', 'Ver lista de estudiantes', 0, '2026-07-05T21:56:47.216', 0, '2026-07-05T21:56:47.216', 0, '2026-07-05T21:56:47.216', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (98, 'practices:view', 'Prácticas', 'Ver prácticas profesionales', 0, '2026-07-05T21:56:49.334', 0, '2026-07-05T21:56:49.334', 0, '2026-07-05T21:56:49.334', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (115, 'careers:view', 'Carreras', 'Ver carreras', 0, '2026-07-05T21:56:51.854', 0, '2026-07-05T21:56:51.854', 0, '2026-07-05T21:56:51.854', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (143, 'roles:manage', 'Configuración', 'Gestionar roles y permisos', 0, '2026-07-05T21:56:56.158', 0, '2026-07-05T21:56:56.158', 0, '2026-07-05T21:56:56.158', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (128, 'tracking:create', 'Seguimiento', 'Registrar seguimiento', 0, '2026-07-05T21:56:53.746', 0, '2026-07-05T21:56:53.746', 0, '2026-07-05T21:56:53.746', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (94, 'institutions:view', 'Instituciones', 'Ver lista de instituciones', 0, '2026-07-05T21:56:48.755', 0, '2026-07-05T21:56:48.755', 0, '2026-07-05T21:56:48.755', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (89, 'students:export', 'Estudiantes', 'Exportar datos de estudiantes', 0, '2026-07-05T21:56:47.791', 0, '2026-07-05T21:56:47.791', 0, '2026-07-05T21:56:47.791', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (145, 'activity-logs:view', 'Bitácora', 'Ver bitácora de actividades', 0, '2026-07-05T21:56:56.385', 0, '2026-07-05T21:56:56.385', 0, '2026-07-05T21:56:56.385', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (92, 'tutors:edit', 'Tutores', 'Editar información de tutores', 0, '2026-07-05T21:56:48.406', 0, '2026-07-05T21:56:48.406', 0, '2026-07-05T21:56:48.406', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (100, 'practices:edit', 'Prácticas', 'Editar prácticas', 0, '2026-07-05T21:56:49.536', 0, '2026-07-05T21:56:49.536', 0, '2026-07-05T21:56:49.536', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (82, 'users:create', 'Usuarios', 'Crear nuevos usuarios', 0, '2026-07-05T21:56:46.908', 0, '2026-07-05T21:56:46.908', 0, '2026-07-05T21:56:46.908', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (103, 'periods:view', 'Periodos', 'Ver periodos académicos', 0, '2026-07-05T21:56:49.834', 0, '2026-07-05T21:56:49.834', 0, '2026-07-05T21:56:49.834', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (129, 'tracking:edit', 'Seguimiento', 'Editar seguimiento', 0, '2026-07-05T21:56:53.848', 0, '2026-07-05T21:56:53.848', 0, '2026-07-05T21:56:53.848', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (105, 'periods:edit', 'Periodos', 'Editar periodos', 0, '2026-07-05T21:56:50.048', 0, '2026-07-05T21:56:50.048', 0, '2026-07-05T21:56:50.048', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (108, 'backups:create', 'Respaldos', 'Crear respaldos', 0, '2026-07-05T21:56:50.819', 0, '2026-07-05T21:56:50.819', 0, '2026-07-05T21:56:50.819', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (109, 'backups:restore', 'Respaldos', 'Restaurar respaldos', 0, '2026-07-05T21:56:50.922', 0, '2026-07-05T21:56:50.922', 0, '2026-07-05T21:56:50.922', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (95, 'institutions:create', 'Instituciones', 'Registrar nuevas instituciones', 0, '2026-07-05T21:56:48.851', 0, '2026-07-05T21:56:48.851', 0, '2026-07-05T21:56:48.851', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (96, 'institutions:edit', 'Instituciones', 'Editar información de instituciones', 0, '2026-07-05T21:56:49.13', 0, '2026-07-05T21:56:49.13', 0, '2026-07-05T21:56:49.13', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (110, 'backups:delete', 'Respaldos', 'Eliminar respaldos', 0, '2026-07-05T21:56:51.165', 0, '2026-07-05T21:56:51.165', 0, '2026-07-05T21:56:51.165', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (122, 'dashboard:view', 'Dashboard', 'Ver dashboard y estadísticas', 0, '2026-07-05T21:56:52.479', 0, '2026-07-05T21:56:52.479', 0, '2026-07-05T21:56:52.479', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (84, 'users:delete', 'Usuarios', 'Eliminar usuarios', 0, '2026-07-05T21:56:47.103', 0, '2026-07-05T21:56:47.103', 0, '2026-07-05T21:56:47.103', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (86, 'students:create', 'Estudiantes', 'Registrar nuevos estudiantes', 0, '2026-07-05T21:56:47.324', 0, '2026-07-05T21:56:47.324', 0, '2026-07-05T21:56:47.324', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (134, 'evaluations:delete', 'Evaluaciones', 'Eliminar evaluaciones', 0, '2026-07-05T21:56:54.407', 0, '2026-07-05T21:56:54.407', 0, '2026-07-05T21:56:54.407', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (127, 'tracking:view', 'Seguimiento', 'Ver seguimiento de prácticas', 0, '2026-07-05T21:56:53.542', 0, '2026-07-05T21:56:53.542', 0, '2026-07-05T21:56:53.542', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (137, 'lists:view', 'Listas', 'Ver listas del sistema', 0, '2026-07-05T21:56:55.203', 0, '2026-07-05T21:56:55.203', 0, '2026-07-05T21:56:55.203', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (97, 'institutions:delete', 'Instituciones', 'Eliminar instituciones', 0, '2026-07-05T21:56:49.227', 0, '2026-07-05T21:56:49.227', 0, '2026-07-05T21:56:49.227', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (99, 'practices:create', 'Prácticas', 'Registrar nuevas prácticas', 0, '2026-07-05T21:56:49.427', 0, '2026-07-05T21:56:49.427', 0, '2026-07-05T21:56:49.427', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (142, 'internship-types:edit', 'Tipos de Pasantía', 'Crear/editar tipos de pasantía', 0, '2026-07-05T21:56:56.051', 0, '2026-07-05T21:56:56.051', 0, '2026-07-05T21:56:56.051', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (101, 'practices:delete', 'Prácticas', 'Eliminar prácticas', 0, '2026-07-05T21:56:49.642', 0, '2026-07-05T21:56:49.642', 0, '2026-07-05T21:56:49.642', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (139, 'manuals:view', 'Manuales', 'Ver manuales', 0, '2026-07-05T21:56:55.543', 0, '2026-07-05T21:56:55.543', 0, '2026-07-05T21:56:55.543', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (106, 'periods:delete', 'Periodos', 'Eliminar periodos', 0, '2026-07-05T21:56:50.14', 0, '2026-07-05T21:56:50.14', 0, '2026-07-05T21:56:50.14', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (112, 'reports:export', 'Reportes', 'Exportar reportes', 0, '2026-07-05T21:56:51.535', 0, '2026-07-05T21:56:51.535', 0, '2026-07-05T21:56:51.535', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (90, 'tutors:view', 'Tutores', 'Ver lista de tutores', 0, '2026-07-05T21:56:48.039', 0, '2026-07-05T21:56:48.039', 0, '2026-07-05T21:56:48.039', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (104, 'periods:create', 'Periodos', 'Crear nuevos periodos', 0, '2026-07-05T21:56:49.938', 0, '2026-07-05T21:56:49.938', 0, '2026-07-05T21:56:49.938', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (114, 'config:edit', 'Configuración', 'Modificar configuración del sistema', 0, '2026-07-05T21:56:51.745', 0, '2026-07-05T21:56:51.745', 0, '2026-07-05T21:56:51.745', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (116, 'careers:create', 'Carreras', 'Crear carreras', 0, '2026-07-05T21:56:51.969', 0, '2026-07-05T21:56:51.969', 0, '2026-07-05T21:56:51.969', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (132, 'evaluations:create', 'Evaluaciones', 'Crear evaluaciones', 0, '2026-07-05T21:56:54.19', 0, '2026-07-05T21:56:54.19', 0, '2026-07-05T21:56:54.19', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (93, 'tutors:delete', 'Tutores', 'Eliminar tutores', 0, '2026-07-05T21:56:48.513', 0, '2026-07-05T21:56:48.513', 0, '2026-07-05T21:56:48.513', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (24240, 'evaluations:freeze', 'Evaluaciones', 'Congelar evaluaciones (cierre de actas)', 0, '2026-07-05T21:56:54.632', 0, '2026-07-05T21:56:54.632', 0, '2026-07-05T21:56:54.632', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (24241, 'evaluations:unfreeze', 'Evaluaciones', 'Descongelar evaluaciones para corrección', 0, '2026-07-05T21:56:54.892', 0, '2026-07-05T21:56:54.892', 0, '2026-07-05T21:56:54.892', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (136, 'notifications:send', 'Notificaciones', 'Enviar notificaciones', 0, '2026-07-05T21:56:55.104', 0, '2026-07-05T21:56:55.104', 0, '2026-07-05T21:56:55.104', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (141, 'internship-types:view', 'Tipos de Pasantía', 'Ver tipos de pasantía', 0, '2026-07-05T21:56:55.957', 0, '2026-07-05T21:56:55.957', 0, '2026-07-05T21:56:55.957', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (144, 'culmination:approve', 'Culminación', 'Aprobar culminación de prácticas', 0, '2026-07-05T21:56:56.278', 0, '2026-07-05T21:56:56.278', 0, '2026-07-05T21:56:56.278', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (17363, 'academic-config:edit', 'Configuración Académica', 'Editar configuración académica global', 0, '2026-07-05T21:56:56.67', 0, '2026-07-05T21:56:56.67', 0, '2026-07-05T21:56:56.67', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (24685, 'committee:assign', 'Evaluaciones', 'Pre-asignar miembros del comité evaluador', 0, '2026-07-05T21:56:56.818', 0, '2026-07-05T21:56:56.818', 0, '2026-07-05T21:56:56.818', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (81, 'users:view', 'Usuarios', 'Ver lista de usuarios', 0, '2026-07-05T21:56:46.603', 0, '2026-07-05T21:56:46.603', 0, '2026-07-05T21:56:46.603', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (87, 'students:edit', 'Estudiantes', 'Editar información de estudiantes', 0, '2026-07-05T21:56:47.594', 0, '2026-07-05T21:56:47.594', 0, '2026-07-05T21:56:47.594', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (88, 'students:delete', 'Estudiantes', 'Eliminar estudiantes', 0, '2026-07-05T21:56:47.695', 0, '2026-07-05T21:56:47.695', 0, '2026-07-05T21:56:47.695', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (91, 'tutors:create', 'Tutores', 'Registrar nuevos tutores', 0, '2026-07-05T21:56:48.15', 0, '2026-07-05T21:56:48.15', 0, '2026-07-05T21:56:48.15', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (102, 'practices:evaluate', 'Prácticas', 'Evaluar prácticas', 0, '2026-07-05T21:56:49.739', 0, '2026-07-05T21:56:49.739', 0, '2026-07-05T21:56:49.739', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (25974, 'periods:close', 'Periodos', 'Cerrar período académico (backup + freeze)', 0, '2026-07-05T21:56:50.405', 0, '2026-07-05T21:56:50.405', 0, '2026-07-05T21:56:50.405', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (117, 'careers:edit', 'Carreras', 'Editar carreras', 0, '2026-07-05T21:56:52.074', 0, '2026-07-05T21:56:52.074', 0, '2026-07-05T21:56:52.074', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (118, 'careers:delete', 'Carreras', 'Eliminar carreras', 0, '2026-07-05T21:56:52.178', 0, '2026-07-05T21:56:52.178', 0, '2026-07-05T21:56:52.178', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (119, 'requests:view', 'Solicitudes', 'Ver solicitudes', 0, '2026-07-05T21:56:52.273', 0, '2026-07-05T21:56:52.273', 0, '2026-07-05T21:56:52.273', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (123, 'enrollments:view', 'Inscripciones', 'Ver inscripciones', 0, '2026-07-05T21:56:52.592', 0, '2026-07-05T21:56:52.592', 0, '2026-07-05T21:56:52.592', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (124, 'enrollments:create', 'Inscripciones', 'Crear inscripciones', 0, '2026-07-05T21:56:52.697', 0, '2026-07-05T21:56:52.697', 0, '2026-07-05T21:56:52.697', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (125, 'enrollments:edit', 'Inscripciones', 'Editar inscripciones', 0, '2026-07-05T21:56:52.821', 0, '2026-07-05T21:56:52.821', 0, '2026-07-05T21:56:52.821', 1);
INSERT INTO "t_permissions" ("PERMISSIONS_ID", "NAME", "MODULE", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (130, 'tracking:delete', 'Seguimiento', 'Eliminar seguimiento', 0, '2026-07-05T21:56:53.948', 0, '2026-07-05T21:56:53.948', 0, '2026-07-05T21:56:53.948', 1);

-- --------------------------------------------------------
-- Tabla: t_person_address (24 registros)
-- --------------------------------------------------------
INSERT INTO "t_preset_questions" ("PRESET_QUESTION_ID", "DESCRIPTION", "ANSWER", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (1, '¿Cuál es el nombre de tu primera mascota?', 'Respuesta', 0, '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 1);
INSERT INTO "t_preset_questions" ("PRESET_QUESTION_ID", "DESCRIPTION", "ANSWER", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (2, '¿Cuál es tu comida favorita?', 'Respuesta', 0, '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 1);
INSERT INTO "t_preset_questions" ("PRESET_QUESTION_ID", "DESCRIPTION", "ANSWER", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (3, '¿Cuál es tu libro favorito?', 'Respuesta', 0, '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 1);
INSERT INTO "t_preset_questions" ("PRESET_QUESTION_ID", "DESCRIPTION", "ANSWER", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (4, '¿Cuántas mascotas tenías a los 10 años?', 'ASD', 0, '2026-06-16T03:23:20.453883', 0, '2026-06-16T03:23:20.453883', 0, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_preset_questions" ("PRESET_QUESTION_ID", "DESCRIPTION", "ANSWER", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (5, '¿Cuál fue tu primera mascota?', 'ASD', 0, '2026-06-16T03:23:20.453883', 0, '2026-06-16T03:23:20.453883', 0, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_preset_questions" ("PRESET_QUESTION_ID", "DESCRIPTION", "ANSWER", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (6, '¿En qué ciudad nació tu madre?', 'ASD', 0, '2026-06-16T03:23:20.453883', 0, '2026-06-16T03:23:20.453883', 0, '2026-06-16T03:23:20.453883', 1);

-- --------------------------------------------------------
-- Tabla: t_professional_practices (17 registros)
-- --------------------------------------------------------
INSERT INTO "t_request_types" ("REQUEST_TYPE_ID", "NAME", "DESCRIPTION", "IS_ACTIVE", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS", "IS_REASSIGNMENT", "CATEGORY") VALUES (1, 'Cambio de Empresa', 'Solicitud para cambiar la empresa donde se realizan las prácticas', 1, '2026-06-16T03:16:28.263254', 0, '2026-06-16T03:16:28.263254', 0, '2026-06-16T03:16:28.263254', 0, '2026-06-16T03:16:28.263254', 1, 0, 'GENERAL');
INSERT INTO "t_request_types" ("REQUEST_TYPE_ID", "NAME", "DESCRIPTION", "IS_ACTIVE", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS", "IS_REASSIGNMENT", "CATEGORY") VALUES (2, 'Cambio de Tutor', 'Solicitud para cambiar el tutor académico asignado', 1, '2026-06-16T03:16:28.263254', 0, '2026-06-16T03:16:28.263254', 0, '2026-06-16T03:16:28.263254', 0, '2026-06-16T03:16:28.263254', 1, 0, 'GENERAL');
INSERT INTO "t_request_types" ("REQUEST_TYPE_ID", "NAME", "DESCRIPTION", "IS_ACTIVE", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS", "IS_REASSIGNMENT", "CATEGORY") VALUES (3, 'Prórroga de Pasantía', 'Solicitud para extender el período de pasantía', 1, '2026-06-16T03:16:28.263254', 0, '2026-06-16T03:16:28.263254', 0, '2026-06-16T03:16:28.263254', 0, '2026-06-16T03:16:28.263254', 1, 0, 'GENERAL');
INSERT INTO "t_request_types" ("REQUEST_TYPE_ID", "NAME", "DESCRIPTION", "IS_ACTIVE", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS", "IS_REASSIGNMENT", "CATEGORY") VALUES (4, 'Retiro de Pasantía', 'Solicitud para retirarse del programa de pasantías', 1, '2026-06-16T03:16:28.263254', 0, '2026-06-16T03:16:28.263254', 0, '2026-06-16T03:16:28.263254', 0, '2026-06-16T03:16:28.263254', 1, 0, 'GENERAL');
INSERT INTO "t_request_types" ("REQUEST_TYPE_ID", "NAME", "DESCRIPTION", "IS_ACTIVE", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS", "IS_REASSIGNMENT", "CATEGORY") VALUES (5, 'Carta de Pasantía', 'Solicitud de carta de aceptación o culminación de pasantía', 1, '2026-06-16T03:16:28.263254', 0, '2026-06-16T03:16:28.263254', 0, '2026-06-16T03:16:28.263254', 0, '2026-06-16T03:16:28.263254', 1, 0, 'GENERAL');
INSERT INTO "t_request_types" ("REQUEST_TYPE_ID", "NAME", "DESCRIPTION", "IS_ACTIVE", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS", "IS_REASSIGNMENT", "CATEGORY") VALUES (6, 'Constancia de Estudios', 'Solicitud de constancia de estudios con fines de pasantía', 1, '2026-06-16T03:16:28.263254', 0, '2026-06-16T03:16:28.263254', 0, '2026-06-16T03:16:28.263254', 0, '2026-06-16T03:16:28.263254', 1, 0, 'GENERAL');
INSERT INTO "t_request_types" ("REQUEST_TYPE_ID", "NAME", "DESCRIPTION", "IS_ACTIVE", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS", "IS_REASSIGNMENT", "CATEGORY") VALUES (7, 'Revisión de Nota', 'Solicitud para revisar la calificación final de pasantía', 1, '2026-06-16T03:16:28.263254', 0, '2026-06-16T03:16:28.263254', 0, '2026-06-16T03:16:28.263254', 0, '2026-06-16T03:16:28.263254', 1, 0, 'GENERAL');
INSERT INTO "t_request_types" ("REQUEST_TYPE_ID", "NAME", "DESCRIPTION", "IS_ACTIVE", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS", "IS_REASSIGNMENT", "CATEGORY") VALUES (8, 'Otro', 'Otro tipo de solicitud no contemplada', 1, '2026-06-16T03:16:28.263254', 0, '2026-06-16T03:16:28.263254', 0, '2026-06-16T03:16:28.263254', 0, '2026-06-16T03:16:28.263254', 1, 0, 'GENERAL');
INSERT INTO "t_request_types" ("REQUEST_TYPE_ID", "NAME", "DESCRIPTION", "IS_ACTIVE", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS", "IS_REASSIGNMENT", "CATEGORY") VALUES (9, 'Cambio de Tutor', 'Solicitar cambio de tutor académico', 1, '2026-06-16T03:16:28.263254', 0, '2026-06-16T03:16:28.263254', 0, '2026-06-16T03:16:28.263254', 0, '2026-06-16T03:16:28.263254', 1, 1, 'REASSIGNMENT');
INSERT INTO "t_request_types" ("REQUEST_TYPE_ID", "NAME", "DESCRIPTION", "IS_ACTIVE", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS", "IS_REASSIGNMENT", "CATEGORY") VALUES (10, 'Cambio de Empresa', 'Solicitar cambio de empresa/institución donde realiza la pasantía', 1, '2026-06-16T03:16:28.263254', 0, '2026-06-16T03:16:28.263254', 0, '2026-06-16T03:16:28.263254', 0, '2026-06-16T03:16:28.263254', 1, 1, 'REASSIGNMENT');
INSERT INTO "t_request_types" ("REQUEST_TYPE_ID", "NAME", "DESCRIPTION", "IS_ACTIVE", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS", "IS_REASSIGNMENT", "CATEGORY") VALUES (11, 'Cambio de Carrera', 'Solicitar cambio de carrera', 1, '2026-06-16T03:16:28.263254', 0, '2026-06-16T03:16:28.263254', 0, '2026-06-16T03:16:28.263254', 0, '2026-06-16T03:16:28.263254', 1, 1, 'REASSIGNMENT');

-- --------------------------------------------------------
-- Tabla: t_roles (9 registros)
-- --------------------------------------------------------
INSERT INTO "t_roles" ("ID_ROLS", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS", "IS_SYSTEM") VALUES (5, 'TUTOR METODOLÓGICO', 'TUTOR METODOLÓGICO', 1, '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 1, FALSE);
INSERT INTO "t_roles" ("ID_ROLS", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS", "IS_SYSTEM") VALUES (6, 'QA', 'TESTER 3000', 1, '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 1, FALSE);
INSERT INTO "t_roles" ("ID_ROLS", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS", "IS_SYSTEM") VALUES (7, 'OBRERO', 'ROL DE LEOVIC', 1, '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 0, '2026-06-16T03:12:17.850399', 1, FALSE);
INSERT INTO "t_roles" ("ID_ROLS", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS", "IS_SYSTEM") VALUES (8, 'NUEVO ROL', 'nuevo rol', 1, '2026-06-19T00:36:20.698', 0, '2026-06-19T00:36:20.698', 0, '2026-06-19T00:36:20.698', 1, FALSE);
INSERT INTO "t_roles" ("ID_ROLS", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS", "IS_SYSTEM") VALUES (9, 'N', '', 1, '2026-06-24T23:35:55.563', 0, '2026-06-24T23:35:55.563', 0, '2026-06-24T23:35:55.563', 1, FALSE);
INSERT INTO "t_roles" ("ID_ROLS", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS", "IS_SYSTEM") VALUES (1, 'ADMIN', 'Administrador con acceso total al sistema', 0, '2026-07-05T21:56:43.942', 0, '2026-07-05T21:56:43.942', 0, '2026-07-05T21:56:43.942', 1, TRUE);
INSERT INTO "t_roles" ("ID_ROLS", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS", "IS_SYSTEM") VALUES (2, 'ASISTENTE', 'Asistente con permisos limitados', 0, '2026-07-05T21:56:45.543', 0, '2026-07-05T21:56:45.543', 0, '2026-07-05T21:56:45.543', 1, TRUE);
INSERT INTO "t_roles" ("ID_ROLS", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS", "IS_SYSTEM") VALUES (3, 'TUTOR', 'Tutor académico - gestión de seguimiento y notas', 0, '2026-07-05T21:56:46.039', 0, '2026-07-05T21:56:46.039', 0, '2026-07-05T21:56:46.039', 1, TRUE);
INSERT INTO "t_roles" ("ID_ROLS", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS", "IS_SYSTEM") VALUES (4, 'ESTUDIANTE', 'Estudiante - visualización y solicitudes', 0, '2026-07-05T21:56:46.456', 0, '2026-07-05T21:56:46.456', 0, '2026-07-05T21:56:46.456', 1, TRUE);

-- --------------------------------------------------------
-- Tabla: t_roles_permissions (241 registros)
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
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 122);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 123);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 124);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 125);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 126);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 127);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 128);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 129);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 130);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 131);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 132);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 133);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 134);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 135);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 136);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 137);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 138);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 139);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 140);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 141);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 142);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 143);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 144);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 145);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 146);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 17363);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 81);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 85);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 86);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 87);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 89);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 90);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 91);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 92);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 93);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 94);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 98);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 99);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 100);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 103);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 104);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 105);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 111);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 112);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 115);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 116);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 117);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 119);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 120);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 122);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 123);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 124);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 125);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 127);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 128);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 129);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 131);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 132);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 133);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 135);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 136);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 137);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 139);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 141);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (2, 145);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (5, 85);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (5, 86);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (5, 87);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (5, 88);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (5, 89);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (5, 90);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (5, 94);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (5, 98);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (5, 102);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (5, 103);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (5, 111);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (5, 112);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (5, 115);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (5, 122);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (5, 123);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (5, 124);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (5, 125);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (5, 126);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (5, 127);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (5, 131);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (5, 132);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (5, 133);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (5, 134);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (5, 135);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (5, 136);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (5, 137);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (5, 139);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (5, 140);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (5, 141);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (5, 145);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (5, 146);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 81);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 82);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 83);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 84);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 85);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 86);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 87);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 88);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 89);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 90);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 91);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 92);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 93);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 94);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 95);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 96);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 97);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 98);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 99);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 100);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 101);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 102);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 103);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 104);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 105);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 106);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 107);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 108);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 109);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 110);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 111);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 112);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 113);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 114);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 115);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 116);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 117);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 118);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 119);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 120);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 122);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 123);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 124);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 125);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 126);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 127);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 128);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 129);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 130);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 131);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 132);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 133);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 134);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 135);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 136);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 137);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 138);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 139);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 140);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 141);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 142);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 143);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 144);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 145);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (6, 146);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (7, 122);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (8, 145);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (8, 146);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (8, 81);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (8, 82);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (8, 83);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (8, 84);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (3, 122);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (3, 135);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (4, 122);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (4, 119);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (4, 85);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (4, 98);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (4, 111);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (4, 127);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (4, 131);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (4, 135);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (4, 145);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (4, 146);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 24240);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 24241);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 24685);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (1, 25974);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (3, 103);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (3, 139);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (3, 85);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (3, 89);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (3, 90);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (3, 98);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (3, 102);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (3, 111);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (3, 119);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (3, 120);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (3, 127);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (3, 128);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (3, 129);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (3, 131);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (3, 132);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (3, 133);
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") VALUES (3, 145);

-- --------------------------------------------------------
-- Tabla: t_student_requests (6 registros)
-- --------------------------------------------------------
INSERT INTO "t_system_institution" ("system_institution_id", "legal_name", "commercial_name", "acronym", "rif", "phone", "email", "website", "logo_url", "resolution_number", "foundation_date", "status", "created_at", "updated_at", "region", "nucleus", "extension") VALUES (1, 'UNEFA Universidad Nacional Experimental Politécnica de las Fuerzas Armadas', 'UNEFA', 'UNEFA', 'G-20000660-9', '', 'ingresopregrado@unefa.edu.ve', 'https://www.unefa.edu.ve/portal/', NULL, 'Resolución N° 28.', NULL, 1, '2026-06-16T03:23:57.825967', '2026-06-24T14:35:06.418', 'LOS LLANOS', 'PORTUGUESA', 'ACARIGUA');

-- --------------------------------------------------------
-- Tabla: t_system_nucleus (1 registros)
-- --------------------------------------------------------
INSERT INTO "t_system_nucleus" ("nucleus_id", "code", "name", "region", "nucleus_type", "phone", "email", "is_main", "status", "created_at", "updated_at") VALUES (1, 'nucleo acarigua', 'acarigua portuguesa', 'LOS LLANOS', 'EXTENSIÓN', NULL, NULL, FALSE, 1, '2026-06-24T14:50:16.129', '2026-06-24T15:02:32.804');

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
-- Tabla: t_tutor_career (27 registros)
-- --------------------------------------------------------
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (44, 'APROBADO', 'A', 14, '2026-06-16T04:00:19.860378', 1, '2026-06-16T04:00:19.860378', 1, '2026-06-16T04:00:19.860378', 1, '2026-06-16T04:00:19.860378', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (45, 'REPROBADO', 'R', 14, '2026-06-16T04:00:19.860378', 1, '2026-06-16T04:00:19.860378', 1, '2026-06-16T04:00:19.860378', 1, '2026-06-16T04:00:19.860378', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (46, 'PENDIENTE', 'PEN', 15, '2026-06-16T04:00:19.860378', 1, '2026-06-16T04:00:19.860378', 1, '2026-06-16T04:00:19.860378', 1, '2026-06-16T04:00:19.860378', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (47, 'ABIERTO', 'ABT', 15, '2026-06-16T04:00:19.860378', 1, '2026-06-16T04:00:19.860378', 1, '2026-06-16T04:00:19.860378', 1, '2026-06-16T04:00:19.860378', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (48, 'CULMINADO', 'CULM', 15, '2026-06-16T04:00:19.860378', 1, '2026-06-16T04:00:19.860378', 1, '2026-06-16T04:00:19.860378', 1, '2026-06-16T04:00:19.860378', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (49, 'ANULADO', 'NULL', 15, '2026-06-16T04:00:19.860378', 1, '2026-06-16T04:00:19.860378', 1, '2026-06-16T04:00:19.860378', 1, '2026-06-16T04:00:19.860378', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (50, 'LOS LLANOS', 'LOS LLAN', 16, '2026-06-16T04:00:19.860378', 1, '2026-06-16T04:00:19.860378', 1, '2026-06-16T04:00:19.860378', 1, '2026-06-16T04:00:19.860378', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (51, 'PORTUGUESA', 'PORTUGUE', 17, '2026-06-16T04:00:19.860378', 1, '2026-06-16T04:00:19.860378', 1, '2026-06-16T04:00:19.860378', 1, '2026-06-16T04:00:19.860378', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (52, 'ACARIGUA', 'ACARIGUA', 18, '2026-06-16T04:00:19.860378', 1, '2026-06-16T04:00:19.860378', 1, '2026-06-16T04:00:19.860378', 1, '2026-06-16T04:00:19.860378', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (53, 'SI', 'SI', 19, '2026-06-16T04:00:19.860378', 1, '2026-06-16T04:00:19.860378', 1, '2026-06-16T04:00:19.860378', 1, '2026-06-16T04:00:19.860378', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (54, 'NO', 'NO', 19, '2026-06-16T04:00:19.860378', 1, '2026-06-16T04:00:19.860378', 1, '2026-06-16T04:00:19.860378', 1, '2026-06-16T04:00:19.860378', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (57, 'ENFERMERIA', 'ENF', 21, '2026-06-16T04:00:19.860378', 1, '2026-06-16T04:00:19.860378', 1, '2026-06-16T04:00:19.860378', 1, '2026-06-16T04:00:19.860378', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (58, 'INGENIERIA', 'ING', 21, '2026-06-16T04:00:19.860378', 1, '2026-06-16T04:00:19.860378', 1, '2026-06-16T04:00:19.860378', 1, '2026-06-16T04:00:19.860378', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (86, '0412', NULL, 380, '2026-06-16T04:00:58.917598', 1, '2026-06-16T04:00:58.917598', 1, '2026-06-16T04:00:58.917598', 1, '2026-06-16T04:00:58.917598', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (87, '0414', NULL, 380, '2026-06-16T04:00:58.917598', 1, '2026-06-16T04:00:58.917598', 1, '2026-06-16T04:00:58.917598', 1, '2026-06-16T04:00:58.917598', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (88, '0424', NULL, 380, '2026-06-16T04:00:58.917598', 1, '2026-06-16T04:00:58.917598', 1, '2026-06-16T04:00:58.917598', 1, '2026-06-16T04:00:58.917598', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (89, '0416', NULL, 380, '2026-06-16T04:00:58.917598', 1, '2026-06-16T04:00:58.917598', 1, '2026-06-16T04:00:58.917598', 1, '2026-06-16T04:00:58.917598', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (90, '0426', NULL, 380, '2026-06-16T04:00:58.917598', 1, '2026-06-16T04:00:58.917598', 1, '2026-06-16T04:00:58.917598', 1, '2026-06-16T04:00:58.917598', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (91, '0212', NULL, 380, '2026-06-16T04:00:58.917598', 1, '2026-06-16T04:00:58.917598', 1, '2026-06-16T04:00:58.917598', 1, '2026-06-16T04:00:58.917598', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (92, 'PORTUGUESA', 'PORTUGUE', 388, '2026-06-16T04:00:58.917598', 1, '2026-06-16T04:00:58.917598', 1, '2026-06-16T04:00:58.917598', 1, '2026-06-16T04:00:58.917598', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (163, '1', '1', 397, '2026-06-16T04:03:52.007076', 1, '2026-06-16T04:03:52.007076', 1, '2026-06-16T04:03:52.007076', 1, '2026-06-16T04:03:52.007076', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (164, '2', '2', 397, '2026-06-16T04:03:52.007076', 1, '2026-06-16T04:03:52.007076', 1, '2026-06-16T04:03:52.007076', 1, '2026-06-16T04:03:52.007076', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (165, '3', '3', 397, '2026-06-16T04:03:52.007076', 1, '2026-06-16T04:03:52.007076', 1, '2026-06-16T04:03:52.007076', 1, '2026-06-16T04:03:52.007076', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (94, 'PREGRADO', 'PRE', 391, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (95, 'ESPECIALIZACIÓN', 'ESP', 391, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (96, 'MAESTRÍA', 'MAE', 391, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (97, 'DOCTORADO', 'DOC', 391, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (104, '0255', NULL, 380, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (105, 'TÉCNICO SUPERIOR UNIVERSITARIO', 'TSU', 20, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (106, 'MEDICO CIRUJANO', 'MED_CI', 20, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (107, 'ODONTÓLOGO', 'ODON', 20, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (108, 'FARMACÉUTICO', 'FARMAC', 20, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (109, 'ABOGADO', 'ABOG', 20, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (110, 'POLITÓLOGO', 'POLITO', 20, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (111, 'ARQUITECTO', 'ARQUITEC', 20, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (112, 'MEDICO VETERINARIO', 'MED_VEC', 20, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (123, '1', '1', 396, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (124, '2', '2', 396, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (125, '3', '3', 396, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (126, '4', '4', 396, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (127, '5', '5', 396, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (128, '6', '6', 396, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (129, '7', '7', 396, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (130, '8', '8', 396, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (131, '9', '9', 396, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (132, '10', '10', 396, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (135, 'PRESENCIAL', 'PRES', 500, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (136, 'VIRTUAL', 'VIRT', 500, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (137, 'TELEFÓNICA', 'TEL', 500, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (138, 'VISITA INICIAL', 'VI', 501, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (139, 'SEGUIMIENTO REGULAR', 'SR', 501, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (140, 'REVISIÓN DE BITÁCORAS', 'RB', 501, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (141, 'EVALUACIÓN PARCIAL', 'EP', 501, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (142, 'SEGUIMIENTO A PROBLEMAS', 'SP', 501, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (143, 'CAMBIO DE EMPRESA', 'CE', 501, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (144, 'CAMBIO DE TUTOR', 'CT', 501, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (145, 'SUSPENSIÓN', 'SUS', 501, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (146, 'REANUDACIÓN', 'REA', 501, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (147, 'EVALUACIÓN FINAL', 'EF', 501, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (148, 'CERTIFICACIÓN', 'CERT', 501, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (149, '0422', NULL, 380, '2026-06-16T03:23:20.453883', 0, '2026-06-16T03:23:20.453883', 0, '2026-06-16T03:23:20.453883', 0, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (150, 'DOCTOR', 'DOC', 20, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (151, 'MAGISTER', 'MAG', 20, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (152, 'ESPECIALISTA', 'ESP', 20, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (153, 'MÉDICO', 'MED', 20, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (154, 'CONTADOR', 'CPA', 20, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (155, 'TÉCNICO SUPERIOR', 'TSU', 20, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (156, 'MAGÍSTER', 'MG', 391, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (157, '0412', NULL, 398, '2026-06-16T03:23:20.453883', 0, '2026-06-16T03:23:20.453883', 0, '2026-06-16T03:23:20.453883', 0, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (158, '0414', NULL, 398, '2026-06-16T03:23:20.453883', 0, '2026-06-16T03:23:20.453883', 0, '2026-06-16T03:23:20.453883', 0, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (159, '0424', NULL, 398, '2026-06-16T03:23:20.453883', 0, '2026-06-16T03:23:20.453883', 0, '2026-06-16T03:23:20.453883', 0, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (160, '0416', NULL, 398, '2026-06-16T03:23:20.453883', 0, '2026-06-16T03:23:20.453883', 0, '2026-06-16T03:23:20.453883', 0, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (161, '0426', NULL, 398, '2026-06-16T03:23:20.453883', 0, '2026-06-16T03:23:20.453883', 0, '2026-06-16T03:23:20.453883', 0, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (162, '0212', NULL, 398, '2026-06-16T03:23:20.453883', 0, '2026-06-16T03:23:20.453883', 0, '2026-06-16T03:23:20.453883', 0, '2026-06-16T03:23:20.453883', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (68, 'Académico', 'ACADEMICO', 503, '2026-06-17T02:04:44.651036', 1, '2026-06-17T02:04:44.651036', 1, '2026-06-17T02:04:44.651036', 1, '2026-06-17T02:04:44.651036', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (69, 'Metodológico', 'METODOLOGICO', 503, '2026-06-17T02:04:44.651036', 1, '2026-06-17T02:04:44.651036', 1, '2026-06-17T02:04:44.651036', 1, '2026-06-17T02:04:44.651036', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (166, 'INGENIERO/A EN SISTEMAS', 'ING_SIST', 504, '2026-06-17T02:04:44.651036', 1, '2026-06-17T02:04:44.651036', 1, '2026-06-17T02:04:44.651036', 1, '2026-06-17T02:04:44.651036', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (167, 'INGENIERO/A CIVIL', 'ING_CIV', 504, '2026-06-17T02:04:44.651036', 1, '2026-06-17T02:04:44.651036', 1, '2026-06-17T02:04:44.651036', 1, '2026-06-17T02:04:44.651036', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (168, 'INGENIERO/A INDUSTRIAL', 'ING_IND', 504, '2026-06-17T02:04:44.651036', 1, '2026-06-17T02:04:44.651036', 1, '2026-06-17T02:04:44.651036', 1, '2026-06-17T02:04:44.651036', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (169, 'INGENIERO/A ELÉCTRICO', 'ING_ELECT', 504, '2026-06-17T02:04:44.651036', 1, '2026-06-17T02:04:44.651036', 1, '2026-06-17T02:04:44.651036', 1, '2026-06-17T02:04:44.651036', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (170, 'CONTADOR/A PÚBLICO', 'CONT_PUB', 504, '2026-06-17T02:04:44.651036', 1, '2026-06-17T02:04:44.651036', 1, '2026-06-17T02:04:44.651036', 1, '2026-06-17T02:04:44.651036', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (171, 'LICENCIADO/A EN ADMINISTRACIÓN', 'LIC_ADM', 504, '2026-06-17T02:04:44.651036', 1, '2026-06-17T02:04:44.651036', 1, '2026-06-17T02:04:44.651036', 1, '2026-06-17T02:04:44.651036', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (172, 'LICENCIADO/A EN EDUCACIÓN', 'LIC_EDU', 504, '2026-06-17T02:04:44.651036', 1, '2026-06-17T02:04:44.651036', 1, '2026-06-17T02:04:44.651036', 1, '2026-06-17T02:04:44.651036', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (173, 'ABOGADO/A', 'ABOG', 504, '2026-06-17T02:04:44.651036', 1, '2026-06-17T02:04:44.651036', 1, '2026-06-17T02:04:44.651036', 1, '2026-06-17T02:04:44.651036', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (174, 'MÉDICO/A', 'MED', 504, '2026-06-17T02:04:44.651036', 1, '2026-06-17T02:04:44.651036', 1, '2026-06-17T02:04:44.651036', 1, '2026-06-17T02:04:44.651036', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (175, 'T.S.U.', 'TSU', 504, '2026-06-17T02:04:44.651036', 1, '2026-06-17T02:04:44.651036', 1, '2026-06-17T02:04:44.651036', 1, '2026-06-17T02:04:44.651036', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (1, 'FEMENINO', 'F', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (2, 'MASCULINO', 'M', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (3, 'SOLTERO', 'S', 2, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (4, 'CASADO', 'C', 2, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (5, 'DIVORCIADO', 'D', 2, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (6, 'CONCUBINO', 'CB', 2, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (7, 'VIUDO', 'V', 2, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (8, 'VENEZOLANO', 'V', 3, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (9, 'EXTRANJERO', 'E', 3, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (10, 'DIURNO', 'D1', 4, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (11, 'NOCTURNO', 'N2', 4, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (12, 'SABATINO', 'S3', 4, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (13, 'SI', 'SI', 5, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (14, 'NO', 'NO', 5, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (15, 'PUBLICA', 'PÚBLICA', 6, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (16, 'PRIVADA', 'PRIVADA', 6, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (17, 'MIXTA', 'MIXTA', 6, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (18, 'C', 'C', 7, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (19, 'G', 'G', 7, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (20, 'J', 'J', 7, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (21, 'HOSPITALARIA', 'HOSP', 8, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (22, 'COMUNITARIA', 'COM', 8, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (23, 'ÚNICA', 'ORD', 8, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (24, 'ORDINARIO', 'ORD', 9, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (25, 'CONTRATADO', 'CONT', 9, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (26, 'DEDICACIÓN EXCLUSIVA', 'DE', 10, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (27, 'TIEMPO COMPLETO', 'TC', 10, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (28, 'TIEMPO CONVENCIONAL', 'TV', 10, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (29, 'MEDIO TIEMPO', 'MV', 10, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (30, 'AUXILIAR DOCENTE', 'AUXILIAR', 11, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (31, 'DOCENTE INSTRUCTOR', 'INSTRUCT', 11, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (32, 'DOCENTE ASISTENTE', 'ASISTENT', 11, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (33, 'DOCENTE AGREGADO', 'AGREGADO', 11, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (34, 'DOCENTE ASOCIADO', 'ASOCIADO', 11, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (35, 'DOCENTE TITULAR', 'TITULAR', 11, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (36, 'CIVIL', 'CIV', 12, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (37, 'MILITAR', 'MIL', 12, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (38, 'SUBTENIENTE', 'SBTTE', 13, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (39, 'TENIENTE', 'TTE', 13, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (40, 'CAPITAN', 'CAP', 13, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (41, 'MAYOR', 'MY', 13, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (42, 'TENIENTE CORONEL', 'TTE CNEL', 13, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (43, 'CORONEL', 'CNEL', 13, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (59, 'NO APLICA', NULL, 13, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1, '2026-06-16T03:59:57.156699', 1);
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES (70, 'PASAPORTE', 'P', 3, '2026-06-24T01:42:04.291', 0, '2026-06-24T01:42:04.291', 0, '2026-06-24T01:42:04.291', 0, '2026-06-24T01:42:04.291', 1);

-- ============================================================
-- SECCIÓN 5: CONSTRAINTS
-- ============================================================

-- Foreign Keys
ALTER TABLE "t_academic_config" ADD CONSTRAINT "fk_academic_config_user" FOREIGN KEY ("UPDATED_BY") REFERENCES t_user("USER_ID");
ALTER TABLE "t_activity_logs" ADD CONSTRAINT "fk_activity_logs_practice" FOREIGN KEY ("PROFESSIONAL_PRACTICE_ID") REFERENCES t_professional_practices("PROFESSIONAL_PRACTICE_ID");
ALTER TABLE "t_activity_logs" ADD CONSTRAINT "fk_activity_logs_student" FOREIGN KEY ("STUDENT_ID") REFERENCES t_students("STUDENTS_ID");
ALTER TABLE "t_activity_logs" ADD CONSTRAINT "fk_activity_logs_student_person" FOREIGN KEY (student_person_id) REFERENCES t_persons(person_id) ON DELETE RESTRICT;
ALTER TABLE "t_address" ADD CONSTRAINT "fk_address_parroquia" FOREIGN KEY (parroquia_id) REFERENCES t_parroquia(parroquia_id);
ALTER TABLE "t_auth_log" ADD CONSTRAINT "fk_auth_log_user" FOREIGN KEY ("USER_ID") REFERENCES t_user("USER_ID");
ALTER TABLE "t_backups" ADD CONSTRAINT "fk_backups_user" FOREIGN KEY (created_by) REFERENCES t_user("USER_ID");
ALTER TABLE "t_career_internship_type" ADD CONSTRAINT "fk_cit_internship_type" FOREIGN KEY ("INTERNSHIP_TYPE_ID") REFERENCES t_internship_type("INTERNSHIP_TYPE_ID");
ALTER TABLE "t_career_internship_type" ADD CONSTRAINT "fk_cit_career" FOREIGN KEY ("CAREER_ID") REFERENCES t_career("CAREER_ID");
ALTER TABLE "t_change_log" ADD CONSTRAINT "fk_change_log_operation" FOREIGN KEY ("OPERATION_ID") REFERENCES t_operation("OPERATION_ID");
ALTER TABLE "t_change_log" ADD CONSTRAINT "fk_change_log_user" FOREIGN KEY ("USER_ID") REFERENCES t_user("USER_ID");
ALTER TABLE "t_change_log" ADD CONSTRAINT "fk_change_log_tables" FOREIGN KEY ("TABLE_ID") REFERENCES t_tables("TABLE_ID");
ALTER TABLE "t_change_log" ADD CONSTRAINT "fk_change_log_columns" FOREIGN KEY ("COLUMN_ID") REFERENCES t_columns("COLUMN_ID");
ALTER TABLE "t_chat_sessions" ADD CONSTRAINT "fk_chat_session_user" FOREIGN KEY ("USER_ID") REFERENCES t_user("USER_ID");
ALTER TABLE "t_columns" ADD CONSTRAINT "fk_columns_tables" FOREIGN KEY ("TABLE_ID") REFERENCES t_tables("TABLE_ID");
ALTER TABLE "t_committee_assignment" ADD CONSTRAINT "t_committee_assignment_REGISTERED_BY_fkey" FOREIGN KEY ("REGISTERED_BY") REFERENCES t_user("USER_ID");
ALTER TABLE "t_committee_assignment" ADD CONSTRAINT "t_committee_assignment_PROFESSIONAL_PRACTICE_ID_fkey" FOREIGN KEY ("PROFESSIONAL_PRACTICE_ID") REFERENCES t_professional_practices("PROFESSIONAL_PRACTICE_ID");
ALTER TABLE "t_coordinadores" ADD CONSTRAINT "fk_coordinadores_career" FOREIGN KEY ("CAREER_ID") REFERENCES t_career("CAREER_ID");
ALTER TABLE "t_credential_tokens" ADD CONSTRAINT "fk_credential_tokens_user" FOREIGN KEY (user_id) REFERENCES t_user("USER_ID");
ALTER TABLE "t_credential_tokens" ADD CONSTRAINT "fk_credential_tokens_created_by" FOREIGN KEY (created_by) REFERENCES t_user("USER_ID");
ALTER TABLE "t_culmination_reversals" ADD CONSTRAINT "t_culmination_reversals_PRACTICE_ID_fkey" FOREIGN KEY ("PRACTICE_ID") REFERENCES t_professional_practices("PROFESSIONAL_PRACTICE_ID");
ALTER TABLE "t_culmination_reversals" ADD CONSTRAINT "t_culmination_reversals_REVERSED_BY_fkey" FOREIGN KEY ("REVERSED_BY") REFERENCES t_user("USER_ID");
ALTER TABLE "t_enrollment_field_changes" ADD CONSTRAINT "fk_efc_practice" FOREIGN KEY ("PROFESSIONAL_PRACTICE_ID") REFERENCES t_professional_practices("PROFESSIONAL_PRACTICE_ID");
ALTER TABLE "t_evaluation" ADD CONSTRAINT "fk_evaluation_practice" FOREIGN KEY ("PROFESSIONAL_PRACTICE_ID") REFERENCES t_professional_practices("PROFESSIONAL_PRACTICE_ID");
ALTER TABLE "t_evaluation" ADD CONSTRAINT "fk_evaluation_registered_by" FOREIGN KEY ("REGISTERED_BY") REFERENCES t_user("USER_ID");
ALTER TABLE "t_evaluation" ADD CONSTRAINT "fk_evaluation_evaluator" FOREIGN KEY ("EVALUATOR_ID") REFERENCES t_user("USER_ID");
ALTER TABLE "t_evaluation" ADD CONSTRAINT "t_evaluation_unfreeze_authorized_by_fkey" FOREIGN KEY (unfreeze_authorized_by) REFERENCES t_user("USER_ID");
ALTER TABLE "t_evaluation_detail" ADD CONSTRAINT "fk_evaluation_detail_evaluation" FOREIGN KEY ("EVALUATION_ID") REFERENCES t_evaluation("EVALUATION_ID") ON DELETE CASCADE;
ALTER TABLE "t_evaluation_detail" ADD CONSTRAINT "fk_evaluation_detail_criteria" FOREIGN KEY ("CRITERIA_ID") REFERENCES t_evaluation_criteria("CRITERIA_ID");
ALTER TABLE "t_institution_address" ADD CONSTRAINT "fk_institution_address_type" FOREIGN KEY (address_type_id) REFERENCES t_address_type(address_type_id);
ALTER TABLE "t_institution_address" ADD CONSTRAINT "fk_institution_address_institution" FOREIGN KEY (institution_id) REFERENCES t_institution("INSTITUTION_ID") ON DELETE CASCADE;
ALTER TABLE "t_institution_address" ADD CONSTRAINT "fk_institution_address_address" FOREIGN KEY (address_id) REFERENCES t_address(address_id);
ALTER TABLE "t_institution_career" ADD CONSTRAINT "fk_inst_career_institution" FOREIGN KEY ("INSTITUTION_ID") REFERENCES t_institution("INSTITUTION_ID");
ALTER TABLE "t_institution_career" ADD CONSTRAINT "fk_inst_career_career" FOREIGN KEY ("CAREER_ID") REFERENCES t_career("CAREER_ID");
ALTER TABLE "t_institution_internship_type" ADD CONSTRAINT "fk_inst_inter_type_type" FOREIGN KEY ("INTERNSHIP_TYPE_ID") REFERENCES t_internship_type("INTERNSHIP_TYPE_ID");
ALTER TABLE "t_institution_internship_type" ADD CONSTRAINT "fk_inst_inter_type_institution" FOREIGN KEY ("INSTITUTION_ID") REFERENCES t_institution("INSTITUTION_ID");
ALTER TABLE "t_institution_manager" ADD CONSTRAINT "fk_manager_institution" FOREIGN KEY ("INSTITUTION_ID") REFERENCES t_institution("INSTITUTION_ID") ON DELETE SET NULL;
ALTER TABLE "t_institution_manager" ADD CONSTRAINT "fk_manager_person" FOREIGN KEY (person_id) REFERENCES t_persons(person_id) ON DELETE RESTRICT;
ALTER TABLE "t_institution_manager_institution" ADD CONSTRAINT "fk_manager_inst_manager" FOREIGN KEY ("MANAGER_ID") REFERENCES t_institution_manager("MANAGER_ID") ON DELETE CASCADE;
ALTER TABLE "t_institution_manager_institution" ADD CONSTRAINT "fk_manager_inst_institution" FOREIGN KEY ("INSTITUTION_ID") REFERENCES t_institution("INSTITUTION_ID") ON DELETE CASCADE;
ALTER TABLE "t_key_history" ADD CONSTRAINT "fk_key_history_user_key" FOREIGN KEY ("USER_KEY_ID", "USER_ID") REFERENCES t_user_key("USER_KEY_ID", "USER_ID");
ALTER TABLE "t_municipio" ADD CONSTRAINT "fk_municipio_estado" FOREIGN KEY (estado_id) REFERENCES t_estado(estado_id);
ALTER TABLE "t_notifications" ADD CONSTRAINT "fk_notification_user" FOREIGN KEY ("USER_ID") REFERENCES t_user("USER_ID") ON DELETE CASCADE;
ALTER TABLE "t_nucleus_career" ADD CONSTRAINT "t_nucleus_career_nucleus_id_fkey" FOREIGN KEY (nucleus_id) REFERENCES t_system_nucleus(nucleus_id) ON DELETE CASCADE;
ALTER TABLE "t_nucleus_career" ADD CONSTRAINT "t_nucleus_career_career_id_fkey" FOREIGN KEY (career_id) REFERENCES t_career("CAREER_ID");
ALTER TABLE "t_parroquia" ADD CONSTRAINT "fk_parroquia_municipio" FOREIGN KEY (municipio_id) REFERENCES t_municipio(municipio_id);
ALTER TABLE "t_password_history" ADD CONSTRAINT "fk_password_history_user" FOREIGN KEY ("USER_ID") REFERENCES t_user("USER_ID");
ALTER TABLE "t_person_address" ADD CONSTRAINT "fk_person_address_address" FOREIGN KEY (address_id) REFERENCES t_address(address_id);
ALTER TABLE "t_person_address" ADD CONSTRAINT "fk_person_address_person" FOREIGN KEY (person_id) REFERENCES t_persons(person_id) ON DELETE CASCADE;
ALTER TABLE "t_person_address" ADD CONSTRAINT "fk_person_address_type" FOREIGN KEY (address_type_id) REFERENCES t_address_type(address_type_id);
ALTER TABLE "t_practice_culmination" ADD CONSTRAINT "fk_culmination_approved_by" FOREIGN KEY ("APPROVED_BY") REFERENCES t_user("USER_ID") ON DELETE SET NULL;
ALTER TABLE "t_practice_culmination" ADD CONSTRAINT "fk_culmination_practice" FOREIGN KEY ("PRACTICE_ID") REFERENCES t_professional_practices("PROFESSIONAL_PRACTICE_ID") ON DELETE CASCADE;
ALTER TABLE "t_practice_visits" ADD CONSTRAINT "fk_practice_visits_practice" FOREIGN KEY ("PROFESSIONAL_PRACTICE_ID") REFERENCES t_professional_practices("PROFESSIONAL_PRACTICE_ID");
ALTER TABLE "t_practice_visits" ADD CONSTRAINT "fk_practice_visits_tutor" FOREIGN KEY ("TUTOR_ID") REFERENCES t_tutors("TUTOR_ID");
ALTER TABLE "t_practice_visits" ADD CONSTRAINT "fk_practice_visits_tutor_person" FOREIGN KEY (tutor_person_id) REFERENCES t_persons(person_id) ON DELETE RESTRICT;
ALTER TABLE "t_professional_practices" ADD CONSTRAINT "fk_pp_manager" FOREIGN KEY ("MANAGER_ID") REFERENCES t_institution_manager("MANAGER_ID");
ALTER TABLE "t_professional_practices" ADD CONSTRAINT "fk_pp_internship_type" FOREIGN KEY ("INTERNSHIP_TYPE_ID") REFERENCES t_internship_type("INTERNSHIP_TYPE_ID");
ALTER TABLE "t_professional_practices" ADD CONSTRAINT "fk_pp_student_person" FOREIGN KEY (student_person_id) REFERENCES t_persons(person_id) ON DELETE RESTRICT;
ALTER TABLE "t_professional_practices" ADD CONSTRAINT "fk_pp_career" FOREIGN KEY ("CAREER_ID") REFERENCES t_career("CAREER_ID");
ALTER TABLE "t_professional_practices" ADD CONSTRAINT "t_professional_practices_extension_granted_by_fkey" FOREIGN KEY ("EXTENSION_GRANTED_BY") REFERENCES t_user("USER_ID");
ALTER TABLE "t_professional_practices" ADD CONSTRAINT "fk_pp_period" FOREIGN KEY ("PERIOD_ID") REFERENCES t_internships_period("PERIOD_ID");
ALTER TABLE "t_professional_practices" ADD CONSTRAINT "fk_pp_institution" FOREIGN KEY ("INSTITUTION_ID") REFERENCES t_institution("INSTITUTION_ID");
ALTER TABLE "t_professional_practices" ADD CONSTRAINT "fk_pp_student" FOREIGN KEY ("STUDENTS_ID") REFERENCES t_students("STUDENTS_ID");
ALTER TABLE "t_professional_practices_tutor" ADD CONSTRAINT "fk_ppt_tutor" FOREIGN KEY ("TUTOR_ID") REFERENCES t_tutors("TUTOR_ID");
ALTER TABLE "t_professional_practices_tutor" ADD CONSTRAINT "fk_ppt_tutor_person" FOREIGN KEY (tutor_person_id) REFERENCES t_persons(person_id) ON DELETE RESTRICT;
ALTER TABLE "t_professional_practices_tutor" ADD CONSTRAINT "fk_ppt_practice" FOREIGN KEY ("PROFESSIONAL_PRACTICE_ID") REFERENCES t_professional_practices("PROFESSIONAL_PRACTICE_ID");
ALTER TABLE "t_prospect_list_items" ADD CONSTRAINT "fk_prospect_items_user" FOREIGN KEY ("ADDED_BY") REFERENCES t_user("USER_ID");
ALTER TABLE "t_prospect_list_items" ADD CONSTRAINT "fk_prospect_items_list" FOREIGN KEY ("LIST_ID") REFERENCES t_prospect_lists("LIST_ID") ON DELETE CASCADE;
ALTER TABLE "t_prospect_list_items" ADD CONSTRAINT "fk_prospect_items_student" FOREIGN KEY ("STUDENTS_ID") REFERENCES t_students("STUDENTS_ID");
ALTER TABLE "t_prospect_lists" ADD CONSTRAINT "fk_prospect_lists_period" FOREIGN KEY ("PERIOD_ID") REFERENCES t_internships_period("PERIOD_ID");
ALTER TABLE "t_prospect_lists" ADD CONSTRAINT "fk_prospect_lists_user" FOREIGN KEY ("CREATED_BY") REFERENCES t_user("USER_ID");
ALTER TABLE "t_recovery_tokens" ADD CONSTRAINT "fk_recovery_user" FOREIGN KEY ("USER_ID") REFERENCES t_user("USER_ID");
ALTER TABLE "t_roles_permissions" ADD CONSTRAINT "fk_rp_permission" FOREIGN KEY ("PERMISSIONS_ID") REFERENCES t_permissions("PERMISSIONS_ID");
ALTER TABLE "t_roles_permissions" ADD CONSTRAINT "fk_rp_role" FOREIGN KEY ("ROLES_ID") REFERENCES t_roles("ID_ROLS");
ALTER TABLE "t_security_questions" ADD CONSTRAINT "fk_sq_user" FOREIGN KEY ("USER_ID") REFERENCES t_user("USER_ID");
ALTER TABLE "t_security_questions" ADD CONSTRAINT "fk_sq_preset" FOREIGN KEY ("PRESET_QUESTION_ID") REFERENCES t_preset_questions("PRESET_QUESTION_ID");
ALTER TABLE "t_session" ADD CONSTRAINT "fk_session_user" FOREIGN KEY ("USER_ID") REFERENCES t_user("USER_ID");
ALTER TABLE "t_session_attempts" ADD CONSTRAINT "fk_session_attempts_user" FOREIGN KEY ("USER_ID") REFERENCES t_user("USER_ID");
ALTER TABLE "t_session_history" ADD CONSTRAINT "fk_session_history_session" FOREIGN KEY ("SESSION_ID", "USER_ID") REFERENCES t_session("SESSION_ID", "USER_ID");
ALTER TABLE "t_student_documents" ADD CONSTRAINT "fk_document_reviewer" FOREIGN KEY ("REVIEWED_BY") REFERENCES t_user("USER_ID") ON DELETE SET NULL;
ALTER TABLE "t_student_documents" ADD CONSTRAINT "fk_document_student" FOREIGN KEY ("STUDENT_ID") REFERENCES t_students("STUDENTS_ID") ON DELETE CASCADE;
ALTER TABLE "t_student_documents" ADD CONSTRAINT "fk_student_documents_student_person" FOREIGN KEY (student_person_id) REFERENCES t_persons(person_id) ON DELETE RESTRICT;
ALTER TABLE "t_student_requests" ADD CONSTRAINT "fk_student_request_type" FOREIGN KEY ("REQUEST_TYPE_ID") REFERENCES t_request_types("REQUEST_TYPE_ID") ON DELETE RESTRICT;
ALTER TABLE "t_student_requests" ADD CONSTRAINT "fk_student_request_student" FOREIGN KEY ("STUDENT_ID") REFERENCES t_students("STUDENTS_ID") ON DELETE CASCADE;
ALTER TABLE "t_student_requests" ADD CONSTRAINT "fk_student_requests_student_person" FOREIGN KEY (student_person_id) REFERENCES t_persons(person_id) ON DELETE RESTRICT;
ALTER TABLE "t_students" ADD CONSTRAINT "fk_students_user" FOREIGN KEY ("USER_ID") REFERENCES t_user("USER_ID");
ALTER TABLE "t_students" ADD CONSTRAINT "fk_students_person" FOREIGN KEY (person_id) REFERENCES t_persons(person_id) ON DELETE RESTRICT;
ALTER TABLE "t_tutor_career" ADD CONSTRAINT "fk_tutor_career_tutor" FOREIGN KEY ("TUTOR_ID") REFERENCES t_tutors("TUTOR_ID");
ALTER TABLE "t_tutor_career" ADD CONSTRAINT "fk_tutor_career_career" FOREIGN KEY ("CAREER_ID") REFERENCES t_career("CAREER_ID");
ALTER TABLE "t_tutors" ADD CONSTRAINT "fk_tutors_user" FOREIGN KEY ("USER_ID") REFERENCES t_user("USER_ID");
ALTER TABLE "t_tutors" ADD CONSTRAINT "fk_tutors_person" FOREIGN KEY (person_id) REFERENCES t_persons(person_id) ON DELETE RESTRICT;
ALTER TABLE "t_user" ADD CONSTRAINT "fk_user_person" FOREIGN KEY (person_id) REFERENCES t_persons(person_id) ON DELETE RESTRICT;
ALTER TABLE "t_user_key" ADD CONSTRAINT "fk_user_key_user" FOREIGN KEY ("USER_ID") REFERENCES t_user("USER_ID");
ALTER TABLE "t_user_notification_prefs" ADD CONSTRAINT "t_user_notification_prefs_USER_ID_fkey" FOREIGN KEY ("USER_ID") REFERENCES t_user("USER_ID");
ALTER TABLE "t_user_questions" ADD CONSTRAINT "fk_user_questions_user" FOREIGN KEY ("USER_ID") REFERENCES t_user("USER_ID") ON DELETE CASCADE;
ALTER TABLE "t_user_questions" ADD CONSTRAINT "fk_user_questions_preset" FOREIGN KEY ("PRESET_QUESTION_ID") REFERENCES t_preset_questions("PRESET_QUESTION_ID") ON DELETE SET NULL;
ALTER TABLE "t_user_roles" ADD CONSTRAINT "fk_user_roles_role" FOREIGN KEY ("ID_ROLES") REFERENCES t_roles("ID_ROLS");
ALTER TABLE "t_user_roles" ADD CONSTRAINT "fk_user_roles_user" FOREIGN KEY ("ID_USER") REFERENCES t_user("USER_ID");
ALTER TABLE "t_user_theme" ADD CONSTRAINT "fk_user_theme_user" FOREIGN KEY ("USER_ID") REFERENCES t_user("USER_ID") ON DELETE CASCADE;
ALTER TABLE "t_value_list" ADD CONSTRAINT "fk_value_list_list" FOREIGN KEY ("LIST_ID") REFERENCES t_list("LIST_ID");
ALTER TABLE "t_visit" ADD CONSTRAINT "fk_visit_practice" FOREIGN KEY ("PROFESSIONAL_PRACTICE_ID") REFERENCES t_professional_practices("PROFESSIONAL_PRACTICE_ID");
ALTER TABLE "t_visit" ADD CONSTRAINT "fk_visit_tutor" FOREIGN KEY ("TUTOR_ID") REFERENCES t_tutors("TUTOR_ID");

-- Unique / Check
ALTER TABLE "t_address" ADD CONSTRAINT "t_address_uuid_key" UNIQUE (uuid);
ALTER TABLE "t_address_type" ADD CONSTRAINT "t_address_type_code_key" UNIQUE (code);
ALTER TABLE "t_career" ADD CONSTRAINT "t_career_CAREER_CODE_key" UNIQUE ("CAREER_CODE");
ALTER TABLE "t_committee_assignment" ADD CONSTRAINT "t_committee_assignment_PROFESSIONAL_PRACTICE_ID_COMITE_MEMB_key" UNIQUE ("PROFESSIONAL_PRACTICE_ID", "COMITE_MEMBER_INDEX");
ALTER TABLE "t_credential_tokens" ADD CONSTRAINT "t_credential_tokens_token_key" UNIQUE (token);
ALTER TABLE "t_institution" ADD CONSTRAINT "t_institution_INSTITUTION_CODE_key" UNIQUE ("INSTITUTION_CODE");
ALTER TABLE "t_institution_address" ADD CONSTRAINT "t_institution_address_institution_id_address_id_address_typ_key" UNIQUE (institution_id, address_id, address_type_id);
ALTER TABLE "t_institution_manager" ADD CONSTRAINT "unique_institution_manager_person_id" UNIQUE (person_id);
ALTER TABLE "t_institution_manager_institution" ADD CONSTRAINT "t_institution_manager_institution_MANAGER_ID_INSTITUTION_ID_key" UNIQUE ("MANAGER_ID", "INSTITUTION_ID");
ALTER TABLE "t_landing_config" ADD CONSTRAINT "t_landing_config_config_key_key" UNIQUE (config_key);
ALTER TABLE "t_nucleus_career" ADD CONSTRAINT "t_nucleus_career_nucleus_id_career_id_key" UNIQUE (nucleus_id, career_id);
ALTER TABLE "t_permissions" ADD CONSTRAINT "uq_permissions_name" UNIQUE ("NAME");
ALTER TABLE "t_person_address" ADD CONSTRAINT "t_person_address_person_id_address_id_address_type_id_key" UNIQUE (person_id, address_id, address_type_id);
ALTER TABLE "t_persons" ADD CONSTRAINT "t_persons_ci_key" UNIQUE (ci);
ALTER TABLE "t_prospect_list_items" ADD CONSTRAINT "t_prospect_list_items_LIST_ID_STUDENTS_ID_key" UNIQUE ("LIST_ID", "STUDENTS_ID");
ALTER TABLE "t_report_text_templates" ADD CONSTRAINT "t_report_text_templates_REPORT_TYPE_SECTION_key" UNIQUE ("REPORT_TYPE", "SECTION");
ALTER TABLE "t_students" ADD CONSTRAINT "unique_students_person_id" UNIQUE (person_id);
ALTER TABLE "t_system_nucleus" ADD CONSTRAINT "t_system_nucleus_code_key" UNIQUE (code);
ALTER TABLE "t_tutors" ADD CONSTRAINT "unique_tutor_person_id" UNIQUE (person_id);
ALTER TABLE "t_user" ADD CONSTRAINT "t_user_USER_CI_key" UNIQUE ("USER_CI");
ALTER TABLE "t_user" ADD CONSTRAINT "unique_user_person_id" UNIQUE (person_id);
ALTER TABLE "t_user_notification_prefs" ADD CONSTRAINT "t_user_notification_prefs_USER_ID_TYPE_CHANNEL_key" UNIQUE ("USER_ID", "TYPE", "CHANNEL");
ALTER TABLE "t_user_theme" ADD CONSTRAINT "t_user_theme_USER_ID_key" UNIQUE ("USER_ID");
ALTER TABLE "t_career" ADD CONSTRAINT "chk_career_min_grade" CHECK (("MINIMUM_GRADE" >= (0)::numeric));
ALTER TABLE "t_committee_assignment" ADD CONSTRAINT "t_committee_assignment_COMITE_MEMBER_INDEX_check" CHECK (("COMITE_MEMBER_INDEX" = ANY (ARRAY[1, 2, 3])));
ALTER TABLE "t_evaluation" ADD CONSTRAINT "chk_comite_member_index" CHECK ((((("EVALUATOR_TYPE")::text = 'COMITE'::text) AND (("COMITE_MEMBER_INDEX" >= 1) AND ("COMITE_MEMBER_INDEX" <= 3))) OR ((("EVALUATOR_TYPE")::text <> 'COMITE'::text) AND ("COMITE_MEMBER_INDEX" IS NULL))));
ALTER TABLE "t_evaluation_detail" ADD CONSTRAINT "chk_score_range" CHECK ((("SCORE" >= (1)::numeric) AND ("SCORE" <= (20)::numeric)));
ALTER TABLE "t_knowledge_base" ADD CONSTRAINT "chk_knowledge_base_category" CHECK ((category = ANY (ARRAY['regulation'::text, 'curriculum'::text, 'process'::text, 'faq'::text, 'general'::text])));
ALTER TABLE "t_notifications" ADD CONSTRAINT "chk_notification_type" CHECK ((("TYPE")::text = ANY (ARRAY['pre_enrollment'::text, 'enrollment'::text, 'tracking'::text, 'tracking_visit'::text, 'user_management'::text, 'reminder'::text, 'system'::text, 'approval'::text, 'success'::text, 'error'::text, 'info'::text, 'warning'::text])));
ALTER TABLE "t_practice_culmination" ADD CONSTRAINT "chk_culmination_status" CHECK (("STATUS" = ANY (ARRAY[0, 1, 2])));
ALTER TABLE "t_professional_practices" ADD CONSTRAINT "chk_practices_grade" CHECK (("GRADE" >= (0)::numeric));
ALTER TABLE "t_system_institution" ADD CONSTRAINT "t_system_institution_status_check" CHECK ((status = ANY (ARRAY[0, 1])));
ALTER TABLE "t_system_nucleus" ADD CONSTRAINT "t_system_nucleus_nucleus_type_check" CHECK (((nucleus_type)::text = ANY ((ARRAY['NÚCLEO'::character varying, 'EXTENSIÓN'::character varying])::text[])));
ALTER TABLE "t_system_nucleus" ADD CONSTRAINT "t_system_nucleus_status_check" CHECK ((status = ANY (ARRAY[0, 1])));
ALTER TABLE "t_user_questions" ADD CONSTRAINT "chk_question_type" CHECK ((((("QUESTION_TYPE")::text = 'PRESET'::text) AND ("PRESET_QUESTION_ID" IS NOT NULL)) OR ((("QUESTION_TYPE")::text = 'CUSTOM'::text) AND ("CUSTOM_QUESTION" IS NOT NULL))));

-- ============================================================
-- SECCIÓN 6: ÍNDICES
-- ============================================================

CREATE INDEX idx_activity_logs_student_person_id ON public.t_activity_logs USING btree (student_person_id);
CREATE INDEX t_address_parroquia_id_idx ON public.t_address USING btree (parroquia_id);
CREATE UNIQUE INDEX t_address_uuid_key ON public.t_address USING btree (uuid);
CREATE UNIQUE INDEX t_address_type_code_key ON public.t_address_type USING btree (code);
CREATE INDEX idx_backups_created_at ON public.t_backups USING btree (created_at DESC);
CREATE INDEX idx_careers_name ON public.t_career USING btree ("CAREER_NAME");
CREATE INDEX idx_careers_status ON public.t_career USING btree ("STATUS");
CREATE UNIQUE INDEX "t_career_CAREER_CODE_key" ON public.t_career USING btree ("CAREER_CODE");
CREATE INDEX idx_career_internship_type_career_id ON public.t_career_internship_type USING btree ("CAREER_ID");
CREATE INDEX idx_chat_config_user_id ON public.t_chat_config USING btree (user_id);
CREATE UNIQUE INDEX idx_chat_config_user_unique ON public.t_chat_config USING btree (user_id);
CREATE INDEX idx_chat_sessions_updated ON public.t_chat_sessions USING btree ("UPDATED_AT" DESC);
CREATE INDEX idx_chat_sessions_user ON public.t_chat_sessions USING btree ("USER_ID", "STATUS");
CREATE UNIQUE INDEX "t_committee_assignment_PROFESSIONAL_PRACTICE_ID_COMITE_MEMB_key" ON public.t_committee_assignment USING btree ("PROFESSIONAL_PRACTICE_ID", "COMITE_MEMBER_INDEX");
CREATE INDEX idx_credential_tokens_token ON public.t_credential_tokens USING btree (token);
CREATE INDEX idx_credential_tokens_user ON public.t_credential_tokens USING btree (user_id);
CREATE UNIQUE INDEX t_credential_tokens_token_key ON public.t_credential_tokens USING btree (token);
CREATE UNIQUE INDEX idx_culmination_reversals_practice ON public.t_culmination_reversals USING btree ("PRACTICE_ID");
CREATE INDEX idx_efc_changed_at ON public.t_enrollment_field_changes USING btree ("CHANGED_AT");
CREATE INDEX idx_efc_practice_id ON public.t_enrollment_field_changes USING btree ("PROFESSIONAL_PRACTICE_ID");
CREATE UNIQUE INDEX pk_enrollment_field_changes ON public.t_enrollment_field_changes USING btree ("CHANGE_ID");
CREATE INDEX idx_evaluation_practice ON public.t_evaluation USING btree ("PROFESSIONAL_PRACTICE_ID");
CREATE INDEX idx_evaluation_type ON public.t_evaluation USING btree ("EVALUATOR_TYPE");
CREATE INDEX idx_criteria_type ON public.t_evaluation_criteria USING btree ("EVALUATOR_TYPE");
CREATE INDEX idx_evaluation_detail_eval ON public.t_evaluation_detail USING btree ("EVALUATION_ID");
CREATE INDEX idx_institution_code ON public.t_institution USING btree ("INSTITUTION_CODE");
CREATE INDEX idx_institution_name ON public.t_institution USING btree ("INSTITUTION_NAME");
CREATE INDEX idx_institution_rif ON public.t_institution USING btree ("RIF");
CREATE INDEX idx_institutions_status ON public.t_institution USING btree ("STATUS");
CREATE UNIQUE INDEX "t_institution_INSTITUTION_CODE_key" ON public.t_institution USING btree ("INSTITUTION_CODE");
CREATE INDEX t_institution_address_address_id_idx ON public.t_institution_address USING btree (address_id);
CREATE UNIQUE INDEX t_institution_address_institution_id_address_id_address_typ_key ON public.t_institution_address USING btree (institution_id, address_id, address_type_id);
CREATE INDEX t_institution_address_institution_id_idx ON public.t_institution_address USING btree (institution_id);
CREATE UNIQUE INDEX t_institution_address_one_primary_idx ON public.t_institution_address USING btree (institution_id, address_type_id) WHERE (is_primary = true);
CREATE INDEX idx_institution_career_career ON public.t_institution_career USING btree ("CAREER_ID");
CREATE INDEX idx_institution_career_institution ON public.t_institution_career USING btree ("INSTITUTION_ID");
CREATE INDEX idx_manager_person_id ON public.t_institution_manager USING btree (person_id);
CREATE UNIQUE INDEX unique_institution_manager_person_id ON public.t_institution_manager USING btree (person_id);
CREATE INDEX idx_manager_institution_institution ON public.t_institution_manager_institution USING btree ("INSTITUTION_ID");
CREATE INDEX idx_manager_institution_manager ON public.t_institution_manager_institution USING btree ("MANAGER_ID");
CREATE UNIQUE INDEX "t_institution_manager_institution_MANAGER_ID_INSTITUTION_ID_key" ON public.t_institution_manager_institution USING btree ("MANAGER_ID", "INSTITUTION_ID");
CREATE INDEX idx_kb_active ON public.t_knowledge_base USING btree (is_active);
CREATE INDEX idx_kb_category ON public.t_knowledge_base USING btree (category);
CREATE INDEX idx_landing_config_key ON public.t_landing_config USING btree (config_key);
CREATE UNIQUE INDEX t_landing_config_config_key_key ON public.t_landing_config USING btree (config_key);
CREATE INDEX t_municipio_estado_id_idx ON public.t_municipio USING btree (estado_id);
CREATE INDEX idx_notifications_created ON public.t_notifications USING btree ("CREATED_AT" DESC);
CREATE INDEX idx_notifications_read ON public.t_notifications USING btree ("READ");
CREATE INDEX idx_notifications_user ON public.t_notifications USING btree ("USER_ID");
CREATE INDEX idx_nucleus_career_career ON public.t_nucleus_career USING btree (career_id);
CREATE INDEX idx_nucleus_career_nucleus ON public.t_nucleus_career USING btree (nucleus_id);
CREATE UNIQUE INDEX t_nucleus_career_nucleus_id_career_id_key ON public.t_nucleus_career USING btree (nucleus_id, career_id);
CREATE INDEX t_parroquia_municipio_id_idx ON public.t_parroquia USING btree (municipio_id);
CREATE UNIQUE INDEX uq_permissions_name ON public.t_permissions USING btree ("NAME");
CREATE INDEX t_person_address_address_id_idx ON public.t_person_address USING btree (address_id);
CREATE UNIQUE INDEX t_person_address_one_primary_idx ON public.t_person_address USING btree (person_id, address_type_id) WHERE (is_primary = true);
CREATE UNIQUE INDEX t_person_address_person_id_address_id_address_type_id_key ON public.t_person_address USING btree (person_id, address_id, address_type_id);
CREATE INDEX t_person_address_person_id_idx ON public.t_person_address USING btree (person_id);
CREATE INDEX idx_persons_ci ON public.t_persons USING btree (ci);
CREATE INDEX idx_persons_email ON public.t_persons USING btree (email);
CREATE INDEX idx_persons_names ON public.t_persons USING btree (first_name, last_name);
CREATE INDEX idx_persons_status ON public.t_persons USING btree (status);
CREATE UNIQUE INDEX t_persons_ci_key ON public.t_persons USING btree (ci);
CREATE INDEX idx_culmination_certificate ON public.t_practice_culmination USING btree ("CERTIFICATE_NUMBER");
CREATE INDEX idx_culmination_status ON public.t_practice_culmination USING btree ("STATUS");
CREATE INDEX idx_practice_visits_tutor_person_id ON public.t_practice_visits USING btree (tutor_person_id);
CREATE INDEX idx_visits_case ON public.t_practice_visits USING btree ("VISIT_CASE");
CREATE INDEX idx_visits_date ON public.t_practice_visits USING btree ("VISIT_DATE");
CREATE INDEX idx_visits_practice_id ON public.t_practice_visits USING btree ("PROFESSIONAL_PRACTICE_ID");
CREATE INDEX idx_visits_status ON public.t_practice_visits USING btree ("STATUS");
CREATE INDEX idx_visits_tutor_id ON public.t_practice_visits USING btree ("TUTOR_ID");
CREATE INDEX idx_pp_student_person_id ON public.t_professional_practices USING btree (student_person_id);
CREATE INDEX idx_practices_institution_id ON public.t_professional_practices USING btree ("INSTITUTION_ID");
CREATE INDEX idx_practices_reg_date ON public.t_professional_practices USING btree ("REGISTRATION_DATE");
CREATE INDEX idx_practices_status ON public.t_professional_practices USING btree ("STATUS");
CREATE INDEX idx_practices_student_id ON public.t_professional_practices USING btree ("STUDENTS_ID");
CREATE INDEX idx_pp_tutor_practice_id ON public.t_professional_practices_tutor USING btree ("PROFESSIONAL_PRACTICE_ID");
CREATE INDEX idx_ppt_tutor_person_id ON public.t_professional_practices_tutor USING btree (tutor_person_id);
CREATE UNIQUE INDEX "t_prospect_list_items_LIST_ID_STUDENTS_ID_key" ON public.t_prospect_list_items USING btree ("LIST_ID", "STUDENTS_ID");
CREATE UNIQUE INDEX "t_report_text_templates_REPORT_TYPE_SECTION_key" ON public.t_report_text_templates USING btree ("REPORT_TYPE", "SECTION");
CREATE INDEX idx_request_types_category ON public.t_request_types USING btree ("CATEGORY");
CREATE INDEX idx_documents_status ON public.t_student_documents USING btree ("STATUS");
CREATE INDEX idx_documents_student ON public.t_student_documents USING btree ("STUDENT_ID");
CREATE INDEX idx_documents_type ON public.t_student_documents USING btree ("DOCUMENT_TYPE");
CREATE INDEX idx_student_documents_student_person_id ON public.t_student_documents USING btree (student_person_id);
CREATE INDEX idx_requests_is_reassignment ON public.t_student_requests USING btree ("IS_REASSIGNMENT");
CREATE INDEX idx_student_requests_status ON public.t_student_requests USING btree ("STATUS");
CREATE INDEX idx_student_requests_student ON public.t_student_requests USING btree ("STUDENT_ID");
CREATE INDEX idx_student_requests_student_person_id ON public.t_student_requests USING btree (student_person_id);
CREATE INDEX idx_student_requests_type ON public.t_student_requests USING btree ("REQUEST_TYPE_ID");
CREATE INDEX idx_students_ci ON public.t_students USING btree ("STUDENTS_CI");
CREATE INDEX idx_students_names ON public.t_students USING btree ("NAME", "SURNAME");
CREATE INDEX idx_students_person_id ON public.t_students USING btree (person_id);
CREATE INDEX idx_students_status ON public.t_students USING btree ("STATUS");
CREATE UNIQUE INDEX unique_students_person_id ON public.t_students USING btree (person_id);
CREATE UNIQUE INDEX t_system_nucleus_code_key ON public.t_system_nucleus USING btree (code);
CREATE INDEX idx_tutors_person_id ON public.t_tutors USING btree (person_id);
CREATE UNIQUE INDEX unique_tutor_person_id ON public.t_tutors USING btree (person_id);
CREATE INDEX idx_user_person_id ON public.t_user USING btree (person_id);
CREATE UNIQUE INDEX "t_user_USER_CI_key" ON public.t_user USING btree ("USER_CI");
CREATE UNIQUE INDEX unique_user_person_id ON public.t_user USING btree (person_id);
CREATE INDEX idx_user_key_user_status_date ON public.t_user_key USING btree ("USER_ID", "STATUS", "START_DATE" DESC);
CREATE UNIQUE INDEX "t_user_notification_prefs_USER_ID_TYPE_CHANNEL_key" ON public.t_user_notification_prefs USING btree ("USER_ID", "TYPE", "CHANNEL");
CREATE INDEX idx_user_questions_preset ON public.t_user_questions USING btree ("PRESET_QUESTION_ID");
CREATE INDEX idx_user_questions_user ON public.t_user_questions USING btree ("USER_ID");
CREATE UNIQUE INDEX "t_user_theme_USER_ID_key" ON public.t_user_theme USING btree ("USER_ID");
CREATE INDEX idx_value_list_list_status ON public.t_value_list USING btree ("LIST_ID", "STATUS");

-- ============================================================
-- SECCIÓN 9: TABLAS SIN DATOS (vacías)
-- ============================================================
-- t_activity_logs (0 registros)
-- t_chat_config (0 registros)
-- t_chat_sessions (0 registros)
-- t_committee_assignment (0 registros)
-- t_credential_tokens (0 registros)
-- t_culmination_reversals (0 registros)
-- t_institution_address (0 registros)
-- t_key_history (0 registros)
-- t_nucleus_career (0 registros)
-- t_person_merge_log (0 registros)
-- t_prospect_list_items (0 registros)
-- t_recovery_tokens (0 registros)
-- t_report_text_templates (0 registros)
-- t_security_questions (0 registros)
-- t_session (0 registros)
-- t_session_attempts (0 registros)
-- t_session_history (0 registros)
-- t_student_documents (0 registros)
-- t_user_notification_prefs (0 registros)
-- t_visit (0 registros)

-- ============================================================
-- RESUMEN DEL RESPALDO
-- ============================================================
-- Tablas: 76
-- Con datos: 56
-- Vacías: 20
-- Registros: 4252
-- Sequences: 68
-- Funciones: 17
-- Índices: 107
-- Foreign Keys: 102
-- RLS Policies: 0
-- Errores: 0

-- ================================================================================
-- FIN DEL RESPALDO — Réplica exacta lista para otro proyecto Supabase
-- ================================================================================
