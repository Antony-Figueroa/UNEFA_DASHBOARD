import { forwardRef } from "react";
import FlatpickrDatePicker from "./FlatpickrDatePicker";

/**
 * Propiedades para el componente DatePicker.
 */
export interface DatePickerProps {
  id: string;
  onChange?: (dateStr: string) => void;
  defaultDate?: string;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Componente de selección de fecha (DatePicker) usando Flatpickr para mantener estética
 * pero con comportamiento de input nativo.
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
  return (
    <FlatpickrDatePicker
      id={id}
      ref={ref}
      label={label}
      defaultValue={defaultDate}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
    />
  );
});

DatePicker.displayName = "DatePicker";

export default DatePicker;
