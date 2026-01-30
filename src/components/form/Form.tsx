import { forwardRef } from "react";
import { cn } from "../../utils/cn";

/**
 * Propiedades para el componente Form.
 */
export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  /** Función que se llama cuando se envía el formulario. */
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  /** El contenido del formulario. */
  children: React.ReactNode;
  /** Clases adicionales para personalizar el estilo. */
  className?: string;
}

/**
 * Componente de formulario (Form) estandarizado.
 * Proporciona un contenedor base que maneja automáticamente el preventDefault y aplica estilos consistentes.
 * 
 * @component
 * @example
 * ```tsx
 * <Form onSubmit={(e) => console.log('Enviado')}>
 *   <InputField label="Nombre" />
 *   <Button type="submit">Enviar</Button>
 * </Form>
 * ```
 */
const Form = forwardRef<HTMLFormElement, FormProps>(({ 
  onSubmit, 
  children, 
  className,
  ...props 
}, ref) => {
  /**
   * Maneja el envío del formulario previniendo el comportamiento por defecto del navegador.
   * @param event - Evento de envío del formulario.
   */
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(event);
  };

  return (
    <form
      {...props}
      ref={ref}
      onSubmit={handleSubmit}
      className={cn("space-y-4", className)}
    >
      {children}
    </form>
  );
});

Form.displayName = "Form";

export default Form;
