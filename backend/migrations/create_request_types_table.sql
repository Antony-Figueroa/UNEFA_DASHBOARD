-- Tabla de tipos de solicitudes
-- Define los tipos de solicitudes que pueden crear los estudiantes

CREATE TABLE IF NOT EXISTS "t_request_types" (
  "REQUEST_TYPE_ID" SERIAL PRIMARY KEY,
  "NAME" VARCHAR(100) NOT NULL,
  "DESCRIPTION" TEXT,
  "IS_ACTIVE" SMALLINT NOT NULL DEFAULT 1,
  "CREATION_DATE" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "MODIF_USER_ID" INT NOT NULL DEFAULT 0,
  "MODIF_USER_DATE" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ELIM_USER_ID" INT NOT NULL DEFAULT 0,
  "ELIM_USER_DATE" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "REST_USER_ID" INT NOT NULL DEFAULT 0,
  "REST_USER_DATE" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "STATUS" SMALLINT NOT NULL DEFAULT 1
);

-- Datos iniciales para tipos de solicitudes
INSERT INTO "t_request_types" ("NAME", "DESCRIPTION", "IS_ACTIVE", "STATUS") VALUES
('Cambio de Empresa', 'Solicitud para cambiar la empresa donde se realizan las prácticas', 1, 1),
('Cambio de Tutor', 'Solicitud para cambiar el tutor académico asignado', 1, 1),
('Prórroga de Pasantía', 'Solicitud para extender el período de pasantía', 1, 1),
('Retiro de Pasantía', 'Solicitud para retirarse del programa de pasantías', 1, 1),
('Carta de Pasantía', 'Solicitud de carta de aceptación o culminación de pasantía', 1, 1),
('Constancia de Estudios', 'Solicitud de constancia de estudios con fines de pasantía', 1, 1),
('Revisión de Nota', 'Solicitud para revisar la calificación final de pasantía', 1, 1),
('Otro', 'Otro tipo de solicitud no contemplada', 1, 1);

COMMENT ON TABLE "t_request_types" IS 'Tipos de solicitudes disponibles para estudiantes';
