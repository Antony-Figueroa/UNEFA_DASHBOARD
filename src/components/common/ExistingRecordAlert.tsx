/**
 * @file ExistingRecordAlert.tsx
 * @description Componente reutilizable para mostrar alerta de registro existente
 * con opción de habilitar edición.
 * 
 * @module components/common/ExistingRecordAlert
 */

import React from "react";
import { AlertTriangle, Edit3, Loader2 } from "lucide-react";
import AsyncButton from "../ui/button/AsyncButton";

/**
 * Props del componente ExistingRecordAlert
 */
export interface ExistingRecordAlertProps {
  /** Nombre del recurso (Estudiante, Tutor, etc.) */
  resourceName: string;
  /** Indica si está buscando */
  isLoading?: boolean;
  /** Indica si está en modo solo lectura */
  isViewOnlyMode: boolean;
  /** Función para habilitar edición */
  onEnableEdit?: () => void;
  /** Función para limpiar y buscar otro */
  onClear?: () => void;
  /** Mensaje personalizado adicional */
  customMessage?: string;
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Componente de alerta para registro existente.
 * Muestra un aviso cuando se detecta un registro duplicado
 * y permite al usuario editarlo si lo desea.
 * 
 * @example
 * ```tsx
 * <ExistingRecordAlert
 *   resourceName="Estudiante"
 *   isLoading={isChecking}
 *   isViewOnlyMode={viewOnlyMode}
 *   onEnableEdit={enableEditMode}
 *   onClear={clearForm}
 * />
 * ```
 */
export const ExistingRecordAlert: React.FC<ExistingRecordAlertProps> = ({
  resourceName,
  isLoading = false,
  isViewOnlyMode = true,
  onEnableEdit,
  onClear,
  customMessage,
  className = "",
}) => {
  const defaultMessage = `Esta ${resourceName.toLowerCase()} ya está registrado. Los campos están en modo solo lectura.`;
  const message = customMessage || defaultMessage;

  return (
    <div 
      className={`mb-4 p-4 bg-warning-50 dark:bg-warning-500/10 border border-warning-200 dark:border-warning-500/20 rounded-lg ${className}`}
      role="alert"
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-warning-600 dark:text-warning-400 animate-spin" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-warning-600 dark:text-warning-400" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm text-warning-700 dark:text-warning-300 font-medium">
            {message}
          </p>
          
          {isViewOnlyMode && onEnableEdit && (
            <div className="mt-3 flex flex-wrap gap-2">
              <AsyncButton
                type="button"
                variant="warning"
                size="sm"
                onClick={onEnableEdit}
                disabled={isLoading}
                startIcon={<Edit3 className="w-4 h-4" />}
                className="inline-flex"
              >
                Habilitar Edición
              </AsyncButton>
              
              {onClear && (
                <AsyncButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClear}
                  disabled={isLoading}
                  className="inline-flex text-warning-600 dark:text-warning-400 hover:text-warning-800 dark:hover:text-warning-200"
                >
                  Buscar otro
                </AsyncButton>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExistingRecordAlert;
