import React from 'react';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import { Spanish } from 'flatpickr/dist/l10n/es.js';
import { useTheme } from '../../context/theme';
import { cn } from '../../utils/cn';
import { CalendarDays } from "lucide-react";

/**
 * Propiedades para el componente FlatpickrDatePicker.
 */
export interface FlatpickrDatePickerProps {
  /** Valor actual de la fecha (puede ser string, Date o un rango). */
  value: string | Date | [Date, Date];
  /** Función que se llama cuando cambian las fechas seleccionadas. */
  onChange: (dates: Date[]) => void;
  /** Texto que se muestra cuando no hay una fecha seleccionada. */
  placeholder?: string;
  /** Indica si hay un error en la validación. */
  error?: boolean;
  /** Indica si el componente está desactivado. */
  disabled?: boolean;
  /** Función que se llama cuando el componente pierde el foco. */
  onBlur?: () => void;
  /** Opciones adicionales para configurar Flatpickr. */
  options?: Record<string, unknown>;
  /** Clases adicionales para personalizar el estilo. */
  className?: string;
}

/**
 * Componente de selección de fecha avanzado basado en react-flatpickr.
 * Proporciona una interfaz rica para seleccionar fechas y rangos, con soporte para temas y localización.
 * 
 * @component
 * @example
 * ```tsx
 * <FlatpickrDatePicker 
 *   value={new Date()} 
 *   onChange={(dates) => console.log(dates)} 
 * />
 * ```
 */
const FlatpickrDatePicker: React.FC<FlatpickrDatePickerProps> = ({
  value,
  onChange,
  onBlur,
  placeholder = "Selecciona fecha",
  error = false,
  disabled = false,
  options = {},
  className = "",
}) => {
  const { colorMode } = useTheme();

  /**
   * Opciones predeterminadas para Flatpickr.
   */
  const defaultOptions: Record<string, unknown> = {
    locale: Spanish,
    dateFormat: 'Y-m-d',
    altInput: true,
    altFormat: 'd/m/Y',
    static: false,
    monthSelectorType: 'static',
    position: 'above auto', // Forzar posición arriba si hay espacio, sino auto
    /**
     * Se ejecuta al abrir el calendario para aplicar estilos de tema oscuro si es necesario.
     */
    onOpen: (_selectedDates: Date[], _dateStr: string, instance: { calendarContainer: HTMLElement }) => {
      if (colorMode === 'dark' && instance.calendarContainer) {
        instance.calendarContainer.classList.add('dark');
      }
      if (instance.calendarContainer) {
        instance.calendarContainer.style.zIndex = "10000001";
      }
    },
    ...options,
  };

  return (
    <div className="relative w-full">
      <Flatpickr
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        options={defaultOptions}
        placeholder={placeholder}
        className={cn(
          "h-11 w-full rounded-lg border appearance-none px-4 py-2.5 pr-11 text-sm shadow-theme-xs transition-all outline-none focus:ring-3",
          disabled 
            ? "text-text-tertiary border-border-medium opacity-50 bg-bg-secondary cursor-not-allowed dark:bg-white/5 dark:text-text-tertiary dark:border-border-dark"
            : error
              ? "border-error-500 focus:border-error-500 focus:ring-error-500/10 dark:text-error-400 dark:border-error-500 dark:focus:border-error-800"
              : "bg-transparent text-text-primary border-border-medium focus:border-brand-300 focus:ring-brand-500/10 dark:border-border-dark dark:text-text-emphasis dark:focus:border-brand-800",
          className
        )}
      />
      <span className="absolute top-1/2 right-4 -translate-y-1/2 pointer-events-none text-text-tertiary dark:text-text-tertiary">
        <CalendarDays className="h-5 w-5" />
      </span>
    </div>
  );
};

export default FlatpickrDatePicker;
