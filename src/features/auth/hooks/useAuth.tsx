import { useState, useEffect } from "react";
import { AuthUser, LoginResponse } from "../types";
import { authService } from "../services/authService";

/**
 * Interfaz de retorno del hook useAuth.
 * Proporciona estado y funciones para gestión de autenticación.
 */
interface UseAuthReturn {
  /** Usuario autenticado actualmente */
  user: AuthUser | null;
  /** Indica si existe una sesión activa */
  isAuthenticated: boolean;
  /** Estado de carga durante operaciones auth */
  isLoading: boolean;
  /** Mensaje de error de la última operación fallida */
  error: string | null;
  /**
   * Autentica usuario con email y contraseña.
   * @param email - Correo electrónico del usuario
   * @param Promise<LoginResponse> - Respuesta del servidor con datos del usuario y token
   * @throws Error si las credenciales son inválidas
   */
  login: (email: string, password: string) => Promise<LoginResponse>;
  /** Cierra la sesión actual del usuario */
  logout: () => void;
  /** Limpia el mensaje de error actual */
  clearError: () => void;
  /**
   * Actualiza los datos del usuario en contexto.
   * @param userData - Nuevos datos del usuario
   */
  setUser: (userData: AuthUser | null) => void;
}

/**
 * Hook personalizado para gestión de autenticación global.
 * Maneja login, logout, validación de sesión y estado de carga.
 * Persiste el token en localStorage para recuperación de sesión.
 *
 * @returns Objeto con estado y funciones de autenticación
 *
 * @example
 * ```tsx
 * const { user, isAuthenticated, login, logout } = useAuth();
 *
 * const handleLogin = async () => {
 *   try {
 *     await login('admin@test.com', 'password123');
 *     navigate('/dashboard');
 *   } catch (error) {
 *     console.error('Login failed:', error);
 *   }
 * };
 * ```
 */
export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user;

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (token) {
          const userData = await authService.validateToken(token);
          setUser(userData);
        }
      } catch (err) {
        localStorage.removeItem("auth_token");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<LoginResponse> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authService.login(email, password);
      
      if (response.user && response.userId) {
        setUser(response.user);
        localStorage.setItem("auth_token", response.userId.toString());
      }
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al iniciar sesión";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("auth_token");
    setError(null);
  };

  const clearError = () => setError(null);

  const updateUser = (userData: AuthUser | null) => setUser(userData);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    clearError,
    setUser: updateUser,
  };
};