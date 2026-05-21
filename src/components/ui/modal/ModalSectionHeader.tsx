/**
 * @file ModalSectionHeader.tsx
 * @description Componente reutilizable para los encabezados de sección dentro de modales.
 * Sigue el patrón: bullet de color + borde inferior + título en uppercase.
 */

import { cn } from "../../../utils/cn";

const BULLET_COLORS: Record<string, string> = {
  "blue-500": "bg-blue-500",
  "brand-500": "bg-brand-500",
  "purple-500": "bg-purple-500",
  "emerald-500": "bg-emerald-500",
  "amber-500": "bg-amber-500",
  "rose-500": "bg-rose-500",
  "indigo-500": "bg-indigo-500",
  "teal-500": "bg-teal-500",
};

interface ModalSectionHeaderProps {
  /** Color del bullet (ej: "blue-500", "brand-500", "purple-500", "emerald-500") */
  color?: keyof typeof BULLET_COLORS;
  /** Título de la sección */
  children: React.ReactNode;
  /** Clases adicionales */
  className?: string;
}

/**
 * Componente que muestra un encabezado de sección estandarizado dentro de modales.
 * 
 * @example
 * ```tsx
 * <ModalSectionHeader color="blue-500">Información Personal</ModalSectionHeader>
 * ```
 */
export const ModalSectionHeader: React.FC<ModalSectionHeaderProps> = ({
  color = "brand-500",
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex items-center gap-2 border-b border-border-light pb-2 dark:border-white/5",
        className
      )}
    >
      <div className={cn("h-2 w-2 rounded-full", BULLET_COLORS[color] || "bg-brand-500")} />
      <h4 className="font-bold text-text-primary dark:text-white/90 uppercase text-xs tracking-wider">
        {children}
      </h4>
    </div>
  );
};
