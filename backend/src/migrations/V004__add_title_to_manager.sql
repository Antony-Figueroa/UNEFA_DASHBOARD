-- V004__add_title_to_manager.sql
ALTER TABLE IF EXISTS "t_institution_manager" 
ADD COLUMN IF NOT EXISTS "TITLE" VARCHAR(100) DEFAULT NULL;
