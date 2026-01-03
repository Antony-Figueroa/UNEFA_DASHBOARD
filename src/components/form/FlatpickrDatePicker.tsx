import React from 'react';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import { useTheme } from '../../context/ThemeContext';
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
    dateFormat: 'd/m/Y',
    altInput: true,
    altFormat: 'd/m/Y',
    static: false,
    appendTo: document.body,
    onOpen: (_selectedDates: Date[], _dateStr: string, instance: { calendarContainer: HTMLElement }) => {
      if (colorMode === 'dark' && instance.calendarContainer) {
        instance.calendarContainer.classList.add('dark');
      }
      // Asegurar que el z-index sea mayor que el del modal (z-999999)
      if (instance.calendarContainer) {
        instance.calendarContainer.style.zIndex = "9999999";
      }
    },
    ...options,
  };

  const inputClasses = `h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 transition-all ${disabled
      ? "text-gray-500 border-gray-300 opacity-40 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
      : error
        ? "border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:text-error-400 dark:border-error-500 dark:focus:border-error-800"
        : "bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800"
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
        <CalendarIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
      </span>
    </div>
  );
};

export default FlatpickrDatePicker;
