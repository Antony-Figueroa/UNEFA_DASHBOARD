import type { ReactNode } from "react";
import { Modal, ModalBody, ModalFooter } from "../../../components/ui/modal";
import { XIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from "../../../icons/actions";
import { useTheme } from "../../../context/theme";
import Button from "../../../components/ui/button/Button";

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
  variant: "primary" | "error" | "warning" | "success";
}

const variantStyles: Record<CrudConfirmVariant, VariantStyle> = {
  error: {
    iconBg: "bg-red-100 dark:bg-red-900/30",
    icon: <XIcon className="h-6 w-6 text-red-600 dark:text-red-500" />,
    variant: "error",
  },
  success: {
    iconBg: "bg-green-100 dark:bg-green-900/30",
    icon: <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-500" />,
    variant: "success",
  },
  warning: {
    iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
    icon: <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500 dark:text-yellow-400" />,
    variant: "warning",
  },
  info: {
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    icon: <InformationCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-500" />,
    variant: "primary",
  },
};

interface CrudConfirmDialogProps {
  state: CrudConfirmState | null;
  onClose: () => void;
  isLoading?: boolean;
}

export function CrudConfirmDialog({ state, onClose, isLoading = false }: CrudConfirmDialogProps) {
  const { colorMode } = useTheme();

  if (!state?.isOpen) return null;

  const styles = variantStyles[state.variant];

  return (
    <Modal
      isOpen={state.isOpen}
      onClose={() => !isLoading && onClose()}
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
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          Cancelar
        </Button>
        <Button
          variant={styles.variant}
          onClick={state.onConfirm}
          loading={isLoading}
          className="w-full sm:w-auto"
        >
          {state.confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

