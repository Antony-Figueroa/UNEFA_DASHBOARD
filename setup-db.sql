-- SQL para configurar el sistema de autenticación seguro
-- Ejecute este script en su editor SQL de Supabase

-- 1. Agregar columnas de seguridad a la tabla t_user
ALTER TABLE "t_user" ADD COLUMN IF NOT EXISTS "FAILED_ATTEMPTS" INTEGER DEFAULT 0;
ALTER TABLE "t_user" ADD COLUMN IF NOT EXISTS "LOCK_DATE" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "t_user" ADD COLUMN IF NOT EXISTS "FORCE_PASSWORD_CHANGE" BOOLEAN DEFAULT FALSE;

-- 2. Asegurar que la tabla t_security_questions tenga la columna ANSWER
ALTER TABLE "t_security_questions" ADD COLUMN IF NOT EXISTS "ANSWER" TEXT;

-- 3. Crear tabla de auditoría de autenticación
CREATE TABLE IF NOT EXISTS "t_auth_log" (
    "ID" SERIAL PRIMARY KEY,
    "USER_ID" INTEGER REFERENCES "t_user"("USER_ID"),
    "USER_CI" VARCHAR(20),
    "ACTION" VARCHAR(50) NOT NULL,
    "IP_ADDRESS" VARCHAR(45),
    "USER_AGENT" TEXT,
    "DETAILS" TEXT,
    "CREATED_AT" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Crear tabla para tokens de recuperación de contraseña (email)
CREATE TABLE IF NOT EXISTS "t_recovery_tokens" (
    "ID" SERIAL PRIMARY KEY,
    "USER_ID" INTEGER NOT NULL REFERENCES "t_user"("USER_ID"),
    "TOKEN" VARCHAR(255) NOT NULL,
    "EXPIRY" TIMESTAMP WITH TIME ZONE NOT NULL,
    "USED" BOOLEAN DEFAULT FALSE,
    "CREATED_AT" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Asegurar que t_user_key tenga la columna IS_TEMPORARY
ALTER TABLE "t_user_key" ADD COLUMN IF NOT EXISTS "IS_TEMPORARY" BOOLEAN DEFAULT FALSE;

-- Comentarios de ayuda
COMMENT ON COLUMN "t_user"."FAILED_ATTEMPTS" IS 'Contador de intentos fallidos de inicio de sesión';
COMMENT ON COLUMN "t_user"."LOCK_DATE" IS 'Fecha y hora hasta la cual la cuenta está bloqueada';
COMMENT ON COLUMN "t_user"."FORCE_PASSWORD_CHANGE" IS 'Indica si el usuario debe cambiar su contraseña en el próximo inicio de sesión';
COMMENT ON TABLE "t_auth_log" IS 'Registro de auditoría para acciones relacionadas con la autenticación';
COMMENT ON TABLE "t_recovery_tokens" IS 'Almacena tokens temporales para recuperación de contraseña por correo electrónico';
