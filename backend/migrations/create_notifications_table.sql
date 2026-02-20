-- Tabla de notificaciones del sistema
-- Almacena las notificaciones enviadas a los usuarios

CREATE TABLE IF NOT EXISTS "t_notifications" (
  "NOTIFICATION_ID" SERIAL PRIMARY KEY,
  "USER_ID" INT NOT NULL,
  "TYPE" VARCHAR(50) NOT NULL,
  "TITLE" VARCHAR(255) NOT NULL,
  "MESSAGE" TEXT NOT NULL,
  "DATA" JSONB,
  "READ" BOOLEAN NOT NULL DEFAULT FALSE,
  "READ_AT" TIMESTAMP,
  "CREATED_AT" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "fk_notification_user" FOREIGN KEY ("USER_ID") 
    REFERENCES "t_user" ("USER_ID") ON DELETE CASCADE
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS "idx_notifications_user" ON "t_notifications" ("USER_ID");
CREATE INDEX IF NOT EXISTS "idx_notifications_read" ON "t_notifications" ("USER_ID", "READ");
CREATE INDEX IF NOT EXISTS "idx_notifications_created" ON "t_notifications" ("CREATED_AT" DESC);

COMMENT ON TABLE "t_notifications" IS 'Notificaciones del sistema para usuarios';
COMMENT ON COLUMN "t_notifications"."TYPE" IS 'Tipo: info, warning, success, error, request, evaluation, etc.';
COMMENT ON COLUMN "t_notifications"."DATA" IS 'Datos adicionales en formato JSON';
