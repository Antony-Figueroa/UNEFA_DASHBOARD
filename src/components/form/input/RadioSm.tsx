import React from "react";
import { cn } from "../../../utils/cn";

/**
 * Propiedades para el componente RadioSm (Radio Pequeño) estandarizado.
 */
export interface RadioSmProps {
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
}

/**
 * Componente de botón de radio pequeño (RadioSm) estandarizado.
 * Versión compacta del componente Radio para interfaces con alta densidad de información.
 * 
 * @component
 * @example
 * ```tsx
 * <RadioSm 
 *   id="sm-option1" 
 *   name="sm-options" 
 *   value="1" 
 *   checked={selected === "1"} 
 *   onChange={setSelected} 
 *   label="Mini Opción" 
 * />
 * ```
 */
const RadioSm: React.FC<RadioSmProps> = ({
  id,
  name,
  value,
  checked,
  label,
  onChange,
  className = "",
}) => {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer select-none items-center text-sm transition-colors duration-200",
        "text-text-tertiary hover:text-text-primary dark:hover:text-text-emphasis",
        className
      )}
    >
      <span className="relative flex items-center">
        <input
          type="radio"
          id={id}
          name={name}
          value={value}
          checked={checked}
          onChange={() => onChange(value)}
          className="sr-only"
        />
        
        <span
          className={cn(
            "mr-2 flex h-4 w-4 items-center justify-center rounded-full border transition-all duration-200",
            checked
              ? "border-brand-500 bg-brand-500"
              : "bg-transparent border-border-medium dark:border-border-dark"
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full bg-white transition-transform duration-200",
              checked ? "scale-100" : "scale-0"
            )}
          />
        </span>
      </span>
      {label}
    </label>
  );
};

export default RadioSm;
