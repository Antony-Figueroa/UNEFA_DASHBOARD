/**
 * @file auth.ts
 * @description Definiciones de tipos y creación del contexto de autenticación.
 * 
 * @module shared/context/auth
 */

import { createContext, useContext } from "react";

/**
 * Representa la estructura de un usuario autenticado en el sistema.
 */
export interface AuthUser {
  /** Identificador único del usuario */
  id: number;
  /** Cédula de Identidad del usuario */
  userCi: string;
  /** Primer nombre */
  name: string;
  /** Segundo nombre (opcional) */
  secondName?: string;
  /** Primer apellido */
  surname: string;
  /** Segundo apellido (opcional) */
  secondSurname?: string;
  /** Correo electrónico institucional o personal */
  email: string;
  /** Número de teléfono de contacto (opcional) */
  phoneNumber?: string;
  /** Rol asignado en el sistema (1: Admin, 2: Asistente, etc.) */
  role: number;
  /** Preferencia de idioma (opcional) */
  locale?: string;
}

/**
 * Interfaz para el valor del contexto de autenticación.
 */
export interface AuthContextType {
  /** Usuario actualmente autenticado o null si no hay sesión */
  user: AuthUser | null;
  /** Indica si se está verificando el estado de la sesión */
  loading: boolean;
  /** Función para cerrar la sesión actual */
  signOut: (reason?: string) => Promise<void>;
  /** Función para verificar manualmente el estado de la sesión */
  checkAuth: () => Promise<void>;
}

/**
 * Contexto de React para la gestión global de autenticación.
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Hook personalizado para acceder al contexto de autenticación.
 * 
 * @throws {Error} Si se utiliza fuera de un AuthProvider.
 * @returns {AuthContextType} El estado y acciones de autenticación.
 * 
 * @example
 * const { user, signOut } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
