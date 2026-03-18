/**
 * @file Button.tsx
 * @description Componente de botón reutilizable con soporte para variantes, tamaños y estados.
 */

import { ReactNode } from "react";
import { cn } from "../../../utils/cn";

/**
 * Properties for the Button component.
 */
interface ButtonProps {
  /** Content of the button (text or elements) */
  children: ReactNode;
  /** Button size variant */
  size?: "sm" | "md" | "lg";
  /** Visual variant of the button */
  variant?: "primary" | "outline" | "error" | "success" | "warning" | "ghost";
  /** Optional icon to display before the text */
  startIcon?: ReactNode;
  /** Optional icon to display after the text */
  endIcon?: ReactNode;
  /** Function to execute on click */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** Indicates if the button is disabled */
  disabled?: boolean;
  /** Indicates if the button is in a loading state */
  loading?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Native HTML button type */
  type?: "button" | "submit" | "reset";
  /** ID of the form associated with the button */
  form?: string;
  /** Accessibility label for the button */
  "aria-label"?: string;
}

/**
 * Standardized Button component for the application.
 * Follows SOLID principles and provides a consistent UI across the platform.
 * 
 * @param props - Component properties
 * @returns A styled HTML button element
 * 
 * @example
 * ```tsx
 * <Button variant="primary" onClick={() => console.log('Clicked')}>
 *   Save Changes
 * </Button>
 * ```
 */
const Button: React.FC<ButtonProps> = ({
  children,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  onClick,
  className = "",
  disabled = false,
  loading = false,
  type = "button",
  form,
  "aria-label": ariaLabel,
}) => {
  // Size Classes
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-3 text-sm",
    lg: "px-6 py-3.5 text-base",
  };

  // Variant Classes
  const variantClasses = {
    primary:
      "bg-btn-primary-bg text-btn-primary-text hover:bg-btn-primary-hover active:bg-btn-primary-active disabled:bg-gray-400 dark:disabled:bg-gray-600",
    outline:
      "bg-bg-main text-text-primary ring-1 ring-inset ring-border-medium hover:bg-bg-secondary dark:bg-white/3 dark:text-text-tertiary dark:ring-border-dark dark:hover:bg-white/5 disabled:opacity-50",
    error:
      "bg-error-500 text-white hover:bg-error-600 active:bg-error-700 disabled:bg-error-300 dark:disabled:bg-error-900",
    success:
      "bg-success-500 text-white hover:bg-success-600 active:bg-success-700 disabled:bg-success-300 dark:disabled:bg-success-900",
    warning:
      "bg-warning-500 text-white hover:bg-warning-600 active:bg-warning-700 disabled:bg-warning-300 dark:disabled:bg-warning-900",
    ghost:
      "bg-transparent text-text-primary hover:bg-bg-secondary dark:text-text-tertiary dark:hover:bg-white/5 disabled:opacity-50",
  };

  const isButtonDisabled = disabled || loading;

  return (
    <button
      type={type}
      form={form}
      disabled={isButtonDisabled}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-busy={loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {loading ? (
        <svg
          className="h-4 w-4 animate-spin text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          role="img"
          aria-label="Cargando"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : (
        <>
          {startIcon && <span className="shrink-0">{startIcon}</span>}
          {children}
          {endIcon && <span className="shrink-0">{endIcon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;
