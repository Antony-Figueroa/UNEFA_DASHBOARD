-- Add missing columns to t_professional_practices_tutor
-- The controller code references ACTIVE, CREATED_AT and UPDATED_AT but they
-- were missing from the original table definition, causing queries to fail
-- with "column does not exist" errors.

ALTER TABLE ONLY "public"."t_professional_practices_tutor"
    ADD COLUMN "ACTIVE" boolean DEFAULT true NOT NULL;

ALTER TABLE ONLY "public"."t_professional_practices_tutor"
    ADD COLUMN "CREATED_AT" timestamp with time zone DEFAULT now() NOT NULL;

ALTER TABLE ONLY "public"."t_professional_practices_tutor"
    ADD COLUMN "UPDATED_AT" timestamp with time zone;

-- Update existing rows to have ACTIVE=true
UPDATE "public"."t_professional_practices_tutor"
    SET "ACTIVE" = true WHERE "ACTIVE" IS NULL;

UPDATE "public"."t_professional_practices_tutor"
    SET "CREATED_AT" = now() WHERE "CREATED_AT" IS NULL;
