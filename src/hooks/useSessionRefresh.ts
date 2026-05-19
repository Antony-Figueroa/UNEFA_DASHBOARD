/**
 * @file useSessionRefresh.ts
 * @description Hook para renovar automáticamente la sesión cuando hay actividad del usuario o cambios de ruta
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import * as authService from '../features/auth/services/authService';

const SESSION_REFRESH_INTERVAL = 20 * 60 * 1000; // 20 minutos (1/3 de la duración total)
const INACTIVITY_THRESHOLD = 5 * 60 * 1000; // 5 minutos de inactividad
const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * Verifica si hay una sesión activa (token de refresh presente)
 */
const hasActiveSession = (): boolean => {
  return !!localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const useSessionRefresh = () => {
  const location = useLocation();
  const lastActivityRef = useRef(Date.now());
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRefreshing = useRef(false);

  const updateLastActivity = () => {
    lastActivityRef.current = Date.now();
  };

  const refreshSession = async () => {
    // No intentar renovar si no hay sesión activa
    if (!hasActiveSession()) {
      return;
    }

    if (isRefreshing.current) return;

    try {
      isRefreshing.current = true;
      const response = await authService.refreshSession();
      console.log(`[SessionRefresh] ${response.message} - Expira en: ${response.expiresIn}`);

      // Registrar tiempo de renovación para evitar falsos positivos
      sessionStorage.setItem('auth_last_refresh', Date.now().toString());

    } catch (error: any) {
      // Si el refresh falla con 401/403, la sesión ya no es válida
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('[SessionRefresh] Sesión inválida, se eliminará el token');
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      } else if (error.response?.status !== 401 && error.response?.status !== 403) {
        console.error('[SessionRefresh] Error al renovar sesión:', error);
      }
    } finally {
      isRefreshing.current = false;
    }
  };

  const shouldRefresh = () => {
    // Solo renovar si hay una sesión activa
    if (!hasActiveSession()) {
      return false;
    }

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
    // No hacer nada si no hay sesión activa
    if (!hasActiveSession()) {
      return;
    }

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

  // Renovar sesión al cambiar de ruta solo si hay sesión activa
  useEffect(() => {
    // Solo renovar si hay sesión activa y la ruta cambia
    if (!hasActiveSession() || !location.pathname) {
      return;
    }

    const lastRefresh = sessionStorage.getItem('auth_last_refresh');
    const timeSinceLastRefresh = lastRefresh ? Date.now() - parseInt(lastRefresh) : Infinity;
    const wasRecentlyRefreshed = timeSinceLastRefresh < 30000; // 30 segundos

    if (!wasRecentlyRefreshed) {
      console.log(`[SessionRefresh] Cambio de ruta detectado: ${location.pathname}`);
      refreshSession();
    }
  }, [location.pathname]);

  return { refreshSession };
};