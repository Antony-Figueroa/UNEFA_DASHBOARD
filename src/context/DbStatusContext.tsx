/**
 * @file DbStatusContext.tsx
 * @description Proveedor de contexto para el monitoreo en tiempo real del estado de la base de datos.
 * Realiza consultas periódicas al endpoint de salud y notifica cambios mediante toasts.
 * 
 * @module shared/context/DbStatusProvider
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../api/apiClient';
import { useToast } from './toast';
import { DbStatusContext, type DbStatus } from './db-status';

/**
 * Proveedor que gestiona el estado de conexión con la base de datos.
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {React.ReactNode} props.children - Componentes hijos.
 * @returns {JSX.Element} El proveedor del contexto de estado de DB.
 */
export const DbStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<DbStatus>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();
  
  // Refs para rastrear el estado y evitar notificaciones innecesarias
  const previousStatus = useRef<DbStatus>('checking');
  const consecutiveFailures = useRef<number>(0);
  const MAX_FAILURES = 3; // Número de fallos antes de alarmar al usuario

  /**
   * Realiza una petición al servidor para verificar la conectividad con la DB.
   * Maneja la lógica de reintentos y notificaciones basada en la persistencia del fallo.
   */
  const checkStatus = useCallback(async () => {
    // Evitar chequeos innecesarios en rutas públicas
    const publicPaths = ['/', '/signin', '/signup', '/first-login', '/password-recovery', '/reset-password'];
    const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    
    if (publicPaths.includes(currentPath)) {
      setStatus('checking');
      return;
    }

    try {
      const response = await apiClient.get('/db-status');
      const data = response.data;
      
      const isConnected = data.status === 'connected';
      
      if (isConnected) {
        // Si se conecta, reseteamos el contador de fallos inmediatamente
        consecutiveFailures.current = 0;
        
        if (previousStatus.current === 'disconnected') {
          addToast({
            variant: 'success',
            title: 'Conexión Recuperada',
            message: 'Se ha restablecido la conexión con la base de datos.',
          });
        }
        
        previousStatus.current = 'connected';
        setStatus('connected');
        setError(null);
      } else {
        throw new Error('Database reported disconnected status');
      }
      
      setLastChecked(new Date());
    } catch (err: unknown) {
      const isPublicPage = publicPaths.includes(window.location.pathname);
      if (isPublicPage) return;

      // Incrementar contador de fallos
      consecutiveFailures.current += 1;
      
      console.warn(`[DbStatusContext] Intento de conexión fallido (${consecutiveFailures.current}/${MAX_FAILURES})`);

      // Solo si superamos el máximo de fallos, actualizamos el estado global y mostramos alerta
      if (consecutiveFailures.current >= MAX_FAILURES) {
        if (previousStatus.current !== 'disconnected') {
          addToast({
            variant: 'error',
            title: 'Conexión Perdida',
            message: 'Se ha perdido la conexión con la base de datos. Algunos datos pueden estar desactualizados.',
          });
          previousStatus.current = 'disconnected';
          setStatus('disconnected');
        }
        
        const errorMessage = err instanceof Error ? err.message : 'Error de conexión';
        setError(errorMessage);
      }
      
      setLastChecked(new Date());

      // Si falló pero aún no llegamos al máximo, programar un reintento rápido (3 segundos)
      if (consecutiveFailures.current < MAX_FAILURES) {
        setTimeout(checkStatus, 3000);
      }
    }
  }, [addToast]);

  // Configuración del polling para monitoreo continuo
  useEffect(() => {
    checkStatus();
    // Intervalo de 60 segundos para el chequeo de salud (aumentado para reducir ruido)
    const CHECK_INTERVAL = 60000;
    const interval = setInterval(() => {
      // Solo iniciamos un nuevo ciclo de chequeo si no estamos en medio de una secuencia de fallos
      if (consecutiveFailures.current === 0 || consecutiveFailures.current >= MAX_FAILURES) {
        checkStatus();
      }
    }, CHECK_INTERVAL);
    
    return () => clearInterval(interval);
  }, [checkStatus]);

  return (
    <DbStatusContext.Provider value={{ status, lastChecked, checkStatus, error }}>
      {children}
    </DbStatusContext.Provider>
  );
};
