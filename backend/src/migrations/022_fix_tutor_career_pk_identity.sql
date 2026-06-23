-- Migration: 022_fix_tutor_career_pk_identity
-- Description: Fix TUTOR_CAREER_ID column to auto-generate PK values.
-- The column was defined as BIGINT NOT NULL without SERIAL or IDENTITY,
-- causing inserts into t_tutor_career to fail with:
--   null value in column "TUTOR_CAREER_ID" violates not-null constraint
-- Idempotent: safe to run multiple times.

-- Check for other PKs with the same issue (BIGINT NOT NULL without default)
DO $$
DECLARE
  rec RECORD;
  missing_defaults TEXT[] := '{}';
BEGIN
  FOR rec IN
    SELECT
      c.table_name,
      c.column_name,
      c.data_type,
      c.is_identity,
      c.column_default
    FROM information_schema.columns c
    JOIN information_schema.table_constraints tc
      ON tc.table_name = c.table_name
      AND tc.constraint_type = 'PRIMARY KEY'
    JOIN information_schema.key_column_usage kcu
      ON kcu.column_name = c.column_name
      AND kcu.table_name = c.table_name
      AND kcu.constraint_name = tc.constraint_name
    WHERE c.table_schema = 'public'
      AND c.is_identity = 'NO'
      AND (c.column_default IS NULL OR c.column_default NOT LIKE 'nextval%')
      AND c.data_type IN ('integer', 'bigint', 'smallint')
  LOOP
    missing_defaults := array_append(
      missing_defaults,
      format('  - %I.%I (%s)', rec.table_name, rec.column_name, rec.data_type)
    );
  END LOOP;

  IF array_length(missing_defaults, 1) > 0 THEN
    RAISE NOTICE 'Tables with PK columns missing auto-increment default:';
    RAISE NOTICE '%', array_to_string(missing_defaults, E'\n');
  ELSE
    RAISE NOTICE 'All PK columns have auto-increment defaults.';
  END IF;
END $$;

-- ============================================================
-- Fix t_tutor_career.TUTOR_CAREER_ID
-- ============================================================
DO $$
BEGIN
  -- Only add identity if the column doesn't already have a default or identity
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 't_tutor_career'
      AND column_name = 'TUTOR_CAREER_ID'
      AND (is_identity = 'YES' OR column_default IS NOT NULL)
  ) THEN
    -- Use serial sequence approach (compatible with PG 12+)
    CREATE SEQUENCE IF NOT EXISTS "t_tutor_career_TUTOR_CAREER_ID_seq"
      START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

    ALTER TABLE "t_tutor_career"
      ALTER COLUMN "TUTOR_CAREER_ID"
      SET DEFAULT nextval('"t_tutor_career_TUTOR_CAREER_ID_seq"');

    ALTER SEQUENCE "t_tutor_career_TUTOR_CAREER_ID_seq"
      OWNED BY "t_tutor_career"."TUTOR_CAREER_ID";

    RAISE NOTICE '✅ Applied SERIAL default to t_tutor_career.TUTOR_CAREER_ID';
  ELSE
    RAISE NOTICE '⏭️ t_tutor_career.TUTOR_CAREER_ID already has a default/identity, skipping';
  END IF;
END $$;

-- Sync sequence to max existing value (prevents duplicate key errors)
PERFORM setval(
  '"t_tutor_career_TUTOR_CAREER_ID_seq"',
  COALESCE((SELECT MAX("TUTOR_CAREER_ID") FROM "t_tutor_career"), 0) + 1,
  false
);
