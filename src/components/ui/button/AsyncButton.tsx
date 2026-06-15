import { useState, ReactNode } from "react";
import Button from "./Button";

/**
 * @deprecated Usá `Button` directamente con `loadingText`. Este componente se mantiene
 * para compatibilidad pero delega internamente en `Button`. Será eliminado en una
 * versión futura.
 *
 * @example
 * // En lugar de:
 * // <AsyncButton loading={isLoading}>Guardar</AsyncButton>
 * // Usá:
 * // <Button loading={isLoading} loadingText="Guardando...">Guardar</Button>
 */
interface AsyncButtonProps {
  children: ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => Promise<void> | void;
  disabled?: boolean;
  loading?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "outline" | "error" | "success" | "warning" | "ghost";
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
  form?: string;
  "aria-label"?: string;
}

const AsyncButton: React.FC<AsyncButtonProps> = ({
  children,
  onClick,
  disabled = false,
  loading: externalLoading = false,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  className = "",
  type = "button",
  form,
  "aria-label": ariaLabel,
}) => {
  const [internalLoading, setInternalLoading] = useState(false);

  const isLoading = externalLoading || internalLoading;

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isLoading) {
      e.preventDefault();
      return;
    }

    if (!onClick) {
      return;
    }

    try {
      setInternalLoading(true);
      await onClick(e);
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <Button
      type={type}
      form={form}
      disabled={disabled}
      loading={isLoading}
      size={size}
      variant={variant}
      startIcon={startIcon}
      endIcon={endIcon}
      className={className}
      aria-label={ariaLabel}
      onClick={handleClick}
    >
      {children}
    </Button>
  );
};

export default AsyncButton;
