import { useState, useEffect } from "react";

/**
 * Hook para debouncing de valores.
 * @param value Valor a debouncificar.
 * @param delay Retraso en milisegundos.
 * @returns El valor debouncificado.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
