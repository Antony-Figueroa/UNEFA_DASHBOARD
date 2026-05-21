/**
 * @file CustomSelect.tsx
 * @description Componente de selección (Dropdown) personalizado y altamente personalizable.
 * Resuelve problemas de visualización en modales mediante el uso de Portals y posicionamiento dinámico.
 */

import { useState, useEffect, useRef, forwardRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { Tooltip } from "../ui/tooltip/Tooltip";
import { cn } from "../../utils/cn";
import { matchSearch } from "../../utils/searchNormalizer";
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
  /** Acción opcional para agregar un nuevo valor desde el selector. */
  onAddNew?: () => void;
  /** Etiqueta opcional para la acción de agregar nuevo. */
  addNewLabel?: string;
  /** Habilita la búsqueda en el dropdown */
  searchable?: boolean;
  /** Placeholder para el input de búsqueda */
  searchPlaceholder?: string;
  /** Mensaje opcional de ayuda o error que se muestra debajo del componente. */
  hint?: string;
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
  onAddNew,
  addNewLabel,
  searchable,
  searchPlaceholder = "Buscar...",
  hint,
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string>(value !== undefined ? value : defaultValue);
  const [searchTerm, setSearchTerm] = useState("");

  /** 
   * Estado para almacenar las coordenadas y dimensiones del input.
   * Se usa para posicionar el menú desplegable (Portal) exactamente debajo o arriba del botón.
   */
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0, position: 'bottom' as 'bottom' | 'top' });
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Habilitar búsqueda automáticamente si hay más de 3 opciones o si se pasa explícitamente
  const isSearchable = searchable === true || (searchable === undefined && options.length > 3);

  // Filtrar opciones usando el normalizador compartido del sistema
  const filteredOptions = useMemo(() => {
    if (!isSearchable || !searchTerm.trim()) {
      return options;
    }
    return options.filter(option => 
      matchSearch(option.label, searchTerm) || 
      matchSearch(option.value, searchTerm)
    );
  }, [options, searchTerm, isSearchable]);

  // Efecto para enfocar el input de búsqueda cuando se abre el menú
  useEffect(() => {
    if (isOpen && isSearchable && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    if (isOpen && isSearchable) {
      setSearchTerm("");
    }
  }, [isOpen, isSearchable]);

  /**
   * Actualiza la posición del menú desplegable basándose en la posición actual del contenedor en el viewport.
   * Detecta si hay espacio suficiente abajo, si no, muestra el menú arriba.
   * Esto asegura que el menú "siga" al input si este se desplaza (ej. scroll en el modal).
   */
  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const hasSearchInput = isSearchable ? 52 : 0; // Altura del input de búsqueda
      const menuEstimatedHeight = Math.min(filteredOptions.length * 40 + (onAddNew ? 50 : 0) + hasSearchInput, 320); // 320px max-height con búsqueda
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // Si no hay suficiente espacio abajo pero sí arriba, mostrar arriba
      const shouldShowAbove = spaceBelow < menuEstimatedHeight && spaceAbove > menuEstimatedHeight;
      
      setCoords({
        top: shouldShowAbove ? rect.top : rect.bottom,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        position: shouldShowAbove ? 'top' : 'bottom'
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

  // Calcular la altura máxima disponible para el menú
  const getMaxHeight = () => {
    const searchInputHeight = searchable && options.length > 5 ? 80 : 0;
    const maxMenuHeight = 320 + searchInputHeight;
    if (coords.position === 'top') {
      return Math.min(maxMenuHeight, coords.top - 20); // 20px de margen
    } else {
      return Math.min(maxMenuHeight, window.innerHeight - coords.top - 20);
    }
  };

  /**
   * Contenido del menú desplegable. Se define por separado para ser usado con createPortal.
   */
  const renderMenu = () => {
    if (!isOpen || disabled) return null;

    const maxHeight = getMaxHeight();
    const showSearch = searchable && options.length > 3;

    return (
      <ul
        className="w-full overflow-auto rounded-xl border border-border-light bg-white py-1.5 shadow-theme-lg outline-none dark:border-border-dark dark:bg-bg-dark"
        role="listbox"
        style={{
          maxHeight: `${maxHeight}px`,
          width: coords.width,
          minWidth: '120px'
        }}
      >
        {/* Input de búsqueda */}
        {showSearch && (
          <li className="sticky top-0 z-10 bg-white dark:bg-bg-dark border-b border-border-light dark:border-border-dark px-2 py-2">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full h-9 pl-9 pr-3 text-sm border border-border-medium rounded-lg bg-gray-50 dark:bg-gray-800 text-text-primary dark:text-text-emphasis placeholder:text-text-tertiary focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-border-dark"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchTerm && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchTerm("");
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {searchTerm && (
              <p className="text-xs text-text-tertiary mt-1.5 px-1">
                {filteredOptions.length} resultado{filteredOptions.length !== 1 ? 's' : ''} de "{searchTerm}"
              </p>
            )}
          </li>
        )}
        {onAddNew && (
          <li className="sticky top-0 z-10 bg-white dark:bg-bg-dark border-b border-border-light dark:border-border-dark">
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
          </li>
        )}
        {filteredOptions.length > 0 ? (
          filteredOptions.map((option) => {
            const isOptionDisabled = option.disabled;
            const optionContent = (
              <li
                key={option.value}
                onClick={() => handleSelect(option)}
                aria-disabled={isOptionDisabled}
                role="option"
                aria-selected={selectedValue === option.value}
                className={cn(
                  "relative cursor-pointer select-none px-4 py-2 text-sm",
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
          <li className="px-4 py-6 text-sm text-text-tertiary text-center">
            {searchTerm ? (
              <div className="flex flex-col items-center gap-2">
                <svg className="w-8 h-8 text-text-tertiary opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>No se encontraron resultados</span>
                <span className="text-xs opacity-75">para "{searchTerm}"</span>
              </div>
            ) : (
              "No hay opciones"
            )}
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
          "h-11 w-full flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm outline-none",
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
            "h-4 w-4 text-text-tertiary",
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
            top: coords.position === 'top' ? coords.top - 4 : coords.top + 4,
            left: coords.left,
            width: coords.width,
            zIndex: 9999,
            transform: coords.position === 'top' ? 'translateY(-100%)' : 'none',
            transformOrigin: coords.position === 'top' ? 'bottom' : 'top',
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
