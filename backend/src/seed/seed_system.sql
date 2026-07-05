-- =============================================================================
-- UNEFA Dashboard — Seed de Datos de Sistema (Offline)
-- =============================================================================
-- Sin ON CONFLICT porque PGlite local no tiene PK/UNIQUE constraints
-- (el schema base solo tiene CREATE TABLE, sin ALTER TABLE ADD PRIMARY KEY)
-- =============================================================================

-- 1. Configuración del sistema
INSERT INTO "t_config" ("CONFIG_ID", "NAME", "ATTEMPTS_KEY_BLOCK", "BLOCKING_DAYS", "USER_LENGTH", "STATUS")
VALUES (1, 'Configuración General', 5, 1, 8, 1);

-- 2. Landing page config
INSERT INTO "t_landing_config" ("config_id", "config_key", "config_value", "updated_at", "updated_by")
VALUES (1, 'reminder_rules', '[]'::jsonb, NOW(), 'system');

-- 3. Roles
INSERT INTO "t_roles" ("ID_ROLS", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS")
VALUES (1, 'Admin', 'Administrador del sistema', 1, NOW(), 1, NOW(), 1, NOW(), 1);

-- 4. Carreras
INSERT INTO "t_career" ("CAREER_ID", "CAREER_NAME", "CAREER_CODE", "MINIMUM_GRADE", "CAREER_ABBREVIATION", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS", "CAREER_TYPE", "SEMESTER")
VALUES
(3, 'TSU ENFERMERIA', 'ENFE', 10.00, 'ENFE', NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1, 'CORTA', '6'),
(4, 'INGENIERIA INFORMATICA', 'ININF', 10.00, 'INF', NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1, 'LARGA', '10'),
(5, 'INGENIERIA AGROINDUSTRIAL', 'INAGR', 10.00, 'INAG', NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1, 'LARGA', '10');

-- 5. Tipos de pasantía
INSERT INTO "t_internship_type" ("INTERNSHIP_TYPE_ID", "NAME", "PRIORITY", "CREATION_DATE", "STATUS", "HOURS_REQUIRED")
VALUES
(1, 'UNICA', 1, NOW(), 1, 360),
(2, 'HOSPITALARIA', 2, NOW(), 1, 480),
(3, 'COMUNITARIA', 3, NOW(), 1, 320);

-- 6. Períodos académicos
INSERT INTO "t_internships_period" ("PERIOD_ID", "START_DATE", "END_DATE", "ENROLLMENT_GRACE_DAYS", "EVALUATION_GRACE_DAYS", "CREATION_DATE", "DESCRIPTION", "PERIOD_STATUS", "STATUS", "T_INTERNSHIPS_CODE")
VALUES
(1, '2025-01-01', '2025-06-09', 21, 10, NOW(), '1-2025', 'CERRADO', 0, '1-2025'),
(3, '2025-06-10', '2025-09-30', 21, 10, NOW(), '2-2025', 'CERRADO', 0, '2-2025'),
(4, '2026-01-02', '2026-04-24', 21, 10, NOW(), '1-2026', 'ABIERTO', 1, '1-2026'),
(5, '2026-07-09', '2026-10-29', 21, 10, NOW(), '2-2026', 'ABIERTO', 1, '2-2026');

-- 7. Tipos de solicitud
INSERT INTO "t_request_types" ("REQUEST_TYPE_ID", "NAME", "DESCRIPTION", "IS_ACTIVE", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS", "IS_REASSIGNMENT", "CATEGORY")
VALUES (1, 'Solicitud General', 'Solicitud de cambio, prórroga u otros trámites', 1, NOW(), 1, NOW(), 1, NOW(), 1, NOW(), 1, 0, 'GENERAL');

-- 8. Listas de valores (prefijos telefónicos + estados de pasantía)
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS")
VALUES
(1, '0412', 1, NOW(), 0, NOW(), 0, NOW(), 0, NOW(), 1),
(2, '0414', 1, NOW(), 0, NOW(), 0, NOW(), 0, NOW(), 1),
(3, '0416', 1, NOW(), 0, NOW(), 0, NOW(), 0, NOW(), 1),
(4, '0424', 1, NOW(), 0, NOW(), 0, NOW(), 0, NOW(), 1),
(5, '0426', 1, NOW(), 0, NOW(), 0, NOW(), 0, NOW(), 1),
(6, 'APROBADO', 14, NOW(), 0, NOW(), 0, NOW(), 0, NOW(), 1),
(7, 'PENDIENTE', 14, NOW(), 0, NOW(), 0, NOW(), 0, NOW(), 1),
(8, 'RECHAZADO', 14, NOW(), 0, NOW(), 0, NOW(), 0, NOW(), 1);

-- 9. Lista de PREFIJO (necesaria para t_list - usada por el adapter)
INSERT INTO "t_list" ("LIST_ID", "NAME", "STATUS", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE")
VALUES (1, 'PREFIJO', 1, NOW(), 0, NOW(), 0, NOW(), 0, NOW());

-- 10. Usuario admin
INSERT INTO "t_user" ("USER_ID", "USER", "USER_CI", "NAME", "SURNAME", "EMAIL", "PHONE_NUMBER", "CREATION_DATE", "LOGIN", "TERMS_CONDITIONS", "STATUS_SESSION", "STATUS", "FAILED_ATTEMPTS")
VALUES (3, 'admin', 'V12345678', 'Admin', 'Sistema', 'admin@unefa.edu.ve', '04120000000', NOW(), 0, 'ACEPTADO', 0, 1, 0);

-- 11. Persona del admin
INSERT INTO "t_persons" ("person_id", "user_id", "first_name", "last_name", "gender", "birth_date", "phone", "email", "created_at")
VALUES (1, 3, 'Admin', 'Sistema', 'MASCULINO', '1990-01-01', '04120000000', 'admin@unefa.edu.ve', NOW());

-- 12. Clave del admin (hash bcrypt de "Admin123")
INSERT INTO "t_user_key" ("USER_KEY_ID", "USER_ID", "KEY", "START_DATE", "END_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS", "IS_TEMPORARY")
VALUES (1, 3, '$2b$10$EEdx7N9jYvMYe7CIZWjR6OnJdPJ8ZPQx1MNmEejnpo6BeWY1s460e', NOW(), '2099-12-31 23:59:59', 3, NOW(), 3, NOW(), 3, NOW(), 1, false);

-- 13. Rol del admin
INSERT INTO "t_user_roles" ("ID_USER", "ID_ROLES") VALUES (3, 1);

-- 14. Instituciones
INSERT INTO "t_institution" ("INSTITUTION_ID", "INSTITUTION_NAME", "INSTITUTION_ADDRESS", "INSTITUTION_CONTACT", "PRACTICE_TYPE", "REGION", "NUCLEUS", "EXTENSION", "CREATION_DATE", "INSTITUTION_TYPE", "STATUS", "RIF", "INSTITUTION_CODE")
VALUES
(1, 'HOSPITAL UNIVERSITARIO DR. JESÚS YERENA', 'Av. Industrial, Acarigua', '0255-6234567', 'HOSPITALARIA', 'LOS LLANOS', 'PORTUGUESA', 'ACARIGUA', NOW(), 'PUBLICA', 1, 'G-2000123-4', 'HUJY-001'),
(2, 'ALCALDÍA DEL MUNICIPIO PÁEZ', 'Calle 4, Acarigua', '0255-6223344', 'COMUNITARIA', 'LOS LLANOS', 'PORTUGUESA', 'ACARIGUA', NOW(), 'PUBLICA', 1, 'J-3000456-7', 'ALC-PAEZ-001'),
(3, 'CORPORACIÓN ELÉCTRICA NACIONAL (CORPOELEC)', 'Av. Libertador, Acarigua', '0255-6311122', 'ÚNICA', 'LOS LLANOS', 'PORTUGUESA', 'ACARIGUA', NOW(), 'PUBLICA', 1, 'G-2000678-0', 'CORPOELEC-ACAR'),
(4, 'SENIAT', 'Av. Bolívar, Acarigua', '0255-6256789', 'ÚNICA', 'LOS LLANOS', 'PORTUGUESA', 'ACARIGUA', NOW(), 'PUBLICA', 1, 'G-2000901-3', 'SENIAT-ACAR'),
(5, 'GOBERNACIÓN DEL ESTADO PORTUGUESA', 'Av. Unda, Guanare', '0257-2511234', 'COMUNITARIA', 'LOS LLANOS', 'PORTUGUESA', 'ACARIGUA', NOW(), 'PUBLICA', 1, 'G-2000111-5', 'GOB-PORTUGUESA');

-- 15. Relación institución-carrera
INSERT INTO "t_institution_career" ("INSTITUTION_CAREER_ID", "INSTITUTION_ID", "CAREER_ID")
VALUES
(1, 1, 3), (2, 2, 4), (3, 2, 5), (4, 3, 4),
(5, 3, 5), (6, 4, 4), (7, 5, 4), (8, 5, 5);

-- 16. Gestores de institución
INSERT INTO "t_institution_manager" ("MANAGER_ID", "MANAGER_CI", "NAME", "SECOND_NAME", "SURNAME", "SECOND_SURNAME", "CONTACT_PHONE", "EMAIL", "CREATION_DATE", "STATUS", "INSTITUTION_ID", "cargo", "TITLE")
VALUES
(1, 'V-14567890', 'Fernando', 'José', 'García', 'Reyes', '0412-9876543', 'fernando.garcia@hospitalyerena.gob.ve', NOW(), 1, 1, 'Coordinador de Prácticas Profesionales', 'LICENCIADO'),
(2, 'V-15678901', 'Diana', 'Coromoto', 'Paredes', 'de León', '0416-8765432', 'diana.paredes@alcaldiapaez.gob.ve', NOW(), 1, 2, 'Directora de Talento Humano', 'LICENCIADO'),
(3, 'V-16789012', 'Roberto', 'Andrés', 'Cáceres', 'Mendoza', '0424-7654321', 'roberto.caceres@corpoelec.gob.ve', NOW(), 1, 3, 'Jefe de División de Sistemas', 'INGENIERO'),
(4, 'V-17890123', 'Sonia', 'Margarita', 'Quintero', 'Álvarez', '0426-6543210', 'sonia.quintero@gobernacionportuguesa.gob.ve', NOW(), 1, 5, 'Coordinadora de Pasantías', 'LICENCIADO'),
(5, 'V-18901234', 'Héctor', 'Manuel', 'Salazar', 'Díaz', '0412-5432109', 'hector.salazar@seniat.gob.ve', NOW(), 1, 4, 'Jefe de Tecnología', 'INGENIERO');

-- 17. Relación gestor-institución
INSERT INTO "t_institution_manager_institution" ("INSTITUTION_MANAGER_INSTITUTION_ID", "MANAGER_ID", "INSTITUTION_ID", "cargo")
VALUES
(1, 1, 1, 'Coordinador de Prácticas Profesionales'),
(2, 2, 2, 'Directora de Talento Humano'),
(3, 3, 3, 'Jefe de División de Sistemas'),
(4, 4, 5, 'Coordinadora de Pasantías'),
(5, 5, 4, 'Jefe de Tecnología');

-- 18. Relación institución-tipo de pasantía
INSERT INTO "t_institution_internship_type" ("INSTITUTION_INTERNSHIP_TYPE_ID", "INSTITUTION_ID", "INTERNSHIP_TYPE_ID")
VALUES
(1, 1, 2), (2, 2, 3), (3, 3, 1), (4, 4, 1), (5, 5, 3);
