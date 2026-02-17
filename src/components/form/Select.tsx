import { useState, useEffect, forwardRef } from "react";
import { cn } from "../../utils/cn";
import { ChevronDownIcon } from "../../icons";

/**
 * Interfaz para las opciones del componente Select.
 */
export interface SelectOption {
  /** El valor interno de la opción. */
  value: string;
  /** La etiqueta visible de la opción. */
  label: string;
}

/**
 * Propiedades para el componente Select.
 */
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Lista de opciones a mostrar. */
  options: SelectOption[];
  /** Texto que se muestra cuando no hay una opción seleccionada. */
  placeholder?: string;
  /** Función que se llama cuando el valor cambia. */
  onChangeValue?: (value: string) => void;
  /** Acción opcional para agregar un nuevo valor desde el selector. */
  onAddNew?: () => void;
  /** Etiqueta opcional para la acción de agregar nuevo. */
  addNewLabel?: string;
  /** Indica si hay un error en la validación. */
  error?: boolean;
  /** Indica si los datos están cargando. */
  isLoading?: boolean;
  /** Mensaje de ayuda o error que aparece debajo del select. */
  hint?: string;
}

/**
 * Componente de selección (Dropdown) estandarizado.
 * Proporciona una interfaz consistente para selecciones de una sola opción con soporte para estados de carga y error.
 * 
 * @component
 * @example
 * ```tsx
 * <Select 
 *   options={[{ value: '1', label: 'Opción 1' }]} 
 *   onChangeValue={(val) => console.log(val)} 
 *   placeholder="Selecciona..."
 * />
 * ```
 */
const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  id,
  options,
  placeholder = "Seleccione una opción",
  onChangeValue,
  onChange,
  className = "",
  defaultValue = "",
  value,
  disabled = false,
  onBlur,
  error = false,
  isLoading = false,
  hint,
  onAddNew,
  addNewLabel,
  ...props
}, ref) => {
  const ADD_NEW_SENTINEL = "__ADD_NEW__";
  // Sincronizar estado si el valor o el valor por defecto cambian
  const [selectedValue, setSelectedValue] = useState<string>(
    value !== undefined ? String(value) : String(defaultValue)
  );

  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(String(value));
    }
  }, [value]);

  useEffect(() => {
    if (value === undefined && defaultValue !== undefined) {
      setSelectedValue(String(defaultValue));
    }
  }, [defaultValue, value]);

  /**
   * Maneja el cambio interno del select.
   * @param e - Evento de cambio del elemento select.
   */
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    if (onAddNew && newValue === ADD_NEW_SENTINEL) {
      // Volver al placeholder y disparar la acción de agregar nuevo
      setSelectedValue("");
      onAddNew();
      // No propagar cambio de valor normal
      return;
    }
    setSelectedValue(newValue);

    // Llamar a ambos manejadores si existen
    if (onChangeValue) onChangeValue(newValue);
    if (onChange) onChange(e);
  };

  return (
    <div className="relative w-full">
      <select
        {...props}
        ref={ref}
        id={id}
        disabled={disabled || isLoading}
        className={cn(
          "h-11 w-full appearance-none rounded-lg border bg-transparent px-4 py-2.5 pr-11 text-sm shadow-theme-xs",
          "placeholder:text-text-tertiary focus:outline-none focus:ring-3 focus:ring-brand-500/10",
          "disabled:bg-gray-100 disabled:opacity-70 disabled:cursor-not-allowed dark:disabled:bg-white/5",
          // Estados de error vs normal
          error
            ? "border-error-500 focus:border-error-500 focus:ring-error-500/10 dark:border-error-800"
            : "border-border-medium focus:border-brand-300 dark:border-border-dark dark:focus:border-brand-800",
          // Color de texto según selección
          selectedValue
            ? "text-text-primary dark:text-text-emphasis"
            : "text-text-tertiary dark:text-text-tertiary",
          className
        )}
        value={selectedValue}
        onChange={handleChange}
        onBlur={onBlur}
      >
        {/* Opción de marcador de posición */}
        <option
          value=""
          className="text-text-secondary dark:bg-bg-dark dark:text-text-tertiary"
        >
          {placeholder}
        </option>
        {onAddNew && (
          <option
            value={ADD_NEW_SENTINEL}
            className="text-brand-600 bg-brand-50 dark:bg-brand-900/20 dark:text-brand-400"
          >
            {`➕ ${addNewLabel || "Agregar nuevo"}`}
          </option>
        )}

        {/* Mapeo de opciones */}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="text-text-secondary dark:bg-bg-dark dark:text-text-tertiary"
          >
            {option.label}
          </option>
        ))}
      </select>

      {/* Icono de flecha o cargador */}
      <span className="absolute top-1/2 right-4 -translate-y-1/2 pointer-events-none text-text-tertiary dark:text-text-tertiary">
        {isLoading ? (
          <svg
            className="h-4 w-4 animate-spin text-brand-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
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
          <ChevronDownIcon className="h-4 w-4" />
        )}
      </span>

      {hint && (
        <p
          id={`${id}-hint`}
          className={cn(
            "mt-1.5 text-xs font-medium",
            error ? "text-error-500 dark:text-error-400" : "text-text-tertiary"
          )}
        >
          {hint}
        </p>
      )}
    </div>
  );
});

Select.displayName = "Select";

export default Select;
