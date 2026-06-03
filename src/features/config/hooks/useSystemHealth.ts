import { useState, useCallback } from 'react';
import { configService, SystemHealth } from '../services/configService';
import toast from 'react-hot-toast';

export function useSystemHealth() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [checking, setChecking] = useState(false);

  const checkHealth = useCallback(async () => {
    setChecking(true);
    try {
      const result = await configService.getSystemHealth();
      setHealth(result);
      if (result.status === 'healthy') {
        toast.success('Sistema funcionando correctamente');
      } else {
        toast.error('Se detectaron problemas en el sistema');
      }
      return result;
    } catch (err) {
      toast.error('Error al verificar el sistema');
      console.error('[useSystemHealth]', err);
      return null;
    } finally {
      setChecking(false);
    }
  }, []);

  const clearOldLogs = useCallback(async (days: number = 90) => {
    try {
      const result = await configService.clearOldLogs(days);
      toast.success(result.message || 'Logs limpiados correctamente');
      return true;
    } catch (err) {
      toast.error('Error al limpiar los logs');
      console.error('[useSystemHealth] Error clearing logs:', err);
      return false;
    }
  }, []);

  const syncData = useCallback(async () => {
    try {
      const result = await configService.syncData();
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error('Error en la sincronización');
      }
      return result.success;
    } catch (err) {
      toast.error('Error al sincronizar datos');
      console.error('[useSystemHealth] Error syncing data:', err);
      return false;
    }
  }, []);

  return {
    health,
    checking,
    checkHealth,
    clearOldLogs,
    syncData,
  };
}
