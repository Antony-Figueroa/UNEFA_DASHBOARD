-- Migration: V005__add_lock_api_loaded_fields
-- Description: Adds config flag to lock identity fields loaded from SENIAT API
-- When TRUE, fields populated by SENIAT lookup become read-only

ALTER TABLE "t_academic_config" 
ADD COLUMN IF NOT EXISTS "LOCK_API_LOADED_FIELDS" BOOLEAN NOT NULL DEFAULT TRUE;
