-- ================================================================================
-- MIGRACIÓN: Función RPC para listar todas las tablas
-- Permite que el sistema de backups detecte automáticamente todas las tablas
-- ================================================================================

CREATE OR REPLACE FUNCTION get_all_tables()
RETURNS TABLE(table_name text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT table_name::text
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    AND table_name NOT LIKE 'pg_%'
    AND table_name NOT LIKE 'sql_%'
    AND table_name NOT LIKE 'auth.%'
    AND table_name NOT LIKE 'storage.%'
    AND table_name NOT LIKE '_realtime%'
    AND table_name NOT LIKE 'extensions%'
    AND table_name NOT LIKE 'graphql%'
    AND table_name NOT LIKE 'pgsodium%'
    AND table_name NOT LIKE 'pgbouncer%'
    AND table_name NOT LIKE 'pg_tle%'
    AND table_name NOT LIKE 'vault%'
  ORDER BY table_name;
$$;

-- Otorgar permisos para ejecutar la función
GRANT EXECUTE ON FUNCTION get_all_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_tables() TO anon;
GRANT EXECUTE ON FUNCTION get_all_tables() TO service_role;

-- Comentar la función
COMMENT ON FUNCTION get_all_tables() IS 'Retorna todas las tablas del esquema public para el sistema de backups';

-- Verificar que funciona
SELECT get_all_tables();
