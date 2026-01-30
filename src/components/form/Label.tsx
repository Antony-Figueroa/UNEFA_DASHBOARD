import { forwardRef } from "react";
import { cn } from "../../utils/cn";

/**
 * Propiedades para el componente Label.
 */
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** El identificador del elemento al que está asociado el label. */
  htmlFor?: string;
  /** El contenido del label. */
  children: React.ReactNode;
  /** Clases adicionales para personalizar el estilo. */
  className?: string;
}

/**
 * Componente de etiqueta (Label) estandarizado para formularios.
 * Proporciona un estilo consistente y soporte para accesibilidad.
 * 
 * @component
 * @example
 * ```tsx
 * <Label htmlFor="email">Correo Electrónico</Label>
 * ```
 */
const Label = forwardRef<HTMLLabelElement, LabelProps>(({ 
  htmlFor, 
  children, 
  className,
  ...props 
}, ref) => {
  return (
    <label
      {...props}
      ref={ref}
      htmlFor={htmlFor}
      className={cn(
        "mb-1.5 block text-sm font-medium text-text-secondary dark:text-text-tertiary transition-colors",
        className
      )}
    >
      {children}
    </label>
  );
});

Label.displayName = "Label";

export default Label;
