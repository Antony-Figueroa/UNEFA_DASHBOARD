import { useState, useCallback } from 'react';
import { configService, SystemHealth } from '../services/configService';
import { useToast } from '@/context/toast';
import { TOAST } from '@/components/ui/dialog/DialogConfig';

export function useSystemHealth() {
  const { addToast } = useToast();
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [checking, setChecking] = useState(false);

  const checkHealth = useCallback(async () => {
    setChecking(true);
    try {
      const result = await configService.getSystemHealth();
      setHealth(result);
      if (result.status === 'healthy') {
        addToast({ variant: "success", title: "Sistema saludable", message: "Sistema funcionando correctamente" });
      } else {
        addToast({ variant: "error", title: "Problema detectado", message: "Se detectaron problemas en el sistema" });
      }
      return result;
    } catch (err) {
      addToast({ variant: "error", title: "Error", message: "Error al verificar el sistema" });
      console.error('[useSystemHealth]', err);
      return null;
    } finally {
      setChecking(false);
    }
  }, []);

  const clearOldLogs = useCallback(async (days: number = 90) => {
    try {
      const result = await configService.clearOldLogs(days);
      addToast({ variant: "success", title: "Logs limpiados", message: result.message || 'Logs limpiados correctamente' });
      return true;
    } catch (err) {
      addToast({ variant: "error", title: "Error", message: "Error al limpiar los logs" });
      console.error('[useSystemHealth] Error clearing logs:', err);
      return false;
    }
  }, []);

  const syncData = useCallback(async () => {
    try {
      const result = await configService.syncData();
      if (result.success) {
        addToast({ variant: "success", title: "Sincronizado", message: result.message });
      } else {
        addToast({ variant: "error", title: "Error", message: "Error en la sincronización" });
      }
      return result.success;
    } catch (err) {
      addToast({ variant: "error", title: "Error", message: "Error al sincronizar datos" });
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
