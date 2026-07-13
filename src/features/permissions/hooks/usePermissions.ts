import { useState, useEffect, useCallback } from 'react';
import { permissionService } from '../services/permissionService';
import { useAuth } from '../../../context/auth';

let cachedPermissions: string[] | null = null;
let permissionsPromise: Promise<string[]> | null = null;
let cachedUserId: number | null = null;
let cachedFailure: { userId: number; status: number; timestamp: number } | null = null;
const FAILURE_COOLDOWN_MS = 10000;

const resetPermissionsCache = () => {
  cachedPermissions = null;
  permissionsPromise = null;
  cachedUserId = null;
  cachedFailure = null;
};

/**
 * Hook que proporciona acceso a los permisos del usuario actual.
 * Cachea los permisos en memoria para evitar llamadas repetidas a la API.
 * 
 * Uso:
 *   const { permissions, hasPermission, loading } = usePermissions();
 *   if (hasPermission('students:edit')) { ... }
 */
export function usePermissions() {
  const { user, loading: authLoading } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(authLoading);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = useCallback(async (force = false) => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      resetPermissionsCache();
      setPermissions([]);
      setError(null);
      setLoading(false);
      return;
    }

    if (cachedUserId !== user.id) {
      resetPermissionsCache();
      cachedUserId = user.id;
    }

    const hasRecentFailure =
      !force &&
      cachedFailure?.userId === user.id &&
      Date.now() - cachedFailure.timestamp < FAILURE_COOLDOWN_MS;

    if (hasRecentFailure) {
      setPermissions([]);
      setError('Error al cargar permisos');
      setLoading(false);
      return;
    }

    if (!force && cachedPermissions) {
      setPermissions(cachedPermissions);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (!permissionsPromise || force) {
        permissionsPromise = (async () => {
          try {
            return await permissionService.getMyPermissions();
          } finally {
            permissionsPromise = null;
          }
        })();
      }

      const data = await permissionsPromise;
      cachedPermissions = data;
      cachedFailure = null;
      setPermissions(data);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      cachedPermissions = null;

      if (status === 401 || status === 403) {
        cachedFailure = {
          userId: user.id,
          status,
          timestamp: Date.now(),
        };
      } else {
        cachedFailure = null;
        console.error('[usePermissions] Error fetching permissions:', err);
      }

      setError('Error al cargar permisos');
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [authLoading, user]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

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
    refresh: () => fetchPermissions(true),
  };
}

export default usePermissions;
