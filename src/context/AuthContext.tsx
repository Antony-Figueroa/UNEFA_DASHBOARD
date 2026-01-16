import React, { useEffect, useState } from "react";
import * as authService from "../features/auth/services/authService";
import { AuthContext, type AuthUser } from "./auth";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
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
  };

  useEffect(() => {
    // Evitar verificaciones de autenticación en páginas públicas
    // para prevenir intentos de conexión a la base de datos innecesarios al cargar
    const publicPaths = ['/', '/signin', '/signup', '/first-login', '/forgot-password'];
    const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    
    if (publicPaths.includes(currentPath)) {
      setLoading(false);
      return;
    }
    checkAuth();
  }, []);

  const signOut = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
