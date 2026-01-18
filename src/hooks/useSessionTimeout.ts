import { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/auth';
import { useToast } from '../context/toast';

/**
 * Tiempo de inactividad permitido (15 minutos = 900,000 ms)
 */
const INACTIVITY_TIMEOUT = 15 * 60 * 1000;

/**
 * Tiempo de advertencia antes del cierre (1 minuto = 60,000 ms)
 */
const WARNING_TIME = 1 * 60 * 1000;

/**
 * Intervalo de verificación del temporizador (1 segundo)
 */
const CHECK_INTERVAL = 1000;

/**
 * Hook para gestionar el cierre automático de sesión por inactividad.
 * Cumple con requisitos de precisión, advertencia previa y capacidad de pausa.
 */
export const useSessionTimeout = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { addToast, removeToast } = useToast();
  
  // Referencia para almacenar el tiempo de la última actividad
  const lastActivityRef = useRef<number>(performance.now());
  
  // Referencia para el ID del toast de advertencia
  const warningToastIdRef = useRef<string | null>(null);
  
  // Estado para pausar el temporizador
  const [isPaused, setIsPaused] = useState(false);
  
  // Referencia al intervalo de verificación
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Ejecuta el cierre de sesión y redirige al login
   */
  const handleLogout = useCallback(async () => {
    if (!user) return;

    try {
      console.log('[SessionTimeout] Cerrando sesión por inactividad...');
      // Limpiar advertencia si existe
      if (warningToastIdRef.current) {
        removeToast(warningToastIdRef.current);
        warningToastIdRef.current = null;
      }

      await signOut();
      
      navigate('/signin', { 
        state: { message: 'Su sesión ha expirado por inactividad prolongada (15 minutos).' }, 
        replace: true 
      });
    } catch (error) {
      console.error('[SessionTimeout] Error durante el cierre automático:', error);
      navigate('/signin', { replace: true });
    }
  }, [navigate, signOut, removeToast, user]);

  /**
   * Reinicia el contador de inactividad.
   * Se usa un ref para evitar que mousemove dispare demasiados procesos.
   */
  const lastResetRef = useRef<number>(0);
  const resetTimeout = useCallback(() => {
    const now = performance.now();
    
    // Solo procesar si han pasado al menos 100ms desde el último reset
    // Esto evita sobrecarga en eventos de alta frecuencia como mousemove
    if (now - lastResetRef.current < 100) return;
    
    lastResetRef.current = now;
    lastActivityRef.current = now;
    
    // Si había una advertencia activa, la removemos al detectar actividad
    if (warningToastIdRef.current) {
      removeToast(warningToastIdRef.current);
      warningToastIdRef.current = null;
    }
  }, [removeToast]);

  /**
   * Funciones para pausar/reanudar el temporizador externamente
   */
  const pauseTimer = useCallback(() => setIsPaused(true), []);
  const resumeTimer = useCallback(() => {
    setIsPaused(false);
    resetTimeout();
  }, [resetTimeout]);

  useEffect(() => {
    // Si el temporizador está pausado, no hacemos nada
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    /**
     * Función que se ejecuta cada segundo para verificar el tiempo transcurrido
     */
    const checkInactivity = () => {
      const now = performance.now();
      const elapsed = now - lastActivityRef.current;

      // 1. Verificar si se alcanzó el tiempo límite de inactividad
      if (elapsed >= INACTIVITY_TIMEOUT) {
        handleLogout();
        return;
      }

      // 2. Verificar si se debe mostrar la advertencia (1 minuto antes)
      if (elapsed >= INACTIVITY_TIMEOUT - WARNING_TIME) {
        if (!warningToastIdRef.current) {
          const id = addToast({
            variant: 'warning',
            title: 'Sesión por expirar',
            message: 'Su sesión se cerrará automáticamente en 1 minuto debido a la inactividad.',
            persistent: true
          });
          warningToastIdRef.current = id;
        }
      }
    };

    // Iniciar el intervalo de verificación
    timerRef.current = setInterval(checkInactivity, CHECK_INTERVAL);

    // Eventos que reinician el temporizador de inactividad
    const activityEvents = [
      'mousedown', 
      'keydown', 
      'scroll', 
      'touchstart', 
      'mousemove',
      'click'
    ];
    
    const activityHandler = () => resetTimeout();

    // Registrar los escuchadores de eventos
    activityEvents.forEach(event => {
      window.addEventListener(event, activityHandler, { passive: true });
    });

    // Limpieza al desmontar o cambiar dependencias
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      activityEvents.forEach(event => {
        window.removeEventListener(event, activityHandler);
      });
    };
  }, [handleLogout, resetTimeout, isPaused, addToast, removeToast]);

  return { pauseTimer, resumeTimer, isPaused };
};
