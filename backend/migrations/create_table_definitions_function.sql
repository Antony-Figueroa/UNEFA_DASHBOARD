-- ================================================================================
-- MIGRACIÓN: Función RPC para obtener definiciones de tablas
-- Permite respaldos completos con estructura (CREATE TABLE)
-- ================================================================================

-- Función para obtener CREATE TABLE de una tabla específica
CREATE OR REPLACE FUNCTION get_table_definition(table_name_param text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    definition text := '';
    col_record record;
    constraint_record record;
    first_col boolean := true;
BEGIN
    -- Obtener columnas
    definition := 'CREATE TABLE IF NOT EXISTS "' || table_name_param || '" (' || E'\n';
    
    FOR col_record IN 
        SELECT 
            column_name,
            data_type,
            character_maximum_length,
            numeric_precision,
            numeric_scale,
            is_nullable,
            column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' 
          AND table_name = table_name_param
        ORDER BY ordinal_position
    LOOP
        IF NOT first_col THEN
            definition := definition || ',' || E'\n';
        END IF;
        first_col := false;
        
        definition := definition || '  "' || col_record.column_name || '" ';
        
        -- Tipo de dato
        IF col_record.character_maximum_length IS NOT NULL THEN
            definition := definition || col_record.data_type || '(' || col_record.character_maximum_length || ')';
        ELSIF col_record.numeric_precision IS NOT NULL AND col_record.numeric_scale IS NOT NULL THEN
            definition := definition || col_record.data_type || '(' || col_record.numeric_precision || ',' || col_record.numeric_scale || ')';
        ELSIF col_record.numeric_precision IS NOT NULL THEN
            definition := definition || col_record.data_type || '(' || col_record.numeric_precision || ')';
        ELSE
            definition := definition || col_record.data_type;
        END IF;
        
        -- NULL/NOT NULL
        IF col_record.is_nullable = 'NO' THEN
            definition := definition || ' NOT NULL';
        END IF;
        
        -- DEFAULT
        IF col_record.column_default IS NOT NULL THEN
            definition := definition || ' DEFAULT ' || col_record.column_default;
        END IF;
    END LOOP;
    
    -- Primary Key
    SELECT string_agg(col.column_name, '", "' ORDER BY col.ordinal_position)
    INTO constraint_record
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage col 
        ON col.constraint_name = tc.constraint_name
        AND col.table_schema = tc.table_schema
    WHERE tc.table_name = table_name_param
      AND tc.constraint_type = 'PRIMARY KEY'
      AND tc.table_schema = 'public';
    
    IF constraint_record IS NOT NULL THEN
        definition := definition || ',' || E'\n' || '  PRIMARY KEY ("' || constraint_record || '")';
    END IF;
    
    definition := definition || E'\n' || ');';
    
    RETURN definition;
END;
$$;

-- Función para obtener todas las definiciones de tablas
CREATE OR REPLACE FUNCTION get_all_table_definitions()
RETURNS TABLE(table_name text, definition text, has_data boolean)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::text,
        get_table_definition(t.table_name)::text,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t.table_name LIMIT 1) 
             THEN true 
             ELSE false 
        END
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      AND t.table_name NOT LIKE 'pg_%'
      AND t.table_name NOT LIKE 'sql_%'
      AND t.table_name != 't_backups'
    ORDER BY t.table_name;
END;
$$;

-- Otorgar permisos
GRANT EXECUTE ON FUNCTION get_table_definition(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_definition(text) TO service_role;
GRANT EXECUTE ON FUNCTION get_all_table_definitions() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_table_definitions() TO service_role;

-- Comentarios
COMMENT ON FUNCTION get_table_definition(text) IS 'Obtiene la definición CREATE TABLE de una tabla específica';
COMMENT ON FUNCTION get_all_table_definitions() IS 'Obtiene todas las definiciones de tablas del esquema public';
