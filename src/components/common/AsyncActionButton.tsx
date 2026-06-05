import React, { useState } from "react";
import { Tooltip } from "../ui/tooltip/Tooltip";
import { cn } from "../../utils/cn";

interface AsyncActionButtonProps {
  /** Icon to be displayed inside the button. */
  icon: React.ReactNode;
  /** Tooltip text and default aria-label. */
  tooltip: string;
  /** Optional text label (often used for mobile or descriptive buttons). */
  label?: string;
  /** Click handler function that can be async. */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => Promise<void> | void;
  /** Visual variant of the button. error/info are aliases for danger/primary. */
  variant?: "primary" | "danger" | "success" | "warning" | "info" | "error";
  /** Additional CSS classes for the button. */
  className?: string;
  /** Whether the button is disabled. */
  disabled?: boolean;
  /** Explicit aria-label if different from the tooltip. */
  "aria-label"?: string;
  /** If true, the button will take full width of its container. */
  fullWidth?: boolean;
  /** External loading state. */
  loading?: boolean;
}

/**
 * Async Action Button for tables and management views.
 * Combines ActionButton styling with async loading capabilities.
 * Includes built-in Tooltip, consistent theme styling, and accessibility support.
 * 
 * @example
 * ```tsx
 * <AsyncActionButton 
 *   icon={<EditIcon />} 
 *   tooltip="Edit User" 
 *   onClick={async () => await handleEdit(user)} 
 * />
 * ```
 */
export const AsyncActionButton = React.forwardRef<HTMLButtonElement, AsyncActionButtonProps>(
  (
    {
      icon,
      tooltip,
      label,
      onClick,
      variant = "primary",
      className = "",
      disabled = false,
      "aria-label": ariaLabel,
      fullWidth = false,
      loading: externalLoading = false,
    },
    ref
  ) => {
    const [internalLoading, setInternalLoading] = useState(false);
    
    const isLoading = externalLoading || internalLoading;
    const isDisabled = disabled || isLoading;

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isLoading || !onClick) {
        e.preventDefault();
        return;
      }

      try {
        setInternalLoading(true);
        await onClick(e);
      } finally {
        setInternalLoading(false);
      }
    };

    const variantMap: Record<string, "primary" | "danger" | "success" | "warning" | "info"> = {
      primary: "primary",
      danger: "danger",
      error: "danger",
      success: "success",
      warning: "warning",
      info: "info",
    };

    const resolvedVariant = variantMap[variant] || "primary";

    const variantClasses = {
      primary: label 
        ? "bg-bg-secondary dark:bg-white/5 text-text-secondary dark:text-text-tertiary border-transparent hover:border-border-medium dark:hover:border-white/10"
        : "text-brand-500 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10 bg-[#f5f5f5] dark:bg-white/5",
      danger: label
        ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-transparent hover:border-red-200 dark:hover:border-red-500/20"
        : "text-error-500 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10 bg-[#f5f5f5] dark:bg-white/5",
      success: label
        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent hover:border-emerald-200 dark:hover:border-emerald-500/20"
        : "text-success-500 hover:bg-success-50 dark:text-success-400 dark:hover:bg-success-500/10 bg-[#f5f5f5] dark:bg-white/5",
      warning: label
        ? "bg-warning-50 dark:bg-warning-500/10 text-warning-600 dark:text-warning-400 border-transparent hover:border-warning-200 dark:hover:border-warning-500/20"
        : "text-warning-500 hover:bg-warning-50 dark:text-warning-400 dark:hover:bg-warning-500/10 bg-[#f5f5f5] dark:bg-white/5",
      info: label
        ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-transparent hover:border-blue-200 dark:hover:border-blue-500/20"
        : "text-blue-500 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10 bg-[#f5f5f5] dark:bg-white/5",
    };

    const sizeClasses = label || fullWidth ? "w-full min-h-12 px-4 py-3 gap-2 text-xs font-bold" : "w-10 h-10";

    const buttonElement = (
      <button
        ref={ref}
        onClick={handleClick}
        disabled={isDisabled}
        className={cn(
          "inline-flex items-center justify-center rounded-xl transition-all border disabled:opacity-50 disabled:cursor-not-allowed active:scale-95",
          variantClasses[resolvedVariant],
          sizeClasses,
          className
        )}
        aria-label={ariaLabel || label || tooltip}
        aria-busy={isLoading}
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
          React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
            className: `icon-sm ${(icon.props as { className?: string }).className || ""}`,
          }) : icon
        )}
        {label && <span>{label}</span>}
      </button>
    );

    return (
      <Tooltip content={tooltip} delay={300} duration={5000}>
        {buttonElement}
      </Tooltip>
    );
  }
);

AsyncActionButton.displayName = "AsyncActionButton";

export default AsyncActionButton;