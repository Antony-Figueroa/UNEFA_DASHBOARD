-- Add HOURS_REQUIRED column if not exists (already present in Supabase)
ALTER TABLE t_internship_type 
ADD COLUMN IF NOT EXISTS "HOURS_REQUIRED" INTEGER DEFAULT 360;

UPDATE t_internship_type SET "HOURS_REQUIRED" = 360 WHERE "HOURS_REQUIRED" IS NULL;
