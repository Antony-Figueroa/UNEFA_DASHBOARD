import { useState, useEffect, useCallback, useRef } from 'react';
import { permissionService } from '../services/permissionService';
import { useAuth } from '../../../context/auth';

/**
 * Hook que proporciona acceso a los permisos del usuario actual.
 * Cachea los permisos en memoria para evitar llamadas repetidas a la API.
 * 
 * Uso:
 *   const { permissions, hasPermission, loading } = usePermissions();
 *   if (hasPermission('students:edit')) { ... }
 */
export function usePermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const fetchPermissions = useCallback(async () => {
    if (!user) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await permissionService.getMyPermissions();
      setPermissions(data);
    } catch (err) {
      console.error('[usePermissions] Error fetching permissions:', err);
      setError('Error al cargar permisos');
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Solo fetchear una vez por sesión (o cuando cambie el user)
    if (!fetchedRef.current || user) {
      fetchedRef.current = true;
      fetchPermissions();
    }
  }, [fetchPermissions, user]);

  /**
   * Verifica si el usuario tiene un permiso específico.
   * Los usuarios con rol ADMIN (1) tienen todos los permisos.
   */
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    // Admin (rol 1) tiene acceso a todo
    if (user.role === 1) return true;
    return permissions.includes(permission);
  }, [user, permissions]);

  /**
   * Verifica si el usuario tiene al menos uno de los permisos especificados.
   */
  const hasAnyPermission = useCallback((...perms: string[]): boolean => {
    return perms.some(p => hasPermission(p));
  }, [hasPermission]);

  /**
   * Verifica si el usuario tiene todos los permisos especificados.
   */
  const hasAllPermissions = useCallback((...perms: string[]): boolean => {
    return perms.every(p => hasPermission(p));
  }, [hasPermission]);

  return {
    permissions,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refresh: fetchPermissions,
  };
}

export default usePermissions;
