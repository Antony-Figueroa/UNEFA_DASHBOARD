-- Agregar lista de estados de Venezuela habilitados
-- Por defecto solo Portuguesa está habilitado

-- Insertar la lista (si no existe)
INSERT INTO t_list (NAME, STATUS)
SELECT 'ESTADOS_VENEZUELA', 1
WHERE NOT EXISTS (SELECT 1 FROM t_list WHERE NAME = 'ESTADOS_VENEZUELA');

-- Obtener el ID de la lista
DO $$
DECLARE
    list_id INTEGER;
BEGIN
    SELECT LIST_ID INTO list_id FROM t_list WHERE NAME = 'ESTADOS_VENEZUELA' LIMIT 1;
    
    -- Insertar valores (solo Portuguesa por defecto)
    -- Primero limpiar valores existentes de esta lista
    DELETE FROM t_value_list WHERE LIST_ID = list_id;
    
    -- Insertar solo Portuguesa como habilitado
    INSERT INTO t_value_list (LIST_ID, NAME, ABBREVIATION, STATUS) VALUES
    (list_id, 'Portuguesa', 'Portuguesa', 1);
END $$;
