import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import type { PendingWithdrawal, BatchActionPayload } from '../types';
import * as withdrawalService from '../services/justifiedWithdrawalService';

interface UseJustifiedWithdrawalReturn {
  /** Lista de retiros justificados pendientes */
  pendingWithdrawals: PendingWithdrawal[];
  /** Indica si se está cargando la lista */
  loading: boolean;
  /** Indica si hay un error */
  error: string | null;
  /** IDs seleccionados para acción en lote */
  selectedIds: number[];
  /** Acción en lote actual */
  batchAction: 'extend' | 'reprobar' | null;
  /** Carga los retiros pendientes */
  fetchPending: () => Promise<void>;
  /** Extiende un retiro justificado individual */
  handleExtend: (practiceId: number, newEndDate: string, reason: string) => Promise<void>;
  /** Reprueba un retiro justificado individual */
  handleReprobar: (practiceId: number, reason: string) => Promise<void>;
  /** Ejecuta acción en lote */
  handleBatchAction: (payload: {
    newEndDate?: string;
    reason: string;
  }) => Promise<void>;
  /** Toggle selección de un ID */
  toggleSelection: (practiceId: number) => void;
  /** Selecciona/deselecciona todos */
  toggleSelectAll: () => void;
  /** Limpia selección */
  clearSelection: () => void;
  /** Asigna la acción en lote desde el componente */
  setBatchAction: React.Dispatch<React.SetStateAction<'extend' | 'reprobar' | null>>;
}

export const useJustifiedWithdrawal = (): UseJustifiedWithdrawalReturn => {
  const [pendingWithdrawals, setPendingWithdrawals] = useState<PendingWithdrawal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [batchAction, setBatchAction] = useState<'extend' | 'reprobar' | null>(null);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await withdrawalService.getPendingWithdrawals();
      setPendingWithdrawals(data);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al cargar retiros justificados';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleExtend = useCallback(async (practiceId: number, newEndDate: string, reason: string) => {
    try {
      await withdrawalService.extendWithdrawal(practiceId, newEndDate, reason);
      toast.success('Retiro justificado extendido exitosamente');
      await fetchPending();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al extender retiro';
      toast.error(message);
      throw err;
    }
  }, [fetchPending]);

  const handleReprobar = useCallback(async (practiceId: number, reason: string) => {
    try {
      await withdrawalService.reprobarWithdrawal(practiceId, reason);
      toast.success('Práctica marcada como reprobada por abandono');
      await fetchPending();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al reprobar retiro';
      toast.error(message);
      throw err;
    }
  }, [fetchPending]);

  const handleBatchAction = useCallback(async (payload: {
    newEndDate?: string;
    reason: string;
  }) => {
    if (selectedIds.length === 0 || !batchAction) return;

    try {
      const batchPayload: BatchActionPayload = {
        ids: selectedIds,
        action: batchAction,
        reason: payload.reason,
        newEndDate: batchAction === 'extend' ? payload.newEndDate : undefined,
      };

      const result = await withdrawalService.batchWithdrawalAction(batchPayload);
      toast.success(
        `Procesados ${result.total} prácticas: ${result.successes} exitosas, ${result.failures} fallos`
      );
      setSelectedIds([]);
      setBatchAction(null);
      await fetchPending();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al procesar acción en lote';
      toast.error(message);
    }
  }, [selectedIds, batchAction, fetchPending]);

  const toggleSelection = useCallback((practiceId: number) => {
    setSelectedIds(prev =>
      prev.includes(practiceId)
        ? prev.filter(id => id !== practiceId)
        : [...prev, practiceId]
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev =>
      prev.length === pendingWithdrawals.length
        ? []
        : pendingWithdrawals.map(w => w.practiceId)
    );
  }, [pendingWithdrawals]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
    setBatchAction(null);
  }, []);

  return {
    pendingWithdrawals,
    loading,
    error,
    selectedIds,
    batchAction,
    fetchPending,
    handleExtend,
    handleReprobar,
    handleBatchAction,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    setBatchAction,
  };
};
