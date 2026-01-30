import React from "react";
import { cn } from "../../../utils/cn";

/**
 * Propiedades para el componente Radio estandarizado.
 */
export interface RadioProps {
  /** ID único para el botón de radio. */
  id: string;
  /** Nombre del grupo de radio. */
  name: string;
  /** Valor del botón de radio. */
  value: string;
  /** Indica si el botón de radio está seleccionado. */
  checked: boolean;
  /** Texto que acompaña al radio button. */
  label: string;
  /** Función que se ejecuta al cambiar el estado. */
  onChange: (value: string) => void;
  /** Clases adicionales para el contenedor. */
  className?: string;
  /** Si el componente está deshabilitado. */
  disabled?: boolean;
}

/**
 * Componente de botón de radio (Radio) estandarizado.
 * Proporciona un estilo personalizado y accesible para la selección única.
 * 
 * @component
 * @example
 * ```tsx
 * <Radio 
 *   id="option1" 
 *   name="options" 
 *   value="1" 
 *   checked={selected === "1"} 
 *   onChange={setSelected} 
 *   label="Opción 1" 
 * />
 * ```
 */
const Radio: React.FC<RadioProps> = ({
  id,
  name,
  value,
  checked,
  label,
  onChange,
  className = "",
  disabled = false,
}) => {
  return (
    <label
      htmlFor={id}
      className={cn(
        "relative flex select-none items-center gap-3 text-sm font-medium transition-all duration-200",
        disabled
          ? "text-text-tertiary cursor-not-allowed opacity-60"
          : "text-text-secondary dark:text-text-tertiary cursor-pointer hover:text-text-primary dark:hover:text-text-emphasis",
        className
      )}
    >
      <input
        id={id}
        name={name}
        type="radio"
        value={value}
        checked={checked}
        onChange={() => !disabled && onChange(value)}
        className="sr-only"
        disabled={disabled}
      />
      
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full border transition-all duration-200",
          checked
            ? "border-brand-500 bg-brand-500"
            : "bg-transparent border-border-medium dark:border-border-dark",
          disabled && "bg-bg-secondary dark:bg-white/5 border-border-light dark:border-border-dark"
        )}
      >
        <span
          className={cn(
            "h-2 w-2 rounded-full bg-white transition-transform duration-200",
            checked ? "scale-100" : "scale-0"
          )}
        />
      </span>
      
      {label}
    </label>
  );
};

export default Radio;
