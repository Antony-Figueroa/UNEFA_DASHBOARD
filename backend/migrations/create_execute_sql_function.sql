-- ================================================================================
-- MIGRACIÓN: Función RPC para ejecutar SQL dinámico (solo para restauración)
-- ADVERTENCIA: Esta función es peligrosa, solo debe ser usada por administradores
-- ================================================================================

CREATE OR REPLACE FUNCTION execute_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    EXECUTE sql;
END;
$$;

-- Restringir acceso solo a service_role (backend)
REVOKE EXECUTE ON FUNCTION execute_sql(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION execute_sql(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION execute_sql(text) TO service_role;

COMMENT ON FUNCTION execute_sql(text) IS 'Ejecuta SQL dinámico - SOLO para uso interno del backend durante restauración';
