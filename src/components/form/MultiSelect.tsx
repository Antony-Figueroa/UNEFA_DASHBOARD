import type React from "react";
import { useState, useEffect, useRef, forwardRef } from "react";
import { Tooltip } from "../ui/tooltip/Tooltip";
import { cn } from "../../utils/cn";
import { X, ChevronDown, AlertCircle } from "lucide-react";

/**
 * Interfaz para las opciones del componente MultiSelect.
 */
export interface MultiSelectOption {
  /** El valor interno de la opción. */
  value: string;
  /** La etiqueta visible de la opción. */
  text: string;
}

/**
 * Propiedades para el componente MultiSelect.
 */
export interface MultiSelectProps {
  /** La etiqueta descriptiva del campo. */
  label: string;
  /** Lista de opciones disponibles para seleccionar. */
  options: MultiSelectOption[];
  /** Valores seleccionados por defecto (no controlado). */
  defaultSelected?: string[];
  /** Valores seleccionados actualmente (controlado). */
  value?: string[];
  /** Función que se llama cuando cambia la selección. */
  onChange?: (selected: string[]) => void;
  /** Indica si el componente está desactivado. */
  disabled?: boolean;
  /** Texto que se muestra cuando no hay nada seleccionado. */
  placeholder?: string;
  /** Texto informativo que se muestra en un tooltip junto al label. */
  infoTooltip?: string;
  /** Clases adicionales para personalizar el contenedor. */
  className?: string;
}

/**
 * Componente de selección múltiple (MultiSelect) estandarizado.
 * Permite seleccionar varias opciones de una lista con etiquetas visuales y soporte para teclado.
 * 
 * @component
 * @example
 * ```tsx
 * <MultiSelect 
 *   label="Etiquetas" 
 *   options={[{ value: '1', text: 'React' }, { value: '2', text: 'Vite' }]} 
 *   onChange={(vals) => console.log(vals)} 
 * />
 * ```
 */
const MultiSelect = forwardRef<HTMLDivElement, MultiSelectProps>(({
  label,
  options,
  defaultSelected = [],
  value,
  onChange,
  disabled = false,
  placeholder = "Seleccionar opciones",
  infoTooltip,
  className = "",
}, ref) => {
  const isControlled = value !== undefined;
  const [internalSelected, setInternalSelected] = useState<string[]>(defaultSelected);
  const selectedOptions = isControlled ? value : internalSelected;
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Manejar clics fuera del componente para cerrar el menú
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  /**
   * Actualiza la selección interna y notifica el cambio.
   * @param newSelected - Lista de nuevos valores seleccionados.
   */
  const updateSelection = (newSelected: string[]) => {
    if (!isControlled) setInternalSelected(newSelected);
    onChange?.(newSelected);
  };

  /**
   * Alterna la visibilidad del menú desplegable.
   */
  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen((prev) => !prev);
      setFocusedIndex(-1);
    }
  };

  /**
   * Maneja la selección o deselección de una opción.
   * @param optionValue - El valor de la opción a alternar.
   */
  const handleSelect = (optionValue: string) => {
    const newSelected = selectedOptions.includes(optionValue)
      ? selectedOptions.filter((v) => v !== optionValue)
      : [...selectedOptions, optionValue];
    updateSelection(newSelected);
  };

  /**
   * Elimina una opción específica de la selección.
   * @param optionValue - El valor de la opción a eliminar.
   */
  const removeOption = (optionValue: string) => {
    updateSelection(selectedOptions.filter((v) => v !== optionValue));
  };

  /**
   * Maneja la navegación por teclado.
   * @param e - Evento de teclado.
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case "Enter":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else if (focusedIndex >= 0) {
          handleSelect(options[focusedIndex].value);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (isOpen) {
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
        }
        break;
    }
  };

  return (
    <div className={cn("w-full", className)} ref={(node) => {
      // Sincronizar con el ref interno para la lógica de click-outside
      (dropdownRef as any).current = node;
      // Sincronizar con el ref de forwardRef
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        (ref as any).current = node;
      }
    }}>
      {/* Label e Info Tooltip */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <label
          className="block text-sm font-medium text-text-secondary dark:text-text-tertiary"
          id={`${label}-label`}
        >
          {label}
        </label>
        {infoTooltip && (
          <Tooltip content={infoTooltip}>
            <span className="cursor-help text-warning-500">
              <AlertCircle className="w-4 h-4" />
            </span>
          </Tooltip>
        )}
      </div>

      <div className="relative z-40 inline-block w-full">
        <div className="relative flex flex-col items-center">
          <div
            onClick={toggleDropdown}
            onKeyDown={handleKeyDown}
            className="w-full"
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-labelledby={`${label}-label`}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : 0}
          >
            <div
              className={cn(
                "mb-2 flex min-h-[44px] w-full rounded-lg border border-border-medium py-1.5 px-3 shadow-theme-xs outline-none transition-all focus-within:border-brand-300 focus-within:shadow-focus-ring dark:border-border-dark dark:bg-bg-dark dark:focus-within:border-brand-300",
                disabled ? "opacity-50 cursor-not-allowed bg-bg-secondary dark:bg-white/5" : "cursor-pointer"
              )}
            >
              <div className="flex flex-wrap flex-auto gap-2">
                {selectedOptions.length > 0 ? (
                  selectedOptions.map((val) => {
                    const option = options.find((opt) => opt.value === val);
                    const text = option?.text || val;
                    return (
                      <div
                        key={val}
                        className="group flex items-center justify-center rounded-full border border-transparent bg-bg-secondary py-1 px-3 text-xs font-medium text-text-primary hover:border-border-light dark:bg-white/10 dark:text-text-emphasis dark:hover:border-border-dark transition-all"
                      >
                        <span className="flex-initial max-w-full">{text}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!disabled) removeOption(val);
                          }}
                          disabled={disabled}
                          className="ml-1.5 text-text-tertiary hover:text-text-secondary dark:text-text-tertiary transition-colors"
                          aria-label={`Eliminar ${text}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="w-full h-full p-1 text-sm text-text-tertiary dark:text-text-tertiary pointer-events-none">
                    {placeholder}
                  </div>
                )}
              </div>
              
              {/* Icono de estado */}
              <div className="flex items-center self-center pl-2">
                <ChevronDown 
                  className={cn(
                    "w-4 h-4 text-text-tertiary transition-transform duration-200",
                    isOpen && "rotate-180"
                  )} 
                />
              </div>
            </div>
          </div>

          {/* Menú Desplegable */}
          {isOpen && (
            <div
              className="absolute left-0 z-50 w-full mt-1 overflow-y-auto bg-bg-main rounded-lg shadow-xl top-full max-h-60 dark:bg-bg-dark border border-border-light dark:border-border-dark animate-in fade-in zoom-in-95 duration-100"
              onClick={(e) => e.stopPropagation()}
              role="listbox"
              aria-label={label}
            >
              {options.length > 0 ? (
                options.map((option, index) => {
                  const isSelected = selectedOptions.includes(option.value);
                  const isFocused = index === focusedIndex;

                  return (
                    <div
                      key={option.value}
                      className={cn(
                        "w-full cursor-pointer border-b border-border-light dark:border-border-dark last:border-0 transition-colors",
                        "hover:bg-brand-50/50 dark:hover:bg-brand-500/10",
                        isFocused && "bg-brand-50/50 dark:bg-brand-500/10",
                        isSelected && "bg-brand-50 dark:bg-brand-500/20"
                      )}
                      onClick={() => handleSelect(option.value)}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <div className="flex w-full items-center p-3">
                        <div className={cn(
                          "text-sm text-text-primary dark:text-text-emphasis",
                          isSelected && "font-semibold text-brand-600 dark:text-brand-400"
                        )}>
                          {option.text}
                        </div>
                        {isSelected && (
                          <div className="ml-auto text-brand-600 dark:text-brand-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-sm text-center text-text-tertiary">
                  No hay opciones disponibles
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

MultiSelect.displayName = "MultiSelect";

export default MultiSelect;
