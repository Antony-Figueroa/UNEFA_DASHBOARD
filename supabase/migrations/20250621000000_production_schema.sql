


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Supabase extensions required by production schema
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."execute_sql"("sql" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    EXECUTE sql;
END;
$$;


ALTER FUNCTION "public"."execute_sql"("sql" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_all_constraints"() RETURNS TABLE("table_name" "text", "constraint_name" "text", "constraint_type" "text", "definition" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."get_all_constraints"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_all_functions"() RETURNS TABLE("function_name" "text", "definition" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."get_all_functions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_all_indexes"() RETURNS TABLE("index_name" "text", "table_name" "text", "index_def" "text", "is_unique" boolean, "is_primary" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."get_all_indexes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_all_sequences"() RETURNS TABLE("seq_name" "text", "table_name" "text", "column_name" "text", "current_value" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."get_all_sequences"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_all_table_definitions"() RETURNS TABLE("table_name" "text", "definition" "text", "has_data" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."get_all_table_definitions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_all_tables"() RETURNS TABLE("table_name" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT tablename::text
  FROM pg_catalog.pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename;
END;
$$;


ALTER FUNCTION "public"."get_all_tables"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_all_triggers"() RETURNS TABLE("table_name" "text", "trigger_name" "text", "definition" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."get_all_triggers"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_coincidence_stats"() RETURNS TABLE("level" "text", "count" bigint, "percentage" numeric)
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."get_coincidence_stats"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_coincidence_stats"() IS 'Calcula distribución de coincidencia geográfica en inscripciones activas';



CREATE OR REPLACE FUNCTION "public"."get_institution_suggestions"("p_person_id" integer, "p_career_id" integer, "p_internship_type_id" integer DEFAULT NULL::integer) RETURNS TABLE("institution_id" integer, "institution_name" character varying, "institution_address" "text", "estado" character varying, "municipio" character varying, "proximity_score" integer)
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."get_institution_suggestions"("p_person_id" integer, "p_career_id" integer, "p_internship_type_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_primary_address"("p_entity_type" "text", "p_entity_id" integer) RETURNS TABLE("address_id" bigint, "street_address" character varying, "reference" "text", "parroquia_id" bigint, "parroquia_name" character varying, "municipio_id" bigint, "municipio_name" character varying, "estado_id" integer, "estado_name" character varying)
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."get_primary_address"("p_entity_type" "text", "p_entity_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_rls_policies"() RETURNS TABLE("table_name" "text", "definition" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."get_rls_policies"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_table_definition"("table_name_param" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."get_table_definition"("table_name_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_knowledge_base"("query_embedding" "public"."vector", "match_threshold" double precision DEFAULT 0.7, "match_limit" integer DEFAULT 5, "filter_category" "text" DEFAULT NULL::"text", "filter_roles" integer[] DEFAULT NULL::integer[]) RETURNS TABLE("id" "uuid", "title" "text", "category" "text", "content" "text", "metadata" "jsonb", "similarity" double precision)
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."search_knowledge_base"("query_embedding" "public"."vector", "match_threshold" double precision, "match_limit" integer, "filter_category" "text", "filter_roles" integer[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_set_student_person_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.student_person_id IS NULL AND NEW."STUDENTS_ID" IS NOT NULL THEN
    SELECT person_id INTO NEW.student_person_id
    FROM "t_students"
    WHERE "STUDENTS_ID" = NEW."STUDENTS_ID";
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trg_set_student_person_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_set_tutor_person_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.tutor_person_id IS NULL AND NEW."TUTOR_ID" IS NOT NULL THEN
    SELECT person_id INTO NEW.tutor_person_id
    FROM "t_tutors"
    WHERE "TUTOR_ID" = NEW."TUTOR_ID";
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trg_set_tutor_person_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_kb_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_kb_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."t_academic_config" (
    "CONFIG_ID" smallint DEFAULT 1 NOT NULL,
    "DEFAULT_ENROLLMENT_GRACE_DAYS" smallint DEFAULT 21 NOT NULL,
    "DEFAULT_EVALUATION_GRACE_DAYS" smallint DEFAULT 10 NOT NULL,
    "UPDATED_AT" timestamp without time zone DEFAULT "now"() NOT NULL,
    "UPDATED_BY" integer,
    "allow_multiple_visits_per_day" boolean DEFAULT true,
    "max_visits_per_day" integer
);


ALTER TABLE "public"."t_academic_config" OWNER TO "postgres";


COMMENT ON COLUMN "public"."t_academic_config"."allow_multiple_visits_per_day" IS 'Permite múltiples visitas en la misma fecha para una misma práctica';



COMMENT ON COLUMN "public"."t_academic_config"."max_visits_per_day" IS 'Máximo de visitas permitidas por día para una misma práctica (NULL = sin límite)';



CREATE TABLE IF NOT EXISTS "public"."t_activity_logs" (
    "ACTIVITY_LOG_ID" integer NOT NULL,
    "PROFESSIONAL_PRACTICE_ID" integer NOT NULL,
    "STUDENT_ID" integer NOT NULL,
    "ACTIVITY_DATE" "date" NOT NULL,
    "WEEK_NUMBER" integer,
    "HOURS_WORKED" numeric(5,2) DEFAULT 0 NOT NULL,
    "ACTIVITY_TYPE" character varying(50) DEFAULT 'DIARIA'::character varying NOT NULL,
    "ACTIVITY_DESCRIPTION" "text" NOT NULL,
    "TASKS_COMPLETED" "text",
    "CHALLENGES" "text",
    "LEARNINGS" "text",
    "SUPERVISOR_COMMENTS" "text",
    "SUPERVISOR_APPROVED" boolean DEFAULT false,
    "SUPERVISOR_ID" integer,
    "APPROVED_AT" timestamp without time zone,
    "STATUS" smallint DEFAULT 1 NOT NULL,
    "CREATED_AT" timestamp without time zone DEFAULT "now"() NOT NULL,
    "UPDATED_AT" timestamp without time zone DEFAULT "now"() NOT NULL,
    "CREATED_BY" integer,
    "student_person_id" integer NOT NULL
);


ALTER TABLE "public"."t_activity_logs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_activity_logs_ACTIVITY_LOG_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_activity_logs_ACTIVITY_LOG_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_activity_logs_ACTIVITY_LOG_ID_seq" OWNED BY "public"."t_activity_logs"."ACTIVITY_LOG_ID";



CREATE TABLE IF NOT EXISTS "public"."t_address" (
    "address_id" bigint NOT NULL,
    "parroquia_id" bigint,
    "street_address" character varying(300) NOT NULL,
    "reference" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "full_address" character varying(500),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "version" integer DEFAULT 1,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."t_address" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_address_address_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_address_address_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_address_address_id_seq" OWNED BY "public"."t_address"."address_id";



CREATE TABLE IF NOT EXISTS "public"."t_address_type" (
    "address_type_id" bigint NOT NULL,
    "code" character varying(20) NOT NULL,
    "name" character varying(50) NOT NULL,
    "description" "text",
    "status" smallint DEFAULT 1 NOT NULL
);


ALTER TABLE "public"."t_address_type" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."t_auth_log" (
    "ID" integer NOT NULL,
    "USER_ID" integer,
    "USER_CI" character varying(20),
    "ACTION" character varying(50) NOT NULL,
    "IP_ADDRESS" character varying(45),
    "USER_AGENT" "text",
    "DETAILS" "text",
    "CREATED_AT" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."t_auth_log" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_auth_log_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_auth_log_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_auth_log_ID_seq" OWNED BY "public"."t_auth_log"."ID";



CREATE TABLE IF NOT EXISTS "public"."t_backups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "file_name" character varying(255) NOT NULL,
    "size" bigint,
    "tables" "text"[],
    "created_by" integer,
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."t_backups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."t_career" (
    "CAREER_ID" integer NOT NULL,
    "CAREER_NAME" character varying(255) NOT NULL,
    "CAREER_CODE" character varying(255) NOT NULL,
    "MINIMUM_GRADE" numeric(10,2) NOT NULL,
    "CAREER_ABBREVIATION" character varying(255) NOT NULL,
    "CREATION_DATE" timestamp without time zone NOT NULL,
    "MODIF_USER_ID" integer NOT NULL,
    "MODIF_USER_DATE" timestamp without time zone NOT NULL,
    "ELIM_USER_ID" integer NOT NULL,
    "ELIM_USER_DATE" timestamp without time zone NOT NULL,
    "REST_USER_ID" integer NOT NULL,
    "REST_USER_DATE" timestamp without time zone NOT NULL,
    "STATUS" smallint NOT NULL,
    "CAREER_TYPE" character varying(10) DEFAULT 'LARGA'::character varying NOT NULL,
    "SEMESTER" character varying(10),
    CONSTRAINT "chk_career_min_grade" CHECK (("MINIMUM_GRADE" >= (0)::numeric))
);


ALTER TABLE "public"."t_career" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_career_CAREER_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_career_CAREER_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_career_CAREER_ID_seq" OWNED BY "public"."t_career"."CAREER_ID";



CREATE TABLE IF NOT EXISTS "public"."t_career_internship_type" (
    "ID_CAREER_INTERNSHIP_TYPE_ID" integer NOT NULL,
    "CAREER_ID" integer NOT NULL,
    "INTERNSHIP_TYPE_ID" integer NOT NULL
);


ALTER TABLE "public"."t_career_internship_type" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_career_internship_type_ID_CAREER_INTERNSHIP_TYPE_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_career_internship_type_ID_CAREER_INTERNSHIP_TYPE_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_career_internship_type_ID_CAREER_INTERNSHIP_TYPE_ID_seq" OWNED BY "public"."t_career_internship_type"."ID_CAREER_INTERNSHIP_TYPE_ID";



CREATE TABLE IF NOT EXISTS "public"."t_change_log" (
    "CHANGE_LOG_ID" integer NOT NULL,
    "DATE_TIME" timestamp without time zone NOT NULL,
    "TABLE_ID" integer NOT NULL,
    "COLUMN_ID" integer NOT NULL,
    "OPERATION_ID" integer NOT NULL,
    "USER_ID" integer NOT NULL,
    "NEW_VALUE" character varying(45) NOT NULL,
    "OLD_VALUE" character varying(45) NOT NULL,
    "IP_ADDRESS" character varying(45) NOT NULL,
    "FORM_ID" integer NOT NULL,
    "PRINT_EMAIL" character varying(60) NOT NULL,
    "STATUS" smallint NOT NULL
);


ALTER TABLE "public"."t_change_log" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_change_log_CHANGE_LOG_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_change_log_CHANGE_LOG_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_change_log_CHANGE_LOG_ID_seq" OWNED BY "public"."t_change_log"."CHANGE_LOG_ID";



CREATE TABLE IF NOT EXISTS "public"."t_chat_config" (
    "config_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" integer NOT NULL,
    "persona" character varying(20) DEFAULT 'formal'::character varying,
    "quick_actions" "jsonb" DEFAULT '[]'::"jsonb",
    "show_notifications" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."t_chat_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."t_chat_sessions" (
    "SESSION_ID" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "USER_ID" integer NOT NULL,
    "TITLE" character varying(100) DEFAULT 'Nueva conversación'::character varying NOT NULL,
    "MESSAGES" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "CREATED_AT" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "UPDATED_AT" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "STATUS" smallint DEFAULT 1 NOT NULL
);


ALTER TABLE "public"."t_chat_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."t_columns" (
    "COLUMN_ID" integer NOT NULL,
    "TABLE_ID" integer NOT NULL,
    "COLUMN_NAME" character varying(25) NOT NULL,
    "STATUS" smallint NOT NULL
);


ALTER TABLE "public"."t_columns" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_columns_COLUMN_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_columns_COLUMN_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_columns_COLUMN_ID_seq" OWNED BY "public"."t_columns"."COLUMN_ID";



CREATE TABLE IF NOT EXISTS "public"."t_config" (
    "CONFIG_ID" integer NOT NULL,
    "RECOVERY_EMAIL" smallint NOT NULL,
    "BLOCKING_DAYS" smallint NOT NULL,
    "WRONG_KEY_LOCK" smallint NOT NULL,
    "ATTEMPTS_KEY_BLOCK" smallint NOT NULL,
    "KEY_EXPIRATION" integer NOT NULL,
    "EXPIRATION_DAYS" smallint NOT NULL,
    "USER_UPPERCASE" smallint NOT NULL,
    "USER_LOWERCASE" smallint NOT NULL,
    "USER_NUMBERS" smallint NOT NULL,
    "USER_SPECIAL_CHARACTERS" smallint NOT NULL,
    "USER_NUM_UPPERCASE" integer NOT NULL,
    "USER_NUM_LOWERCASE" integer NOT NULL,
    "USER_NUM_NUMBERS" integer NOT NULL,
    "USER_NUM_SPECIAL_CHARACTERS" integer NOT NULL,
    "KEY_UPPERCASE" smallint NOT NULL,
    "KEY_LOWERCASE" smallint NOT NULL,
    "KEY_NUMBERS" smallint NOT NULL,
    "KEY_SPECIAL_CHARACTERS" smallint NOT NULL,
    "KEY_NUM_UPPERCASE" integer NOT NULL,
    "KEY_NUM_LOWERCASE" integer NOT NULL,
    "KEY_NUM_NUMBERS" integer NOT NULL,
    "KEY_NUM_SPECIAL_CHARACTERS" integer NOT NULL,
    "USER_LENGTH" integer NOT NULL,
    "KEY_LEGTH" integer NOT NULL,
    "SECURITY_QUESTIONS" smallint NOT NULL,
    "TOTAL_QUESTIONS" integer NOT NULL,
    "TOTAL_PRESET_QUESTIONS" integer NOT NULL,
    "TOTAL_USER_QUESTIONS" integer NOT NULL,
    "TOTAL_ANSWERS" integer NOT NULL,
    "PERIOD_VALIDATION_RULES" "jsonb",
    "EVALUATION_CONFIG" "jsonb",
    "SESSION_MAX_HOURS" integer DEFAULT 24 NOT NULL,
    "RECOVERY_LINK_EXPIRY_HOURS" integer DEFAULT 48 NOT NULL
);


ALTER TABLE "public"."t_config" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_config_CONFIG_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_config_CONFIG_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_config_CONFIG_ID_seq" OWNED BY "public"."t_config"."CONFIG_ID";



CREATE TABLE IF NOT EXISTS "public"."t_coordinadores" (
    "COORDINADOR_ID" integer NOT NULL,
    "TIPO" character varying(20) NOT NULL,
    "CAREER_ID" integer,
    "NAME" character varying(255) NOT NULL,
    "SECOND_NAME" character varying(255) DEFAULT NULL::character varying,
    "SURNAME" character varying(255) NOT NULL,
    "SECOND_SURNAME" character varying(255) DEFAULT NULL::character varying,
    "CI" character varying(20) NOT NULL,
    "CARGO" character varying(255),
    "CREATION_DATE" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "STATUS" smallint DEFAULT 1
);


ALTER TABLE "public"."t_coordinadores" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_coordinadores_COORDINADOR_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_coordinadores_COORDINADOR_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_coordinadores_COORDINADOR_ID_seq" OWNED BY "public"."t_coordinadores"."COORDINADOR_ID";



CREATE TABLE IF NOT EXISTS "public"."t_email_templates" (
    "id" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "category" character varying(50) DEFAULT 'general'::character varying NOT NULL,
    "subject" character varying(500) NOT NULL,
    "body_html" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."t_email_templates" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_email_templates_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_email_templates_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_email_templates_id_seq" OWNED BY "public"."t_email_templates"."id";



CREATE TABLE IF NOT EXISTS "public"."t_estado" (
    "estado_id" integer NOT NULL,
    "iso_31662" character varying(6) NOT NULL,
    "name" character varying(100) NOT NULL,
    "capital" character varying(100)
);


ALTER TABLE "public"."t_estado" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."t_evaluation" (
    "EVALUATION_ID" integer NOT NULL,
    "PROFESSIONAL_PRACTICE_ID" integer NOT NULL,
    "EVALUATOR_TYPE" character varying(20) NOT NULL,
    "EVALUATOR_ID" integer,
    "EVALUATOR_NAME" character varying(255) NOT NULL,
    "EVALUATOR_CI" character varying(20),
    "TOTAL_SCORE" numeric(5,2) NOT NULL,
    "OBSERVATIONS" "text",
    "EVALUATION_DATE" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "COMITE_MEMBER_INDEX" integer,
    "REGISTERED_BY" integer,
    "STATUS" smallint DEFAULT 1,
    CONSTRAINT "chk_comite_member_index" CHECK ((((("EVALUATOR_TYPE")::"text" = 'COMITE'::"text") AND (("COMITE_MEMBER_INDEX" >= 1) AND ("COMITE_MEMBER_INDEX" <= 3))) OR ((("EVALUATOR_TYPE")::"text" <> 'COMITE'::"text") AND ("COMITE_MEMBER_INDEX" IS NULL))))
);


ALTER TABLE "public"."t_evaluation" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_evaluation_EVALUATION_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_evaluation_EVALUATION_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_evaluation_EVALUATION_ID_seq" OWNED BY "public"."t_evaluation"."EVALUATION_ID";



CREATE TABLE IF NOT EXISTS "public"."t_evaluation_criteria" (
    "CRITERIA_ID" integer NOT NULL,
    "ITEM_NUMBER" integer NOT NULL,
    "DESCRIPTION" character varying(500) NOT NULL,
    "EVALUATOR_TYPE" character varying(20) NOT NULL,
    "STATUS" smallint DEFAULT 1
);


ALTER TABLE "public"."t_evaluation_criteria" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_evaluation_criteria_CRITERIA_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_evaluation_criteria_CRITERIA_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_evaluation_criteria_CRITERIA_ID_seq" OWNED BY "public"."t_evaluation_criteria"."CRITERIA_ID";



CREATE TABLE IF NOT EXISTS "public"."t_evaluation_detail" (
    "DETAIL_ID" integer NOT NULL,
    "EVALUATION_ID" integer NOT NULL,
    "CRITERIA_ID" integer,
    "ITEM_NUMBER" integer NOT NULL,
    "SCORE" numeric(5,2) NOT NULL,
    "STATUS" smallint DEFAULT 1,
    CONSTRAINT "chk_score_range" CHECK ((("SCORE" >= (1)::numeric) AND ("SCORE" <= (10)::numeric)))
);


ALTER TABLE "public"."t_evaluation_detail" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_evaluation_detail_DETAIL_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_evaluation_detail_DETAIL_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_evaluation_detail_DETAIL_ID_seq" OWNED BY "public"."t_evaluation_detail"."DETAIL_ID";



CREATE TABLE IF NOT EXISTS "public"."t_institution" (
    "INSTITUTION_ID" integer NOT NULL,
    "INSTITUTION_NAME" character varying(255) NOT NULL,
    "INSTITUTION_ADDRESS" character varying(255) NOT NULL,
    "INSTITUTION_CONTACT" character varying(12) NOT NULL,
    "PRACTICE_TYPE" character varying(255) NOT NULL,
    "REGION" character varying(255) NOT NULL,
    "NUCLEUS" character varying(255) NOT NULL,
    "EXTENSION" character varying(255) NOT NULL,
    "CREATION_DATE" timestamp without time zone NOT NULL,
    "INSTITUTION_TYPE" character varying(255) NOT NULL,
    "STATUS" smallint NOT NULL,
    "RIF" character varying(11) NOT NULL,
    "INSTITUTION_CODE" character varying(25) NOT NULL
);


ALTER TABLE "public"."t_institution" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_institution_INSTITUTION_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_institution_INSTITUTION_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_institution_INSTITUTION_ID_seq" OWNED BY "public"."t_institution"."INSTITUTION_ID";



CREATE TABLE IF NOT EXISTS "public"."t_institution_address" (
    "institution_address_id" bigint NOT NULL,
    "institution_id" integer NOT NULL,
    "address_id" bigint NOT NULL,
    "address_type_id" bigint NOT NULL,
    "is_primary" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "version" integer DEFAULT 1
);


ALTER TABLE "public"."t_institution_address" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_institution_address_institution_address_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_institution_address_institution_address_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_institution_address_institution_address_id_seq" OWNED BY "public"."t_institution_address"."institution_address_id";



CREATE TABLE IF NOT EXISTS "public"."t_institution_career" (
    "INSTITUTION_CAREER_ID" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "INSTITUTION_ID" integer NOT NULL,
    "CAREER_ID" integer NOT NULL
);


ALTER TABLE "public"."t_institution_career" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_institution_career_INSTITUTION_CAREER_ID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_institution_career_INSTITUTION_CAREER_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_institution_career_INSTITUTION_CAREER_ID_seq" OWNED BY "public"."t_institution_career"."INSTITUTION_CAREER_ID";



CREATE TABLE IF NOT EXISTS "public"."t_institution_internship_type" (
    "INSTITUTION_INTERNSHIP_TYPE_ID" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "INSTITUTION_ID" integer NOT NULL,
    "INTERNSHIP_TYPE_ID" integer NOT NULL
);


ALTER TABLE "public"."t_institution_internship_type" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_institution_internship_type_INSTITUTION_INTERNSHIP_TYPE_ID_se"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_institution_internship_type_INSTITUTION_INTERNSHIP_TYPE_ID_se" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_institution_internship_type_INSTITUTION_INTERNSHIP_TYPE_ID_se" OWNED BY "public"."t_institution_internship_type"."INSTITUTION_INTERNSHIP_TYPE_ID";



CREATE TABLE IF NOT EXISTS "public"."t_institution_manager" (
    "MANAGER_ID" integer NOT NULL,
    "person_id" integer,
    "MANAGER_CI" character varying(20),
    "NAME" character varying(100),
    "SECOND_NAME" character varying(100),
    "SURNAME" character varying(100),
    "SECOND_SURNAME" character varying(100),
    "CONTACT_PHONE" character varying(20),
    "EMAIL" character varying(100),
    "CREATION_DATE" timestamp without time zone NOT NULL,
    "STATUS" smallint NOT NULL,
    "INSTITUTION_ID" integer,
    "cargo" character varying(100),
    "TITLE" character varying(100) DEFAULT NULL::character varying
);


ALTER TABLE "public"."t_institution_manager" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_institution_manager_MANAGER_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_institution_manager_MANAGER_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_institution_manager_MANAGER_ID_seq" OWNED BY "public"."t_institution_manager"."MANAGER_ID";



CREATE TABLE IF NOT EXISTS "public"."t_institution_manager_institution" (
    "INSTITUTION_MANAGER_INSTITUTION_ID" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "MANAGER_ID" integer NOT NULL,
    "INSTITUTION_ID" integer NOT NULL,
    "cargo" character varying(100)
);


ALTER TABLE "public"."t_institution_manager_institution" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_institution_manager_institution_INSTITUTION_MANAGER_INSTITUTI"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_institution_manager_institution_INSTITUTION_MANAGER_INSTITUTI" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_institution_manager_institution_INSTITUTION_MANAGER_INSTITUTI" OWNED BY "public"."t_institution_manager_institution"."INSTITUTION_MANAGER_INSTITUTION_ID";



CREATE TABLE IF NOT EXISTS "public"."t_internship_type" (
    "INTERNSHIP_TYPE_ID" integer NOT NULL,
    "NAME" character varying(40) NOT NULL,
    "PRIORITY" smallint NOT NULL,
    "CREATION_DATE" timestamp without time zone NOT NULL,
    "STATUS" smallint NOT NULL,
    "HOURS_REQUIRED" integer DEFAULT 360
);


ALTER TABLE "public"."t_internship_type" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_internship_type_INTERNSHIP_TYPE_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_internship_type_INTERNSHIP_TYPE_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_internship_type_INTERNSHIP_TYPE_ID_seq" OWNED BY "public"."t_internship_type"."INTERNSHIP_TYPE_ID";



CREATE TABLE IF NOT EXISTS "public"."t_internships_period" (
    "PERIOD_ID" integer NOT NULL,
    "START_DATE" "date" NOT NULL,
    "END_DATE" "date" NOT NULL,
    "ENROLLMENT_GRACE_DAYS" smallint DEFAULT 21 NOT NULL,
    "EVALUATION_GRACE_DAYS" smallint DEFAULT 10 NOT NULL,
    "CREATION_DATE" timestamp without time zone NOT NULL,
    "DESCRIPTION" character varying(45) NOT NULL,
    "PERIOD_STATUS" character varying(45) NOT NULL,
    "STATUS" smallint NOT NULL,
    "T_INTERNSHIPS_CODE" character varying(8) NOT NULL
);


ALTER TABLE "public"."t_internships_period" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_internships_period_PERIOD_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_internships_period_PERIOD_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_internships_period_PERIOD_ID_seq" OWNED BY "public"."t_internships_period"."PERIOD_ID";



CREATE TABLE IF NOT EXISTS "public"."t_key_history" (
    "KEY_HISTORY_ID" integer NOT NULL,
    "USER_KEY_ID" integer NOT NULL,
    "USER_ID" integer NOT NULL,
    "END_DATE" character varying(45) NOT NULL,
    "STATUS" smallint NOT NULL
);


ALTER TABLE "public"."t_key_history" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_key_history_KEY_HISTORY_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_key_history_KEY_HISTORY_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_key_history_KEY_HISTORY_ID_seq" OWNED BY "public"."t_key_history"."KEY_HISTORY_ID";



CREATE TABLE IF NOT EXISTS "public"."t_knowledge_base" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "category" "text" NOT NULL,
    "content" "text" NOT NULL,
    "embedding" "public"."vector"(3),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "roles" "text"[],
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "chk_knowledge_base_category" CHECK (("category" = ANY (ARRAY['regulation'::"text", 'curriculum'::"text", 'process'::"text", 'faq'::"text", 'general'::"text"])))
);


ALTER TABLE "public"."t_knowledge_base" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."t_landing_config" (
    "config_id" integer NOT NULL,
    "config_key" character varying(100) NOT NULL,
    "config_value" "jsonb",
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_by" character varying(50) DEFAULT 'system'::character varying
);


ALTER TABLE "public"."t_landing_config" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_landing_config_config_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_landing_config_config_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_landing_config_config_id_seq" OWNED BY "public"."t_landing_config"."config_id";



CREATE SEQUENCE IF NOT EXISTS "public"."t_list_list_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_list_list_id_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."t_list" (
    "LIST_ID" integer DEFAULT "nextval"('"public"."t_list_list_id_seq"'::"regclass") NOT NULL,
    "NAME" character varying(40) NOT NULL,
    "CREATION_DATE" timestamp without time zone NOT NULL,
    "MODIF_USER_ID" integer NOT NULL,
    "MODIF_USER_DATE" timestamp without time zone NOT NULL,
    "ELIM_USER_ID" integer NOT NULL,
    "ELIM_USER_DATE" timestamp without time zone NOT NULL,
    "REST_USER_ID" integer NOT NULL,
    "REST_USER_DATE" timestamp without time zone NOT NULL,
    "STATUS" smallint NOT NULL
);


ALTER TABLE "public"."t_list" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_list_LIST_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_list_LIST_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_list_LIST_ID_seq" OWNED BY "public"."t_list"."LIST_ID";



CREATE TABLE IF NOT EXISTS "public"."t_municipio" (
    "municipio_id" bigint NOT NULL,
    "estado_id" integer NOT NULL,
    "name" character varying(100) NOT NULL
);


ALTER TABLE "public"."t_municipio" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_municipio_municipio_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_municipio_municipio_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_municipio_municipio_id_seq" OWNED BY "public"."t_municipio"."municipio_id";



CREATE TABLE IF NOT EXISTS "public"."t_notifications" (
    "NOTIFICATION_ID" integer NOT NULL,
    "USER_ID" integer NOT NULL,
    "TYPE" character varying(50) NOT NULL,
    "TITLE" character varying(255) NOT NULL,
    "MESSAGE" "text" NOT NULL,
    "READ" boolean DEFAULT false,
    "READ_AT" timestamp without time zone,
    "DATA" "jsonb",
    "CREATED_AT" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chk_notification_type" CHECK ((("TYPE")::"text" = ANY ((ARRAY['pre_enrollment'::character varying, 'enrollment'::character varying, 'tracking'::character varying, 'tracking_visit'::character varying, 'user_management'::character varying, 'reminder'::character varying, 'system'::character varying, 'approval'::character varying])::"text"[])))
);


ALTER TABLE "public"."t_notifications" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_notifications_NOTIFICATION_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_notifications_NOTIFICATION_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_notifications_NOTIFICATION_ID_seq" OWNED BY "public"."t_notifications"."NOTIFICATION_ID";



CREATE TABLE IF NOT EXISTS "public"."t_operation" (
    "OPERATION_ID" integer NOT NULL,
    "ACTION" character varying(45) NOT NULL,
    "DESCRIPTION" "text",
    "STATUS" smallint NOT NULL
);


ALTER TABLE "public"."t_operation" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_operation_OPERATION_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_operation_OPERATION_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_operation_OPERATION_ID_seq" OWNED BY "public"."t_operation"."OPERATION_ID";



CREATE TABLE IF NOT EXISTS "public"."t_parroquia" (
    "parroquia_id" bigint NOT NULL,
    "municipio_id" bigint NOT NULL,
    "name" character varying(200) NOT NULL
);


ALTER TABLE "public"."t_parroquia" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_parroquia_parroquia_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_parroquia_parroquia_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_parroquia_parroquia_id_seq" OWNED BY "public"."t_parroquia"."parroquia_id";



CREATE TABLE IF NOT EXISTS "public"."t_password_history" (
    "HISTORY_ID" integer NOT NULL,
    "USER_ID" integer NOT NULL,
    "KEY" "text" NOT NULL,
    "CREATION_DATE" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."t_password_history" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_password_history_HISTORY_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_password_history_HISTORY_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_password_history_HISTORY_ID_seq" OWNED BY "public"."t_password_history"."HISTORY_ID";



CREATE TABLE IF NOT EXISTS "public"."t_permissions" (
    "PERMISSIONS_ID" integer NOT NULL,
    "NAME" character varying(30) NOT NULL,
    "MODULE" character varying(50) DEFAULT 'General'::character varying NOT NULL,
    "DESCRIPTION" "text",
    "MODIF_USER_ID" integer NOT NULL,
    "MODIF_USER_DATE" timestamp without time zone NOT NULL,
    "ELIM_USER_ID" integer NOT NULL,
    "ELIM_USER_DATE" timestamp without time zone NOT NULL,
    "REST_USER_ID" integer NOT NULL,
    "REST_USER_DATE" timestamp without time zone NOT NULL,
    "STATUS" smallint NOT NULL
);


ALTER TABLE "public"."t_permissions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_permissions_PERMISSIONS_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_permissions_PERMISSIONS_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_permissions_PERMISSIONS_ID_seq" OWNED BY "public"."t_permissions"."PERMISSIONS_ID";



CREATE TABLE IF NOT EXISTS "public"."t_person_address" (
    "person_address_id" bigint NOT NULL,
    "person_id" integer NOT NULL,
    "address_id" bigint NOT NULL,
    "address_type_id" bigint NOT NULL,
    "is_primary" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "version" integer DEFAULT 1
);


ALTER TABLE "public"."t_person_address" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_person_address_person_address_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_person_address_person_address_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_person_address_person_address_id_seq" OWNED BY "public"."t_person_address"."person_address_id";



CREATE TABLE IF NOT EXISTS "public"."t_person_merge_log" (
    "log_id" integer NOT NULL,
    "ci" character varying(10) NOT NULL,
    "source_table" character varying(50) NOT NULL,
    "source_id" integer NOT NULL,
    "field_name" character varying(50) NOT NULL,
    "value_used" "text",
    "value_over" "text",
    "overridden_from" character varying(50),
    "severity" character varying(10) DEFAULT 'INFO'::character varying,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."t_person_merge_log" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_person_merge_log_log_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_person_merge_log_log_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_person_merge_log_log_id_seq" OWNED BY "public"."t_person_merge_log"."log_id";



CREATE TABLE IF NOT EXISTS "public"."t_persons" (
    "person_id" integer NOT NULL,
    "ci" character varying(10) NOT NULL,
    "first_name" character varying(255) NOT NULL,
    "middle_name" character varying(255),
    "last_name" character varying(255) NOT NULL,
    "second_last_name" character varying(255),
    "email" character varying(255) NOT NULL,
    "phone" character varying(15),
    "gender" character varying(10),
    "birthdate" "date",
    "address" character varying(255),
    "marital_status" character varying(45),
    "status" smallint DEFAULT 1,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."t_persons" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_persons_person_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_persons_person_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_persons_person_id_seq" OWNED BY "public"."t_persons"."person_id";



CREATE TABLE IF NOT EXISTS "public"."t_practice_visits" (
    "VISIT_ID" integer NOT NULL,
    "PROFESSIONAL_PRACTICE_ID" integer NOT NULL,
    "TUTOR_ID" integer NOT NULL,
    "VISIT_DATE" timestamp without time zone DEFAULT "now"() NOT NULL,
    "VISIT_TYPE" character varying(50) DEFAULT 'PRESENCIAL'::character varying NOT NULL,
    "HOURS_WORKED" numeric(5,2) DEFAULT 0,
    "ACTIVITIES_PERFORMED" "text",
    "OBSERVATIONS" "text",
    "RECOMMENDATIONS" "text",
    "STATUS" smallint DEFAULT 1 NOT NULL,
    "CREATED_AT" timestamp without time zone DEFAULT "now"() NOT NULL,
    "UPDATED_AT" timestamp without time zone DEFAULT "now"() NOT NULL,
    "CREATED_BY" integer,
    "VISIT_CASE" character varying(50) DEFAULT 'SEGUIMIENTO_REGULAR'::character varying,
    "tutor_person_id" integer NOT NULL
);


ALTER TABLE "public"."t_practice_visits" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_practice_visits_VISIT_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_practice_visits_VISIT_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_practice_visits_VISIT_ID_seq" OWNED BY "public"."t_practice_visits"."VISIT_ID";



CREATE TABLE IF NOT EXISTS "public"."t_preset_questions" (
    "PRESET_QUESTION_ID" integer NOT NULL,
    "DESCRIPTION" character varying(255) NOT NULL,
    "ANSWER" character varying(255) NOT NULL,
    "MODIF_USER_ID" integer NOT NULL,
    "MODIF_USER_DATE" timestamp without time zone NOT NULL,
    "ELIM_USER_ID" integer NOT NULL,
    "ELIM_USER_DATE" timestamp without time zone NOT NULL,
    "REST_USER_ID" integer NOT NULL,
    "REST_USER_DATE" timestamp without time zone NOT NULL,
    "STATUS" smallint NOT NULL
);


ALTER TABLE "public"."t_preset_questions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_preset_questions_PRESET_QUESTION_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_preset_questions_PRESET_QUESTION_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_preset_questions_PRESET_QUESTION_ID_seq" OWNED BY "public"."t_preset_questions"."PRESET_QUESTION_ID";



CREATE TABLE IF NOT EXISTS "public"."t_professional_practices" (
    "PROFESSIONAL_PRACTICE_ID" integer NOT NULL,
    "START_DATE" "date" NOT NULL,
    "END_DATE" "date" NOT NULL,
    "REPORT_TITLE" character varying(255) NOT NULL,
    "REGISTRATION_DATE" timestamp without time zone NOT NULL,
    "CREATION_DATE" timestamp without time zone NOT NULL,
    "GRADE" numeric(5,2) NOT NULL,
    "TRANSFER" smallint NOT NULL,
    "TOUR" character varying(255) NOT NULL,
    "PERIOD_ID" integer NOT NULL,
    "INSTITUTION_ID" integer,
    "STUDENTS_ID" integer NOT NULL,
    "STATUS" smallint NOT NULL,
    "MANAGER_ID" integer,
    "OBSERVATION" character varying(255) NOT NULL,
    "ENROLLMENT" character varying(255) NOT NULL,
    "INTERNSHIP_STATUS" integer NOT NULL,
    "INTERNSHIP_TYPE_ID" integer NOT NULL,
    "PRACTICES_STATUS" integer NOT NULL,
    "EVALUATION_STATUS" character varying(20) DEFAULT 'pending'::character varying,
    "SEMESTER" character varying(255) NOT NULL,
    "SECTION" character varying(255) NOT NULL,
    "REGIME" character varying(255) NOT NULL,
    "CAREER_ID" integer NOT NULL,
    "student_person_id" integer,
    "DEPARTMENT" character varying(255) DEFAULT NULL::character varying,
    CONSTRAINT "chk_practices_grade" CHECK (("GRADE" >= (0)::numeric))
);


ALTER TABLE "public"."t_professional_practices" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_professional_practices_PROFESSIONAL_PRACTICE_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_professional_practices_PROFESSIONAL_PRACTICE_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_professional_practices_PROFESSIONAL_PRACTICE_ID_seq" OWNED BY "public"."t_professional_practices"."PROFESSIONAL_PRACTICE_ID";



CREATE TABLE IF NOT EXISTS "public"."t_professional_practices_tutor" (
    "PROFESSIONAL_PRACTICES_TUTOR_ID" integer NOT NULL,
    "TUTOR_ID" integer NOT NULL,
    "PROFESSIONAL_PRACTICE_ID" integer NOT NULL,
    "TUTOR_TYPE" character varying(45) NOT NULL,
    "tutor_person_id" integer
);


ALTER TABLE "public"."t_professional_practices_tutor" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_professional_practices_tuto_PROFESSIONAL_PRACTICES_TUTOR__seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_professional_practices_tuto_PROFESSIONAL_PRACTICES_TUTOR__seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_professional_practices_tuto_PROFESSIONAL_PRACTICES_TUTOR__seq" OWNED BY "public"."t_professional_practices_tutor"."PROFESSIONAL_PRACTICES_TUTOR_ID";



CREATE TABLE IF NOT EXISTS "public"."t_prospect_list_items" (
    "ITEM_ID" integer NOT NULL,
    "LIST_ID" integer NOT NULL,
    "STUDENTS_ID" integer NOT NULL,
    "ENROLLED" boolean DEFAULT false NOT NULL,
    "NOTES" "text",
    "ADDED_AT" timestamp without time zone DEFAULT "now"() NOT NULL,
    "ADDED_BY" integer
);


ALTER TABLE "public"."t_prospect_list_items" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_prospect_list_items_ITEM_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_prospect_list_items_ITEM_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_prospect_list_items_ITEM_ID_seq" OWNED BY "public"."t_prospect_list_items"."ITEM_ID";



CREATE TABLE IF NOT EXISTS "public"."t_prospect_lists" (
    "LIST_ID" integer NOT NULL,
    "NAME" character varying(255) NOT NULL,
    "DESCRIPTION" "text",
    "PERIOD_ID" integer NOT NULL,
    "STATUS" smallint DEFAULT 1 NOT NULL,
    "CREATED_AT" timestamp without time zone DEFAULT "now"() NOT NULL,
    "UPDATED_AT" timestamp without time zone DEFAULT "now"() NOT NULL,
    "CREATED_BY" integer
);


ALTER TABLE "public"."t_prospect_lists" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_prospect_lists_LIST_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_prospect_lists_LIST_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_prospect_lists_LIST_ID_seq" OWNED BY "public"."t_prospect_lists"."LIST_ID";



CREATE TABLE IF NOT EXISTS "public"."t_recovery_tokens" (
    "TOKEN_ID" integer NOT NULL,
    "USER_ID" integer NOT NULL,
    "TOKEN" character varying(255) NOT NULL,
    "EXPIRATION_DATE" timestamp without time zone NOT NULL,
    "STATUS" smallint DEFAULT 1,
    "CREATION_DATE" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."t_recovery_tokens" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_recovery_tokens_TOKEN_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_recovery_tokens_TOKEN_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_recovery_tokens_TOKEN_ID_seq" OWNED BY "public"."t_recovery_tokens"."TOKEN_ID";



CREATE TABLE IF NOT EXISTS "public"."t_report_text_templates" (
    "TEMPLATE_ID" integer NOT NULL,
    "REPORT_TYPE" character varying(50) NOT NULL,
    "SECTION" character varying(50) NOT NULL,
    "CONTENT_TEMPLATE" "text" NOT NULL,
    "UPDATED_BY" integer,
    "UPDATED_AT" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "STATUS" smallint DEFAULT 1
);


ALTER TABLE "public"."t_report_text_templates" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_report_text_templates_TEMPLATE_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_report_text_templates_TEMPLATE_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_report_text_templates_TEMPLATE_ID_seq" OWNED BY "public"."t_report_text_templates"."TEMPLATE_ID";



CREATE TABLE IF NOT EXISTS "public"."t_request_types" (
    "REQUEST_TYPE_ID" integer NOT NULL,
    "NAME" character varying(100) NOT NULL,
    "DESCRIPTION" "text",
    "IS_ACTIVE" smallint DEFAULT 1 NOT NULL,
    "CREATION_DATE" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "MODIF_USER_ID" integer DEFAULT 0 NOT NULL,
    "MODIF_USER_DATE" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "ELIM_USER_ID" integer DEFAULT 0 NOT NULL,
    "ELIM_USER_DATE" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "REST_USER_ID" integer DEFAULT 0 NOT NULL,
    "REST_USER_DATE" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "STATUS" smallint DEFAULT 1 NOT NULL,
    "IS_REASSIGNMENT" smallint DEFAULT 0,
    "CATEGORY" character varying(50) DEFAULT 'GENERAL'::character varying
);


ALTER TABLE "public"."t_request_types" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_request_types_REQUEST_TYPE_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_request_types_REQUEST_TYPE_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_request_types_REQUEST_TYPE_ID_seq" OWNED BY "public"."t_request_types"."REQUEST_TYPE_ID";



CREATE TABLE IF NOT EXISTS "public"."t_roles" (
    "ID_ROLS" integer NOT NULL,
    "NAME" character varying(30) NOT NULL,
    "DESCRIPTION" "text",
    "MODIF_USER_ID" integer NOT NULL,
    "MODIF_USER_DATE" timestamp without time zone NOT NULL,
    "ELIM_USER_ID" integer NOT NULL,
    "ELIM_USER_DATE" timestamp without time zone NOT NULL,
    "REST_USER_ID" integer NOT NULL,
    "REST_USER_DATE" timestamp without time zone NOT NULL,
    "STATUS" smallint NOT NULL,
    "IS_SYSTEM" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."t_roles" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_roles_ID_ROLS_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_roles_ID_ROLS_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_roles_ID_ROLS_seq" OWNED BY "public"."t_roles"."ID_ROLS";



CREATE TABLE IF NOT EXISTS "public"."t_roles_permissions" (
    "ROLES_ID" integer NOT NULL,
    "PERMISSIONS_ID" integer NOT NULL
);


ALTER TABLE "public"."t_roles_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."t_security_questions" (
    "SECURITY_QUESTIONS_ID" integer NOT NULL,
    "USER_ID" integer NOT NULL,
    "PRESET_QUESTION_ID" integer NOT NULL,
    "ANSWER" "text",
    "CUSTOM_QUESTION" "text"
);


ALTER TABLE "public"."t_security_questions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_security_questions_SECURITY_QUESTIONS_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_security_questions_SECURITY_QUESTIONS_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_security_questions_SECURITY_QUESTIONS_ID_seq" OWNED BY "public"."t_security_questions"."SECURITY_QUESTIONS_ID";



CREATE TABLE IF NOT EXISTS "public"."t_session" (
    "SESSION_ID" integer NOT NULL,
    "USER_ID" integer NOT NULL,
    "LOGIN_TIME" timestamp without time zone NOT NULL,
    "MODIF_USER_ID" integer NOT NULL,
    "MODIF_USER_DATE" timestamp without time zone NOT NULL,
    "ELIM_USER_ID" integer NOT NULL,
    "ELIM_USER_DATE" timestamp without time zone NOT NULL,
    "REST_USER_ID" integer NOT NULL,
    "REST_USER_DATE" timestamp without time zone NOT NULL,
    "STATUS" smallint NOT NULL
);


ALTER TABLE "public"."t_session" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_session_SESSION_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_session_SESSION_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_session_SESSION_ID_seq" OWNED BY "public"."t_session"."SESSION_ID";



CREATE TABLE IF NOT EXISTS "public"."t_session_attempts" (
    "ATTEMPT_ID" integer NOT NULL,
    "ATTEMPT_TIME" timestamp without time zone NOT NULL,
    "USER_ID" integer NOT NULL,
    "ACTION" smallint NOT NULL,
    "MODIF_USER_ID" integer NOT NULL,
    "MODIF_USER_DATE" timestamp without time zone NOT NULL,
    "ELIM_USER_ID" integer NOT NULL,
    "ELIM_USER_DATE" timestamp without time zone NOT NULL,
    "REST_USER_ID" integer NOT NULL,
    "REST_USER_DATE" timestamp without time zone NOT NULL,
    "STATUS" smallint NOT NULL
);


ALTER TABLE "public"."t_session_attempts" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_session_attempts_ATTEMPT_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_session_attempts_ATTEMPT_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_session_attempts_ATTEMPT_ID_seq" OWNED BY "public"."t_session_attempts"."ATTEMPT_ID";



CREATE TABLE IF NOT EXISTS "public"."t_session_history" (
    "SESSION_HISTORY_ID" integer NOT NULL,
    "SESSION_ID" integer NOT NULL,
    "USER_ID" integer NOT NULL,
    "LOGIN_TIME" timestamp without time zone NOT NULL,
    "LOGOUT_TIME" timestamp without time zone NOT NULL,
    "STATUS" smallint NOT NULL
);


ALTER TABLE "public"."t_session_history" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_session_history_SESSION_HISTORY_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_session_history_SESSION_HISTORY_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_session_history_SESSION_HISTORY_ID_seq" OWNED BY "public"."t_session_history"."SESSION_HISTORY_ID";



CREATE TABLE IF NOT EXISTS "public"."t_student_documents" (
    "DOCUMENT_ID" integer NOT NULL,
    "STUDENT_ID" integer NOT NULL,
    "DOCUMENT_TYPE" character varying(50) NOT NULL,
    "TITLE" character varying(255) NOT NULL,
    "DESCRIPTION" "text",
    "FILE_NAME" character varying(255) NOT NULL,
    "FILE_PATH" character varying(500) NOT NULL,
    "FILE_SIZE" integer,
    "FILE_TYPE" character varying(100),
    "STATUS" character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "REJECTION_REASON" "text",
    "UPLOADED_AT" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "REVIEWED_AT" timestamp without time zone,
    "REVIEWED_BY" integer,
    "CREATION_DATE" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "MODIF_USER_ID" integer DEFAULT 0 NOT NULL,
    "MODIF_USER_DATE" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "STATUS_TABLE" smallint DEFAULT 1 NOT NULL,
    "student_person_id" integer NOT NULL
);


ALTER TABLE "public"."t_student_documents" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_student_documents_DOCUMENT_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_student_documents_DOCUMENT_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_student_documents_DOCUMENT_ID_seq" OWNED BY "public"."t_student_documents"."DOCUMENT_ID";



CREATE TABLE IF NOT EXISTS "public"."t_student_requests" (
    "REQUEST_ID" integer NOT NULL,
    "STUDENT_ID" integer NOT NULL,
    "REQUEST_TYPE_ID" integer NOT NULL,
    "SUBJECT" character varying(255) NOT NULL,
    "DESCRIPTION" "text" NOT NULL,
    "STATUS" character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "RESPONSE" "text",
    "PROCESSED_BY" integer,
    "PROCESSED_AT" timestamp without time zone,
    "CREATION_DATE" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "MODIF_USER_ID" integer DEFAULT 0 NOT NULL,
    "MODIF_USER_DATE" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "ELIM_USER_ID" integer DEFAULT 0 NOT NULL,
    "ELIM_USER_DATE" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "REST_USER_ID" integer DEFAULT 0 NOT NULL,
    "REST_USER_DATE" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "STATUS_TABLE" smallint DEFAULT 1 NOT NULL,
    "REASSIGNMENT_DATA" "jsonb",
    "IS_REASSIGNMENT" smallint DEFAULT 0,
    "PREVIOUS_TUTOR_ID" integer,
    "PREVIOUS_INSTITUTION_ID" integer,
    "PREVIOUS_CAREER_ID" integer,
    "student_person_id" integer NOT NULL
);


ALTER TABLE "public"."t_student_requests" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_student_requests_REQUEST_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_student_requests_REQUEST_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_student_requests_REQUEST_ID_seq" OWNED BY "public"."t_student_requests"."REQUEST_ID";



CREATE TABLE IF NOT EXISTS "public"."t_students" (
    "STUDENTS_ID" integer NOT NULL,
    "person_id" integer,
    "STUDENTS_CI" character varying(20),
    "NAME" character varying(100),
    "SECOND_NAME" character varying(100),
    "SURNAME" character varying(100),
    "SECOND_SURNAME" character varying(100),
    "GENDER" character(1),
    "BIRTHDATE" "date",
    "CONTACT_PHONE" character varying(20),
    "EMAIL" character varying(100),
    "ADDRESS" "text",
    "MARITAL_STATUS" character varying(1),
    "STUDENT_TYPE" character varying(45) NOT NULL,
    "MILITARY_RANK" character varying(45) DEFAULT NULL::character varying,
    "EMPLOYMENT" character varying(2) NOT NULL,
    "STATUS" smallint NOT NULL,
    "REGISTRATION_DATE" timestamp without time zone,
    "USER_ID" integer
);


ALTER TABLE "public"."t_students" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_students_STUDENTS_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_students_STUDENTS_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_students_STUDENTS_ID_seq" OWNED BY "public"."t_students"."STUDENTS_ID";



CREATE TABLE IF NOT EXISTS "public"."t_system_institution" (
    "system_institution_id" integer NOT NULL,
    "legal_name" character varying(500) NOT NULL,
    "commercial_name" character varying(255) NOT NULL,
    "acronym" character varying(50) NOT NULL,
    "rif" character varying(20),
    "phone" character varying(20),
    "email" character varying(255),
    "website" character varying(500),
    "logo_url" character varying(500),
    "resolution_number" character varying(100),
    "foundation_date" "date",
    "status" smallint DEFAULT 1 NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "region" character varying(255) DEFAULT ''::character varying NOT NULL,
    "nucleus" character varying(255) DEFAULT ''::character varying NOT NULL,
    "extension" character varying(255) DEFAULT ''::character varying NOT NULL,
    CONSTRAINT "t_system_institution_status_check" CHECK (("status" = ANY (ARRAY[0, 1])))
);


ALTER TABLE "public"."t_system_institution" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_system_institution_system_institution_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_system_institution_system_institution_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_system_institution_system_institution_id_seq" OWNED BY "public"."t_system_institution"."system_institution_id";



CREATE TABLE IF NOT EXISTS "public"."t_tables" (
    "TABLE_ID" integer NOT NULL,
    "NAME" character varying(25) NOT NULL,
    "DESCRIPTION" "text",
    "PHYSICAL_NAME" character varying(25) NOT NULL,
    "LOG" smallint NOT NULL,
    "STATUS" smallint NOT NULL
);


ALTER TABLE "public"."t_tables" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_tables_TABLE_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_tables_TABLE_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_tables_TABLE_ID_seq" OWNED BY "public"."t_tables"."TABLE_ID";



CREATE TABLE IF NOT EXISTS "public"."t_tutor_career" (
    "TUTOR_CAREER_ID" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "TUTOR_ID" integer NOT NULL,
    "CAREER_ID" integer NOT NULL
);


ALTER TABLE "public"."t_tutor_career" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_tutor_career_TUTOR_CAREER_ID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_tutor_career_TUTOR_CAREER_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_tutor_career_TUTOR_CAREER_ID_seq" OWNED BY "public"."t_tutor_career"."TUTOR_CAREER_ID";



CREATE TABLE IF NOT EXISTS "public"."t_tutors" (
    "TUTOR_ID" integer NOT NULL,
    "person_id" integer,
    "TUTOR_CI" character varying(20),
    "NAME" character varying(100),
    "SECOND_NAME" character varying(100),
    "SURNAME" character varying(100),
    "SECOND_SURNAME" character varying(100),
    "CONTACT_PHONE" character varying(20),
    "GENDER" character(1),
    "EMAIL" character varying(100),
    "PROFESSION" character varying(255) NOT NULL,
    "CONDITION" character varying(45) NOT NULL,
    "DEDICATION" character varying(45) NOT NULL,
    "CATEGORY" character varying(45) NOT NULL,
    "CREATION_DATE" timestamp without time zone NOT NULL,
    "STATUS" smallint NOT NULL,
    "USER_ID" integer,
    "TITULO" character varying(50) DEFAULT NULL::character varying,
    "ATTENTION_SCHEDULE" character varying(255) DEFAULT NULL::character varying
);


ALTER TABLE "public"."t_tutors" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_tutors_TUTOR_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_tutors_TUTOR_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_tutors_TUTOR_ID_seq" OWNED BY "public"."t_tutors"."TUTOR_ID";



CREATE TABLE IF NOT EXISTS "public"."t_user" (
    "USER_ID" integer NOT NULL,
    "USER" character varying(255) NOT NULL,
    "USER_CI" character varying(10) NOT NULL,
    "NAME" character varying(100),
    "SECOND_NAME" character varying(100),
    "SURNAME" character varying(100),
    "SECOND_SURNAME" character varying(100),
    "EMAIL" character varying(100),
    "PHONE_NUMBER" character varying(20),
    "CREATION_DATE" timestamp without time zone NOT NULL,
    "LOGIN" smallint NOT NULL,
    "TERMS_CONDITIONS" character varying(45) NOT NULL,
    "STATUS_SESSION" smallint NOT NULL,
    "STATUS" smallint NOT NULL,
    "FAILED_ATTEMPTS" integer DEFAULT 0,
    "LOCK_DATE" timestamp with time zone,
    "FORCE_PASSWORD_CHANGE" boolean DEFAULT false,
    "person_id" integer,
    "LAST_LOGIN" timestamp without time zone
);


ALTER TABLE "public"."t_user" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_user_USER_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_user_USER_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_user_USER_ID_seq" OWNED BY "public"."t_user"."USER_ID";



CREATE TABLE IF NOT EXISTS "public"."t_user_key" (
    "USER_KEY_ID" integer NOT NULL,
    "USER_ID" integer NOT NULL,
    "KEY" character varying(255) NOT NULL,
    "START_DATE" timestamp without time zone NOT NULL,
    "END_DATE" timestamp without time zone NOT NULL,
    "MODIF_USER_ID" integer NOT NULL,
    "MODIF_USER_DATE" timestamp without time zone NOT NULL,
    "ELIM_USER_ID" integer NOT NULL,
    "ELIM_USER_DATE" timestamp without time zone NOT NULL,
    "REST_USER_ID" integer NOT NULL,
    "REST_USER_DATE" timestamp without time zone NOT NULL,
    "STATUS" smallint NOT NULL,
    "IS_TEMPORARY" boolean DEFAULT false
);


ALTER TABLE "public"."t_user_key" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_user_key_USER_KEY_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_user_key_USER_KEY_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_user_key_USER_KEY_ID_seq" OWNED BY "public"."t_user_key"."USER_KEY_ID";



CREATE TABLE IF NOT EXISTS "public"."t_user_questions" (
    "USER_QUESTION_ID" integer NOT NULL,
    "USER_ID" integer NOT NULL,
    "QUESTION_TYPE" character varying(20) DEFAULT 'PRESET'::character varying NOT NULL,
    "PRESET_QUESTION_ID" integer,
    "CUSTOM_QUESTION" character varying(255),
    "ANSWER" character varying(255) NOT NULL,
    "ORDER_NUM" smallint DEFAULT 1 NOT NULL,
    "CREATED_AT" timestamp without time zone DEFAULT "now"() NOT NULL,
    "UPDATED_AT" timestamp without time zone DEFAULT "now"() NOT NULL,
    "STATUS" smallint DEFAULT 1 NOT NULL,
    CONSTRAINT "chk_question_type" CHECK ((((("QUESTION_TYPE")::"text" = 'PRESET'::"text") AND ("PRESET_QUESTION_ID" IS NOT NULL)) OR ((("QUESTION_TYPE")::"text" = 'CUSTOM'::"text") AND ("CUSTOM_QUESTION" IS NOT NULL))))
);


ALTER TABLE "public"."t_user_questions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_user_questions_USER_QUESTION_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_user_questions_USER_QUESTION_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_user_questions_USER_QUESTION_ID_seq" OWNED BY "public"."t_user_questions"."USER_QUESTION_ID";



CREATE TABLE IF NOT EXISTS "public"."t_user_roles" (
    "ID_USER" integer NOT NULL,
    "ID_ROLES" integer NOT NULL
);


ALTER TABLE "public"."t_user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."t_user_theme" (
    "USER_THEME_ID" integer NOT NULL,
    "USER_ID" integer NOT NULL,
    "BRAND_COLOR" character varying(20) DEFAULT 'blue'::character varying NOT NULL,
    "CREATION_DATE" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "MODIF_USER_ID" integer DEFAULT 0 NOT NULL,
    "MODIF_USER_DATE" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "ELIM_USER_ID" integer DEFAULT 0 NOT NULL,
    "ELIM_USER_DATE" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "REST_USER_ID" integer DEFAULT 0 NOT NULL,
    "REST_USER_DATE" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "STATUS" smallint DEFAULT 1 NOT NULL
);


ALTER TABLE "public"."t_user_theme" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_user_theme_USER_THEME_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_user_theme_USER_THEME_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_user_theme_USER_THEME_ID_seq" OWNED BY "public"."t_user_theme"."USER_THEME_ID";



CREATE TABLE IF NOT EXISTS "public"."t_value_list" (
    "VALUE_LIST_ID" integer NOT NULL,
    "NAME" character varying(45) NOT NULL,
    "ABBREVIATION" character varying(20) DEFAULT NULL::character varying,
    "LIST_ID" integer NOT NULL,
    "CREATION_DATE" timestamp without time zone NOT NULL,
    "MODIF_USER_ID" integer NOT NULL,
    "MODIF_USER_DATE" timestamp without time zone NOT NULL,
    "ELIM_USER_ID" integer NOT NULL,
    "ELIM_USER_DATE" timestamp without time zone NOT NULL,
    "REST_USER_ID" integer NOT NULL,
    "REST_USER_DATE" timestamp without time zone NOT NULL,
    "STATUS" smallint NOT NULL
);


ALTER TABLE "public"."t_value_list" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_value_list_VALUE_LIST_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_value_list_VALUE_LIST_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_value_list_VALUE_LIST_ID_seq" OWNED BY "public"."t_value_list"."VALUE_LIST_ID";



CREATE TABLE IF NOT EXISTS "public"."t_visit" (
    "VISIT_ID" integer NOT NULL,
    "VISIT_DATE" "date" NOT NULL,
    "NOTE" character varying(255) DEFAULT NULL::character varying,
    "REQUESTED_ACTIVITY" character varying(45) NOT NULL,
    "CARRIED_ACTIVITY" character varying(45) NOT NULL,
    "STATUS" smallint NOT NULL,
    "TUTOR_ID" integer NOT NULL,
    "PROFESSIONAL_PRACTICE_ID" integer NOT NULL
);


ALTER TABLE "public"."t_visit" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."t_visit_VISIT_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."t_visit_VISIT_ID_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."t_visit_VISIT_ID_seq" OWNED BY "public"."t_visit"."VISIT_ID";



ALTER TABLE ONLY "public"."t_activity_logs" ALTER COLUMN "ACTIVITY_LOG_ID" SET DEFAULT "nextval"('"public"."t_activity_logs_ACTIVITY_LOG_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_address" ALTER COLUMN "address_id" SET DEFAULT "nextval"('"public"."t_address_address_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_auth_log" ALTER COLUMN "ID" SET DEFAULT "nextval"('"public"."t_auth_log_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_career" ALTER COLUMN "CAREER_ID" SET DEFAULT "nextval"('"public"."t_career_CAREER_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_career_internship_type" ALTER COLUMN "ID_CAREER_INTERNSHIP_TYPE_ID" SET DEFAULT "nextval"('"public"."t_career_internship_type_ID_CAREER_INTERNSHIP_TYPE_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_change_log" ALTER COLUMN "CHANGE_LOG_ID" SET DEFAULT "nextval"('"public"."t_change_log_CHANGE_LOG_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_columns" ALTER COLUMN "COLUMN_ID" SET DEFAULT "nextval"('"public"."t_columns_COLUMN_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_config" ALTER COLUMN "CONFIG_ID" SET DEFAULT "nextval"('"public"."t_config_CONFIG_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_coordinadores" ALTER COLUMN "COORDINADOR_ID" SET DEFAULT "nextval"('"public"."t_coordinadores_COORDINADOR_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_email_templates" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."t_email_templates_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_evaluation" ALTER COLUMN "EVALUATION_ID" SET DEFAULT "nextval"('"public"."t_evaluation_EVALUATION_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_evaluation_criteria" ALTER COLUMN "CRITERIA_ID" SET DEFAULT "nextval"('"public"."t_evaluation_criteria_CRITERIA_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_evaluation_detail" ALTER COLUMN "DETAIL_ID" SET DEFAULT "nextval"('"public"."t_evaluation_detail_DETAIL_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_institution" ALTER COLUMN "INSTITUTION_ID" SET DEFAULT "nextval"('"public"."t_institution_INSTITUTION_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_institution_address" ALTER COLUMN "institution_address_id" SET DEFAULT "nextval"('"public"."t_institution_address_institution_address_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_institution_career" ALTER COLUMN "INSTITUTION_CAREER_ID" SET DEFAULT "nextval"('"public"."t_institution_career_INSTITUTION_CAREER_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_institution_internship_type" ALTER COLUMN "INSTITUTION_INTERNSHIP_TYPE_ID" SET DEFAULT "nextval"('"public"."t_institution_internship_type_INSTITUTION_INTERNSHIP_TYPE_ID_se"'::"regclass");



ALTER TABLE ONLY "public"."t_institution_manager" ALTER COLUMN "MANAGER_ID" SET DEFAULT "nextval"('"public"."t_institution_manager_MANAGER_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_institution_manager_institution" ALTER COLUMN "INSTITUTION_MANAGER_INSTITUTION_ID" SET DEFAULT "nextval"('"public"."t_institution_manager_institution_INSTITUTION_MANAGER_INSTITUTI"'::"regclass");



ALTER TABLE ONLY "public"."t_internship_type" ALTER COLUMN "INTERNSHIP_TYPE_ID" SET DEFAULT "nextval"('"public"."t_internship_type_INTERNSHIP_TYPE_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_internships_period" ALTER COLUMN "PERIOD_ID" SET DEFAULT "nextval"('"public"."t_internships_period_PERIOD_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_key_history" ALTER COLUMN "KEY_HISTORY_ID" SET DEFAULT "nextval"('"public"."t_key_history_KEY_HISTORY_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_landing_config" ALTER COLUMN "config_id" SET DEFAULT "nextval"('"public"."t_landing_config_config_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_municipio" ALTER COLUMN "municipio_id" SET DEFAULT "nextval"('"public"."t_municipio_municipio_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_notifications" ALTER COLUMN "NOTIFICATION_ID" SET DEFAULT "nextval"('"public"."t_notifications_NOTIFICATION_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_operation" ALTER COLUMN "OPERATION_ID" SET DEFAULT "nextval"('"public"."t_operation_OPERATION_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_parroquia" ALTER COLUMN "parroquia_id" SET DEFAULT "nextval"('"public"."t_parroquia_parroquia_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_password_history" ALTER COLUMN "HISTORY_ID" SET DEFAULT "nextval"('"public"."t_password_history_HISTORY_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_permissions" ALTER COLUMN "PERMISSIONS_ID" SET DEFAULT "nextval"('"public"."t_permissions_PERMISSIONS_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_person_address" ALTER COLUMN "person_address_id" SET DEFAULT "nextval"('"public"."t_person_address_person_address_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_person_merge_log" ALTER COLUMN "log_id" SET DEFAULT "nextval"('"public"."t_person_merge_log_log_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_persons" ALTER COLUMN "person_id" SET DEFAULT "nextval"('"public"."t_persons_person_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_practice_visits" ALTER COLUMN "VISIT_ID" SET DEFAULT "nextval"('"public"."t_practice_visits_VISIT_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_preset_questions" ALTER COLUMN "PRESET_QUESTION_ID" SET DEFAULT "nextval"('"public"."t_preset_questions_PRESET_QUESTION_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_professional_practices" ALTER COLUMN "PROFESSIONAL_PRACTICE_ID" SET DEFAULT "nextval"('"public"."t_professional_practices_PROFESSIONAL_PRACTICE_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_professional_practices_tutor" ALTER COLUMN "PROFESSIONAL_PRACTICES_TUTOR_ID" SET DEFAULT "nextval"('"public"."t_professional_practices_tuto_PROFESSIONAL_PRACTICES_TUTOR__seq"'::"regclass");



ALTER TABLE ONLY "public"."t_prospect_list_items" ALTER COLUMN "ITEM_ID" SET DEFAULT "nextval"('"public"."t_prospect_list_items_ITEM_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_prospect_lists" ALTER COLUMN "LIST_ID" SET DEFAULT "nextval"('"public"."t_prospect_lists_LIST_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_recovery_tokens" ALTER COLUMN "TOKEN_ID" SET DEFAULT "nextval"('"public"."t_recovery_tokens_TOKEN_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_report_text_templates" ALTER COLUMN "TEMPLATE_ID" SET DEFAULT "nextval"('"public"."t_report_text_templates_TEMPLATE_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_request_types" ALTER COLUMN "REQUEST_TYPE_ID" SET DEFAULT "nextval"('"public"."t_request_types_REQUEST_TYPE_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_roles" ALTER COLUMN "ID_ROLS" SET DEFAULT "nextval"('"public"."t_roles_ID_ROLS_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_security_questions" ALTER COLUMN "SECURITY_QUESTIONS_ID" SET DEFAULT "nextval"('"public"."t_security_questions_SECURITY_QUESTIONS_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_session" ALTER COLUMN "SESSION_ID" SET DEFAULT "nextval"('"public"."t_session_SESSION_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_session_attempts" ALTER COLUMN "ATTEMPT_ID" SET DEFAULT "nextval"('"public"."t_session_attempts_ATTEMPT_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_session_history" ALTER COLUMN "SESSION_HISTORY_ID" SET DEFAULT "nextval"('"public"."t_session_history_SESSION_HISTORY_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_student_documents" ALTER COLUMN "DOCUMENT_ID" SET DEFAULT "nextval"('"public"."t_student_documents_DOCUMENT_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_student_requests" ALTER COLUMN "REQUEST_ID" SET DEFAULT "nextval"('"public"."t_student_requests_REQUEST_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_students" ALTER COLUMN "STUDENTS_ID" SET DEFAULT "nextval"('"public"."t_students_STUDENTS_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_system_institution" ALTER COLUMN "system_institution_id" SET DEFAULT "nextval"('"public"."t_system_institution_system_institution_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_tables" ALTER COLUMN "TABLE_ID" SET DEFAULT "nextval"('"public"."t_tables_TABLE_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_tutor_career" ALTER COLUMN "TUTOR_CAREER_ID" SET DEFAULT "nextval"('"public"."t_tutor_career_TUTOR_CAREER_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_tutors" ALTER COLUMN "TUTOR_ID" SET DEFAULT "nextval"('"public"."t_tutors_TUTOR_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_user" ALTER COLUMN "USER_ID" SET DEFAULT "nextval"('"public"."t_user_USER_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_user_key" ALTER COLUMN "USER_KEY_ID" SET DEFAULT "nextval"('"public"."t_user_key_USER_KEY_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_user_questions" ALTER COLUMN "USER_QUESTION_ID" SET DEFAULT "nextval"('"public"."t_user_questions_USER_QUESTION_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_user_theme" ALTER COLUMN "USER_THEME_ID" SET DEFAULT "nextval"('"public"."t_user_theme_USER_THEME_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_value_list" ALTER COLUMN "VALUE_LIST_ID" SET DEFAULT "nextval"('"public"."t_value_list_VALUE_LIST_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_visit" ALTER COLUMN "VISIT_ID" SET DEFAULT "nextval"('"public"."t_visit_VISIT_ID_seq"'::"regclass");



ALTER TABLE ONLY "public"."t_academic_config"
    ADD CONSTRAINT "t_academic_config_pkey" PRIMARY KEY ("CONFIG_ID");



ALTER TABLE ONLY "public"."t_activity_logs"
    ADD CONSTRAINT "t_activity_logs_pkey" PRIMARY KEY ("ACTIVITY_LOG_ID");



ALTER TABLE ONLY "public"."t_address"
    ADD CONSTRAINT "t_address_pkey" PRIMARY KEY ("address_id");



ALTER TABLE ONLY "public"."t_address_type"
    ADD CONSTRAINT "t_address_type_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."t_address_type"
    ADD CONSTRAINT "t_address_type_pkey" PRIMARY KEY ("address_type_id");



ALTER TABLE ONLY "public"."t_address"
    ADD CONSTRAINT "t_address_uuid_key" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."t_auth_log"
    ADD CONSTRAINT "t_auth_log_pkey" PRIMARY KEY ("ID");



ALTER TABLE ONLY "public"."t_backups"
    ADD CONSTRAINT "t_backups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."t_career"
    ADD CONSTRAINT "t_career_CAREER_CODE_key" UNIQUE ("CAREER_CODE");



ALTER TABLE ONLY "public"."t_career_internship_type"
    ADD CONSTRAINT "t_career_internship_type_pkey" PRIMARY KEY ("ID_CAREER_INTERNSHIP_TYPE_ID");



ALTER TABLE ONLY "public"."t_career"
    ADD CONSTRAINT "t_career_pkey" PRIMARY KEY ("CAREER_ID");



ALTER TABLE ONLY "public"."t_change_log"
    ADD CONSTRAINT "t_change_log_pkey" PRIMARY KEY ("CHANGE_LOG_ID", "TABLE_ID", "COLUMN_ID", "OPERATION_ID", "USER_ID");



ALTER TABLE ONLY "public"."t_chat_config"
    ADD CONSTRAINT "t_chat_config_pkey" PRIMARY KEY ("config_id");



ALTER TABLE ONLY "public"."t_chat_sessions"
    ADD CONSTRAINT "t_chat_sessions_pkey" PRIMARY KEY ("SESSION_ID");



ALTER TABLE ONLY "public"."t_columns"
    ADD CONSTRAINT "t_columns_pkey" PRIMARY KEY ("COLUMN_ID");



ALTER TABLE ONLY "public"."t_config"
    ADD CONSTRAINT "t_config_pkey" PRIMARY KEY ("CONFIG_ID");



ALTER TABLE ONLY "public"."t_coordinadores"
    ADD CONSTRAINT "t_coordinadores_pkey" PRIMARY KEY ("COORDINADOR_ID");



ALTER TABLE ONLY "public"."t_email_templates"
    ADD CONSTRAINT "t_email_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."t_estado"
    ADD CONSTRAINT "t_estado_pkey" PRIMARY KEY ("estado_id");



ALTER TABLE ONLY "public"."t_evaluation_criteria"
    ADD CONSTRAINT "t_evaluation_criteria_pkey" PRIMARY KEY ("CRITERIA_ID");



ALTER TABLE ONLY "public"."t_evaluation_detail"
    ADD CONSTRAINT "t_evaluation_detail_pkey" PRIMARY KEY ("DETAIL_ID");



ALTER TABLE ONLY "public"."t_evaluation"
    ADD CONSTRAINT "t_evaluation_pkey" PRIMARY KEY ("EVALUATION_ID");



ALTER TABLE ONLY "public"."t_institution"
    ADD CONSTRAINT "t_institution_INSTITUTION_CODE_key" UNIQUE ("INSTITUTION_CODE");



ALTER TABLE ONLY "public"."t_institution_address"
    ADD CONSTRAINT "t_institution_address_institution_id_address_id_address_typ_key" UNIQUE ("institution_id", "address_id", "address_type_id");



ALTER TABLE ONLY "public"."t_institution_address"
    ADD CONSTRAINT "t_institution_address_pkey" PRIMARY KEY ("institution_address_id");



ALTER TABLE ONLY "public"."t_institution_career"
    ADD CONSTRAINT "t_institution_career_pkey" PRIMARY KEY ("INSTITUTION_CAREER_ID");



ALTER TABLE ONLY "public"."t_institution_internship_type"
    ADD CONSTRAINT "t_institution_internship_type_pkey" PRIMARY KEY ("INSTITUTION_INTERNSHIP_TYPE_ID");



ALTER TABLE ONLY "public"."t_institution_manager_institution"
    ADD CONSTRAINT "t_institution_manager_institution_MANAGER_ID_INSTITUTION_ID_key" UNIQUE ("MANAGER_ID", "INSTITUTION_ID");



ALTER TABLE ONLY "public"."t_institution_manager_institution"
    ADD CONSTRAINT "t_institution_manager_institution_pkey" PRIMARY KEY ("INSTITUTION_MANAGER_INSTITUTION_ID");



ALTER TABLE ONLY "public"."t_institution_manager"
    ADD CONSTRAINT "t_institution_manager_pkey" PRIMARY KEY ("MANAGER_ID");



ALTER TABLE ONLY "public"."t_institution"
    ADD CONSTRAINT "t_institution_pkey" PRIMARY KEY ("INSTITUTION_ID");



ALTER TABLE ONLY "public"."t_internship_type"
    ADD CONSTRAINT "t_internship_type_pkey" PRIMARY KEY ("INTERNSHIP_TYPE_ID");



ALTER TABLE ONLY "public"."t_internships_period"
    ADD CONSTRAINT "t_internships_period_pkey" PRIMARY KEY ("PERIOD_ID");



ALTER TABLE ONLY "public"."t_key_history"
    ADD CONSTRAINT "t_key_history_pkey" PRIMARY KEY ("KEY_HISTORY_ID", "USER_KEY_ID", "USER_ID");



ALTER TABLE ONLY "public"."t_knowledge_base"
    ADD CONSTRAINT "t_knowledge_base_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."t_landing_config"
    ADD CONSTRAINT "t_landing_config_config_key_key" UNIQUE ("config_key");



ALTER TABLE ONLY "public"."t_landing_config"
    ADD CONSTRAINT "t_landing_config_pkey" PRIMARY KEY ("config_id");



ALTER TABLE ONLY "public"."t_list"
    ADD CONSTRAINT "t_list_pkey" PRIMARY KEY ("LIST_ID");



ALTER TABLE ONLY "public"."t_municipio"
    ADD CONSTRAINT "t_municipio_pkey" PRIMARY KEY ("municipio_id");



ALTER TABLE ONLY "public"."t_notifications"
    ADD CONSTRAINT "t_notifications_pkey" PRIMARY KEY ("NOTIFICATION_ID");



ALTER TABLE ONLY "public"."t_operation"
    ADD CONSTRAINT "t_operation_pkey" PRIMARY KEY ("OPERATION_ID");



ALTER TABLE ONLY "public"."t_parroquia"
    ADD CONSTRAINT "t_parroquia_pkey" PRIMARY KEY ("parroquia_id");



ALTER TABLE ONLY "public"."t_password_history"
    ADD CONSTRAINT "t_password_history_pkey" PRIMARY KEY ("HISTORY_ID");



ALTER TABLE ONLY "public"."t_permissions"
    ADD CONSTRAINT "t_permissions_pkey" PRIMARY KEY ("PERMISSIONS_ID");



ALTER TABLE ONLY "public"."t_person_address"
    ADD CONSTRAINT "t_person_address_person_id_address_id_address_type_id_key" UNIQUE ("person_id", "address_id", "address_type_id");



ALTER TABLE ONLY "public"."t_person_address"
    ADD CONSTRAINT "t_person_address_pkey" PRIMARY KEY ("person_address_id");



ALTER TABLE ONLY "public"."t_person_merge_log"
    ADD CONSTRAINT "t_person_merge_log_pkey" PRIMARY KEY ("log_id");



ALTER TABLE ONLY "public"."t_persons"
    ADD CONSTRAINT "t_persons_ci_key" UNIQUE ("ci");



ALTER TABLE ONLY "public"."t_persons"
    ADD CONSTRAINT "t_persons_pkey" PRIMARY KEY ("person_id");



ALTER TABLE ONLY "public"."t_practice_visits"
    ADD CONSTRAINT "t_practice_visits_pkey" PRIMARY KEY ("VISIT_ID");



ALTER TABLE ONLY "public"."t_preset_questions"
    ADD CONSTRAINT "t_preset_questions_pkey" PRIMARY KEY ("PRESET_QUESTION_ID");



ALTER TABLE ONLY "public"."t_professional_practices"
    ADD CONSTRAINT "t_professional_practices_pkey" PRIMARY KEY ("PROFESSIONAL_PRACTICE_ID");



ALTER TABLE ONLY "public"."t_professional_practices_tutor"
    ADD CONSTRAINT "t_professional_practices_tutor_pkey" PRIMARY KEY ("PROFESSIONAL_PRACTICES_TUTOR_ID");



ALTER TABLE ONLY "public"."t_prospect_list_items"
    ADD CONSTRAINT "t_prospect_list_items_LIST_ID_STUDENTS_ID_key" UNIQUE ("LIST_ID", "STUDENTS_ID");



ALTER TABLE ONLY "public"."t_prospect_list_items"
    ADD CONSTRAINT "t_prospect_list_items_pkey" PRIMARY KEY ("ITEM_ID");



ALTER TABLE ONLY "public"."t_prospect_lists"
    ADD CONSTRAINT "t_prospect_lists_pkey" PRIMARY KEY ("LIST_ID");



ALTER TABLE ONLY "public"."t_recovery_tokens"
    ADD CONSTRAINT "t_recovery_tokens_pkey" PRIMARY KEY ("TOKEN_ID");



ALTER TABLE ONLY "public"."t_report_text_templates"
    ADD CONSTRAINT "t_report_text_templates_REPORT_TYPE_SECTION_key" UNIQUE ("REPORT_TYPE", "SECTION");



ALTER TABLE ONLY "public"."t_report_text_templates"
    ADD CONSTRAINT "t_report_text_templates_pkey" PRIMARY KEY ("TEMPLATE_ID");



ALTER TABLE ONLY "public"."t_request_types"
    ADD CONSTRAINT "t_request_types_pkey" PRIMARY KEY ("REQUEST_TYPE_ID");



ALTER TABLE ONLY "public"."t_roles_permissions"
    ADD CONSTRAINT "t_roles_permissions_pkey" PRIMARY KEY ("ROLES_ID", "PERMISSIONS_ID");



ALTER TABLE ONLY "public"."t_roles"
    ADD CONSTRAINT "t_roles_pkey" PRIMARY KEY ("ID_ROLS");



ALTER TABLE ONLY "public"."t_security_questions"
    ADD CONSTRAINT "t_security_questions_pkey" PRIMARY KEY ("SECURITY_QUESTIONS_ID");



ALTER TABLE ONLY "public"."t_session_attempts"
    ADD CONSTRAINT "t_session_attempts_pkey" PRIMARY KEY ("ATTEMPT_ID", "USER_ID");



ALTER TABLE ONLY "public"."t_session_history"
    ADD CONSTRAINT "t_session_history_pkey" PRIMARY KEY ("SESSION_HISTORY_ID", "SESSION_ID", "USER_ID");



ALTER TABLE ONLY "public"."t_session"
    ADD CONSTRAINT "t_session_pkey" PRIMARY KEY ("SESSION_ID", "USER_ID");



ALTER TABLE ONLY "public"."t_student_documents"
    ADD CONSTRAINT "t_student_documents_pkey" PRIMARY KEY ("DOCUMENT_ID");



ALTER TABLE ONLY "public"."t_student_requests"
    ADD CONSTRAINT "t_student_requests_pkey" PRIMARY KEY ("REQUEST_ID");



ALTER TABLE ONLY "public"."t_students"
    ADD CONSTRAINT "t_students_pkey" PRIMARY KEY ("STUDENTS_ID");



ALTER TABLE ONLY "public"."t_system_institution"
    ADD CONSTRAINT "t_system_institution_pkey" PRIMARY KEY ("system_institution_id");



ALTER TABLE ONLY "public"."t_tables"
    ADD CONSTRAINT "t_tables_pkey" PRIMARY KEY ("TABLE_ID");



ALTER TABLE ONLY "public"."t_tutor_career"
    ADD CONSTRAINT "t_tutor_career_pkey" PRIMARY KEY ("TUTOR_CAREER_ID");



ALTER TABLE ONLY "public"."t_tutors"
    ADD CONSTRAINT "t_tutors_pkey" PRIMARY KEY ("TUTOR_ID");



ALTER TABLE ONLY "public"."t_user"
    ADD CONSTRAINT "t_user_USER_CI_key" UNIQUE ("USER_CI");



ALTER TABLE ONLY "public"."t_user_key"
    ADD CONSTRAINT "t_user_key_pkey" PRIMARY KEY ("USER_KEY_ID", "USER_ID");



ALTER TABLE ONLY "public"."t_user"
    ADD CONSTRAINT "t_user_pkey" PRIMARY KEY ("USER_ID");



ALTER TABLE ONLY "public"."t_user_questions"
    ADD CONSTRAINT "t_user_questions_pkey" PRIMARY KEY ("USER_QUESTION_ID");



ALTER TABLE ONLY "public"."t_user_roles"
    ADD CONSTRAINT "t_user_roles_pkey" PRIMARY KEY ("ID_USER", "ID_ROLES");



ALTER TABLE ONLY "public"."t_user_theme"
    ADD CONSTRAINT "t_user_theme_USER_ID_key" UNIQUE ("USER_ID");



ALTER TABLE ONLY "public"."t_user_theme"
    ADD CONSTRAINT "t_user_theme_pkey" PRIMARY KEY ("USER_THEME_ID");



ALTER TABLE ONLY "public"."t_value_list"
    ADD CONSTRAINT "t_value_list_pkey" PRIMARY KEY ("VALUE_LIST_ID");



ALTER TABLE ONLY "public"."t_visit"
    ADD CONSTRAINT "t_visit_pkey" PRIMARY KEY ("VISIT_ID");



ALTER TABLE ONLY "public"."t_institution_manager"
    ADD CONSTRAINT "unique_institution_manager_person_id" UNIQUE ("person_id");



ALTER TABLE ONLY "public"."t_students"
    ADD CONSTRAINT "unique_students_person_id" UNIQUE ("person_id");



ALTER TABLE ONLY "public"."t_tutors"
    ADD CONSTRAINT "unique_tutor_person_id" UNIQUE ("person_id");



ALTER TABLE ONLY "public"."t_user"
    ADD CONSTRAINT "unique_user_person_id" UNIQUE ("person_id");



ALTER TABLE ONLY "public"."t_permissions"
    ADD CONSTRAINT "uq_permissions_name" UNIQUE ("NAME");



CREATE INDEX "idx_activity_logs_student_person_id" ON "public"."t_activity_logs" USING "btree" ("student_person_id");



CREATE INDEX "idx_backups_created_at" ON "public"."t_backups" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_career_internship_type_career_id" ON "public"."t_career_internship_type" USING "btree" ("CAREER_ID");



CREATE INDEX "idx_careers_name" ON "public"."t_career" USING "btree" ("CAREER_NAME");



CREATE INDEX "idx_careers_status" ON "public"."t_career" USING "btree" ("STATUS");



CREATE INDEX "idx_chat_config_user_id" ON "public"."t_chat_config" USING "btree" ("user_id");



CREATE UNIQUE INDEX "idx_chat_config_user_unique" ON "public"."t_chat_config" USING "btree" ("user_id");



CREATE INDEX "idx_chat_sessions_updated" ON "public"."t_chat_sessions" USING "btree" ("UPDATED_AT" DESC);



CREATE INDEX "idx_chat_sessions_user" ON "public"."t_chat_sessions" USING "btree" ("USER_ID", "STATUS");



CREATE INDEX "idx_criteria_type" ON "public"."t_evaluation_criteria" USING "btree" ("EVALUATOR_TYPE");



CREATE INDEX "idx_documents_status" ON "public"."t_student_documents" USING "btree" ("STATUS");



CREATE INDEX "idx_documents_student" ON "public"."t_student_documents" USING "btree" ("STUDENT_ID");



CREATE INDEX "idx_documents_type" ON "public"."t_student_documents" USING "btree" ("DOCUMENT_TYPE");



CREATE INDEX "idx_evaluation_detail_eval" ON "public"."t_evaluation_detail" USING "btree" ("EVALUATION_ID");



CREATE INDEX "idx_evaluation_practice" ON "public"."t_evaluation" USING "btree" ("PROFESSIONAL_PRACTICE_ID");



CREATE INDEX "idx_evaluation_type" ON "public"."t_evaluation" USING "btree" ("EVALUATOR_TYPE");



CREATE INDEX "idx_institution_career_career" ON "public"."t_institution_career" USING "btree" ("CAREER_ID");



CREATE INDEX "idx_institution_career_institution" ON "public"."t_institution_career" USING "btree" ("INSTITUTION_ID");



CREATE INDEX "idx_institution_code" ON "public"."t_institution" USING "btree" ("INSTITUTION_CODE");



CREATE INDEX "idx_institution_name" ON "public"."t_institution" USING "btree" ("INSTITUTION_NAME");



CREATE INDEX "idx_institution_rif" ON "public"."t_institution" USING "btree" ("RIF");



CREATE INDEX "idx_institutions_status" ON "public"."t_institution" USING "btree" ("STATUS");



CREATE INDEX "idx_kb_active" ON "public"."t_knowledge_base" USING "btree" ("is_active");



CREATE INDEX "idx_kb_category" ON "public"."t_knowledge_base" USING "btree" ("category");



CREATE INDEX "idx_landing_config_key" ON "public"."t_landing_config" USING "btree" ("config_key");



CREATE INDEX "idx_manager_institution_institution" ON "public"."t_institution_manager_institution" USING "btree" ("INSTITUTION_ID");



CREATE INDEX "idx_manager_institution_manager" ON "public"."t_institution_manager_institution" USING "btree" ("MANAGER_ID");



CREATE INDEX "idx_manager_person_id" ON "public"."t_institution_manager" USING "btree" ("person_id");



CREATE INDEX "idx_notifications_created" ON "public"."t_notifications" USING "btree" ("CREATED_AT" DESC);



CREATE INDEX "idx_notifications_read" ON "public"."t_notifications" USING "btree" ("READ");



CREATE INDEX "idx_notifications_user" ON "public"."t_notifications" USING "btree" ("USER_ID");



CREATE INDEX "idx_persons_ci" ON "public"."t_persons" USING "btree" ("ci");



CREATE INDEX "idx_persons_email" ON "public"."t_persons" USING "btree" ("email");



CREATE INDEX "idx_persons_names" ON "public"."t_persons" USING "btree" ("first_name", "last_name");



CREATE INDEX "idx_persons_status" ON "public"."t_persons" USING "btree" ("status");



CREATE INDEX "idx_pp_student_person_id" ON "public"."t_professional_practices" USING "btree" ("student_person_id");



CREATE INDEX "idx_pp_tutor_practice_id" ON "public"."t_professional_practices_tutor" USING "btree" ("PROFESSIONAL_PRACTICE_ID");



CREATE INDEX "idx_ppt_tutor_person_id" ON "public"."t_professional_practices_tutor" USING "btree" ("tutor_person_id");



CREATE INDEX "idx_practice_visits_tutor_person_id" ON "public"."t_practice_visits" USING "btree" ("tutor_person_id");



CREATE INDEX "idx_practices_institution_id" ON "public"."t_professional_practices" USING "btree" ("INSTITUTION_ID");



CREATE INDEX "idx_practices_reg_date" ON "public"."t_professional_practices" USING "btree" ("REGISTRATION_DATE");



CREATE INDEX "idx_practices_status" ON "public"."t_professional_practices" USING "btree" ("STATUS");



CREATE INDEX "idx_practices_student_id" ON "public"."t_professional_practices" USING "btree" ("STUDENTS_ID");



CREATE INDEX "idx_request_types_category" ON "public"."t_request_types" USING "btree" ("CATEGORY");



CREATE INDEX "idx_requests_is_reassignment" ON "public"."t_student_requests" USING "btree" ("IS_REASSIGNMENT");



CREATE INDEX "idx_student_documents_student_person_id" ON "public"."t_student_documents" USING "btree" ("student_person_id");



CREATE INDEX "idx_student_requests_status" ON "public"."t_student_requests" USING "btree" ("STATUS");



CREATE INDEX "idx_student_requests_student" ON "public"."t_student_requests" USING "btree" ("STUDENT_ID");



CREATE INDEX "idx_student_requests_student_person_id" ON "public"."t_student_requests" USING "btree" ("student_person_id");



CREATE INDEX "idx_student_requests_type" ON "public"."t_student_requests" USING "btree" ("REQUEST_TYPE_ID");



CREATE INDEX "idx_students_ci" ON "public"."t_students" USING "btree" ("STUDENTS_CI");



CREATE INDEX "idx_students_names" ON "public"."t_students" USING "btree" ("NAME", "SURNAME");



CREATE INDEX "idx_students_person_id" ON "public"."t_students" USING "btree" ("person_id");



CREATE INDEX "idx_students_status" ON "public"."t_students" USING "btree" ("STATUS");



CREATE INDEX "idx_tutors_person_id" ON "public"."t_tutors" USING "btree" ("person_id");



CREATE INDEX "idx_user_key_user_status_date" ON "public"."t_user_key" USING "btree" ("USER_ID", "STATUS", "START_DATE" DESC);



CREATE INDEX "idx_user_person_id" ON "public"."t_user" USING "btree" ("person_id");



CREATE INDEX "idx_user_questions_preset" ON "public"."t_user_questions" USING "btree" ("PRESET_QUESTION_ID");



CREATE INDEX "idx_user_questions_user" ON "public"."t_user_questions" USING "btree" ("USER_ID");



CREATE INDEX "idx_value_list_list_status" ON "public"."t_value_list" USING "btree" ("LIST_ID", "STATUS");



CREATE INDEX "idx_visits_case" ON "public"."t_practice_visits" USING "btree" ("VISIT_CASE");



CREATE INDEX "idx_visits_date" ON "public"."t_practice_visits" USING "btree" ("VISIT_DATE");



CREATE INDEX "idx_visits_practice_id" ON "public"."t_practice_visits" USING "btree" ("PROFESSIONAL_PRACTICE_ID");



CREATE INDEX "idx_visits_status" ON "public"."t_practice_visits" USING "btree" ("STATUS");



CREATE INDEX "idx_visits_tutor_id" ON "public"."t_practice_visits" USING "btree" ("TUTOR_ID");



CREATE INDEX "t_address_parroquia_id_idx" ON "public"."t_address" USING "btree" ("parroquia_id");



CREATE INDEX "t_institution_address_address_id_idx" ON "public"."t_institution_address" USING "btree" ("address_id");



CREATE INDEX "t_institution_address_institution_id_idx" ON "public"."t_institution_address" USING "btree" ("institution_id");



CREATE UNIQUE INDEX "t_institution_address_one_primary_idx" ON "public"."t_institution_address" USING "btree" ("institution_id", "address_type_id") WHERE ("is_primary" = true);



CREATE INDEX "t_municipio_estado_id_idx" ON "public"."t_municipio" USING "btree" ("estado_id");



CREATE INDEX "t_parroquia_municipio_id_idx" ON "public"."t_parroquia" USING "btree" ("municipio_id");



CREATE INDEX "t_person_address_address_id_idx" ON "public"."t_person_address" USING "btree" ("address_id");



CREATE UNIQUE INDEX "t_person_address_one_primary_idx" ON "public"."t_person_address" USING "btree" ("person_id", "address_type_id") WHERE ("is_primary" = true);



CREATE INDEX "t_person_address_person_id_idx" ON "public"."t_person_address" USING "btree" ("person_id");



ALTER TABLE ONLY "public"."t_academic_config"
    ADD CONSTRAINT "fk_academic_config_user" FOREIGN KEY ("UPDATED_BY") REFERENCES "public"."t_user"("USER_ID");



ALTER TABLE ONLY "public"."t_activity_logs"
    ADD CONSTRAINT "fk_activity_logs_practice" FOREIGN KEY ("PROFESSIONAL_PRACTICE_ID") REFERENCES "public"."t_professional_practices"("PROFESSIONAL_PRACTICE_ID");



ALTER TABLE ONLY "public"."t_activity_logs"
    ADD CONSTRAINT "fk_activity_logs_student" FOREIGN KEY ("STUDENT_ID") REFERENCES "public"."t_students"("STUDENTS_ID");



ALTER TABLE ONLY "public"."t_activity_logs"
    ADD CONSTRAINT "fk_activity_logs_student_person" FOREIGN KEY ("student_person_id") REFERENCES "public"."t_persons"("person_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."t_address"
    ADD CONSTRAINT "fk_address_parroquia" FOREIGN KEY ("parroquia_id") REFERENCES "public"."t_parroquia"("parroquia_id");



ALTER TABLE ONLY "public"."t_auth_log"
    ADD CONSTRAINT "fk_auth_log_user" FOREIGN KEY ("USER_ID") REFERENCES "public"."t_user"("USER_ID");



ALTER TABLE ONLY "public"."t_backups"
    ADD CONSTRAINT "fk_backups_user" FOREIGN KEY ("created_by") REFERENCES "public"."t_user"("USER_ID");



ALTER TABLE ONLY "public"."t_change_log"
    ADD CONSTRAINT "fk_change_log_columns" FOREIGN KEY ("COLUMN_ID") REFERENCES "public"."t_columns"("COLUMN_ID");



ALTER TABLE ONLY "public"."t_change_log"
    ADD CONSTRAINT "fk_change_log_operation" FOREIGN KEY ("OPERATION_ID") REFERENCES "public"."t_operation"("OPERATION_ID");



ALTER TABLE ONLY "public"."t_change_log"
    ADD CONSTRAINT "fk_change_log_tables" FOREIGN KEY ("TABLE_ID") REFERENCES "public"."t_tables"("TABLE_ID");



ALTER TABLE ONLY "public"."t_change_log"
    ADD CONSTRAINT "fk_change_log_user" FOREIGN KEY ("USER_ID") REFERENCES "public"."t_user"("USER_ID");



ALTER TABLE ONLY "public"."t_chat_sessions"
    ADD CONSTRAINT "fk_chat_session_user" FOREIGN KEY ("USER_ID") REFERENCES "public"."t_user"("USER_ID");



ALTER TABLE ONLY "public"."t_career_internship_type"
    ADD CONSTRAINT "fk_cit_career" FOREIGN KEY ("CAREER_ID") REFERENCES "public"."t_career"("CAREER_ID");



ALTER TABLE ONLY "public"."t_career_internship_type"
    ADD CONSTRAINT "fk_cit_internship_type" FOREIGN KEY ("INTERNSHIP_TYPE_ID") REFERENCES "public"."t_internship_type"("INTERNSHIP_TYPE_ID");



ALTER TABLE ONLY "public"."t_columns"
    ADD CONSTRAINT "fk_columns_tables" FOREIGN KEY ("TABLE_ID") REFERENCES "public"."t_tables"("TABLE_ID");



ALTER TABLE ONLY "public"."t_coordinadores"
    ADD CONSTRAINT "fk_coordinadores_career" FOREIGN KEY ("CAREER_ID") REFERENCES "public"."t_career"("CAREER_ID");



ALTER TABLE ONLY "public"."t_student_documents"
    ADD CONSTRAINT "fk_document_reviewer" FOREIGN KEY ("REVIEWED_BY") REFERENCES "public"."t_user"("USER_ID") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."t_student_documents"
    ADD CONSTRAINT "fk_document_student" FOREIGN KEY ("STUDENT_ID") REFERENCES "public"."t_students"("STUDENTS_ID") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."t_evaluation_detail"
    ADD CONSTRAINT "fk_evaluation_detail_criteria" FOREIGN KEY ("CRITERIA_ID") REFERENCES "public"."t_evaluation_criteria"("CRITERIA_ID");



ALTER TABLE ONLY "public"."t_evaluation_detail"
    ADD CONSTRAINT "fk_evaluation_detail_evaluation" FOREIGN KEY ("EVALUATION_ID") REFERENCES "public"."t_evaluation"("EVALUATION_ID") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."t_evaluation"
    ADD CONSTRAINT "fk_evaluation_evaluator" FOREIGN KEY ("EVALUATOR_ID") REFERENCES "public"."t_user"("USER_ID");



ALTER TABLE ONLY "public"."t_evaluation"
    ADD CONSTRAINT "fk_evaluation_practice" FOREIGN KEY ("PROFESSIONAL_PRACTICE_ID") REFERENCES "public"."t_professional_practices"("PROFESSIONAL_PRACTICE_ID");



ALTER TABLE ONLY "public"."t_evaluation"
    ADD CONSTRAINT "fk_evaluation_registered_by" FOREIGN KEY ("REGISTERED_BY") REFERENCES "public"."t_user"("USER_ID");



ALTER TABLE ONLY "public"."t_institution_career"
    ADD CONSTRAINT "fk_inst_career_career" FOREIGN KEY ("CAREER_ID") REFERENCES "public"."t_career"("CAREER_ID");



ALTER TABLE ONLY "public"."t_institution_career"
    ADD CONSTRAINT "fk_inst_career_institution" FOREIGN KEY ("INSTITUTION_ID") REFERENCES "public"."t_institution"("INSTITUTION_ID");



ALTER TABLE ONLY "public"."t_institution_internship_type"
    ADD CONSTRAINT "fk_inst_inter_type_institution" FOREIGN KEY ("INSTITUTION_ID") REFERENCES "public"."t_institution"("INSTITUTION_ID");



ALTER TABLE ONLY "public"."t_institution_internship_type"
    ADD CONSTRAINT "fk_inst_inter_type_type" FOREIGN KEY ("INTERNSHIP_TYPE_ID") REFERENCES "public"."t_internship_type"("INTERNSHIP_TYPE_ID");



ALTER TABLE ONLY "public"."t_institution_address"
    ADD CONSTRAINT "fk_institution_address_address" FOREIGN KEY ("address_id") REFERENCES "public"."t_address"("address_id");



ALTER TABLE ONLY "public"."t_institution_address"
    ADD CONSTRAINT "fk_institution_address_institution" FOREIGN KEY ("institution_id") REFERENCES "public"."t_institution"("INSTITUTION_ID") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."t_institution_address"
    ADD CONSTRAINT "fk_institution_address_type" FOREIGN KEY ("address_type_id") REFERENCES "public"."t_address_type"("address_type_id");



ALTER TABLE ONLY "public"."t_key_history"
    ADD CONSTRAINT "fk_key_history_user_key" FOREIGN KEY ("USER_KEY_ID", "USER_ID") REFERENCES "public"."t_user_key"("USER_KEY_ID", "USER_ID");



ALTER TABLE ONLY "public"."t_institution_manager_institution"
    ADD CONSTRAINT "fk_manager_inst_institution" FOREIGN KEY ("INSTITUTION_ID") REFERENCES "public"."t_institution"("INSTITUTION_ID") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."t_institution_manager_institution"
    ADD CONSTRAINT "fk_manager_inst_manager" FOREIGN KEY ("MANAGER_ID") REFERENCES "public"."t_institution_manager"("MANAGER_ID") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."t_institution_manager"
    ADD CONSTRAINT "fk_manager_institution" FOREIGN KEY ("INSTITUTION_ID") REFERENCES "public"."t_institution"("INSTITUTION_ID") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."t_institution_manager"
    ADD CONSTRAINT "fk_manager_person" FOREIGN KEY ("person_id") REFERENCES "public"."t_persons"("person_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."t_municipio"
    ADD CONSTRAINT "fk_municipio_estado" FOREIGN KEY ("estado_id") REFERENCES "public"."t_estado"("estado_id");



ALTER TABLE ONLY "public"."t_notifications"
    ADD CONSTRAINT "fk_notification_user" FOREIGN KEY ("USER_ID") REFERENCES "public"."t_user"("USER_ID") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."t_parroquia"
    ADD CONSTRAINT "fk_parroquia_municipio" FOREIGN KEY ("municipio_id") REFERENCES "public"."t_municipio"("municipio_id");



ALTER TABLE ONLY "public"."t_password_history"
    ADD CONSTRAINT "fk_password_history_user" FOREIGN KEY ("USER_ID") REFERENCES "public"."t_user"("USER_ID");



ALTER TABLE ONLY "public"."t_person_address"
    ADD CONSTRAINT "fk_person_address_address" FOREIGN KEY ("address_id") REFERENCES "public"."t_address"("address_id");



ALTER TABLE ONLY "public"."t_person_address"
    ADD CONSTRAINT "fk_person_address_person" FOREIGN KEY ("person_id") REFERENCES "public"."t_persons"("person_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."t_person_address"
    ADD CONSTRAINT "fk_person_address_type" FOREIGN KEY ("address_type_id") REFERENCES "public"."t_address_type"("address_type_id");



ALTER TABLE ONLY "public"."t_professional_practices"
    ADD CONSTRAINT "fk_pp_career" FOREIGN KEY ("CAREER_ID") REFERENCES "public"."t_career"("CAREER_ID");



ALTER TABLE ONLY "public"."t_professional_practices"
    ADD CONSTRAINT "fk_pp_institution" FOREIGN KEY ("INSTITUTION_ID") REFERENCES "public"."t_institution"("INSTITUTION_ID");



ALTER TABLE ONLY "public"."t_professional_practices"
    ADD CONSTRAINT "fk_pp_internship_type" FOREIGN KEY ("INTERNSHIP_TYPE_ID") REFERENCES "public"."t_internship_type"("INTERNSHIP_TYPE_ID");



ALTER TABLE ONLY "public"."t_professional_practices"
    ADD CONSTRAINT "fk_pp_manager" FOREIGN KEY ("MANAGER_ID") REFERENCES "public"."t_institution_manager"("MANAGER_ID");



ALTER TABLE ONLY "public"."t_professional_practices"
    ADD CONSTRAINT "fk_pp_period" FOREIGN KEY ("PERIOD_ID") REFERENCES "public"."t_internships_period"("PERIOD_ID");



ALTER TABLE ONLY "public"."t_professional_practices"
    ADD CONSTRAINT "fk_pp_student" FOREIGN KEY ("STUDENTS_ID") REFERENCES "public"."t_students"("STUDENTS_ID");



ALTER TABLE ONLY "public"."t_professional_practices"
    ADD CONSTRAINT "fk_pp_student_person" FOREIGN KEY ("student_person_id") REFERENCES "public"."t_persons"("person_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."t_professional_practices_tutor"
    ADD CONSTRAINT "fk_ppt_practice" FOREIGN KEY ("PROFESSIONAL_PRACTICE_ID") REFERENCES "public"."t_professional_practices"("PROFESSIONAL_PRACTICE_ID");



ALTER TABLE ONLY "public"."t_professional_practices_tutor"
    ADD CONSTRAINT "fk_ppt_tutor" FOREIGN KEY ("TUTOR_ID") REFERENCES "public"."t_tutors"("TUTOR_ID");



ALTER TABLE ONLY "public"."t_professional_practices_tutor"
    ADD CONSTRAINT "fk_ppt_tutor_person" FOREIGN KEY ("tutor_person_id") REFERENCES "public"."t_persons"("person_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."t_practice_visits"
    ADD CONSTRAINT "fk_practice_visits_practice" FOREIGN KEY ("PROFESSIONAL_PRACTICE_ID") REFERENCES "public"."t_professional_practices"("PROFESSIONAL_PRACTICE_ID");



ALTER TABLE ONLY "public"."t_practice_visits"
    ADD CONSTRAINT "fk_practice_visits_tutor" FOREIGN KEY ("TUTOR_ID") REFERENCES "public"."t_tutors"("TUTOR_ID");



ALTER TABLE ONLY "public"."t_practice_visits"
    ADD CONSTRAINT "fk_practice_visits_tutor_person" FOREIGN KEY ("tutor_person_id") REFERENCES "public"."t_persons"("person_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."t_prospect_list_items"
    ADD CONSTRAINT "fk_prospect_items_list" FOREIGN KEY ("LIST_ID") REFERENCES "public"."t_prospect_lists"("LIST_ID") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."t_prospect_list_items"
    ADD CONSTRAINT "fk_prospect_items_student" FOREIGN KEY ("STUDENTS_ID") REFERENCES "public"."t_students"("STUDENTS_ID");



ALTER TABLE ONLY "public"."t_prospect_list_items"
    ADD CONSTRAINT "fk_prospect_items_user" FOREIGN KEY ("ADDED_BY") REFERENCES "public"."t_user"("USER_ID");



ALTER TABLE ONLY "public"."t_prospect_lists"
    ADD CONSTRAINT "fk_prospect_lists_period" FOREIGN KEY ("PERIOD_ID") REFERENCES "public"."t_internships_period"("PERIOD_ID");



ALTER TABLE ONLY "public"."t_prospect_lists"
    ADD CONSTRAINT "fk_prospect_lists_user" FOREIGN KEY ("CREATED_BY") REFERENCES "public"."t_user"("USER_ID");



ALTER TABLE ONLY "public"."t_recovery_tokens"
    ADD CONSTRAINT "fk_recovery_user" FOREIGN KEY ("USER_ID") REFERENCES "public"."t_user"("USER_ID");



ALTER TABLE ONLY "public"."t_roles_permissions"
    ADD CONSTRAINT "fk_rp_permission" FOREIGN KEY ("PERMISSIONS_ID") REFERENCES "public"."t_permissions"("PERMISSIONS_ID");



ALTER TABLE ONLY "public"."t_roles_permissions"
    ADD CONSTRAINT "fk_rp_role" FOREIGN KEY ("ROLES_ID") REFERENCES "public"."t_roles"("ID_ROLS");



ALTER TABLE ONLY "public"."t_session_attempts"
    ADD CONSTRAINT "fk_session_attempts_user" FOREIGN KEY ("USER_ID") REFERENCES "public"."t_user"("USER_ID");



ALTER TABLE ONLY "public"."t_session_history"
    ADD CONSTRAINT "fk_session_history_session" FOREIGN KEY ("SESSION_ID", "USER_ID") REFERENCES "public"."t_session"("SESSION_ID", "USER_ID");



ALTER TABLE ONLY "public"."t_session"
    ADD CONSTRAINT "fk_session_user" FOREIGN KEY ("USER_ID") REFERENCES "public"."t_user"("USER_ID");



ALTER TABLE ONLY "public"."t_security_questions"
    ADD CONSTRAINT "fk_sq_preset" FOREIGN KEY ("PRESET_QUESTION_ID") REFERENCES "public"."t_preset_questions"("PRESET_QUESTION_ID");



ALTER TABLE ONLY "public"."t_security_questions"
    ADD CONSTRAINT "fk_sq_user" FOREIGN KEY ("USER_ID") REFERENCES "public"."t_user"("USER_ID");



ALTER TABLE ONLY "public"."t_student_documents"
    ADD CONSTRAINT "fk_student_documents_student_person" FOREIGN KEY ("student_person_id") REFERENCES "public"."t_persons"("person_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."t_student_requests"
    ADD CONSTRAINT "fk_student_request_student" FOREIGN KEY ("STUDENT_ID") REFERENCES "public"."t_students"("STUDENTS_ID") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."t_student_requests"
    ADD CONSTRAINT "fk_student_request_type" FOREIGN KEY ("REQUEST_TYPE_ID") REFERENCES "public"."t_request_types"("REQUEST_TYPE_ID") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."t_student_requests"
    ADD CONSTRAINT "fk_student_requests_student_person" FOREIGN KEY ("student_person_id") REFERENCES "public"."t_persons"("person_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."t_students"
    ADD CONSTRAINT "fk_students_person" FOREIGN KEY ("person_id") REFERENCES "public"."t_persons"("person_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."t_students"
    ADD CONSTRAINT "fk_students_user" FOREIGN KEY ("USER_ID") REFERENCES "public"."t_user"("USER_ID");



ALTER TABLE ONLY "public"."t_tutor_career"
    ADD CONSTRAINT "fk_tutor_career_career" FOREIGN KEY ("CAREER_ID") REFERENCES "public"."t_career"("CAREER_ID");



ALTER TABLE ONLY "public"."t_tutor_career"
    ADD CONSTRAINT "fk_tutor_career_tutor" FOREIGN KEY ("TUTOR_ID") REFERENCES "public"."t_tutors"("TUTOR_ID");



ALTER TABLE ONLY "public"."t_tutors"
    ADD CONSTRAINT "fk_tutors_person" FOREIGN KEY ("person_id") REFERENCES "public"."t_persons"("person_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."t_tutors"
    ADD CONSTRAINT "fk_tutors_user" FOREIGN KEY ("USER_ID") REFERENCES "public"."t_user"("USER_ID");



ALTER TABLE ONLY "public"."t_user_key"
    ADD CONSTRAINT "fk_user_key_user" FOREIGN KEY ("USER_ID") REFERENCES "public"."t_user"("USER_ID");



ALTER TABLE ONLY "public"."t_user"
    ADD CONSTRAINT "fk_user_person" FOREIGN KEY ("person_id") REFERENCES "public"."t_persons"("person_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."t_user_questions"
    ADD CONSTRAINT "fk_user_questions_preset" FOREIGN KEY ("PRESET_QUESTION_ID") REFERENCES "public"."t_preset_questions"("PRESET_QUESTION_ID") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."t_user_questions"
    ADD CONSTRAINT "fk_user_questions_user" FOREIGN KEY ("USER_ID") REFERENCES "public"."t_user"("USER_ID") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."t_user_roles"
    ADD CONSTRAINT "fk_user_roles_role" FOREIGN KEY ("ID_ROLES") REFERENCES "public"."t_roles"("ID_ROLS");



ALTER TABLE ONLY "public"."t_user_roles"
    ADD CONSTRAINT "fk_user_roles_user" FOREIGN KEY ("ID_USER") REFERENCES "public"."t_user"("USER_ID");



ALTER TABLE ONLY "public"."t_user_theme"
    ADD CONSTRAINT "fk_user_theme_user" FOREIGN KEY ("USER_ID") REFERENCES "public"."t_user"("USER_ID") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."t_value_list"
    ADD CONSTRAINT "fk_value_list_list" FOREIGN KEY ("LIST_ID") REFERENCES "public"."t_list"("LIST_ID");



ALTER TABLE ONLY "public"."t_visit"
    ADD CONSTRAINT "fk_visit_practice" FOREIGN KEY ("PROFESSIONAL_PRACTICE_ID") REFERENCES "public"."t_professional_practices"("PROFESSIONAL_PRACTICE_ID");



ALTER TABLE ONLY "public"."t_visit"
    ADD CONSTRAINT "fk_visit_tutor" FOREIGN KEY ("TUTOR_ID") REFERENCES "public"."t_tutors"("TUTOR_ID");



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



REVOKE ALL ON FUNCTION "public"."execute_sql"("sql" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."execute_sql"("sql" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."execute_sql"("sql" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_all_constraints"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_constraints"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_constraints"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_all_functions"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_functions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_functions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_all_indexes"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_indexes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_indexes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_all_sequences"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_sequences"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_sequences"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_all_table_definitions"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_table_definitions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_table_definitions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_all_tables"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_tables"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_tables"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_all_triggers"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_triggers"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_triggers"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_coincidence_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_coincidence_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_coincidence_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_institution_suggestions"("p_person_id" integer, "p_career_id" integer, "p_internship_type_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_institution_suggestions"("p_person_id" integer, "p_career_id" integer, "p_internship_type_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_institution_suggestions"("p_person_id" integer, "p_career_id" integer, "p_internship_type_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_primary_address"("p_entity_type" "text", "p_entity_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_primary_address"("p_entity_type" "text", "p_entity_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_primary_address"("p_entity_type" "text", "p_entity_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_rls_policies"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_rls_policies"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_rls_policies"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_table_definition"("table_name_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_table_definition"("table_name_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_table_definition"("table_name_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_knowledge_base"("query_embedding" "public"."vector", "match_threshold" double precision, "match_limit" integer, "filter_category" "text", "filter_roles" integer[]) TO "anon";
GRANT ALL ON FUNCTION "public"."search_knowledge_base"("query_embedding" "public"."vector", "match_threshold" double precision, "match_limit" integer, "filter_category" "text", "filter_roles" integer[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_knowledge_base"("query_embedding" "public"."vector", "match_threshold" double precision, "match_limit" integer, "filter_category" "text", "filter_roles" integer[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_set_student_person_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_set_student_person_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_set_student_person_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_set_tutor_person_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_set_tutor_person_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_set_tutor_person_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_kb_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_kb_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_kb_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."t_academic_config" TO "anon";
GRANT ALL ON TABLE "public"."t_academic_config" TO "authenticated";
GRANT ALL ON TABLE "public"."t_academic_config" TO "service_role";



GRANT ALL ON TABLE "public"."t_activity_logs" TO "anon";
GRANT ALL ON TABLE "public"."t_activity_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."t_activity_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_activity_logs_ACTIVITY_LOG_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_activity_logs_ACTIVITY_LOG_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_activity_logs_ACTIVITY_LOG_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_address" TO "anon";
GRANT ALL ON TABLE "public"."t_address" TO "authenticated";
GRANT ALL ON TABLE "public"."t_address" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_address_address_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_address_address_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_address_address_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_address_type" TO "anon";
GRANT ALL ON TABLE "public"."t_address_type" TO "authenticated";
GRANT ALL ON TABLE "public"."t_address_type" TO "service_role";



GRANT ALL ON TABLE "public"."t_auth_log" TO "anon";
GRANT ALL ON TABLE "public"."t_auth_log" TO "authenticated";
GRANT ALL ON TABLE "public"."t_auth_log" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_auth_log_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_auth_log_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_auth_log_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_backups" TO "anon";
GRANT ALL ON TABLE "public"."t_backups" TO "authenticated";
GRANT ALL ON TABLE "public"."t_backups" TO "service_role";



GRANT ALL ON TABLE "public"."t_career" TO "anon";
GRANT ALL ON TABLE "public"."t_career" TO "authenticated";
GRANT ALL ON TABLE "public"."t_career" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_career_CAREER_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_career_CAREER_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_career_CAREER_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_career_internship_type" TO "anon";
GRANT ALL ON TABLE "public"."t_career_internship_type" TO "authenticated";
GRANT ALL ON TABLE "public"."t_career_internship_type" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_career_internship_type_ID_CAREER_INTERNSHIP_TYPE_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_career_internship_type_ID_CAREER_INTERNSHIP_TYPE_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_career_internship_type_ID_CAREER_INTERNSHIP_TYPE_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_change_log" TO "anon";
GRANT ALL ON TABLE "public"."t_change_log" TO "authenticated";
GRANT ALL ON TABLE "public"."t_change_log" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_change_log_CHANGE_LOG_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_change_log_CHANGE_LOG_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_change_log_CHANGE_LOG_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_chat_config" TO "anon";
GRANT ALL ON TABLE "public"."t_chat_config" TO "authenticated";
GRANT ALL ON TABLE "public"."t_chat_config" TO "service_role";



GRANT ALL ON TABLE "public"."t_chat_sessions" TO "anon";
GRANT ALL ON TABLE "public"."t_chat_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."t_chat_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."t_columns" TO "anon";
GRANT ALL ON TABLE "public"."t_columns" TO "authenticated";
GRANT ALL ON TABLE "public"."t_columns" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_columns_COLUMN_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_columns_COLUMN_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_columns_COLUMN_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_config" TO "anon";
GRANT ALL ON TABLE "public"."t_config" TO "authenticated";
GRANT ALL ON TABLE "public"."t_config" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_config_CONFIG_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_config_CONFIG_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_config_CONFIG_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_coordinadores" TO "anon";
GRANT ALL ON TABLE "public"."t_coordinadores" TO "authenticated";
GRANT ALL ON TABLE "public"."t_coordinadores" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_coordinadores_COORDINADOR_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_coordinadores_COORDINADOR_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_coordinadores_COORDINADOR_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_email_templates" TO "anon";
GRANT ALL ON TABLE "public"."t_email_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."t_email_templates" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_email_templates_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_email_templates_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_email_templates_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_estado" TO "anon";
GRANT ALL ON TABLE "public"."t_estado" TO "authenticated";
GRANT ALL ON TABLE "public"."t_estado" TO "service_role";



GRANT ALL ON TABLE "public"."t_evaluation" TO "anon";
GRANT ALL ON TABLE "public"."t_evaluation" TO "authenticated";
GRANT ALL ON TABLE "public"."t_evaluation" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_evaluation_EVALUATION_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_evaluation_EVALUATION_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_evaluation_EVALUATION_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_evaluation_criteria" TO "anon";
GRANT ALL ON TABLE "public"."t_evaluation_criteria" TO "authenticated";
GRANT ALL ON TABLE "public"."t_evaluation_criteria" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_evaluation_criteria_CRITERIA_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_evaluation_criteria_CRITERIA_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_evaluation_criteria_CRITERIA_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_evaluation_detail" TO "anon";
GRANT ALL ON TABLE "public"."t_evaluation_detail" TO "authenticated";
GRANT ALL ON TABLE "public"."t_evaluation_detail" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_evaluation_detail_DETAIL_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_evaluation_detail_DETAIL_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_evaluation_detail_DETAIL_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_institution" TO "anon";
GRANT ALL ON TABLE "public"."t_institution" TO "authenticated";
GRANT ALL ON TABLE "public"."t_institution" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_institution_INSTITUTION_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_institution_INSTITUTION_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_institution_INSTITUTION_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_institution_address" TO "anon";
GRANT ALL ON TABLE "public"."t_institution_address" TO "authenticated";
GRANT ALL ON TABLE "public"."t_institution_address" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_institution_address_institution_address_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_institution_address_institution_address_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_institution_address_institution_address_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_institution_career" TO "anon";
GRANT ALL ON TABLE "public"."t_institution_career" TO "authenticated";
GRANT ALL ON TABLE "public"."t_institution_career" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_institution_career_INSTITUTION_CAREER_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_institution_career_INSTITUTION_CAREER_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_institution_career_INSTITUTION_CAREER_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_institution_internship_type" TO "anon";
GRANT ALL ON TABLE "public"."t_institution_internship_type" TO "authenticated";
GRANT ALL ON TABLE "public"."t_institution_internship_type" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_institution_internship_type_INSTITUTION_INTERNSHIP_TYPE_ID_se" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_institution_internship_type_INSTITUTION_INTERNSHIP_TYPE_ID_se" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_institution_internship_type_INSTITUTION_INTERNSHIP_TYPE_ID_se" TO "service_role";



GRANT ALL ON TABLE "public"."t_institution_manager" TO "anon";
GRANT ALL ON TABLE "public"."t_institution_manager" TO "authenticated";
GRANT ALL ON TABLE "public"."t_institution_manager" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_institution_manager_MANAGER_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_institution_manager_MANAGER_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_institution_manager_MANAGER_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_institution_manager_institution" TO "anon";
GRANT ALL ON TABLE "public"."t_institution_manager_institution" TO "authenticated";
GRANT ALL ON TABLE "public"."t_institution_manager_institution" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_institution_manager_institution_INSTITUTION_MANAGER_INSTITUTI" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_institution_manager_institution_INSTITUTION_MANAGER_INSTITUTI" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_institution_manager_institution_INSTITUTION_MANAGER_INSTITUTI" TO "service_role";



GRANT ALL ON TABLE "public"."t_internship_type" TO "anon";
GRANT ALL ON TABLE "public"."t_internship_type" TO "authenticated";
GRANT ALL ON TABLE "public"."t_internship_type" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_internship_type_INTERNSHIP_TYPE_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_internship_type_INTERNSHIP_TYPE_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_internship_type_INTERNSHIP_TYPE_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_internships_period" TO "anon";
GRANT ALL ON TABLE "public"."t_internships_period" TO "authenticated";
GRANT ALL ON TABLE "public"."t_internships_period" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_internships_period_PERIOD_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_internships_period_PERIOD_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_internships_period_PERIOD_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_key_history" TO "anon";
GRANT ALL ON TABLE "public"."t_key_history" TO "authenticated";
GRANT ALL ON TABLE "public"."t_key_history" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_key_history_KEY_HISTORY_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_key_history_KEY_HISTORY_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_key_history_KEY_HISTORY_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_knowledge_base" TO "anon";
GRANT ALL ON TABLE "public"."t_knowledge_base" TO "authenticated";
GRANT ALL ON TABLE "public"."t_knowledge_base" TO "service_role";



GRANT ALL ON TABLE "public"."t_landing_config" TO "anon";
GRANT ALL ON TABLE "public"."t_landing_config" TO "authenticated";
GRANT ALL ON TABLE "public"."t_landing_config" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_landing_config_config_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_landing_config_config_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_landing_config_config_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_list_list_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_list_list_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_list_list_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_list" TO "anon";
GRANT ALL ON TABLE "public"."t_list" TO "authenticated";
GRANT ALL ON TABLE "public"."t_list" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_list_LIST_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_list_LIST_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_list_LIST_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_municipio" TO "anon";
GRANT ALL ON TABLE "public"."t_municipio" TO "authenticated";
GRANT ALL ON TABLE "public"."t_municipio" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_municipio_municipio_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_municipio_municipio_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_municipio_municipio_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_notifications" TO "anon";
GRANT ALL ON TABLE "public"."t_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."t_notifications" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_notifications_NOTIFICATION_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_notifications_NOTIFICATION_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_notifications_NOTIFICATION_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_operation" TO "anon";
GRANT ALL ON TABLE "public"."t_operation" TO "authenticated";
GRANT ALL ON TABLE "public"."t_operation" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_operation_OPERATION_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_operation_OPERATION_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_operation_OPERATION_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_parroquia" TO "anon";
GRANT ALL ON TABLE "public"."t_parroquia" TO "authenticated";
GRANT ALL ON TABLE "public"."t_parroquia" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_parroquia_parroquia_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_parroquia_parroquia_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_parroquia_parroquia_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_password_history" TO "anon";
GRANT ALL ON TABLE "public"."t_password_history" TO "authenticated";
GRANT ALL ON TABLE "public"."t_password_history" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_password_history_HISTORY_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_password_history_HISTORY_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_password_history_HISTORY_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_permissions" TO "anon";
GRANT ALL ON TABLE "public"."t_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."t_permissions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_permissions_PERMISSIONS_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_permissions_PERMISSIONS_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_permissions_PERMISSIONS_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_person_address" TO "anon";
GRANT ALL ON TABLE "public"."t_person_address" TO "authenticated";
GRANT ALL ON TABLE "public"."t_person_address" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_person_address_person_address_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_person_address_person_address_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_person_address_person_address_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_person_merge_log" TO "anon";
GRANT ALL ON TABLE "public"."t_person_merge_log" TO "authenticated";
GRANT ALL ON TABLE "public"."t_person_merge_log" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_person_merge_log_log_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_person_merge_log_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_person_merge_log_log_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_persons" TO "anon";
GRANT ALL ON TABLE "public"."t_persons" TO "authenticated";
GRANT ALL ON TABLE "public"."t_persons" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_persons_person_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_persons_person_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_persons_person_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_practice_visits" TO "anon";
GRANT ALL ON TABLE "public"."t_practice_visits" TO "authenticated";
GRANT ALL ON TABLE "public"."t_practice_visits" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_practice_visits_VISIT_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_practice_visits_VISIT_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_practice_visits_VISIT_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_preset_questions" TO "anon";
GRANT ALL ON TABLE "public"."t_preset_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."t_preset_questions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_preset_questions_PRESET_QUESTION_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_preset_questions_PRESET_QUESTION_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_preset_questions_PRESET_QUESTION_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_professional_practices" TO "anon";
GRANT ALL ON TABLE "public"."t_professional_practices" TO "authenticated";
GRANT ALL ON TABLE "public"."t_professional_practices" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_professional_practices_PROFESSIONAL_PRACTICE_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_professional_practices_PROFESSIONAL_PRACTICE_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_professional_practices_PROFESSIONAL_PRACTICE_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_professional_practices_tutor" TO "anon";
GRANT ALL ON TABLE "public"."t_professional_practices_tutor" TO "authenticated";
GRANT ALL ON TABLE "public"."t_professional_practices_tutor" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_professional_practices_tuto_PROFESSIONAL_PRACTICES_TUTOR__seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_professional_practices_tuto_PROFESSIONAL_PRACTICES_TUTOR__seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_professional_practices_tuto_PROFESSIONAL_PRACTICES_TUTOR__seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_prospect_list_items" TO "anon";
GRANT ALL ON TABLE "public"."t_prospect_list_items" TO "authenticated";
GRANT ALL ON TABLE "public"."t_prospect_list_items" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_prospect_list_items_ITEM_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_prospect_list_items_ITEM_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_prospect_list_items_ITEM_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_prospect_lists" TO "anon";
GRANT ALL ON TABLE "public"."t_prospect_lists" TO "authenticated";
GRANT ALL ON TABLE "public"."t_prospect_lists" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_prospect_lists_LIST_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_prospect_lists_LIST_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_prospect_lists_LIST_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_recovery_tokens" TO "anon";
GRANT ALL ON TABLE "public"."t_recovery_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."t_recovery_tokens" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_recovery_tokens_TOKEN_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_recovery_tokens_TOKEN_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_recovery_tokens_TOKEN_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_report_text_templates" TO "anon";
GRANT ALL ON TABLE "public"."t_report_text_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."t_report_text_templates" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_report_text_templates_TEMPLATE_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_report_text_templates_TEMPLATE_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_report_text_templates_TEMPLATE_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_request_types" TO "anon";
GRANT ALL ON TABLE "public"."t_request_types" TO "authenticated";
GRANT ALL ON TABLE "public"."t_request_types" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_request_types_REQUEST_TYPE_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_request_types_REQUEST_TYPE_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_request_types_REQUEST_TYPE_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_roles" TO "anon";
GRANT ALL ON TABLE "public"."t_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."t_roles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_roles_ID_ROLS_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_roles_ID_ROLS_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_roles_ID_ROLS_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_roles_permissions" TO "anon";
GRANT ALL ON TABLE "public"."t_roles_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."t_roles_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."t_security_questions" TO "anon";
GRANT ALL ON TABLE "public"."t_security_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."t_security_questions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_security_questions_SECURITY_QUESTIONS_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_security_questions_SECURITY_QUESTIONS_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_security_questions_SECURITY_QUESTIONS_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_session" TO "anon";
GRANT ALL ON TABLE "public"."t_session" TO "authenticated";
GRANT ALL ON TABLE "public"."t_session" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_session_SESSION_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_session_SESSION_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_session_SESSION_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_session_attempts" TO "anon";
GRANT ALL ON TABLE "public"."t_session_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."t_session_attempts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_session_attempts_ATTEMPT_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_session_attempts_ATTEMPT_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_session_attempts_ATTEMPT_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_session_history" TO "anon";
GRANT ALL ON TABLE "public"."t_session_history" TO "authenticated";
GRANT ALL ON TABLE "public"."t_session_history" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_session_history_SESSION_HISTORY_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_session_history_SESSION_HISTORY_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_session_history_SESSION_HISTORY_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_student_documents" TO "anon";
GRANT ALL ON TABLE "public"."t_student_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."t_student_documents" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_student_documents_DOCUMENT_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_student_documents_DOCUMENT_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_student_documents_DOCUMENT_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_student_requests" TO "anon";
GRANT ALL ON TABLE "public"."t_student_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."t_student_requests" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_student_requests_REQUEST_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_student_requests_REQUEST_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_student_requests_REQUEST_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_students" TO "anon";
GRANT ALL ON TABLE "public"."t_students" TO "authenticated";
GRANT ALL ON TABLE "public"."t_students" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_students_STUDENTS_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_students_STUDENTS_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_students_STUDENTS_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_system_institution" TO "anon";
GRANT ALL ON TABLE "public"."t_system_institution" TO "authenticated";
GRANT ALL ON TABLE "public"."t_system_institution" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_system_institution_system_institution_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_system_institution_system_institution_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_system_institution_system_institution_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_tables" TO "anon";
GRANT ALL ON TABLE "public"."t_tables" TO "authenticated";
GRANT ALL ON TABLE "public"."t_tables" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_tables_TABLE_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_tables_TABLE_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_tables_TABLE_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_tutor_career" TO "anon";
GRANT ALL ON TABLE "public"."t_tutor_career" TO "authenticated";
GRANT ALL ON TABLE "public"."t_tutor_career" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_tutor_career_TUTOR_CAREER_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_tutor_career_TUTOR_CAREER_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_tutor_career_TUTOR_CAREER_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_tutors" TO "anon";
GRANT ALL ON TABLE "public"."t_tutors" TO "authenticated";
GRANT ALL ON TABLE "public"."t_tutors" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_tutors_TUTOR_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_tutors_TUTOR_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_tutors_TUTOR_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_user" TO "anon";
GRANT ALL ON TABLE "public"."t_user" TO "authenticated";
GRANT ALL ON TABLE "public"."t_user" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_user_USER_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_user_USER_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_user_USER_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_user_key" TO "anon";
GRANT ALL ON TABLE "public"."t_user_key" TO "authenticated";
GRANT ALL ON TABLE "public"."t_user_key" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_user_key_USER_KEY_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_user_key_USER_KEY_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_user_key_USER_KEY_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_user_questions" TO "anon";
GRANT ALL ON TABLE "public"."t_user_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."t_user_questions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_user_questions_USER_QUESTION_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_user_questions_USER_QUESTION_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_user_questions_USER_QUESTION_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_user_roles" TO "anon";
GRANT ALL ON TABLE "public"."t_user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."t_user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."t_user_theme" TO "anon";
GRANT ALL ON TABLE "public"."t_user_theme" TO "authenticated";
GRANT ALL ON TABLE "public"."t_user_theme" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_user_theme_USER_THEME_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_user_theme_USER_THEME_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_user_theme_USER_THEME_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_value_list" TO "anon";
GRANT ALL ON TABLE "public"."t_value_list" TO "authenticated";
GRANT ALL ON TABLE "public"."t_value_list" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_value_list_VALUE_LIST_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_value_list_VALUE_LIST_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_value_list_VALUE_LIST_ID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."t_visit" TO "anon";
GRANT ALL ON TABLE "public"."t_visit" TO "authenticated";
GRANT ALL ON TABLE "public"."t_visit" TO "service_role";



GRANT ALL ON SEQUENCE "public"."t_visit_VISIT_ID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."t_visit_VISIT_ID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."t_visit_VISIT_ID_seq" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







