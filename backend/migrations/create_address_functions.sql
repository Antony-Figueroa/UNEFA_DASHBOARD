-- ================================================================================
-- MIGRACIÓN: Funciones RPC para el Sistema de Direcciones
-- Versión: 1.0
-- Fecha: 2026-06-11
-- ================================================================================

-- ============================================================
-- Función: get_primary_address
-- Obtiene la dirección principal de una persona o institución
-- ============================================================

CREATE OR REPLACE FUNCTION get_primary_address(
  p_entity_type TEXT,
  p_entity_id INT
)
RETURNS TABLE (
  address_id BIGINT,
  street_address VARCHAR(300),
  reference TEXT,
  parroquia_id INT,
  parroquia_name VARCHAR(200),
  municipio_id BIGINT,
  municipio_name VARCHAR(100),
  estado_id INT,
  estado_name VARCHAR(100)
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  IF p_entity_type = 'person' THEN
    RETURN QUERY
    SELECT
      a.address_id,
      a.street_address,
      a.reference,
      p.parroquia_id,
      p.name AS parroquia_name,
      m.municipio_id,
      m.name AS municipio_name,
      e.estado_id,
      e.name AS estado_name
    FROM t_person_address pa
    JOIN t_address a ON a.address_id = pa.address_id
    JOIN t_parroquia p ON p.parroquia_id = a.parroquia_id
    JOIN t_municipio m ON m.municipio_id = p.municipio_id
    JOIN t_estado e ON e.estado_id = m.estado_id
    WHERE pa.person_id = p_entity_id
      AND pa.is_primary = TRUE
    LIMIT 1;
  ELSIF p_entity_type = 'institution' THEN
    RETURN QUERY
    SELECT
      a.address_id,
      a.street_address,
      a.reference,
      p.parroquia_id,
      p.name AS parroquia_name,
      m.municipio_id,
      m.name AS municipio_name,
      e.estado_id,
      e.name AS estado_name
    FROM t_institution_address ia
    JOIN t_address a ON a.address_id = ia.address_id
    JOIN t_parroquia p ON p.parroquia_id = a.parroquia_id
    JOIN t_municipio m ON m.municipio_id = p.municipio_id
    JOIN t_estado e ON e.estado_id = m.estado_id
    WHERE ia.institution_id = p_entity_id
      AND ia.is_primary = TRUE
    LIMIT 1;
  END IF;
END;
$$;

-- ============================================================
-- Función: get_coincidence_stats
-- Estadísticas de coincidencia geográfica en inscripciones
-- ============================================================

CREATE OR REPLACE FUNCTION get_coincidence_stats()
RETURNS TABLE (
  level TEXT,
  count BIGINT,
  percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  total_enrollments BIGINT;
BEGIN
  SELECT COUNT(*) INTO total_enrollments
  FROM t_professional_practices pp
  WHERE pp.INTERNSHIP_STATUS IS NOT NULL
    AND pp.STATUS = 1;

  IF total_enrollments = 0 THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH enrollment_addresses AS (
    SELECT
      pp.PROFESSIONAL_PRACTICE_ID,
      s.person_id AS student_person_id,
      pp.INSTITUTION_ID
    FROM t_professional_practices pp
    JOIN t_students s ON s.STUDENTS_ID = pp.STUDENTS_ID
    WHERE pp.INTERNSHIP_STATUS IS NOT NULL
      AND pp.STATUS = 1
  ),
  student_primary AS (
    SELECT ea.PROFESSIONAL_PRACTICE_ID, p.parroquia_id, p.municipio_id, m.estado_id
    FROM enrollment_addresses ea
    JOIN t_person_address pa ON pa.person_id = ea.student_person_id AND pa.is_primary = TRUE
    JOIN t_address a ON a.address_id = pa.address_id
    JOIN t_parroquia p ON p.parroquia_id = a.parroquia_id
    JOIN t_municipio m ON m.municipio_id = p.municipio_id
  ),
  institution_primary AS (
    SELECT ea.PROFESSIONAL_PRACTICE_ID, p.parroquia_id, p.municipio_id, m.estado_id
    FROM enrollment_addresses ea
    JOIN t_institution_address ia ON ia.institution_id = ea.INSTITUTION_ID AND ia.is_primary = TRUE
    JOIN t_address a ON a.address_id = ia.address_id
    JOIN t_parroquia p ON p.parroquia_id = a.parroquia_id
    JOIN t_municipio m ON m.municipio_id = p.municipio_id
  ),
  level_counts AS (
    SELECT
      CASE
        WHEN sp.parroquia_id = ip.parroquia_id THEN 'SAME_PARROQUIA'
        WHEN sp.municipio_id = ip.municipio_id THEN 'SAME_MUNICIPIO'
        WHEN sp.estado_id = ip.estado_id THEN 'SAME_STATE'
        ELSE 'DIFFERENT_STATE'
      END AS match_level
    FROM student_primary sp
    JOIN institution_primary ip ON ip.PROFESSIONAL_PRACTICE_ID = sp.PROFESSIONAL_PRACTICE_ID
  )
  SELECT
    lc.match_level AS level,
    COUNT(*)::BIGINT AS count,
    ROUND((COUNT(*)::NUMERIC / total_enrollments) * 100, 1) AS percentage
  FROM level_counts lc
  GROUP BY lc.match_level
  ORDER BY
    CASE lc.match_level
      WHEN 'SAME_PARROQUIA' THEN 1
      WHEN 'SAME_MUNICIPIO' THEN 2
      WHEN 'SAME_STATE' THEN 3
      WHEN 'DIFFERENT_STATE' THEN 4
    END;
END;
$$;

-- ============================================================
-- Función: get_institution_suggestions
-- Sugiere instituciones rankeadas por proximidad geográfica + carrera + tipo
-- ============================================================

CREATE OR REPLACE FUNCTION get_institution_suggestions(
  p_person_id INT,
  p_career_id INT,
  p_internship_type_id INT DEFAULT NULL
)
RETURNS TABLE (
  institution_id INT,
  institution_name VARCHAR(255),
  institution_address TEXT,
  estado VARCHAR(100),
  municipio VARCHAR(100),
  proximity_score INT
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_student_parroquia_id INT;
  v_student_municipio_id BIGINT;
  v_student_estado_id INT;
BEGIN
  SELECT p.parroquia_id, p.municipio_id, m.estado_id
  INTO v_student_parroquia_id, v_student_municipio_id, v_student_estado_id
  FROM t_person_address pa
  JOIN t_address a ON a.address_id = pa.address_id
  JOIN t_parroquia p ON p.parroquia_id = a.parroquia_id
  JOIN t_municipio m ON m.municipio_id = p.municipio_id
  WHERE pa.person_id = p_person_id
    AND pa.is_primary = TRUE
  LIMIT 1;

  IF v_student_parroquia_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    i.INSTITUTION_ID,
    i.INSTITUTION_NAME,
    i.INSTITUTION_ADDRESS,
    e.name::VARCHAR(100),
    m.name::VARCHAR(100),
    CASE
      WHEN p.parroquia_id = v_student_parroquia_id THEN 10
      WHEN p.municipio_id = v_student_municipio_id THEN 5
      WHEN m.estado_id = v_student_estado_id THEN 3
      ELSE 0
    END AS proximity_score
  FROM t_institution i
  JOIN t_institution_career ic ON ic.INSTITUTION_ID = i.INSTITUTION_ID
  JOIN t_institution_address ia ON ia.institution_id = i.INSTITUTION_ID AND ia.is_primary = TRUE
  JOIN t_address a ON a.address_id = ia.address_id
  JOIN t_parroquia p ON p.parroquia_id = a.parroquia_id
  JOIN t_municipio m ON m.municipio_id = p.municipio_id
  JOIN t_estado e ON e.estado_id = m.estado_id
  WHERE ic.CAREER_ID = p_career_id
    AND i.STATUS = 1
    AND (p_internship_type_id IS NULL
      OR i.PRACTICE_TYPE = p_internship_type_id::TEXT
      OR EXISTS (
        SELECT 1 FROM t_institution_internship_type iit
        WHERE iit.INSTITUTION_ID = i.INSTITUTION_ID
          AND iit.INTERNSHIP_TYPE_ID = p_internship_type_id
      ))
  ORDER BY proximity_score DESC, i.INSTITUTION_NAME;
END;
$$;

-- ============================================================
-- Comentarios
-- ============================================================

COMMENT ON FUNCTION get_primary_address IS 'Obtiene dirección principal de persona o institución con jerarquía geográfica completa';
COMMENT ON FUNCTION get_coincidence_stats IS 'Calcula distribución de coincidencia geográfica en inscripciones activas';
COMMENT ON FUNCTION get_institution_suggestions IS 'Sugiere instituciones rankeadas por proximidad, carrera y tipo de práctica';
