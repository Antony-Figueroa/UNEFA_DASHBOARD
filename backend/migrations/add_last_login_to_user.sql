-- Migration: Agrega columna LAST_LOGIN a t_user
-- Bug #5: El audit de login intentaba escribir LAST_LOGIN que no existía
-- Aplicada: 2026-05-26

ALTER TABLE IF EXISTS "t_user" ADD COLUMN IF NOT EXISTS "LAST_LOGIN" TIMESTAMP;

COMMENT ON COLUMN "t_user"."LAST_LOGIN" IS 'Timestamp del último inicio de sesión exitoso';
