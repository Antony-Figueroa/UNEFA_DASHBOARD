-- Migration 002: Migrate person data from specialized tables to t_persons
-- Priority hierarchy: User > Student > Tutor > Institution Manager
-- Normalizes GENDER and handles CI conflicts
-- Note: t_persons uses lowercase columns. Existing tables use UPPERCASE (quoted).

-- 1. Create merge audit log table
CREATE TABLE IF NOT EXISTS t_person_merge_log (
    log_id         SERIAL PRIMARY KEY,
    ci             VARCHAR(10) NOT NULL,
    source_table   VARCHAR(50) NOT NULL,
    source_id      INTEGER NOT NULL,
    field_name     VARCHAR(50) NOT NULL,
    value_used     TEXT,
    value_over     TEXT,
    overridden_from VARCHAR(50),
    severity       VARCHAR(10) DEFAULT 'INFO',
    created_at     TIMESTAMP DEFAULT NOW()
);

-- 2. Insert merged person data using priority hierarchy
WITH all_cis AS (
    SELECT DISTINCT s."STUDENTS_CI" AS ci FROM "t_students" s WHERE s."STUDENTS_CI" IS NOT NULL
    UNION
    SELECT DISTINCT t."TUTOR_CI" FROM "t_tutors" t WHERE t."TUTOR_CI" IS NOT NULL
    UNION
    SELECT DISTINCT u."USER_CI" FROM "t_user" u WHERE u."USER_CI" IS NOT NULL
    UNION
    SELECT DISTINCT m."MANAGER_CI" FROM "t_institution_manager" m WHERE m."MANAGER_CI" IS NOT NULL
),
user_data AS (
    SELECT u."USER_CI" AS ci, u."NAME" AS first_name, u."SECOND_NAME" AS middle_name,
           u."SURNAME" AS last_name, u."SECOND_SURNAME" AS second_last_name,
           u."EMAIL" AS email, u."PHONE_NUMBER" AS phone, NULL::VARCHAR AS gender,
           NULL::DATE AS birthdate, NULL::VARCHAR AS address, NULL::VARCHAR AS marital_status,
           u."STATUS"::SMALLINT AS status, 't_user' AS source_table, u."USER_ID" AS source_id, 1 AS priority
    FROM "t_user" u
),
student_data AS (
    SELECT s."STUDENTS_CI", s."NAME", s."SECOND_NAME", s."SURNAME", s."SECOND_SURNAME",
           s."EMAIL", s."CONTACT_PHONE",
           CASE WHEN TRIM(s."GENDER") IN ('M', 'MASCULINO') THEN 'MASCULINO'
                WHEN TRIM(s."GENDER") IN ('F', 'FEMENINO') THEN 'FEMENINO'
                ELSE TRIM(s."GENDER") END,
           s."BIRTHDATE"::DATE, s."ADDRESS", s."MARITAL_STATUS",
           s."STATUS"::SMALLINT, 't_students', s."STUDENTS_ID", 2
    FROM "t_students" s
),
tutor_data AS (
    SELECT t."TUTOR_CI", t."NAME", t."SECOND_NAME", t."SURNAME", t."SECOND_SURNAME",
           t."EMAIL", t."CONTACT_PHONE",
           CASE WHEN TRIM(t."GENDER") IN ('M', 'MASCULINO') THEN 'MASCULINO'
                WHEN TRIM(t."GENDER") IN ('F', 'FEMENINO') THEN 'FEMENINO'
                ELSE TRIM(t."GENDER") END,
           NULL::DATE, NULL::VARCHAR, NULL::VARCHAR,
           t."STATUS"::SMALLINT, 't_tutors', t."TUTOR_ID", 3
    FROM "t_tutors" t
),
manager_data AS (
    SELECT m."MANAGER_CI", m."NAME", m."SECOND_NAME", m."SURNAME", m."SECOND_SURNAME",
           m."EMAIL", m."CONTACT_PHONE",
           NULL::VARCHAR, NULL::DATE, NULL::VARCHAR, NULL::VARCHAR,
           m."STATUS"::SMALLINT, 't_institution_manager', m."MANAGER_ID", 4
    FROM "t_institution_manager" m
),
all_sources AS (
    SELECT * FROM user_data UNION ALL SELECT * FROM student_data
    UNION ALL SELECT * FROM tutor_data UNION ALL SELECT * FROM manager_data
),
ranked_data AS (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY ci ORDER BY priority ASC) AS rn
    FROM all_sources
),
merged AS (
    SELECT DISTINCT ON (ci) ci,
        FIRST_VALUE(first_name) OVER w AS first_name,
        FIRST_VALUE(middle_name) OVER w AS middle_name,
        FIRST_VALUE(last_name) OVER w AS last_name,
        FIRST_VALUE(second_last_name) OVER w AS second_last_name,
        FIRST_VALUE(email) OVER w AS email,
        FIRST_VALUE(phone) OVER w AS phone,
        FIRST_VALUE(gender) OVER w AS gender,
        FIRST_VALUE(birthdate) OVER w AS birthdate,
        FIRST_VALUE(address) OVER w AS address,
        FIRST_VALUE(marital_status) OVER w AS marital_status,
        FIRST_VALUE(status) OVER w AS status
    FROM ranked_data WHERE rn = 1
    WINDOW w AS (PARTITION BY ci ORDER BY priority ASC)
)
INSERT INTO t_persons (ci, first_name, middle_name, last_name, second_last_name, email, phone, gender, birthdate, address, marital_status, status)
SELECT ci, first_name, middle_name, last_name, second_last_name, email, phone, gender, birthdate, address, marital_status, status
FROM merged;

-- 3. Log CI conflicts
INSERT INTO t_person_merge_log (ci, source_table, source_id, field_name, value_used, value_over, overridden_from, severity)
SELECT 'V-15678901', 't_tutors', 0, 'FIRST_NAME',
    (SELECT "NAME" FROM "t_tutors" WHERE "TUTOR_CI" = 'V-15678901'),
    (SELECT "NAME" FROM "t_institution_manager" WHERE "MANAGER_CI" = 'V-15678901'),
    't_institution_manager', 'WARNING'
WHERE EXISTS (SELECT 1 FROM "t_tutors" WHERE "TUTOR_CI" = 'V-15678901')
  AND EXISTS (SELECT 1 FROM "t_institution_manager" WHERE "MANAGER_CI" = 'V-15678901')
  AND (SELECT "NAME" FROM "t_tutors" WHERE "TUTOR_CI" = 'V-15678901') != (SELECT "NAME" FROM "t_institution_manager" WHERE "MANAGER_CI" = 'V-15678901');

-- 4. Create mapping table for migration 003
CREATE TABLE IF NOT EXISTS _migration_person_id_map (
    source_table VARCHAR(50), source_id INTEGER, person_id INTEGER
);
TRUNCATE _migration_person_id_map;

INSERT INTO _migration_person_id_map (source_table, source_id, person_id)
SELECT 't_students', s."STUDENTS_ID", p.person_id FROM "t_students" s JOIN t_persons p ON p.ci = s."STUDENTS_CI";
INSERT INTO _migration_person_id_map (source_table, source_id, person_id)
SELECT 't_tutors', t."TUTOR_ID", p.person_id FROM "t_tutors" t JOIN t_persons p ON p.ci = t."TUTOR_CI";
INSERT INTO _migration_person_id_map (source_table, source_id, person_id)
SELECT 't_user', u."USER_ID", p.person_id FROM "t_user" u JOIN t_persons p ON p.ci = u."USER_CI";
INSERT INTO _migration_person_id_map (source_table, source_id, person_id)
SELECT 't_institution_manager', m."MANAGER_ID", p.person_id FROM "t_institution_manager" m JOIN t_persons p ON p.ci = m."MANAGER_CI";
