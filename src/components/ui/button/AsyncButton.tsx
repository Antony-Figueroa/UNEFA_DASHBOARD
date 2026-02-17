import { useState, ReactNode } from "react";
import { cn } from "../../../utils/cn";

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
  const isDisabled = disabled || isLoading;

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

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-3 text-sm",
    lg: "px-6 py-3.5 text-base",
  };

  const variantClasses = {
    primary:
      "bg-btn-primary-bg text-btn-primary-text shadow-theme-xs hover:bg-btn-primary-hover active:bg-btn-primary-active disabled:bg-bg-secondary dark:disabled:bg-white/3",
    outline:
      "bg-bg-main text-text-primary ring-1 ring-inset ring-border-medium hover:bg-bg-secondary dark:bg-white/3 dark:text-text-tertiary dark:ring-border-dark dark:hover:bg-white/5 disabled:opacity-50",
    error:
      "bg-error-500 text-white shadow-theme-xs hover:bg-error-600 active:bg-error-700 disabled:bg-error-300 dark:disabled:bg-error-900",
    success:
      "bg-success-500 text-white shadow-theme-xs hover:bg-success-600 active:bg-success-700 disabled:bg-success-300 dark:disabled:bg-success-900",
    warning:
      "bg-warning-500 text-white shadow-theme-xs hover:bg-warning-600 active:bg-warning-700 disabled:bg-warning-300 dark:disabled:bg-warning-900",
    ghost:
      "bg-transparent text-text-primary hover:bg-bg-secondary dark:text-text-tertiary dark:hover:bg-white/5 disabled:opacity-50",
  };

  return (
    <button
      type={type}
      form={form}
      disabled={isDisabled}
      onClick={handleClick}
      aria-label={ariaLabel}
      aria-busy={isLoading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {isLoading ? (
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

export default AsyncButton;