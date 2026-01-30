import { useState, useEffect, useRef, forwardRef } from "react";
import { Tooltip } from "../ui/tooltip/Tooltip";
import { cn } from "../../utils/cn";
import { ChevronDown } from "lucide-react";

/**
 * Interfaz para las opciones del componente CustomSelect.
 */
export interface CustomSelectOption {
  /** El valor interno de la opción. */
  value: string;
  /** La etiqueta visible de la opción. */
  label: string;
  /** Indica si la opción está desactivada. */
  disabled?: boolean;
  /** Motivo opcional por el cual la opción está desactivada (se muestra en tooltip). */
  disabledReason?: string;
}

/**
 * Propiedades para el componente CustomSelect.
 */
export interface CustomSelectProps {
  /** Identificador único para el botón. */
  id?: string;
  /** Lista de opciones a mostrar. */
  options: CustomSelectOption[];
  /** Texto que se muestra cuando no hay una opción seleccionada. */
  placeholder?: string;
  /** Función que se llama cuando el valor cambia. */
  onChange: (value: string) => void;
  /** Clases adicionales para personalizar el estilo. */
  className?: string;
  /** Valor seleccionado por defecto. */
  defaultValue?: string;
  /** Valor seleccionado actualmente (controlado). */
  value?: string;
  /** Indica si el componente está desactivado. */
  disabled?: boolean;
  /** Función que se llama cuando el componente pierde el foco. */
  onBlur?: () => void;
  /** Indica si hay un error en la validación. */
  error?: boolean;
}

/**
 * Componente de selección (Dropdown) personalizado y accesible.
 * A diferencia del Select estándar, este utiliza elementos personalizados para mayor control visual y soporte para tooltips en opciones desactivadas.
 * 
 * @component
 * @example
 * ```tsx
 * <CustomSelect 
 *   options={[{ value: '1', label: 'Activo' }, { value: '2', label: 'Inactivo', disabled: true, disabledReason: 'No disponible' }]} 
 *   onChange={(val) => console.log(val)} 
 * />
 * ```
 */
const CustomSelect = forwardRef<HTMLDivElement, CustomSelectProps>(({
  id,
  options,
  placeholder = "Seleccione una opción",
  onChange,
  className = "",
  defaultValue = "",
  value,
  disabled = false,
  onBlur,
  error = false,
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string>(value !== undefined ? value : defaultValue);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sincronizar estado si el valor externo cambia
  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  // Manejar clics fuera del componente para cerrar el menú
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (isOpen) {
          setIsOpen(false);
          if (onBlur) onBlur();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onBlur]);

  /**
   * Maneja la selección de una opción.
   * @param option - La opción seleccionada.
   */
  const handleSelect = (option: CustomSelectOption) => {
    if (option.disabled || disabled) return;
    
    setSelectedValue(option.value);
    onChange(option.value);
    setIsOpen(false);
  };

  const selectedOption = options.find((opt) => opt.value === selectedValue);

  return (
    <div
      id={id}
      ref={(node) => {
        containerRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      className={cn("relative w-full", className)}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-disabled={disabled}
        className={cn(
          "h-11 w-full flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition-all duration-200 outline-none",
          disabled 
            ? "cursor-not-allowed bg-gray-100 opacity-50 border-border-medium dark:bg-bg-dark/50 dark:text-text-tertiary" 
            : error
              ? "border-error-500 focus:ring-error-500/10 dark:border-error-800"
              : isOpen 
                ? "border-brand-500 ring-4 ring-brand-500/10 dark:border-brand-400" 
                : "border-border-medium bg-transparent hover:border-brand-300 focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 dark:border-border-dark dark:bg-bg-dark",
          selectedValue ? "text-text-primary dark:text-text-emphasis" : "text-text-tertiary"
        )}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          className={cn(
            "h-4 w-4 text-text-tertiary transition-transform duration-300 ease-in-out",
            isOpen && "rotate-180 text-brand-500"
          )} 
        />
      </button>

      {/* Menú Desplegable */}
      {isOpen && !disabled && (
        <ul
          className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-border-light bg-white py-1.5 shadow-theme-lg outline-none dark:border-border-dark dark:bg-bg-dark animate-in fade-in zoom-in-95 duration-200"
          role="listbox"
        >
          {options.length > 0 ? (
            options.map((option) => {
              const isOptionDisabled = option.disabled;
              const optionContent = (
                <li
                  key={option.value}
                  onClick={() => handleSelect(option)}
                  aria-disabled={isOptionDisabled}
                  role="option"
                  aria-selected={selectedValue === option.value}
                  className={cn(
                    "relative cursor-pointer select-none px-4 py-2 text-sm transition-colors",
                    isOptionDisabled
                      ? "cursor-not-allowed bg-bg-secondary text-text-tertiary opacity-50 line-through dark:bg-gray-800/50"
                      : selectedValue === option.value
                        ? "bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400 font-medium"
                        : "text-text-primary hover:bg-gray-50 dark:text-text-emphasis dark:hover:bg-white/5"
                  )}
                >
                  {option.label}
                </li>
              );

              // Si la opción está desactivada y tiene un motivo, mostramos el tooltip
              if (isOptionDisabled && option.disabledReason) {
                return (
                  <Tooltip key={option.value} content={option.disabledReason}>
                    {optionContent}
                  </Tooltip>
                );
              }

              return optionContent;
            })
          ) : (
            <li className="px-4 py-2 text-sm text-text-tertiary text-center">
              No hay opciones
            </li>
          )}
        </ul>
      )}
    </div>
  );
});

CustomSelect.displayName = "CustomSelect";

export default CustomSelect;
