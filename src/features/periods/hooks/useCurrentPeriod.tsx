/**
 * @file Hook centralizado para obtener el periodo actual (En Curso) o el próximo pendiente.
 * @description Elimina la duplicación de lógica de selección de periodo en múltiples componentes.
 *              Regla: primero busca periodo "En Curso" (periodStatus === 2), si no existe
 *              busca el próximo "Pendiente" (periodStatus === 1) ordenado por fecha de inicio.
 */

import { useMemo } from "react";
import { usePeriods } from "./usePeriods";
import { Periodo } from "../types";

interface UseCurrentPeriodOptions {
  /** Deshabilitar carga automática */
  enabled?: boolean;
}

interface UseCurrentPeriodReturn {
  /** Periodo actual (En Curso) o el próximo pendiente, null si no hay ninguno */
  currentPeriod: Periodo | null;
  /** Todos los periodos activos cargados */
  periods: Periodo[];
  /** Estado de carga */
  loading: boolean;
  /** Error si lo hay */
  error: string | null;
}

/**
 * Hook que retorna el periodo "En Curso" o el próximo "Pendiente" de forma automática.
 * 
 * @example
 * ```tsx
 * // Uso básico - solo necesitás el periodo actual
 * const { currentPeriod } = useCurrentPeriod();
 * 
 * // Con acceso a todos los periodos
 * const { currentPeriod, periods } = useCurrentPeriod();
 * 
 * // Para filtrados (ej. Reports)
 * const [periodFilter, setPeriodFilter] = useState("");
 * const { currentPeriod } = useCurrentPeriod();
 * 
 * useEffect(() => {
 *   if (currentPeriod && !periodFilter) {
 *     setPeriodFilter(currentPeriod.description);
 *   }
 * }, [currentPeriod, periodFilter]);
 * ```
 */
export const useCurrentPeriod = (options?: UseCurrentPeriodOptions): UseCurrentPeriodReturn => {
  const { periodos, status, error } = usePeriods(options);

  const currentPeriod = useMemo(() => {
    if (!periodos || periodos.length === 0) return null;

    // 1. Buscar periodo "En Curso" (periodStatus === 2) que esté activo
    const activePeriod = periodos.find(
      (p) => p.periodStatus === 2 && p.status
    );
    if (activePeriod) return activePeriod;

    // 2. Fallback: próximo periodo "Pendiente" (periodStatus === 1) ordenado por fecha de inicio
    const pendingPeriods = periodos
      .filter((p) => p.periodStatus === 1 && p.status)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    
    if (pendingPeriods.length > 0) return pendingPeriods[0];

    // 3. No hay periodo disponible
    return null;
  }, [periodos]);

  return {
    currentPeriod,
    periods: periodos || [],
    loading: status === "loading",
    error: error ? (error instanceof Error ? error.message : String(error)) : null as string | null,
  };
};
