-- Migration: 018_normalize_tutor_type_accent
-- Description: Normaliza TUTOR_TYPE en t_professional_practices_tutor
-- de 'METODOLÓGICO' (con acento) a 'METODOLOGICO' (sin acento, canónico).
--
-- El backend acepta ambos (tracking.controller.ts normaliza al leer) pero
-- conviene tener los datos limpios para joins y reportes.

UPDATE "t_professional_practices_tutor"
SET "TUTOR_TYPE" = 'METODOLOGICO'
WHERE "TUTOR_TYPE" = 'METODOLÓGICO';

-- Rollback:
-- UPDATE "t_professional_practices_tutor"
-- SET "TUTOR_TYPE" = 'METODOLÓGICO'
-- WHERE "TUTOR_TYPE" = 'METODOLOGICO';
