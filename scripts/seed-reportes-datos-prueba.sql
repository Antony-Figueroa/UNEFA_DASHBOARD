-- ============================================================
-- SEED DATA: Datos de prueba para Reportes UNEFA Dashboard
-- ============================================================
-- Genera datos suficientes para ver TODOS los reportes
-- (Acta Notas, Evaluaciones Consolidadas, Relación Individual Docente,
--  Tutores Académicos, Resumen Pasantías, Relación Empresas, etc.)
-- ============================================================
-- USO: Ejecutar en SQL Editor de Supabase (consultas SQL)
-- ============================================================

-- ============================================================
-- 1. PERIODOS ACADÉMICOS
-- ============================================================
INSERT INTO t_internships_period (START_DATE, END_DATE, CREATION_DATE, DESCRIPTION, PERIOD_STATUS, STATUS, T_INTERNSHIPS_CODE)
VALUES
('2025-01-15', '2025-07-15', NOW(), '1-2025', 'ACTIVO', 1, '1-2025'),
('2025-08-01', '2026-02-01', NOW(), '2-2025', 'ACTIVO', 1, '2-2025');

-- ============================================================
-- 2. CARRERAS
-- ============================================================
INSERT INTO t_career (CAREER_NAME, CAREER_CODE, MINIMUM_GRADE, CAREER_ABBREVIATION, CREATION_DATE, MODIF_USER_ID, MODIF_USER_DATE, ELIM_USER_ID, ELIM_USER_DATE, REST_USER_ID, REST_USER_DATE, STATUS, CAREER_TYPE, SEMESTER)
VALUES
('Ingeniería en Informática', 'INF', 10.00, 'ING. INF.', NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1, 'LARGA', '8'),
('Licenciatura en Enfermería', 'ENF', 10.00, 'LIC. ENF.', NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1, 'LARGA', '8'),
('Administración de Desastres', 'DES', 10.00, 'ADM. DES.', NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1, 'CORTA', '6'),
('Ingeniería Civil', 'CIV', 10.00, 'ING. CIV.', NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1, 'LARGA', '10'),
('Medicina Integral Comunitaria', 'MIC', 10.00, 'MED. INT.', NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1, 'LARGA', '6');

-- ============================================================
-- 3. TIPOS DE PASANTÍA
-- ============================================================
INSERT INTO t_internship_type (NAME, PRIORITY, CREATION_DATE, STATUS, HOURS_REQUIRED)
VALUES
('COMUNITARIA', 1, NOW(), 1, 360),
('HOSPITALARIA', 2, NOW(), 1, 480),
('EMPRESARIAL', 3, NOW(), 1, 360);

-- ============================================================
-- 4. RELACIONES CARRERA-TIPO
-- ============================================================
INSERT INTO t_career_internship_type (CAREER_ID, INTERNSHIP_TYPE_ID)
SELECT c.CAREER_ID, t.INTERNSHIP_TYPE_ID
FROM t_career c, t_internship_type t
WHERE c.CAREER_CODE IN ('INF', 'ENF', 'DES', 'CIV', 'MIC')
  AND t.NAME IN ('COMUNITARIA', 'HOSPITALARIA', 'EMPRESARIAL');

-- ============================================================
-- 5. PERSONAS (registro unificado)
-- ============================================================
INSERT INTO t_persons (ci, first_name, middle_name, last_name, second_last_name, email, phone, gender, status)
VALUES
('V-12345678', 'MARÍA', 'JOSÉ', 'GARCÍA', 'LÓPEZ', 'maria.garcia@email.com', '04121234567', 'F', 1),
('V-23456789', 'JUAN', 'CARLOS', 'MARTÍNEZ', 'PÉREZ', 'juan.martinez@email.com', '04122345678', 'M', 1),
('V-34567890', 'ANA', 'ISABEL', 'RODRÍGUEZ', 'SÁNCHEZ', 'ana.rodriguez@email.com', '04123456789', 'F', 1),
('V-45678901', 'PEDRO', 'LUIS', 'GONZÁLEZ', 'DÍAZ', 'pedro.gonzalez@email.com', '04124567890', 'M', 1),
('V-56789012', 'CARMEN', 'ELENA', 'FERNÁNDEZ', 'RUIZ', 'carmen.fernandez@email.com', '04125678901', 'F', 1),
('V-67890123', 'LUIS', 'ALBERTO', 'TORRES', 'MORENO', 'luis.torres@email.com', '04126789012', 'M', 1),
('V-78901234', 'LAURA', 'MARINA', 'RAMÍREZ', 'CASTILLO', 'laura.ramirez@email.com', '04127890123', 'F', 1),
('V-89012345', 'CARLOS', 'ENRIQUE', 'VARGAS', 'MOLINA', 'carlos.vargas@email.com', '04128901234', 'M', 1),
('V-90123456', 'SOFÍA', 'MERCEDES', 'DELGADO', 'ORTEGA', 'sofia.delgado@email.com', '04129012345', 'F', 1),
('V-11111111', 'JOSÉ', 'RAFAEL', 'MENDOZA', 'PARRA', 'jose.mendoza@email.com', '04121111111', 'M', 1),
('V-22222222', 'DANIELA', 'ALEJANDRA', 'PAREDES', 'GUZMÁN', 'daniela.paredes@email.com', '04122222222', 'F', 1),
('V-33333333', 'ANDRÉS', 'FELIPE', 'CASTRO', 'VARGAS', 'andres.castro@email.com', '04123333333', 'M', 1),
('V-44444444', 'MIGUEL', 'ANGEL', 'RIVERA', 'CORDERO', 'miguel.rivera@email.com', '04124444444', 'M', 1),
('V-55555555', 'ALEJANDRA', 'MARÍA', 'SILVA', 'ROJAS', 'alejandra.silva@email.com', '04125555555', 'F', 1);

-- ============================================================
-- 6. ESTUDIANTES (14 estudiantes)
-- ============================================================
INSERT INTO t_students (person_id, STUDENTS_CI, NAME, SECOND_NAME, SURNAME, SECOND_SURNAME, GENDER, BIRTHDATE, CONTACT_PHONE, EMAIL, ADDRESS, MARITAL_STATUS, STUDENT_TYPE, MILITARY_RANK, EMPLOYMENT, STATUS, REGISTRATION_DATE)
VALUES
(1, 'V-12345678', 'MARÍA', 'JOSÉ', 'GARCÍA', 'LÓPEZ', 'F', '2000-03-15', '04121234567', 'maria.garcia@email.com', 'Av. Libertador, Acarigua', 'SOLTERO', 'CIVIL', NULL, 'NO', 1, NOW()),
(2, 'V-23456789', 'JUAN', 'CARLOS', 'MARTÍNEZ', 'PÉREZ', 'M', '1999-07-22', '04122345678', 'juan.martinez@email.com', 'Calle 5, Araure', 'SOLTERO', 'CIVIL', NULL, 'NO', 1, NOW()),
(3, 'V-34567890', 'ANA', 'ISABEL', 'RODRÍGUEZ', 'SÁNCHEZ', 'F', '2000-11-10', '04123456789', 'ana.rodriguez@email.com', 'Urb. Las Flores, Acarigua', 'SOLTERO', 'CIVIL', NULL, 'SI', 1, NOW()),
(4, 'V-45678901', 'PEDRO', 'LUIS', 'GONZÁLEZ', 'DÍAZ', 'M', '1998-05-30', '04124567890', 'pedro.gonzalez@email.com', 'Av. Bolívar, Píritu', 'CASADO', 'MILITAR', 'S/2DA', 'NO', 1, NOW()),
(5, 'V-56789012', 'CARMEN', 'ELENA', 'FERNÁNDEZ', 'RUIZ', 'F', '2001-01-18', '04125678901', 'carmen.fernandez@email.com', 'Calle 8, Acarigua', 'SOLTERO', 'CIVIL', NULL, 'SI', 1, NOW()),
(6, 'V-67890123', 'LUIS', 'ALBERTO', 'TORRES', 'MORENO', 'M', '2000-09-05', '04126789012', 'luis.torres@email.com', 'Urb. El Carmen, Araure', 'SOLTERO', 'MILITAR', 'C/2DO', 'NO', 1, NOW()),
(7, 'V-78901234', 'LAURA', 'MARINA', 'RAMÍREZ', 'CASTILLO', 'F', '1999-12-25', '04127890123', 'laura.ramirez@email.com', 'Av. Circunvalación, Acarigua', 'SOLTERO', 'CIVIL', NULL, 'NO', 1, NOW()),
(8, 'V-89012345', 'CARLOS', 'ENRIQUE', 'VARGAS', 'MOLINA', 'M', '2000-04-14', '04128901234', 'carlos.vargas@email.com', 'Calle 3, Turén', 'SOLTERO', 'CIVIL', NULL, 'SI', 1, NOW()),
(9, 'V-90123456', 'SOFÍA', 'MERCEDES', 'DELGADO', 'ORTEGA', 'F', '2001-08-20', '04129012345', 'sofia.delgado@email.com', 'Av. Principal, Acarigua', 'SOLTERO', 'CIVIL', NULL, 'NO', 1, NOW()),
(10, 'V-11111111', 'JOSÉ', 'RAFAEL', 'MENDOZA', 'PARRA', 'M', '1999-06-12', '04121111111', 'jose.mendoza@email.com', 'Calle 7, Ospino', 'SOLTERO', 'MILITAR', 'S/1RO', 'NO', 1, NOW()),
(11, 'V-22222222', 'DANIELA', 'ALEJANDRA', 'PAREDES', 'GUZMÁN', 'F', '2000-10-30', '04122222222', 'daniela.paredes@email.com', 'Urb. San Miguel, Acarigua', 'SOLTERO', 'CIVIL', NULL, 'NO', 1, NOW()),
(12, 'V-33333333', 'ANDRÉS', 'FELIPE', 'CASTRO', 'VARGAS', 'M', '1998-02-14', '04123333333', 'andres.castro@email.com', 'Av. Libertador, Araure', 'SOLTERO', 'CIVIL', NULL, 'SI', 1, NOW()),
(13, 'V-44444444', 'MIGUEL', 'ANGEL', 'RIVERA', 'CORDERO', 'M', '2001-05-28', '04124444444', 'miguel.rivera@email.com', 'Calle 12, Acarigua', 'SOLTERO', 'MILITAR', 'DISTINGUIDO', 'NO', 1, NOW()),
(14, 'V-55555555', 'ALEJANDRA', 'MARÍA', 'SILVA', 'ROJAS', 'F', '1999-09-16', '04125555555', 'alejandra.silva@email.com', 'Calle 4, Guanare', 'SOLTERO', 'CIVIL', NULL, 'NO', 1, NOW());

-- ============================================================
-- 7. TUTORES ACADÉMICOS (5 tutores)
-- ============================================================
INSERT INTO t_tutors (person_id, TUTOR_CI, NAME, SECOND_NAME, SURNAME, SECOND_SURNAME, CONTACT_PHONE, GENDER, EMAIL, PROFESSION, CONDITION, DEDICATION, CATEGORY, CREATION_DATE, STATUS, TITULO)
VALUES
(1, 'V-12345678', 'MARÍA', 'JOSÉ', 'GARCÍA', 'LÓPEZ', '04121234567', 'F', 'maria.garcia@email.com', 'ING. EN INFORMÁTICA', 'JUBILADO', 'EXCLUSIVA', 'TITULAR', NOW(), 1, 'MSc.'),
(2, 'V-23456789', 'JUAN', 'CARLOS', 'MARTÍNEZ', 'PÉREZ', '04122345678', 'M', 'juan.martinez@email.com', 'LIC. EN ENFERMERÍA', 'CONTRATADO', 'MEDIA JORNADA', 'ASISTENTE', NOW(), 1, 'Esp.'),
(3, 'V-34567890', 'ANA', 'ISABEL', 'RODRÍGUEZ', 'SÁNCHEZ', '04123456789', 'F', 'ana.rodriguez@email.com', 'ADMINISTRADOR', 'ORDINARIO', 'EXCLUSIVA', 'AGREGADO', NOW(), 1, 'Dra.'),
(4, 'V-45678901', 'PEDRO', 'LUIS', 'GONZÁLEZ', 'DÍAZ', '04124567890', 'M', 'pedro.gonzalez@email.com', 'ING. CIVIL', 'ORDINARIO', 'EXCLUSIVA', 'TITULAR', NOW(), 1, 'MSc.'),
(5, 'V-56789012', 'CARMEN', 'ELENA', 'FERNÁNDEZ', 'RUIZ', '04125678901', 'F', 'carmen.fernandez@email.com', 'MÉDICO CIRUJANO', 'CONTRATADO', 'MEDIA JORNADA', 'ASISTENTE', NOW(), 1, 'Dra.');

-- ============================================================
-- 8. TUTOR-CAREER
-- ============================================================
INSERT INTO t_tutor_career (TUTOR_ID, CAREER_ID)
SELECT t.TUTOR_ID, c.CAREER_ID
FROM t_tutors t, t_career c
WHERE (t.TUTOR_ID = 1 AND c.CAREER_CODE = 'INF')
   OR (t.TUTOR_ID = 2 AND c.CAREER_CODE = 'ENF')
   OR (t.TUTOR_ID = 3 AND c.CAREER_CODE = 'DES')
   OR (t.TUTOR_ID = 4 AND c.CAREER_CODE = 'CIV')
   OR (t.TUTOR_ID = 5 AND c.CAREER_CODE = 'MIC');

-- ============================================================
-- 9. INSTITUCIONES (4)
-- ============================================================
INSERT INTO t_institution (INSTITUTION_NAME, INSTITUTION_ADDRESS, INSTITUTION_CONTACT, PRACTICE_TYPE, REGION, NUCLEUS, EXTENSION, CREATION_DATE, INSTITUTION_TYPE, STATUS, RIF, INSTITUTION_CODE)
VALUES
('HOSPITAL DR. MARÍA AUXILIADORA', 'Av. Los Pájaros, Acarigua', '02551234567', 'HOSPITALARIA', 'PORTUGUESA', 'PORTUGUESA', 'ACARIGUA', NOW(), 'PÚBLICA', 1, 'J-12345678-9', 'HMA-001'),
('ALCALDÍA DEL MUNICIPIO PÍRITU', 'Calle Bolívar, Píritu', '02559876543', 'COMUNITARIA', 'PORTUGUESA', 'PORTUGUESA', 'ACARIGUA', NOW(), 'PÚBLICA', 1, 'J-23456789-0', 'AMP-001'),
('EMPRESA AGROINDUSTRIAL PORTUGUESA C.A.', 'Zona Industrial, Araure', '02551122334', 'EMPRESARIAL', 'PORTUGUESA', 'PORTUGUESA', 'ACARIGUA', NOW(), 'PRIVADA', 1, 'J-34567890-1', 'EAP-001'),
('AMBULATORIO URBANO DR. JOSÉ GREGORIO HERNÁNDEZ', 'Av. Libertador, Araure', '02554433221', 'HOSPITALARIA', 'PORTUGUESA', 'PORTUGUESA', 'ACARIGUA', NOW(), 'PÚBLICA', 1, 'J-45678901-2', 'AUJ-001');

-- ============================================================
-- 10. INSTITUCION-CARRERA
-- ============================================================
INSERT INTO t_institution_career (INSTITUTION_ID, CAREER_ID)
SELECT i.INSTITUTION_ID, c.CAREER_ID
FROM t_institution i, t_career c
WHERE (i.INSTITUTION_ID = 1 AND c.CAREER_CODE IN ('ENF', 'MIC'))
   OR (i.INSTITUTION_ID = 2 AND c.CAREER_CODE IN ('DES', 'INF'))
   OR (i.INSTITUTION_ID = 3 AND c.CAREER_CODE IN ('INF', 'CIV', 'ADM'))
   OR (i.INSTITUTION_ID = 4 AND c.CAREER_CODE IN ('ENF', 'MIC'));

-- ============================================================
-- 11. INSTITUCION-TIPO PASANTÍA
-- ============================================================
INSERT INTO t_institution_internship_type (INSTITUTION_ID, INTERNSHIP_TYPE_ID)
SELECT i.INSTITUTION_ID, t.INTERNSHIP_TYPE_ID
FROM t_institution i, t_internship_type t
WHERE (i.INSTITUTION_ID = 1 AND t.NAME IN ('HOSPITALARIA'))
   OR (i.INSTITUTION_ID = 2 AND t.NAME IN ('COMUNITARIA'))
   OR (i.INSTITUTION_ID = 3 AND t.NAME IN ('EMPRESARIAL'))
   OR (i.INSTITUTION_ID = 4 AND t.NAME IN ('HOSPITALARIA'));

-- ============================================================
-- 12. CONTACTOS DE INSTITUCIONES (managers)
-- ============================================================
INSERT INTO t_institution_manager (MANAGER_CI, NAME, SECOND_NAME, SURNAME, SECOND_SURNAME, CONTACT_PHONE, EMAIL, CREATION_DATE, STATUS, INSTITUTION_ID)
VALUES
('V-87654321', 'ROSA', 'MARÍA', 'CONTRERAS', 'LINARES', '04129876543', 'rosa.contreras@hospital.com', NOW(), 1, 1),
('V-76543210', 'HÉCTOR', 'JOSÉ', 'PARRA', 'FIGUEROA', '04128765432', 'hector.parra@alcaldia.com', NOW(), 1, 2),
('V-65432109', 'GLADYS', 'DEL CARMEN', 'MORENO', 'SALAZAR', '04127654321', 'gladys.moreno@agroindustrial.com', NOW(), 1, 3),
('V-54321098', 'JOSÉ', 'GREGORIO', 'ALVARADO', 'MENDOZA', '04126543210', 'jose.alvarado@ambulatorio.com', NOW(), 1, 4);

-- ============================================================
-- 13. PRÁCTICAS PROFESIONALES (14 prácticas)
-- ============================================================
-- Periodo 1-2025 (PERIOD_ID 1)
-- Periodo 2-2025 (PERIOD_ID 2)

-- Práctica 1: María García, Ing. Inf, Hospital, Periodo 1-2025
INSERT INTO t_professional_practices (START_DATE, END_DATE, REPORT_TITLE, REGISTRATION_DATE, CREATION_DATE, GRADE, TRANSFER, TOUR, PERIOD_ID, INSTITUTION_ID, STUDENTS_ID, STATUS, MANAGER_ID, OBSERVATION, ENROLLMENT, INTERNSHIP_STATUS, INTERNSHIP_TYPE_ID, PRACTICES_STATUS, EVALUATION_STATUS, SEMESTER, SECTION, REGIME, CAREER_ID)
SELECT '2025-02-01', '2025-07-01', 'SISTEMA DE GESTIÓN HOSPITALARIA', NOW(), NOW(), 17.50, 0, 'MATUTINO', 1, 1, s.STUDENTS_ID, 1, 1, 'OBSERVACIÓN GENERAL', 'REGULAR', 1, t.INTERNSHIP_TYPE_ID, 1, 'completed', '5TO', 'A', 'SEMIPRESENCIAL', c.CAREER_ID
FROM t_students s, t_internship_type t, t_career c
WHERE s.STUDENTS_CI = 'V-12345678' AND t.NAME = 'HOSPITALARIA' AND c.CAREER_CODE = 'INF';

-- Práctica 2: Juan Martínez, Ing. Inf, Empresa Agroindustrial, Periodo 1-2025
INSERT INTO t_professional_practices (START_DATE, END_DATE, REPORT_TITLE, REGISTRATION_DATE, CREATION_DATE, GRADE, TRANSFER, TOUR, PERIOD_ID, INSTITUTION_ID, STUDENTS_ID, STATUS, MANAGER_ID, OBSERVATION, ENROLLMENT, INTERNSHIP_STATUS, INTERNSHIP_TYPE_ID, PRACTICES_STATUS, EVALUATION_STATUS, SEMESTER, SECTION, REGIME, CAREER_ID)
SELECT '2025-02-01', '2025-07-01', 'AUTOMATIZACIÓN DE PROCESOS ADMINISTRATIVOS', NOW(), NOW(), 15.00, 0, 'VESPERTINO', 1, 3, s.STUDENTS_ID, 1, 3, 'OBSERVACIÓN GENERAL', 'REGULAR', 1, t.INTERNSHIP_TYPE_ID, 1, 'completed', '5TO', 'A', 'PRESENCIAL', c.CAREER_ID
FROM t_students s, t_internship_type t, t_career c
WHERE s.STUDENTS_CI = 'V-23456789' AND t.NAME = 'EMPRESARIAL' AND c.CAREER_CODE = 'INF';

-- Práctica 3: Ana Rodríguez, Lic. Enfermería, Hospital, Periodo 1-2025
INSERT INTO t_professional_practices (START_DATE, END_DATE, REPORT_TITLE, REGISTRATION_DATE, CREATION_DATE, GRADE, TRANSFER, TOUR, PERIOD_ID, INSTITUTION_ID, STUDENTS_ID, STATUS, MANAGER_ID, OBSERVATION, ENROLLMENT, INTERNSHIP_STATUS, INTERNSHIP_TYPE_ID, PRACTICES_STATUS, EVALUATION_STATUS, SEMESTER, SECTION, REGIME, CAREER_ID)
SELECT '2025-02-01', '2025-07-01', 'ATENCIÓN DE ENFERMERÍA EN EMERGENCIAS', NOW(), NOW(), 18.00, 0, 'MATUTINO', 1, 1, s.STUDENTS_ID, 1, 1, 'OBSERVACIÓN GENERAL', 'REGULAR', 1, t.INTERNSHIP_TYPE_ID, 1, 'completed', '6TO', 'B', 'PRESENCIAL', c.CAREER_ID
FROM t_students s, t_internship_type t, t_career c
WHERE s.STUDENTS_CI = 'V-34567890' AND t.NAME = 'HOSPITALARIA' AND c.CAREER_CODE = 'ENF';

-- Práctica 4: Pedro González, Adm. Desastres, Alcaldía Píritu, Periodo 1-2025
INSERT INTO t_professional_practices (START_DATE, END_DATE, REPORT_TITLE, REGISTRATION_DATE, CREATION_DATE, GRADE, TRANSFER, TOUR, PERIOD_ID, INSTITUTION_ID, STUDENTS_ID, STATUS, MANAGER_ID, OBSERVATION, ENROLLMENT, INTERNSHIP_STATUS, INTERNSHIP_TYPE_ID, PRACTICES_STATUS, EVALUATION_STATUS, SEMESTER, SECTION, REGIME, CAREER_ID)
SELECT '2025-02-01', '2025-07-01', 'PLAN DE GESTIÓN DE RIESGOS MUNICIPAL', NOW(), NOW(), 14.50, 0, 'MATUTINO', 1, 2, s.STUDENTS_ID, 1, 2, 'OBSERVACIÓN GENERAL', 'REGULAR', 1, t.INTERNSHIP_TYPE_ID, 1, 'completed', '4TO', 'A', 'SEMIPRESENCIAL', c.CAREER_ID
FROM t_students s, t_internship_type t, t_career c
WHERE s.STUDENTS_CI = 'V-45678901' AND t.NAME = 'COMUNITARIA' AND c.CAREER_CODE = 'DES';

-- Práctica 5: Carmen Fernández, Lic. Enfermería, Ambulatorio, Periodo 1-2025
INSERT INTO t_professional_practices (START_DATE, END_DATE, REPORT_TITLE, REGISTRATION_DATE, CREATION_DATE, GRADE, TRANSFER, TOUR, PERIOD_ID, INSTITUTION_ID, STUDENTS_ID, STATUS, MANAGER_ID, OBSERVATION, ENROLLMENT, INTERNSHIP_STATUS, INTERNSHIP_TYPE_ID, PRACTICES_STATUS, EVALUATION_STATUS, SEMESTER, SECTION, REGIME, CAREER_ID)
SELECT '2025-02-01', '2025-07-01', 'CONTROL DE VACUNACIÓN COMUNITARIA', NOW(), NOW(), 16.00, 0, 'VESPERTINO', 1, 4, s.STUDENTS_ID, 1, 4, 'OBSERVACIÓN GENERAL', 'REGULAR', 1, t.INTERNSHIP_TYPE_ID, 1, 'completed', '6TO', 'B', 'PRESENCIAL', c.CAREER_ID
FROM t_students s, t_internship_type t, t_career c
WHERE s.STUDENTS_CI = 'V-56789012' AND t.NAME = 'HOSPITALARIA' AND c.CAREER_CODE = 'ENF';

-- Práctica 6: Luis Torres, Ing. Civil, Empresa Agroindustrial, Periodo 1-2025
INSERT INTO t_professional_practices (START_DATE, END_DATE, REPORT_TITLE, REGISTRATION_DATE, CREATION_DATE, GRADE, TRANSFER, TOUR, PERIOD_ID, INSTITUTION_ID, STUDENTS_ID, STATUS, MANAGER_ID, OBSERVATION, ENROLLMENT, INTERNSHIP_STATUS, INTERNSHIP_TYPE_ID, PRACTICES_STATUS, EVALUATION_STATUS, SEMESTER, SECTION, REGIME, CAREER_ID)
SELECT '2025-02-01', '2025-07-01', 'SUPERVISIÓN DE OBRAS CIVILES', NOW(), NOW(), 12.00, 0, 'MATUTINO', 1, 3, s.STUDENTS_ID, 1, 3, 'OBSERVACIÓN GENERAL', 'REGULAR', 1, t.INTERNSHIP_TYPE_ID, 1, 'completed', '8VO', 'A', 'PRESENCIAL', c.CAREER_ID
FROM t_students s, t_internship_type t, t_career c
WHERE s.STUDENTS_CI = 'V-67890123' AND t.NAME = 'EMPRESARIAL' AND c.CAREER_CODE = 'CIV';

-- Práctica 7: Laura Ramírez, Ing. Inf, Alcaldía Píritu, Periodo 2-2025
INSERT INTO t_professional_practices (START_DATE, END_DATE, REPORT_TITLE, REGISTRATION_DATE, CREATION_DATE, GRADE, TRANSFER, TOUR, PERIOD_ID, INSTITUTION_ID, STUDENTS_ID, STATUS, MANAGER_ID, OBSERVATION, ENROLLMENT, INTERNSHIP_STATUS, INTERNSHIP_TYPE_ID, PRACTICES_STATUS, EVALUATION_STATUS, SEMESTER, SECTION, REGIME, CAREER_ID)
SELECT '2025-09-01', '2026-01-31', 'SISTEMA DE REGISTRO MUNICIPAL', NOW(), NOW(), 16.50, 0, 'MATUTINO', 2, 2, s.STUDENTS_ID, 1, 2, 'OBSERVACIÓN GENERAL', 'REGULAR', 1, t.INTERNSHIP_TYPE_ID, 1, 'completed', '5TO', 'A', 'SEMIPRESENCIAL', c.CAREER_ID
FROM t_students s, t_internship_type t, t_career c
WHERE s.STUDENTS_CI = 'V-78901234' AND t.NAME = 'COMUNITARIA' AND c.CAREER_CODE = 'INF';

-- Práctica 8: Carlos Vargas, Adm. Desastres, Alcaldía Píritu, Periodo 2-2025
INSERT INTO t_professional_practices (START_DATE, END_DATE, REPORT_TITLE, REGISTRATION_DATE, CREATION_DATE, GRADE, TRANSFER, TOUR, PERIOD_ID, INSTITUTION_ID, STUDENTS_ID, STATUS, MANAGER_ID, OBSERVATION, ENROLLMENT, INTERNSHIP_STATUS, INTERNSHIP_TYPE_ID, PRACTICES_STATUS, EVALUATION_STATUS, SEMESTER, SECTION, REGIME, CAREER_ID)
SELECT '2025-09-01', '2026-01-31', 'PROGRAMA DE PREVENCIÓN COMUNITARIA', NOW(), NOW(), 19.00, 0, 'VESPERTINO', 2, 2, s.STUDENTS_ID, 1, 2, 'OBSERVACIÓN GENERAL', 'REGULAR', 1, t.INTERNSHIP_TYPE_ID, 1, 'completed', '5TO', 'A', 'PRESENCIAL', c.CAREER_ID
FROM t_students s, t_internship_type t, t_career c
WHERE s.STUDENTS_CI = 'V-89012345' AND t.NAME = 'COMUNITARIA' AND c.CAREER_CODE = 'DES';

-- Práctica 9: Sofía Delgado, Med. Integral, Hospital, Periodo 2-2025
INSERT INTO t_professional_practices (START_DATE, END_DATE, REPORT_TITLE, REGISTRATION_DATE, CREATION_DATE, GRADE, TRANSFER, TOUR, PERIOD_ID, INSTITUTION_ID, STUDENTS_ID, STATUS, MANAGER_ID, OBSERVATION, ENROLLMENT, INTERNSHIP_STATUS, INTERNSHIP_TYPE_ID, PRACTICES_STATUS, EVALUATION_STATUS, SEMESTER, SECTION, REGIME, CAREER_ID)
SELECT '2025-09-01', '2026-01-31', 'ATENCIÓN PRIMARIA EN SALUD', NOW(), NOW(), 14.00, 0, 'MATUTINO', 2, 1, s.STUDENTS_ID, 1, 1, 'OBSERVACIÓN GENERAL', 'REGULAR', 1, t.INTERNSHIP_TYPE_ID, 1, 'completed', '5TO', 'A', 'PRESENCIAL', c.CAREER_ID
FROM t_students s, t_internship_type t, t_career c
WHERE s.STUDENTS_CI = 'V-90123456' AND t.NAME = 'HOSPITALARIA' AND c.CAREER_CODE = 'MIC';

-- Práctica 10: José Mendoza, Ing. Civil, Empresa Agroindustrial, Periodo 2-2025
INSERT INTO t_professional_practices (START_DATE, END_DATE, REPORT_TITLE, REGISTRATION_DATE, CREATION_DATE, GRADE, TRANSFER, TOUR, PERIOD_ID, INSTITUTION_ID, STUDENTS_ID, STATUS, MANAGER_ID, OBSERVATION, ENROLLMENT, INTERNSHIP_STATUS, INTERNSHIP_TYPE_ID, PRACTICES_STATUS, EVALUATION_STATUS, SEMESTER, SECTION, REGIME, CAREER_ID)
SELECT '2025-09-01', '2026-01-31', 'MANTENIMIENTO DE INFRAESTRUCTURA INDUSTRIAL', NOW(), NOW(), 13.50, 0, 'VESPERTINO', 2, 3, s.STUDENTS_ID, 1, 3, 'OBSERVACIÓN GENERAL', 'REGULAR', 1, t.INTERNSHIP_TYPE_ID, 1, 'completed', '8VO', 'B', 'PRESENCIAL', c.CAREER_ID
FROM t_students s, t_internship_type t, t_career c
WHERE s.STUDENTS_CI = 'V-11111111' AND t.NAME = 'EMPRESARIAL' AND c.CAREER_CODE = 'CIV';

-- Práctica 11: Daniela Paredes, Ing. Inf, Hospital, Periodo 2-2025
INSERT INTO t_professional_practices (START_DATE, END_DATE, REPORT_TITLE, REGISTRATION_DATE, CREATION_DATE, GRADE, TRANSFER, TOUR, PERIOD_ID, INSTITUTION_ID, STUDENTS_ID, STATUS, MANAGER_ID, OBSERVATION, ENROLLMENT, INTERNSHIP_STATUS, INTERNSHIP_TYPE_ID, PRACTICES_STATUS, EVALUATION_STATUS, SEMESTER, SECTION, REGIME, CAREER_ID)
SELECT '2025-09-01', '2026-01-31', 'SISTEMA DE HISTORIAS MÉDICAS DIGITALES', NOW(), NOW(), 20.00, 0, 'MATUTINO', 2, 1, s.STUDENTS_ID, 1, 1, 'OBSERVACIÓN GENERAL', 'REGULAR', 1, t.INTERNSHIP_TYPE_ID, 1, 'completed', '6TO', 'A', 'SEMIPRESENCIAL', c.CAREER_ID
FROM t_students s, t_internship_type t, t_career c
WHERE s.STUDENTS_CI = 'V-22222222' AND t.NAME = 'HOSPITALARIA' AND c.CAREER_CODE = 'INF';

-- Práctica 12: Andrés Castro, Adm. Desastres, Alcaldía Píritu, Periodo 2-2025
INSERT INTO t_professional_practices (START_DATE, END_DATE, REPORT_TITLE, REGISTRATION_DATE, CREATION_DATE, GRADE, TRANSFER, TOUR, PERIOD_ID, INSTITUTION_ID, STUDENTS_ID, STATUS, MANAGER_ID, OBSERVATION, ENROLLMENT, INTERNSHIP_STATUS, INTERNSHIP_TYPE_ID, PRACTICES_STATUS, EVALUATION_STATUS, SEMESTER, SECTION, REGIME, CAREER_ID)
SELECT '2025-09-01', '2026-01-31', 'BRIGADAS DE EMERGENCIA MUNICIPAL', NOW(), NOW(), 11.00, 0, 'MATUTINO', 2, 2, s.STUDENTS_ID, 1, 2, 'OBSERVACIÓN GENERAL', 'REGULAR', 1, t.INTERNSHIP_TYPE_ID, 1, 'completed', '4TO', 'B', 'PRESENCIAL', c.CAREER_ID
FROM t_students s, t_internship_type t, t_career c
WHERE s.STUDENTS_CI = 'V-33333333' AND t.NAME = 'COMUNITARIA' AND c.CAREER_CODE = 'DES';

-- Práctica 13: Miguel Rivera, Ing. Civil, Empresa Agroindustrial, Periodo 2-2025
INSERT INTO t_professional_practices (START_DATE, END_DATE, REPORT_TITLE, REGISTRATION_DATE, CREATION_DATE, GRADE, TRANSFER, TOUR, PERIOD_ID, INSTITUTION_ID, STUDENTS_ID, STATUS, MANAGER_ID, OBSERVATION, ENROLLMENT, INTERNSHIP_STATUS, INTERNSHIP_TYPE_ID, PRACTICES_STATUS, EVALUATION_STATUS, SEMESTER, SECTION, REGIME, CAREER_ID)
SELECT '2025-09-01', '2026-01-31', 'DISEÑO DE ESTRUCTURAS METÁLICAS', NOW(), NOW(), 17.00, 0, 'VESPERTINO', 2, 3, s.STUDENTS_ID, 1, 3, 'OBSERVACIÓN GENERAL', 'REGULAR', 1, t.INTERNSHIP_TYPE_ID, 1, 'completed', '8VO', 'A', 'PRESENCIAL', c.CAREER_ID
FROM t_students s, t_internship_type t, t_career c
WHERE s.STUDENTS_CI = 'V-44444444' AND t.NAME = 'EMPRESARIAL' AND c.CAREER_CODE = 'CIV';

-- Práctica 14: Alejandra Silva, Lic. Enfermería, Ambulatorio, Periodo 2-2025
INSERT INTO t_professional_practices (START_DATE, END_DATE, REPORT_TITLE, REGISTRATION_DATE, CREATION_DATE, GRADE, TRANSFER, TOUR, PERIOD_ID, INSTITUTION_ID, STUDENTS_ID, STATUS, MANAGER_ID, OBSERVATION, ENROLLMENT, INTERNSHIP_STATUS, INTERNSHIP_TYPE_ID, PRACTICES_STATUS, EVALUATION_STATUS, SEMESTER, SECTION, REGIME, CAREER_ID)
SELECT '2025-09-01', '2026-01-31', 'PROGRAMA DE SALUD INTEGRAL COMUNITARIA', NOW(), NOW(), 18.50, 0, 'MATUTINO', 2, 4, s.STUDENTS_ID, 1, 4, 'OBSERVACIÓN GENERAL', 'REGULAR', 1, t.INTERNSHIP_TYPE_ID, 1, 'completed', '6TO', 'B', 'PRESENCIAL', c.CAREER_ID
FROM t_students s, t_internship_type t, t_career c
WHERE s.STUDENTS_CI = 'V-55555555' AND t.NAME = 'HOSPITALARIA' AND c.CAREER_CODE = 'ENF';

-- ============================================================
-- 14. TUTOR-PRÁCTICA (ASIGNACIONES)
-- ============================================================
-- María García (TUTOR_ID=1) → prácticas de INF (1, 2, 7, 11) como ACADEMICO
INSERT INTO t_professional_practices_tutor (TUTOR_ID, PROFESSIONAL_PRACTICE_ID, TUTOR_TYPE)
SELECT 1, pp.PROFESSIONAL_PRACTICE_ID, 'ACADEMICO'
FROM t_professional_practices pp
WHERE pp.PROFESSIONAL_PRACTICE_ID IN (1, 2);

-- Juan Martínez (TUTOR_ID=2) → prácticas de ENF (3, 5, 14) como ACADEMICO
INSERT INTO t_professional_practices_tutor (TUTOR_ID, PROFESSIONAL_PRACTICE_ID, TUTOR_TYPE)
SELECT 2, pp.PROFESSIONAL_PRACTICE_ID, 'ACADEMICO'
FROM t_professional_practices pp
WHERE pp.PROFESSIONAL_PRACTICE_ID IN (3, 5);

-- Ana Rodríguez (TUTOR_ID=3) → prácticas de DES (4, 8, 12) como ACADEMICO
INSERT INTO t_professional_practices_tutor (TUTOR_ID, PROFESSIONAL_PRACTICE_ID, TUTOR_TYPE)
SELECT 3, pp.PROFESSIONAL_PRACTICE_ID, 'ACADEMICO'
FROM t_professional_practices pp
WHERE pp.PROFESSIONAL_PRACTICE_ID IN (4, 8, 12);

-- Pedro González (TUTOR_ID=4) → prácticas de CIV (6, 10, 13) como ACADEMICO
INSERT INTO t_professional_practices_tutor (TUTOR_ID, PROFESSIONAL_PRACTICE_ID, TUTOR_TYPE)
SELECT 4, pp.PROFESSIONAL_PRACTICE_ID, 'ACADEMICO'
FROM t_professional_practices pp
WHERE pp.PROFESSIONAL_PRACTICE_ID IN (6, 10, 13);

-- Carmen Fernández (TUTOR_ID=5) → prácticas de MIC (9) como ACADEMICO
INSERT INTO t_professional_practices_tutor (TUTOR_ID, PROFESSIONAL_PRACTICE_ID, TUTOR_TYPE)
SELECT 5, pp.PROFESSIONAL_PRACTICE_ID, 'ACADEMICO'
FROM t_professional_practices pp
WHERE pp.PROFESSIONAL_PRACTICE_ID IN (9);

-- TUTORES INSTITUCIONALES (usamos los managers como tutores institucionales)
-- Nota: para este seed, insertamos tutores temporales como institucionales
INSERT INTO t_tutors (TUTOR_CI, NAME, SECOND_NAME, SURNAME, SECOND_SURNAME, CONTACT_PHONE, GENDER, EMAIL, PROFESSION, CONDITION, DEDICATION, CATEGORY, CREATION_DATE, STATUS, TITULO)
VALUES
('V-87654321', 'ROSA', 'MARÍA', 'CONTRERAS', 'LINARES', '04129876543', 'F', 'rosa.contreras@hospital.com', 'LIC. ENFERMERÍA', 'ORDINARIO', 'EXCLUSIVA', 'ASISTENTE', NOW(), 1, 'Lic.'),
('V-76543210', 'HÉCTOR', 'JOSÉ', 'PARRA', 'FIGUEROA', '04128765432', 'M', 'hector.parra@alcaldia.com', 'ADMINISTRADOR', 'ORDINARIO', 'EXCLUSIVA', 'AGREGADO', NOW(), 1, 'Lic.'),
('V-65432109', 'GLADYS', 'DEL CARMEN', 'MORENO', 'SALAZAR', '04127654321', 'F', 'gladys.moreno@agroindustrial.com', 'ING. INDUSTRIAL', 'CONTRATADO', 'MEDIA JORNADA', 'ASISTENTE', NOW(), 1, 'Ing.'),
('V-54321098', 'JOSÉ', 'GREGORIO', 'ALVARADO', 'MENDOZA', '04126543210', 'M', 'jose.alvarado@ambulatorio.com', 'MÉDICO GENERAL', 'ORDINARIO', 'EXCLUSIVA', 'TITULAR', NOW(), 1, 'Dr.');

-- Asignar tutores institucionales a prácticas
INSERT INTO t_professional_practices_tutor (TUTOR_ID, PROFESSIONAL_PRACTICE_ID, TUTOR_TYPE)
SELECT t.TUTOR_ID, pp.PROFESSIONAL_PRACTICE_ID, 'INSTITUCIONAL'
FROM t_professional_practices pp
JOIN t_institution i ON pp.INSTITUTION_ID = i.INSTITUTION_ID
JOIN t_tutors t ON (
  (i.INSTITUTION_NAME LIKE '%HOSPITAL%' AND t.TUTOR_CI = 'V-87654321')
  OR (i.INSTITUTION_NAME LIKE '%ALCALDÍA%' AND t.TUTOR_CI = 'V-76543210')
  OR (i.INSTITUTION_NAME LIKE '%AGROINDUSTRIAL%' AND t.TUTOR_CI = 'V-65432109')
  OR (i.INSTITUTION_NAME LIKE '%AMBULATORIO%' AND t.TUTOR_CI = 'V-54321098')
);

-- ============================================================
-- 15. CRITERIOS DE EVALUACIÓN
-- ============================================================
INSERT INTO t_evaluation_criteria (ITEM_NUMBER, DESCRIPTION, EVALUATOR_TYPE, STATUS)
VALUES
-- Tutor Académico (6 criterios)
(1, 'Asistencia y puntualidad en las reuniones de tutoría', 'ACADEMICO', 1),
(2, 'Calidad del informe de avance presentado', 'ACADEMICO', 1),
(3, 'Dominio de los contenidos teóricos de la práctica', 'ACADEMICO', 1),
(4, 'Capacidad de análisis y resolución de problemas', 'ACADEMICO', 1),
(5, 'Responsabilidad y compromiso con el cronograma', 'ACADEMICO', 1),
(6, 'Participación en actividades académicas complementarias', 'ACADEMICO', 1),
-- Tutor Institucional (6 criterios)
(1, 'Asistencia y puntualidad al lugar de trabajo', 'INSTITUCIONAL', 1),
(2, 'Cumplimiento de las actividades asignadas', 'INSTITUCIONAL', 1),
(3, 'Relaciones interpersonales con el equipo de trabajo', 'INSTITUCIONAL', 1),
(4, 'Iniciativa y proactividad en la ejecución de tareas', 'INSTITUCIONAL', 1),
(5, 'Calidad del trabajo realizado', 'INSTITUCIONAL', 1),
(6, 'Responsabilidad y ética profesional', 'INSTITUCIONAL', 1),
-- Comité Evaluador (5 criterios)
(1, 'Presentación y defensa del informe final', 'COMITE', 1),
(2, 'Dominio del tema y profundidad de la investigación', 'COMITE', 1),
(3, 'Aplicación de conocimientos en la solución de problemas', 'COMITE', 1),
(4, 'Claridad y coherencia en la exposición oral', 'COMITE', 1),
(5, 'Pertinencia social y académica del trabajo realizado', 'COMITE', 1);

-- ============================================================
-- 16. EVALUACIONES (para las primeras 8 prácticas)
-- ============================================================
-- Evaluaciones para Práctica 1 (María García)
INSERT INTO t_evaluation (PROFESSIONAL_PRACTICE_ID, EVALUATOR_TYPE, EVALUATOR_NAME, EVALUATOR_CI, TOTAL_SCORE, EVALUATION_DATE, STATUS)
VALUES
(1, 'ACADEMICO', 'MSc. MARÍA GARCÍA', 'V-12345678', 18.00, '2025-06-30', 1),
(1, 'INSTITUCIONAL', 'Lic. ROSA CONTRERAS', 'V-87654321', 17.00, '2025-06-28', 1),
(1, 'COMITE', 'Comité Evaluador PP', 'V-00000000', 17.50, '2025-07-05', 1);

-- Detalles: Práctica 1, Tutor Académico (EVAL 1)
INSERT INTO t_evaluation_detail (EVALUATION_ID, ITEM_NUMBER, SCORE)
SELECT e.EVALUATION_ID, ec.ITEM_NUMBER, 
  CASE ec.ITEM_NUMBER
    WHEN 1 THEN 4 WHEN 2 THEN 5 WHEN 3 THEN 4
    WHEN 4 THEN 5 WHEN 5 THEN 5 WHEN 6 THEN 4
  END
FROM t_evaluation e, t_evaluation_criteria ec
WHERE e.PROFESSIONAL_PRACTICE_ID = 1 AND e.EVALUATOR_TYPE = 'ACADEMICO'
  AND ec.EVALUATOR_TYPE = 'ACADEMICO';

-- Detalles: Práctica 1, Tutor Institucional (EVAL 2)
INSERT INTO t_evaluation_detail (EVALUATION_ID, ITEM_NUMBER, SCORE)
SELECT e.EVALUATION_ID, ec.ITEM_NUMBER,
  CASE ec.ITEM_NUMBER
    WHEN 1 THEN 4 WHEN 2 THEN 4 WHEN 3 THEN 5
    WHEN 4 THEN 4 WHEN 5 THEN 5 WHEN 6 THEN 5
  END
FROM t_evaluation e, t_evaluation_criteria ec
WHERE e.PROFESSIONAL_PRACTICE_ID = 1 AND e.EVALUATOR_TYPE = 'INSTITUCIONAL'
  AND ec.EVALUATOR_TYPE = 'INSTITUCIONAL';

-- Detalles: Práctica 1, Comité (EVAL 3)
INSERT INTO t_evaluation_detail (EVALUATION_ID, ITEM_NUMBER, SCORE)
SELECT e.EVALUATION_ID, ec.ITEM_NUMBER,
  CASE ec.ITEM_NUMBER
    WHEN 1 THEN 5 WHEN 2 THEN 4 WHEN 3 THEN 4
    WHEN 4 THEN 5 WHEN 5 THEN 4
  END
FROM t_evaluation e, t_evaluation_criteria ec
WHERE e.PROFESSIONAL_PRACTICE_ID = 1 AND e.EVALUATOR_TYPE = 'COMITE'
  AND ec.EVALUATOR_TYPE = 'COMITE';

-- Evaluaciones Práctica 2 (Juan Martínez)
INSERT INTO t_evaluation (PROFESSIONAL_PRACTICE_ID, EVALUATOR_TYPE, EVALUATOR_NAME, EVALUATOR_CI, TOTAL_SCORE, EVALUATION_DATE, STATUS)
VALUES
(2, 'ACADEMICO', 'MSc. MARÍA GARCÍA', 'V-12345678', 15.00, '2025-06-30', 1),
(2, 'INSTITUCIONAL', 'Ing. GLADYS MORENO', 'V-65432109', 14.00, '2025-06-28', 1),
(2, 'COMITE', 'Comité Evaluador PP', 'V-00000000', 16.00, '2025-07-05', 1);

INSERT INTO t_evaluation_detail (EVALUATION_ID, ITEM_NUMBER, SCORE)
SELECT e.EVALUATION_ID, ec.ITEM_NUMBER, 3 + floor(random()*3)::int
FROM t_evaluation e, t_evaluation_criteria ec
WHERE e.PROFESSIONAL_PRACTICE_ID = 2 AND e.EVALUATOR_TYPE = ec.EVALUATOR_TYPE;

-- Evaluaciones Práctica 3 (Ana Rodríguez)
INSERT INTO t_evaluation (PROFESSIONAL_PRACTICE_ID, EVALUATOR_TYPE, EVALUATOR_NAME, EVALUATOR_CI, TOTAL_SCORE, EVALUATION_DATE, STATUS)
VALUES
(3, 'ACADEMICO', 'Esp. JUAN MARTÍNEZ', 'V-23456789', 18.00, '2025-06-30', 1),
(3, 'INSTITUCIONAL', 'Lic. ROSA CONTRERAS', 'V-87654321', 19.00, '2025-06-28', 1),
(3, 'COMITE', 'Comité Evaluador PP', 'V-00000000', 17.00, '2025-07-05', 1);

INSERT INTO t_evaluation_detail (EVALUATION_ID, ITEM_NUMBER, SCORE)
SELECT e.EVALUATION_ID, ec.ITEM_NUMBER, 4 + floor(random()*2)::int
FROM t_evaluation e, t_evaluation_criteria ec
WHERE e.PROFESSIONAL_PRACTICE_ID = 3 AND e.EVALUATOR_TYPE = ec.EVALUATOR_TYPE;

-- Evaluaciones Práctica 4 (Pedro González)
INSERT INTO t_evaluation (PROFESSIONAL_PRACTICE_ID, EVALUATOR_TYPE, EVALUATOR_NAME, EVALUATOR_CI, TOTAL_SCORE, EVALUATION_DATE, STATUS)
VALUES
(4, 'ACADEMICO', 'Dra. ANA RODRÍGUEZ', 'V-34567890', 14.00, '2025-06-30', 1),
(4, 'INSTITUCIONAL', 'Lic. HÉCTOR PARRA', 'V-76543210', 15.00, '2025-06-28', 1),
(4, 'COMITE', 'Comité Evaluador PP', 'V-00000000', 14.50, '2025-07-05', 1);

INSERT INTO t_evaluation_detail (EVALUATION_ID, ITEM_NUMBER, SCORE)
SELECT e.EVALUATION_ID, ec.ITEM_NUMBER, 3 + floor(random()*2)::int
FROM t_evaluation e, t_evaluation_criteria ec
WHERE e.PROFESSIONAL_PRACTICE_ID = 4 AND e.EVALUATOR_TYPE = ec.EVALUATOR_TYPE;

-- Evaluaciones Práctica 5 (Carmen Fernández)
INSERT INTO t_evaluation (PROFESSIONAL_PRACTICE_ID, EVALUATOR_TYPE, EVALUATOR_NAME, EVALUATOR_CI, TOTAL_SCORE, EVALUATION_DATE, STATUS)
VALUES
(5, 'ACADEMICO', 'Esp. JUAN MARTÍNEZ', 'V-23456789', 16.00, '2025-06-30', 1),
(5, 'INSTITUCIONAL', 'Dr. JOSÉ ALVARADO', 'V-54321098', 17.00, '2025-06-28', 1),
(5, 'COMITE', 'Comité Evaluador PP', 'V-00000000', 15.00, '2025-07-05', 1);

INSERT INTO t_evaluation_detail (EVALUATION_ID, ITEM_NUMBER, SCORE)
SELECT e.EVALUATION_ID, ec.ITEM_NUMBER, 3 + floor(random()*3)::int
FROM t_evaluation e, t_evaluation_criteria ec
WHERE e.PROFESSIONAL_PRACTICE_ID = 5 AND e.EVALUATOR_TYPE = ec.EVALUATOR_TYPE;

-- Evaluaciones Práctica 6 (Luis Torres)
INSERT INTO t_evaluation (PROFESSIONAL_PRACTICE_ID, EVALUATOR_TYPE, EVALUATOR_NAME, EVALUATOR_CI, TOTAL_SCORE, EVALUATION_DATE, STATUS)
VALUES
(6, 'ACADEMICO', 'MSc. PEDRO GONZÁLEZ', 'V-45678901', 12.00, '2025-06-30', 1),
(6, 'INSTITUCIONAL', 'Ing. GLADYS MORENO', 'V-65432109', 11.00, '2025-06-28', 1),
(6, 'COMITE', 'Comité Evaluador PP', 'V-00000000', 13.00, '2025-07-05', 1);

INSERT INTO t_evaluation_detail (EVALUATION_ID, ITEM_NUMBER, SCORE)
SELECT e.EVALUATION_ID, ec.ITEM_NUMBER, 2 + floor(random()*2)::int
FROM t_evaluation e, t_evaluation_criteria ec
WHERE e.PROFESSIONAL_PRACTICE_ID = 6 AND e.EVALUATOR_TYPE = ec.EVALUATOR_TYPE;

-- Evaluaciones Práctica 7 (Laura Ramírez) - Periodo 2-2025
INSERT INTO t_evaluation (PROFESSIONAL_PRACTICE_ID, EVALUATOR_TYPE, EVALUATOR_NAME, EVALUATOR_CI, TOTAL_SCORE, EVALUATION_DATE, STATUS)
VALUES
(7, 'ACADEMICO', 'MSc. MARÍA GARCÍA', 'V-12345678', 16.00, '2026-01-30', 1),
(7, 'INSTITUCIONAL', 'Lic. HÉCTOR PARRA', 'V-76543210', 17.00, '2026-01-28', 1),
(7, 'COMITE', 'Comité Evaluador PP', 'V-00000000', 16.50, '2026-02-05', 1);

INSERT INTO t_evaluation_detail (EVALUATION_ID, ITEM_NUMBER, SCORE)
SELECT e.EVALUATION_ID, ec.ITEM_NUMBER, 3 + floor(random()*3)::int
FROM t_evaluation e, t_evaluation_criteria ec
WHERE e.PROFESSIONAL_PRACTICE_ID = 7 AND e.EVALUATOR_TYPE = ec.EVALUATOR_TYPE;

-- Evaluaciones Práctica 8 (Carlos Vargas) - Periodo 2-2025
INSERT INTO t_evaluation (PROFESSIONAL_PRACTICE_ID, EVALUATOR_TYPE, EVALUATOR_NAME, EVALUATOR_CI, TOTAL_SCORE, EVALUATION_DATE, STATUS)
VALUES
(8, 'ACADEMICO', 'Dra. ANA RODRÍGUEZ', 'V-34567890', 19.00, '2026-01-30', 1),
(8, 'INSTITUCIONAL', 'Lic. HÉCTOR PARRA', 'V-76543210', 18.00, '2026-01-28', 1),
(8, 'COMITE', 'Comité Evaluador PP', 'V-00000000', 20.00, '2026-02-05', 1);

INSERT INTO t_evaluation_detail (EVALUATION_ID, ITEM_NUMBER, SCORE)
SELECT e.EVALUATION_ID, ec.ITEM_NUMBER, 4 + floor(random()*1)::int
FROM t_evaluation e, t_evaluation_criteria ec
WHERE e.PROFESSIONAL_PRACTICE_ID = 8 AND e.EVALUATOR_TYPE = ec.EVALUATOR_TYPE;

-- ============================================================
-- 17. VISITAS DE SEGUIMIENTO (horas de tutoría)
-- ============================================================
INSERT INTO t_practice_visits (PROFESSIONAL_PRACTICE_ID, TUTOR_ID, VISIT_DATE, TOTAL_HOURS, ACTIVITY, OBSERVATIONS, STATUS)
SELECT pp.PROFESSIONAL_PRACTICE_ID, t.TUTOR_ID,
  '2025-03-15'::date + (interval '1 day' * (pp.PROFESSIONAL_PRACTICE_ID * 5)),
  4 + (pp.PROFESSIONAL_PRACTICE_ID % 3),
  'Visita de seguimiento académico', 'ESTUDIANTE AVANZA SEGÚN CRONOGRAMA', 1
FROM t_professional_practices pp
JOIN t_professional_practices_tutor ppt ON pp.PROFESSIONAL_PRACTICE_ID = ppt.PROFESSIONAL_PRACTICE_ID AND ppt.TUTOR_TYPE = 'ACADEMICO'
JOIN t_tutors t ON ppt.TUTOR_ID = t.TUTOR_ID
WHERE pp.PROFESSIONAL_PRACTICE_ID <= 8;

-- ============================================================
-- 18. COORDINADORES
-- ============================================================
INSERT INTO t_coordinadores (TIPO, CAREER_ID, NAME, SECOND_NAME, SURNAME, SECOND_SURNAME, CI, CARGO, STATUS)
VALUES
('PP', NULL, 'MARBELYS', 'DEL VALLE', 'RIVERO', 'HERNÁNDEZ', 'V-98765432', 'JEFA DEL EQUIPO DE TRABAJO DE PRÁCTICAS PROFESIONALES', 1),
('CARRERA', (SELECT CAREER_ID FROM t_career WHERE CAREER_CODE = 'INF'), 'DANIEL', 'JOSÉ', 'ÁLVAREZ', 'RIVAS', 'V-11122334', 'JEFE DEL ÁREA DE SECRETARIA', 1),
('CARRERA', (SELECT CAREER_ID FROM t_career WHERE CAREER_CODE = 'ENF'), 'CARMEN', 'MAGDALENA', 'RANGEL', 'DE ROJAS', 'V-22334455', 'JEFA DEL ÁREA ACADÉMICA', 1),
('CARRERA', (SELECT CAREER_ID FROM t_career WHERE CAREER_CODE = 'DES'), 'MILAGROS', 'DEL VALLE', 'DABOIN', 'VILLEGAS', 'V-33445566', 'JEFA DE LA UNIDAD DE GESTIÓN EDUCATIVA', 1);

-- ============================================================
-- 19. ACTUALIZAR SECUENCIAS (por si acaso)
-- ============================================================
SELECT setval('t_internships_period_period_id_seq', COALESCE((SELECT MAX(PERIOD_ID) FROM t_internships_period), 1));
SELECT setval('t_career_career_id_seq', COALESCE((SELECT MAX(CAREER_ID) FROM t_career), 1));
SELECT setval('t_students_students_id_seq', COALESCE((SELECT MAX(STUDENTS_ID) FROM t_students), 1));
SELECT setval('t_tutors_tutor_id_seq', COALESCE((SELECT MAX(TUTOR_ID) FROM t_tutors), 1));
SELECT setval('t_institution_institution_id_seq', COALESCE((SELECT MAX(INSTITUTION_ID) FROM t_institution), 1));
SELECT setval('t_professional_practices_professional_practice_id_seq', COALESCE((SELECT MAX(PROFESSIONAL_PRACTICE_ID) FROM t_professional_practices), 1));
SELECT setval('t_evaluation_evaluation_id_seq', COALESCE((SELECT MAX(EVALUATION_ID) FROM t_evaluation), 1));
SELECT setval('t_evaluation_criteria_criteria_id_seq', COALESCE((SELECT MAX(CRITERIA_ID) FROM t_evaluation_criteria), 1));
SELECT setval('t_coordinadores_coordinador_id_seq', COALESCE((SELECT MAX(COORDINADOR_ID) FROM t_coordinadores), 1));

-- ============================================================
-- VERIFICACIÓN: cantidad de datos insertados
-- ============================================================
SELECT 'PERIODOS' AS TABLA, COUNT(*) AS FILAS FROM t_internships_period
UNION ALL SELECT 'CARRERAS', COUNT(*) FROM t_career
UNION ALL SELECT 'TIPOS PASANTÍA', COUNT(*) FROM t_internship_type
UNION ALL SELECT 'PERSONAS', COUNT(*) FROM t_persons
UNION ALL SELECT 'ESTUDIANTES', COUNT(*) FROM t_students
UNION ALL SELECT 'TUTORES', COUNT(*) FROM t_tutors
UNION ALL SELECT 'INSTITUCIONES', COUNT(*) FROM t_institution
UNION ALL SELECT 'PRÁCTICAS PROF.', COUNT(*) FROM t_professional_practices
UNION ALL SELECT 'ASIGNACIONES TUTOR', COUNT(*) FROM t_professional_practices_tutor
UNION ALL SELECT 'EVALUACIONES', COUNT(*) FROM t_evaluation
UNION ALL SELECT 'CRITERIOS EVAL.', COUNT(*) FROM t_evaluation_criteria
UNION ALL SELECT 'VISITAS', COUNT(*) FROM t_practice_visits
UNION ALL SELECT 'COORDINADORES', COUNT(*) FROM t_coordinadores
ORDER BY TABLA;
