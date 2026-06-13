import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { addressService } from "../services/addressService";
import type { AddressCoincidence } from "../types";

function camelize(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function camelizeKeys<T>(obj: unknown): T {
  if (Array.isArray(obj)) return obj.map(camelizeKeys) as T;
  if (obj !== null && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      result[camelize(key)] = camelizeKeys(val);
    }
    return result as T;
  }
  return obj as T;
}

export const useAddressCoincidence = () => {
  const [coincidence, setCoincidence] = useState<AddressCoincidence | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCoincidence = useCallback(
    async (personId: number | string, institutionId: number | string) => {
      if (!personId || !institutionId) {
        setCoincidence(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await addressService.getCoincidence(personId, institutionId);
        const data = response.data;
        if (data.coincidence === null) {
          setCoincidence(null);
        } else {
          setCoincidence(camelizeKeys<AddressCoincidence>(data));
        }
      } catch (err: any) {
        const message = err.response?.data?.message || "Error al verificar coincidencia geográfica";
        setError(message);
        console.warn("[useAddressCoincidence]", message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clear = useCallback(() => {
    setCoincidence(null);
    setError(null);
  }, []);

  return { coincidence, loading, error, fetchCoincidence, clear };
};
