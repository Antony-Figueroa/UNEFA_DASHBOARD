-- Migration: 017_create_practice_culmination
-- Description: Create t_practice_culmination table for practice completion,
-- approval workflow, and certificate generation.
--
-- This migration is idempotent: CREATE IF NOT EXISTS,
-- and DO blocks for constraints.

CREATE TABLE IF NOT EXISTS "t_practice_culmination" (
  "PRACTICE_ID" INTEGER NOT NULL,
  "STATUS" SMALLINT NOT NULL DEFAULT 0,
  "CERTIFICATE_NUMBER" VARCHAR(50),
  "CERTIFIED_AT" TIMESTAMP,
  "APPROVED_AT" TIMESTAMP DEFAULT NOW(),
  "APPROVED_BY" INTEGER,
  "CREATED_AT" TIMESTAMP DEFAULT NOW(),
  "UPDATED_AT" TIMESTAMP DEFAULT NOW()
);

-- Primary key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 't_practice_culmination_pkey'
  ) THEN
    ALTER TABLE "t_practice_culmination" ADD PRIMARY KEY ("PRACTICE_ID");
  END IF;
END $$;

-- Check constraint: STATUS (0=pending, 1=approved, 2=certified)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_culmination_status'
  ) THEN
    ALTER TABLE "t_practice_culmination" ADD CONSTRAINT "chk_culmination_status" CHECK ("STATUS" IN (0, 1, 2));
  END IF;
END $$;

-- Foreign key: PRACTICE_ID → t_professional_practices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_culmination_practice'
  ) THEN
    ALTER TABLE "t_practice_culmination"
      ADD CONSTRAINT "fk_culmination_practice"
      FOREIGN KEY ("PRACTICE_ID") REFERENCES "t_professional_practices" ("PROFESSIONAL_PRACTICE_ID") ON DELETE CASCADE;
  END IF;
END $$;

-- Foreign key: APPROVED_BY → t_user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_culmination_approved_by'
  ) THEN
    ALTER TABLE "t_practice_culmination"
      ADD CONSTRAINT "fk_culmination_approved_by"
      FOREIGN KEY ("APPROVED_BY") REFERENCES "t_user" ("USER_ID") ON DELETE SET NULL;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_culmination_status" ON "t_practice_culmination" ("STATUS");
CREATE INDEX IF NOT EXISTS "idx_culmination_certificate" ON "t_practice_culmination" ("CERTIFICATE_NUMBER");

-- Rollback:
-- DROP TABLE IF EXISTS "t_practice_culmination";
