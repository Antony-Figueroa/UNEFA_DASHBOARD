import { useState, forwardRef } from "react";
import { cn } from "../../../utils/cn";

/**
 * Propiedades para el componente Switch.
 */
export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  /** La etiqueta descriptiva del interruptor. */
  label?: string;
  /** El estado inicial del interruptor. */
  defaultChecked?: boolean;
  /** Indica si el interruptor está desactivado. */
  disabled?: boolean;
  /** Función que se llama cuando el estado cambia. */
  onChange?: (checked: boolean) => void;
  /** Esquema de color del interruptor. */
  color?: "blue" | "gray";
}

/**
 * Componente de interruptor (Switch/Toggle) estandarizado.
 * Proporciona una alternativa visual a los checkboxes tradicionales para activar/desactivar opciones.
 * 
 * @component
 * @example
 * ```tsx
 * <Switch 
 *   label="Notificaciones" 
 *   onChange={(checked) => console.log(checked)} 
 * />
 * ```
 */
const Switch = forwardRef<HTMLInputElement, SwitchProps>(({
  label,
  defaultChecked = false,
  disabled = false,
  onChange,
  color = "blue",
  className = "",
  checked: controlledChecked,
  ...props
}, ref) => {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isChecked = controlledChecked !== undefined ? controlledChecked : internalChecked;

  /**
   * Maneja el cambio de estado del interruptor.
   */
  const handleToggle = () => {
    if (disabled) return;
    const newCheckedState = !isChecked;
    if (controlledChecked === undefined) {
      setInternalChecked(newCheckedState);
    }
    if (onChange) {
      onChange(newCheckedState);
    }
  };

  // Colores del interruptor según el tema y estado
  const backgroundClasses = cn(
    "block transition-all duration-200 ease-in-out h-6 w-11 rounded-full relative",
    disabled 
      ? "bg-bg-secondary dark:bg-white/5 cursor-not-allowed" 
      : isChecked
        ? color === "blue" ? "bg-brand-500" : "bg-text-primary dark:bg-white/20"
        : "bg-border-light dark:bg-white/10"
  );

  const knobClasses = cn(
    "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-theme-sm transition-transform duration-200 ease-in-out transform",
    isChecked ? "translate-x-5" : "translate-x-0"
  );

  return (
    <label
      className={cn(
        "flex cursor-pointer select-none items-center gap-3 text-sm font-medium transition-colors",
        disabled ? "text-text-tertiary cursor-not-allowed" : "text-text-secondary dark:text-text-tertiary",
        className
      )}
      onClick={handleToggle}
    >
      <div className="relative">
        <input
          {...props}
          ref={ref}
          type="checkbox"
          className="sr-only"
          checked={isChecked}
          disabled={disabled}
          onChange={() => {}} // Manejado por handleToggle en el label
        />
        <div className={backgroundClasses}>
          <div className={knobClasses} />
        </div>
      </div>
      {label}
    </label>
  );
});

Switch.displayName = "Switch";

export default Switch;
