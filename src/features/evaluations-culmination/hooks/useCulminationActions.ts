/**
 * @file useCulminationActions.ts
 * @description Wraps culmination service calls with loading states
 * and toast notifications. Provides approve, certify, reverse,
 * and bulk-extend actions for the grouped culmination view.
 */

import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { evaluationsCulminationService } from '../services/evaluationsCulminationService';
import { evaluationService } from '../../evaluations/services/evaluationService';

export interface UseCulminationActionsReturn {
  // Culmination actions
  approveCulmination: (practiceId: number) => Promise<boolean>;
  certifyPractice: (practiceId: number) => Promise<boolean>;
  reverseCulmination: (practiceId: number, reason: string, resolutionNumber: string) => Promise<boolean>;

  // Close actas actions
  closeActas: (practiceIds: number[]) => Promise<boolean>;
  previewCloseActas: (practiceIds: number[]) => Promise<boolean>;

  // Bulk actions
  bulkExtend: (practiceIds: number[], days: number) => Promise<boolean>;

  // Loading states
  approving: boolean;
  certifying: boolean;
  reversing: boolean;
  closingActas: boolean;
  previewingCloseActas: boolean;
  bulkExtending: boolean;

  // Error state
  error: string | null;
}

/**
 * Hook that wraps culmination service calls with per-action loading states,
 * toast notifications, and optional onSuccess callback for data refetching.
 */
export const useCulminationActions = (
  onSuccess?: () => void
): UseCulminationActionsReturn => {
  const [approving, setApproving] = useState(false);
  const [certifying, setCertifying] = useState(false);
  const [reversing, setReversing] = useState(false);
  const [closingActas, setClosingActas] = useState(false);
  const [previewingCloseActas, setPreviewingCloseActas] = useState(false);
  const [bulkExtending, setBulkExtending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approveCulmination = useCallback(async (practiceId: number): Promise<boolean> => {
    setApproving(true);
    setError(null);
    try {
      const response = await evaluationsCulminationService.approveCulmination(practiceId);
      toast.success(response.message || 'Culminación aprobada exitosamente');
      onSuccess?.();
      return true;
    } catch (err: any) {
      const message = err?.message || 'Error al aprobar culminación';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setApproving(false);
    }
  }, [onSuccess]);

  const certifyPractice = useCallback(async (practiceId: number): Promise<boolean> => {
    setCertifying(true);
    setError(null);
    try {
      const response = await evaluationsCulminationService.generateCertificate(practiceId);
      toast.success(response.message || 'Certificado generado exitosamente');
      onSuccess?.();
      return true;
    } catch (err: any) {
      const message = err?.message || 'Error al generar certificado';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setCertifying(false);
    }
  }, [onSuccess]);

  const reverseCulmination = useCallback(
    async (practiceId: number, reason: string, resolutionNumber: string): Promise<boolean> => {
      setReversing(true);
      setError(null);
      try {
        const response = await evaluationsCulminationService.reverseFailed(
          practiceId,
          reason,
          resolutionNumber
        );
        toast.success(response.message || 'Reversión exitosa');
        onSuccess?.();
        return true;
      } catch (err: any) {
        const message = err?.message || 'Error al revertir culminación';
        setError(message);
        toast.error(message);
        return false;
      } finally {
        setReversing(false);
      }
    },
    [onSuccess]
  );

  const closeActas = useCallback(
    async (practiceIds: number[]): Promise<boolean> => {
      setClosingActas(true);
      setError(null);
      try {
        const response = await evaluationsCulminationService.closeActas(practiceIds);
        const { summary } = response.data;
        toast.success(
          `${summary.culminated} culminado(s), ${summary.failed} reprobado(s), ${summary.skipped} omitido(s)`
        );
        onSuccess?.();
        return true;
      } catch (err: any) {
        const message = err?.message || 'Error al cerrar actas';
        setError(message);
        toast.error(message);
        return false;
      } finally {
        setClosingActas(false);
      }
    },
    [onSuccess]
  );

  const previewCloseActas = useCallback(
    async (practiceIds: number[]): Promise<boolean> => {
      setPreviewingCloseActas(true);
      setError(null);
      try {
        await evaluationsCulminationService.closeActasPreview(practiceIds);
        return true;
      } catch (err: any) {
        const message = err?.message || 'Error al generar vista previa';
        setError(message);
        toast.error(message);
        return false;
      } finally {
        setPreviewingCloseActas(false);
      }
    },
    []
  );

  const bulkExtend = useCallback(
    async (practiceIds: number[], days: number): Promise<boolean> => {
      setBulkExtending(true);
      setError(null);
      try {
        const result = await evaluationService.bulkGrantExtension({
          practiceIds,
          reason: `Extensión masiva de ${days} días otorgada desde la vista de culminación`,
        });
        toast.success(`${result.grantedCount} extensiones otorgadas`);
        onSuccess?.();
        return true;
      } catch (err: any) {
        const message = err?.message || 'Error al aplicar extensiones masivas';
        setError(message);
        toast.error(message);
        return false;
      } finally {
        setBulkExtending(false);
      }
    },
    [onSuccess]
  );

  return {
    approveCulmination,
    certifyPractice,
    reverseCulmination,
    closeActas,
    previewCloseActas,
    bulkExtend,
    approving,
    certifying,
    reversing,
    closingActas,
    previewingCloseActas,
    bulkExtending,
    error,
  };
};

export default useCulminationActions;
