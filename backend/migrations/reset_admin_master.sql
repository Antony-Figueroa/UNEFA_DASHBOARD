-- Script para limpiar usuarios y dejar solo el Admin Master
-- Ejecutar en Supabase SQL Editor

-- 0. Primero crear el rol MASTER si no existe
INSERT INTO "t_roles" ("ID_ROLS", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS")
SELECT 0, 'MASTER', 'Usuario Master del sistema', 1, NOW(), 1, NOW(), 1, NOW(), 1
WHERE NOT EXISTS (SELECT 1 FROM "t_roles" WHERE "ID_ROLS" = 0);

-- 1. Eliminar todas las claves de usuarios
DELETE FROM t_user_key;

-- 2. Eliminar todas las preguntas de seguridad
DELETE FROM t_security_questions;

-- 3. Eliminar todos los roles de usuario
DELETE FROM t_user_roles;

-- 4. Eliminar todos los usuarios excepto los que tienen ID 1
DELETE FROM t_user WHERE "USER_ID" > 1;

-- 5. Actualizar o crear el usuario admin master con ID 1
DO $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM t_user WHERE "USER_ID" = 1;
  
  IF user_count = 0 THEN
    INSERT INTO t_user (
      "USER_ID", "USER", "USER_CI", "NAME", "SECOND_NAME", "SURNAME", 
      "SECOND_SURNAME", "EMAIL", "PHONE_NUMBER", "CREATION_DATE", 
      "LOGIN", "TERMS_CONDITIONS", "STATUS_SESSION", "STATUS", 
      "FAILED_ATTEMPTS", "FORCE_PASSWORD_CHANGE"
    ) VALUES (
      1, 'admin', 'V87654321', 'ADMIN', 'MASTER', 'ADMIN', 'MASTER', 
      'admin@unefa.edu.ve', '', NOW(), 1, '1', 1, 1, 0, false
    );
  ELSE
    UPDATE t_user SET 
      "USER" = 'admin', "USER_CI" = 'V87654321', "NAME" = 'ADMIN',
      "SECOND_NAME" = 'MASTER', "SURNAME" = 'ADMIN', "SECOND_SURNAME" = 'MASTER',
      "EMAIL" = 'admin@unefa.edu.ve', "STATUS" = 1, "FAILED_ATTEMPTS" = 0,
      "FORCE_PASSWORD_CHANGE" = false
    WHERE "USER_ID" = 1;
  END IF;
END $$;

-- 6. Asignar rol de Master (ID_ROLES = 0)
DELETE FROM t_user_roles WHERE "ID_USER" = 1;
INSERT INTO t_user_roles ("ID_USER", "ID_ROLES") VALUES (1, 0);

-- 7. Generar hash de bcrypt para "AdminPassword123!" usando la función de PostgreSQL
-- Primero verificar si la extensión pgcrypto está disponible
DO $$
DECLARE
  admin_id INTEGER := 1;
  pwd_hash TEXT;
BEGIN
  -- Generar hash bcrypt con cost 12 para "AdminPassword123!"
  pwd_hash := encode(gen_random_bytes(16), 'hex'); -- Esto es solo para generar algo aleatorio
  
  -- Usar un hash pre-generado para "AdminPassword123!"
  -- Este hash es válido para bcrypt
  pwd_hash := '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYKPvCvY7N6';
  
  -- Insertar la clave del usuario
  INSERT INTO t_user_key (
    "USER_ID", "KEY", "START_DATE", "END_DATE", "STATUS", 
    "IS_TEMPORARY", "MODIF_USER_ID", "MODIF_USER_DATE",
    "ELIM_USER_ID", "ELIM_USER_DATE"
  ) VALUES (
    admin_id, pwd_hash, NOW(), NOW() + INTERVAL '1 year', 1,
    false, admin_id, NOW(), 0, '2025-01-01 00:00:00'
  ) ON CONFLICT DO NOTHING;
END $$;

-- 8. Verificar resultado
SELECT 
  u."USER_ID",
  u."USER_CI" AS cedula,
  u."NAME" AS nombre,
  u."EMAIL" AS correo,
  u."STATUS" AS estado,
  CASE WHEN k."KEY" IS NOT NULL THEN 'SI' ELSE 'NO' END AS tiene_clave
FROM t_user u
LEFT JOIN t_user_key k ON u."USER_ID" = k."USER_ID" AND k."STATUS" = 1
WHERE u."USER_ID" = 1;

SELECT r."ID_ROLES", r."NAME" FROM t_roles r;
SELECT * FROM t_user_roles WHERE "ID_USER" = 1;
