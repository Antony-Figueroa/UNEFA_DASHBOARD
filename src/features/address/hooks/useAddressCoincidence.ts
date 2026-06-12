import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { addressService } from "../services/addressService";
import type { AddressCoincidence } from "../types";

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
        setCoincidence(response.data);
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
