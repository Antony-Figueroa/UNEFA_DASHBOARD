import React from 'react';
import Flatpickr from 'react-flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es';
import 'flatpickr/dist/flatpickr.css';
import { cn } from '../../utils/cn';
import { useTheme } from '../../context/ThemeContext';
import { CalendarIcon } from '../../icons';

/**
 * Propiedades para el componente FlatpickrDatePicker.
 */
export interface FlatpickrDatePickerProps {
  value: string | Date;
  onChange: (date: string) => void;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  onBlur?: () => void;
  options?: Record<string, any>;
  className?: string;
  id?: string;
}

/**
 * Componente de selección de fecha que combina la estética de Flatpickr
 * con un comportamiento de input estándar.
 */
const FlatpickrDatePicker: React.FC<FlatpickrDatePickerProps> = ({
  value,
  onChange,
  onBlur,
  error = false,
  disabled = false,
  className = "",
  id,
  options = {},
  placeholder = "DD/MM/AAAA",
}) => {
  const { colorMode } = useTheme();

  const defaultOptions: Record<string, any> = {
    locale: Spanish,
    dateFormat: 'Y-m-d',
    altInput: true,
    altFormat: 'd/m/Y',
    allowInput: true,
    static: false,
    monthSelectorType: 'static',
    position: 'auto',
    onOpen: (_selectedDates: Date[], _dateStr: string, instance: any) => {
      if (colorMode === 'dark' && instance.calendarContainer) {
        instance.calendarContainer.classList.add('dark');
      }
      if (instance.calendarContainer) {
        instance.calendarContainer.style.zIndex = "10000000";
      }
    },
    ...options,
  };

  return (
    <div className="relative w-full group">
      <Flatpickr
        id={id}
        value={value}
        onChange={(dates) => {
          if (dates.length > 0) {
            const date = dates[0];
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            onChange(`${year}-${month}-${day}`);
          } else {
            onChange("");
          }
        }}
        onBlur={onBlur}
        disabled={disabled}
        options={defaultOptions}
        placeholder={placeholder}
        className={cn(
          "h-11 w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs transition-all outline-none focus:ring-3",
          "bg-transparent pr-10", // Espacio para el icono
          disabled 
            ? "text-text-tertiary border-border-medium opacity-50 bg-bg-secondary cursor-not-allowed dark:bg-white/5 dark:text-text-tertiary dark:border-border-dark"
            : error
              ? "border-error-500 focus:border-error-500 focus:ring-error-500/10 dark:text-error-400 dark:border-error-500 dark:focus:border-error-800"
              : "text-text-primary border-border-medium focus:border-brand-300 focus:ring-brand-500/10 dark:border-border-dark dark:text-text-emphasis dark:focus:border-brand-800",
          className
        )}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary group-focus-within:text-brand-500 transition-colors">
        <CalendarIcon className="size-5" />
      </span>
    </div>
  );
};

export default FlatpickrDatePicker;
