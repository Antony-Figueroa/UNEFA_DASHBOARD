/**
 * @file MultiSelect.tsx
 * @description Componente de selección múltiple estandarizado con soporte para Portals.
 * Permite la selección de múltiples opciones mediante una interfaz de etiquetas (tags).
 */

import type React from "react";
import { useState, useEffect, useRef, forwardRef } from "react";
import { createPortal } from "react-dom";
import { Tooltip } from "../ui/tooltip/Tooltip";
import { cn } from "../../utils/cn";
import { CloseIcon, ChevronDownIcon, AlertIcon } from "../../icons";

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
  /** Indica si hay un error en la validación. */
  error?: boolean;
  /** Función que se llama cuando el componente pierde el foco. */
  onBlur?: () => void;
  /** Función opcional para agregar un nuevo elemento desde el selector. */
  onAddNew?: () => void;
  /** Etiqueta personalizada para el botón de agregar nuevo. */
  addNewLabel?: string;
}

/**
 * Componente MultiSelect.
 * 
 * Características clave:
 * 1. **Gestión de Selección**: Soporta modo controlado y no controlado.
 * 2. **Visualización de Tags**: Las opciones seleccionadas se muestran como etiquetas removibles dentro del input.
 * 3. **Posicionamiento con Portals**: Al igual que CustomSelect, utiliza Portals y posicionamiento dinámico para evitar cortes visuales en modales.
 * 4. **Accesibilidad**: Incluye soporte para teclado y estados de validación (error).
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
  error = false,
  onBlur,
  onAddNew,
  addNewLabel,
}, ref) => {
  const isControlled = value !== undefined;
  const [internalSelected, setInternalSelected] = useState<string[]>(defaultSelected);
  const selectedOptions = isControlled ? value : internalSelected;
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  /**
   * Estado para el posicionamiento dinámico del menú desplegable.
   * Incluye detección de posición (arriba/abajo) según el espacio disponible.
   */
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0, position: 'bottom' as 'bottom' | 'top' });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  /**
   * Calcula y actualiza las coordenadas del menú basándose en el elemento combobox.
   * Detecta si hay espacio suficiente abajo, si no, muestra el menú arriba.
   * Se ejecuta al abrir y ante cualquier evento de scroll/resize.
   */
  const updateCoords = () => {
    if (dropdownRef.current) {
      const comboRect = dropdownRef.current.querySelector('[role="combobox"]')?.getBoundingClientRect();
      if (comboRect) {
        const menuEstimatedHeight = Math.min(options.length * 40 + (onAddNew ? 50 : 0), 240);
        const spaceBelow = window.innerHeight - comboRect.bottom;
        const spaceAbove = comboRect.top;
        
        // Si no hay suficiente espacio abajo pero sí arriba, mostrar arriba
        const shouldShowAbove = spaceBelow < menuEstimatedHeight && spaceAbove > menuEstimatedHeight;
        
        setCoords({
          top: shouldShowAbove ? comboRect.top : comboRect.bottom,
          left: comboRect.left,
          width: comboRect.width,
          height: comboRect.height,
          position: shouldShowAbove ? 'top' : 'bottom'
        });
      }
    }
  };

  /**
   * Efecto para el seguimiento dinámico de la posición.
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

  /**
   * Maneja clics fuera del componente para cerrar el menú y disparar validaciones.
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(event.target as Node);
      const isOutsideMenu = menuRef.current && !menuRef.current.contains(event.target as Node);

      if (isOutsideDropdown && isOutsideMenu) {
        if (isOpen) {
          setIsOpen(false);
          onBlur?.(); // Disparar onBlur al cerrar el menú por clic fuera
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onBlur]);

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
   * Alterna la selección de una opción.
   */
  const handleSelect = (optionValue: string) => {
    if (disabled) return;

    const newSelected = selectedOptions.includes(optionValue)
      ? selectedOptions.filter((v) => v !== optionValue)
      : [...selectedOptions, optionValue];

    if (!isControlled) {
      setInternalSelected(newSelected);
    }
    onChange?.(newSelected);
  };

  /**
   * Elimina una opción seleccionada desde su tag.
   */
  const handleRemove = (e: React.MouseEvent, optionValue: string) => {
    e.stopPropagation();
    if (disabled) return;

    const newSelected = selectedOptions.filter((v) => v !== optionValue);
    if (!isControlled) {
      setInternalSelected(newSelected);
    }
    onChange?.(newSelected);
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
              <AlertIcon className="w-4 h-4" />
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
                "mb-2 flex min-h-[44px] w-full rounded-lg border py-1.5 px-3 shadow-theme-xs outline-none focus-within:shadow-focus-ring dark:bg-bg-dark",
                error
                  ? "border-error-500 focus-within:border-error-500 focus-within:shadow-error-100/50 dark:border-error-500/50"
                  : "border-border-medium focus-within:border-brand-300 dark:border-border-dark dark:focus-within:border-brand-300",
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
                        className="group flex items-center justify-center rounded-full border border-transparent bg-bg-secondary py-1 px-3 text-xs font-medium text-text-primary hover:border-border-light dark:bg-white/10 dark:text-text-emphasis dark:hover:border-border-dark"
                      >
                        <span className="flex-initial max-w-full">{text}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!disabled) handleRemove(e, val);
                          }}
                          disabled={disabled}
                          className="ml-1.5 text-text-tertiary hover:text-text-secondary dark:text-text-tertiary"
                          aria-label={`Eliminar ${text}`}
                        >
                          <CloseIcon className="w-3.5 h-3.5" />
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
                <ChevronDownIcon
                  className={cn(
                    "w-4 h-4 text-text-tertiary transition-transform duration-200",
                    isOpen && "rotate-180"
                  )}
                />
              </div>
            </div>
          </div>

          {/* Menú Desplegable con Portal */}
          {isOpen && createPortal(
            <div
              ref={menuRef}
              className="fixed overflow-y-auto bg-bg-main rounded-lg shadow-xl dark:bg-bg-dark border border-border-light dark:border-border-dark"
              style={{
                top: coords.position === 'top' ? coords.top - 4 : coords.top + 4,
                left: coords.left,
                width: coords.width,
                zIndex: 9999,
                transform: coords.position === 'top' ? 'translateY(-100%)' : 'none',
                transformOrigin: coords.position === 'top' ? 'bottom' : 'top',
                maxHeight: coords.position === 'top' 
                  ? Math.min(240, coords.top - 20) 
                  : Math.min(240, window.innerHeight - coords.top - 20),
              }}
              onClick={(e) => e.stopPropagation()}
              role="listbox"
              aria-label={label}
            >
              {onAddNew && (
                <div className="sticky top-0 z-10 bg-bg-main dark:bg-bg-dark border-b border-border-light dark:border-border-dark mb-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(false);
                      onAddNew();
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-brand-600 hover:bg-brand-50 font-medium flex items-center gap-2 dark:text-brand-400 dark:hover:bg-brand-900/20"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    {addNewLabel || "Agregar nuevo"}
                  </button>
                </div>
              )}
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
                <div className="p-4 text-center text-sm text-text-tertiary">
                  No hay opciones disponibles
                </div>
              )}
            </div>,
            document.body
          )}
        </div>
      </div>
    </div>
  );
});

MultiSelect.displayName = "MultiSelect";

export default MultiSelect;
