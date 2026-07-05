/**
 * @file AuditHistoryModal.tsx
 * @description Modal que muestra el historial de auditoría de una práctica.
 * Timeline de acciones realizadas sobre la práctica.
 */

import React from 'react';
import UnifiedDialog from '../../../components/ui/dialog/UnifiedDialog';
import type { AuditEntry } from '../../evaluations/services/evaluationService';

interface AuditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AuditEntry[];
  loading: boolean;
}

const getActionColor = (action: string): string => {
  const lower = action.toLowerCase();
  if (lower.includes('retir') || lower.includes('withdraw')) return 'text-error-600 dark:text-error-400';
  if (lower.includes('extensi') || lower.includes('extension')) return 'text-warning-600 dark:text-warning-400';
  if (lower.includes('congel') || lower.includes('freeze')) return 'text-blue-600 dark:text-blue-400';
  if (lower.includes('descongel') || lower.includes('unfreeze')) return 'text-success-600 dark:text-success-400';
  if (lower.includes('evalua') || lower.includes('evaluat')) return 'text-brand-600 dark:text-brand-400';
  if (lower.includes('comite') || lower.includes('committee')) return 'text-purple-600 dark:text-purple-400';
  return 'text-text-secondary';
};

export const AuditHistoryModal: React.FC<AuditHistoryModalProps> = ({
  isOpen,
  onClose,
  data,
  loading,
}) => {
  return (
    <UnifiedDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onClose}
      title="Historial de Auditoría"
      message={loading ? 'Cargando historial...' : `${data.length} registros encontrados`}
      confirmLabel="Cerrar"
      variant="info"
    >
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
        </div>
      ) : data.length === 0 ? (
        <p className="text-sm text-text-tertiary text-center py-8">
          No hay registros de auditoría para esta práctica.
        </p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {data.map((entry) => (
            <div
              key={entry.auditId}
              className="relative pl-6 pb-4 border-l-2 border-border-default dark:border-border-dark last:border-l-0"
            >
              {/* Timeline dot */}
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white dark:bg-gray-800 border-2 border-border-default dark:border-border-dark" />

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${getActionColor(entry.action)}`}>
                    {entry.action}
                  </span>
                  <span className="text-xs text-text-tertiary">
                    {new Date(entry.timestamp).toLocaleDateString('es-VE', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p className="text-xs text-text-secondary">
                  Por: <span className="font-medium">{entry.user}</span>
                </p>

                {entry.oldValue && entry.newValue && (
                  <p className="text-xs text-text-tertiary">
                    <span className="line-through">{entry.oldValue}</span>
                    {' → '}
                    <span className="font-medium">{entry.newValue}</span>
                  </p>
                )}

                {entry.details && (
                  <p className="text-xs text-text-tertiary italic">{entry.details}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </UnifiedDialog>
  );
};

export default AuditHistoryModal;
