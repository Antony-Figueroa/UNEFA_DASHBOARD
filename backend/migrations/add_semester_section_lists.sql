-- Agregar listas de SEMESTRE y SECCION
-- SEMESTRE: valores 1-10, SECCION: valores iniciales 536 y 936
-- NOTA: Usa mayúsculas para coincidir con el comportamiento de la API (name.toUpperCase())
--       Incluye todas las columnas NOT NULL requeridas por el schema
--       Usa UPPER() para comparaciones case-insensitive

-- Crear lista SEMESTRE
INSERT INTO "t_list" (
  "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", 
  "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS"
)
SELECT 
  'SEMESTRE', NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1
WHERE NOT EXISTS (SELECT 1 FROM "t_list" WHERE UPPER("NAME") = 'SEMESTRE');

-- Insertar valores 1-10 para SEMESTRE
DO $$
DECLARE
    list_id INTEGER;
BEGIN
    SELECT "LIST_ID" INTO list_id FROM "t_list" WHERE UPPER("NAME") = 'SEMESTRE' LIMIT 1;
    
    DELETE FROM "t_value_list" WHERE "LIST_ID" = list_id;
    
    INSERT INTO "t_value_list" (
      "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", 
      "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", 
      "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS"
    ) VALUES
    ('1', '1', list_id, NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1),
    ('2', '2', list_id, NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1),
    ('3', '3', list_id, NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1),
    ('4', '4', list_id, NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1),
    ('5', '5', list_id, NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1),
    ('6', '6', list_id, NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1),
    ('7', '7', list_id, NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1),
    ('8', '8', list_id, NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1),
    ('9', '9', list_id, NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1),
    ('10', '10', list_id, NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1);
END $$;

-- Crear lista SECCION
INSERT INTO "t_list" (
  "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", 
  "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS"
)
SELECT 
  'SECCION', NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1
WHERE NOT EXISTS (SELECT 1 FROM "t_list" WHERE UPPER("NAME") = 'SECCION');

-- Insertar valores 536, 936 para SECCION
DO $$
DECLARE
    list_id INTEGER;
BEGIN
    SELECT "LIST_ID" INTO list_id FROM "t_list" WHERE UPPER("NAME") = 'SECCION' LIMIT 1;
    
    DELETE FROM "t_value_list" WHERE "LIST_ID" = list_id;
    
    INSERT INTO "t_value_list" (
      "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", 
      "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", 
      "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS"
    ) VALUES
    ('536', '536', list_id, NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1),
    ('936', '936', list_id, NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1);
END $$;
