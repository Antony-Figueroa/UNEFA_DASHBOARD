import React from "react";
import { cn } from "../../../utils/cn";

/**
 * Propiedades para el componente Loader.
 */
export interface LoaderProps {
  /** Tamaño del cargador: sm (pequeño), md (mediano), lg (grande), xl (extra grande). */
  size?: "sm" | "md" | "lg" | "xl";
  /** Variante de color: primary (marca), white (blanco), gray (gris), success, error. */
  variant?: "primary" | "white" | "gray" | "success" | "error";
  /** Clases CSS adicionales para el contenedor. */
  className?: string;
  /** Etiqueta de accesibilidad para lectores de pantalla. */
  label?: string;
}

/**
 * Componente de carga básico (Spinner) con animación fluida.
 * Utilizado para indicar procesos en curso o esperas cortas.
 * 
 * @component
 * @example
 * ```tsx
 * <Loader size="md" variant="primary" />
 * <Loader size="sm" variant="white" className="mr-2" />
 * ```
 */
export const Loader: React.FC<LoaderProps> = ({
  size = "md",
  variant = "primary",
  className = "",
  label = "Cargando...",
}) => {
  const sizeClasses = {
    sm: "size-4 border-2",
    md: "size-8 border-[3px]",
    lg: "size-12 border-4",
    xl: "size-16 border-[5px]",
  };

  const variantClasses = {
    primary: "border-brand-500 border-t-transparent",
    white: "border-white border-t-transparent",
    gray: "border-text-tertiary border-t-transparent dark:border-white/20 dark:border-t-white",
    success: "border-success-500 border-t-transparent",
    error: "border-error-500 border-t-transparent",
  };

  return (
    <div
      role="status"
      aria-label={label}
      className={cn("flex items-center justify-center shrink-0", className)}
    >
      <div
        className={cn(
          "animate-spin rounded-full transition-all duration-300",
          sizeClasses[size],
          variantClasses[variant]
        )}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
};

/**
 * Propiedades para el FullScreenLoader.
 */
export interface FullScreenLoaderProps extends LoaderProps {
  /** Mensaje opcional a mostrar debajo del cargador. */
  message?: string;
  /** Si es true, oculta el fondo con un desenfoque mayor. */
  blur?: boolean;
}

/**
 * Cargador de pantalla completa con fondo atenuado y desenfoque.
 * Bloquea la interacción del usuario durante transiciones críticas.
 * 
 * @component
 */
export const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({
  message,
  blur = true,
  ...props
}) => {
  return (
    <div className={cn(
      "fixed inset-0 z-99999 flex flex-col items-center justify-center gap-4 bg-bg-main/70 dark:bg-bg-dark/80 animate-in fade-in duration-300",
      blur && "backdrop-blur-md"
    )}>
      <Loader size="lg" {...props} />
      {message && (
        <p className="text-text-secondary dark:text-text-tertiary font-medium animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};

/**
 * Cargador en línea diseñado para botones o textos descriptivos.
 */
export const InlineLoader: React.FC<LoaderProps & { text?: string }> = ({
  text,
  ...props
}) => {
  return (
    <div className="flex items-center gap-2.5">
      <Loader size="sm" {...props} />
      {text && (
        <span className="text-sm font-medium text-text-secondary dark:text-text-tertiary">
          {text}
        </span>
      )}
    </div>
  );
};

export default FullScreenLoader;

