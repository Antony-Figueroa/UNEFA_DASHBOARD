/**
 * @file AuthContext.tsx
 * @description Proveedor de contexto para la gestión del estado de autenticación.
 * Implementa la lógica de verificación de sesión, sincronización entre pestañas y cierre de sesión.
 * 
 * @module shared/context/AuthProvider
 */

import React, { useEffect, useState, useCallback, useRef } from "react";
import * as authService from "../features/auth/services/authService";
import { AuthContext, type AuthUser } from "./auth";
import { UnifiedDialog } from "../components/ui/dialog/UnifiedDialog";

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
  
  // Ref para prevenir múltiples ejecuciones del logout
  const isLoggingOutRef = useRef(false);
  // Ref para prevenir múltiples eventos de sesión expirada
  const hasHandledExpirationRef = useRef(false);

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
    } catch (error: any) {
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        console.error("[AuthContext] Error al verificar sesión:", error);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Efecto inicial: Verificar autenticación al cargar la aplicación
  useEffect(() => {
    // Rutas públicas que no requieren verificación inmediata (mejora performance y evita cold-starts)
    const publicPaths = ['/', '/signin', '/signup', '/first-login', '/password-recovery', '/reset-password', '/nosotros', '/carreras', '/pasantias'];
    const currentPath = window.location.pathname.replace(/\/$/, '') || '/';

    if (publicPaths.includes(currentPath)) {
      setLoading(false);
      return;
    }
    checkAuth();
  }, [checkAuth]);

  /**
   * Cierra la sesión del usuario, limpia el almacenamiento local y redirige al login.
   * Notifica a otras pestañas mediante un evento de storage.
   */
  const signOut = useCallback(async (reason?: string) => {
    // Prevenir múltiples ejecuciones simultáneas
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;
    
    try {
      await authService.logout();
    } catch (error: any) { // Explicitly type error as 'any' to access 'response'
      // Only log if it's not a 401/403, as logout might fail due to already expired session
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        console.error("[AuthContext] Error durante el cierre de sesión:", error);
      }
    } finally {
      setUser(null);
      // Limpieza exhaustiva de datos locales
      const savedReason = reason || sessionStorage.getItem('auth_redirect_reason');
      localStorage.clear();
      sessionStorage.clear();

      if (savedReason) {
        sessionStorage.setItem('auth_redirect_reason', savedReason);
      }

      // Emitir evento para sincronizar cierre en otras pestañas
      localStorage.setItem('auth_logout', Date.now().toString());

      // Redirección física para resetear el estado de toda la SPA
      window.location.replace('/signin');
    }
  }, []);

  const handleConfirmExpiration = useCallback(() => {
    if (isLoggingOutRef.current) return;
    setIsExpired(false);
    signOut('expired');
  }, [signOut]);

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
     * Incluye protección contra múltiples disparos.
     */
    const handleSessionExpired = () => {
      // Prevenir múltiples manejo del mismo evento
      if (hasHandledExpirationRef.current) return;
      hasHandledExpirationRef.current = true;
      
      console.warn("[AuthContext] Sesión expirada detectada via evento.");
      sessionStorage.setItem('auth_redirect_reason', 'expired');
      setIsExpired(true);
      
      // Resetear el flag después de un tiempo para permitir futuras expiraciones
      setTimeout(() => {
        hasHandledExpirationRef.current = false;
      }, 2000);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('unefa:auth:session-expired', handleSessionExpired as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('unefa:auth:session-expired', handleSessionExpired as EventListener);
    };
  }, []);

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
