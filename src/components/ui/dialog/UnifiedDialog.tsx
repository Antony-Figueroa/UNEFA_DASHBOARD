import React from "react";
import { Modal, ModalBody, ModalFooter } from "../modal";
import Button from "../button/Button";
import {
  DIALOG_COLORS,
  DIALOG_LAYOUT,
  DialogVariant
} from "./DialogConfig";
import {
  CheckCircleIcon,
  AlertIcon,
  InfoIcon,
  ErrorIcon
} from "../../../icons";
import { cn } from "../../../utils/cn";

/**
 * Propiedades para el componente UnifiedDialog.
 */
export interface UnifiedDialogProps {
  /** Indica si el diálogo está visible. */
  isOpen: boolean;
  /** Función que se llama cuando el diálogo debe cerrarse. */
  onClose: () => void;
  /** Función opcional que se llama cuando se confirma la acción. */
  onConfirm?: () => void | Promise<void>;
  /** Variante del diálogo (success, error, warning, info, confirm). Por defecto "info". */
  variant?: DialogVariant;
  /** Título del diálogo. */
  title?: string;
  /** Mensaje o contenido del diálogo. */
  message?: React.ReactNode;
  /** Contenido hijo alternativo al message. */
  children?: React.ReactNode;
  /** Etiqueta para el botón de confirmar. */
  confirmLabel?: string;
  /** Icono para el botón de confirmar. */
  confirmStartIcon?: React.ReactNode;
  /** Etiqueta para el botón de cancelar. Por defecto "Cancelar". */
  cancelLabel?: string;
  /** Indica si la acción de confirmación está en estado de carga. */
  isLoading?: boolean;
  /** Tamaño del modal: sm, md, lg, xl, 2xl. Por defecto "md" */
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

/**
 * Componente de diálogo estandarizado para la aplicación.
 * Utiliza el componente Modal y proporciona estilos consistentes basados en variantes.
 * 
 * @component
 * @example
 * ```tsx
 * <UnifiedDialog 
 *   isOpen={true} 
 *   variant="success" 
 *   title="Guardado" 
 *   message="Datos guardados correctamente" 
 *   onClose={handleClose} 
 * />
 * ```
 */
export const UnifiedDialog: React.FC<UnifiedDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  variant = "info",
  title,
  message,
  children,
  confirmLabel,
  confirmStartIcon,
  cancelLabel = "Cancelar",
  isLoading = false,
  size = "md",
}) => {
  const [internalLoading, setInternalLoading] = React.useState(false);
  const isMounted = React.useRef(false);

  React.useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const safeVariant = DIALOG_COLORS[variant] ? variant : "info";
  const colors = DIALOG_COLORS[safeVariant];
  const layout = DIALOG_LAYOUT;

  // Reset internal loading state when dialog opens/closes
  React.useEffect(() => {
    if (isOpen && isMounted.current) {
      setInternalLoading(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!onConfirm) return;

    try {
      if (isMounted.current) setInternalLoading(true);
      
      const result = onConfirm();
      
      // If onConfirm returns a promise, wait for it
      if (result instanceof Promise) {
        await result;
      }
    } catch (error) {
      console.error("Error in UnifiedDialog confirmation:", error);
    } finally {
      if (isMounted.current) {
        setInternalLoading(false);
      }
    }
  };

  const showLoading = isLoading || internalLoading;

  /**
   * Obtiene el icono correspondiente a la variante del diálogo.
   */
  const getIcon = () => {
    const iconProps = {
      className: cn("w-10 h-10 sm:w-12 sm:h-12", colors.icon),
      strokeWidth: 2
    };

    switch (variant) {
      case "success": return <CheckCircleIcon {...iconProps} />;
      case "error": return <ErrorIcon {...iconProps} />;
      case "warning": return <AlertIcon {...iconProps} />;
      case "info": return <InfoIcon {...iconProps} />;
      case "confirm": return <AlertIcon {...iconProps} />;
      default: return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-md overflow-hidden"
      showCloseButton
      size={size}
      zIndex={2000}
    >
      <ModalBody className="flex flex-col items-center text-center px-6 pt-8 pb-4 sm:px-10 sm:pt-12 sm:pb-6">
        <div
          className={cn(
            "mb-6 p-5 sm:p-6 rounded-full flex items-center justify-center animate-in zoom-in duration-300",
            colors.bg
          )}
          aria-hidden="true"
        >
          {getIcon()}
        </div>

        <h3 className={cn(
          layout.titleSize,
          "text-text-main dark:text-text-emphasis mb-3 tracking-tight"
        )}>
          {title || "Notificación"}
        </h3>

        <div className={cn(
          layout.messageSize,
          "text-text-secondary dark:text-text-tertiary max-w-[320px] leading-relaxed"
        )}>
          {children || message}
        </div>
      </ModalBody>

      <ModalFooter className="border-none pt-2 pb-10 justify-center gap-3 px-8 sm:px-10">
        {onConfirm ? (
          <div className="flex flex-col-reverse sm:flex-row w-full gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl border-border-light text-text-primary font-semibold hover:bg-bg-secondary transition-all"
              disabled={showLoading}
            >
              {cancelLabel}
            </Button>
            <Button
              onClick={handleConfirm}
              className={cn(
                "flex-1 h-12 rounded-xl border-none text-white font-semibold shadow-lg shadow-current/10 transition-all active:scale-95",
                colors.button
              )}
              loading={showLoading}
              loadingText={confirmLabel}
              startIcon={confirmStartIcon}
            >
              {confirmLabel || "Confirmar"}
            </Button>
          </div>
        ) : (
          <Button
            onClick={onClose}
            className={cn(
              "w-full h-12 rounded-xl border-none text-white font-semibold shadow-lg shadow-current/10 transition-all active:scale-95",
              colors.button
            )}
          >
            Cerrar
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
};

export default UnifiedDialog;
