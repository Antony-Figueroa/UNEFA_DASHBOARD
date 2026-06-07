-- Migration: 009_email_templates
-- Crea la tabla de plantillas de email editables para el correo express
-- y siembra las 4 plantillas iniciales.

-- Tabla
CREATE TABLE IF NOT EXISTS "t_email_templates" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "category" VARCHAR(50) NOT NULL DEFAULT 'general',
  "subject" VARCHAR(500) NOT NULL,
  "body_html" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE "t_email_templates" IS 'Plantillas de email editables para correo express';
COMMENT ON COLUMN "t_email_templates"."category" IS 'Categoría: periodo, evaluacion, general';

-- Seed data
INSERT INTO "t_email_templates" ("name", "description", "category", "subject", "body_html")
SELECT * FROM (VALUES
(
  'Inicio de Lapso Académico',
  'Notificar a estudiantes sobre el inicio de un nuevo período académico',
  'periodo',
  '📢 Inicio de lapso {{periodo}}',
  '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #1e40af; padding: 20px; text-align: center; color: white;">
      <h1 style="margin: 0;">SIGP UNEFA</h1>
    </div>
    <div style="padding: 24px; color: #1e293b;">
      <h2>¡Bienvenido al {{periodo}}, {{nombre}}!</h2>
      <p>Informamos que el lapso académico <strong>{{periodo}}</strong> ha dado inicio el día <strong>{{fecha_inicio}}</strong>.</p>
      <p>Te recordamos mantener tus datos al día y revisar las actividades programadas para este período.</p>
      <hr style="border-top: 1px solid #e2e8f0;">
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">SIGP UNEFA — Sistema de Gestión de Personal</p>
    </div>
  </div>'
),
(
  'Fin de Lapso Académico',
  'Notificar a estudiantes sobre el cierre del período académico',
  'periodo',
  '⏰ Cierre de lapso {{periodo}}',
  '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #1e40af; padding: 20px; text-align: center; color: white;">
      <h1 style="margin: 0;">SIGP UNEFA</h1>
    </div>
    <div style="padding: 24px; color: #1e293b;">
      <h2>Cierre del {{periodo}}</h2>
      <p>Hola {{nombre}},</p>
      <p>Te informamos que el lapso académico <strong>{{periodo}}</strong> finaliza el <strong>{{fecha_fin}}</strong>.</p>
      <p>Asegurate de tener toda tu documentación al día antes del cierre.</p>
      <hr style="border-top: 1px solid #e2e8f0;">
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">SIGP UNEFA — Sistema de Gestión de Personal</p>
    </div>
  </div>'
),
(
  'Reporte de Evaluación',
  'Notificar a tutores sobre reportes de evaluación disponibles',
  'evaluacion',
  '📋 Reporte de evaluación disponible',
  '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #1e40af; padding: 20px; text-align: center; color: white;">
      <h1 style="margin: 0;">SIGP UNEFA</h1>
    </div>
    <div style="padding: 24px; color: #1e293b;">
      <h2>Reporte de Evaluación</h2>
      <p>Hola {{nombre}},</p>
      <p>Tenés disponible el reporte de evaluación del período <strong>{{periodo}}</strong>.</p>
      <p>Ingresá al sistema para revisar los resultados y completar las evaluaciones pendientes de tus estudiantes asignados.</p>
      <hr style="border-top: 1px solid #e2e8f0;">
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">SIGP UNEFA — Sistema de Gestión de Personal</p>
    </div>
  </div>'
),
(
  'Aviso General',
  'Plantilla genérica para comunicados institucionales',
  'general',
  '{{asunto}}',
  '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #1e40af; padding: 20px; text-align: center; color: white;">
      <h1 style="margin: 0;">SIGP UNEFA</h1>
    </div>
    <div style="padding: 24px; color: #1e293b;">
      <h2>{{asunto}}</h2>
      <p>Hola {{nombre}},</p>
      <p>{{mensaje}}</p>
      <hr style="border-top: 1px solid #e2e8f0;">
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">SIGP UNEFA — Sistema de Gestión de Personal</p>
    </div>
  </div>'
)
) AS v
WHERE NOT EXISTS (SELECT 1 FROM "t_email_templates" LIMIT 1);
