-- ================================================================================
-- MIGRACIÓN: Sistema de Evaluaciones de Prácticas Profesionales
-- Fecha: 2026-02-18
-- Descripción: Tablas para gestión de evaluaciones con ítems detallados
-- ================================================================================

-- Drop tables if they exist (in reverse order due to foreign keys)
DROP TABLE IF EXISTS "t_evaluation_detail" CASCADE;
DROP TABLE IF EXISTS "t_evaluation" CASCADE;
DROP TABLE IF EXISTS "t_evaluation_criteria" CASCADE;

-- 1. Catálogo de criterios de evaluación (ítems predefinidos)
CREATE TABLE "t_evaluation_criteria" (
  "CRITERIA_ID" SERIAL PRIMARY KEY,
  "ITEM_NUMBER" INTEGER NOT NULL,
  "DESCRIPTION" VARCHAR(500) NOT NULL,
  "EVALUATOR_TYPE" VARCHAR(20) NOT NULL,
  "STATUS" SMALLINT DEFAULT 1
);

-- 2. Evaluaciones principales
CREATE TABLE "t_evaluation" (
  "EVALUATION_ID" SERIAL PRIMARY KEY,
  "PROFESSIONAL_PRACTICE_ID" INTEGER NOT NULL REFERENCES "t_professional_practices"("PROFESSIONAL_PRACTICE_ID"),
  "EVALUATOR_TYPE" VARCHAR(20) NOT NULL,
  "EVALUATOR_ID" INTEGER REFERENCES "t_user"("USER_ID"),
  "EVALUATOR_NAME" VARCHAR(255) NOT NULL,
  "EVALUATOR_CI" VARCHAR(20),
  "TOTAL_SCORE" DECIMAL(5,2) NOT NULL,
  "OBSERVATIONS" TEXT,
  "EVALUATION_DATE" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "REGISTERED_BY" INTEGER REFERENCES "t_user"("USER_ID"),
  "STATUS" SMALLINT DEFAULT 1
);

-- 3. Detalle de cada ítem evaluado
CREATE TABLE "t_evaluation_detail" (
  "DETAIL_ID" SERIAL PRIMARY KEY,
  "EVALUATION_ID" INTEGER NOT NULL REFERENCES "t_evaluation"("EVALUATION_ID") ON DELETE CASCADE,
  "CRITERIA_ID" INTEGER REFERENCES "t_evaluation_criteria"("CRITERIA_ID"),
  "ITEM_NUMBER" INTEGER NOT NULL,
  "SCORE" INTEGER NOT NULL,
  "STATUS" SMALLINT DEFAULT 1
);

-- Add CHECK constraint separately
ALTER TABLE "t_evaluation_detail" ADD CONSTRAINT "chk_score_range" CHECK ("SCORE" >= 1 AND "SCORE" <= 5);

-- 4. Campo adicional en prácticas para estado de evaluación
ALTER TABLE "t_professional_practices" 
ADD COLUMN IF NOT EXISTS "EVALUATION_STATUS" VARCHAR(20) DEFAULT 'pending';

-- ================================================================================
-- DATOS INICIALES: Criterios de Evaluación
-- ================================================================================

-- ANEXO D: Evaluación Tutor Institucional (20 ítems)
INSERT INTO "t_evaluation_criteria" ("ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES
(1, 'Cumplimiento del horario establecido', 'INSTITUCIONAL', 1),
(2, 'Capacidad para proponer sugerencias', 'INSTITUCIONAL', 1),
(3, 'Aporte de soluciones originales', 'INSTITUCIONAL', 1),
(4, 'Comunicación verbal y escrita', 'INSTITUCIONAL', 1),
(5, 'Receptividad a planteamientos', 'INSTITUCIONAL', 1),
(6, 'Responsabilidad en actividades asignadas', 'INSTITUCIONAL', 1),
(7, 'Cumplimiento de normas de seguridad', 'INSTITUCIONAL', 1),
(8, 'Disposición para colaborar', 'INSTITUCIONAL', 1),
(9, 'Adaptación a cambios', 'INSTITUCIONAL', 1),
(10, 'Participación y compromiso', 'INSTITUCIONAL', 1),
(11, 'Productividad en el trabajo', 'INSTITUCIONAL', 1),
(12, 'Calidad de resultados', 'INSTITUCIONAL', 1),
(13, 'Manejo de técnicas requeridas', 'INSTITUCIONAL', 1),
(14, 'Compromiso con metas organizacionales', 'INSTITUCIONAL', 1),
(15, 'Relaciones interpersonales', 'INSTITUCIONAL', 1),
(16, 'Manejo de herramientas informáticas', 'INSTITUCIONAL', 1),
(17, 'Disposición para aprender', 'INSTITUCIONAL', 1),
(18, 'Obtener y compartir información', 'INSTITUCIONAL', 1),
(19, 'Trabajo bajo presión', 'INSTITUCIONAL', 1),
(20, 'Trabajo en equipo', 'INSTITUCIONAL', 1);

-- ANEXO E: Evaluación Tutor Académico (20 ítems)
INSERT INTO "t_evaluation_criteria" ("ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES
(1, 'Cumplimiento del horario de prácticas', 'ACADEMICO', 1),
(2, 'Aplicación de conocimientos teóricos', 'ACADEMICO', 1),
(3, 'Capacidad de análisis', 'ACADEMICO', 1),
(4, 'Redacción y ortografía', 'ACADEMICO', 1),
(5, 'Organización del trabajo', 'ACADEMICO', 1),
(6, 'Puntualidad en entregas', 'ACADEMICO', 1),
(7, 'Seguimiento de instrucciones', 'ACADEMICO', 1),
(8, 'Iniciativa y proactividad', 'ACADEMICO', 1),
(9, 'Resolución de problemas', 'ACADEMICO', 1),
(10, 'Actitud hacia el aprendizaje', 'ACADEMICO', 1),
(11, 'Calidad del informe de práctica', 'ACADEMICO', 1),
(12, 'Profundidad en el desarrollo de actividades', 'ACADEMICO', 1),
(13, 'Uso de recursos y materiales', 'ACADEMICO', 1),
(14, 'Integración teoría-práctica', 'ACADEMICO', 1),
(15, 'Comunicación con el tutor', 'ACADEMICO', 1),
(16, 'Cumplimiento de objetivos', 'ACADEMICO', 1),
(17, 'Creatividad e innovación', 'ACADEMICO', 1),
(18, 'Responsabilidad ética', 'ACADEMICO', 1),
(19, 'Adaptabilidad al ambiente laboral', 'ACADEMICO', 1),
(20, 'Desempeño general', 'ACADEMICO', 1);

-- ANEXO F: Comité Evaluador (15 ítems)
INSERT INTO "t_evaluation_criteria" ("ITEM_NUMBER", "DESCRIPTION", "EVALUATOR_TYPE", "STATUS") VALUES
(1, 'Vocabulario apropiado', 'COMITE', 1),
(2, 'Volumen de voz adecuado', 'COMITE', 1),
(3, 'Contacto visual con el público', 'COMITE', 1),
(4, 'Elegancia en apariencia personal', 'COMITE', 1),
(5, 'Dominio del tema presentado', 'COMITE', 1),
(6, 'Uso adecuado del tiempo', 'COMITE', 1),
(7, 'Calidad de ayudas audiovisuales', 'COMITE', 1),
(8, 'Coherencia de ayudas visuales', 'COMITE', 1),
(9, 'Explicación de la razón de ser de la PP', 'COMITE', 1),
(10, 'Descripción de actividades realizadas', 'COMITE', 1),
(11, 'Conocimiento obtenido durante la práctica', 'COMITE', 1),
(12, 'Claridad en las conclusiones', 'COMITE', 1),
(13, 'Recomendaciones propuestas', 'COMITE', 1),
(14, 'Definición de conceptos técnicos', 'COMITE', 1),
(15, 'Respuestas a preguntas del comité', 'COMITE', 1);

-- ================================================================================
-- ÍNDICES
-- ================================================================================
CREATE INDEX IF NOT EXISTS idx_evaluation_practice ON "t_evaluation"("PROFESSIONAL_PRACTICE_ID");
CREATE INDEX IF NOT EXISTS idx_evaluation_type ON "t_evaluation"("EVALUATOR_TYPE");
CREATE INDEX IF NOT EXISTS idx_evaluation_detail_eval ON "t_evaluation_detail"("EVALUATION_ID");
CREATE INDEX IF NOT EXISTS idx_criteria_type ON "t_evaluation_criteria"("EVALUATOR_TYPE");

-- ================================================================================
-- VERIFICACIÓN
-- ================================================================================
SELECT 
  't_evaluation_criteria' as tabla,
  COUNT(*) as registros,
  'Catálogo de criterios' as descripcion
FROM "t_evaluation_criteria"
UNION ALL
SELECT 
  't_evaluation' as tabla,
  COUNT(*) as registros,
  'Evaluaciones registradas' as descripcion
FROM "t_evaluation";
