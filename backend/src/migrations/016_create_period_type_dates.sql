-- Migration: 016_create_period_type_dates
-- Description: Create t_period_type_dates for per-type date overrides in academic periods.
-- Supports FEATURE_PERIOD_TYPE_DATES feature flag.
--
-- This migration is idempotent: CREATE IF NOT EXISTS, ALTER ADD IF NOT EXISTS,
-- and ON CONFLICT DO NOTHING for constraints.

CREATE TABLE IF NOT EXISTS "t_period_type_dates" (
  "ID" SERIAL NOT NULL,
  "PERIOD_ID" INTEGER NOT NULL,
  "INTERNSHIP_TYPE_ID" INTEGER NOT NULL,
  "START_DATE" DATE,
  "END_DATE" DATE,
  "CREATION_DATE" TIMESTAMP DEFAULT NOW(),
  "MODIF_USER_ID" INTEGER,
  "MODIF_USER_DATE" TIMESTAMP,
  UNIQUE ("PERIOD_ID", "INTERNSHIP_TYPE_ID")
);

-- Primary key (idempotent via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 't_period_type_dates_pkey'
  ) THEN
    ALTER TABLE "t_period_type_dates" ADD PRIMARY KEY ("ID");
  END IF;
END $$;

-- Foreign key: PERIOD_ID → t_internships_period
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_ptd_period'
  ) THEN
    ALTER TABLE "t_period_type_dates"
      ADD CONSTRAINT "fk_ptd_period"
      FOREIGN KEY ("PERIOD_ID") REFERENCES "t_internships_period" ("PERIOD_ID");
  END IF;
END $$;

-- Foreign key: INTERNSHIP_TYPE_ID → t_internship_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_ptd_internship_type'
  ) THEN
    ALTER TABLE "t_period_type_dates"
      ADD CONSTRAINT "fk_ptd_internship_type"
      FOREIGN KEY ("INTERNSHIP_TYPE_ID") REFERENCES "t_internship_type" ("INTERNSHIP_TYPE_ID");
  END IF;
END $$;

-- Rollback:
-- DROP TABLE IF EXISTS "t_period_type_dates";
