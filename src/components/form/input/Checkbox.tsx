import React from "react";
import { cn } from "../../../utils/cn";

/**
 * Propiedades para el componente Checkbox estandarizado.
 */
export interface CheckboxProps {
  /** Texto que acompaña al checkbox. */
  label?: string;
  /** Estado de selección del checkbox. */
  checked: boolean;
  /** Clases adicionales para el contenedor o el input. */
  className?: string;
  /** ID único para el input y su label. */
  id?: string;
  /** Función que se ejecuta al cambiar el estado. */
  onChange: (checked: boolean) => void;
  /** Si el componente está deshabilitado. */
  disabled?: boolean;
  /** Etiqueta de accesibilidad para lectores de pantalla. */
  ariaLabel?: string;
}

/**
 * Componente Checkbox estandarizado con soporte para temas claro/oscuro.
 * Utiliza una apariencia personalizada para mantener consistencia visual.
 * 
 * @component
 * @example
 * ```tsx
 * <Checkbox 
 *   label="Acepto los términos" 
 *   checked={accepted} 
 *   onChange={setAccepted} 
 * />
 * ```
 */
const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  id,
  onChange,
  className = "",
  disabled = false,
  ariaLabel,
}) => {
  return (
    <label
      className={cn(
        "flex items-center space-x-3 group transition-opacity",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      )}
      htmlFor={id}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        <input
          id={id}
          type="checkbox"
          className={cn(
            "w-5 h-5 appearance-none cursor-pointer rounded-md border transition-all duration-200",
            "border-border-medium dark:border-border-dark",
            "checked:border-transparent checked:bg-brand-500",
            "focus:outline-hidden focus:ring-2 focus:ring-brand-500/20",
            disabled && "cursor-not-allowed opacity-60",
            className
          )}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          aria-label={ariaLabel || label}
        />
        
        {checked && (
          <svg
            className="absolute pointer-events-none text-white animate-in zoom-in-50 duration-200"
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 14 14"
            fill="none"
          >
            <path
              d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      
      {label && (
        <span className="text-sm font-medium text-text-primary dark:text-text-secondary select-none">
          {label}
        </span>
      )}
    </label>
  );
};

export default Checkbox;
