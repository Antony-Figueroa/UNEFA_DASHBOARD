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
    iconBg: "bg-error-100 dark:bg-error-950",
    icon: <XIcon className="h-6 w-6 text-error-600 dark:text-error-400" />,
    variant: "error",
  },
  success: {
    iconBg: "bg-success-100 dark:bg-success-950",
    icon: <CheckCircleIcon className="h-6 w-6 text-success-600 dark:text-success-400" />,
    variant: "success",
  },
  warning: {
    iconBg: "bg-warning-100 dark:bg-warning-950",
    icon: <ExclamationTriangleIcon className="h-6 w-6 text-warning-500 dark:text-warning-400" />,
    variant: "warning",
  },
  info: {
    iconBg: "bg-blue-light-100 dark:bg-blue-light-950",
    icon: <InformationCircleIcon className="h-6 w-6 text-blue-light-600 dark:text-blue-light-400" />,
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
        <h3 className="mb-2 text-xl font-bold text-text-primary dark:text-text-emphasis">
          {state.title}
        </h3>
        <p className="text-sm text-text-secondary dark:text-text-tertiary">
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

