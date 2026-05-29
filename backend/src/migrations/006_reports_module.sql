-- ============================================================
-- Migration 006: Módulo de Reportes - Estructura de Base de Datos
-- Fase 0 del Plan de Implementación
-- ============================================================

-- 5.1 Tabla de Coordinadores (Decisión A)
CREATE TABLE IF NOT EXISTS "t_coordinadores" (
  "COORDINADOR_ID" SERIAL NOT NULL,
  "TIPO" VARCHAR(20) NOT NULL,
  "CAREER_ID" INTEGER,
  "NAME" VARCHAR(255) NOT NULL,
  "SECOND_NAME" VARCHAR(255) DEFAULT NULL,
  "SURNAME" VARCHAR(255) NOT NULL,
  "SECOND_SURNAME" VARCHAR(255) DEFAULT NULL,
  "CI" VARCHAR(20) NOT NULL,
  "CARGO" VARCHAR(255),
  "CREATION_DATE" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "STATUS" SMALLINT DEFAULT 1,
  PRIMARY KEY ("COORDINADOR_ID"),
  FOREIGN KEY ("CAREER_ID") REFERENCES "t_career" ("CAREER_ID")
);

-- 5.2 Columna Departamento en Prácticas (Decisión B)
ALTER TABLE "t_professional_practices"
ADD COLUMN IF NOT EXISTS "DEPARTMENT" VARCHAR(255) DEFAULT NULL;

-- 5.3 Columna Horario de Atención en Tutores (Decisión C)
ALTER TABLE "t_tutors"
ADD COLUMN IF NOT EXISTS "ATTENTION_SCHEDULE" VARCHAR(255) DEFAULT NULL;

-- 5.4 Tabla de Textos de Documentos (Decisión D)
CREATE TABLE IF NOT EXISTS "t_report_text_templates" (
  "TEMPLATE_ID" SERIAL NOT NULL,
  "REPORT_TYPE" VARCHAR(50) NOT NULL,
  "SECTION" VARCHAR(50) NOT NULL,
  "CONTENT_TEMPLATE" TEXT NOT NULL,
  "UPDATED_BY" INTEGER,
  "UPDATED_AT" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "STATUS" SMALLINT DEFAULT 1,
  PRIMARY KEY ("TEMPLATE_ID"),
  UNIQUE ("REPORT_TYPE", "SECTION")
);

-- 5.5 Valores iniciales para textos de documentos
INSERT INTO "t_report_text_templates" ("REPORT_TYPE", "SECTION", "CONTENT_TEMPLATE") VALUES
('aceptacion_tutor', 'encabezado', 'Por medio de la presente, yo, {{tutorTitulo}} {{tutorNombreCompleto}}, portador(a) de la C.I. {{tutorCi}}, en mi carácter de Tutor(a) Académico(a), ACEPTO formalmente tutoriar al(la) estudiante {{estudianteNombreCompleto}}, titular de la C.I. {{estudianteCi}}, cursante de la carrera {{carrera}}, durante el desarrollo de sus Prácticas Profesionales.'),
('aceptacion_tutor', 'firma', '___________________________________{{tutorTitulo}} {{tutorNombreCompleto}}Tutor(a) Académico(a)C.I.: {{tutorCi}}Teléfono: {{tutorTelefono}}'),
('solicitud_institucion', 'destinatario', 'MSc. Marbelys del Valle Rivero'),
('solicitud_institucion', 'cargo', 'Decana del Núcleo Portuguesa'),
('solicitud_institucion', 'orden', 'Según Orden administrativa N° 0005 de fecha 18 de Marzo 2022'),
('solicitud_institucion', 'cuerpo', 'Yo, {{estudianteNombreCompleto}}, titular de la C.I. {{estudianteCi}}, cursante de la carrera {{carrera}}, ante usted ocurro para solicitar formalmente la asignación de la institución {{institucionNombre}} para la realización de mis Prácticas Profesionales correspondientes al lapso académico {{lapsoInicio}} - {{lapsoFin}}.'),
('solicitud_institucion', 'firma', '___________________________________MSc. Marbelys del Valle RiveroDecana del Núcleo PortuguesaSegún Orden administrativa N° 0005 de fecha 18 de Marzo 2022'),
('carta_postulacion', 'cuerpo', 'Por medio de la presente, se solicita formalmente la Carta de Postulación para el(la) estudiante {{estudianteNombreCompleto}}, titular de la C.I. {{estudianteCi}}, cursante de la carrera {{carrera}}, {{semestre}} semestre, sección {{seccion}}, a fin de que pueda realizar sus Prácticas Profesionales en la institución {{institucionNombre}}. El(la) estudiante se encuentra en régimen {{regimen}} y {{empleo}} labora actualmente.'),
('acta_validacion', 'cuerpo', 'Se deja constancia que el(la) ciudadano(a) {{estudianteNombreCompleto}}, titular de la C.I. {{estudianteCi}}, cursante de la carrera {{carrera}}, ha cumplido con todos los requisitos académicos y administrativos establecidos para la validación de sus Prácticas Profesionales.'),
('evaluacion_final', 'encabezado', 'Se presenta la Evaluación Final de las Prácticas Profesionales realizadas por el(la) estudiante {{estudianteNombreCompleto}}, titular de la C.I. {{estudianteCi}}, de la carrera {{carrera}}, en la institución {{institucionNombre}}, durante el período comprendido entre {{fechaInicio}} y {{fechaFin}}.'),
('evaluacion_tutor_institucional', 'encabezado', 'Evaluación del Tutor Institucional correspondiente al(la) estudiante {{estudianteNombreCompleto}}, de la carrera {{carrera}}, realizada en el Departamento de {{departamento}} de la institución {{institucionNombre}}.'),
('evaluacion_tutor_academico', 'encabezado', 'Evaluación del Tutor Académico para el(la) estudiante {{estudianteNombreCompleto}}, titular de la C.I. {{estudianteCi}}, de la carrera {{carrera}}, durante el período {{periodo}}.'),
('evaluacion_comite', 'encabezado', 'Acta de Evaluación del Comité Evaluador para el(la) estudiante {{estudianteNombreCompleto}}, titular de la C.I. {{estudianteCi}}, de la carrera {{carrera}}, correspondiente al período académico {{periodo}}.'),
('constancia_tutor_academico', 'cuerpo', 'Por medio de la presente se hace constar que el(la) ciudadano(a) {{tutorTitulo}} {{tutorNombreCompleto}}, portador(a) de la C.I. {{tutorCi}}, se desempeña como Tutor(a) Académico(a) de Prácticas Profesionales, en condición {{tutorCondicion}}, con dedicación {{tutorDedicacion}}, cumpliendo un total de {{totalHours}} horas académicas, durante el período {{periodo}}.'),
('constancia_tutor_academico', 'firma', '___________________________________MSc. Marbelys del Valle RiveroDecana del Núcleo PortuguesaSegún Orden administrativa N° 0005 de fecha 18 de Marzo 2022'),
('constancia_tutor_institucional', 'cuerpo', 'Por medio de la presente se hace constar que el(la) ciudadano(a) {{tutorTitulo}} {{tutorNombreCompleto}}, portador(a) de la C.I. {{tutorCi}}, se desempeñó como Tutor(a) Institucional de Prácticas Profesionales en la institución {{institucionNombre}}, cumpliendo un total de {{totalHours}} horas de tutoría, durante el período {{periodo}}.'),
('constancia_tutor_institucional', 'firma', '___________________________________MSc. Marbelys del Valle RiveroDecana del Núcleo PortuguesaSegún Orden administrativa N° 0005 de fecha 18 de Marzo 2022')
ON CONFLICT ("REPORT_TYPE", "SECTION") DO NOTHING;
