import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import * as authService from '../features/auth/services/authService';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos

export const useSessionTimeout = () => {
  const navigate = useNavigate();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogout = useCallback(async () => {
    try {
      await authService.logout();
      navigate('/signin', { state: { message: 'Su sesión ha expirado por inactividad.' } });
    } catch (error) {
      console.error('Error logging out:', error);
      navigate('/signin');
    }
  }, [navigate]);

  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(handleLogout, INACTIVITY_TIMEOUT);
  }, [handleLogout]);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    const activityHandler = () => resetTimeout();

    events.forEach(event => {
      window.addEventListener(event, activityHandler);
    });

    resetTimeout();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach(event => {
        window.removeEventListener(event, activityHandler);
      });
    };
  }, [resetTimeout]);
};
