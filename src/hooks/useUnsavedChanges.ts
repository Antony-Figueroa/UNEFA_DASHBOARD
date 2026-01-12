import { useState, useCallback } from "react";

/**
 * Hook para gestionar el cierre de modales con cambios no guardados.
 * 
 * @param isDirty - Indica si el formulario tiene cambios.
 * @param onClose - Función para cerrar el modal.
 * @returns Un objeto con el estado y las funciones necesarias.
 */
export const useUnsavedChanges = (isDirty: boolean, onClose: () => void) => {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleCloseAttempt = useCallback(() => {
    if (isDirty) {
      setShowConfirmation(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  const confirmClose = useCallback(() => {
    setShowConfirmation(false);
    onClose();
  }, [onClose]);

  const cancelClose = useCallback(() => {
    setShowConfirmation(false);
  }, []);

  return {
    showConfirmation,
    handleCloseAttempt,
    confirmClose,
    cancelClose,
  };
};
