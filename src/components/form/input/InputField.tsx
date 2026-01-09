import React, { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  success?: boolean;
  error?: boolean;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type = "text",
      className = "",
      disabled = false,
      success = false,
      error = false,
      hint,
      ...props
    },
    ref
  ) => {
    let inputClasses = ` h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-text-tertiary focus:outline-hidden focus:ring-3  dark:bg-bg-dark dark:text-text-emphasis dark:placeholder:text-text-tertiary ${className}`;

    if (disabled) {
      inputClasses += ` text-text-disabled border-border-light bg-bg-secondary cursor-not-allowed dark:bg-white/5 dark:text-text-disabled dark:border-border-dark opacity-50`;
    } else if (error) {
      inputClasses += `  border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:text-error-400 dark:border-error-500 dark:focus:border-error-800`;
    } else if (success) {
      inputClasses += `  border-success-500 focus:border-success-300 focus:ring-success-500/20 dark:text-success-400 dark:border-success-500 dark:focus:border-success-800`;
    } else {
      inputClasses += ` bg-bg-main text-text-primary border-border-medium focus:border-brand-300 focus:ring-brand-500/20 dark:border-border-dark dark:text-text-emphasis  dark:focus:border-brand-800`;
    }

    return (
      <div className="relative">
        <input
          ref={ref}
          type={type}
          disabled={disabled}
          className={inputClasses}
          {...props}
        />

        {hint && (
          <p
            className={`mt-1.5 text-xs ${error
                ? "text-error-500"
                : success
                  ? "text-success-500"
                  : "text-text-secondary"
              }`}
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
