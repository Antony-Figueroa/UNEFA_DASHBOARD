-- Migration: 018_unique_person_id
-- Description: Add UNIQUE constraint on person_id across all person-linked tables.
-- Prevents duplicate records for the same person (e.g. from rapid double-clicks).
--
-- Cleanup: removes duplicate t_institution_manager entries (no child tables affected).
-- For t_students and t_user: only adds the constraint — existing duplicates must
-- be resolved manually via DB-postgres.sql cleanup queries if they exist.

-- ============================================================
-- 1. t_institution_manager (cleanup safe — no child table deps)
-- ============================================================
DELETE FROM "t_institution_manager" m1
USING "t_institution_manager" m2
WHERE m1.person_id = m2.person_id
  AND m1."MANAGER_ID" > m2."MANAGER_ID"
  AND m1.person_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_institution_manager_person_id'
  ) THEN
    ALTER TABLE "t_institution_manager"
      ADD CONSTRAINT "unique_institution_manager_person_id"
      UNIQUE ("person_id");
  END IF;
END $$;

-- ============================================================
-- 2. t_students
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_students_person_id'
  ) THEN
    -- Try to add constraint — will fail if duplicates exist, but that's OK
    -- (run manual cleanup first)
    BEGIN
      ALTER TABLE "t_students"
        ADD CONSTRAINT "unique_students_person_id"
        UNIQUE ("person_id");
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not add unique_students_person_id — check for duplicate person_id values in t_students';
    END;
  END IF;
END $$;

-- ============================================================
-- 3. t_user (already unique by USER_CI, but belt-and-suspenders)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_person_id'
  ) THEN
    BEGIN
      ALTER TABLE "t_user"
        ADD CONSTRAINT "unique_user_person_id"
        UNIQUE ("person_id");
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not add unique_user_person_id — check for duplicate person_id values in t_user';
    END;
  END IF;
END $$;
