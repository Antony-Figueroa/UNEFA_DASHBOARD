import { useState, useEffect, useCallback } from 'react';
import { configService, CategorizedConfig } from '../services/configService';
import { useToast } from '@/context/toast';
import { TOAST } from '@/components/ui/dialog/DialogConfig';

export function useSystemConfig() {
  const { addToast } = useToast();
  const [config, setConfig] = useState<CategorizedConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await configService.getConfig();
      setConfig(response.categorized);
    } catch (err) {
      const message = 'Error al cargar la configuración del sistema';
      setError(message);
      console.error('[useSystemConfig]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const updateConfig = async (updates: Record<string, string | number | boolean>) => {
    try {
      await configService.updateConfig(updates);
      addToast(TOAST.updated('Configuración'));
      await fetchConfig();
      return true;
    } catch (err) {
      addToast(TOAST.updateError('configuración'));
      console.error('[useSystemConfig] Error updating config:', err);
      return false;
    }
  };

  return {
    config,
    loading,
    error,
    fetchConfig,
    updateConfig,
  };
}
