-- Migration: Register t_evaluation_detail and t_committee_assignment for auditing
-- Idempotent — safe to re-run

DO $$
DECLARE
    v_detail_id INTEGER;
    v_committee_id INTEGER;
BEGIN
    -- Register t_evaluation_detail table
    INSERT INTO "t_tables" ("NAME", "DESCRIPTION", "PHYSICAL_NAME", "LOG", "STATUS")
    SELECT 'Detalle de Evaluación', 'Detalle de evaluaciones de prácticas profesionales', 't_evaluation_detail', 1, 1
    WHERE NOT EXISTS (
        SELECT 1 FROM "t_tables" WHERE "PHYSICAL_NAME" = 't_evaluation_detail'
    );

    -- Register t_evaluation_detail columns
    SELECT "TABLE_ID" INTO v_detail_id FROM "t_tables" WHERE "PHYSICAL_NAME" = 't_evaluation_detail';
    
    INSERT INTO "t_columns" ("TABLE_ID", "COLUMN_NAME")
    SELECT v_detail_id, c.column_name
    FROM (VALUES
        ('EVALUATION_ID'),
        ('CRITERIA_ID'),
        ('ITEM_NUMBER'),
        ('SCORE'),
        ('STATUS')
    ) AS c(column_name)
    WHERE NOT EXISTS (
        SELECT 1 FROM "t_columns" tc
        WHERE tc."TABLE_ID" = v_detail_id AND tc."COLUMN_NAME" = c.column_name
    );

    -- Register t_committee_assignment table
    INSERT INTO "t_tables" ("NAME", "DESCRIPTION", "PHYSICAL_NAME", "LOG", "STATUS")
    SELECT 'Asignación de Comité', 'Asignación de miembros del comité evaluador', 't_committee_assignment', 1, 1
    WHERE NOT EXISTS (
        SELECT 1 FROM "t_tables" WHERE "PHYSICAL_NAME" = 't_committee_assignment'
    );

    -- Register t_committee_assignment columns
    SELECT "TABLE_ID" INTO v_committee_id FROM "t_tables" WHERE "PHYSICAL_NAME" = 't_committee_assignment';
    
    INSERT INTO "t_columns" ("TABLE_ID", "COLUMN_NAME")
    SELECT v_committee_id, c.column_name
    FROM (VALUES
        ('PROFESSIONAL_PRACTICE_ID'),
        ('COMITE_MEMBER_INDEX'),
        ('EVALUATOR_NAME'),
        ('EVALUATOR_CI')
    ) AS c(column_name)
    WHERE NOT EXISTS (
        SELECT 1 FROM "t_columns" tc
        WHERE tc."TABLE_ID" = v_committee_id AND tc."COLUMN_NAME" = c.column_name
    );
END $$;
