import React from 'react';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import { Spanish } from 'flatpickr/dist/l10n/es.js';
import { useTheme } from '../../context/theme';
import { CalendarIcon } from '../../icons/actions';

interface FlatpickrDatePickerProps {
  value: string | Date | [Date, Date];
  onChange: (dates: Date[]) => void;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  options?: Record<string, unknown>;
  className?: string;
}

const FlatpickrDatePicker: React.FC<FlatpickrDatePickerProps> = ({
  value,
  onChange,
  placeholder = "Selecciona fecha",
  error = false,
  disabled = false,
  options = {},
  className = "",
}) => {
  const { colorMode } = useTheme();

  const defaultOptions: Record<string, unknown> = {
    locale: Spanish,
    dateFormat: 'd/m/Y',
    altInput: true,
    altFormat: 'd/m/Y',
    static: false, // Cambiado a false para que el calendario se renderice en el body (portal)
    monthSelectorType: 'static',
    position: 'above auto', // Forzar posición arriba si hay espacio, sino auto
    onOpen: (_selectedDates: Date[], _dateStr: string, instance: { calendarContainer: HTMLElement }) => {
      if (colorMode === 'dark' && instance.calendarContainer) {
        instance.calendarContainer.classList.add('dark');
      }
      if (instance.calendarContainer) {
        instance.calendarContainer.style.zIndex = "9999999";
      }
    },
    ...options,
  };

  const inputClasses = `h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-text-tertiary focus:outline-hidden focus:ring-3 transition-all ${disabled
      ? "text-text-tertiary border-border-medium opacity-40 bg-bg-secondary cursor-not-allowed dark:bg-white/5 dark:text-text-tertiary dark:border-border-dark"
      : error
        ? "border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:text-error-400 dark:border-error-500 dark:focus:border-error-800"
        : "bg-transparent text-text-primary border-border-medium focus:border-brand-300 focus:ring-brand-500/20 dark:border-border-dark dark:text-text-emphasis dark:focus:border-brand-800"
    } ${className}`;

  return (
    <div className="relative">
      <Flatpickr
        value={value}
        onChange={onChange}
        disabled={disabled}
        options={defaultOptions}
        placeholder={placeholder}
        className={inputClasses}
      />
      <span className="absolute top-1/2 right-4 -translate-y-1/2 pointer-events-none">
        <CalendarIcon className="w-5 h-5 text-text-tertiary dark:text-text-tertiary" />
      </span>
    </div>
  );
};

export default FlatpickrDatePicker;
