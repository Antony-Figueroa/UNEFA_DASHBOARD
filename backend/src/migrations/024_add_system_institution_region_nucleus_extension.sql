-- Add university-level region/nucleus/extension defaults
ALTER TABLE "t_system_institution" 
  ADD COLUMN IF NOT EXISTS "region" VARCHAR(255) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "nucleus" VARCHAR(255) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "extension" VARCHAR(255) NOT NULL DEFAULT '';
