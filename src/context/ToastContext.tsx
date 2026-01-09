import React, { useState, useCallback } from "react";
import { ToastContext } from "./toast";

import type { Toast } from "./toast";

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id" | "timestamp">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const timestamp = new Date();
    const newToast = { ...toast, id, timestamp };

    setToasts((prev) => [...prev, newToast]);

    // Logging integration
    const categoryInfo = toast.category ? ` [${toast.category}]` : "";
    console.log(`[Toast] [${timestamp.toISOString()}] [${toast.variant.toUpperCase()}]${categoryInfo} ${toast.title}`, toast.message);
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
