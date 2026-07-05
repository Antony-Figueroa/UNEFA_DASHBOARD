-- Add missing columns to t_professional_practices_tutor (idempotent)
-- These columns already exist from the production schema migration.
-- Kept for safety: IF NOT EXISTS prevents duplicate column errors.

ALTER TABLE ONLY "public"."t_professional_practices_tutor"
    ADD COLUMN IF NOT EXISTS "ACTIVE" boolean DEFAULT true NOT NULL;

ALTER TABLE ONLY "public"."t_professional_practices_tutor"
    ADD COLUMN IF NOT EXISTS "CREATED_AT" timestamp with time zone DEFAULT now() NOT NULL;

ALTER TABLE ONLY "public"."t_professional_practices_tutor"
    ADD COLUMN IF NOT EXISTS "UPDATED_AT" timestamp with time zone;

-- Update existing rows to have ACTIVE=true
UPDATE "public"."t_professional_practices_tutor"
    SET "ACTIVE" = true WHERE "ACTIVE" IS NULL;

UPDATE "public"."t_professional_practices_tutor"
    SET "CREATED_AT" = now() WHERE "CREATED_AT" IS NULL;
