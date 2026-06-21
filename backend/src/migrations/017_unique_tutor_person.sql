-- Migration: 017_unique_tutor_person
-- Description: Add UNIQUE constraint on person_id in t_tutors.
-- Prevents duplicate tutor records for the same person (e.g. from rapid double-clicks).
-- Removes existing duplicates first (keeps oldest tutor per person).
-- Idempotent: skips if constraint already exists.

-- Clean up t_tutor_career entries for duplicate tutors
DELETE FROM "t_tutor_career"
WHERE "TUTOR_ID" IN (
  SELECT t1."TUTOR_ID"
  FROM "t_tutors" t1
  INNER JOIN "t_tutors" t2
    ON t1.person_id = t2.person_id
    AND t1."TUTOR_ID" > t2."TUTOR_ID"
);

-- Delete duplicate tutors keeping the oldest (lowest TUTOR_ID)
DELETE FROM "t_tutors" t1
USING "t_tutors" t2
WHERE t1.person_id = t2.person_id
  AND t1."TUTOR_ID" > t2."TUTOR_ID";

-- Add the unique constraint (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_tutor_person_id'
  ) THEN
    ALTER TABLE "t_tutors"
      ADD CONSTRAINT "unique_tutor_person_id"
      UNIQUE ("person_id");
  END IF;
END $$;
