/**
 * @file EvaluationActions.tsx
 * @description Barra de acciones administrativas para evaluaciones.
 * Botones de "Cerrar Actas" y "Exportar Excel".
 */

import React from 'react';
import Button from '../../../components/ui/button/Button';
import { DownloadIcon, LockIcon } from '../../../icons';

interface EvaluationActionsProps {
  isReadOnly: boolean;
  onFreezeAll: () => void;
  onExportExcel: () => void;
}

export const EvaluationActions: React.FC<EvaluationActionsProps> = ({
  isReadOnly,
  onFreezeAll,
  onExportExcel,
}) => {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
      <Button
        variant="outline"
        size="sm"
        onClick={onExportExcel}
        disabled={isReadOnly}
      >
        <DownloadIcon className="w-4 h-4 mr-2" />
        Exportar Excel
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onFreezeAll}
        disabled={isReadOnly}
        className="border-error-300 text-error-600 hover:bg-error-50 dark:border-error-700 dark:text-error-400 dark:hover:bg-error-900/20"
      >
        <LockIcon className="w-4 h-4 mr-2" />
        Cerrar Actas
      </Button>
    </div>
  );
};

export default EvaluationActions;
