-- Tabla para almacenar los respaldos de la base de datos
CREATE TABLE IF NOT EXISTS t_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  file_name VARCHAR(255) NOT NULL,
  size BIGINT,
  tables TEXT[],
  created_by INTEGER REFERENCES t_user("USER_ID"),
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar columna de índice para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_backups_created_at ON t_backups(created_at DESC);
