import type { ReactNode } from "react";
import { Modal, ModalBody, ModalFooter } from "../../../components/ui/modal";
import { XIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from "../../../icons/actions";
import { useTheme } from "../../../context/ThemeContext";

type CrudConfirmVariant = "success" | "error" | "warning" | "info";

export interface CrudConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  variant: CrudConfirmVariant;
  onConfirm: () => void;
}

interface VariantStyle {
  iconBg: string;
  icon: ReactNode;
  button: string;
}

const variantStyles: Record<CrudConfirmVariant, VariantStyle> = {
  error: {
    iconBg: "bg-red-100 dark:bg-red-900/30",
    icon: <XIcon className="h-6 w-6 text-red-600 dark:text-red-500" />,
    button: "bg-red-600 hover:bg-red-700",
  },
  success: {
    iconBg: "bg-green-100 dark:bg-green-900/30",
    icon: <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-500" />,
    button: "bg-green-500 hover:bg-green-600",
  },
  warning: {
    iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
    icon: <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500 dark:text-yellow-400" />,
    button: "bg-yellow-500 hover:bg-yellow-600",
  },
  info: {
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    icon: <InformationCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-500" />,
    button: "bg-blue-500 hover:bg-blue-600",
  },
};

interface CrudConfirmDialogProps {
  state: CrudConfirmState | null;
  onClose: () => void;
}

export function CrudConfirmDialog({ state, onClose }: CrudConfirmDialogProps) {
  const { colorMode } = useTheme();

  if (!state?.isOpen) return null;

  const styles = variantStyles[state.variant];

  return (
    <Modal
      isOpen={state.isOpen}
      onClose={onClose}
      className={`max-w-sm ${colorMode === "dark" ? "dark" : ""}`}
    >
      <ModalBody className="text-center pt-10 px-8 pb-4">
        <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${styles.iconBg}`}>
          {styles.icon}
        </div>
        <h3 className="mb-2 text-xl font-bold text-gray-800 dark:text-white">
          {state.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {state.message}
        </p>
      </ModalBody>
      <ModalFooter className="justify-center border-t-0 pt-0 pb-8">
        <button
          type="button"
          onClick={onClose}
          className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/3 sm:w-auto"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={state.onConfirm}
          className={`flex w-full justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-white sm:w-auto ${styles.button}`}
        >
          {state.confirmText}
        </button>
      </ModalFooter>
    </Modal>
  );
}

