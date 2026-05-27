import { useState, useEffect } from 'react';
import apiClient from '../../../api/apiClient';
import { SystemEvaluationConfig, DEFAULT_EVALUATION_CONFIG } from '../types';

/**
 * Cache module-level para evitar múltiples fetch.
 * Se reemplaza tras obtener la config del backend.
 */
let cachedConfig: SystemEvaluationConfig | null = null;
let fetchPromise: Promise<SystemEvaluationConfig> | null = null;

/**
 * Hook que obtiene la configuración global del sistema de evaluación
 * desde el endpoint público GET /api/evaluations/system-config.
 *
 * La configuración se cachea a nivel de módulo (una sola llamada HTTP
 * aunque varios componentes usen el hook).
 *
 * @returns { config, loading, error }
 *   - config: siempre tiene valor (usa defaults si falla el fetch)
 *   - loading: true solo mientras se obtiene la config por primera vez
 *   - error: string si hubo error, null si ok
 */
export const useSystemEvaluationConfig = (): {
  config: SystemEvaluationConfig;
  loading: boolean;
  error: string | null;
} => {
  const [loading, setLoading] = useState(!cachedConfig);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Si ya tenemos config en caché, no hacemos fetch
    if (cachedConfig) {
      setLoading(false);
      return;
    }

    // Si ya hay un fetch en curso, esperamos
    if (!fetchPromise) {
      fetchPromise = (async () => {
        try {
          const response = await apiClient.get('/evaluations/system-config');
          const data = response.data?.data ?? response.data;
          return data as SystemEvaluationConfig;
        } catch (err) {
          console.warn(
            '[useSystemEvaluationConfig] No se pudo obtener la configuración, usando defaults:',
            err
          );
          return DEFAULT_EVALUATION_CONFIG;
        }
      })();
    }

    fetchPromise.then((config) => {
      cachedConfig = config;
      setLoading(false);
    });
  }, []);

  return {
    config: cachedConfig ?? DEFAULT_EVALUATION_CONFIG,
    loading,
    error,
  };
};

export default useSystemEvaluationConfig;
