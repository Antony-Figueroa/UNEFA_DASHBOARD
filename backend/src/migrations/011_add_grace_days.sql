-- Migration: 011_add_grace_days
-- Description: Add configurable grace period columns to t_internships_period
--
-- ENROLLMENT_GRACE_DAYS: days after START_DATE during which enrollment is allowed (default 21 = 3 weeks)
-- EVALUATION_GRACE_DAYS: days after END_DATE during which evaluation is allowed (default 10 = 10 days)

ALTER TABLE t_internships_period
  ADD COLUMN "ENROLLMENT_GRACE_DAYS" SMALLINT NOT NULL DEFAULT 21,
  ADD COLUMN "EVALUATION_GRACE_DAYS" SMALLINT NOT NULL DEFAULT 10;

-- Rollback:
-- ALTER TABLE t_internships_period
--   DROP COLUMN IF EXISTS "ENROLLMENT_GRACE_DAYS",
--   DROP COLUMN IF EXISTS "EVALUATION_GRACE_DAYS";
