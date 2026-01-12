-- Índices para optimizar las consultas frecuentes en la base de datos Supabase/PostgreSQL

-- 1. Estudiantes: Búsqueda por CI y Nombres (usados en filtros y búsquedas ilike)
CREATE INDEX IF NOT EXISTS idx_students_ci ON t_students (STUDENTS_CI);
CREATE INDEX IF NOT EXISTS idx_students_names ON t_students (NAME, SURNAME);
CREATE INDEX IF NOT EXISTS idx_students_status ON t_students (STATUS);

-- 2. Instituciones: Búsqueda por nombre y RIF
CREATE INDEX IF NOT EXISTS idx_institutions_name ON t_institution (INSTITUTION_NAME);
CREATE INDEX IF NOT EXISTS idx_institutions_rif ON t_institution (RIF);
CREATE INDEX IF NOT EXISTS idx_institutions_status ON t_institution (STATUS);

-- 3. Carreras: Búsqueda por nombre
CREATE INDEX IF NOT EXISTS idx_careers_name ON t_career (CAREER_NAME);
CREATE INDEX IF NOT EXISTS idx_careers_status ON t_career (STATUS);

-- 4. Inscripciones (Prácticas Profesionales): Búsquedas por fecha y estado
CREATE INDEX IF NOT EXISTS idx_practices_reg_date ON t_professional_practices (REGISTRATION_DATE);
CREATE INDEX IF NOT EXISTS idx_practices_status ON t_professional_practices (STATUS);
CREATE INDEX IF NOT EXISTS idx_practices_student_id ON t_professional_practices (STUDENTS_ID);
CREATE INDEX IF NOT EXISTS idx_practices_institution_id ON t_professional_practices (INSTITUTION_ID);

-- 5. Relaciones (Tablas intermedias)
CREATE INDEX IF NOT EXISTS idx_career_internship_type_career_id ON t_career_internship_type (CAREER_ID);
CREATE INDEX IF NOT EXISTS idx_pp_tutor_practice_id ON t_professional_practices_tutor (PROFESSIONAL_PRACTICE_ID);

-- Nota: Estos índices mejorarán significativamente el rendimiento de las consultas SELECT,
-- especialmente aquellas que utilizan cláusulas WHERE, JOIN u ORDER BY.
