import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode; // Button text or content
  size?: "sm" | "md"; // Button size
  variant?: "primary" | "outline" | "error" | "success" | "warning"; // Button variant
  startIcon?: ReactNode; // Icon before the text
  endIcon?: ReactNode; // Icon after the text
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void; // Click handler
  disabled?: boolean; // Disabled state
  loading?: boolean; // Loading state
  className?: string; // Additional classes
  type?: "button" | "submit" | "reset"; // Native button type
  form?: string; // Associate button with a form outside its DOM subtree
}

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
}) => {
  // Size Classes
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-5 py-3 text-sm",
  };

  // Variant Classes
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
  };

  const isButtonDisabled = disabled || loading;

  return (
    <button
      type={type}
      form={form}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 ${className} ${sizeClasses[size]
        } ${variantClasses[variant]} ${isButtonDisabled ? "cursor-not-allowed pointer-events-none opacity-50" : "cursor-pointer"
        }`}
      onClick={onClick}
      disabled={isButtonDisabled}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Procesando...</span>
        </>
      ) : (
        <>
          {startIcon && <span className="flex items-center">{startIcon}</span>}
          {children}
          {endIcon && <span className="flex items-center">{endIcon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;
