-- Actualizaciones para el sistema de autenticación seguro

-- 1. Mejoras a la tabla de usuarios
ALTER TABLE "t_user" 
ADD COLUMN "FAILED_ATTEMPTS" INTEGER DEFAULT 0,
ADD COLUMN "LOCK_DATE" TIMESTAMP DEFAULT NULL,
ADD COLUMN "FORCE_PASSWORD_CHANGE" BOOLEAN DEFAULT FALSE;

-- 2. Mejoras a la tabla de llaves de usuario
ALTER TABLE "t_user_key"
ADD COLUMN "IS_TEMPORARY" BOOLEAN DEFAULT FALSE;

-- 3. Tabla para tokens de recuperación de contraseña
CREATE TABLE "t_recovery_tokens" (
  "TOKEN_ID" SERIAL NOT NULL,
  "USER_ID" INTEGER NOT NULL,
  "TOKEN" VARCHAR(255) NOT NULL,
  "EXPIRATION_DATE" TIMESTAMP NOT NULL,
  "STATUS" SMALLINT DEFAULT 1, -- 1: Activo, 0: Usado/Expirado
  "CREATION_DATE" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("TOKEN_ID"),
  CONSTRAINT "fk_recovery_user" FOREIGN KEY ("USER_ID") REFERENCES "t_user" ("USER_ID")
);

-- 4. Tabla de logs de auditoría específicos para autenticación
CREATE TABLE "t_auth_log" (
  "AUTH_LOG_ID" SERIAL NOT NULL,
  "USER_ID" INTEGER,
  "USER_CI" VARCHAR(10),
  "ACTION" VARCHAR(50) NOT NULL, -- 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_CHANGE', 'RECOVERY_REQUEST', 'ACCOUNT_LOCKED'
  "IP_ADDRESS" VARCHAR(45),
  "USER_AGENT" TEXT,
  "DETAILS" TEXT,
  "CREATION_DATE" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("AUTH_LOG_ID")
);

-- 5. Comentarios para documentación
COMMENT ON COLUMN "t_user"."FAILED_ATTEMPTS" IS 'Contador de intentos fallidos de inicio de sesión';
COMMENT ON COLUMN "t_user"."LOCK_DATE" IS 'Fecha y hora en que la cuenta fue bloqueada';
COMMENT ON COLUMN "t_user"."FORCE_PASSWORD_CHANGE" IS 'Indica si el usuario debe cambiar su contraseña en el próximo inicio de sesión';
COMMENT ON COLUMN "t_user_key"."IS_TEMPORARY" IS 'Indica si la clave es temporal (para primer ingreso)';
