import React, { useState, useEffect, useCallback } from "react";
import { useToast, Toast } from "../../../context/ToastContext";
import Alert from "../alert/Alert";

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300); // Match slideOutRight duration
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
    <div className={`${isExiting ? "animate-slide-out-right" : "animate-slide-in-right"} pointer-events-auto`}>
      <Alert
        variant={toast.variant}
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
              >
                Deshacer
              </button>
            )}
            {toast.onViewDetails && (
              <button
                onClick={() => {
                  toast.onViewDetails?.();
                  handleClose();
                }}
                className="text-xs font-bold text-gray-600 hover:text-gray-800 dark:text-gray-300 uppercase tracking-wider transition-colors"
              >
                Ver Detalles
              </button>
            )}
          </div>
        }
      />
    </div>
  );
};

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:bottom-6 md:right-6 z-9999 flex flex-col gap-3 w-auto md:w-full md:max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

export default ToastContainer;
