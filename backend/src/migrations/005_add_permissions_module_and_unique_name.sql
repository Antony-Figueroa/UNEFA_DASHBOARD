-- Migration 005: Add MODULE column and UNIQUE constraint on NAME to t_permissions
-- 
-- El seed de permisos (users.service.ts) usa `module` y hace upsert con
-- onConflict: 'NAME', pero:
--   1. La columna MODULE no existía en DB-postgres.sql
--   2. No había UNIQUE constraint en NAME, causando error 42P10

-- 1. Agregar columna MODULE si no existe
ALTER TABLE "t_permissions" ADD COLUMN IF NOT EXISTS "MODULE" VARCHAR(30);

-- Poblar MODULE con un valor por defecto para filas existentes
UPDATE "t_permissions" SET "MODULE" = 'General' WHERE "MODULE" IS NULL;

-- Ahora hacer NOT NULL
ALTER TABLE "t_permissions" ALTER COLUMN "MODULE" SET NOT NULL;

-- 2. Agregar UNIQUE constraint en NAME
-- Primero limpiar posibles duplicados (deberían ser únicos en producción)
DELETE FROM "t_permissions" a USING "t_permissions" b
WHERE a."PERMISSIONS_ID" < b."PERMISSIONS_ID"
  AND a."NAME" = b."NAME";

ALTER TABLE "t_permissions" ADD CONSTRAINT "uq_permissions_name" UNIQUE ("NAME");
