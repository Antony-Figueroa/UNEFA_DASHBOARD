/**
 * @file CloseActasModal.tsx
 * @description Modal para cerrar actas con vista previa de notas proyectadas.
 * Muestra tabla de calificaciones proyectadas, estados y tipos faltantes.
 * Permite confirmar o cancelar la operación de cierre.
 */

import React, { useEffect, useState } from 'react';
import UnifiedDialog from '../../../components/ui/dialog/UnifiedDialog';
import { evaluationsCulminationService } from '../services/evaluationsCulminationService';
import type { CloseActasPreviewItem } from '../services/evaluationsCulminationService';

interface CloseActasModalProps {
  isOpen: boolean;
  onClose: () => void;
  practiceIds: number[];
  onConfirm: () => void;
}

const PROJECTED_STATUS_LABELS: Record<string, string> = {
  culminated: 'Culminado',
  failed: 'Reprobado',
  incomplete: 'Incompleto',
};

const PROJECTED_STATUS_COLORS: Record<string, string> = {
  culminated: 'text-green-600 bg-green-50',
  failed: 'text-red-600 bg-red-50',
  incomplete: 'text-yellow-600 bg-yellow-50',
};

export const CloseActasModal: React.FC<CloseActasModalProps> = ({
  isOpen,
  onClose,
  practiceIds,
  onConfirm,
}) => {
  const [preview, setPreview] = useState<CloseActasPreviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && practiceIds.length > 0) {
      setLoading(true);
      setError(null);
      evaluationsCulminationService
        .closeActasPreview(practiceIds)
        .then((res) => {
          setPreview(res.data || []);
        })
        .catch((err) => {
          setError(err?.message || 'Error al cargar vista previa');
        })
        .finally(() => setLoading(false));
    } else {
      setPreview([]);
      setError(null);
    }
  }, [isOpen, practiceIds]);

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const canProceed = preview.some((p) => p.hasAllEvaluations);

  return (
    <UnifiedDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Cerrar Actas"
      message={
        loading
          ? 'Cargando vista previa...'
          : `Se procesarán ${practiceIds.length} práctica(s). Las evaluaciones serán congeladas y las notas finales serán calculadas.`
      }
      confirmLabel="Cerrar Actas"
      variant="warning"
    >
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <span className="ml-3 text-sm text-text-secondary">Calculando notas proyectadas...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && preview.length > 0 && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex gap-4 text-sm">
            <span className="text-text-secondary">
              <strong>{preview.filter((p) => p.projectedStatus === 'culminated').length}</strong> culminados
            </span>
            <span className="text-text-secondary">
              <strong>{preview.filter((p) => p.projectedStatus === 'failed').length}</strong> reprobados
            </span>
            <span className="text-text-secondary">
              <strong>{preview.filter((p) => p.projectedStatus === 'incomplete').length}</strong> incompletos
            </span>
          </div>

          {/* Preview table */}
          <div className="max-h-72 overflow-y-auto border border-border-default dark:border-border-dark rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-tertiary text-xs uppercase bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <th className="px-3 py-2">Práctica</th>
                  <th className="px-3 py-2 text-center">Nota Actual</th>
                  <th className="px-3 py-2 text-center">Nota Proyectada</th>
                  <th className="px-3 py-2 text-center">Mínimo</th>
                  <th className="px-3 py-2 text-center">Estado</th>
                  <th className="px-3 py-2">Detalles</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((item) => (
                  <tr
                    key={item.practiceId}
                    className="border-b border-gray-100 dark:border-gray-700/50 last:border-b-0"
                  >
                    <td className="px-3 py-2 font-medium text-text-primary">
                      #{item.practiceId}
                      {item.isFrozen && (
                        <span className="ml-1 text-xs text-text-tertiary">(congelada)</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center tabular-nums">
                      {item.currentGrade != null ? (
                        <span className="font-medium">{item.currentGrade}</span>
                      ) : (
                        <span className="text-text-tertiary">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center tabular-nums">
                      {item.projectedGrade != null ? (
                        <span className={`font-semibold ${item.projectedGrade >= item.minimumGrade ? 'text-green-600' : 'text-red-600'}`}>
                          {item.projectedGrade}
                        </span>
                      ) : (
                        <span className="text-text-tertiary">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center text-text-tertiary tabular-nums">
                      {item.minimumGrade}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-flex items-center rounded-full text-xs px-2 py-0.5 font-medium ${PROJECTED_STATUS_COLORS[item.projectedStatus]}`}>
                        {PROJECTED_STATUS_LABELS[item.projectedStatus]}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-text-tertiary">
                      {item.missingTypes && item.missingTypes.length > 0 && (
                        <span>Falta: {item.missingTypes.join(', ')}</span>
                      )}
                      {item.hasAllEvaluations && (
                        <span className="text-green-600">Evaluaciones completas</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!canProceed && (
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              No se puede cerrar: todas las prácticas seleccionadas tienen evaluaciones incompletas.
            </p>
          )}
        </div>
      )}
    </UnifiedDialog>
  );
};

export default CloseActasModal;
