import React, { useState, useEffect, useCallback } from "react";
import { useToast, type Toast } from "../../../context/toast";
import Alert from "../alert/Alert";
import { cn } from "../../../utils/cn";

/**
 * Individual toast item component.
 * Handles its own exit animation and auto-hide timer.
 */
const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    // Wait for exit animation to complete
    setTimeout(() => {
      onRemove(toast.id);
    }, 300);
  }, [onRemove, toast.id]);

  useEffect(() => {
    if (!toast.persistent) {
      const timer = setTimeout(() => {
        handleClose();
      }, toast.duration || 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.persistent, toast.duration, handleClose]);

  return (
    <div 
      className={cn(
        "pointer-events-auto transition-all duration-300 ease-in-out",
        isExiting ? "animate-slide-out-right opacity-0" : "animate-slide-in-right opacity-100"
      )}
      role="listitem"
    >
      <Alert
        variant={toast.variant}
        category={toast.category}
        title={toast.title}
        message={toast.message}
        timestamp={toast.timestamp}
        onClose={handleClose}
        actions={
          <div className="flex items-center gap-3">
            {toast.onUndo && (
              <button
                onClick={() => {
                  toast.onUndo?.();
                  handleClose();
                }}
                className="text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 uppercase tracking-wider transition-colors"
                type="button"
              >
                
              </button>
            )}
            {toast.onViewDetails && (
              <button
                onClick={() => {
                  toast.onViewDetails?.();
                  handleClose();
                }}
                className="text-xs font-bold text-text-secondary hover:text-text-primary dark:text-text-tertiary uppercase tracking-wider transition-colors"
                type="button"
              >
              
              </button>
            )}
          </div>
        }
      />
    </div>
  );
};

/**
 * ToastContainer component that manages the display of multiple toast notifications.
 * It uses the Toast context to listen for new notifications and positions them
 * at the bottom-right of the screen.
 * 
 * @example
 * ```tsx
 * // Usually placed at the root of the app
 * <ToastContainer />
 * ```
 */
const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div 
      className="fixed bottom-4 left-4 right-4 md:left-auto md:bottom-6 md:right-6 z-9999 flex flex-col gap-3 w-auto md:w-full md:max-w-sm pointer-events-none"
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      aria-label="Notificaciones"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

export default ToastContainer;
