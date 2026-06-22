import { useState, useEffect, useCallback } from "react";
import apiClient from "../api/apiClient";

/**
 * Hook genérico para cargar datos de una sección de configuración.
 * Encapsula fetch/loading/error para eliminar el patrón repetido en todas las páginas.
 *
 * @param endpoint Ruta de la API (ej: "/system-institution")
 * @returns { data, loading, error, refresh }
 */
export function useConfigSection<T = any>(endpoint: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(endpoint);
      const result = res.data?.data ?? res.data;
      setData(result);
    } catch (err: any) {
      if (err?.response?.status !== 404) {
        setError(err?.response?.data?.message || "Error al cargar datos");
      }
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

export type UseConfigSectionReturn<T> = ReturnType<typeof useConfigSection<T>>;
