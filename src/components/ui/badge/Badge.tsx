import React from "react";
import { cn } from "../../../utils/cn";

/** Variantes visuales del Badge. */
export type BadgeVariant = "light" | "solid" | "outline";
/** Tamaños disponibles del Badge. */
export type BadgeSize = "sm" | "md";
/** Formas del Badge: full (completamente redondeado) o rounded (bordes redondeados). */
export type BadgeShape = "full" | "rounded";
/** Colores temáticos para el Badge. */
export type BadgeColor =
  | "primary"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "light"
  | "dark";

/**
 * Propiedades para el componente Badge.
 */
export interface BadgeProps {
  /** Variante visual: light (fondo claro), solid (fondo sólido), u outline (borde). */
  variant?: BadgeVariant;
  /** Tamaño del badge: sm (pequeño) o md (mediano). */
  size?: BadgeSize;
  /** Forma del badge: full (píldora) o rounded (esquinas redondeadas). */
  shape?: BadgeShape;
  /** Color temático del badge. */
  color?: BadgeColor;
  /** Icono opcional al inicio. */
  startIcon?: React.ReactNode;
  /** Icono opcional al final. */
  endIcon?: React.ReactNode;
  /** Contenido del badge. */
  children: React.ReactNode;
  /** Clases CSS adicionales. */
  className?: string;
}

/**
 * Componente Badge para mostrar estados, etiquetas o contadores.
 * Soporta múltiples variantes, tamaños, formas y colores.
 * 
 * @component
 * @example
 * ```tsx
 * <Badge color="success" variant="solid">Activo</Badge>
 * <Badge startIcon={<InfoIcon />} color="primary">Mensaje</Badge>
 * ```
 */
const Badge: React.FC<BadgeProps> = ({
  variant = "light",
  color = "primary",
  size = "md",
  shape = "full",
  startIcon,
  endIcon,
  children,
  className = "",
}) => {
  // Estilos de tamaño
  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-3 py-1 text-xs",
  };

  // Estilos de forma
  const shapeStyles = {
    full: "rounded-full",
    rounded: "rounded-lg border",
  };

  // Estilos de color por variante
  const variants = {
    light: {
      primary: "bg-brand-50 text-brand-500 border-brand-200 dark:bg-brand-950 dark:text-brand-400 dark:border-brand-700",
      success: "bg-success-50 text-success-600 border-success-200 dark:bg-success-950 dark:text-success-500 dark:border-success-700",
      error: "bg-error-50 text-error-600 border-error-200 dark:bg-error-950 dark:text-error-500 dark:border-error-700",
      warning: "bg-warning-50 text-warning-600 border-warning-200 dark:bg-warning-950 dark:text-orange-400 dark:border-warning-700",
      info: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-700",
      light: "bg-bg-secondary text-text-primary border-border-light dark:bg-white/3 dark:text-text-tertiary dark:border-border-dark",
      dark: "bg-text-secondary text-white border-border-medium dark:bg-bg-dark dark:text-white dark:border-white/10",
    },
    solid: {
      primary: "bg-brand-500 text-white border-transparent dark:text-white",
      success: "bg-success-500 text-white border-transparent dark:text-white",
      error: "bg-error-500 text-white border-transparent dark:text-white",
      warning: "bg-warning-500 text-white border-transparent dark:text-white",
      info: "bg-blue-600 text-white border-transparent dark:text-white",
      light: "bg-bg-secondary border-transparent text-text-primary dark:bg-white/3 dark:text-text-tertiary",
      dark: "bg-bg-dark text-white border-transparent dark:text-white",
    },
    outline: {
      primary: "bg-transparent text-brand-500 border-brand-500 dark:text-brand-400 dark:border-brand-400",
      success: "bg-transparent text-success-600 border-success-600 dark:text-success-500 dark:border-success-500",
      error: "bg-transparent text-error-600 border-error-600 dark:text-error-500 dark:border-error-500",
      warning: "bg-transparent text-warning-600 border-warning-600 dark:text-orange-400 dark:border-orange-400",
      info: "bg-transparent text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400",
      light: "bg-transparent text-text-primary border-border-medium dark:text-text-tertiary dark:border-border-dark",
      dark: "bg-transparent text-text-primary border-border-dark dark:text-text-emphasis dark:border-border-dark",
    },
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors duration-200",
        sizeStyles[size],
        shapeStyles[shape],
        variants[variant][color],
        className
      )}
    >
      {startIcon && <span className="mr-1.5 flex shrink-0 items-center">{startIcon}</span>}
      {children}
      {endIcon && <span className="ml-1.5 flex shrink-0 items-center">{endIcon}</span>}
    </span>
  );
};

export default Badge;
