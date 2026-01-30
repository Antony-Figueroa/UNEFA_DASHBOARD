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
  
  // Ref para rastrear el estado anterior y evitar notificaciones duplicadas o innecesarias
  const previousStatus = useRef<DbStatus>('checking');

  /**
   * Realiza una petición al servidor para verificar la conectividad con la DB.
   * Maneja la lógica de notificaciones (toasts) basada en la transición de estados.
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
      
      const newStatus: DbStatus = data.status === 'connected' ? 'connected' : 'disconnected';
      
      // Lógica de notificación ante cambios de estado
      if (newStatus !== previousStatus.current) {
        if (newStatus === 'connected' && previousStatus.current !== 'checking') {
          addToast({
            variant: 'success',
            title: 'Conexión Recuperada',
            message: 'Se ha restablecido la conexión con la base de datos.',
          });
        } else if (newStatus === 'disconnected') {
          addToast({
            variant: 'error',
            title: 'Conexión Perdida',
            message: 'Se ha perdido la conexión con la base de datos. Algunos datos pueden estar desactualizados.',
          });
        }
        previousStatus.current = newStatus;
      }

      setStatus(newStatus);
      setError(data.error || null);
      setLastChecked(new Date());
    } catch (err: unknown) {
      const isPublicPage = publicPaths.includes(window.location.pathname);

      if (!isPublicPage) {
        console.error('[DbStatusContext] Error crítico al verificar estado:', err);
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Error de red';
      
      // Notificar error de red solo si estábamos conectados previamente
      if (previousStatus.current === 'connected' && !isPublicPage) {
        addToast({
          variant: 'error',
          title: 'Error de Red',
          message: 'No se pudo verificar el estado de la base de datos.',
        });
      }
      
      previousStatus.current = 'disconnected';
      setStatus('disconnected');
      setError(errorMessage);
      setLastChecked(new Date());
    }
  }, [addToast]);

  // Configuración del polling para monitoreo continuo
  useEffect(() => {
    checkStatus();
    // Intervalo de 30 segundos para el chequeo de salud
    const CHECK_INTERVAL = 30000;
    const interval = setInterval(checkStatus, CHECK_INTERVAL);
    
    return () => clearInterval(interval);
  }, [checkStatus]);

  return (
    <DbStatusContext.Provider value={{ status, lastChecked, checkStatus, error }}>
      {children}
    </DbStatusContext.Provider>
  );
};
