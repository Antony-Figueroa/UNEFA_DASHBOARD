import React from "react";
import { Tooltip } from "../ui/tooltip/Tooltip";

interface ActionButtonProps {
  /** Icon to be displayed inside the button */
  icon: React.ReactNode;
  /** Tooltip text and aria-label */
  tooltip: string;
  /** Optional text label (usually for mobile view) */
  label?: string;
  /** Click handler */
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** Visual variant of the button */
  variant?: "primary" | "danger" | "success" | "warning" | "info";
  /** Additional CSS classes */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Explicit aria-label if different from tooltip */
  "aria-label"?: string;
  /** If true, the button will take full width */
  fullWidth?: boolean;
}

/**
 * Standardized Action Button for tables and management views.
 * Includes built-in Tooltip and consistent styles.
 */
export const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
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
    },
    ref
  ) => {
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

    const baseClasses = `inline-flex items-center justify-center rounded-xl transition-all border disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 ${variantClasses[variant]}`;
    const sizeClasses = label || fullWidth ? "w-full min-h-12 px-4 py-3 gap-2 text-xs font-bold" : "w-10 h-10";

    const buttonElement = (
      <button
        ref={ref}
        onClick={onClick}
        disabled={disabled}
        className={`${baseClasses} ${sizeClasses} ${className}`}
        aria-label={ariaLabel || label || tooltip}
      >
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
          className: `icon-sm ${(icon.props as { className?: string }).className || ""}`,
        }) : icon}
        {label && <span>{label}</span>}
      </button>
    );

    // If there's a label, we might not need a tooltip, but it doesn't hurt
    return (
      <Tooltip content={tooltip} delay={300} duration={5000} isDisabled={disabled}>
        {buttonElement}
      </Tooltip>
    );
  }
);

ActionButton.displayName = "ActionButton";

export default ActionButton;
