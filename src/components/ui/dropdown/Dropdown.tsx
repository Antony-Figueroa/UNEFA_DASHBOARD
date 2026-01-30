import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../../utils/cn";

/**
 * Propiedades para el componente Dropdown.
 */
export interface DropdownProps {
  /** Indica si el menú desplegable está visible. */
  isOpen: boolean;
  /** Función para cerrar el menú desplegable. */
  onClose: () => void;
  /** Contenido del menú (usualmente una lista de DropdownItem). */
  children: React.ReactNode;
  /** Clases CSS adicionales para el contenedor. */
  className?: string;
  /** Alineación del menú respecto al disparador. */
  align?: "left" | "right";
}

/**
 * Componente de menú desplegable animado.
 * Proporciona un contenedor para elementos de menú con comportamiento de cierre al hacer clic fuera.
 * 
 * @component
 * @example
 * ```tsx
 * <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)}>
 *   <DropdownItem onClick={handleEdit}>Editar</DropdownItem>
 *   <DropdownItem variant="delete" onClick={handleDelete}>Eliminar</DropdownItem>
 * </Dropdown>
 * ```
 */
export const Dropdown: React.FC<DropdownProps> = ({
  isOpen,
  onClose,
  children,
  className = "",
  align = "right",
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera del componente
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest(".dropdown-toggle")
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className={cn(
            "absolute z-40 mt-2 min-w-[180px] rounded-xl border border-border-light bg-bg-main shadow-theme-lg",
            "dark:border-border-dark dark:bg-bg-dark overflow-hidden",
            align === "right" ? "right-0" : "left-0",
            className
          )}
        >
          <div 
            className="py-1.5" 
            role="menu" 
            aria-orientation="vertical"
            aria-labelledby="dropdown-button"
          >
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

