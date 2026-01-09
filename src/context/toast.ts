import { createContext, useContext } from "react";
import type React from "react";
import { type Category } from "../constants/designSystem";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  variant: ToastVariant;
  category?: Category;
  title: string;
  message?: React.ReactNode;
  timestamp: Date;
  onUndo?: () => void;
  onViewDetails?: () => void;
  persistent?: boolean;
  duration?: number;
}

export interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id" | "timestamp">) => void;
  removeToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
