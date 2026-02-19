-- ================================================================================
-- MIGRACIÓN: Agregar columnas USER_ID para roles TUTOR y ESTUDIANTE
-- Fecha: 2026-02-18
-- Descripción: Permite vincular tutores y estudiantes con usuarios del sistema
-- ================================================================================

-- 1. Agregar columna USER_ID a la tabla t_tutors
-- (Ejecutar solo si la columna no existe)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 't_tutors' AND column_name = 'USER_ID'
    ) THEN
        ALTER TABLE "t_tutors" ADD COLUMN "USER_ID" INTEGER REFERENCES "t_user"("USER_ID");
        RAISE NOTICE 'Columna USER_ID agregada a t_tutors';
    ELSE
        RAISE NOTICE 'Columna USER_ID ya existe en t_tutors';
    END IF;
END $$;

-- 2. Agregar columna USER_ID a la tabla t_students
-- (Ejecutar solo si la columna no existe)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 't_students' AND column_name = 'USER_ID'
    ) THEN
        ALTER TABLE "t_students" ADD COLUMN "USER_ID" INTEGER REFERENCES "t_user"("USER_ID");
        RAISE NOTICE 'Columna USER_ID agregada a t_students';
    ELSE
        RAISE NOTICE 'Columna USER_ID ya existe en t_students';
    END IF;
END $$;

-- 3. Agregar rol TUTOR (ID=3) si no existe
INSERT INTO "t_user_roles" ("ID_USER", "ID_ROLES")
SELECT 0, 3
WHERE NOT EXISTS (SELECT 1 FROM "t_user_roles" WHERE "ID_ROLES" = 3 LIMIT 1)
ON CONFLICT DO NOTHING;

-- Nota: El ID_ROLES=3 no es una tabla de roles, es un valor en t_user_roles
-- Para que funcione correctamente, el sistema debe reconocer el rol 3 como TUTOR

-- ================================================================================
-- VERIFICACIÓN
-- ================================================================================
SELECT 
    't_tutors.USER_ID' as columna,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 't_tutors' AND column_name = 'USER_ID'
    ) THEN '✅ Existe' ELSE '❌ No existe' END as estado;

SELECT 
    't_students.USER_ID' as columna,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 't_students' AND column_name = 'USER_ID'
    ) THEN '✅ Existe' ELSE '❌ No existe' END as estado;

-- ================================================================================
-- INSTRUCCIONES POST-MIGRACIÓN
-- ================================================================================
-- Después de ejecutar esta migración, ejecutar el script:
-- cd backend && npx tsx scripts/setup-tutor-user.ts
-- Esto creará un usuario tutor de prueba con credenciales:
-- Usuario: [CI del tutor]
-- Contraseña: Tutor123!
