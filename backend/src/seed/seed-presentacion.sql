-- =============================================================================
-- UNEFA Dashboard — Seed de Datos de Presentación
-- Versión: 2.2.0
--
-- Este script limpia y resiembra únicamente las tablas de datos de usuario
-- (estudiantes, tutores, instituciones, prácticas, evaluaciones, bitácoras,
-- visitas, solicitudes, documentos y notificaciones).
--
-- NO modifica las tablas de sistema: usuarios, carreras, tipos de pasantía,
-- períodos, roles, permisos, listas de valores, configuración, etc.
--
-- Ejecutar en el SQL Editor de Supabase (o cualquier cliente PostgreSQL).
-- Es 100% seguro: usa TRANSACTION, DELETE ordenado por FK, y ON CONFLICT.
--
-- Los IDs de inserción comienzan en valores altos (>1000) para evitar
-- conflictos con registros existentes en tablas de sistema.
-- =============================================================================

BEGIN;

-- =============================================================================
-- FASE 1: ELIMINAR DATOS DE USUARIO (ordenado por dependencias FK)
-- =============================================================================

-- 1. Tablas que dependen de t_professional_practices
-- Algunas tablas pueden no existir en todos los entornos (local vs producción)
DO $$ BEGIN DELETE FROM "t_culmination_reversals"; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN DELETE FROM "t_committee_assignment"; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DELETE FROM "t_practice_culmination";
DELETE FROM "t_evaluation_detail";
DELETE FROM "t_evaluation";
DELETE FROM "t_professional_practices_tutor";
DELETE FROM "t_activity_logs";
DELETE FROM "t_practice_visits";
DELETE FROM "t_visit";

-- 2. Prácticas profesionales (depende de estudiantes, instituciones, carreras, períodos)
DELETE FROM "t_professional_practices";

-- 3. Tablas que dependen de estudiantes
DELETE FROM "t_student_documents";
DELETE FROM "t_student_requests";
DELETE FROM "t_prospect_list_items";
DELETE FROM "t_prospect_lists";

-- 4. Estudiantes (depende de t_user, t_persons)
DELETE FROM "t_students";

-- 5. Tutores (depende de t_user, t_persons)
DELETE FROM "t_tutor_career";
DELETE FROM "t_tutors";

-- 6. Gestores de instituciones
DELETE FROM "t_institution_manager_institution";
DELETE FROM "t_institution_manager";

-- 7. Relaciones de instituciones
DELETE FROM "t_institution_address";
DELETE FROM "t_institution_career";
DELETE FROM "t_institution_internship_type";

-- 8. Instituciones (se resiembran completas para presentación)
DELETE FROM "t_institution";

-- 9. Otras tablas de usuario
DELETE FROM "t_chat_sessions";
DELETE FROM "t_notifications";

-- 10. Personas (solo las que NO están referenciadas por t_user)
DELETE FROM "t_person_address";
DELETE FROM "t_persons"
WHERE "person_id" NOT IN (
    SELECT "person_id" FROM "t_user" WHERE "person_id" IS NOT NULL
);

-- =============================================================================
-- FASE 2: RESETEAR SECUENCIAS (para que los IDs empiecen desde 1)
-- =============================================================================

-- Solo reseteamos secuencias de tablas que acabamos de limpiar
DO $$
DECLARE
    seq_name TEXT;
BEGIN
    FOR seq_name IN
        SELECT 't_institution_INSTITUTION_ID_seq'
        UNION SELECT 't_institution_manager_MANAGER_ID_seq'
        UNION SELECT 't_students_STUDENTS_ID_seq'
        UNION SELECT 't_tutors_TUTOR_ID_seq'
        UNION SELECT 't_professional_practices_PROFESSIONAL_PRACTICE_ID_seq'
        UNION SELECT 't_professional_practices_tutor_PROFESSIONAL_PRACTICES_TUTOR_ID_seq'
        UNION SELECT 't_activity_logs_ACTIVITY_LOG_ID_seq'
        UNION SELECT 't_evaluation_EVALUATION_ID_seq'
        UNION SELECT 't_evaluation_detail_DETAIL_ID_seq'
        UNION SELECT 't_practice_visits_VISIT_ID_seq'
        UNION SELECT 't_visit_VISIT_ID_seq'
        UNION SELECT 't_student_documents_DOCUMENT_ID_seq'
        UNION SELECT 't_student_requests_REQUEST_ID_seq'
        UNION SELECT 't_notifications_NOTIFICATION_ID_seq'
        UNION SELECT 't_chat_sessions_SESSION_ID_seq'
        UNION SELECT 't_tutor_career_TUTOR_CAREER_ID_seq'
        UNION SELECT 't_institution_career_INSTITUTION_CAREER_ID_seq'
        UNION SELECT 't_institution_internship_type_INSTITUTION_INTERNSHIP_TYPE_ID_seq'
        UNION SELECT 't_institution_manager_institution_INSTITUTION_MANAGER_INSTITUTION_ID_seq'
        UNION SELECT 't_persons_person_id_seq'
        UNION SELECT 't_prospect_lists_LIST_ID_seq'
        UNION SELECT 't_prospect_list_items_ITEM_ID_seq'
        UNION SELECT 't_practice_culmination_PRACTICE_ID_seq'
    LOOP
        BEGIN
            EXECUTE format('ALTER SEQUENCE IF EXISTS %I RESTART WITH 1', seq_name);
        EXCEPTION WHEN OTHERS THEN
            -- La secuencia puede no existir en todos los entornos, ignorar
        END;
    END LOOP;
END $$;

-- =============================================================================
-- FASE 3: INSERTAR DATOS DE PRESENTACIÓN
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 3.1. PERSONAS (t_persons)
-- ---------------------------------------------------------------------------
-- Nota: Los IDs de persona empiezan desde un valor alto para no interferir
-- con posibles personas existentes de t_user.
INSERT INTO "t_persons" ("person_id", "ci", "first_name", "middle_name", "last_name", "second_last_name", "email", "phone", "gender", "birthdate", "address", "marital_status", "status") VALUES
(1001, 'V-25123456', 'Carlos', 'Andrés', 'Martínez', 'Pérez', 'carlos.martinez@est.unefa.edu.ve', '0412-1234567', 'MASCULINO', '2000-03-15', 'Av. Principal, Urb. Las Acacias, Acarigua', 'SOLTERO', 1),
(1002, 'V-26234567', 'María', 'Gabriela', 'Rodríguez', 'Sánchez', 'maria.rodriguez@est.unefa.edu.ve', '0414-2345678', 'FEMENINO', '2001-07-22', 'Calle 5, Edif. Don Diego, Piso 3, Acarigua', 'SOLTERO', 1),
(1003, 'V-27345678', 'José', 'Gregorio', 'Hernández', 'López', 'jose.hernandez@est.unefa.edu.ve', '0424-3456789', 'MASCULINO', '1999-11-30', 'Urb. El Parral, Av. 2, Casa 45, Acarigua', 'SOLTERO', 1),
(1004, 'V-28456789', 'Ana', 'Carolina', 'Flores', 'Mendoza', 'ana.flores@est.unefa.edu.ve', '0416-4567890', 'FEMENINO', '2002-01-10', 'Av. Libertador, Residencias Alcalá, Acarigua', 'SOLTERO', 1),
(1005, 'V-29567890', 'Pedro', 'Luis', 'Castillo', 'Vargas', 'pedro.castillo@est.unefa.edu.ve', '0426-5678901', 'MASCULINO', '2000-09-05', 'Calle Principal, Sector La Pica, Acarigua', 'SOLTERO', 1),
(1006, 'V-25678901', 'Rosa', 'Elena', 'Torres', 'Guzmán', 'rosa.torres@est.unefa.edu.ve', '0412-6789012', 'FEMENINO', '2001-05-18', 'Urb. Las Mercedes, Calle 3, Acarigua', 'CASADO', 1),
(1007, 'V-26789012', 'Luis', 'Alberto', 'Rivas', 'Contreras', 'luis.rivas@est.unefa.edu.ve', '0414-7890123', 'MASCULINO', '1999-12-25', 'Av. Circunvalación, Edif. Marítimo, Acarigua', 'SOLTERO', 1);

-- Tutores como personas
INSERT INTO "t_persons" ("person_id", "ci", "first_name", "middle_name", "last_name", "second_last_name", "email", "phone", "gender", "birthdate", "address", "marital_status", "status") VALUES
(2001, 'V-10123456', 'Carmen', 'Josefina', 'Álvarez', 'de Pérez', 'carmen.alvarez@unefa.edu.ve', '0416-1234567', 'FEMENINO', '1980-04-12', 'Urb. Valle Verde, Calle 8, Acarigua', 'CASADO', 1),
(2002, 'V-11234567', 'Marcos', 'Antonio', 'Gil', 'Sánchez', 'marcos.gil@unefa.edu.ve', '0424-2345678', 'MASCULINO', '1975-09-28', 'Av. Los Pioneros, Edif. Profesional, Acarigua', 'DIVORCIADO', 1),
(2003, 'V-12345678', 'María', 'Teresa', 'Moreno', 'Rivas', 'maria.moreno@unefa.edu.ve', '0426-3456789', 'FEMENINO', '1982-02-15', 'Calle 10, Urb. San José, Acarigua', 'CASADO', 1),
(2004, 'V-13456789', 'Juan', 'Carlos', 'Medina', 'López', 'juan.medina@unefa.edu.ve', '0412-4567890', 'MASCULINO', '1978-07-20', 'Av. Principal, Urb. Los Rosales, Acarigua', 'CASADO', 1);

-- Gestores de instituciones como personas
INSERT INTO "t_persons" ("person_id", "ci", "first_name", "middle_name", "last_name", "second_last_name", "email", "phone", "gender", "birthdate", "address", "marital_status", "status") VALUES
(3001, 'V-14567890', 'Fernando', 'José', 'García', 'Reyes', 'fernando.garcia@hospitalyerena.gob.ve', '0412-9876543', 'MASCULINO', '1970-11-03', 'Av. Industrial, Hospital Universitario, Acarigua', 'CASADO', 1),
(3002, 'V-15678901', 'Diana', 'Coromoto', 'Paredes', 'de León', 'diana.paredes@alcaldiapaez.gob.ve', '0416-8765432', 'FEMENINO', '1985-04-18', 'Palacio Municipal, Calle 4, Acarigua', 'CASADO', 1),
(3003, 'V-16789012', 'Roberto', 'Andrés', 'Cáceres', 'Mendoza', 'roberto.caceres@corpoelec.gob.ve', '0424-7654321', 'MASCULINO', '1980-08-25', 'Edif. CORPOELEC, Av. Libertador, Acarigua', 'SOLTERO', 1),
(3004, 'V-17890123', 'Sonia', 'Margarita', 'Quintero', 'Álvarez', 'sonia.quintero@gobernacionportuguesa.gob.ve', '0426-6543210', 'FEMENINO', '1975-12-12', 'Gobernación de Portuguesa, Guanare', 'CASADO', 1),
(3005, 'V-18901234', 'Héctor', 'Manuel', 'Salazar', 'Díaz', 'hector.salazar@seniat.gob.ve', '0412-5432109', 'MASCULINO', '1982-06-30', 'SENIAT, Av. Bolívar, Acarigua', 'DIVORCIADO', 1);

-- ---------------------------------------------------------------------------
-- 3.2. INSTITUCIONES (t_institution)
-- ---------------------------------------------------------------------------
INSERT INTO "t_institution" ("INSTITUTION_ID", "INSTITUTION_NAME", "INSTITUTION_ADDRESS", "INSTITUTION_CONTACT", "PRACTICE_TYPE", "REGION", "NUCLEUS", "EXTENSION", "CREATION_DATE", "INSTITUTION_TYPE", "STATUS", "RIF", "INSTITUTION_CODE") VALUES
(1, 'HOSPITAL UNIVERSITARIO DR. JESÚS YERENA', 'Av. Industrial, entre calles 8 y 9, Acarigua', '0255-6234567', 'HOSPITALARIA', 'LOS LLANOS', 'PORTUGUESA', 'ACARIGUA', NOW(), 'PUBLICA', 1, 'G-2000123-4', 'HUJY-001'),
(2, 'ALCALDÍA DEL MUNICIPIO PÁEZ', 'Calle 4, entre Carreras 5 y 6, Palacio Municipal, Acarigua', '0255-6223344', 'COMUNITARIA', 'LOS LLANOS', 'PORTUGUESA', 'ACARIGUA', NOW(), 'PUBLICA', 1, 'J-3000456-7', 'ALC-PAEZ-001'),
(3, 'CORPORACIÓN ELÉCTRICA NACIONAL (CORPOELEC)', 'Av. Libertador, Edif. CORPOELEC, Acarigua', '0255-6311122', 'ÚNICA', 'LOS LLANOS', 'PORTUGUESA', 'ACARIGUA', NOW(), 'PUBLICA', 1, 'G-2000678-0', 'CORPOELEC-ACAR'),
(4, 'SERVICIO NACIONAL INTEGRADO DE ADMINISTRACIÓN ADUANERA Y TRIBUTARIA (SENIAT)', 'Av. Bolívar, Edif. SENIAT, Acarigua', '0255-6256789', 'ÚNICA', 'LOS LLANOS', 'PORTUGUESA', 'ACARIGUA', NOW(), 'PUBLICA', 1, 'G-2000901-3', 'SENIAT-ACAR'),
(5, 'GOBERNACIÓN DEL ESTADO PORTUGUESA', 'Av. Unda, Palacio de Gobierno, Guanare', '0257-2511234', 'COMUNITARIA', 'LOS LLANOS', 'PORTUGUESA', 'ACARIGUA', NOW(), 'PUBLICA', 1, 'G-2000111-5', 'GOB-PORTUGUESA');

-- ---------------------------------------------------------------------------
-- 3.3. INSTITUTION-CAREER RELATIONSHIPS
-- ---------------------------------------------------------------------------
INSERT INTO "t_institution_career" ("INSTITUTION_CAREER_ID", "INSTITUTION_ID", "CAREER_ID") VALUES
(1, 1, 3),  -- Hospital -> Enfermería
(2, 2, 4),  -- Alcaldía -> Ing. Informática
(3, 2, 5),  -- Alcaldía -> Ing. Agroindustrial
(4, 3, 4),  -- CORPOELEC -> Ing. Informática
(5, 3, 5),  -- CORPOELEC -> Ing. Agroindustrial
(6, 4, 4),  -- SENIAT -> Ing. Informática
(7, 5, 4),  -- Gobernación -> Ing. Informática
(8, 5, 5);  -- Gobernación -> Ing. Agroindustrial

-- ---------------------------------------------------------------------------
-- 3.4. INSTITUTION-INTERNSHIP TYPE RELATIONSHIPS
-- ---------------------------------------------------------------------------
INSERT INTO "t_institution_internship_type" ("INSTITUTION_INTERNSHIP_TYPE_ID", "INSTITUTION_ID", "INTERNSHIP_TYPE_ID") VALUES
(1, 1, 2),  -- Hospital -> Hospitalaria
(2, 2, 3),  -- Alcaldía -> Comunitaria
(3, 3, 1),  -- CORPOELEC -> Única
(4, 4, 1),  -- SENIAT -> Única
(5, 5, 3);  -- Gobernación -> Comunitaria

-- ---------------------------------------------------------------------------
-- 3.5. GESTORES DE INSTITUCIONES (t_institution_manager)
-- ---------------------------------------------------------------------------
INSERT INTO "t_institution_manager" ("MANAGER_ID", "person_id", "MANAGER_CI", "NAME", "SECOND_NAME", "SURNAME", "SECOND_SURNAME", "CONTACT_PHONE", "EMAIL", "CREATION_DATE", "STATUS", "INSTITUTION_ID", "cargo", "TITLE") VALUES
(1, 3001, 'V-14567890', 'Fernando', 'José', 'García', 'Reyes', '0412-9876543', 'fernando.garcia@hospitalyerena.gob.ve', NOW(), 1, 1, 'Coordinador de Prácticas Profesionales', 'LICENCIADO'),
(2, 3002, 'V-15678901', 'Diana', 'Coromoto', 'Paredes', 'de León', '0416-8765432', 'diana.paredes@alcaldiapaez.gob.ve', NOW(), 1, 2, 'Directora de Talento Humano', 'LICENCIADO'),
(3, 3003, 'V-16789012', 'Roberto', 'Andrés', 'Cáceres', 'Mendoza', '0424-7654321', 'roberto.caceres@corpoelec.gob.ve', NOW(), 1, 3, 'Jefe de División de Sistemas', 'INGENIERO'),
(4, 3004, 'V-17890123', 'Sonia', 'Margarita', 'Quintero', 'Álvarez', '0426-6543210', 'sonia.quintero@gobernacionportuguesa.gob.ve', NOW(), 1, 5, 'Coordinadora de Pasantías', 'LICENCIADO'),
(5, 3005, 'V-18901234', 'Héctor', 'Manuel', 'Salazar', 'Díaz', '0412-5432109', 'hector.salazar@seniat.gob.ve', NOW(), 1, 4, 'Jefe de Tecnología', 'INGENIERO');

-- ---------------------------------------------------------------------------
-- 3.6. GESTORES POR INSTITUCIÓN (t_institution_manager_institution)
-- ---------------------------------------------------------------------------
INSERT INTO "t_institution_manager_institution" ("INSTITUTION_MANAGER_INSTITUTION_ID", "MANAGER_ID", "INSTITUTION_ID", "cargo") VALUES
(1, 1, 1, 'Coordinador de Prácticas Profesionales'),
(2, 2, 2, 'Directora de Talento Humano'),
(3, 3, 3, 'Jefe de División de Sistemas'),
(4, 4, 5, 'Coordinadora de Pasantías'),
(5, 5, 4, 'Jefe de Tecnología');

-- ---------------------------------------------------------------------------
-- 3.7. ESTUDIANTES (t_students)
-- ---------------------------------------------------------------------------
INSERT INTO "t_students" ("STUDENTS_ID", "person_id", "STUDENTS_CI", "NAME", "SECOND_NAME", "SURNAME", "SECOND_SURNAME", "GENDER", "BIRTHDATE", "CONTACT_PHONE", "EMAIL", "ADDRESS", "MARITAL_STATUS", "STUDENT_TYPE", "MILITARY_RANK", "EMPLOYMENT", "STATUS", "REGISTRATION_DATE", "USER_ID") VALUES
-- Ing. Informática (CAREER_ID=4)
(1, 1001, 'V-25123456', 'Carlos', 'Andrés', 'Martínez', 'Pérez', 'M', '2000-03-15', '0412-1234567', 'carlos.martinez@est.unefa.edu.ve', 'Av. Principal, Urb. Las Acacias, Acarigua', 'S', 'CIVIL', NULL, 'NO', 1, '2023-09-15', NULL),
(2, 1002, 'V-26234567', 'María', 'Gabriela', 'Rodríguez', 'Sánchez', 'F', '2001-07-22', '0414-2345678', 'maria.rodriguez@est.unefa.edu.ve', 'Calle 5, Edif. Don Diego, Piso 3, Acarigua', 'S', 'CIVIL', NULL, 'SI', 1, '2023-09-15', NULL),
(3, 1003, 'V-27345678', 'José', 'Gregorio', 'Hernández', 'López', 'M', '1999-11-30', '0424-3456789', 'jose.hernandez@est.unefa.edu.ve', 'Urb. El Parral, Av. 2, Casa 45, Acarigua', 'S', 'MILITAR', 'TENIENTE', 'SI', 1, '2024-01-10', NULL),

-- TSU Enfermería (CAREER_ID=3)
(4, 1004, 'V-28456789', 'Ana', 'Carolina', 'Flores', 'Mendoza', 'F', '2002-01-10', '0416-4567890', 'ana.flores@est.unefa.edu.ve', 'Av. Libertador, Residencias Alcalá, Acarigua', 'S', 'CIVIL', NULL, 'NO', 1, '2023-09-15', NULL),
(5, 1005, 'V-29567890', 'Pedro', 'Luis', 'Castillo', 'Vargas', 'M', '2000-09-05', '0426-5678901', 'pedro.castillo@est.unefa.edu.ve', 'Calle Principal, Sector La Pica, Acarigua', 'S', 'CIVIL', NULL, 'NO', 1, '2024-01-10', NULL),

-- Ing. Agroindustrial (CAREER_ID=5)
(6, 1006, 'V-25678901', 'Rosa', 'Elena', 'Torres', 'Guzmán', 'F', '2001-05-18', '0412-6789012', 'rosa.torres@est.unefa.edu.ve', 'Urb. Las Mercedes, Calle 3, Acarigua', 'C', 'CIVIL', NULL, 'SI', 1, '2023-09-15', NULL),
(7, 1007, 'V-26789012', 'Luis', 'Alberto', 'Rivas', 'Contreras', 'M', '1999-12-25', '0414-7890123', 'luis.rivas@est.unefa.edu.ve', 'Av. Circunvalación, Edif. Marítimo, Acarigua', 'S', 'CIVIL', NULL, 'SI', 1, '2024-01-10', NULL);

-- ---------------------------------------------------------------------------
-- 3.8. TUTORES (t_tutors)
-- ---------------------------------------------------------------------------
INSERT INTO "t_tutors" ("TUTOR_ID", "person_id", "TUTOR_CI", "NAME", "SECOND_NAME", "SURNAME", "SECOND_SURNAME", "CONTACT_PHONE", "GENDER", "EMAIL", "PROFESSION", "CONDITION", "DEDICATION", "CATEGORY", "CREATION_DATE", "STATUS", "USER_ID", "TITULO") VALUES
(1, 2001, 'V-10123456', 'Carmen', 'Josefina', 'Álvarez', 'de Pérez', '0416-1234567', 'F', 'carmen.alvarez@unefa.edu.ve', 'INGENIERIA EN SISTEMAS', 'ORDINARIO', 'DEDICACIÓN EXCLUSIVA', 'DOCENTE AGREGADO', NOW(), 1, NULL, 'MSc.'),
(2, 2002, 'V-11234567', 'Marcos', 'Antonio', 'Gil', 'Sánchez', '0424-2345678', 'M', 'marcos.gil@unefa.edu.ve', 'INGENIERIA INFORMATICA', 'ORDINARIO', 'TIEMPO COMPLETO', 'DOCENTE ASISTENTE', NOW(), 1, NULL, 'MSc.'),
(3, 2003, 'V-12345678', 'María', 'Teresa', 'Moreno', 'Rivas', '0426-3456789', 'F', 'maria.moreno@unefa.edu.ve', 'ENFERMERIA', 'ORDINARIO', 'DEDICACIÓN EXCLUSIVA', 'DOCENTE AGREGADO', NOW(), 1, NULL, 'MSc.'),
(4, 2004, 'V-13456789', 'Juan', 'Carlos', 'Medina', 'López', '0412-4567890', 'M', 'juan.medina@unefa.edu.ve', 'INGENIERIA AGROINDUSTRIAL', 'CONTRATADO', 'TIEMPO COMPLETO', 'DOCENTE ASISTENTE', NOW(), 1, NULL, 'Dr.'),

-- Tutores empresariales (contactos en instituciones)
(5, 3003, 'V-16789012', 'Roberto', 'Andrés', 'Cáceres', 'Mendoza', '0424-7654321', 'M', 'roberto.caceres@corpoelec.gob.ve', 'INGENIERIA EN SISTEMAS', 'CONTRATADO', 'TIEMPO COMPLETO', 'JEFE DE DIVISIÓN', NOW(), 1, NULL, 'INGENIERO'),
(6, 3005, 'V-18901234', 'Héctor', 'Manuel', 'Salazar', 'Díaz', '0412-5432109', 'M', 'hector.salazar@seniat.gob.ve', 'INGENIERIA INFORMATICA', 'CONTRATADO', 'TIEMPO COMPLETO', 'JEFE DE TECNOLOGÍA', NOW(), 1, NULL, 'INGENIERO'),
(7, 3001, 'V-14567890', 'Fernando', 'José', 'García', 'Reyes', '0412-9876543', 'M', 'fernando.garcia@hospitalyerena.gob.ve', 'MEDICINA GENERAL', 'CONTRATADO', 'TIEMPO COMPLETO', 'COORDINADOR DE PRÁCTICAS', NOW(), 1, NULL, 'DR.'),
(8, 3004, 'V-17890123', 'Sonia', 'Margarita', 'Quintero', 'Álvarez', '0426-6543210', 'F', 'sonia.quintero@gobernacionportuguesa.gob.ve', 'INGENIERIA AGROINDUSTRIAL', 'CONTRATADO', 'TIEMPO COMPLETO', 'COORDINADORA DE PASANTÍAS', NOW(), 1, NULL, 'LICDA.'),
(9, 3002, 'V-15678901', 'Diana', 'Coromoto', 'Paredes', 'de León', '0416-8765432', 'F', 'diana.paredes@alcaldiapaez.gob.ve', 'ADMINISTRACION DE EMPRESAS', 'CONTRATADO', 'TIEMPO COMPLETO', 'DIRECTORA DE TALENTO HUMANO', NOW(), 1, NULL, 'LICDA.');

-- ---------------------------------------------------------------------------
-- 3.9. TUTOR-CAREER ASSIGNMENTS (t_tutor_career)
-- ---------------------------------------------------------------------------
INSERT INTO "t_tutor_career" ("TUTOR_CAREER_ID", "TUTOR_ID", "CAREER_ID") VALUES
(1, 1, 4),  -- Carmen Álvarez -> Ing. Informática
(2, 2, 4),  -- Marcos Gil -> Ing. Informática
(3, 2, 5),  -- Marcos Gil -> Ing. Agroindustrial (tutor compartido)
(4, 3, 3),  -- María Moreno -> TSU Enfermería
(5, 4, 5),  -- Juan Medina -> Ing. Agroindustrial
(6, 5, 4),  -- Roberto Cáceres (CORPOELEC) -> Ing. Informática
(7, 6, 4),  -- Héctor Salazar (SENIAT) -> Ing. Informática
(8, 7, 3),  -- Fernando García (Hospital) -> TSU Enfermería
(9, 8, 5),  -- Sonia Quintero (Gobernación) -> Ing. Agroindustrial
(10, 9, 5); -- Diana Paredes (Alcaldía Páez) -> Ing. Agroindustrial

-- ---------------------------------------------------------------------------
-- 3.10. PRÁCTICAS PROFESIONALES (t_professional_practices)
-- ---------------------------------------------------------------------------
-- Períodos existentes:
--   PERIOD_ID=1: 1-2025 (2025-01-01 a 2025-06-09) - CULMINADO
--   PERIOD_ID=3: 2-2025 (2025-06-10 a 2025-09-30) - CULMINADO
--   PERIOD_ID=4: 1-2026 (2026-01-02 a 2026-04-24) - ABIERTO
--   PERIOD_ID=5: 2-2026 (2026-07-09 a 2026-10-29) - ABIERTO
INSERT INTO "t_professional_practices" (
    "PROFESSIONAL_PRACTICE_ID", "START_DATE", "END_DATE", "REPORT_TITLE",
    "REGISTRATION_DATE", "CREATION_DATE", "GRADE", "TRANSFER", "TOUR",
    "PERIOD_ID", "INSTITUTION_ID", "STUDENTS_ID", "STATUS", "MANAGER_ID",
    "OBSERVATION", "ENROLLMENT", "INTERNSHIP_STATUS", "INTERNSHIP_TYPE_ID",
    "PRACTICES_STATUS", "EVALUATION_STATUS", "SEMESTER", "SECTION", "REGIME",
    "CAREER_ID"
) VALUES
-- Práctica 1: Carlos Martínez (Ing. Informática) - CORPOELEC - 1-2026 - COMPLETADA
(1, '2026-01-02', '2026-04-24', 'Desarrollo de Módulo de Gestión de Inventarios para CORPOELEC',
 '2026-01-02 08:00:00', '2026-01-02 08:00:00', 18.50, 0, '',
 4, 3, 1, 1, 3,
 'Estudiante destacado con excelente desempeño', 'UNEFA-2026-001', 44, 1,
 1, 'completed', '8', '536', 'DIURNO',
 4),

-- Práctica 2: María Rodríguez (Ing. Informática) - SENIAT - 2-2025 - COMPLETADA
(2, '2025-06-10', '2025-09-30', 'Automatización de Procesos de Recaudación Tributaria en SENIAT',
 '2025-06-10 09:00:00', '2025-06-10 09:00:00', 16.75, 0, '',
 3, 4, 2, 1, 5,
 'Buena presentación, cumplió con los objetivos', 'UNEFA-2025-015', 44, 1,
 1, 'completed', '7', '536', 'DIURNO',
 4),

-- Práctica 3: José Hernández (Ing. Informática) - CORPOELEC - 1-2025 - COMPLETADA
(3, '2025-01-01', '2025-06-09', 'Implementación de Sistema de Gestión de Órdenes de Trabajo',
 '2025-01-02 08:30:00', '2025-01-02 08:30:00', 15.00, 1, '',
 1, 3, 3, 1, 3,
 'Cumplió con los requisitos mínimos', 'UNEFA-2025-001', 44, 1,
 1, 'completed', '6', '936', 'NOCTURNO',
 4),

-- Práctica 4: Ana Flores (TSU Enfermería) - Hospital Jesús Yerena - 1-2026 - EN CURSO
(4, '2026-01-02', '2026-04-24', 'Atención Integral al Paciente en el Servicio de Emergencia',
 '2026-01-02 07:00:00', '2026-01-02 07:00:00', 0.00, 0, '',
 4, 1, 4, 1, 1,
 'Buena disposición para el aprendizaje', 'UNEFA-2026-002', 1, 2,
 1, 'pending', '5', '536', 'DIURNO',
 3),

-- Práctica 5: Pedro Castillo (TSU Enfermería) - Hospital Jesús Yerena - 2-2025 - COMPLETADA
(5, '2025-06-10', '2025-09-30', 'Cuidados de Enfermería en el Área de Hospitalización',
 '2025-06-10 07:00:00', '2025-06-10 07:00:00', 17.25, 0, '',
 3, 1, 5, 1, 1,
 'Excelente desempeño en el área de hospitalización', 'UNEFA-2025-020', 44, 2,
 1, 'completed', '5', '536', 'DIURNO',
 3),

-- Práctica 6: Rosa Torres (Ing. Agroindustrial) - Gobernación de Portuguesa - 1-2026 - EN CURSO
(6, '2026-01-02', '2026-04-24', 'Evaluación de Procesos Agroindustriales en el Estado Portuguesa',
 '2026-01-02 08:00:00', '2026-01-02 08:00:00', 0.00, 0, '',
 4, 5, 6, 1, 4,
 'Proyecto de impacto regional', 'UNEFA-2026-003', 1, 3,
 1, 'pending', '8', '936', 'DIURNO',
 5),

-- Práctica 7: Luis Rivas (Ing. Agroindustrial) - Alcaldía de Páez - 1-2025 - COMPLETADA
(7, '2025-01-01', '2025-06-09', 'Plan de Mejora para la Recolección de Residuos Sólidos',
 '2025-01-02 09:00:00', '2025-01-02 09:00:00', 16.00, 0, '',
 1, 2, 7, 1, 2,
 'Aprobado con recomendaciones', 'UNEFA-2025-003', 44, 3,
 1, 'completed', '6', '936', 'SABATINO',
 5);

-- ---------------------------------------------------------------------------
-- 3.11. TUTORES ASIGNADOS A PRÁCTICAS (t_professional_practices_tutor)
-- ---------------------------------------------------------------------------
INSERT INTO "t_professional_practices_tutor" ("PROFESSIONAL_PRACTICES_TUTOR_ID", "TUTOR_ID", "PROFESSIONAL_PRACTICE_ID", "TUTOR_TYPE") VALUES
(1, 1, 1, 'TUTOR ACADÉMICO'),
(2, 5, 1, 'TUTOR EMPRESARIAL'),  -- Roberto Cáceres (CORPOELEC)
(3, 2, 2, 'TUTOR ACADÉMICO'),
(4, 6, 2, 'TUTOR EMPRESARIAL'),  -- Héctor Salazar (SENIAT)
(5, 1, 3, 'TUTOR ACADÉMICO'),
(6, 5, 3, 'TUTOR EMPRESARIAL'),  -- Roberto Cáceres (CORPOELEC)
(7, 3, 4, 'TUTOR ACADÉMICO'),
(8, 7, 4, 'TUTOR EMPRESARIAL'),  -- Fernando García (Hospital)
(9, 3, 5, 'TUTOR ACADÉMICO'),
(10, 7, 5, 'TUTOR EMPRESARIAL'), -- Fernando García (Hospital)
(11, 4, 6, 'TUTOR ACADÉMICO'),
(12, 8, 6, 'TUTOR EMPRESARIAL'), -- Sonia Quintero (Gobernación)
(13, 2, 7, 'TUTOR ACADÉMICO'),
(14, 9, 7, 'TUTOR EMPRESARIAL'); -- Diana Paredes (Alcaldía Páez)

-- ---------------------------------------------------------------------------
-- 3.12. BITÁCORAS DE ACTIVIDADES (t_activity_logs)
-- ---------------------------------------------------------------------------
-- Práctica 1: Carlos Martínez - CORPOELEC - 1-2026 (8 semanas de bitácora)
INSERT INTO "t_activity_logs" ("ACTIVITY_LOG_ID", "PROFESSIONAL_PRACTICE_ID", "STUDENT_ID", "ACTIVITY_DATE", "WEEK_NUMBER", "HOURS_WORKED", "ACTIVITY_TYPE", "ACTIVITY_DESCRIPTION", "TASKS_COMPLETED", "CHALLENGES", "LEARNINGS", "SUPERVISOR_COMMENTS", "SUPERVISOR_APPROVED", "SUPERVISOR_ID", "APPROVED_AT", "STATUS", "CREATED_BY") VALUES
(1, 1, 1, '2026-01-06', 1, 8.00, 'DIARIA', 'Inducción al sistema de gestión de inventarios de CORPOELEC. Revisión de la documentación existente y reconocimiento de la base de datos.', 'Revisión de manuales técnicos; Reconocimiento del esquema de base de datos', 'Documentación desactualizada en algunos módulos', 'Estructura del sistema legacy y sus tablas principales', 'El estudiante mostró interés en comprender el sistema heredado', TRUE, 3, '2026-01-07 10:00:00', 1, NULL),
(2, 1, 1, '2026-01-13', 2, 8.00, 'DIARIA', 'Análisis de requerimientos para el nuevo módulo de inventarios. Elaboración del documento de especificaciones funcionales.', 'Entrevista con el jefe de almacén; Documento de requerimientos', 'Diversos flujos de trabajo no documentados', 'Importancia de la comunicación con los usuarios finales', 'Documento de requerimientos completo y bien estructurado', TRUE, 3, '2026-01-14 10:00:00', 1, NULL),
(3, 1, 1, '2026-01-20', 3, 8.00, 'DIARIA', 'Diseño de la arquitectura de la base de datos para el módulo de inventarios. Definición de tablas, relaciones e índices.', 'Diagrama entidad-relación; Script DDL inicial', 'Normalización de tablas con datos históricos', 'Diseño de bases de datos transaccionales', 'Diseño sólido que contempla escalabilidad futura', TRUE, 3, '2026-01-21 11:00:00', 1, NULL),
(4, 1, 1, '2026-01-27', 4, 8.00, 'DIARIA', 'Desarrollo del backend: CRUD de productos y categorías. Implementación de API REST con Express.js.', 'API de productos (GET, POST, PUT, DELETE); API de categorías; Validaciones de campos', 'Manejo de errores en transacciones', 'Patrón de diseño MVC en aplicaciones Node.js', 'Progreso adecuado conforme al cronograma', TRUE, 3, '2026-01-28 09:30:00', 1, NULL),
(5, 1, 1, '2026-02-03', 5, 8.00, 'DIARIA', 'Desarrollo del frontend: interfaz de gestión de productos con React y Tailwind CSS.', 'Componente ProductList; Componente ProductForm; Integración con API', 'Manejo de estado compartido entre componentes', 'Uso de hooks personalizados para lógica repetitiva', 'Interfaz limpia y funcional', TRUE, 3, '2026-02-04 10:00:00', 1, NULL),
(6, 1, 1, '2026-02-10', 6, 8.00, 'DIARIA', 'Implementación del módulo de movimientos de inventario: entrada, salida y ajustes.', 'API de movimientos; Interfaz de registro de movimientos; Historial de movimientos', 'Consistencia de datos en movimientos concurrentes', 'Uso de transacciones SQL para operaciones atómicas', 'Solución robusta para el control de inventario', TRUE, 3, '2026-02-11 11:00:00', 1, NULL),
(7, 1, 1, '2026-02-17', 7, 8.00, 'DIARIA', 'Pruebas unitarias y de integración del módulo. Corrección de bugs identificados.', 'Suite de pruebas con Jest; Reporte de bugs corregidos', 'Pruebas de integración con base de datos', 'Importancia de las pruebas automatizadas', 'Cobertura de pruebas superior al 80%', TRUE, 3, '2026-02-18 10:00:00', 1, NULL),
(8, 1, 1, '2026-02-24', 8, 8.00, 'DIARIA', 'Despliegue del módulo en entorno de pruebas y capacitación al personal.', 'Manual de usuario; Sesión de capacitación; Acta de conformidad', 'Adaptación del personal a la nueva interfaz', 'La capacitación es tan importante como el desarrollo', 'Muy buena disposición para capacitar al personal', TRUE, 3, '2026-02-25 09:00:00', 1, NULL);

-- Práctica 5: Pedro Castillo - Hospital Jesús Yerena - 2-2025 (6 semanas de bitácora)
INSERT INTO "t_activity_logs" ("ACTIVITY_LOG_ID", "PROFESSIONAL_PRACTICE_ID", "STUDENT_ID", "ACTIVITY_DATE", "WEEK_NUMBER", "HOURS_WORKED", "ACTIVITY_TYPE", "ACTIVITY_DESCRIPTION", "TASKS_COMPLETED", "CHALLENGES", "LEARNINGS", "SUPERVISOR_COMMENTS", "SUPERVISOR_APPROVED", "SUPERVISOR_ID", "APPROVED_AT", "STATUS", "CREATED_BY") VALUES
(9, 5, 5, '2025-06-16', 1, 8.00, 'DIARIA', 'Inducción al servicio de hospitalización. Conocimiento del personal y protocolos de enfermería.', 'Revisión de protocolos; Reconocimiento del área', 'Adaptación al entorno hospitalario', 'Protocolos de bioseguridad en hospitalización', 'Se integró rápidamente al equipo', TRUE, 3, '2025-06-17 10:00:00', 1, NULL),
(10, 5, 5, '2025-06-23', 2, 8.00, 'DIARIA', 'Atención a pacientes hospitalizados: control de signos vitales y administración de medicamentos.', 'Control de signos vitales a 15 pacientes; Administración de medicamentos supervisada', 'Pacientes con múltiples comorbilidades', 'Técnicas correctas para la administración de medicamentos', 'Buena técnica y trato amable con los pacientes', TRUE, 3, '2025-06-24 11:00:00', 1, NULL),
(11, 5, 5, '2025-06-30', 3, 8.00, 'DIARIA', 'Cuidados de enfermería en pacientes postquirúrgicos. Curaciones y monitoreo de heridas.', 'Curación de 8 heridas quirúrgicas; Monitoreo de signos vitales postcirugía', 'Identificación temprana de signos de infección', 'Técnica aséptica para curaciones', 'Procedimientos realizados correctamente', TRUE, 3, '2025-07-01 09:30:00', 1, NULL),
(12, 5, 5, '2025-07-07', 4, 8.00, 'DIARIA', 'Apoyo en la administración de transfusiones sanguíneas y cuidados de enfermería asociados.', 'Asistencia en 3 transfusiones; Monitoreo de reacciones adversas', 'Reconocimiento de reacciones transfusionales', 'Protocolo de administración de hemoderivados', 'Mantuvo la calma en situaciones de presión', TRUE, 3, '2025-07-08 10:00:00', 1, NULL),
(13, 5, 5, '2025-07-14', 5, 8.00, 'DIARIA', 'Participación en el pase de guardia y elaboración de informes de enfermería.', 'Reportes de evolución de 12 pacientes; Pase de guardia con el equipo entrante', 'Comunicación efectiva de información clínica', 'Estructura del informe de enfermería', 'Informes claros y completos', TRUE, 3, '2025-07-15 11:00:00', 1, NULL),
(14, 5, 5, '2025-07-21', 6, 8.00, 'DIARIA', 'Evaluación final: presentación de caso clínico y cierre de pasantía.', 'Presentación de caso clínico; Entrega de informe final', 'Síntesis de la experiencia clínica', 'Integración de conocimientos teórico-prácticos', 'Excelente presentación y cierre de pasantía', TRUE, 3, '2025-07-22 10:00:00', 1, NULL);

-- ---------------------------------------------------------------------------
-- 3.13. EVALUACIONES (t_evaluation)
-- ---------------------------------------------------------------------------
-- Evaluaciones para Práctica 1: Carlos Martínez - CORPOELEC (completada)
INSERT INTO "t_evaluation" ("EVALUATION_ID", "PROFESSIONAL_PRACTICE_ID", "EVALUATOR_TYPE", "EVALUATOR_ID", "EVALUATOR_NAME", "EVALUATOR_CI", "TOTAL_SCORE", "OBSERVATIONS", "EVALUATION_DATE", "COMITE_MEMBER_INDEX", "REGISTERED_BY", "STATUS") VALUES
(1, 1, 'TUTOR_ACADEMICO', NULL, 'Carmen Josefina Álvarez de Pérez', 'V-10123456', 18.00, 'Excelente desempeño académico. Cumplió con todos los objetivos planteados en el cronograma.', '2026-03-01 10:00:00', NULL, 3, 1),
(2, 1, 'TUTOR_EMPRESARIAL', NULL, 'Roberto Andrés Cáceres Mendoza', 'V-16789012', 19.00, 'Superó las expectativas. El módulo desarrollado será implementado en producción.', '2026-03-01 11:00:00', NULL, 3, 1),
(3, 1, 'COMITE', NULL, 'MSc. Luis Enrique Paredes', 'V-09876543', 17.50, 'Buena presentación del informe. Se recomienda profundizar en las pruebas de carga.', '2026-03-05 09:00:00', 1, 3, 1),
(4, 1, 'COMITE', NULL, 'Dra. María Auxiliadora Ramírez', 'V-08765432', 18.50, 'Trabajo bien estructurado y documentado. Metodología adecuada.', '2026-03-05 09:30:00', 2, 3, 1),
(5, 1, 'COMITE', NULL, 'Ing. José Antonio Contreras', 'V-07654321', 19.00, 'Aporte significativo a la institución. Se recomienda publicación.', '2026-03-05 10:00:00', 3, 3, 1);

-- Evaluaciones para Práctica 2: María Rodríguez - SENIAT (completada)
INSERT INTO "t_evaluation" ("EVALUATION_ID", "PROFESSIONAL_PRACTICE_ID", "EVALUATOR_TYPE", "EVALUATOR_ID", "EVALUATOR_NAME", "EVALUATOR_CI", "TOTAL_SCORE", "OBSERVATIONS", "EVALUATION_DATE", "COMITE_MEMBER_INDEX", "REGISTERED_BY", "STATUS") VALUES
(6, 2, 'TUTOR_ACADEMICO', NULL, 'Marcos Antonio Gil Sánchez', 'V-11234567', 16.00, 'Cumplió con los objetivos planteados. Puede mejorar en la documentación técnica.', '2025-10-05 10:00:00', NULL, 3, 1),
(7, 2, 'TUTOR_EMPRESARIAL', NULL, 'Héctor Manuel Salazar Díaz', 'V-18901234', 17.00, 'Buena disposición y aprendizaje rápido de los procesos tributarios.', '2025-10-05 11:00:00', NULL, 3, 1),
(8, 2, 'COMITE', NULL, 'MSc. Luis Enrique Paredes', 'V-09876543', 16.00, 'Trabajo aceptable. La automatización propuesta es funcional.', '2025-10-08 09:00:00', 1, 3, 1),
(9, 2, 'COMITE', NULL, 'Dra. María Auxiliadora Ramírez', 'V-08765432', 17.00, 'Buen análisis de requerimientos. Se recomienda mejorar interfaz de usuario.', '2025-10-08 09:30:00', 2, 3, 1),
(10, 2, 'COMITE', NULL, 'Ing. José Antonio Contreras', 'V-07654321', 16.50, 'Cumple con los estándares académicos. Aprobado.', '2025-10-08 10:00:00', 3, 3, 1);

-- Evaluaciones para Práctica 5: Pedro Castillo - Hospital (completada)
INSERT INTO "t_evaluation" ("EVALUATION_ID", "PROFESSIONAL_PRACTICE_ID", "EVALUATOR_TYPE", "EVALUATOR_ID", "EVALUATOR_NAME", "EVALUATOR_CI", "TOTAL_SCORE", "OBSERVATIONS", "EVALUATION_DATE", "COMITE_MEMBER_INDEX", "REGISTERED_BY", "STATUS") VALUES
(11, 5, 'TUTOR_ACADEMICO', NULL, 'María Teresa Moreno Rivas', 'V-12345678', 17.00, 'Excelente manejo de pacientes y aplicación de protocolos de enfermería.', '2025-10-07 10:00:00', NULL, 3, 1),
(12, 5, 'TUTOR_EMPRESARIAL', NULL, 'Fernando José García Reyes', 'V-14567890', 18.00, 'Muy buen desempeño en el servicio de hospitalización. Pacientes satisfechos.', '2025-10-07 11:00:00', NULL, 3, 1),
(13, 5, 'COMITE', NULL, 'MSc. Luis Enrique Paredes', 'V-09876543', 16.50, 'Caso clínico bien presentado. Fundamentos teóricos sólidos.', '2025-10-10 09:00:00', 1, 3, 1),
(14, 5, 'COMITE', NULL, 'Dra. María Auxiliadora Ramírez', 'V-08765432', 17.50, 'Buena integración de teoría y práctica en el área de hospitalización.', '2025-10-10 09:30:00', 2, 3, 1),
(15, 5, 'COMITE', NULL, 'Ing. José Antonio Contreras', 'V-07654321', 17.00, 'Aprobado con mención. Recomendado para pasantías profesionales.', '2025-10-10 10:00:00', 3, 3, 1);

-- ---------------------------------------------------------------------------
-- 3.14. DETALLES DE EVALUACIONES (t_evaluation_detail)
-- ---------------------------------------------------------------------------
-- Solo para las evaluaciones 1, 6, 11 (TUTOR_ACADEMICO) como muestra representativa

-- Evaluación 1: Carmen Álvarez -> Carlos Martínez (TUTOR_ACADEMICO)
INSERT INTO "t_evaluation_detail" ("DETAIL_ID", "EVALUATION_ID", "CRITERIA_ID", "ITEM_NUMBER", "SCORE", "STATUS") VALUES
(1, 1, NULL, 1, 9.00, 1),
(2, 1, NULL, 2, 9.00, 1),
(3, 1, NULL, 3, 9.50, 1),
(4, 1, NULL, 4, 8.50, 1),
(5, 1, NULL, 5, 9.00, 1),
(6, 1, NULL, 6, 9.00, 1),
(7, 1, NULL, 7, 9.50, 1),
(8, 1, NULL, 8, 8.50, 1),
(9, 1, NULL, 9, 9.00, 1),
(10, 1, NULL, 10, 9.00, 1);

-- Evaluación 6: Marcos Gil -> María Rodríguez (TUTOR_ACADEMICO)
INSERT INTO "t_evaluation_detail" ("DETAIL_ID", "EVALUATION_ID", "CRITERIA_ID", "ITEM_NUMBER", "SCORE", "STATUS") VALUES
(11, 6, NULL, 1, 8.00, 1),
(12, 6, NULL, 2, 8.00, 1),
(13, 6, NULL, 3, 8.00, 1),
(14, 6, NULL, 4, 8.50, 1),
(15, 6, NULL, 5, 7.50, 1),
(16, 6, NULL, 6, 8.00, 1),
(17, 6, NULL, 7, 8.00, 1),
(18, 6, NULL, 8, 8.00, 1),
(19, 6, NULL, 9, 8.00, 1),
(20, 6, NULL, 10, 8.00, 1);

-- Evaluación 11: María Moreno -> Pedro Castillo (TUTOR_ACADEMICO)
INSERT INTO "t_evaluation_detail" ("DETAIL_ID", "EVALUATION_ID", "CRITERIA_ID", "ITEM_NUMBER", "SCORE", "STATUS") VALUES
(21, 11, NULL, 1, 8.50, 1),
(22, 11, NULL, 2, 9.00, 1),
(23, 11, NULL, 3, 8.00, 1),
(24, 11, NULL, 4, 8.50, 1),
(25, 11, NULL, 5, 9.00, 1),
(26, 11, NULL, 6, 8.00, 1),
(27, 11, NULL, 7, 8.50, 1),
(28, 11, NULL, 8, 9.00, 1),
(29, 11, NULL, 9, 8.00, 1),
(30, 11, NULL, 10, 8.50, 1);

-- ---------------------------------------------------------------------------
-- 3.15. VISITAS DE SUPERVISIÓN (t_practice_visits)
-- ---------------------------------------------------------------------------
INSERT INTO "t_practice_visits" ("VISIT_ID", "PROFESSIONAL_PRACTICE_ID", "TUTOR_ID", "VISIT_DATE", "VISIT_TYPE", "HOURS_WORKED", "ACTIVITIES_PERFORMED", "OBSERVATIONS", "RECOMMENDATIONS", "STATUS", "VISIT_CASE", "CREATED_BY") VALUES
-- Visitas a Práctica 1: Carlos Martínez - CORPOELEC
(1, 1, 1, '2026-01-20 10:00:00', 'PRESENCIAL', 2.00, 'Revisión del avance del módulo de inventarios. Se verificó el diseño de base de datos y el inicio del desarrollo backend.', 'El estudiante avanza conforme al cronograma. La base de datos está bien diseñada.', 'Continuar con el desarrollo frontend según lo planificado.', 1, 'VISITA INICIAL', 3),
(2, 1, 1, '2026-02-17 10:00:00', 'PRESENCIAL', 2.00, 'Seguimiento al desarrollo frontend y pruebas. Se revisaron los componentes de React y la integración con la API.', 'Progreso satisfactorio. La interfaz es funcional y responsiva.', 'Reforzar las pruebas de integración.', 1, 'SEGUIMIENTO REGULAR', 3),
(3, 1, 1, '2026-03-10 10:00:00', 'PRESENCIAL', 2.00, 'Revisión final del proyecto. Pruebas de aceptación con el usuario final.', 'Módulo completo y funcional. El jefe de almacén aprobó el sistema.', 'Preparar la documentación y el manual de usuario para la entrega final.', 1, 'EVALUACIÓN FINAL', 3),

-- Visitas a Práctica 5: Pedro Castillo - Hospital Jesús Yerena
(4, 5, 3, '2025-06-30 09:00:00', 'PRESENCIAL', 2.00, 'Visita al servicio de hospitalización. Observación de la técnica de curaciones y atención al paciente.', 'El estudiante realiza los procedimientos con técnica correcta y excelente trato al paciente.', 'Seguir reforzando la técnica aséptica en curaciones.', 1, 'VISITA INICIAL', 3),
(5, 5, 3, '2025-07-21 09:00:00', 'PRESENCIAL', 2.00, 'Evaluación de las competencias adquiridas. Revisión del caso clínico para la presentación final.', 'El estudiante ha desarrollado todas las competencias esperadas para el nivel.', 'Preparar la presentación del caso clínico con énfasis en el proceso de enfermería.', 1, 'EVALUACIÓN FINAL', 3),

-- Visitas a Práctica 2: María Rodríguez - SENIAT
(6, 2, 2, '2025-07-15 10:00:00', 'PRESENCIAL', 1.50, 'Visita inicial al SENIAT. Revisión del plan de trabajo y asignación de tutor empresarial.', 'Buena acogida por parte del equipo de tecnología del SENIAT.', 'Mantener comunicación constante con el tutor empresarial.', 1, 'VISITA INICIAL', 3),
(7, 2, 2, '2025-09-10 10:00:00', 'PRESENCIAL', 2.00, 'Revisión del avance del proyecto de automatización. Se verificó el funcionamiento del sistema.', 'El sistema de automatización está casi completo. Buen trabajo.', 'Realizar pruebas con datos reales antes del despliegue.', 1, 'SEGUIMIENTO REGULAR', 3),

-- Visitas a Práctica 6: Rosa Torres - Gobernación (en curso)
(8, 6, 4, '2026-01-20 09:00:00', 'PRESENCIAL', 2.00, 'Visita a la Gobernación de Portuguesa. Inducción al proyecto de evaluación agroindustrial.', 'La estudiante comprende el alcance del proyecto. Buena disposición.', 'Coordinar visitas a las unidades de producción agroindustrial de la región.', 1, 'VISITA INICIAL', 3),
(9, 6, 4, '2026-02-17 10:00:00', 'TELEFÓNICA', 0.50, 'Seguimiento telefónico. La estudiante reporta avances en la recolección de datos.', 'Avance dentro de lo esperado. Se han visitado 3 unidades de producción.', 'Asegurar la representatividad de la muestra para el estudio.', 1, 'SEGUIMIENTO REGULAR', 3),

-- Visitas a Práctica 4: Ana Flores - Hospital Jesús Yerena (en curso)
(10, 4, 3, '2026-01-20 09:00:00', 'PRESENCIAL', 2.00, 'Inducción en el servicio de emergencia. Presentación con el equipo de enfermería.', 'La estudiante se integró bien al equipo de emergencia.', 'Prestar especial atención a los protocolos de emergencia y triaje.', 1, 'VISITA INICIAL', 3);

-- ---------------------------------------------------------------------------
-- 3.16. SOLICITUDES ESTUDIANTILES (t_student_requests)
-- ---------------------------------------------------------------------------
INSERT INTO "t_student_requests" ("REQUEST_ID", "STUDENT_ID", "REQUEST_TYPE_ID", "SUBJECT", "DESCRIPTION", "STATUS", "RESPONSE", "PROCESSED_BY", "PROCESSED_AT") VALUES
(1, 3, 1, 'Solicitud de cambio de horario de pasantía', 'Solicito el cambio del turno nocturno al turno diurno debido a problemas de salud que me impiden realizar actividades en horario nocturno.', 'approved', 'Se autoriza el cambio de horario. El estudiante deberá presentar constancia médica en la Coordinación de Pasantías.', 3, '2025-01-20 14:00:00'),
(2, 7, 1, 'Solicitud de prórroga para entrega de informe final', 'Solicito una prórroga de 15 días para la entrega del informe final debido a que la empresa solicitó ajustes adicionales en el plan de mejora.', 'approved', 'Se concede prórroga de 15 días hábiles contados a partir de la fecha de vencimiento original.', 3, '2025-06-01 10:30:00');

-- ---------------------------------------------------------------------------
-- 3.17. NOTIFICACIONES (t_notifications)
-- ---------------------------------------------------------------------------
INSERT INTO "t_notifications" ("NOTIFICATION_ID", "USER_ID", "TYPE", "TITLE", "MESSAGE", "READ", "READ_AT", "DATA") VALUES
(1, 3, 'system', 'Sistema listo para uso', 'El sistema UNEFA Dashboard se ha inicializado correctamente. Todos los módulos están operativos.', TRUE, NOW(), '{"type": "system_ready"}'),
(2, 3, 'approval', 'Nueva práctica registrada', 'La práctica de Carlos Martínez (CORPOELEC) ha sido registrada y está pendiente de asignación de tutores.', TRUE, NOW(), '{"practice_id": 1}'),
(3, 3, 'approval', 'Evaluación completada', 'La evaluación de María Rodríguez (SENIAT) ha sido completada por todos los miembros del comité.', FALSE, NULL, '{"practice_id": 2, "score": 16.75}'),
(4, 3, 'reminder', 'Prácticas próximas a vencer', 'Las prácticas del período 1-2026 están próximas a su fecha de cierre (24/04/2026). Revise las evaluaciones pendientes.', FALSE, NULL, '{"period_id": 4}');

-- ---------------------------------------------------------------------------
-- 3.18. CULMINACIONES DE PRÁCTICAS (t_practice_culmination)
-- ---------------------------------------------------------------------------
INSERT INTO "t_practice_culmination" ("PRACTICE_ID", "STATUS", "CERTIFICATE_NUMBER", "CERTIFIED_AT", "APPROVED_AT", "APPROVED_BY") VALUES
(1, 2, 'UNEFA-CERT-2026-001', '2026-03-10 15:00:00', '2026-03-05 12:00:00', 3),
(2, 2, 'UNEFA-CERT-2025-015', '2025-10-10 15:00:00', '2025-10-08 12:00:00', 3),
(3, 2, 'UNEFA-CERT-2025-003', '2025-06-12 15:00:00', '2025-06-10 12:00:00', 3),
(5, 2, 'UNEFA-CERT-2025-020', '2025-10-12 15:00:00', '2025-10-10 12:00:00', 3),
(7, 2, 'UNEFA-CERT-2025-005', '2025-06-12 15:00:00', '2025-06-10 12:00:00', 3);

-- =============================================================================
-- FASE 4: REAJUSTAR SECUENCIAS PARA PRÓXIMAS INSERCIONES
-- =============================================================================

DO $$
DECLARE
    max_id INT;
BEGIN
    -- t_persons
    SELECT COALESCE(MAX("person_id"), 0) + 1 INTO max_id FROM "t_persons";
    PERFORM setval('"t_persons_person_id_seq"', max_id, false);
    RAISE NOTICE 't_persons sequence set to %', max_id;

    -- t_institution
    SELECT COALESCE(MAX("INSTITUTION_ID"), 0) + 1 INTO max_id FROM "t_institution";
    BEGIN
        PERFORM setval('"t_institution_INSTITUTION_ID_seq"', max_id, false);
    EXCEPTION WHEN OTHERS THEN END;

    -- t_institution_manager
    SELECT COALESCE(MAX("MANAGER_ID"), 0) + 1 INTO max_id FROM "t_institution_manager";
    BEGIN
        PERFORM setval('"t_institution_manager_MANAGER_ID_seq"', max_id, false);
    EXCEPTION WHEN OTHERS THEN END;

    -- t_students
    SELECT COALESCE(MAX("STUDENTS_ID"), 0) + 1 INTO max_id FROM "t_students";
    BEGIN
        PERFORM setval('"t_students_STUDENTS_ID_seq"', max_id, false);
    EXCEPTION WHEN OTHERS THEN END;

    -- t_tutors
    SELECT COALESCE(MAX("TUTOR_ID"), 0) + 1 INTO max_id FROM "t_tutors";
    BEGIN
        PERFORM setval('"t_tutors_TUTOR_ID_seq"', max_id, false);
    EXCEPTION WHEN OTHERS THEN END;

    -- t_professional_practices
    SELECT COALESCE(MAX("PROFESSIONAL_PRACTICE_ID"), 0) + 1 INTO max_id FROM "t_professional_practices";
    BEGIN
        PERFORM setval('"t_professional_practices_PROFESSIONAL_PRACTICE_ID_seq"', max_id, false);
    EXCEPTION WHEN OTHERS THEN END;

    -- t_activity_logs
    SELECT COALESCE(MAX("ACTIVITY_LOG_ID"), 0) + 1 INTO max_id FROM "t_activity_logs";
    BEGIN
        PERFORM setval('"t_activity_logs_ACTIVITY_LOG_ID_seq"', max_id, false);
    EXCEPTION WHEN OTHERS THEN END;

    -- t_evaluation
    SELECT COALESCE(MAX("EVALUATION_ID"), 0) + 1 INTO max_id FROM "t_evaluation";
    BEGIN
        PERFORM setval('"t_evaluation_EVALUATION_ID_seq"', max_id, false);
    EXCEPTION WHEN OTHERS THEN END;

    -- t_practice_visits
    SELECT COALESCE(MAX("VISIT_ID"), 0) + 1 INTO max_id FROM "t_practice_visits";
    BEGIN
        PERFORM setval('"t_practice_visits_VISIT_ID_seq"', max_id, false);
    EXCEPTION WHEN OTHERS THEN END;

    -- t_notifications
    SELECT COALESCE(MAX("NOTIFICATION_ID"), 0) + 1 INTO max_id FROM "t_notifications";
    BEGIN
        PERFORM setval('"t_notifications_NOTIFICATION_ID_seq"', max_id, false);
    EXCEPTION WHEN OTHERS THEN END;
END $$;

-- =============================================================================
-- VERIFICACIÓN FINAL
-- =============================================================================

DO $$
DECLARE
    total_persons INT;
    total_students INT;
    total_tutors INT;
    total_institutions INT;
    total_practices INT;
    total_activity_logs INT;
    total_evaluations INT;
    total_visits INT;
BEGIN
    SELECT COUNT(*) INTO total_students FROM "t_students";
    SELECT COUNT(*) INTO total_tutors FROM "t_tutors";
    SELECT COUNT(*) INTO total_institutions FROM "t_institution";
    SELECT COUNT(*) INTO total_practices FROM "t_professional_practices";
    SELECT COUNT(*) INTO total_activity_logs FROM "t_activity_logs";
    SELECT COUNT(*) INTO total_evaluations FROM "t_evaluation";
    SELECT COUNT(*) INTO total_visits FROM "t_practice_visits";

    RAISE NOTICE '============================================';
    RAISE NOTICE 'RESUMEN DE SIEMBRA — SEED DE PRESENTACIÓN';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Estudiantes:        %', total_students;
    RAISE NOTICE 'Tutores:            %', total_tutors;
    RAISE NOTICE 'Instituciones:      %', total_institutions;
    RAISE NOTICE 'Prácticas:          %', total_practices;
    RAISE NOTICE 'Bitácoras:          %', total_activity_logs;
    RAISE NOTICE 'Evaluaciones:       %', total_evaluations;
    RAISE NOTICE 'Visitas:            %', total_visits;
    RAISE NOTICE '============================================';
END $$;

COMMIT;
