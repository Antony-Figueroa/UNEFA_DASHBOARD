/**
 * @file useSessionRefresh.ts
 * @description Hook para renovar automáticamente la sesión cuando hay actividad del usuario
 */

import { useEffect, useRef } from 'react';
import * as authService from '../features/auth/services/authService';

const SESSION_REFRESH_INTERVAL = 20 * 60 * 1000; // 20 minutos (1/3 de la duración total)
const INACTIVITY_THRESHOLD = 5 * 60 * 1000; // 5 minutos de inactividad

export const useSessionRefresh = () => {
  const lastActivityRef = useRef(Date.now());
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRefreshing = useRef(false);

  const updateLastActivity = () => {
    lastActivityRef.current = Date.now();
  };

  const refreshSession = async () => {
    if (isRefreshing.current) return;
    
    try {
      isRefreshing.current = true;
      const response = await authService.refreshSession();
      console.log(`[SessionRefresh] ${response.message} - Expira en: ${response.expiresIn}`);
      
      // Registrar tiempo de renovación para evitar falsos positivos
      sessionStorage.setItem('auth_last_refresh', Date.now().toString());
      
    } catch (error: any) {
      // Solo loguear si no es un error de expiración esperado
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        console.error('[SessionRefresh] Error al renovar sesión:', error);
      }
    } finally {
      isRefreshing.current = false;
    }
  };

  const shouldRefresh = () => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    
    // Solo renovar si hay actividad reciente (evita renovar si el usuario está inactivo)
    return timeSinceLastActivity < INACTIVITY_THRESHOLD;
  };

  const scheduleRefresh = () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    refreshTimerRef.current = setTimeout(async () => {
      if (shouldRefresh()) {
        await refreshSession();
      }
      scheduleRefresh(); // Reprogramar para el próximo ciclo
    }, SESSION_REFRESH_INTERVAL);
  };

  useEffect(() => {
    // Eventos que indican actividad del usuario
    const activityEvents = [
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click',
      'mousemove'
    ];

    const handleActivity = () => {
      updateLastActivity();
    };

    // Agregar listeners de actividad
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Iniciar el timer de renovación
    scheduleRefresh();

    return () => {
      // Limpiar listeners y timers
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  return { refreshSession };
};