import React, { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../api/apiClient';
import { useToast } from './toast';
import { DbStatusContext, type DbStatus } from './db-status';

export const DbStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<DbStatus>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();
  const previousStatus = useRef<DbStatus>('checking');

  const checkStatus = useCallback(async () => {
    // No realizar verificaciones de base de datos en páginas públicas
    const publicPaths = ['/', '/signin', '/signup', '/first-login', '/password-recovery', '/reset-password'];
    const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    
    if (publicPaths.includes(currentPath)) {
      setStatus('checking');
      return;
    }

    try {
      const response = await apiClient.get('/db-status');
      const data = response.data;
      
      const newStatus = data.status === 'connected' ? 'connected' : 'disconnected';
      
      // Notificar cambios de estado
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
          // Limpiar caché local si existiera (ej: localStorage de búsquedas recientes)
          console.warn('[DbStatusContext] Limpiando cachés locales por desconexión');
          // window.localStorage.removeItem('some_cache_key'); 
        }
        previousStatus.current = newStatus;
      }

      setStatus(newStatus);
      setError(data.error || null);
      setLastChecked(new Date());
    } catch (err: unknown) {
      const publicPaths = ['/', '/signin', '/signup', '/first-login', '/password-recovery', '/reset-password'];
      const isPublicPage = publicPaths.includes(window.location.pathname);

      if (!isPublicPage) {
        console.error('[DbStatusContext] Error al verificar estado:', err);
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Error de red';
      
      if (previousStatus.current !== 'disconnected' && previousStatus.current !== 'checking' && !isPublicPage) {
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

  useEffect(() => {
    checkStatus();
    // Verificar cada 30 segundos
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  return (
    <DbStatusContext.Provider value={{ status, lastChecked, checkStatus, error }}>
      {children}
    </DbStatusContext.Provider>
  );
};
