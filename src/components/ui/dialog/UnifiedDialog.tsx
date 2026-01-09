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
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  XIcon 
} from "../../../icons/actions";

interface UnifiedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  variant: DialogVariant;
  title?: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
}

const UnifiedDialog: React.FC<UnifiedDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  variant,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancelar",
  isLoading = false,
}) => {
  const colors = DIALOG_COLORS[variant];
  const layout = DIALOG_LAYOUT;
  
  const getIcon = () => {
    const className = `w-10 h-10 sm:w-12 sm:h-12 ${colors.icon}`;
    switch (variant) {
      case "success": return <CheckCircleIcon className={className} />;
      case "error": return <XIcon className={className} />;
      case "warning": return <ExclamationTriangleIcon className={className} />;
      case "info": return <InformationCircleIcon className={className} />;
      case "confirm": return <ExclamationTriangleIcon className={className} />;
      default: return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md rounded-[40px]! overflow-hidden" showCloseButton>
      <ModalBody className="flex flex-col items-center text-center px-8 pt-10 pb-6">
        <div className={`mb-6 p-6 rounded-full ${colors.bg} flex items-center justify-center`}>
          {getIcon()}
        </div>
        
        <h3 className={`${layout.titleSize} text-text-emphasis dark:text-text-emphasis mb-4`}>
          {title || "Notificación"}
        </h3>
        
        <p className={`${layout.messageSize} text-text-secondary dark:text-text-tertiary max-w-70`}>
          {message}
        </p>
      </ModalBody>
      
      <ModalFooter className="border-none pt-0 pb-10 justify-center gap-4 px-8">
        {onConfirm ? (
          <>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12 rounded-2xl border-border-light text-text-primary font-semibold"
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>
            <Button
              onClick={onConfirm}
              className={`flex-1 h-12 rounded-2xl ${colors.button} border-none text-white font-semibold`}
              loading={isLoading}
            >
              {confirmLabel || "Confirmar"}
            </Button>
          </>
        ) : (
          <Button
            onClick={onClose}
            className={`w-full h-12 rounded-2xl ${colors.button} border-none text-white font-semibold`}
          >
            Entendido
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
};

export default UnifiedDialog;
