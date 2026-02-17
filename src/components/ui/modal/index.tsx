import { useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../../utils/cn";

/**
 * Properties for the Modal component.
 */
interface ModalProps {
  /** Indicates if the modal is visible */
  isOpen: boolean;
  /** Function to call when the modal should close */
  onClose: () => void;
  /** Optional function to call before closing (e.g., to confirm unsaved changes) */
  onCloseAttempt?: void | (() => void);
  /** Additional CSS classes for the modal content container */
  className?: string;
  /** Modal content */
  children: React.ReactNode;
  /** Whether to show the standard close button in the top right */
  showCloseButton?: boolean;
  /** If true, the modal will occupy the entire screen */
  isFullscreen?: boolean;
}

/**
 * Reusable Modal component with backdrop, focus trapping, and accessibility features.
 * 
 * @example
 * ```tsx
 * <Modal isOpen={show} onClose={() => setShow(false)} title="Example Modal">
 *   <p>Modal content goes here.</p>
 * </Modal>
 * ```
 */
export const Modal: React.FC<ModalProps & { size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl"; zIndex?: number }> = ({
  isOpen,
  onClose,
  onCloseAttempt,
  children,
  className,
  showCloseButton = true,
  isFullscreen = false,
  size = "md",
  zIndex,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const handleClose = (typeof onCloseAttempt === 'function' ? onCloseAttempt : null) || onClose;

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Si el clic es en el backdrop y no en un elemento de Flatpickr que está fuera del modal
    const target = e.target as HTMLElement;
    const isFlatpickrElement = target.closest('.flatpickr-calendar') || 
                               target.closest('.flatpickr-monthDropdown-months') ||
                               target.closest('.flatpickr-innerContainer');
    
    if (!isFlatpickrElement) {
      handleClose();
    }
  };

  // Atrapado de foco para accesibilidad
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }, [isOpen]);

  // Manejar tecla Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, handleClose]);

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
  };

  const modalContent = (
    <div
      className={cn(
        "fixed inset-0 z-1000 flex items-center justify-center overflow-hidden",
        isFullscreen ? "p-0" : "p-4 sm:p-6"
      )}
      style={zIndex ? { zIndex } : undefined}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-300" 
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        ref={modalRef}
        className={cn(
          "relative w-full bg-white dark:bg-bg-dark shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-300",
          isFullscreen ? "h-full" : cn("rounded-2xl max-h-[95vh]", sizeClasses[size as keyof typeof sizeClasses]),
          className
        )}
      >
        {showCloseButton && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full text-text-secondary hover:bg-bg-secondary dark:text-text-tertiary dark:hover:bg-white/5 transition-colors z-10"
            aria-label="Cerrar modal"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
        
        <div className="flex-1 flex flex-col min-h-0">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

/**
 * Header section for the Modal.
 */
export const ModalHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div
      className={cn(
        "px-6 py-4 border-b border-border-light dark:border-border-dark shrink-0",
        className
      )}
    >
      <h2 className="text-xl font-bold text-text-primary dark:text-text-emphasis">
        {children}
      </h2>
    </div>
  );
};

/**
 * Body section for the Modal (scrollable).
 */
export const ModalBody: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div
      className={cn(
        "flex-1 overflow-y-auto px-6 py-4 custom-scrollbar",
        className
      )}
    >
      {children}
    </div>
  );
};

/**
 * Footer section for the Modal.
 */
export const ModalFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div
      className={cn(
        "px-6 py-4 border-t border-border-light dark:border-border-dark flex items-center justify-end gap-3 shrink-0",
        className
      )}
    >
      {children}
    </div>
  );
};
