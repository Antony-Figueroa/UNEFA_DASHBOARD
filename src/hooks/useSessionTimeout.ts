import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos

export const useSessionTimeout = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
      navigate('/signin', { state: { message: 'Su sesión ha expirado por inactividad.' }, replace: true });
    } catch (error) {
      console.error('Error logging out:', error);
      navigate('/signin', { replace: true });
    }
  }, [navigate, signOut]);

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
