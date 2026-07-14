/**
 * @file test-scenarios-enrollment-processes.sql
 * @description Scripts SQL para preparar escenarios de prueba en Supabase
 *              cubriendo los 4 procesos de inscripción de estudiantes:
 *                1. Retiro Justificado (RETIRO_JUSTIFICADO = 5)
 *                2. Abandono (RETIRADO = 0)
 *                3. Reprobado (REPROBADO = 4)
 *                4. Aprobado / Culminado (CULMINADO = 3)
 *
 * @context REGLA SECUENCIAL (D-05):
 *   Para inscribir una práctica de PRIORITY mayor (ej: COMUNITARIA P=2),
 *   se requiere que la práctica ANTERIOR (HOSPITALARIA P=1) esté CULMINADA
 *   con nota >= MINIMUM_GRADE de la carrera.
 *
 *   Si la práctica anterior está en RETIRADO/REPROBADO/RETIRO_JUSTIFICADO,
 *   el sistema BLOQUEA la inscripción con un mensaje específico.
 *
 * @usage Ejecutar cada bloque en orden, o usar el bloque independiente que
 *        necesites. Los IDs de ejemplo son genéricos — ajusta según tu DB.
 *
 * ⚠️ IMPORTANTE: Reemplaza los IDs de ejemplo con IDs reales de tu base de datos.
 *    Usa SELECT para verificar IDs antes de ejecutar INSERTs/UPDATEs.
 */

-- ============================================================
-- VERIFICACIÓN INICIAL: Conoce tu estructura actual
-- ============================================================

-- 1. Verifica los tipos de práctica y sus priorities
-- EXPECTED: ÚNICA(P=0), HOSPITALARIA(P=1), COMUNITARIA(P=2)
SELECT "INTERNSHIP_TYPE_ID", "NAME", "PRIORITY"
FROM "t_internship_type"
WHERE "STATUS" = 1
ORDER BY "PRIORITY";

-- 2. Verifica las carreras y su nota mínima
SELECT "CAREER_ID", "CAREER_NAME", "MINIMUM_GRADE"
FROM "t_career"
WHERE "STATUS" = 1;

-- 3. Verifica qué tipos de práctica tiene asignada cada carrera
SELECT
  c."CAREER_NAME",
  it."NAME" AS internship_type,
  it."PRIORITY"
FROM "t_career_internship_type" cit
JOIN "t_career" c ON c."CAREER_ID" = cit."CAREER_ID"
JOIN "t_internship_type" it ON it."INTERNSHIP_TYPE_ID" = cit."INTERNSHIP_TYPE_ID"
WHERE c."STATUS" = 1 AND it."STATUS" = 1
ORDER BY c."CAREER_ID", it."PRIORITY";

-- 4. Verifica períodos disponibles
SELECT "PERIOD_ID", "DESCRIPTION", "START_DATE", "END_DATE", "STATUS"
FROM "t_internships_period"
ORDER BY "PERIOD_ID" DESC
LIMIT 5;

-- 5. Verifica estudiantes existentes
SELECT "STUDENTS_ID", "STUDENTS_CI", "NAME", "SURNAME", "STATUS"
FROM "t_students"
WHERE "STATUS" = 1
LIMIT 10;


-- ============================================================
-- ESCENARIO 1: RETIRO JUSTIFICADO
-- ============================================================
-- ¿Qué es? El estudiante se retiró de la práctica con justificación
--           (enfermedad, emergencia familiar, etc.)
-- PRACTICES_STATUS = 5 (RETIRO_JUSTIFICADO)
-- WITHDRAWAL_TYPE = 'justified'
--
-- COMPORTAMIENTO ESPERADO AL INTENTAR NUEVA INSCRIPCIÓN:
--   → Si intenta inscribir la MISMA práctica (P=1): PERMITIDO
--     (puede reinscribirse en el siguiente período)
--   → Si intenta inscribir la SIGUIENTE práctica (P=2):
--     BLOQUEADO con banner AZUL
--     Mensaje: "la práctica [Nombre] tiene un retiro justificado pendiente.
--              Puede reinscribirse en el siguiente período."
--     → NO puede continuar con la práctica superior
--
-- UI: Banner AZUL (border-blue-300, bg-blue-50) con icono ⚠️
--     + texto "El estudiante puede reinscribirse en el siguiente período
--       en el mismo tipo de práctica."
-- ============================================================

-- Crear práctica HOSPITALARIA (P=1) con RETIRO_JUSTIFICADO
-- Ajusta los IDs según tu base de datos
INSERT INTO "t_professional_practices" (
  "START_DATE", "END_DATE", "REPORT_TITLE", "REGISTRATION_DATE", "CREATION_DATE",
  "GRADE", "TRANSFER", "TOUR", "PERIOD_ID", "INSTITUTION_ID",
  "STUDENTS_ID", "STATUS", "MANAGER_ID", "OBSERVATION", "ENROLLMENT",
  "INTERNSHIP_STATUS", "INTERNSHIP_TYPE_ID", "PRACTICES_STATUS",
  "EVALUATION_STATUS", "SEMESTER", "SECTION", "REGIME", "CAREER_ID"
) VALUES (
  '2025-09-01', '2025-12-15',
  'Práctica Hospitalaria - Retiro Justificado',
  NOW(), NOW(),
  0, 0, 'N/A',
  (SELECT "PERIOD_ID" FROM "t_internships_period" WHERE "STATUS" = 1 ORDER BY "PERIOD_ID" DESC LIMIT 1 OFFSET 1),
  1,  -- INSTITUTION_ID: ajustar
  (SELECT "STUDENTS_ID" FROM "t_students" WHERE "STATUS" = 1 LIMIT 1),
  1,  -- STATUS = activo
  NULL,
  'RETIRO CON JUSTIFICATIVO: Motivo médico documentado con certificado del seguro social.',
  'N/A',
  1,
  2,  -- INTERNSHIP_TYPE_ID = 2 (HOSPITALARIA, P=1)
  5,  -- PRACTICES_STATUS = 5 (RETIRO_JUSTIFICADO)
  'pending',
  '2025-I', 'A', 'DIURNO',
  4   -- CAREER_ID: INGENIERIA INFORMATICA (ajustar)
);

-- Verificar que se creó correctamente
SELECT
  pp."PROFESSIONAL_PRACTICE_ID",
  s."STUDENTS_CI" || ' ' || s."NAME" || ' ' || s."SURNAME" AS student,
  it."NAME" AS practice_type,
  it."PRIORITY",
  pp."PRACTICES_STATUS",
  CASE pp."PRACTICES_STATUS"
    WHEN 0 THEN 'RETIRADO'
    WHEN 1 THEN 'PRE_INSCRITO'
    WHEN 2 THEN 'INSCRITO'
    WHEN 3 THEN 'CULMINADO'
    WHEN 4 THEN 'REPROBADO'
    WHEN 5 THEN 'RETIRO_JUSTIFICADO'
  END AS status_name,
  pp."OBSERVATION"
FROM "t_professional_practices" pp
JOIN "t_students" s ON s."STUDENTS_ID" = pp."STUDENTS_ID"
JOIN "t_internship_type" it ON it."INTERNSHIP_TYPE_ID" = pp."INTERNSHIP_TYPE_ID"
WHERE pp."PRACTICES_STATUS" = 5
ORDER BY pp."PROFESSIONAL_PRACTICE_ID" DESC
LIMIT 5;


-- ============================================================
-- ESCENARIO 2: ABANDONO (RETIRADO sin justificativo)
-- ============================================================
-- ¿Qué es? El estudiante abandonó la práctica sin justificación.
--           PRACTICES_STATUS = 0 (RETIRADO)
--           WITHDRAWAL_TYPE = 'unjustified'
--
-- COMPORTAMIENTO ESPERADO AL INTENTAR NUEVA INSCRIPCIÓN:
--   → Si intenta inscribir la MISMA práctica (P=1): RESTRINGIDO
--   → Si intenta inscribir la SIGUIENTE práctica (P=2):
--     BLOQUEADO con banner ROJO
--     Mensaje: "la práctica [Nombre] fue retirado en un período anterior.
--              Debe esperar hasta el próximo año lectivo para reintentar."
--     → NO puede continuar con la práctica superior
--     → NO se muestra guía de reinscripción
--
-- UI: Banner ROJO (border-red-300, bg-red-50) con icono ⚠️
--     + texto "El estudiante no aparecerá en las listas de asistencia actuales."
-- ============================================================

-- Crear práctica HOSPITALARIA (P=1) con RETIRADO (abandono)
INSERT INTO "t_professional_practices" (
  "START_DATE", "END_DATE", "REPORT_TITLE", "REGISTRATION_DATE", "CREATION_DATE",
  "GRADE", "TRANSFER", "TOUR", "PERIOD_ID", "INSTITUTION_ID",
  "STUDENTS_ID", "STATUS", "MANAGER_ID", "OBSERVATION", "ENROLLMENT",
  "INTERNSHIP_STATUS", "INTERNSHIP_TYPE_ID", "PRACTICES_STATUS",
  "EVALUATION_STATUS", "SEMESTER", "SECTION", "REGIME", "CAREER_ID"
) VALUES (
  '2025-09-01', '2025-12-15',
  'Práctica Hospitalaria - Abandono',
  NOW(), NOW(),
  0, 0, 'N/A',
  (SELECT "PERIOD_ID" FROM "t_internships_period" WHERE "STATUS" = 1 ORDER BY "PERIOD_ID" DESC LIMIT 1 OFFSET 1),
  1,  -- INSTITUTION_ID: ajustar
  (SELECT "STUDENTS_ID" FROM "t_students" WHERE "STATUS" = 1 LIMIT 1 OFFSET 1),
  1,
  NULL,
  'RETIRO SIN JUSTIFICATIVO: Estudiante no se presentó en más de 15 días consecutivos.',
  'N/A',
  1,
  2,  -- HOSPITALARIA (P=1)
  0,  -- PRACTICES_STATUS = 0 (RETIRADO)
  'pending',
  '2025-I', 'A', 'DIURNO',
  4
);

-- Verificar
SELECT
  pp."PROFESSIONAL_PRACTICE_ID",
  s."STUDENTS_CI" || ' ' || s."NAME" || ' ' || s."SURNAME" AS student,
  it."NAME" AS practice_type,
  it."PRIORITY",
  pp."PRACTICES_STATUS" AS status_code,
  'RETIRADO (Abandono)' AS status_name,
  pp."OBSERVATION"
FROM "t_professional_practices" pp
JOIN "t_students" s ON s."STUDENTS_ID" = pp."STUDENTS_ID"
JOIN "t_internship_type" it ON it."INTERNSHIP_TYPE_ID" = pp."INTERNSHIP_TYPE_ID"
WHERE pp."PRACTICES_STATUS" = 0
ORDER BY pp."PROFESSIONAL_PRACTICE_ID" DESC
LIMIT 5;


-- ============================================================
-- ESCENARIO 3: REPROBADO
-- ============================================================
-- ¿Qué es? El estudiante reprobó la práctica (calificación insuficiente).
--           PRACTICES_STATUS = 4 (REPROBADO)
--
-- COMPORTAMIENTO ESPERADO AL INTENTAR NUEVA INSCRIPCIÓN:
--   → Si intenta inscribir la MISMA práctica (P=1): PERMITIDO
--     (puede volver a intentar)
--   → Si intenta inscribir la SIGUIENTE práctica (P=2):
--     BLOQUEADO con banner ROJO
--     Mensaje: "la práctica [Nombre] fue reprobado en un período anterior.
--              Debe esperar hasta el próximo año lectivo para reintentar."
--     → NO puede continuar con la práctica superior
--     → NO se muestra guía de reinscripción
--     → PRIORIDAD: Si tiene REPROBADO + RETIRO_JUSTIFICADO, prevalece REPROBADO
--
-- UI: Banner ROJO (border-red-300, bg-red-50) con icono ⚠️
-- ============================================================

-- Crear práctica HOSPITALARIA (P=1) con REPROBADO
INSERT INTO "t_professional_practices" (
  "START_DATE", "END_DATE", "REPORT_TITLE", "REGISTRATION_DATE", "CREATION_DATE",
  "GRADE", "TRANSFER", "TOUR", "PERIOD_ID", "INSTITUTION_ID",
  "STUDENTS_ID", "STATUS", "MANAGER_ID", "OBSERVATION", "ENROLLMENT",
  "INTERNSHIP_STATUS", "INTERNSHIP_TYPE_ID", "PRACTICES_STATUS",
  "EVALUATION_STATUS", "SEMESTER", "SECTION", "REGIME", "CAREER_ID"
) VALUES (
  '2025-09-01', '2025-12-15',
  'Práctica Hospitalaria - Reprobado',
  NOW(), NOW(),
  8.50, 0, 'N/A',  -- GRADE = 8.50 (por debajo de MINIMUM_GRADE = 15)
  (SELECT "PERIOD_ID" FROM "t_internships_period" WHERE "STATUS" = 1 ORDER BY "PERIOD_ID" DESC LIMIT 1 OFFSET 1),
  1,
  (SELECT "STUDENTS_ID" FROM "t_students" WHERE "STATUS" = 1 LIMIT 1 OFFSET 2),
  1,
  NULL,
  'Evaluación final: 8.50/20. Calificación inferior al mínimo requerido (15).',
  'N/A',
  1,
  2,  -- HOSPITALARIA (P=1)
  4,  -- PRACTICES_STATUS = 4 (REPROBADO)
  'pending',
  '2025-I', 'A', 'DIURNO',
  4
);

-- Verificar
SELECT
  pp."PROFESSIONAL_PRACTICE_ID",
  s."STUDENTS_CI" || ' ' || s."NAME" || ' ' || s."SURNAME" AS student,
  it."NAME" AS practice_type,
  it."PRIORITY",
  pp."PRACTICES_STATUS" AS status_code,
  'REPROBADO' AS status_name,
  pp."GRADE",
  c."MINIMUM_GRADE" AS min_grade_required,
  pp."OBSERVATION"
FROM "t_professional_practices" pp
JOIN "t_students" s ON s."STUDENTS_ID" = pp."STUDENTS_ID"
JOIN "t_internship_type" it ON it."INTERNSHIP_TYPE_ID" = pp."INTERNSHIP_TYPE_ID"
JOIN "t_career" c ON c."CAREER_ID" = pp."CAREER_ID"
WHERE pp."PRACTICES_STATUS" = 4
ORDER BY pp."PROFESSIONAL_PRACTICE_ID" DESC
LIMIT 5;


-- ============================================================
-- ESCENARIO 4: APROBADO / CULMINADO (no puede reinscribir)
-- ============================================================
-- ¿Qué es? El estudiante aprobó la práctica con nota suficiente.
--           PRACTICES_STATUS = 3 (CULMINADO)
--           GRADE >= MINIMUM_GRADE de la carrera
--
-- COMPORTAMIENTO ESPERADO AL INTENTAR NUEVA INSCRIPCIÓN:
--   → Si intenta inscribir la MISMA práctica (P=1):
--     BLOQUEADO - El tipo ya aparece en "excluidos"
--     (completedTypes en el controller filtra CULMINADO)
--   → Si intenta inscribir la SIGUIENTE práctica (P=2):
--     PERMITIDO ✓ (la secuencia está cumplida)
--   → Si intenta reinscribir la misma carrera con práctica ÚNICA (P=0):
--     BLOQUEADO - Ya tiene CULMINADA esa práctica
--
-- UI: El tipo de práctica NO aparece en el dropdown de selección
--     (o aparece deshabilitado/oculto)
-- ============================================================

-- Crear práctica HOSPITALARIA (P=1) con CULMINADO (aprobado)
INSERT INTO "t_professional_practices" (
  "START_DATE", "END_DATE", "REPORT_TITLE", "REGISTRATION_DATE", "CREATION_DATE",
  "GRADE", "TRANSFER", "TOUR", "PERIOD_ID", "INSTITUTION_ID",
  "STUDENTS_ID", "STATUS", "MANAGER_ID", "OBSERVATION", "ENROLLMENT",
  "INTERNSHIP_STATUS", "INTERNSHIP_TYPE_ID", "PRACTICES_STATUS",
  "EVALUATION_STATUS", "SEMESTER", "SECTION", "REGIME", "CAREER_ID"
) VALUES (
  '2025-09-01', '2025-12-15',
  'Práctica Hospitalaria - Aprobada',
  NOW(), NOW(),
  17.50, 0, 'N/A',  -- GRADE = 17.50 (por encima de MINIMUM_GRADE = 15)
  (SELECT "PERIOD_ID" FROM "t_internships_period" WHERE "STATUS" = 1 ORDER BY "PERIOD_ID" DESC LIMIT 1 OFFSET 1),
  1,
  (SELECT "STUDENTS_ID" FROM "t_students" WHERE "STATUS" = 1 LIMIT 1 OFFSET 3),
  1,
  NULL,
  'Evaluación final: 17.50/20. Prueba aprobada satisfactoriamente.',
  'N/A',
  1,
  2,  -- HOSPITALARIA (P=1)
  3,  -- PRACTICES_STATUS = 3 (CULMINADO)
  'completed',
  '2025-I', 'A', 'DIURNO',
  4
);

-- Verificar
SELECT
  pp."PROFESSIONAL_PRACTICE_ID",
  s."STUDENTS_CI" || ' ' || s."NAME" || ' ' || s."SURNAME" AS student,
  it."NAME" AS practice_type,
  it."PRIORITY",
  pp."PRACTICES_STATUS" AS status_code,
  'CULMINADO (Aprobado)' AS status_name,
  pp."GRADE",
  c."MINIMUM_GRADE" AS min_grade_required,
  CASE WHEN pp."GRADE" >= c."MINIMUM_GRADE" THEN '✓ APROBADO' ELSE '✗ REPROBADO' END AS result
FROM "t_professional_practices" pp
JOIN "t_students" s ON s."STUDENTS_ID" = pp."STUDENTS_ID"
JOIN "t_internship_type" it ON it."INTERNSHIP_TYPE_ID" = pp."INTERNSHIP_TYPE_ID"
JOIN "t_career" c ON c."CAREER_ID" = pp."CAREER_ID"
WHERE pp."PRACTICES_STATUS" = 3
ORDER BY pp."PROFESSIONAL_PRACTICE_ID" DESC
LIMIT 5;


-- ============================================================
-- CONSULTA RESUMEN: Ver todos los escenarios de un estudiante
-- ============================================================

-- Ver el historial completo de prácticas de un estudiante específico
-- (Reemplaza :student_ci con la cédula del estudiante de prueba)
/*
SELECT
  s."STUDENTS_CI",
  s."NAME" || ' ' || s."SURNAME" AS student_name,
  c."CAREER_NAME",
  it."NAME" AS practice_type,
  it."PRIORITY",
  pp."PRACTICES_STATUS",
  CASE pp."PRACTICES_STATUS"
    WHEN 0 THEN '❌ RETIRADO (Abandono)'
    WHEN 1 THEN '📝 PRE_INSCRITO'
    WHEN 2 THEN '✅ INSCRITO'
    WHEN 3 THEN '🎓 CULMINADO (Aprobado)'
    WHEN 4 THEN '❌ REPROBADO'
    WHEN 5 THEN '⚠️ RETIRO_JUSTIFICADO'
  END AS status_label,
  pp."GRADE",
  pp."OBSERVATION",
  ip."DESCRIPTION" AS period
FROM "t_professional_practices" pp
JOIN "t_students" s ON s."STUDENTS_ID" = pp."STUDENTS_ID"
JOIN "t_internship_type" it ON it."INTERNSHIP_TYPE_ID" = pp."INTERNSHIP_TYPE_ID"
JOIN "t_career" c ON c."CAREER_ID" = pp."CAREER_ID"
JOIN "t_internships_period" ip ON ip."PERIOD_ID" = pp."PERIOD_ID"
WHERE s."STUDENTS_CI" = :student_ci
  AND pp."STATUS" = 1
ORDER BY it."PRIORITY", ip."START_DATE" DESC;
*/


-- ============================================================
-- VERIFICACIÓN DE BLOQUEO SECUENCIAL (D-05)
-- ============================================================

-- ¿Qué prácticas bloquean la inscripción a COMUNITARIA (P=2)?
-- Respuesta: cualquier práctica HOSPITALARIA (P=1) del mismo estudiante
--            que NO esté CULMINADO con nota suficiente.

SELECT
  s."STUDENTS_CI",
  s."NAME" || ' ' || s."SURNAME" AS student_name,
  c."CAREER_NAME",
  it_prereq."NAME" AS prerequisite_type,
  it_prereq."PRIORITY" AS prereq_priority,
  it_current."NAME" AS current_type,
  it_current."PRIORITY" AS current_priority,
  pp."PRACTICES_STATUS",
  CASE pp."PRACTICES_STATUS"
    WHEN 0 THEN 'RETIRADO → BLOQUEADO (banner ROJO)'
    WHEN 3 THEN 'CULMINADO → PERMITIDO inscribir siguiente'
    WHEN 4 THEN 'REPROBADO → BLOQUEADO (banner ROJO)'
    WHEN 5 THEN 'RETIRO_JUSTIFICADO → BLOQUEADO (banner AZUL)'
    ELSE 'ESTADO NO BLOQUEANTE'
  END AS enrollment_effect,
  pp."GRADE"
FROM "t_professional_practices" pp
JOIN "t_students" s ON s."STUDENTS_ID" = pp."STUDENTS_ID"
JOIN "t_internship_type" it_prereq ON it_prereq."INTERNSHIP_TYPE_ID" = pp."INTERNSHIP_TYPE_ID"
JOIN "t_career_internship_type" cit ON cit."CAREER_ID" = pp."CAREER_ID"
JOIN "t_internship_type" it_current ON it_current."INTERNSHIP_TYPE_ID" = cit."INTERNSHIP_TYPE_ID"
JOIN "t_career" c ON c."CAREER_ID" = pp."CAREER_ID"
WHERE pp."STATUS" = 1
  AND it_current."PRIORITY" > it_prereq."PRIORITY"  -- La actual es mayor que la prerequisito
  AND it_prereq."PRIORITY" > 0                       -- Excluir ÚNICA (standalone)
ORDER BY s."STUDENTS_ID", it_current."PRIORITY";


-- ============================================================
-- SCRIPT DE PRUEBA RÁPIDA: Crear los 4 escenarios con un solo estudiante
-- ============================================================

-- PASO 1: Seleccionar un estudiante de prueba
-- Guarda su STUDENTS_ID en una variable:
-- SELECT "STUDENTS_ID" FROM "t_students" WHERE "STATUS" = 1 LIMIT 1;

-- PASO 2: Crear las 4 prácticas (ejecutar una por una)
-- Reemplaza :student_id con el ID del paso 1

/*
-- Escenario A: Retiro Justificado
INSERT INTO "t_professional_practices"
  ("START_DATE","END_DATE","REPORT_TITLE","REGISTRATION_DATE","CREATION_DATE",
   "GRADE","TRANSFER","TOUR","PERIOD_ID","INSTITUTION_ID","STUDENTS_ID","STATUS",
   "MANAGER_ID","OBSERVATION","ENROLLMENT","INTERNSHIP_STATUS","INTERNSHIP_TYPE_ID",
   "PRACTICES_STATUS","EVALUATION_STATUS","SEMESTER","SECTION","REGIME","CAREER_ID")
VALUES
  ('2024-09-01','2024-12-15','HOSP-RJ',NOW(),NOW(),
   0,0,'N/A',
   (SELECT "PERIOD_ID" FROM "t_internships_period" ORDER BY "PERIOD_ID" DESC LIMIT 1 OFFSET 1),
   1,:student_id,1,NULL,
   'RETIRO CON JUSTIFICATIVO: Enfermedad prolongada documentada.',
   'N/A',1,2,5,'pending','2024-I','A','DIURNO',4);

-- Escenario B: Abandono (Retirado)
INSERT INTO "t_professional_practices"
  ("START_DATE","END_DATE","REPORT_TITLE","REGISTRATION_DATE","CREATION_DATE",
   "GRADE","TRANSFER","TOUR","PERIOD_ID","INSTITUTION_ID","STUDENTS_ID","STATUS",
   "MANAGER_ID","OBSERVATION","ENROLLMENT","INTERNSHIP_STATUS","INTERNSHIP_TYPE_ID",
   "PRACTICES_STATUS","EVALUATION_STATUS","SEMESTER","SECTION","REGIME","CAREER_ID")
VALUES
  ('2024-09-01','2024-12-15','HOSP-AB',NOW(),NOW(),
   0,0,'N/A',
   (SELECT "PERIOD_ID" FROM "t_internships_period" ORDER BY "PERIOD_ID" DESC LIMIT 1 OFFSET 2),
   1,:student_id,1,NULL,
   'RETIRO SIN JUSTIFICATIVO: No se presentó por 20 días.',
   'N/A',1,2,0,'pending','2024-I','B','DIURNO',4);

-- Escenario C: Reprobado
INSERT INTO "t_professional_practices"
  ("START_DATE","END_DATE","REPORT_TITLE","REGISTRATION_DATE","CREATION_DATE",
   "GRADE","TRANSFER","TOUR","PERIOD_ID","INSTITUTION_ID","STUDENTS_ID","STATUS",
   "MANAGER_ID","OBSERVATION","ENROLLMENT","INTERNSHIP_STATUS","INTERNSHIP_TYPE_ID",
   "PRACTICES_STATUS","EVALUATION_STATUS","SEMESTER","SECTION","REGIME","CAREER_ID")
VALUES
  ('2023-09-01','2023-12-15','HOSP-RE',NOW(),NOW(),
   8.50,0,'N/A',
   (SELECT "PERIOD_ID" FROM "t_internships_period" ORDER BY "PERIOD_ID" DESC LIMIT 1 OFFSET 3),
   1,:student_id,1,NULL,
   'Evaluación final: 8.50/20. Reprobado.',
   'N/A',1,2,4,'pending','2023-I','A','DIURNO',4);

-- Escenario D: Aprobado (Culminado)
INSERT INTO "t_professional_practices"
  ("START_DATE","END_DATE","REPORT_TITLE","REGISTRATION_DATE","CREATION_DATE",
   "GRADE","TRANSFER","TOUR","PERIOD_ID","INSTITUTION_ID","STUDENTS_ID","STATUS",
   "MANAGER_ID","OBSERVATION","ENROLLMENT","INTERNSHIP_STATUS","INTERNSHIP_TYPE_ID",
   "PRACTICES_STATUS","EVALUATION_STATUS","SEMESTER","SECTION","REGIME","CAREER_ID")
VALUES
  ('2023-03-01','2023-06-15','HOSP-AP',NOW(),NOW(),
   17.50,0,'N/A',
   (SELECT "PERIOD_ID" FROM "t_internships_period" ORDER BY "PERIOD_ID" DESC LIMIT 1 OFFSET 4),
   1,:student_id,1,NULL,
   'Evaluación final: 17.50/20. Aprobado.',
   'N/A',1,2,3,'completed','2023-I','A','DIURNO',4);
*/


-- ============================================================
-- LIMPIEZA: Si necesitas revertir los datos de prueba
-- ============================================================
-- ⚠️ CUIDADO: Esto elimina los registros creados arriba
/*
DELETE FROM "t_professional_practices"
WHERE "OBSERVATION" LIKE '%RETIRO CON JUSTIFICATIVO: Motivo médico%'
   OR "OBSERVATION" LIKE '%RETIRO SIN JUSTIFICATIVO: Estudiante no se presentó%'
   OR "OBSERVATION" LIKE '%Calificación inferior al mínimo%'
   OR "OBSERVATION" LIKE '%Prueba aprobada satisfactoriamente%';
*/
