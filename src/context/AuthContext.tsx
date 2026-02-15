/**
 * @file AuthContext.tsx
 * @description Proveedor de contexto para la gestión del estado de autenticación.
 * Implementa la lógica de verificación de sesión, sincronización entre pestañas y cierre de sesión.
 * 
 * @module shared/context/AuthProvider
 */

import React, { useEffect, useState, useCallback } from "react";
import * as authService from "../features/auth/services/authService";
import { AuthContext, type AuthUser } from "./auth";
import { UnifiedDialog } from "../components/ui/dialog/UnifiedDialog";
import { useSessionRefresh } from "../hooks/useSessionRefresh";

/**
 * Proveedor de autenticación que envuelve la aplicación.
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {React.ReactNode} props.children - Componentes hijos.
 * @returns {JSX.Element} El proveedor del contexto de autenticación.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);

  // Activar renovación automática de sesión cuando el usuario está autenticado
  useSessionRefresh();

  /**
   * Verifica el estado actual de la sesión llamando al servicio de autenticación.
   * Se utiliza useCallback para evitar recreaciones innecesarias del hook.
   */
  const checkAuth = useCallback(async () => {
    try {
      const data = await authService.getMe();
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("[AuthContext] Error al verificar sesión:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Efecto inicial: Verificar autenticación al cargar la aplicación
  useEffect(() => {
    // Rutas públicas que no requieren verificación inmediata (mejora performance y evita cold-starts)
    const publicPaths = ['/', '/signin', '/signup', '/first-login', '/password-recovery', '/reset-password'];
    const currentPath = window.location.pathname.replace(/\/$/, '') || '/';

    if (publicPaths.includes(currentPath)) {
      setLoading(false);
      return;
    }
    checkAuth();
  }, [checkAuth]);

  // Sincronización de sesión entre pestañas y detección de expiración
  useEffect(() => {
    /**
     * Maneja eventos de storage para detectar logout en otras pestañas.
     * @param {StorageEvent} e - Evento de cambio en localStorage.
     */
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_logout') {
        setUser(null);
        window.location.replace('/signin');
      }
    };

    /**
     * Maneja el evento de expiración de sesión emitido por el apiClient.
     */
    const handleSessionExpired = () => {
      console.warn("[AuthContext] Sesión expirada detectada via evento.");
      setIsExpired(true);
      sessionStorage.setItem('auth_redirect_reason', 'expired'); // Set reason before redirect
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('unefa:auth:session-expired', handleSessionExpired as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('unefa:auth:session-expired', handleSessionExpired as EventListener);
    };
  }, []);

  /**
   * Cierra la sesión del usuario, limpia el almacenamiento local y redirige al login.
   * Notifica a otras pestañas mediante un evento de storage.
   */
  const signOut = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("[AuthContext] Error durante el cierre de sesión:", error);
    } finally {
      setUser(null);
      // Limpieza exhaustiva de datos locales
      const reason = sessionStorage.getItem('auth_redirect_reason');
      localStorage.clear();
      sessionStorage.clear();

      if (reason) {
        sessionStorage.setItem('auth_redirect_reason', reason);
      }

      // Emitir evento para sincronizar cierre en otras pestañas
      localStorage.setItem('auth_logout', Date.now().toString());

      // Redirección física para resetear el estado de toda la SPA
      window.location.replace('/signin');
    }
  }, []);

  const handleConfirmExpiration = () => {
    setIsExpired(false);
    signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, checkAuth }}>
      {children}

      <UnifiedDialog
        isOpen={isExpired}
        onClose={handleConfirmExpiration}
        onConfirm={handleConfirmExpiration}
        variant="confirm"
        title="Sesión Expirada"
        message="Su sesión ha expirado por inactividad o seguridad. Por favor, inicie sesión nuevamente para continuar trabajando."
        confirmLabel="Volver al Inicio"
        cancelLabel="Cerrar"
      />
    </AuthContext.Provider>
  );
};
