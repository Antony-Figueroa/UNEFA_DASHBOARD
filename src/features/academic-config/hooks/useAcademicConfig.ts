import { useState, useEffect } from 'react';
import { getGraceDefaults } from '../../periods/services/periodService';
import type { GraceDefaults } from '../../periods/types';

interface UseAcademicConfigResult {
  config: GraceDefaults | null;
  loading: boolean;
}

let cachedConfig: GraceDefaults | null = null;

/**
 * Hook que devuelve la configuración académica global.
 * Cachea el resultado en memoria para evitar múltiples fetches.
 */
export const useAcademicConfig = (): UseAcademicConfigResult => {
  const [config, setConfig] = useState<GraceDefaults | null>(cachedConfig);
  const [loading, setLoading] = useState(!cachedConfig);

  useEffect(() => {
    if (cachedConfig) {
      setConfig(cachedConfig);
      setLoading(false);
      return;
    }

    let cancelled = false;

    getGraceDefaults()
      .then((data) => {
        if (cancelled) return;
        cachedConfig = data;
        setConfig(data);
      })
      .catch(() => {
        if (cancelled) return;
        // Fallback a valores por defecto
        const fallback: GraceDefaults = {
          defaultEnrollmentGraceDays: 21,
          defaultEvaluationGraceDays: 10,
          lockApiLoadedFields: true,
          allowMultipleVisitsPerDay: false,
          maxVisitsPerDay: null,
          enforceSequentialOrder: true,
        };
        cachedConfig = fallback;
        setConfig(fallback);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { config, loading };
};
