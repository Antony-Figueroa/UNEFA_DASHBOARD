-- Increase column sizes to accommodate actual data
ALTER TABLE "t_institution_manager" 
  ALTER COLUMN "MANAGER_CI" TYPE VARCHAR(20),
  ALTER COLUMN "CONTACT_PHONE" TYPE VARCHAR(20);

-- Make INSTITUTION_ID nullable (temporary during creation)
ALTER TABLE "t_institution_manager" 
  ALTER COLUMN "INSTITUTION_ID" DROP NOT NULL;

-- Drop existing foreign key constraint if it exists
ALTER TABLE "t_institution_manager" 
  DROP CONSTRAINT IF EXISTS "t_institution_manager_INSTITUTION_ID_fkey";

-- Recreate foreign key allowing NULLs
ALTER TABLE "t_institution_manager"
  ADD CONSTRAINT "t_institution_manager_INSTITUTION_ID_fkey"
  FOREIGN KEY ("INSTITUTION_ID") 
  REFERENCES "t_institution"("INSTITUTION_ID")
  ON DELETE SET NULL;

-- Create the pivot table for many-to-many relationship
CREATE TABLE IF NOT EXISTS "t_institution_manager_institution" (
  "MANAGER_ID" INTEGER NOT NULL REFERENCES "t_institution_manager"("MANAGER_ID"),
  "INSTITUTION_ID" INTEGER NOT NULL REFERENCES "t_institution"("INSTITUTION_ID"),
  "cargo" VARCHAR(100),
  PRIMARY KEY ("MANAGER_ID", "INSTITUTION_ID")
);

-- Update existing records to populate the pivot table
-- (This assumes current INSTITUTION_ID values should be moved to pivot)
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN 
    SELECT "MANAGER_ID", "INSTITUTION_ID" 
    FROM "t_institution_manager" 
    WHERE "INSTITUTION_ID" IS NOT NULL
  LOOP
    INSERT INTO "t_institution_manager_institution" ("MANAGER_ID", "INSTITUTION_ID", "cargo")
    VALUES (rec."MANAGER_ID", rec."INSTITUTION_ID", '')
    ON CONFLICT ("MANAGER_ID", "INSTITUTION_ID") DO NOTHING;
  END LOOP;
END $$;

-- Clear INSTITUTION_ID in main table (since we moved to pivot)
UPDATE "t_institution_manager" 
SET "INSTITUTION_ID" = NULL;
