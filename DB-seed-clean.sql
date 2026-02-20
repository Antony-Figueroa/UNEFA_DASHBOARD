-- ================================================================================
-- UNEFA Dashboard - Base de Datos Limpia (Seed Data)
-- Fecha: 2026-02-19
-- Descripción: Datos esenciales para iniciar el sistema desde cero
-- ================================================================================

-- ================================================================================
-- LIMPIAR TABLAS (en orden por foreign keys)
-- ================================================================================

TRUNCATE TABLE IF EXISTS "t_evaluation_detail" CASCADE;
TRUNCATE TABLE IF EXISTS "t_evaluation" CASCADE;
TRUNCATE TABLE IF EXISTS "t_activity_logs" CASCADE;
TRUNCATE TABLE IF EXISTS "t_visit" CASCADE;
TRUNCATE TABLE IF EXISTS "t_professional_practices_tutor" CASCADE;
TRUNCATE TABLE IF EXISTS "t_professional_practices" CASCADE;
TRUNCATE TABLE IF EXISTS "t_student_requests" CASCADE;
TRUNCATE TABLE IF EXISTS "t_students" CASCADE;
TRUNCATE TABLE IF EXISTS "t_tutors" CASCADE;
TRUNCATE TABLE IF EXISTS "t_institution_manager" CASCADE;
TRUNCATE TABLE IF EXISTS "t_institution" CASCADE;
TRUNCATE TABLE IF EXISTS "t_career_internship_type" CASCADE;
TRUNCATE TABLE IF EXISTS "t_career" CASCADE;
TRUNCATE TABLE IF EXISTS "t_internships_period" CASCADE;
TRUNCATE TABLE IF EXISTS "t_security_questions" CASCADE;
TRUNCATE TABLE IF EXISTS "t_session_history" CASCADE;
TRUNCATE TABLE IF EXISTS "t_session_attempts" CASCADE;
TRUNCATE TABLE IF EXISTS "t_session" CASCADE;
TRUNCATE TABLE IF EXISTS "t_recovery_tokens" CASCADE;
TRUNCATE TABLE IF EXISTS "t_auth_log" CASCADE;
TRUNCATE TABLE IF EXISTS "t_key_history" CASCADE;
TRUNCATE TABLE IF EXISTS "t_password_history" CASCADE;
TRUNCATE TABLE IF EXISTS "t_user_questions" CASCADE;
TRUNCATE TABLE IF EXISTS "t_user_roles" CASCADE;
TRUNCATE TABLE IF EXISTS "t_user_key" CASCADE;
TRUNCATE TABLE IF EXISTS "t_user" CASCADE;
TRUNCATE TABLE IF EXISTS "t_roles_permissions" CASCADE;
TRUNCATE TABLE IF EXISTS "t_roles" CASCADE;
TRUNCATE TABLE IF EXISTS "t_institution_career" CASCADE;
TRUNCATE TABLE IF EXISTS "t_tutor_career" CASCADE;
TRUNCATE TABLE IF EXISTS "t_institution_internship_type" CASCADE;

-- ================================================================================
-- DATOS ESENCIALES: ROLES
-- ================================================================================

INSERT INTO "t_roles" ("ID_ROLS", "NAME", "DESCRIPTION", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES
(0, 'MASTER', 'Super Administrador con acceso total al sistema', 0, '2025-01-01 00:00:00', 0, '2025-01-01 00:00:00', 0, '2025-01-01 00:00:00', 1),
(1, 'ADMIN', 'Administrador del sistema', 0, '2025-01-01 00:00:00', 0, '2025-01-01 00:00:00', 0, '2025-01-01 00:00:00', 1),
(2, 'ASISTENTE', 'Asistente administrativo', 0, '2025-01-01 00:00:00', 0, '2025-01-01 00:00:00', 0, '2025-01-01 00:00:00', 1),
(3, 'TUTOR', 'Tutor académico', 0, '2025-01-01 00:00:00', 0, '2025-01-01 00:00:00', 0, '2025-01-01 00:00:00', 1),
(4, 'ESTUDIANTE', 'Estudiante de práctica profesional', 0, '2025-01-01 00:00:00', 0, '2025-01-01 00:00:00', 0, '2025-01-01 00:00:00', 1);

-- ================================================================================
-- DATOS ESENCIALES: USUARIO ADMIN
-- ================================================================================

-- Usuario admin (password: admin123)
INSERT INTO "t_user" ("USER_ID", "USER", "USER_CI", "NAME", "SECOND_NAME", "SURNAME", "SECOND_SURNAME", "EMAIL", "PHONE_NUMBER", "CREATION_DATE", "LOGIN", "TERMS_CONDITIONS", "STATUS_SESSION", "STATUS", "FAILED_ATTEMPTS", "LOCK_DATE", "FORCE_PASSWORD_CHANGE") VALUES
(1, 'admin', '00000000', 'Administrador', '', 'Sistema', '', 'admin@unefa.edu.ve', '0424-0000000', NOW(), 0, '0', 1, 1, 0, NULL, TRUE);

-- Contraseña: admin123 (bcrypt hash)
INSERT INTO "t_user_key" ("USER_KEY_ID", "USER_ID", "KEY", "START_DATE", "END_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS", "IS_TEMPORARY") VALUES
(1, 1, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW() + INTERVAL '1 year', 0, NOW(), 0, NOW(), 0, NOW(), 1, FALSE);

-- Asignar rol de ADMIN
INSERT INTO "t_user_roles" ("ID_USER", "ID_ROLES") VALUES (1, 1);

-- ================================================================================
-- DATOS ESENCIALES: CONFIGURACIÓN DEL SISTEMA
-- ================================================================================

INSERT INTO "t_config" ("CONFIG_ID", "RECOVERY_EMAIL", "BLOCKING_DAYS", "WRONG_KEY_LOCK", "ATTEMPTS_KEY_BLOCK", "KEY_EXPIRATION", "EXPIRATION_DAYS", "USER_UPPERCASE", "USER_LOWERCASE", "USER_NUMBERS", "USER_SPECIAL_CHARACTERS", "USER_NUM_UPPERCASE", "USER_NUM_LOWERCASE", "USER_NUM_NUMBERS", "USER_NUM_SPECIAL_CHARACTERS", "KEY_UPPERCASE", "KEY_LOWERCASE", "KEY_NUMBERS", "KEY_SPECIAL_CHARACTERS", "KEY_NUM_UPPERCASE", "KEY_NUM_LOWERCASE", "KEY_NUM_NUMBERS", "KEY_NUM_SPECIAL_CHARACTERS", "USER_LENGTH", "KEY_LEGTH", "SECURITY_QUESTIONS", "TOTAL_QUESTIONS", "TOTAL_PRESET_QUESTIONS", "TOTAL_USER_QUESTIONS", "TOTAL_ANSWERS") VALUES
(1, 1, 0, 0, 3, 0, 120, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

-- ================================================================================
-- DATOS ESENCIALES: TIPOS DE PASANTÍA
-- ================================================================================

INSERT INTO "t_internship_type" ("INTERNSHIP_TYPE_ID", "NAME", "ABBREVIATION", "PRIORITY", "CREATION_DATE", "STATUS") VALUES
(1, 'ÚNICA', 'UNI', 0, NOW(), 1),
(2, 'HOSPITALARIA', 'HOSP', 1, NOW(), 1),
(3, 'COMUNITARIA', 'COM', 2, NOW(), 1);

-- ================================================================================
-- DATOS ESENCIALES: LISTAS DE VALORES
-- ================================================================================

-- Listas principales
INSERT INTO "t_list" ("LIST_ID", "NAME", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES
(1, 'Sexo', NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(2, 'Registro civil', NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(3, 'Nacionalidad', NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(4, 'Regimen/Turno', NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(5, 'Trabajo', NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(6, 'Tipo de empresa', NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(7, 'Rif', NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(8, 'Tipo de Practica', NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(9, 'Condicion', NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(10, 'Dedicacion', NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(11, 'Categoria', NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(12, 'Tipo de estudiante', NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(13, 'Rango Militar', NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(14, 'Estatus Pasantia', NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(15, 'Estatus Periodo', NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(16, 'Region', NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(17, 'Nucleo', NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(18, 'Extensión', NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(19, 'Traslado', NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(20, 'Profesión', NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(21, 'Carrera', NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1);

-- Valores de listas
INSERT INTO "t_value_list" ("VALUE_LIST_ID", "NAME", "ABBREVIATION", "LIST_ID", "CREATION_DATE", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES
-- Sexo (1)
(1, 'FEMENINO', 'F', 1, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(2, 'MASCULINO', 'M', 1, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
-- Registro civil (2)
(3, 'SOLTERO', 'S', 2, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(4, 'CASADO', 'C', 2, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(5, 'DIVORCIADO', 'D', 2, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(6, 'CONCUBINO', 'CB', 2, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(7, 'VIUDO', 'V', 2, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
-- Nacionalidad (3)
(8, 'VENEZOLANO', 'V', 3, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(9, 'EXTRANJERO', 'E', 3, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
-- Regimen/Turno (4)
(10, 'DIURNO', 'D1', 4, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(11, 'NOCTURNO', 'N2', 4, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(12, 'SABATINO', 'S3', 4, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
-- Trabajo (5)
(13, 'SI', 'SI', 5, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(14, 'NO', 'NO', 5, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
-- Tipo de empresa (6)
(15, 'PUBLICA', 'PUB', 6, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(16, 'PRIVADA', 'PRIV', 6, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(17, 'MIXTA', 'MIX', 6, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
-- Rif (7)
(18, 'JURIDICO', 'J', 7, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(19, 'GOBIERNO', 'G', 7, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(20, 'COMUNA O CONSEJO COMUNAL', 'C', 7, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
-- Tipo de Practica (8)
(21, 'HOSPITALARIA', 'HOSP', 8, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(22, 'COMUNITARIA', 'COM', 8, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(23, 'ORDINARIA', 'ORD', 8, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
-- Condicion (9)
(24, 'ORDINARIO', 'ORD', 9, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(25, 'CONTRATADO', 'CONT', 9, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
-- Dedicacion (10)
(26, 'DEDICACIÓN EXCLUSIVA', 'DE', 10, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(27, 'TIEMPO COMPLETO', 'TC', 10, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(28, 'TIEMPO CONVECIONAL', 'TV', 10, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(29, 'MEDIO TIEMPO', 'MV', 10, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
-- Categoria (11)
(30, 'AUXILIAR DOCENTE', 'AUXILIAR', 11, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(31, 'DOCENTE INSTRUCTOR', 'INSTRUCT', 11, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(32, 'DOCENTE ASISTENTE', 'ASISTENT', 11, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(33, 'DOCENTE AGREGADO', 'AGREGADO', 11, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(34, 'DOCENTE ASOCIADO', 'ASOCIADO', 11, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(35, 'DOCENTE TITULAR', 'TITULAR', 11, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
-- Tipo de estudiante (12)
(36, 'CIVIL', 'CIV', 12, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(37, 'MILITAR', 'MIL', 12, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
-- Rango Militar (13)
(38, 'SUBTENIENTE', 'SBTTE', 13, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(39, 'TENIENTE', 'TTE', 13, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(40, 'CAPITAN', 'CAP', 13, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(41, 'MAYOR', 'MY', 13, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(42, 'TENIENTE CORONEL', 'TTE CNEL', 13, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(43, 'CORONEL', 'CNEL', 13, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(59, 'NO APLICA', 'NA', 13, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
-- Estatus Pasantia (14)
(44, 'APROBADO', 'A', 14, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(45, 'REPROBADO', 'R', 14, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
-- Estatus Periodo (15)
(46, 'PENDIENTE', 'PEN', 15, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(47, 'ABIERTO', 'ABT', 15, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(48, 'CULMINADO', 'CULM', 15, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(49, 'ANULADO', 'NULL', 15, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
-- Region (16)
(50, 'LOS LLANOS', '', 16, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
-- Nucleo (17)
(51, 'PORTUGUESA', 'PORTUGUE', 17, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
-- Extensión (18)
(52, 'ACARIGUA', 'ACARIGUA', 18, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
-- Traslado (19)
(53, 'SI', 'SI', 19, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(54, 'NO', 'NO', 19, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
-- Profesión (20)
(55, 'ENFERMERIA', 'ENF', 20, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(56, 'INGENIERIA', 'ING', 20, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
-- Carrera (21)
(57, 'TSU EN ENFERMERIA', 'ENF', 21, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1),
(58, 'INGENIERIA', 'ING', 21, NOW(), 1, NOW(), 0, NOW(), 0, NOW(), 1);

-- ================================================================================
-- DATOS ESENCIALES: PREGUNTAS DE SEGURIDAD
-- ================================================================================

INSERT INTO "t_preset_questions" ("PRESET_QUESTION_ID", "DESCRIPTION", "ANSWER", "MODIF_USER_ID", "MODIF_USER_DATE", "ELIM_USER_ID", "ELIM_USER_DATE", "REST_USER_ID", "REST_USER_DATE", "STATUS") VALUES
(1, '¿Cuál era el apodo de tu mejor amigo de la infancia?', '', 0, NOW(), 0, NOW(), 0, NOW(), 1),
(2, '¿En qué ciudad se conocieron sus padres?', '', 0, NOW(), 0, NOW(), 0, NOW(), 1),
(3, '¿Cuál es el apellido de tu vecino?', '', 0, NOW(), 0, NOW(), 0, NOW(), 1),
(4, '¿Cuántas mascotas tenías a los 10 años?', '', 0, NOW(), 0, NOW(), 0, NOW(), 1),
(5, '¿Cuál fue tu primera mascota?', '', 0, NOW(), 0, NOW(), 0, NOW(), 1),
(6, '¿En qué ciudad nació tu madre?', '', 0, NOW(), 0, NOW(), 0, NOW(), 1);

-- ================================================================================
-- DATOS ESENCIALES: TIPOS DE SOLICITUDES
-- ================================================================================

INSERT INTO "t_request_types" ("NAME", "DESCRIPTION", "IS_ACTIVE", "STATUS") VALUES
('Cambio de Empresa', 'Solicitud para cambiar la empresa donde se realizan las prácticas', 1, 1),
('Cambio de Tutor', 'Solicitud para cambiar el tutor académico asignado', 1, 1),
('Prórroga de Pasantía', 'Solicitud para extender el período de pasantía', 1, 1),
('Retiro de Pasantía', 'Solicitud para retirarse del programa de pasantías', 1, 1),
('Carta de Pasantía', 'Solicitud de carta de aceptación o culminación de pasantía', 1, 1),
('Constancia de Estudios', 'Solicitud de constancia de estudios con fines de pasantía', 1, 1),
('Revisión de Nota', 'Solicitud para revisar la calificación final de pasantía', 1, 1),
('Otro', 'Otro tipo de solicitud no contemplada', 1, 1);

-- ================================================================================
-- DATOS ESENCIALES: CRITERIOS DE EVALUACIÓN
-- ================================================================================

-- ANEXO D: Evaluación Tutor Institucional (20 ítems) - 40%
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

-- ANEXO E: Evaluación Tutor Académico (20 ítems) - 30%
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

-- ANEXO F: Comité Evaluador (15 ítems) - 30%
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
-- VERIFICACIÓN DE DATOS INSERTADOS
-- ================================================================================

SELECT 't_roles' as tabla, COUNT(*) as registros FROM "t_roles"
UNION ALL SELECT 't_user', COUNT(*) FROM "t_user"
UNION ALL SELECT 't_user_key', COUNT(*) FROM "t_user_key"
UNION ALL SELECT 't_user_roles', COUNT(*) FROM "t_user_roles"
UNION ALL SELECT 't_config', COUNT(*) FROM "t_config"
UNION ALL SELECT 't_internship_type', COUNT(*) FROM "t_internship_type"
UNION ALL SELECT 't_list', COUNT(*) FROM "t_list"
UNION ALL SELECT 't_value_list', COUNT(*) FROM "t_value_list"
UNION ALL SELECT 't_preset_questions', COUNT(*) FROM "t_preset_questions"
UNION ALL SELECT 't_request_types', COUNT(*) FROM "t_request_types"
UNION ALL SELECT 't_evaluation_criteria', COUNT(*) FROM "t_evaluation_criteria";

-- ================================================================================
-- INFORMACIÓN DE ACCESO
-- ================================================================================
-- Usuario: admin
-- Contraseña: admin123
-- Nota: El sistema solicitará cambio de contraseña en el primer inicio de sesión
-- ================================================================================
