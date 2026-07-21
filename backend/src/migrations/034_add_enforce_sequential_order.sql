-- Migration 034: Add ENFORCE_SEQUENTIAL_ORDER toggle to t_academic_config
-- Default TRUE preserves all existing behavior on deploy (zero risk)

ALTER TABLE "t_academic_config"
  ADD COLUMN "ENFORCE_SEQUENTIAL_ORDER" BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN "t_academic_config"."ENFORCE_SEQUENTIAL_ORDER"
  IS 'When TRUE (default), sequential practice order is enforced across pre-enrollment, enrollment, evaluation, and culmination. When OFF, students can enroll in any uncompleted type freely.';

-- Seed existing row if present
UPDATE "t_academic_config"
  SET "ENFORCE_SEQUENTIAL_ORDER" = TRUE
  WHERE "CONFIG_ID" = 1;
