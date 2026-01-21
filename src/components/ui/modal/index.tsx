import { useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCloseAttempt?: () => void; // Permite interceptar el cierre (ej. para cambios no guardados)
  className?: string;
  children: React.ReactNode;
  showCloseButton?: boolean; // New prop to control close button visibility
  isFullscreen?: boolean; // Default to false for backwards compatibility
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onCloseAttempt,
  children,
  className,
  showCloseButton = true,
  isFullscreen = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Determinar la función a llamar al intentar cerrar
  const handleClose = onCloseAttempt || onClose;

  // Manejo de foco para accesibilidad
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

  // Clases para el contenido: Si es fullscreen ocupa todo, si no es centrado
  const contentClasses = `
    relative w-full mx-auto
    bg-white dark:bg-bg-dark 
    shadow-2xl 
    transition-all duration-300 ease-out
    ${isFullscreen 
      ? "h-screen w-screen max-w-none max-h-none rounded-none" 
      : `rounded-[24px] sm:rounded-[32px] max-h-[85vh] sm:max-h-[90vh] ${className?.includes('max-w-') ? '' : "max-w-[95%] sm:max-w-[85%] md:max-w-[70%] lg:max-w-4xl"}`
    }
    flex flex-col overflow-hidden
  `;

  const modalContent = (
    <div
      className={`fixed inset-0 flex items-center justify-center ${isFullscreen ? "p-0" : "p-4 sm:p-6 md:p-10"} z-9999999 animate-fade-in overflow-hidden`}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`fixed inset-0 h-full w-full bg-bg-dark/60 backdrop-blur-sm -z-1 transition-opacity duration-300 ease-in-out ${isFullscreen ? "hidden" : ""}`}
        onClick={handleClose}
      ></div>
      <div
        ref={modalRef}
        className={`${contentClasses} ${className ?? ""} ${isFullscreen ? "scale-100" : "scale-95 animate-in zoom-in-95 duration-300"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && (
          <button
            onClick={handleClose}
            aria-label="Cerrar modal"
            className="absolute right-4 top-4 z-999 flex h-10 w-10 items-center justify-center rounded-full bg-bg-secondary text-text-secondary transition-all hover:bg-border-light hover:text-text-primary dark:bg-white/5 dark:text-text-tertiary dark:hover:bg-white/10 dark:hover:text-text-emphasis sm:right-8 sm:top-8 sm:h-12 sm:w-12"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.04289 16.5413C5.65237 16.9318 5.65237 17.565 6.04289 17.9555C6.43342 18.346 7.06658 18.346 7.45711 17.9555L11.9987 13.4139L16.5408 17.956C16.9313 18.3466 17.5645 18.3466 17.955 17.956C18.3455 17.5655 18.3455 16.9323 17.955 16.5418L13.4129 11.9997L17.955 7.4576C18.3455 7.06707 18.3455 6.43391 17.955 6.04338C17.5645 5.65286 16.9313 5.65286 16.5408 6.04338L11.9987 10.5855L7.45711 6.0439C7.06658 5.65338 6.43342 5.65338 6.04289 6.0439C5.65237 6.43442 5.65237 7.06759 6.04289 7.45811L10.5845 11.9997L6.04289 16.5413Z"
                fill="currentColor"
              />
            </svg>
          </button>
        )}
        <div className="flex flex-col h-full w-full min-h-0">{children}</div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

// Subcomponentes para estructura consistente del modal
interface ModalSectionProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalHeader: React.FC<ModalSectionProps> = ({ children, className }) => (
  <div className={`shrink-0 border-b border-border-light px-5 py-4 sm:px-8 sm:py-6 text-lg font-bold text-text-emphasis dark:border-border-dark dark:text-text-emphasis pr-16 ${className ?? ""}`}>{children}</div>
);

export const ModalBody: React.FC<ModalSectionProps> = ({ children, className }) => (
  <div className={`px-5 py-4 sm:px-8 sm:py-6 overflow-y-auto custom-scrollbar grow min-h-0 ${className ?? ""}`}>{children}</div>
);

export const ModalFooter: React.FC<ModalSectionProps> = ({ children, className }) => (
  <div className={`shrink-0 border-t border-border-light px-5 py-4 sm:px-8 sm:py-6 flex items-center justify-end gap-3 dark:border-border-dark ${className ?? ""}`}>{children}</div>
);
