import React from "react";
import { Link } from "react-router";
import { cn } from "../../../utils/cn";

/**
 * Propiedades para el componente DropdownItem.
 */
export interface DropdownItemProps {
  /** La etiqueta HTML a utilizar. Por defecto es "button". */
  tag?: "a" | "button";
  /** La URL de destino si el tag es "a". */
  to?: string;
  /** Manejador de clic principal. */
  onClick?: () => void;
  /** Manejador de clic secundario (ej. para cerrar el dropdown). */
  onItemClick?: () => void;
  /** Clases CSS adicionales. */
  className?: string;
  /** Variante visual del elemento. */
  variant?: "default" | "view" | "edit" | "delete" | "restore" | "info";
  /** Contenido del elemento. */
  children: React.ReactNode;
  /** Icono opcional al inicio. */
  icon?: React.ReactNode;
  /** Etiqueta de accesibilidad. */
  "aria-label"?: string;
}

const VARIANT_STYLES: Record<string, string> = {
  view: "text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20",
  edit: "text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20",
  delete: "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20",
  restore: "text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20",
  info: "text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/20",
  default: "text-text-secondary hover:bg-bg-secondary dark:text-text-tertiary dark:hover:bg-white/5",
};

/**
 * Componente de elemento individual para el menú Dropdown.
 * Soporta diferentes variantes visuales y puede renderizarse como enlace o botón.
 * 
 * @component
 * @example
 * ```tsx
 * <DropdownItem variant="edit" onClick={handleEdit} icon={<EditIcon />}>
 *   Editar
 * </DropdownItem>
 * ```
 */
export const DropdownItem: React.FC<DropdownItemProps> = ({
  tag = "button",
  to,
  onClick,
  onItemClick,
  className = "",
  variant = "default",
  children,
  icon,
  "aria-label": ariaLabel,
}) => {
  const handleClick = (event: React.MouseEvent) => {
    if (tag === "button") {
      event.preventDefault();
    }
    onClick?.();
    onItemClick?.();
  };

  const itemClasses = cn(
    "flex w-full items-center gap-2.5 px-4 py-2 text-sm font-medium transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg",
    VARIANT_STYLES[variant] || VARIANT_STYLES.default,
    className
  );

  const content = (
    <>
      {icon && <span className="flex shrink-0 items-center opacity-80">{icon}</span>}
      <span className="flex-1 text-left">{children}</span>
    </>
  );

  if (tag === "a" && to) {
    return (
      <Link 
        to={to} 
        className={itemClasses} 
        onClick={handleClick}
        role="menuitem"
        aria-label={ariaLabel}
      >
        {content}
      </Link>
    );
  }

  return (
    <button 
      onClick={handleClick} 
      className={itemClasses}
      role="menuitem"
      aria-label={ariaLabel}
      type="button"
    >
      {content}
    </button>
  );
};
