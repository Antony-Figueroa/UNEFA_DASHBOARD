import * as React from "react";
import { forwardRef, useEffect } from "react";
import Label from "./Label";
import { cn } from "../../utils/cn";
import flatpickr from "flatpickr";
import { Spanish } from "flatpickr/dist/l10n/es";
import "flatpickr/dist/flatpickr.css";
import { CalendarIcon } from "../../icons";

/**
 * Propiedades para el componente DatePicker.
 */
export interface DatePickerProps {
  id: string;
  onChange?: (dateStr: string) => void;
  defaultDate?: string | Date;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Componente de selección de fecha (DatePicker) basado en Flatpickr
 * con estética personalizada y comportamiento estándar.
 */
const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>((
  {
    id,
    label,
    defaultDate,
    onChange,
    placeholder = "DD/MM/AAAA",
    className = "",
    disabled = false,
  },
  ref
) => {
  useEffect(() => {
    const fpInstance = flatpickr(`#${id}`, {
      locale: Spanish,
      static: false,
      monthSelectorType: "static",
      dateFormat: "Y-m-d",
      altInput: true,
      altFormat: "d/m/Y",
      defaultDate,
      allowInput: true,
      position: "auto",
      onChange: (selectedDates) => {
        if (selectedDates.length > 0 && onChange) {
          const date = selectedDates[0];
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          onChange(`${year}-${month}-${day}`);
        }
      },
      onOpen: (_selectedDates, _dateStr, instance) => {
        if (instance.calendarContainer) {
          instance.calendarContainer.style.zIndex = "10000000";
        }
      }
    });

    return () => {
      fpInstance.destroy();
    };
  }, [id, defaultDate, onChange]);

  return (
    <div className={cn("w-full group", className)}>
      {label && <Label htmlFor={id}>{label}</Label>}

      <div className="relative">
        <input
          id={id}
          ref={ref}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "h-11 w-full rounded-lg border bg-transparent px-4 py-2.5 pr-11 text-sm shadow-theme-xs transition-all",
            "placeholder:text-text-tertiary focus:outline-none focus:ring-3",
            "text-text-primary border-border-medium focus:border-brand-300 focus:ring-brand-500/10",
            "dark:bg-bg-dark dark:text-text-emphasis dark:border-border-dark dark:focus:border-brand-800",
            disabled && "opacity-50 cursor-not-allowed bg-bg-secondary dark:bg-white/5"
          )}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary group-focus-within:text-brand-500 transition-colors">
          <CalendarIcon className="size-5" />
        </span>
      </div>
    </div>
  );
});

DatePicker.displayName = "DatePicker";

export default DatePicker;
