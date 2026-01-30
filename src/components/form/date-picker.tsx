import { useEffect, forwardRef } from "react";
import flatpickr from "flatpickr";
import { Spanish } from "flatpickr/dist/l10n/es.js";
import "flatpickr/dist/flatpickr.css";
import Label from "./Label";
import { cn } from "../../utils/cn";
import { CalendarDays } from "lucide-react";
import "flatpickr/dist/themes/light.css";
import Hook = flatpickr.Options.Hook;
import DateOption = flatpickr.Options.DateOption;

/**
 * Propiedades para el componente DatePicker.
 */
export interface DatePickerProps {
  /** Identificador único para el input. */
  id: string;
  /** Modo de selección: fecha única, múltiple, rango o hora. */
  mode?: "single" | "multiple" | "range" | "time";
  /** Función que se llama cuando cambia la fecha. */
  onChange?: Hook | Hook[];
  /** Fecha seleccionada por defecto. */
  defaultDate?: DateOption;
  /** Etiqueta descriptiva para el campo. */
  label?: string;
  /** Texto de marcador de posición. */
  placeholder?: string;
  /** Clases adicionales para personalizar el contenedor. */
  className?: string;
  /** Indica si el campo está desactivado. */
  disabled?: boolean;
}

/**
 * Componente de selección de fecha (DatePicker) basado en Flatpickr.
 * Proporciona una interfaz amigable para seleccionar fechas con soporte para diferentes modos y localización en español.
 * 
 * @component
 * @example
 * ```tsx
 * <DatePicker 
 *   id="nacimiento" 
 *   label="Fecha de Nacimiento" 
 *   onChange={(date) => console.log(date)} 
 * />
 * ```
 */
const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(({
  id,
  mode = "single",
  onChange,
  label,
  defaultDate,
  placeholder = "Seleccionar fecha",
  className = "",
  disabled = false,
}, ref) => {
  useEffect(() => {
    // Inicializar flatpickr en el elemento con el ID proporcionado
    const fpInstance = flatpickr(`#${id}`, {
      locale: Spanish,
      mode: mode,
      static: true,
      monthSelectorType: "static",
      dateFormat: "d/m/Y",
      defaultDate,
      onChange,
      // Desactivar si el componente está deshabilitado
      clickOpens: !disabled,
    });

    // Limpieza al desmontar el componente
    return () => {
      if (fpInstance) {
        if (Array.isArray(fpInstance)) {
          fpInstance.forEach(instance => instance.destroy());
        } else {
          fpInstance.destroy();
        }
      }
    };
  }, [mode, onChange, id, defaultDate, disabled]);

  return (
    <div className={cn("w-full", className)}>
      {label && <Label htmlFor={id}>{label}</Label>}

      <div className="relative">
        <input
          id={id}
          ref={ref}
          placeholder={placeholder}
          disabled={disabled}
          readOnly // Flatpickr maneja la entrada, evitamos escritura directa
          className={cn(
            "h-11 w-full appearance-none rounded-lg border bg-transparent px-4 py-2.5 pr-11 text-sm shadow-theme-xs transition-all",
            "placeholder:text-text-tertiary focus:outline-none focus:ring-3",
            "text-text-primary border-border-medium focus:border-brand-300 focus:ring-brand-500/10",
            "dark:bg-bg-dark dark:text-text-emphasis dark:border-border-dark dark:focus:border-brand-800",
            disabled && "opacity-50 cursor-not-allowed bg-bg-secondary dark:bg-white/5"
          )}
        />

        <span className="absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none text-text-tertiary dark:text-text-tertiary">
          <CalendarDays className="w-5 h-5" />
        </span>
      </div>
    </div>
  );
});

DatePicker.displayName = "DatePicker";

export default DatePicker;
