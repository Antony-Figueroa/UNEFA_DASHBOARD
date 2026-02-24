-- Agregar lista de Títulos Académicos

-- Insertar la lista (si no existe)
INSERT INTO t_list ("NAME", "STATUS", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE")
SELECT 'Título', 1, NOW(), 1, NOW(), 1, NOW(), 1, NOW()
WHERE NOT EXISTS (SELECT 1 FROM t_list WHERE "NAME" = 'Título');

-- Obtener el ID de la lista e insertar valores
DO $$
DECLARE
    list_id INTEGER;
BEGIN
    SELECT "LIST_ID" INTO list_id FROM t_list WHERE "NAME" = 'Título' LIMIT 1;
    
    -- Limpiar valores existentes
    DELETE FROM t_value_list WHERE "LIST_ID" = list_id;
    
    -- Insertar valores por defecto con todas las columnas de auditoría
    INSERT INTO t_value_list ("LIST_ID", "NAME", "ABBREVIATION", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES
    (list_id, 'PREGRADO', 'PRE', NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1),
    (list_id, 'ESPECIALIZACIÓN', 'ESP', NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1),
    (list_id, 'MAESTRÍA', 'MAE', NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1),
    (list_id, 'DOCTORADO', 'DOC', NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1);
END $$;
