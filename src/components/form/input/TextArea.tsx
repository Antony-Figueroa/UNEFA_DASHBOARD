import React, { forwardRef, useEffect, useRef, useCallback } from "react";
import { cn } from "../../../utils/cn";

/**
 * Propiedades para el componente TextArea estandarizado.
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Indica si hay un error en el campo. */
  error?: boolean;
  /** Mensaje de ayuda o error que aparece debajo del área de texto. */
  hint?: string;
  /** Si debe ajustar automáticamente su altura según el contenido. */
  autoResize?: boolean;
}

/**
 * Componente de área de texto (TextArea) estandarizado.
 * Incluye soporte para auto-redimensionado, estados de error y mensajes de ayuda.
 * 
 * @component
 * @example
 * ```tsx
 * <TextArea 
 *   label="Descripción" 
 *   placeholder="Escribe aquí..." 
 *   autoResize 
 *   error={!!errors.description}
 *   hint={errors.description?.message}
 * />
 * ```
 */
const TextArea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className = "",
      disabled = false,
      error = false,
      hint = "",
      rows = 3,
      autoResize = true,
      onChange,
      ...props
    },
    ref
  ) => {
    const internalRef = useRef<HTMLTextAreaElement | null>(null);

    /**
     * Combina la referencia externa con la interna necesaria para el autoResize.
     */
    const setRefs = useCallback((node: HTMLTextAreaElement | null) => {
      internalRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
      }
    }, [ref]);

    /**
     * Ajusta la altura del textarea basándose en su scrollHeight.
     */
    const adjustHeight = useCallback(() => {
      const textarea = internalRef.current;
      if (textarea && autoResize) {
        textarea.style.height = "auto";
        // ponytail: min-height = rows * 24px (line-height) to prevent collapse on empty
        const minPx = rows * 24;
        textarea.style.height = `${Math.max(textarea.scrollHeight, minPx)}px`;
      }
    }, [autoResize, rows]);

    // Efecto para ajustar altura inicial y cuando cambia el valor externamente
    useEffect(() => {
      if (autoResize) {
        adjustHeight();
      }
    }, [props.value, autoResize, adjustHeight]);

    /**
     * Manejador de cambios que integra el auto-redimensionado.
     */
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoResize) {
        adjustHeight();
      }
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <div className="w-full space-y-1.5">
        <textarea
          {...props}
          ref={setRefs}
          rows={rows}
          onChange={handleChange}
          disabled={disabled}
          className={cn(
            // Clases base
            "w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs transition-all duration-200 ease-in-out",
            "focus:outline-hidden focus:ring-3",
            autoResize ? "resize-none overflow-hidden" : "resize-y",

            // Estado: Deshabilitado
            disabled && "bg-bg-secondary opacity-50 text-text-tertiary border-border-medium cursor-not-allowed dark:bg-white/5 dark:border-border-dark",

            // Estado: Error
            !disabled && error && "bg-transparent border-error-500 focus:border-error-300 focus:ring-error-500/10 dark:border-error-500 dark:bg-bg-dark dark:text-text-emphasis dark:focus:border-error-800",

            // Estado: Normal
            !disabled && !error && "bg-transparent text-text-primary border-border-medium focus:border-brand-300 focus:ring-brand-500/10 dark:border-border-dark dark:bg-bg-dark dark:text-text-emphasis dark:focus:border-brand-800",

            className
          )}
          aria-invalid={error}
          aria-describedby={hint ? `${props.id}-hint` : undefined}
        />
        
        {hint && (
          <p
            id={`${props.id}-hint`}
            className={cn(
              "text-xs font-medium animate-in fade-in slide-in-from-top-1",
              error ? "text-error-500" : "text-text-tertiary"
            )}
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

TextArea.displayName = "TextArea";

export default TextArea;
