/**
 * @file CustomSelect.tsx
 * @description Componente de selección (Dropdown) personalizado y altamente personalizable.
 * Resuelve problemas de visualización en modales mediante el uso de Portals y posicionamiento dinámico.
 */

import { useState, useEffect, useRef, forwardRef } from "react";
import { createPortal } from "react-dom";
import { Tooltip } from "../ui/tooltip/Tooltip";
import { cn } from "../../utils/cn";
import { ChevronDownIcon } from "../../icons";

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
 * Componente CustomSelect.
 * 
 * Características clave:
 * 1. **Portals**: El menú desplegable se renderiza en el `document.body` para evitar problemas de `overflow: hidden` o `z-index` en modales.
 * 2. **Posicionamiento Dinámico**: Calcula su posición relativa al viewport y se actualiza al hacer scroll o cambiar el tamaño de la ventana.
 * 3. **Accesibilidad**: Soporta estados de error, deshabilitado y tooltips informativos.
 * 4. **Estética**: Sigue la línea de diseño del proyecto con soporte para modo oscuro.
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

  /** 
   * Estado para almacenar las coordenadas y dimensiones del input.
   * Se usa para posicionar el menú desplegable (Portal) exactamente debajo del botón.
   */
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  /**
   * Actualiza la posición del menú desplegable basándose en la posición actual del contenedor en el viewport.
   * Esto asegura que el menú "siga" al input si este se desplaza (ej. scroll en el modal).
   */
  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom,
        left: rect.left,
        width: rect.width // Usar rect.width en lugar de offsetWidth
      });
    }
  };

  /**
   * Efecto para manejar eventos de scroll y resize globales.
   * El listener de scroll usa `capture: true` para detectar scroll en cualquier contenedor padre (como el modal body).
   */
  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('scroll', updateCoords, true);
      window.addEventListener('resize', updateCoords);
    }
    return () => {
      window.removeEventListener('scroll', updateCoords, true);
      window.removeEventListener('resize', updateCoords);
    };
  }, [isOpen]);

  // Sincronizar estado interno si el valor externo (prop value) cambia
  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  /**
   * Maneja el cierre del menú al hacer clic fuera.
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isOutsideContainer = containerRef.current && !containerRef.current.contains(event.target as Node);
      const isOutsideMenu = menuRef.current && !menuRef.current.contains(event.target as Node);

      if (isOutsideContainer && isOutsideMenu) {
        if (isOpen) {
          setIsOpen(false);
          onBlur?.(); // Disparar onBlur al cerrar el menú por clic fuera
        }
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onBlur]);

  /**
   * Procesa la selección de una opción.
   * @param option - La opción seleccionada.
   */
  const handleSelect = (option: CustomSelectOption) => {
    if (option.disabled || disabled) return;

    setSelectedValue(option.value);
    onChange(option.value);
    setIsOpen(false);
    onBlur?.(); // Notificar pérdida de foco para validaciones (React Hook Form)
  };

  const selectedOption = options.find((opt) => opt.value === selectedValue);

  /**
   * Contenido del menú desplegable. Se define por separado para ser usado con createPortal.
   */
  const renderMenu = () => {
    if (!isOpen || disabled) return null;

    return (
      <ul
        className="max-h-60 w-full overflow-auto rounded-xl border border-border-light bg-white py-1.5 shadow-theme-lg outline-none dark:border-border-dark dark:bg-bg-dark animate-in fade-in zoom-in-95 duration-200"
        role="listbox"
        style={{
          width: coords.width,
          minWidth: '120px' // Asegurar un ancho mínimo para opciones cortas (como notas)
        }}
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
    );
  };

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
        <ChevronDownIcon
          className={cn(
            "h-4 w-4 text-text-tertiary transition-transform duration-300 ease-in-out",
            isOpen && "rotate-180 text-brand-500"
          )}
        />
      </button>

      {/* Menú Desplegable con Portal: se renderiza fuera del DOM local para evitar cortes por overflow */}
      {isOpen && !disabled && containerRef.current && createPortal(
        <div
          ref={menuRef}
          className="fixed"
          style={{
            top: coords.top + 4,
            left: coords.left,
            width: coords.width,
            zIndex: 9999, // Usar zIndex numérico para evitar errores de linter con clases arbitrarias
          }}
        >
          {renderMenu()}
        </div>,
        document.body
      )}
    </div>
  );
});

CustomSelect.displayName = "CustomSelect";

export default CustomSelect;
