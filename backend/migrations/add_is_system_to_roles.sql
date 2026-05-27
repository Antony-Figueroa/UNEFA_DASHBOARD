-- Migration: Agrega columna IS_SYSTEM a t_roles
-- Bug #4: ensureRolesSeeded y roles.controller.ts referenciaban columna inexistente
-- Aplicada: 2026-05-26

ALTER TABLE IF EXISTS "t_roles" ADD COLUMN IF NOT EXISTS "IS_SYSTEM" BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN "t_roles"."IS_SYSTEM" IS 'Indica si el rol es del sistema (no editable/eliminable)';
