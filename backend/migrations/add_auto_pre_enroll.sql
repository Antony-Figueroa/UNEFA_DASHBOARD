-- Add AUTO_PRE_ENROLL column to t_career table
-- When TRUE, culminating a practice auto-creates PRE_INSCRITO for next type in sequence

ALTER TABLE "t_career" ADD COLUMN IF NOT EXISTS "AUTO_PRE_ENROLL" BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN "t_career"."AUTO_PRE_ENROLL" IS 'When TRUE, culminating a practice auto-creates PRE_INSCRITO for next type in sequence';
