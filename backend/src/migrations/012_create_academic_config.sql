-- Migration: 012_create_academic_config
-- Description: Create t_academic_config table for global academic defaults
--
-- Stores configurable defaults for new academic periods:
-- - DEFAULT_ENROLLMENT_GRACE_DAYS: default grace days for enrollment (21)
-- - DEFAULT_EVALUATION_GRACE_DAYS: default grace days for evaluation (10)

CREATE TABLE IF NOT EXISTS "t_academic_config" (
  "CONFIG_ID" SMALLINT PRIMARY KEY DEFAULT 1,
  "DEFAULT_ENROLLMENT_GRACE_DAYS" SMALLINT NOT NULL DEFAULT 21,
  "DEFAULT_EVALUATION_GRACE_DAYS" SMALLINT NOT NULL DEFAULT 10,
  "UPDATED_AT" TIMESTAMP NOT NULL DEFAULT NOW(),
  "UPDATED_BY" INTEGER REFERENCES t_user(USER_ID)
);

-- Seed initial row
INSERT INTO "t_academic_config" ("CONFIG_ID", "DEFAULT_ENROLLMENT_GRACE_DAYS", "DEFAULT_EVALUATION_GRACE_DAYS", "UPDATED_AT")
VALUES (1, 21, 10, NOW())
ON CONFLICT ("CONFIG_ID") DO NOTHING;
