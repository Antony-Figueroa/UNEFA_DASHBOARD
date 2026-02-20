-- ================================================================================
-- UNEFA Dashboard - Optimización y Mejoras de BD
-- Fecha: 2026-02-20
-- Descripción: Limpieza de tablas no usadas, mejoras de estructura y permisos
-- ================================================================================

-- ================================================================================
-- PARTE 1: LIMPIEZA DE TABLAS NO USADAS
-- ================================================================================

-- 1.1 Eliminar t_activity_log (duplicada de t_activity_logs que sí se usa)
DROP TABLE IF EXISTS "t_activity_log" CASCADE;

-- 1.2 Desactivar t_visit (renombrar con prefijo deprecated)
COMMENT ON TABLE "t_visit" IS 'DEPRECATED: Esta tabla no se usa. Fue reemplazada por t_practice_visits. No eliminar por si hay datos históricos.';
-- PARTE 2: MEJORAR t_user_questions PARA RECUPERACIÓN DE CONTRASEÑA
-- ================================================================================

-- 2.1 Eliminar tabla anterior y crear estructura correcta
DROP TABLE IF EXISTS "t_user_questions" CASCADE;

CREATE TABLE "t_user_questions" (
  "USER_QUESTION_ID" SERIAL PRIMARY KEY,
  "USER_ID" INT NOT NULL,
  "QUESTION_TYPE" VARCHAR(20) NOT NULL DEFAULT 'PRESET', -- 'PRESET' o 'CUSTOM'
  "PRESET_QUESTION_ID" INT,
  "CUSTOM_QUESTION" VARCHAR(255),
  "ANSWER" VARCHAR(255) NOT NULL,
  "ORDER_NUM" SMALLINT NOT NULL DEFAULT 1,
  "CREATED_AT" TIMESTAMP NOT NULL DEFAULT NOW(),
  "UPDATED_AT" TIMESTAMP NOT NULL DEFAULT NOW(),
  "STATUS" SMALLINT NOT NULL DEFAULT 1,
  
  CONSTRAINT "fk_user_questions_user" FOREIGN KEY ("USER_ID") 
    REFERENCES "t_user"("USER_ID") ON DELETE CASCADE,
  CONSTRAINT "fk_user_questions_preset" FOREIGN KEY ("PRESET_QUESTION_ID") 
    REFERENCES "t_preset_questions"("PRESET_QUESTION_ID") ON DELETE SET NULL,
  CONSTRAINT "chk_question_type" CHECK (
    ("QUESTION_TYPE" = 'PRESET' AND "PRESET_QUESTION_ID" IS NOT NULL) OR
    ("QUESTION_TYPE" = 'CUSTOM' AND "CUSTOM_QUESTION" IS NOT NULL)
  )
);

CREATE INDEX "idx_user_questions_user" ON "t_user_questions"("USER_ID");
CREATE INDEX "idx_user_questions_preset" ON "t_user_questions"("PRESET_QUESTION_ID");

COMMENT ON TABLE "t_user_questions" IS 'Preguntas de seguridad configuradas por cada usuario para recuperación de contraseña';
COMMENT ON COLUMN "t_user_questions"."QUESTION_TYPE" IS 'PRESET = pregunta predefinida, CUSTOM = pregunta personalizada';
COMMENT ON COLUMN "t_user_questions"."ORDER_NUM" IS 'Orden de la pregunta (1, 2, 3...)';

-- ================================================================================
-- PARTE 3: SISTEMA DE PERMISOS GRANULARES
-- ================================================================================

-- 3.1 Limpiar y poblar t_permissions
TRUNCATE TABLE "t_permissions" CASCADE;

INSERT INTO "t_permissions" ("NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES
-- Usuarios
('users:view', 'Ver lista de usuarios', 1, NOW(), 0, NOW(), 0, NOW(), 1),
('users:create', 'Crear nuevos usuarios', 1, NOW(), 0, NOW(), 0, NOW(), 1),
('users:edit', 'Editar usuarios existentes', 1, NOW(), 0, NOW(), 0, NOW(), 1),
('users:delete', 'Eliminar usuarios', 1, NOW(), 0, NOW(), 0, NOW(), 1),
-- Estudiantes
('students:view', 'Ver lista de estudiantes', 1, NOW(), 0, NOW(), 0, NOW(), 1),
('students:create', 'Registrar nuevos estudiantes', 1, NOW(), 0, NOW(), 0, NOW(), 1),
('students:edit', 'Editar información de estudiantes', 1, NOW(), 0, NOW(), 0, NOW(), 1),
('students:delete', 'Eliminar estudiantes', 1, NOW(), 0, NOW(), 0, NOW(), 1),
('students:export', 'Exportar datos de estudiantes', 1, NOW(), 0, NOW(), 0, NOW(), 1),
-- Tutores
('tutors:view', 'Ver lista de tutores', 1, NOW(), 0, NOW(), 0, NOW(), 1),
('tutors:create', 'Registrar nuevos tutores', 1, NOW(), 0, NOW(), 0, NOW(), 1),
('tutors:edit', 'Editar información de tutores', 1, NOW(), 0, NOW(), 0, NOW(), 1),
('tutors:delete', 'Eliminar tutores', 1, NOW(), 0, NOW(), 0, NOW(), 1),
-- Instituciones
('institutions:view', 'Ver lista de instituciones', 1, NOW(), 0, NOW(), 0, NOW(), 1),
('institutions:create', 'Registrar nuevas instituciones', 1, NOW(), 0, NOW(), 0, NOW(), 1),
('institutions:edit', 'Editar información de instituciones', 1, NOW(), 0, NOW(), 0, NOW(), 1),
('institutions:delete', 'Eliminar instituciones', 1, NOW(), 0, NOW(), 0, NOW(), 1),
-- Prácticas
('practices:view', 'Ver prácticas profesionales', 1, NOW(), 0, NOW(), 0, NOW(), 1),
('practices:create', 'Registrar nuevas prácticas', 1, NOW(), 0, NOW(), 0, NOW(), 1),
('practices:edit', 'Editar prácticas', 1, NOW(), 0, NOW(), 0, NOW(), 1),
('practices:delete', 'Eliminar prácticas', 1, NOW(), 0, NOW(), 0, NOW(), 1),
('practices:evaluate', 'Evaluar prácticas', 1, NOW(), 0, NOW(), 0, NOW(), 1),
-- Periodos
('periods:view', 'Ver periodos académicos', 1, NOW(), 0, NOW(), 0, NOW(), 1),
('periods:create', 'Crear nuevos periodos', 1, NOW(), 0, NOW(), 0, NOW(), 1),
('periods:edit', 'Editar periodos', 1, NOW(), 0, NOW(), 0, NOW(), 1),
('periods:delete', 'Eliminar periodos', 1, NOW(), 0, NOW(), 0, NOW(), 1),
-- Respaldos
('backups:view', 'Ver lista de respaldos', 1, NOW(), 0, NOW(), 0, NOW(), 1),
('backups:create', 'Crear respaldos', 1, NOW(), 0, NOW(), 0, NOW(), 1),
('backups:restore', 'Restaurar respaldos', 1, NOW(), 0, NOW(), 0, NOW(), 1),
('backups:delete', 'Eliminar respaldos', 1, NOW(), 0, NOW(), 0, NOW(), 1),
-- Reportes
('reports:view', 'Ver reportes', 1, NOW(), 0, NOW(), 0, NOW(), 1),
('reports:export', 'Exportar reportes', 1, NOW(), 0, NOW(), 0, NOW(), 1),
-- Configuración
('config:view', 'Ver configuración del sistema', 1, NOW(), 0, NOW(), 0, NOW(), 1),
('config:edit', 'Modificar configuración del sistema', 1, NOW(), 0, NOW(), 0, NOW(), 1),
-- Carreras
('careers:view', 'Ver carreras', 1, NOW(), 0, NOW(), 0, NOW(), 1),
('careers:create', 'Crear carreras', 1, NOW(), 0, NOW(), 0, NOW(), 1),
('careers:edit', 'Editar carreras', 1, NOW(), 0, NOW(), 0, NOW(), 1),
('careers:delete', 'Eliminar carreras', 1, NOW(), 0, NOW(), 0, NOW(), 1),
-- Solicitudes
('requests:view', 'Ver solicitudes', 1, NOW(), 0, NOW(), 0, NOW(), 1),
('requests:approve', 'Aprobar/rechazar solicitudes', 1, NOW(), 0, NOW(), 0, NOW(), 1);

-- 3.2 Asignar permisos a roles
TRUNCATE TABLE "t_roles_permissions" CASCADE;

-- Función helper para asignar permisos
CREATE OR REPLACE FUNCTION assign_permission(role_id INT, perm_name TEXT)
RETURNS VOID AS $$
DECLARE
    perm_id INT;
BEGIN
    SELECT "PERMISSIONS_ID" INTO perm_id FROM "t_permissions" WHERE "NAME" = perm_name;
    IF perm_id IS NOT NULL THEN
        INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID") 
        VALUES (role_id, perm_id)
        ON CONFLICT DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ADMIN (rol 1) - Todos los permisos
INSERT INTO "t_roles_permissions" ("ROLES_ID", "PERMISSIONS_ID")
SELECT 1, "PERMISSIONS_ID" FROM "t_permissions";

-- ASISTENTE (rol 2) - Solo lectura y creación, sin eliminar
SELECT assign_permission(2, 'users:view');
SELECT assign_permission(2, 'users:create');
SELECT assign_permission(2, 'students:view');
SELECT assign_permission(2, 'students:create');
SELECT assign_permission(2, 'students:edit');
SELECT assign_permission(2, 'students:export');
SELECT assign_permission(2, 'tutors:view');
SELECT assign_permission(2, 'tutors:create');
SELECT assign_permission(2, 'tutors:edit');
SELECT assign_permission(2, 'institutions:view');
SELECT assign_permission(2, 'institutions:create');
SELECT assign_permission(2, 'institutions:edit');
SELECT assign_permission(2, 'practices:view');
SELECT assign_permission(2, 'practices:create');
SELECT assign_permission(2, 'practices:edit');
SELECT assign_permission(2, 'periods:view');
SELECT assign_permission(2, 'periods:create');
SELECT assign_permission(2, 'periods:edit');
SELECT assign_permission(2, 'careers:view');
SELECT assign_permission(2, 'careers:create');
SELECT assign_permission(2, 'careers:edit');
SELECT assign_permission(2, 'requests:view');
SELECT assign_permission(2, 'requests:approve');
SELECT assign_permission(2, 'reports:view');
SELECT assign_permission(2, 'reports:export');

-- TUTOR (rol 3) - Ver y evaluar sus prácticas asignadas
SELECT assign_permission(3, 'students:view');
SELECT assign_permission(3, 'practices:view');
SELECT assign_permission(3, 'practices:edit');
SELECT assign_permission(3, 'practices:evaluate');
SELECT assign_permission(3, 'reports:view');

-- ESTUDIANTE (rol 4) - Sin permisos especiales (solo su propio perfil)
-- No se asignan permisos adicionales

DROP FUNCTION assign_permission(INT, TEXT);

-- ================================================================================
-- PARTE 4: SISTEMA DE AUDITORÍA (CHANGE LOG)
-- ================================================================================

-- 4.1 Poblar t_tables con las tablas del sistema
TRUNCATE TABLE "t_tables" CASCADE;

INSERT INTO "t_tables" ("NAME", "DESCRIPTION", "PHYSICAL_NAME", "LOG", "STATUS") VALUES
('Usuarios', 'Tabla de usuarios del sistema', 't_user', 1, 1),
('Claves de Usuario', 'Historial de claves', 't_user_key', 1, 1),
('Roles', 'Roles del sistema', 't_roles', 1, 1),
('Permisos', 'Permisos del sistema', 't_permissions', 1, 1),
('Estudiantes', 'Estudiantes registrados', 't_students', 1, 1),
('Tutores', 'Tutores académicos', 't_tutors', 1, 1),
('Instituciones', 'Instituciones/empresas', 't_institution', 1, 1),
('Carreras', 'Carreras universitarias', 't_career', 1, 1),
('Periodos', 'Periodos académicos', 't_internships_period', 1, 1),
('Prácticas', 'Prácticas profesionales', 't_professional_practices', 1, 1),
('Evaluaciones', 'Evaluaciones de prácticas', 't_evaluation', 1, 1),
('Visitas', 'Visitas a instituciones', 't_practice_visits', 1, 1),
('Respaldos', 'Respaldos de BD', 't_backups', 0, 1);

-- 4.2 Poblar t_operation
TRUNCATE TABLE "t_operation" CASCADE;

INSERT INTO "t_operation" ("ACTION", "DESCRIPTION", "STATUS") VALUES
('INSERT', 'Inserción de nuevo registro', 1),
('UPDATE', 'Actualización de registro', 1),
('DELETE', 'Eliminación de registro', 1);

-- 4.3 Poblar t_columns con columnas importantes (solo las críticas)
TRUNCATE TABLE "t_columns" CASCADE;

-- Obtener TABLE_ID para cada tabla y crear columnas
DO $$
DECLARE
    user_table_id INT;
BEGIN
    SELECT "TABLE_ID" INTO user_table_id FROM "t_tables" WHERE "PHYSICAL_NAME" = 't_user';
    INSERT INTO "t_columns" ("TABLE_ID", "COLUMN_NAME", "STATUS") VALUES
        (user_table_id, 'USER_CI', 1),
        (user_table_id, 'NAME', 1),
        (user_table_id, 'EMAIL', 1),
        (user_table_id, 'STATUS', 1);
END $$;

-- ================================================================================
-- PARTE 5: VERIFICACIÓN
-- ================================================================================

-- Mostrar resumen
SELECT 'Permisos creados' as info, COUNT(*) as total FROM "t_permissions"
UNION ALL
SELECT 'Asignaciones rol-permiso', COUNT(*) FROM "t_roles_permissions"
UNION ALL
SELECT 'Tablas para auditoría', COUNT(*) FROM "t_tables"
UNION ALL
SELECT 'Operaciones de auditoría', COUNT(*) FROM "t_operation";

-- Verificar permisos por rol
SELECT r."NAME" as rol, COUNT(rp."PERMISSIONS_ID") as permisos
FROM "t_roles" r
LEFT JOIN "t_roles_permissions" rp ON r."ID_ROLS" = rp."ROLES_ID"
GROUP BY r."NAME", r."ID_ROLS"
ORDER BY r."ID_ROLS";

-- ================================================================================
-- FIN DEL SCRIPT
-- ================================================================================
