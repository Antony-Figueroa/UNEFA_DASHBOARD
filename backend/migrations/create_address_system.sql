-- ================================================================================
-- MIGRACIÓN: Sistema de Direcciones para Asignación de Prácticas Profesionales
-- Versión: 1.0
-- Fecha: 2026-06-11
-- Descripción: Tablas geográficas, tipos de dirección, direcciones y tablas puente
--              para soportar múltiples direcciones por entidad con jerarquía 3NF
-- ================================================================================

-- ============================================================
-- 1. JERARQUÍA GEOGRÁFICA (seed desde venezuela.json)
-- ============================================================

CREATE TABLE IF NOT EXISTS t_estado (
  estado_id   INT PRIMARY KEY,
  iso_31662   VARCHAR(6) NOT NULL,
  name        VARCHAR(100) NOT NULL,
  capital     VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS t_municipio (
  municipio_id  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  estado_id     INT NOT NULL REFERENCES t_estado(estado_id),
  name          VARCHAR(100) NOT NULL
);
CREATE INDEX IF NOT EXISTS t_municipio_estado_id_idx ON t_municipio(estado_id);

CREATE TABLE IF NOT EXISTS t_parroquia (
  parroquia_id  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  municipio_id  BIGINT NOT NULL REFERENCES t_municipio(municipio_id),
  name          VARCHAR(200) NOT NULL
);
CREATE INDEX IF NOT EXISTS t_parroquia_municipio_id_idx ON t_parroquia(municipio_id);

-- ============================================================
-- 2. CATÁLOGO DE TIPOS DE DIRECCIÓN
-- ============================================================

CREATE TABLE IF NOT EXISTS t_address_type (
  address_type_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code            VARCHAR(20) NOT NULL UNIQUE,
  name            VARCHAR(50) NOT NULL,
  description     TEXT,
  status          SMALLINT NOT NULL DEFAULT 1
);

-- ============================================================
-- 3. TABLA CENTRAL DE DIRECCIONES (3NF)
-- ============================================================

CREATE TABLE IF NOT EXISTS t_address (
  address_id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  parroquia_id    BIGINT NOT NULL REFERENCES t_parroquia(parroquia_id),
  street_address  VARCHAR(300) NOT NULL,
  reference       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS t_address_parroquia_id_idx ON t_address(parroquia_id);

-- ============================================================
-- 4. TABLAS PUENTE (N direcciones por entidad)
-- ============================================================

CREATE TABLE IF NOT EXISTS t_person_address (
  person_address_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  person_id         INT NOT NULL REFERENCES t_persons(person_id),
  address_id        BIGINT NOT NULL REFERENCES t_address(address_id),
  address_type_id   BIGINT NOT NULL REFERENCES t_address_type(address_type_id),
  is_primary        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS t_person_address_person_id_idx ON t_person_address(person_id);
CREATE INDEX IF NOT EXISTS t_person_address_address_id_idx ON t_person_address(address_id);
CREATE UNIQUE INDEX IF NOT EXISTS t_person_address_one_primary_idx
  ON t_person_address(person_id, address_type_id) WHERE is_primary = TRUE;

CREATE TABLE IF NOT EXISTS t_institution_address (
  institution_address_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  institution_id         INT NOT NULL REFERENCES t_institution("INSTITUTION_ID"),
  address_id             BIGINT NOT NULL REFERENCES t_address(address_id),
  address_type_id        BIGINT NOT NULL REFERENCES t_address_type(address_type_id),
  is_primary             BOOLEAN NOT NULL DEFAULT FALSE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS t_institution_address_institution_id_idx ON t_institution_address(institution_id);
CREATE INDEX IF NOT EXISTS t_institution_address_address_id_idx ON t_institution_address(address_id);
CREATE UNIQUE INDEX IF NOT EXISTS t_institution_address_one_primary_idx
  ON t_institution_address(institution_id, address_type_id) WHERE is_primary = TRUE;

-- ============================================================
-- 5. VISTA CONSOLIDADA
-- ============================================================

CREATE OR REPLACE VIEW v_address_full WITH (security_invoker = TRUE) AS
SELECT
  a.address_id,
  a.street_address,
  a.reference,
  e.estado_id,
  e.name        AS estado,
  m.municipio_id,
  m.name        AS municipio,
  p.parroquia_id,
  p.name        AS parroquia,
  CONCAT(e.name, ' > ', m.name, ' > ', p.name) AS full_address
FROM t_address a
JOIN t_parroquia p   ON p.parroquia_id  = a.parroquia_id
JOIN t_municipio m   ON m.municipio_id  = p.municipio_id
JOIN t_estado e      ON e.estado_id     = m.estado_id;

-- ============================================================
-- 6. SEED DATA
-- ============================================================

-- Tipos de dirección estándar (INSERT OR IGNORE usando ON CONFLICT)
INSERT INTO t_address_type (code, name, description, status) VALUES
  ('PRINCIPAL', 'Dirección Principal', 'Dirección primaria de la entidad', 1),
  ('DOMICILIO', 'Domicilio', 'Residencia habitual', 1),
  ('RESIDENCIA_ACTUAL', 'Residencia Actual', 'Dónde reside actualmente', 1),
  ('SEDE_PRACTICAS', 'Sede de Prácticas', 'Lugar donde se realizan las pasantías', 1)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 7. COMENTARIOS DOCUMENTACIÓN
-- ============================================================

COMMENT ON TABLE t_estado IS 'Estados de Venezuela (24 registros: 23 estados + Distrito Capital)';
COMMENT ON TABLE t_municipio IS 'Municipios de Venezuela (335 registros)';
COMMENT ON TABLE t_parroquia IS 'Parroquias civiles de Venezuela (1,146 registros)';
COMMENT ON TABLE t_address_type IS 'Catálogo de tipos de dirección (PRINCIPAL, DOMICILIO, RESIDENCIA_ACTUAL, SEDE_PRACTICAS)';
COMMENT ON TABLE t_address IS 'Dirección estructurada con jerarquía geográfica 3NF (solo parroquia_id, sin transitividad)';
COMMENT ON TABLE t_person_address IS 'Puente N:N entre personas y direcciones con tipo y primary flag';
COMMENT ON TABLE t_institution_address IS 'Puente N:N entre instituciones y direcciones con tipo y primary flag';
COMMENT ON VIEW v_address_full IS 'Vista consolidada de dirección con jerarquía Estado > Municipio > Parroquia completa';
