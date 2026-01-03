import React, { createContext, useContext, useState, useCallback } from "react";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: React.ReactNode;
  timestamp: Date;
  onUndo?: () => void;
  onViewDetails?: () => void;
  persistent?: boolean;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id" | "timestamp">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id" | "timestamp">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const timestamp = new Date();
    const newToast = { ...toast, id, timestamp };

    setToasts((prev) => [...prev, newToast]);

    // Logging integration
    console.log(`[Toast] [${timestamp.toISOString()}] [${toast.variant.toUpperCase()}] ${toast.title}`, toast.message);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
