/**
 * @file EvaluationFlowModal.tsx
 * @description Modal que guía al usuario al siguiente paso en el flujo secuencial
 * de evaluaciones: INSTITUCIONAL → ACADEMICO → COMITE(1) → COMITE(2) → COMITE(3).
 * Se muestra después de guardar una evaluación cuando hay más pasos pendientes.
 */

import React from 'react';
import UnifiedDialog from '../../../components/ui/dialog/UnifiedDialog';
import type { EvaluatorType } from '../types';
import { EVALUATOR_TYPE_LABELS } from '../types';

interface EvaluationFlowModalProps {
  /** Indica si el modal está visible */
  isOpen: boolean;
  /** Función para cerrar el modal (Cerrar) */
  onClose: () => void;
  /** Función para continuar al siguiente paso (Continuar) */
  onContinue: () => void;
  /** Tipo de evaluador del siguiente paso */
  nextType: EvaluatorType;
  /** Índice del miembro del comité (1-3), solo si type es COMITE */
  nextMemberIndex?: number;
  /** Nombre del estudiante para mostrar en el mensaje */
  studentName?: string;
}

/**
 * Modal de flujo secuencial de evaluaciones.
 * Muestra un mensaje informando al usuario qué evaluación viene a continuación
 * y ofrece las opciones "Continuar" o "Cerrar".
 */
export const EvaluationFlowModal: React.FC<EvaluationFlowModalProps> = ({
  isOpen,
  onClose,
  onContinue,
  nextType,
  nextMemberIndex,
  studentName,
}) => {
  if (!isOpen) return null;

  const evaluatorLabel = nextType === 'COMITE'
    ? `Miembro #${nextMemberIndex ?? 1} — ${EVALUATOR_TYPE_LABELS.COMITE}`
    : EVALUATOR_TYPE_LABELS[nextType];

  const studentRef = studentName ? ` de ${studentName}` : '';

  return (
    <UnifiedDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onContinue}
      title="Siguiente Paso"
      message={`El estudiante${studentRef} requiere la ${evaluatorLabel}. ¿Desea continuar con la siguiente evaluación?`}
      confirmLabel="Continuar"
      cancelLabel="Cerrar"
      variant="success"
    />
  );
};

export default EvaluationFlowModal;
