-- Migration: Make INSTITUTION_ID and MANAGER_ID nullable for pre-enrollments
-- This allows creating pre-enrollments without requiring institution/manager assignment
-- The institution and manager will be assigned during the enrollment phase

-- Make INSTITUTION_ID nullable
ALTER TABLE "t_professional_practices" 
ALTER COLUMN "INSTITUTION_ID" DROP NOT NULL;

-- Make MANAGER_ID nullable  
ALTER COLUMN "MANAGER_ID" DROP NOT NULL;

-- Add comment to document the change
COMMENT ON COLUMN "t_professional_practices"."INSTITUTION_ID" IS 'Can be NULL for pre-enrollments, assigned during enrollment';
COMMENT ON COLUMN "t_professional_practices"."MANAGER_ID" IS 'Can be NULL for pre-enrollments, assigned during enrollment';
