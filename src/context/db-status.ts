/**
 * @file db-status.ts
 * @description Definiciones de tipos y creación del contexto para el estado de la base de datos.
 * 
 * @module shared/context/db-status
 */

import { createContext, useContext } from "react";

/**
 * Representa los posibles estados de la conexión con la base de datos.
 * - 'checking': Verificación en curso o estado inicial.
 * - 'connected': Conexión exitosa y operativa.
 * - 'disconnected': Error de conexión o servidor no disponible.
 */
export type DbStatus = "checking" | "connected" | "disconnected";

/**
 * Interfaz para el valor del contexto de estado de la base de datos.
 */
export interface DbStatusContextType {
  /** Estado actual de la conexión */
  status: DbStatus;
  /** Fecha y hora de la última verificación exitosa o fallida */
  lastChecked: Date | null;
  /** Función para forzar una verificación del estado */
  checkStatus: () => Promise<void>;
  /** Mensaje de error detallado en caso de desconexión */
  error: string | null;
}

/**
 * Contexto de React para monitorear la salud de la conexión con el backend/DB.
 */
export const DbStatusContext = createContext<DbStatusContextType | undefined>(undefined);

/**
 * Hook personalizado para acceder al estado de la base de datos.
 * 
 * @throws {Error} Si se utiliza fuera de un DbStatusProvider.
 * @returns {DbStatusContextType} El estado y acciones de monitoreo de DB.
 * 
 * @example
 * const { status, lastChecked } = useDbStatus();
 */
export const useDbStatus = () => {
  const context = useContext(DbStatusContext);
  if (context === undefined) {
    throw new Error("useDbStatus must be used within a DbStatusProvider");
  }
  return context;
};
