-- Migration: 014_text_normalization
-- Description: Normalize existing text data to UPPERCASE for consistency.
-- Part of the text-normalization change (SDD).
-- All new data will be sanitized by the backend sanitizeText() utility.
-- This migration is idempotent — running it multiple times is safe.

BEGIN;

-- ============================================================
-- t_persons
-- ============================================================
UPDATE "t_persons" SET
  "first_name" = UPPER(TRIM("first_name")),
  "middle_name" = UPPER(TRIM("middle_name")),
  "last_name" = UPPER(TRIM("last_name")),
  "second_last_name" = UPPER(TRIM("second_last_name")),
  "address" = UPPER(TRIM("address")),
  "gender" = UPPER(TRIM("gender")),
  "marital_status" = UPPER(TRIM("marital_status"))
WHERE
  "first_name" IS DISTINCT FROM UPPER(TRIM("first_name")) OR
  "middle_name" IS DISTINCT FROM UPPER(TRIM("middle_name")) OR
  "last_name" IS DISTINCT FROM UPPER(TRIM("last_name")) OR
  "second_last_name" IS DISTINCT FROM UPPER(TRIM("second_last_name")) OR
  "address" IS DISTINCT FROM UPPER(TRIM("address")) OR
  "gender" IS DISTINCT FROM UPPER(TRIM("gender")) OR
  "marital_status" IS DISTINCT FROM UPPER(TRIM("marital_status"));

-- ============================================================
-- t_institution
-- ============================================================
UPDATE "t_institution" SET
  "INSTITUTION_NAME" = UPPER(TRIM("INSTITUTION_NAME")),
  "INSTITUTION_ADDRESS" = UPPER(TRIM("INSTITUTION_ADDRESS")),
  "INSTITUTION_CONTACT" = UPPER(TRIM("INSTITUTION_CONTACT")),
  "REGION" = UPPER(TRIM("REGION")),
  "NUCLEUS" = UPPER(TRIM("NUCLEUS")),
  "EXTENSION" = UPPER(TRIM("EXTENSION")),
  "INSTITUTION_TYPE" = UPPER(TRIM("INSTITUTION_TYPE")),
  "RIF" = UPPER(TRIM("RIF"))
WHERE
  "INSTITUTION_NAME" IS DISTINCT FROM UPPER(TRIM("INSTITUTION_NAME")) OR
  "INSTITUTION_ADDRESS" IS DISTINCT FROM UPPER(TRIM("INSTITUTION_ADDRESS")) OR
  "INSTITUTION_CONTACT" IS DISTINCT FROM UPPER(TRIM("INSTITUTION_CONTACT")) OR
  "REGION" IS DISTINCT FROM UPPER(TRIM("REGION")) OR
  "NUCLEUS" IS DISTINCT FROM UPPER(TRIM("NUCLEUS")) OR
  "EXTENSION" IS DISTINCT FROM UPPER(TRIM("EXTENSION")) OR
  "INSTITUTION_TYPE" IS DISTINCT FROM UPPER(TRIM("INSTITUTION_TYPE")) OR
  "RIF" IS DISTINCT FROM UPPER(TRIM("RIF"));

-- ============================================================
-- t_students
-- ============================================================
UPDATE "t_students" SET
  "STUDENT_TYPE" = UPPER(TRIM("STUDENT_TYPE")),
  "MILITARY_RANK" = UPPER(TRIM("MILITARY_RANK")),
  "EMPLOYMENT" = UPPER(TRIM("EMPLOYMENT"))
WHERE
  "STUDENT_TYPE" IS DISTINCT FROM UPPER(TRIM("STUDENT_TYPE")) OR
  "MILITARY_RANK" IS DISTINCT FROM UPPER(TRIM("MILITARY_RANK")) OR
  "EMPLOYMENT" IS DISTINCT FROM UPPER(TRIM("EMPLOYMENT"));

-- ============================================================
-- t_tutors
-- ============================================================
UPDATE "t_tutors" SET
  "PROFESSION" = UPPER(TRIM("PROFESSION")),
  "CONDITION" = UPPER(TRIM("CONDITION")),
  "DEDICATION" = UPPER(TRIM("DEDICATION")),
  "CATEGORY" = UPPER(TRIM("CATEGORY")),
  "TITULO" = UPPER(TRIM("TITULO"))
WHERE
  "PROFESSION" IS DISTINCT FROM UPPER(TRIM("PROFESSION")) OR
  "CONDITION" IS DISTINCT FROM UPPER(TRIM("CONDITION")) OR
  "DEDICATION" IS DISTINCT FROM UPPER(TRIM("DEDICATION")) OR
  "CATEGORY" IS DISTINCT FROM UPPER(TRIM("CATEGORY")) OR
  "TITULO" IS DISTINCT FROM UPPER(TRIM("TITULO"));

-- ============================================================
-- t_career
-- ============================================================
UPDATE "t_career" SET
  "CAREER_NAME" = UPPER(TRIM("CAREER_NAME")),
  "CAREER_CODE" = UPPER(TRIM("CAREER_CODE")),
  "CAREER_ABBREVIATION" = UPPER(TRIM("CAREER_ABBREVIATION")),
  "CAREER_TYPE" = UPPER(TRIM("CAREER_TYPE"))
WHERE
  "CAREER_NAME" IS DISTINCT FROM UPPER(TRIM("CAREER_NAME")) OR
  "CAREER_CODE" IS DISTINCT FROM UPPER(TRIM("CAREER_CODE")) OR
  "CAREER_ABBREVIATION" IS DISTINCT FROM UPPER(TRIM("CAREER_ABBREVIATION")) OR
  "CAREER_TYPE" IS DISTINCT FROM UPPER(TRIM("CAREER_TYPE"));

-- ============================================================
-- t_user
-- ============================================================
UPDATE "t_user" SET
  "NAME" = UPPER(TRIM("NAME")),
  "SECOND_NAME" = UPPER(TRIM("SECOND_NAME")),
  "SURNAME" = UPPER(TRIM("SURNAME")),
  "SECOND_SURNAME" = UPPER(TRIM("SECOND_SURNAME"))
WHERE
  "NAME" IS DISTINCT FROM UPPER(TRIM("NAME")) OR
  "SECOND_NAME" IS DISTINCT FROM UPPER(TRIM("SECOND_NAME")) OR
  "SURNAME" IS DISTINCT FROM UPPER(TRIM("SURNAME")) OR
  "SECOND_SURNAME" IS DISTINCT FROM UPPER(TRIM("SECOND_SURNAME"));

-- Note: EMAIL intentionally NOT normalized — emails preserve original casing

-- ============================================================
-- t_professional_practices
-- ============================================================
UPDATE "t_professional_practices" SET
  "REPORT_TITLE" = UPPER(TRIM("REPORT_TITLE")),
  "OBSERVATION" = UPPER(TRIM("OBSERVATION")),
  "ENROLLMENT" = UPPER(TRIM("ENROLLMENT")),
  "SEMESTER" = UPPER(TRIM("SEMESTER")),
  "SECTION" = UPPER(TRIM("SECTION")),
  "REGIME" = UPPER(TRIM("REGIME")),
  "TOUR" = UPPER(TRIM("TOUR"))
WHERE
  "REPORT_TITLE" IS DISTINCT FROM UPPER(TRIM("REPORT_TITLE")) OR
  "OBSERVATION" IS DISTINCT FROM UPPER(TRIM("OBSERVATION")) OR
  "ENROLLMENT" IS DISTINCT FROM UPPER(TRIM("ENROLLMENT")) OR
  "SEMESTER" IS DISTINCT FROM UPPER(TRIM("SEMESTER")) OR
  "SECTION" IS DISTINCT FROM UPPER(TRIM("SECTION")) OR
  "REGIME" IS DISTINCT FROM UPPER(TRIM("REGIME")) OR
  "TOUR" IS DISTINCT FROM UPPER(TRIM("TOUR"));

-- ============================================================
-- t_value_list
-- ============================================================
UPDATE "t_value_list" SET
  "NAME" = UPPER(TRIM("NAME")),
  "ABBREVIATION" = UPPER(TRIM("ABBREVIATION"))
WHERE
  "NAME" IS DISTINCT FROM UPPER(TRIM("NAME")) OR
  "ABBREVIATION" IS DISTINCT FROM UPPER(TRIM("ABBREVIATION"));

-- ============================================================
-- t_internship_type
-- ============================================================
UPDATE "t_internship_type" SET
  "NAME" = UPPER(TRIM("NAME"))
WHERE
  "NAME" IS DISTINCT FROM UPPER(TRIM("NAME"));

-- ============================================================
-- t_internships_period
-- ============================================================
UPDATE "t_internships_period" SET
  "DESCRIPTION" = UPPER(TRIM("DESCRIPTION"))
WHERE
  "DESCRIPTION" IS DISTINCT FROM UPPER(TRIM("DESCRIPTION"));

-- ============================================================
-- t_roles
-- ============================================================
UPDATE "t_roles" SET
  "NAME" = UPPER(TRIM("NAME"))
WHERE
  "NAME" IS DISTINCT FROM UPPER(TRIM("NAME"));

-- ============================================================
-- t_institution_manager
-- ============================================================
UPDATE "t_institution_manager" SET
  "NAME" = UPPER(TRIM("NAME")),
  "SECOND_NAME" = UPPER(TRIM("SECOND_NAME")),
  "SURNAME" = UPPER(TRIM("SURNAME")),
  "SECOND_SURNAME" = UPPER(TRIM("SECOND_SURNAME")),
  "TITLE" = UPPER(TRIM("TITLE"))
WHERE
  "NAME" IS DISTINCT FROM UPPER(TRIM("NAME")) OR
  "SECOND_NAME" IS DISTINCT FROM UPPER(TRIM("SECOND_NAME")) OR
  "SURNAME" IS DISTINCT FROM UPPER(TRIM("SURNAME")) OR
  "SECOND_SURNAME" IS DISTINCT FROM UPPER(TRIM("SECOND_SURNAME")) OR
  "TITLE" IS DISTINCT FROM UPPER(TRIM("TITLE"));

-- ============================================================
-- t_practice_visits
-- ============================================================
UPDATE "t_practice_visits" SET
  "VISIT_TYPE" = UPPER(TRIM("VISIT_TYPE")),
  "VISIT_CASE" = UPPER(TRIM("VISIT_CASE")),
  "ACTIVITIES_PERFORMED" = UPPER(TRIM("ACTIVITIES_PERFORMED")),
  "OBSERVATIONS" = UPPER(TRIM("OBSERVATIONS")),
  "RECOMMENDATIONS" = UPPER(TRIM("RECOMMENDATIONS"))
WHERE
  "VISIT_TYPE" IS DISTINCT FROM UPPER(TRIM("VISIT_TYPE")) OR
  "VISIT_CASE" IS DISTINCT FROM UPPER(TRIM("VISIT_CASE")) OR
  "ACTIVITIES_PERFORMED" IS DISTINCT FROM UPPER(TRIM("ACTIVITIES_PERFORMED")) OR
  "OBSERVATIONS" IS DISTINCT FROM UPPER(TRIM("OBSERVATIONS")) OR
  "RECOMMENDATIONS" IS DISTINCT FROM UPPER(TRIM("RECOMMENDATIONS"));

-- ============================================================
-- t_activity_logs (only type, NOT description — long text)
-- ============================================================
UPDATE "t_activity_logs" SET
  "ACTIVITY_TYPE" = UPPER(TRIM("ACTIVITY_TYPE"))
WHERE
  "ACTIVITY_TYPE" IS DISTINCT FROM UPPER(TRIM("ACTIVITY_TYPE"));

-- ============================================================
-- t_notifications
-- ============================================================
UPDATE "t_notifications" SET
  "TITLE" = UPPER(TRIM("TITLE")),
  "MESSAGE" = UPPER(TRIM("MESSAGE"))
WHERE
  "TITLE" IS DISTINCT FROM UPPER(TRIM("TITLE")) OR
  "MESSAGE" IS DISTINCT FROM UPPER(TRIM("MESSAGE"));

-- ============================================================
-- t_student_requests
-- ============================================================
UPDATE "t_student_requests" SET
  "SUBJECT" = UPPER(TRIM("SUBJECT"))
WHERE
  "SUBJECT" IS DISTINCT FROM UPPER(TRIM("SUBJECT"));
-- Note: DESCRIPTION and RESPONSE are long TEXT fields — intentionally NOT normalized

-- ============================================================
-- t_student_documents
-- ============================================================
UPDATE "t_student_documents" SET
  "TITLE" = UPPER(TRIM("TITLE")),
  "DOCUMENT_TYPE" = UPPER(TRIM("DOCUMENT_TYPE")),
  "STATUS" = UPPER(TRIM("STATUS"))
WHERE
  "TITLE" IS DISTINCT FROM UPPER(TRIM("TITLE")) OR
  "DOCUMENT_TYPE" IS DISTINCT FROM UPPER(TRIM("DOCUMENT_TYPE")) OR
  "STATUS" IS DISTINCT FROM UPPER(TRIM("STATUS"));
-- Note: DESCRIPTION and REJECTION_REASON are long TEXT — intentionally NOT normalized

-- ============================================================
-- t_activity_logs (activity_type — already covered above)
-- Note: ACTIVITY_DESCRIPTION, TASKS_COMPLETED, CHALLENGES, LEARNINGS
-- are long text fields and intentionally NOT normalized.
-- ============================================================

COMMIT;
