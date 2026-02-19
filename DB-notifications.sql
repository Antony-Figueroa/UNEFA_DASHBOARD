-- --------------------------------------------------------
-- Tabla de Notificaciones
-- --------------------------------------------------------

CREATE TABLE "t_notifications" (
  "NOTIFICATION_ID" SERIAL NOT NULL,
  "USER_ID" INTEGER NOT NULL,
  "TYPE" VARCHAR(50) NOT NULL,
  "TITLE" VARCHAR(255) NOT NULL,
  "MESSAGE" TEXT NOT NULL,
  "READ" BOOLEAN DEFAULT FALSE,
  "READ_AT" TIMESTAMP DEFAULT NULL,
  "DATA" JSONB DEFAULT NULL,
  "CREATED_AT" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("NOTIFICATION_ID"),
  CONSTRAINT "fk_notification_user" FOREIGN KEY ("USER_ID") REFERENCES "t_user" ("USER_ID") ON DELETE CASCADE
);

-- Índice para consultas frecuentes
CREATE INDEX "idx_notifications_user_id" ON "t_notifications" ("USER_ID");
CREATE INDEX "idx_notifications_read" ON "t_notifications" ("READ");
CREATE INDEX "idx_notifications_created_at" ON "t_notifications" ("CREATED_AT" DESC);

-- --------------------------------------------------------
-- Tipos de notificaciones
-- --------------------------------------------------------

-- Enum simulado usando CHECK
ALTER TABLE "t_notifications" ADD CONSTRAINT "chk_notification_type" 
CHECK ("TYPE" IN (
  'pre_enrollment',    -- Pre-inscripciones
  'enrollment',        -- Inscripciones
  'tracking',          -- Seguimiento de pasantías
  'tracking_visit',   -- Visitas de seguimiento
  'user_management',  -- Gestión de usuarios
  'reminder',          -- Recordatorios
  'system',           -- Sistema
  'approval'          -- Aprobaciones
));

COMMENT ON TABLE "t_notifications" IS 'Tabla de notificaciones del sistema';
COMMENT ON COLUMN "t_notifications"."TYPE" IS 'Tipo de notificación: pre_enrollment, enrollment, tracking, tracking_visit, user_management, reminder, system, approval';
