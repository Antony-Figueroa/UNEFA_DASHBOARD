-- Migration: Register t_evaluation audit columns (EVALUATOR_TYPE, EVALUATOR_NAME, EVALUATOR_CI, TOTAL_SCORE, OBSERVATIONS)
-- Uses dynamic TABLE_ID lookup via PHYSICAL_NAME — no hardcoded IDs
-- Idempotent — safe to re-run

DO $$
DECLARE
    v_table_id INTEGER;
BEGIN
    SELECT "TABLE_ID" INTO v_table_id FROM "t_tables" WHERE "PHYSICAL_NAME" = 't_evaluation';
    
    IF v_table_id IS NULL THEN
        RAISE EXCEPTION 't_evaluation not found in t_tables';
    END IF;

    INSERT INTO "t_columns" ("TABLE_ID", "COLUMN_NAME")
    SELECT v_table_id, c.column_name
    FROM (VALUES
        ('EVALUATOR_TYPE'),
        ('EVALUATOR_NAME'),
        ('EVALUATOR_CI'),
        ('TOTAL_SCORE'),
        ('OBSERVATIONS')
    ) AS c(column_name)
    WHERE NOT EXISTS (
        SELECT 1 FROM "t_columns" tc
        WHERE tc."TABLE_ID" = v_table_id AND tc."COLUMN_NAME" = c.column_name
    );
END $$;
