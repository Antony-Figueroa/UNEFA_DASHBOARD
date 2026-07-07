-- Migration: 032_fix_committee_assignment_schema
-- Fix: t_committee_assignment was created by 025_sync_prod_schema with wrong columns.
-- Migration 027 used CREATE TABLE IF NOT EXISTS so it silently did nothing.
-- This migration aligns the table to the schema 027 intended.

-- 1. Drop old columns that don't belong
ALTER TABLE t_committee_assignment DROP COLUMN IF EXISTS "EVALUATION_ID";
ALTER TABLE t_committee_assignment DROP COLUMN IF EXISTS "USER_ID";
ALTER TABLE t_committee_assignment DROP COLUMN IF EXISTS "ROLE";
ALTER TABLE t_committee_assignment DROP COLUMN IF EXISTS "ASSIGNED_AT";

-- 2. Add missing columns
ALTER TABLE t_committee_assignment ADD COLUMN IF NOT EXISTS "COMITE_MEMBER_INDEX" INTEGER;
ALTER TABLE t_committee_assignment ADD COLUMN IF NOT EXISTS "EVALUATOR_NAME" TEXT;
ALTER TABLE t_committee_assignment ADD COLUMN IF NOT EXISTS "EVALUATOR_CI" TEXT;
ALTER TABLE t_committee_assignment ADD COLUMN IF NOT EXISTS "REGISTERED_BY" INTEGER REFERENCES t_user("USER_ID");
ALTER TABLE t_committee_assignment ADD COLUMN IF NOT EXISTS "CREATED_AT" TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE t_committee_assignment ADD COLUMN IF NOT EXISTS "UPDATED_AT" TIMESTAMPTZ DEFAULT NOW();

-- 3. Make required columns NOT NULL after adding them
ALTER TABLE t_committee_assignment ALTER COLUMN "COMITE_MEMBER_INDEX" SET NOT NULL;
ALTER TABLE t_committee_assignment ALTER COLUMN "EVALUATOR_NAME" SET NOT NULL;

-- 4. Add CHECK constraint for member index
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_comite_member_index_range') THEN
    ALTER TABLE t_committee_assignment
      ADD CONSTRAINT chk_comite_member_index_range
      CHECK ("COMITE_MEMBER_INDEX" IN (1, 2, 3));
  END IF;
END $$;

-- 5. Add UNIQUE constraint on (practice, member index)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 't_committee_assignment_PROFESSIONAL_PRACTICE_ID_COMITE_MEMB_key') THEN
    ALTER TABLE t_committee_assignment
      ADD CONSTRAINT "t_committee_assignment_PROFESSIONAL_PRACTICE_ID_COMITE_MEMB_key"
      UNIQUE ("PROFESSIONAL_PRACTICE_ID", "COMITE_MEMBER_INDEX");
  END IF;
END $$;

-- 6. Add comments
COMMENT ON TABLE t_committee_assignment IS 'Pre-asignación de miembros del comité evaluador por práctica';
COMMENT ON COLUMN t_committee_assignment."COMITE_MEMBER_INDEX" IS '1, 2 o 3 — identifica al miembro dentro del comité';
COMMENT ON COLUMN t_committee_assignment."EVALUATOR_NAME" IS 'Nombre completo del miembro del comité';
