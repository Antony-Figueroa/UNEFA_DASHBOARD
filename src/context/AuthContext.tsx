import React, { useEffect, useState, useCallback } from "react";
import * as authService from "../features/auth/services/authService";
import { AuthContext, type AuthUser } from "./auth";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const data = await authService.getMe();
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Evitar verificaciones de autenticación en páginas públicas
    // para prevenir intentos de conexión a la base de datos innecesarios al cargar
    const publicPaths = ['/', '/signin', '/signup', '/first-login', '/password-recovery', '/reset-password'];
    const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    
    if (publicPaths.includes(currentPath)) {
      setLoading(false);
      return;
    }
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    // Escuchar cambios en storage para sincronizar logout entre pestañas
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_logout') {
        setUser(null);
        window.location.replace('/signin');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setUser(null);
      // Limpiar datos sensibles de storage
      localStorage.clear();
      sessionStorage.clear();
      // Notificar a otras pestañas
      localStorage.setItem('auth_logout', Date.now().toString());
      // Redirección forzada para limpiar el estado de React y prevenir navegación atrás
      window.location.replace('/signin');
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signOut, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
