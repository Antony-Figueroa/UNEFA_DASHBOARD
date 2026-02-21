-- ================================================================================
-- AUDIT COLUMNS - Completar columnas para auditoría
-- Este script debe ejecutarse después de optimize_database.sql
-- ================================================================================

-- Poblar t_columns con las columnas críticas de cada tabla

DO $$
DECLARE
    rec_table_id INT;
BEGIN
    -- t_students
    SELECT "TABLE_ID" INTO rec_table_id FROM "t_tables" WHERE "PHYSICAL_NAME" = 't_students';
    IF rec_table_id IS NOT NULL THEN
        INSERT INTO "t_columns" ("TABLE_ID", "COLUMN_NAME", "STATUS") VALUES
            (rec_table_id, 'STUDENT_ID', 1),
            (rec_table_id, 'USER_ID', 1),
            (rec_table_id, 'CAREER_ID', 1),
            (rec_table_id, 'CI', 1),
            (rec_table_id, 'NAME', 1),
            (rec_table_id, 'SURNAME', 1),
            (rec_table_id, 'EMAIL', 1),
            (rec_table_id, 'PHONE', 1),
            (rec_table_id, 'STATUS', 1)
        ON CONFLICT DO NOTHING;
    END IF;

    -- t_tutors
    SELECT "TABLE_ID" INTO rec_table_id FROM "t_tables" WHERE "PHYSICAL_NAME" = 't_tutors';
    IF rec_table_id IS NOT NULL THEN
        INSERT INTO "t_columns" ("TABLE_ID", "COLUMN_NAME", "STATUS") VALUES
            (rec_table_id, 'TUTOR_ID', 1),
            (rec_table_id, 'USER_ID', 1),
            (rec_table_id, 'CI', 1),
            (rec_table_id, 'NAME', 1),
            (rec_table_id, 'SURNAME', 1),
            (rec_table_id, 'EMAIL', 1),
            (rec_table_id, 'PHONE', 1),
            (rec_table_id, 'STATUS', 1)
        ON CONFLICT DO NOTHING;
    END IF;

    -- t_institution
    SELECT "TABLE_ID" INTO rec_table_id FROM "t_tables" WHERE "PHYSICAL_NAME" = 't_institution';
    IF rec_table_id IS NOT NULL THEN
        INSERT INTO "t_columns" ("TABLE_ID", "COLUMN_NAME", "STATUS") VALUES
            (rec_table_id, 'INSTITUTION_ID', 1),
            (rec_table_id, 'NAME', 1),
            (rec_table_id, 'RIF', 1),
            (rec_table_id, 'EMAIL', 1),
            (rec_table_id, 'PHONE', 1),
            (rec_table_id, 'ADDRESS', 1),
            (rec_table_id, 'STATUS', 1)
        ON CONFLICT DO NOTHING;
    END IF;

    -- t_career
    SELECT "TABLE_ID" INTO rec_table_id FROM "t_tables" WHERE "PHYSICAL_NAME" = 't_career';
    IF rec_table_id IS NOT NULL THEN
        INSERT INTO "t_columns" ("TABLE_ID", "COLUMN_NAME", "STATUS") VALUES
            (rec_table_id, 'CAREER_ID', 1),
            (rec_table_id, 'CAREER_NAME', 1),
            (rec_table_id, 'CAREER_CODE', 1),
            (rec_table_id, 'CAREER_ABBREVIATION', 1),
            (rec_table_id, 'CAREER_TYPE', 1),
            (rec_table_id, 'MINIMUM_GRADE', 1),
            (rec_table_id, 'STATUS', 1)
        ON CONFLICT DO NOTHING;
    END IF;

    -- t_internships_period
    SELECT "TABLE_ID" INTO rec_table_id FROM "t_tables" WHERE "PHYSICAL_NAME" = 't_internships_period';
    IF rec_table_id IS NOT NULL THEN
        INSERT INTO "t_columns" ("TABLE_ID", "COLUMN_NAME", "STATUS") VALUES
            (rec_table_id, 'PERIOD_ID', 1),
            (rec_table_id, 'DESCRIPTION', 1),
            (rec_table_id, 'START_DATE', 1),
            (rec_table_id, 'END_DATE', 1),
            (rec_table_id, 'PERIOD_STATUS', 1),
            (rec_table_id, 'STATUS', 1)
        ON CONFLICT DO NOTHING;
    END IF;

    -- t_professional_practices
    SELECT "TABLE_ID" INTO rec_table_id FROM "t_tables" WHERE "PHYSICAL_NAME" = 't_professional_practices';
    IF rec_table_id IS NOT NULL THEN
        INSERT INTO "t_columns" ("TABLE_ID", "COLUMN_NAME", "STATUS") VALUES
            (rec_table_id, 'PRACTICE_ID', 1),
            (rec_table_id, 'STUDENT_ID', 1),
            (rec_table_id, 'TUTOR_ID', 1),
            (rec_table_id, 'INSTITUTION_ID', 1),
            (rec_table_id, 'PERIOD_ID', 1),
            (rec_table_id, 'STATUS', 1)
        ON CONFLICT DO NOTHING;
    END IF;

    -- t_evaluation
    SELECT "TABLE_ID" INTO rec_table_id FROM "t_tables" WHERE "PHYSICAL_NAME" = 't_evaluation';
    IF rec_table_id IS NOT NULL THEN
        INSERT INTO "t_columns" ("TABLE_ID", "COLUMN_NAME", "STATUS") VALUES
            (rec_table_id, 'EVALUATION_ID', 1),
            (rec_table_id, 'PRACTICE_ID', 1),
            (rec_table_id, 'EVALUATOR_ID', 1),
            (rec_table_id, 'SCORE', 1),
            (rec_table_id, 'STATUS', 1)
        ON CONFLICT DO NOTHING;
    END IF;

    -- t_roles
    SELECT "TABLE_ID" INTO rec_table_id FROM "t_tables" WHERE "PHYSICAL_NAME" = 't_roles';
    IF rec_table_id IS NOT NULL THEN
        INSERT INTO "t_columns" ("TABLE_ID", "COLUMN_NAME", "STATUS") VALUES
            (rec_table_id, 'ID_ROLS', 1),
            (rec_table_id, 'NAME', 1),
            (rec_table_id, 'DESCRIPTION', 1),
            (rec_table_id, 'STATUS', 1)
        ON CONFLICT DO NOTHING;
    END IF;

    -- t_permissions
    SELECT "TABLE_ID" INTO rec_table_id FROM "t_tables" WHERE "PHYSICAL_NAME" = 't_permissions';
    IF rec_table_id IS NOT NULL THEN
        INSERT INTO "t_columns" ("TABLE_ID", "COLUMN_NAME", "STATUS") VALUES
            (rec_table_id, 'PERMISSIONS_ID', 1),
            (rec_table_id, 'NAME', 1),
            (rec_table_id, 'DESCRIPTION', 1),
            (rec_table_id, 'STATUS', 1)
        ON CONFLICT DO NOTHING;
    END IF;

END $$;

-- Verificar columnas creadas
SELECT t."NAME" as tabla, COUNT(c."COLUMN_ID") as columnas
FROM "t_tables" t
LEFT JOIN "t_columns" c ON t."TABLE_ID" = c."TABLE_ID"
WHERE t."LOG" = 1
GROUP BY t."NAME", t."TABLE_ID"
ORDER BY t."NAME";
