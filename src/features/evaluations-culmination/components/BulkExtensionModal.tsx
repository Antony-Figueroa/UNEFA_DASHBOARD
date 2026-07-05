/**
 * @file BulkExtensionModal.tsx
 * @description Modal para extensión masiva de prácticas.
 * Permite seleccionar múltiples prácticas y otorgar extensión con un motivo.
 */

import React, { useMemo } from 'react';
import UnifiedDialog from '../../../components/ui/dialog/UnifiedDialog';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../../../components/ui/table';
import type { PracticeWithEvaluations } from '../types';

interface BulkExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  practices: PracticeWithEvaluations[];
  selectedIds: number[];
  onSelectedIdsChange: (ids: number[]) => void;
  reason: string;
  onReasonChange: (reason: string) => void;
}

export const BulkExtensionModal: React.FC<BulkExtensionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  practices,
  selectedIds,
  onSelectedIdsChange,
  reason,
  onReasonChange,
}) => {
  const eligiblePractices = useMemo(
    () => practices.filter(p => p.evaluationStatus !== 'pending' && p.result !== 'failed'),
    [practices]
  );

  const handleToggle = (practiceId: number) => {
    onSelectedIdsChange(
      selectedIds.includes(practiceId)
        ? selectedIds.filter(id => id !== practiceId)
        : [...selectedIds, practiceId]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === eligiblePractices.length) {
      onSelectedIdsChange([]);
    } else {
      onSelectedIdsChange(eligiblePractices.map(p => p.practiceId));
    }
  };

  const handleConfirm = () => {
    if (selectedIds.length > 0 && reason.trim()) {
      onConfirm();
    }
  };

  return (
    <UnifiedDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Extensión Masiva"
      message={`Seleccione las prácticas para otorgar extensión (${selectedIds.length} seleccionadas).`}
      confirmLabel={`Otorgar ${selectedIds.length} extensiones`}
      variant="info"
    >
      <div className="space-y-4">
        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-text-primary dark:text-text-emphasis mb-1">
            Motivo de la extensión *
          </label>
          <textarea
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="Ingrese el motivo de la extensión..."
            rows={3}
            className="w-full px-3 py-2 border border-border-default dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Practice list */}
        <div className="max-h-64 overflow-y-auto border border-border-default dark:border-border-dark rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader className="w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === eligiblePractices.length && eligiblePractices.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-border-default"
                  />
                </TableCell>
                <TableCell isHeader>Estudiante</TableCell>
                <TableCell isHeader>Carrera</TableCell>
                <TableCell isHeader>Estado</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eligiblePractices.map(practice => (
                <TableRow key={practice.practiceId}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(practice.practiceId)}
                      onChange={() => handleToggle(practice.practiceId)}
                      className="rounded border-border-default"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-text-primary dark:text-text-emphasis text-sm">
                      {practice.studentName}
                    </div>
                    <div className="text-xs text-text-tertiary">{practice.studentCi}</div>
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">{practice.careerName}</TableCell>
                  <TableCell className="text-sm text-text-secondary">{practice.evaluationStatus}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {eligiblePractices.length === 0 && (
          <p className="text-sm text-text-tertiary text-center py-4">
            No hay prácticas elegibles para extensión.
          </p>
        )}
      </div>
    </UnifiedDialog>
  );
};

export default BulkExtensionModal;
