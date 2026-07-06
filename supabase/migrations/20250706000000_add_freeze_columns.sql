-- ============================================================
-- Migration: Add freeze columns to t_evaluation (UPPERCASE)
-- These columns were added manually in dev but never as a
-- formal migration. PostgREST is case-sensitive, so the
-- column names MUST match the backend convention (UPPERCASE).
--
-- Handles both cases:
-- 1. Columns don't exist yet → ADD COLUMN
-- 2. Columns exist as lowercase (frozen_at) → RENAME COLUMN
-- ============================================================

-- Step 1: Rename lowercase columns if they exist (local dev DBs)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 't_evaluation' AND column_name = 'frozen_at') THEN
    ALTER TABLE "public"."t_evaluation" RENAME COLUMN "frozen_at" TO "FROZEN_AT";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 't_evaluation' AND column_name = 'unfrozen_at') THEN
    ALTER TABLE "public"."t_evaluation" RENAME COLUMN "unfrozen_at" TO "UNFROZEN_AT";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 't_evaluation' AND column_name = 'unfreeze_reason') THEN
    ALTER TABLE "public"."t_evaluation" RENAME COLUMN "unfreeze_reason" TO "UNFREEZE_REASON";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 't_evaluation' AND column_name = 'unfreeze_authorized_by') THEN
    ALTER TABLE "public"."t_evaluation" RENAME COLUMN "unfreeze_authorized_by" TO "UNFREEZE_AUTHORIZED_BY";
  END IF;
END $$;

-- Step 2: Add columns if they don't exist at all (fresh installs)
ALTER TABLE "public"."t_evaluation"
  ADD COLUMN IF NOT EXISTS "FROZEN_AT" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "UNFROZEN_AT" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "UNFREEZE_REASON" text,
  ADD COLUMN IF NOT EXISTS "UNFREEZE_AUTHORIZED_BY" integer;
