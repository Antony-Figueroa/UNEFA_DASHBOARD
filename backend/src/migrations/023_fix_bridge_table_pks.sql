-- Migration: 023_fix_bridge_table_pks
-- Description: Fix PK auto-increment on bridge tables that have the same issue
-- as t_tutor_career — PK columns defined as BIGINT NOT NULL without SERIAL/IDENTITY.
-- 
-- Affected tables:
--   t_institution_career.INSTITUTION_CAREER_ID
--   t_institution_internship_type.INSTITUTION_INTERNSHIP_TYPE_ID
--   t_institution_manager_institution.INSTITUTION_MANAGER_INSTITUTION_ID
--
-- Idempotent: safe to run multiple times.
-- ============================================================

-- Helper: generic macro cannot exist in SQL, so we use a pattern per table.
-- Each block: create sequence → set default → own sequence → sync value.

-- ============================================================
-- 1. t_institution_career.INSTITUTION_CAREER_ID
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 't_institution_career'
      AND column_name = 'INSTITUTION_CAREER_ID'
      AND (is_identity = 'YES' OR column_default IS NOT NULL)
  ) THEN
    CREATE SEQUENCE IF NOT EXISTS "t_institution_career_INSTITUTION_CAREER_ID_seq"
      START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

    ALTER TABLE "t_institution_career"
      ALTER COLUMN "INSTITUTION_CAREER_ID"
      SET DEFAULT nextval('"t_institution_career_INSTITUTION_CAREER_ID_seq"');

    ALTER SEQUENCE "t_institution_career_INSTITUTION_CAREER_ID_seq"
      OWNED BY "t_institution_career"."INSTITUTION_CAREER_ID";

    RAISE NOTICE 'Applied SERIAL default to t_institution_career.INSTITUTION_CAREER_ID';
  ELSE
    RAISE NOTICE 't_institution_career.INSTITUTION_CAREER_ID already has a default, skipping';
  END IF;
END $$;

SELECT setval(
  '"t_institution_career_INSTITUTION_CAREER_ID_seq"',
  COALESCE((SELECT MAX("INSTITUTION_CAREER_ID") FROM "t_institution_career"), 0) + 1,
  false
);

-- ============================================================
-- 2. t_institution_internship_type.INSTITUTION_INTERNSHIP_TYPE_ID
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 't_institution_internship_type'
      AND column_name = 'INSTITUTION_INTERNSHIP_TYPE_ID'
      AND (is_identity = 'YES' OR column_default IS NOT NULL)
  ) THEN
    CREATE SEQUENCE IF NOT EXISTS "t_institution_internship_type_INSTITUTION_INTERNSHIP_TYPE_ID_seq"
      START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

    ALTER TABLE "t_institution_internship_type"
      ALTER COLUMN "INSTITUTION_INTERNSHIP_TYPE_ID"
      SET DEFAULT nextval('"t_institution_internship_type_INSTITUTION_INTERNSHIP_TYPE_ID_seq"');

    ALTER SEQUENCE "t_institution_internship_type_INSTITUTION_INTERNSHIP_TYPE_ID_seq"
      OWNED BY "t_institution_internship_type"."INSTITUTION_INTERNSHIP_TYPE_ID";

    RAISE NOTICE 'Applied SERIAL default to t_institution_internship_type.INSTITUTION_INTERNSHIP_TYPE_ID';
  ELSE
    RAISE NOTICE 't_institution_internship_type.INSTITUTION_INTERNSHIP_TYPE_ID already has a default, skipping';
  END IF;
END $$;

SELECT setval(
  '"t_institution_internship_type_INSTITUTION_INTERNSHIP_TYPE_ID_seq"',
  COALESCE((SELECT MAX("INSTITUTION_INTERNSHIP_TYPE_ID") FROM "t_institution_internship_type"), 0) + 1,
  false
);

-- ============================================================
-- 3. t_institution_manager_institution.INSTITUTION_MANAGER_INSTITUTION_ID
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 't_institution_manager_institution'
      AND column_name = 'INSTITUTION_MANAGER_INSTITUTION_ID'
      AND (is_identity = 'YES' OR column_default IS NOT NULL)
  ) THEN
    CREATE SEQUENCE IF NOT EXISTS "t_institution_manager_institution_INSTITUTION_MANAGER_INSTITUTION_ID_seq"
      START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

    ALTER TABLE "t_institution_manager_institution"
      ALTER COLUMN "INSTITUTION_MANAGER_INSTITUTION_ID"
      SET DEFAULT nextval('"t_institution_manager_institution_INSTITUTION_MANAGER_INSTITUTION_ID_seq"');

    ALTER SEQUENCE "t_institution_manager_institution_INSTITUTION_MANAGER_INSTITUTION_ID_seq"
      OWNED BY "t_institution_manager_institution"."INSTITUTION_MANAGER_INSTITUTION_ID";

    RAISE NOTICE 'Applied SERIAL default to t_institution_manager_institution.INSTITUTION_MANAGER_INSTITUTION_ID';
  ELSE
    RAISE NOTICE 't_institution_manager_institution.INSTITUTION_MANAGER_INSTITUTION_ID already has a default, skipping';
  END IF;
END $$;

SELECT setval(
  '"t_institution_manager_institution_INSTITUTION_MANAGER_INSTITUTION_ID_seq"',
  COALESCE((SELECT MAX("INSTITUTION_MANAGER_INSTITUTION_ID") FROM "t_institution_manager_institution"), 0) + 1,
  false
);
