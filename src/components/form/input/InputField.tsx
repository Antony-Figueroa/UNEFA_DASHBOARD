import React, { forwardRef } from "react";
import { cn } from "../../../utils/cn";

/**
 * Propiedades para el componente Input genérico.
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Indica si el valor es válido. */
  success?: boolean;
  /** Indica si hay un error en el campo. */
  error?: boolean;
  /** Mensaje de ayuda o error que aparece debajo del input. */
  hint?: string;
  /** Icono opcional a la izquierda del input. */
  leftIcon?: React.ReactNode;
  /** Icono opcional a la derecha del input. */
  rightIcon?: React.ReactNode;
}

/**
 * Componente de entrada de texto (Input) estandarizado.
 * Soporta estados de error, éxito, deshabilitado y mensajes de ayuda (hint).
 * 
 * @component
 * @example
 * ```tsx
 * <InputField 
 *   label="Correo electrónico" 
 *   placeholder="ejemplo@correo.com" 
 *   error={!!errors.email}
 *   hint={errors.email?.message}
 * />
 * ```
 */
const InputField = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type = "text",
      className = "",
      disabled = false,
      success = false,
      error = false,
      hint,
      leftIcon,
      rightIcon,
      onChange,
      ...props
    },
    ref
  ) => {
    const shouldUppercase = type !== "password";
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      if (shouldUppercase) {
        const start = input.selectionStart;
        const end = input.selectionEnd;
        input.value = input.value.toUpperCase();
        if (start !== null && end !== null) input.setSelectionRange(start, end);
      }
      if (onChange) onChange(e);
    };
    return (
      <div className="w-full space-y-1.5">
        <div className="relative group">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-500 transition-colors">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            type={type}
            disabled={disabled}
            className={cn(
              // Clases base
              `h-11 w-full rounded-lg border appearance-none text-sm shadow-theme-xs transition-all duration-200 ${shouldUppercase ? 'uppercase' : ''}`,
              "placeholder:text-text-tertiary focus:outline-hidden focus:ring-3",
              "dark:bg-bg-dark dark:text-text-emphasis",
              
              // Padding dinámico si hay iconos
              leftIcon ? "pl-10" : "px-4",
              rightIcon ? "pr-10" : "px-4",
              "py-2.5",

              // Estado: Deshabilitado
              disabled && "text-text-disabled border-border-light bg-bg-secondary cursor-not-allowed opacity-50 dark:bg-white/5 dark:border-border-dark",
              
              // Estado: Error
              !disabled && error && "border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:text-error-400 dark:border-error-500 dark:focus:border-error-800",
              
              // Estado: Éxito
              !disabled && success && "border-success-500 focus:border-success-300 focus:ring-success-500/20 dark:text-success-400 dark:border-success-500 dark:focus:border-success-800",
              
              // Estado: Normal
              !disabled && !error && !success && "bg-bg-main text-text-primary border-border-medium focus:border-brand-300 focus:ring-brand-500/20 dark:border-border-dark dark:focus:border-brand-800",
              
              className
            )}
            aria-invalid={error}
            aria-describedby={hint ? `${props.id}-hint` : undefined}
            onChange={handleChange}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              {rightIcon}
            </div>
          )}
        </div>

        {hint && (
          <p
            id={`${props.id}-hint`}
            className={cn(
              "text-xs font-medium animate-in fade-in slide-in-from-top-1",
              error ? "text-error-500" : success ? "text-success-500" : "text-text-secondary"
            )}
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

InputField.displayName = "InputField";

export default InputField;
