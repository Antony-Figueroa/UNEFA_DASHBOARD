import React from 'react';
import { usePermissions } from '../../features/permissions/hooks/usePermissions';

interface RequirePermissionProps {
  /** Permiso requerido para mostrar el children */
  perm: string;
  /** Si se requiere ALL (por defecto ANY) */
  require?: 'all' | 'any';
  /** Permisos adicionales (si require='all' se requieren todos, si require='any' basta con uno) */
  orPerms?: string[];
  /** Children a renderizar si tiene permiso */
  children: React.ReactNode;
  /** Fallback opcional si no tiene permiso (default: null) */
  fallback?: React.ReactNode;
}

/**
 * Componente que renderiza children solo si el usuario tiene el permiso requerido.
 * 
 * Uso:
 *   <RequirePermission perm="students:edit">
 *     <Button>Editar Estudiante</Button>
 *   </RequirePermission>
 * 
 *   <RequirePermission perm="config:view" fallback={<NoAccess />}>
 *     <AdminPanel />
 *   </RequirePermission>
 * 
 *   <RequirePermission perm="students:view" orPerms={['students:edit', 'students:delete']}>
 *     <StudentTable />
 *   </RequirePermission>
 */
export const RequirePermission: React.FC<RequirePermissionProps> = ({
  perm,
  require = 'any',
  orPerms,
  children,
  fallback = null,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions();

  if (loading) return null;

  let hasAccess: boolean;
  
  if (orPerms && orPerms.length > 0) {
    const allPerms = [perm, ...orPerms];
    hasAccess = require === 'all'
      ? hasAllPermissions(...allPerms)
      : hasAnyPermission(...allPerms);
  } else {
    hasAccess = hasPermission(perm);
  }

  if (!hasAccess) return <>{fallback}</>;
  return <>{children}</>;
};

export default RequirePermission;
