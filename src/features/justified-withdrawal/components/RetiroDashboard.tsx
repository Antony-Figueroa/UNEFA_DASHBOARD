import React, { useState } from 'react';
import Badge from '../../../components/ui/badge/Badge';
import Button from '../../../components/ui/button/Button';
import { useJustifiedWithdrawal } from '../hooks/useJustifiedWithdrawal';
import type { PendingWithdrawal } from '../types';

/** Props para el modal de confirmación de acción individual */
interface ActionModalProps {
  type: 'extend' | 'reprobar';
  practice: PendingWithdrawal | null;
  onConfirm: (practiceId: number, value: string, reason: string) => Promise<void>;
  onClose: () => void;
}

const ActionModal: React.FC<ActionModalProps> = ({ type, practice, onConfirm, onClose }) => {
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!practice) return null;

  const handleSubmit = async () => {
    if (type === 'extend' && !value) return;
    if (!reason || reason.trim().length < 10) return;

    setSubmitting(true);
    try {
      await onConfirm(practice.practiceId, value, reason);
      onClose();
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          {type === 'extend' ? 'Extender Retiro Justificado' : 'Reprobar Retiro Justificado'}
        </h3>

        <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
          Estudiante: <strong>{practice.studentName}</strong>
          <br />
          CI: {practice.studentCi}
          <br />
          Práctica: {practice.practiceType}
        </p>

        {type === 'extend' && (
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nueva fecha de finalización
            </label>
            <input
              type="date"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
        )}

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Motivo (mín. 10 caracteres)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder={type === 'extend' ? 'Motivo de la extensión...' : 'Motivo de la reprobación...'}
          />
          {reason.length > 0 && reason.length < 10 && (
            <p className="mt-1 text-xs text-red-500">Mínimo 10 caracteres</p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            variant={type === 'extend' ? 'primary' : 'error'}
            onClick={handleSubmit}
            loading={submitting}
            disabled={
              (type === 'extend' && !value) || reason.trim().length < 10
            }
          >
            {type === 'extend' ? 'Extender' : 'Reprobar'}
          </Button>
        </div>
      </div>
    </div>
  );
};

/** Props para el modal de confirmación de acción en lote */
interface BatchModalProps {
  type: 'extend' | 'reprobar';
  selectedCount: number;
  onConfirm: (payload: { newEndDate?: string; reason: string }) => Promise<void>;
  onClose: () => void;
}

const BatchModal: React.FC<BatchModalProps> = ({ type, selectedCount, onConfirm, onClose }) => {
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (type === 'extend' && !value) return;
    if (!reason || reason.trim().length < 10) return;

    setSubmitting(true);
    try {
      await onConfirm({ newEndDate: type === 'extend' ? value : undefined, reason });
      onClose();
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Acción en Lote: {type === 'extend' ? 'Extender' : 'Reprobar'}
        </h3>

        <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
          {selectedCount} práctica(s) seleccionada(s)
        </p>

        {type === 'extend' && (
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nueva fecha de finalización (para todas)
            </label>
            <input
              type="date"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
        )}

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Motivo (mín. 10 caracteres)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="Motivo de la acción..."
          />
          {reason.length > 0 && reason.length < 10 && (
            <p className="mt-1 text-xs text-red-500">Mínimo 10 caracteres</p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            variant={type === 'extend' ? 'primary' : 'error'}
            onClick={handleSubmit}
            loading={submitting}
            disabled={
              (type === 'extend' && !value) || reason.trim().length < 10
            }
          >
            {type === 'extend' ? 'Extender Todas' : 'Reprobar Todas'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Componente Principal ───────────────────────────────────────

export const RetiroDashboard: React.FC = () => {
  const {
    pendingWithdrawals,
    loading,
    error,
    selectedIds,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    handleExtend,
    handleReprobar,
    handleBatchAction,
    setBatchAction: setBatchActionType,
  } = useJustifiedWithdrawal();

  const [actionModal, setActionModal] = useState<{
    type: 'extend' | 'reprobar';
    practice: PendingWithdrawal | null;
  } | null>(null);

  const [batchModal, setBatchModal] = useState<{
    type: 'extend' | 'reprobar';
  } | null>(null);

  const allSelected = pendingWithdrawals.length > 0 && selectedIds.length === pendingWithdrawals.length;

  return (
    <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-900">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Retiros Justificados Pendientes
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {pendingWithdrawals.length} práctica(s) con retiro justificado sin resolver
          </p>
        </div>

        {!loading && pendingWithdrawals.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearSelection}
              disabled={selectedIds.length === 0}
            >
              Limpiar selección
            </Button>
          </div>
        )}
      </div>

      {/* Batch Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {selectedIds.length} seleccionada(s)
          </span>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setBatchModal({ type: 'extend' })}
          >
            Extender seleccionados
          </Button>
          <Button
            size="sm"
            variant="error"
            onClick={() => setBatchModal({ type: 'reprobar' })}
          >
            Reprobar seleccionados
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <span className="ml-3 text-sm text-gray-500">Cargando retiros...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <p className="font-medium">Error al cargar datos</p>
          <p className="mt-1">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && pendingWithdrawals.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
          <svg className="mb-3 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm">No hay retiros justificados pendientes</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && pendingWithdrawals.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                </th>
                <th className="px-3 py-3 font-medium text-gray-600 dark:text-gray-400">
                  Estudiante
                </th>
                <th className="px-3 py-3 font-medium text-gray-600 dark:text-gray-400">
                  CI
                </th>
                <th className="px-3 py-3 font-medium text-gray-600 dark:text-gray-400">
                  Práctica
                </th>
                <th className="px-3 py-3 font-medium text-gray-600 dark:text-gray-400">
                  Período
                </th>
                <th className="px-3 py-3 font-medium text-gray-600 dark:text-gray-400">
                  Fecha Retiro
                </th>
                <th className="px-3 py-3 font-medium text-gray-600 dark:text-gray-400">
                  Estado
                </th>
                <th className="px-3 py-3 font-medium text-gray-600 dark:text-gray-400">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {pendingWithdrawals.map((practice) => (
                <tr
                  key={practice.practiceId}
                  className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(practice.practiceId)}
                      onChange={() => toggleSelection(practice.practiceId)}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                  </td>
                  <td className="px-3 py-3 font-medium text-gray-900 dark:text-white">
                    {practice.studentName}
                  </td>
                  <td className="px-3 py-3 text-gray-600 dark:text-gray-400">
                    {practice.studentCi}
                  </td>
                  <td className="px-3 py-3">
                    <Badge color="warning" variant="light">
                      {practice.practiceType}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-gray-600 dark:text-gray-400">
                    {practice.period}
                  </td>
                  <td className="px-3 py-3 text-gray-600 dark:text-gray-400">
                    {practice.retiroDate
                      ? new Date(practice.retiroDate).toLocaleDateString('es-VE')
                      : '-'}
                  </td>
                  <td className="px-3 py-3">
                    <Badge color="error" variant="solid" size="sm">
                      Retiro Justificado
                    </Badge>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setActionModal({ type: 'extend', practice })}
                      >
                        Extender
                      </Button>
                      <Button
                        size="sm"
                        variant="error"
                        onClick={() => setActionModal({ type: 'reprobar', practice })}
                      >
                        Reprobar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Action Modal (individual) */}
      {actionModal && (
        <ActionModal
          type={actionModal.type}
          practice={actionModal.practice}
          onConfirm={
            actionModal.type === 'extend'
              ? (id, newEndDate, reason) => handleExtend(id, newEndDate, reason)
              : (id, _value, reason) => handleReprobar(id, reason)
          }
          onClose={() => setActionModal(null)}
        />
      )}

      {/* Batch Modal */}
      {batchModal && (
        <BatchModal
          type={batchModal.type}
          selectedCount={selectedIds.length}
          onConfirm={async (payload) => {
            setBatchActionType(batchModal.type);
            await handleBatchAction(payload);
          }}
          onClose={() => setBatchModal(null)}
        />
      )}
    </div>
  );
};

export default RetiroDashboard;
