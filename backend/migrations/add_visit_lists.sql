-- Migration: Add VISIT_TYPE and VISIT_CASE lists for configurable visit dropdowns
-- Date: 2026-05-14

DO $$
DECLARE
    visit_type_list_id INTEGER;
    visit_case_list_id INTEGER;
BEGIN
    -- Create VISIT_TYPE list if not exists and get its ID
    INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS")
    VALUES (500, 'VISIT_TYPE', NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1)
    ON CONFLICT ("LIST_ID") DO NOTHING;

    SELECT "LIST_ID" INTO visit_type_list_id FROM "t_list" WHERE UPPER("NAME") = 'VISIT_TYPE' LIMIT 1;

    -- Create VISIT_CASE list if not exists and get its ID
    INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS")
    VALUES (501, 'VISIT_CASE', NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1)
    ON CONFLICT ("LIST_ID") DO NOTHING;

    SELECT "LIST_ID" INTO visit_case_list_id FROM "t_list" WHERE UPPER("NAME") = 'VISIT_CASE' LIMIT 1;

    -- Insert VISIT_TYPE values
    IF visit_type_list_id IS NOT NULL THEN
        DELETE FROM "t_value_list" WHERE "LIST_ID" = visit_type_list_id;
        INSERT INTO "t_value_list" ("NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS")
        VALUES
            ('Presencial', 'PRES', visit_type_list_id, NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1),
            ('Virtual', 'VIRT', visit_type_list_id, NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1),
            ('Telefónica', 'TEL', visit_type_list_id, NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1);
    END IF;

    -- Insert VISIT_CASE values
    IF visit_case_list_id IS NOT NULL THEN
        DELETE FROM "t_value_list" WHERE "LIST_ID" = visit_case_list_id;
        INSERT INTO "t_value_list" ("NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS")
        VALUES
            ('Visita Inicial', 'VI', visit_case_list_id, NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1),
            ('Seguimiento Regular', 'SR', visit_case_list_id, NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1),
            ('Revisión de Bitácoras', 'RB', visit_case_list_id, NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1),
            ('Evaluación Parcial', 'EP', visit_case_list_id, NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1),
            ('Seguimiento a Problemas', 'SP', visit_case_list_id, NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1),
            ('Cambio de Empresa', 'CE', visit_case_list_id, NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1),
            ('Cambio de Tutor', 'CT', visit_case_list_id, NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1),
            ('Suspensión', 'SUS', visit_case_list_id, NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1),
            ('Reanudación', 'REA', visit_case_list_id, NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1),
            ('Evaluación Final', 'EF', visit_case_list_id, NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1),
            ('Certificación', 'CERT', visit_case_list_id, NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1);
    END IF;
END $$;

-- Verify the insertion
SELECT
    l."NAME" as list_name,
    l."LIST_ID" as list_id,
    COUNT(v."VALUE_LIST_ID") as value_count
FROM "t_list" l
LEFT JOIN "t_value_list" v ON l."LIST_ID" = v."LIST_ID"
WHERE UPPER(l."NAME") IN ('VISIT_TYPE', 'VISIT_CASE')
GROUP BY l."NAME", l."LIST_ID"
ORDER BY l."NAME";