/**
 * @file CloseActasResultsModal.tsx
 * @description Modal que muestra los resultados de cerrar actas:
 * cuántas prácticas culminaron, reprobaron, fallaron,
 * y qué estudiantes recibieron auto-pre-inscripción para el siguiente tipo.
 */

import React from 'react';
import { useNavigate } from 'react-router';
import UnifiedDialog from '../../../components/ui/dialog/UnifiedDialog';
import Button from '../../../components/ui/button/Button';
import type { CloseActasFullResult } from '../hooks/useCulminationActions';

interface CloseActasResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: CloseActasFullResult | null;
}

export const CloseActasResultsModal: React.FC<CloseActasResultsModalProps> = ({
  isOpen,
  onClose,
  results,
}) => {
  const navigate = useNavigate();

  if (!results) return null;

  const { summary, autoPreEnrollResults } = results;
  const created = autoPreEnrollResults.filter(r => r.created);
  const failed = autoPreEnrollResults.filter(r => !r.created);

  const handleExportToEnrollment = () => {
    onClose();
    navigate('/enrollment');
  };

  return (
    <UnifiedDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Resultados del Cierre de Actas"
      variant={summary.failed > 0 ? 'warning' : 'success'}
      confirmLabel="Cerrar"
      onConfirm={onClose}
    >
      <div className="space-y-5">
        {/* Summary cards */}
        <div className="flex flex-wrap gap-3 text-sm">
          <div className="flex-1 min-w-[100px] bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {summary.culminated}
            </div>
            <div className="text-green-700 dark:text-green-300">Culminados</div>
          </div>
          <div className="flex-1 min-w-[100px] bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {summary.failed}
            </div>
            <div className="text-red-700 dark:text-red-300">Reprobados</div>
          </div>
          <div className="flex-1 min-w-[100px] bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {summary.skipped}
            </div>
            <div className="text-yellow-700 dark:text-yellow-300">Omitidos</div>
          </div>
        </div>

        {/* Auto pre-enrollment results */}
        {autoPreEnrollResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-text-primary dark:text-text-emphasis">
              Auto Pre-Inscripción
            </h4>
            <p className="text-xs text-text-secondary">
              Estudiantes a los que se les creó automáticamente una pre-inscripción para el siguiente tipo de pasantía:
            </p>

            {created.length > 0 && (
              <div className="max-h-48 overflow-y-auto border border-border-default dark:border-border-dark rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-text-tertiary text-xs uppercase bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <th className="px-3 py-2">Estudiante</th>
                      <th className="px-3 py-2">Siguiente Tipo</th>
                      <th className="px-3 py-2 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {created.map((item) => (
                      <tr
                        key={item.practiceId}
                        className="border-b border-gray-100 dark:border-gray-700/50 last:border-b-0"
                      >
                        <td className="px-3 py-2 font-medium text-text-primary">
                          {item.studentName}
                        </td>
                        <td className="px-3 py-2 text-text-secondary">
                          {item.nextType || '—'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="inline-flex items-center rounded-full text-xs px-2 py-0.5 font-medium text-green-600 bg-green-50">
                            Creada
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {failed.length > 0 && (
              <div className="max-h-32 overflow-y-auto border border-border-default dark:border-border-dark rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-text-tertiary text-xs uppercase bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <th className="px-3 py-2">Estudiante</th>
                      <th className="px-3 py-2">Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {failed.map((item) => (
                      <tr
                        key={item.practiceId}
                        className="border-b border-gray-100 dark:border-gray-700/50 last:border-b-0"
                      >
                        <td className="px-3 py-2 font-medium text-text-primary">
                          {item.studentName}
                        </td>
                        <td className="px-3 py-2 text-xs text-text-tertiary">
                          {item.message || 'No creado'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Export action */}
        {created.length > 0 && (
          <div className="flex justify-end pt-2 border-t border-border-default dark:border-border-dark">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportToEnrollment}
            >
              Exportar a Inscripción
            </Button>
          </div>
        )}
      </div>
    </UnifiedDialog>
  );
};

export default CloseActasResultsModal;
