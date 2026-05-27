import React from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../../context/auth";
import { usePermissions } from "../../features/permissions/hooks/usePermissions";
import PageLoader from "../ui/loader";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Legacy: solo roles específicos (Tutor/Estudiante) */
  allowedRoles?: number[];
  /** Nuevo: permisos requeridos (basta con UNO) */
  requiredPermissions?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles, requiredPermissions }) => {
  const { user, loading: authLoading } = useAuth();
  const { hasAnyPermission, loading: permissionsLoading } = usePermissions();
  const location = useLocation();

  if (authLoading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Legacy role check (Tutor/Student panels)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Permission check (admin/management features)
  if (requiredPermissions && requiredPermissions.length > 0) {
    if (permissionsLoading) return <PageLoader />;
    if (!hasAnyPermission(...requiredPermissions)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
