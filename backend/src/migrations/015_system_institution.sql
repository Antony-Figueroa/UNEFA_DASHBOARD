-- =============================================
-- Migration 015: Sistema de Institución + Núcleos + Proyección
-- =============================================

-- 1. t_system_institution
CREATE TABLE IF NOT EXISTS "t_system_institution" (
  "system_institution_id" SERIAL PRIMARY KEY,
  "legal_name" VARCHAR(500) NOT NULL,
  "commercial_name" VARCHAR(255) NOT NULL,
  "acronym" VARCHAR(50) NOT NULL,
  "rif" VARCHAR(20),
  "phone" VARCHAR(20),
  "email" VARCHAR(255),
  "website" VARCHAR(255),
  "logo_url" VARCHAR(500),
  "resolution_number" VARCHAR(100),
  "foundation_date" DATE,
  "status" SMALLINT NOT NULL DEFAULT 1 CHECK (status IN (0, 1)),
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. t_system_nucleus
CREATE TABLE IF NOT EXISTS "t_system_nucleus" (
  "nucleus_id" SERIAL PRIMARY KEY,
  "code" VARCHAR(20) NOT NULL UNIQUE,
  "name" VARCHAR(255) NOT NULL,
  "region" VARCHAR(255) NOT NULL,
  "nucleus_type" VARCHAR(20) NOT NULL CHECK (nucleus_type IN ('NÚCLEO', 'EXTENSIÓN')),
  "phone" VARCHAR(20),
  "email" VARCHAR(255),
  "is_main" BOOLEAN NOT NULL DEFAULT FALSE,
  "status" SMALLINT NOT NULL DEFAULT 1 CHECK (status IN (0, 1)),
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. t_nucleus_career
CREATE TABLE IF NOT EXISTS "t_nucleus_career" (
  "nucleus_career_id" SERIAL PRIMARY KEY,
  "nucleus_id" INTEGER NOT NULL REFERENCES "t_system_nucleus"("nucleus_id") ON DELETE CASCADE,
  "career_id" INTEGER NOT NULL REFERENCES "t_career"("CAREER_ID"),
  "status" SMALLINT NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE("nucleus_id", "career_id")
);

-- 4. t_proyeccion_pasantias
CREATE TABLE IF NOT EXISTS "t_proyeccion_pasantias" (
  "proyeccion_id" SERIAL PRIMARY KEY,
  "period_id" INTEGER NOT NULL REFERENCES "t_internships_period"("PERIOD_ID"),
  "nucleus_id" INTEGER NOT NULL REFERENCES "t_system_nucleus"("nucleus_id"),
  "career_id" INTEGER NOT NULL REFERENCES "t_career"("CAREER_ID"),
  "estudiantes_proyectados" INTEGER NOT NULL DEFAULT 0 CHECK (estudiantes_proyectados >= 0),
  "created_by" INTEGER REFERENCES "t_user"("USER_ID"),
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE("period_id", "nucleus_id", "career_id")
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_nucleus_career_nucleus" ON "t_nucleus_career" ("nucleus_id");
CREATE INDEX IF NOT EXISTS "idx_nucleus_career_career" ON "t_nucleus_career" ("career_id");
CREATE INDEX IF NOT EXISTS "idx_proyeccion_period" ON "t_proyeccion_pasantias" ("period_id");
CREATE INDEX IF NOT EXISTS "idx_proyeccion_nucleus" ON "t_proyeccion_pasantias" ("nucleus_id");
CREATE INDEX IF NOT EXISTS "idx_proyeccion_career" ON "t_proyeccion_pasantias" ("career_id");

-- Seed: institución por defecto
INSERT INTO "t_system_institution" ("legal_name", "commercial_name", "acronym")
VALUES (
  'UNIVERSIDAD NACIONAL EXPERIMENTAL POLITÉCNICA DE LA FUERZA ARMADA NACIONAL BOLIVARIANA',
  'UNEFA',
  'UNEFA'
) ON CONFLICT DO NOTHING;
