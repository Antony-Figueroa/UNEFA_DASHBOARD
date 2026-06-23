-- Migration: Remove EMPRESARIAL internship type, reassign to ÚNICA
-- EMPRESARIAL is INTERNSHIP_TYPE_ID = 4 in production (ÚNICA is ID = 1)
-- Keep ÚNICA as the generic/default type when both exist for the same career

-- Step 1: Delete career-internship-type links where EMPRESARIAL duplicates ÚNICA
DELETE FROM "t_career_internship_type" cit
WHERE cit."INTERNSHIP_TYPE_ID" = 4
  AND EXISTS (
    SELECT 1 FROM "t_career_internship_type" cit2
    WHERE cit2."CAREER_ID" = cit."CAREER_ID"
      AND cit2."INTERNSHIP_TYPE_ID" = 1
  );

COMMENT ON DELETE IS 'Removed EMPRESARIAL career links where ÚNICA already exists';

-- Step 2: Reassign professional practices from EMPRESARIAL to ÚNICA
UPDATE "t_professional_practices"
SET "INTERNSHIP_TYPE_ID" = 1
WHERE "INTERNSHIP_TYPE_ID" = 4;

COMMENT ON UPDATE IS 'Reassigned practices from EMPRESARIAL to ÚNICA';

-- Step 3: Update institution PRACTICE_TYPE text field from EMPRESARIAL to ÚNICA
UPDATE "t_institution"
SET "PRACTICE_TYPE" = 'ÚNICA'
WHERE "PRACTICE_TYPE" = 'EMPRESARIAL';

-- Step 4: Delete EMPRESARIAL type
DELETE FROM "t_internship_type"
WHERE "INTERNSHIP_TYPE_ID" = 4;
