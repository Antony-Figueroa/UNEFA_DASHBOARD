import { useState, useCallback } from "react";

export type ConfirmDialogVariant = "info" | "warning" | "error" | "success" | "confirm";

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void | Promise<void>;
  variant?: ConfirmDialogVariant;
}

export function useConfirmDialog() {
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  const showConfirm = useCallback(
    (opts: { title: string; message: string; onConfirm: () => void | Promise<void>; variant?: ConfirmDialogVariant }) => {
      setConfirmDialog({ isOpen: true, ...opts });
    },
    []
  );

  const hideConfirm = useCallback(() => {
    setConfirmDialog(null);
  }, []);

  return { confirmDialog, showConfirm, hideConfirm };
}

export type UseConfirmDialogReturn = ReturnType<typeof useConfirmDialog>;
