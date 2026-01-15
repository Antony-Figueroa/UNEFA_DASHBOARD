import type React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface DropdownPortalProps {
  isOpen: boolean;
  onClose: () => void;
  anchorEl: HTMLElement | null;
  children: React.ReactNode;
  className?: string;
}

/**
 * Renderiza el menú como portal en `document.body` para evitar clipping por overflow.
 * Posiciona el menú de forma absoluta respecto al elemento disparador (anchorEl).
 */
export const DropdownPortal: React.FC<DropdownPortalProps> = ({
  isOpen,
  onClose,
  anchorEl,
  children,
  className = "",
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({ 
    display: "none",
    position: "absolute",
    zIndex: 9999, // Aumentar zIndex para asegurar que esté por encima de todo
    transform: "translateX(-100%)",
    opacity: 0,
    transition: "opacity 0.2s ease-in-out, transform 0.2s ease-in-out" // Suavizar la aparición
  });

  // Cerrar al hacer click fuera y con Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        anchorEl &&
        !anchorEl.contains(target)
      ) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [onClose, anchorEl, isOpen]);

  // Calcular posición cada vez que abre, y cuando se hace resize/scroll
  useLayoutEffect(() => {
    if (!isOpen || !anchorEl) {
      setStyle(prev => ({ ...prev, display: "none", opacity: 0 }));
      return;
    }

    const updatePosition = () => {
      if (!anchorEl || !menuRef.current) return;

      const rect = anchorEl.getBoundingClientRect();
      const menuHeight = menuRef.current.offsetHeight;
      const menuWidth = menuRef.current.offsetWidth;
      const offset = 5; 
      const threshold = 20; // Aumentar margen de seguridad para evitar solapamientos con footers/barras

      // 1. Espacio disponible
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // 2. Determinar posición vertical
      let top: number;
      let isTop = false;

      // Si el espacio abajo es menor que el menú + threshold, intentamos ponerlo arriba
      if (spaceBelow < menuHeight + threshold) {
        if (spaceAbove > menuHeight + threshold) {
          // Hay espacio arriba
          top = Math.round(rect.top + window.scrollY - menuHeight - offset);
          isTop = true;
        } else {
          // No hay espacio suficiente en ningún lado, forzar al que tenga más espacio
          if (spaceAbove > spaceBelow) {
            top = Math.round(rect.top + window.scrollY - menuHeight - offset);
            isTop = true;
          } else {
            top = Math.round(rect.bottom + window.scrollY + offset);
          }
        }
      } else {
        // Hay espacio abajo
        top = Math.round(rect.bottom + window.scrollY + offset);
      }

      // 3. Determinar posición horizontal
      let left = Math.round(rect.right + window.scrollX);

      // Asegurar que el menú no se salga por la izquierda
      if (left - menuWidth < window.scrollX + threshold) {
        left = Math.round(rect.left + window.scrollX + menuWidth);
      }
      
      // Asegurar que no se salga por la derecha
      if (left > window.innerWidth + window.scrollX - threshold) {
        left = Math.round(window.innerWidth + window.scrollX - threshold);
      }

      // 4. Ajuste final de seguridad para el viewport
      const absoluteTop = top - window.scrollY;
      if (absoluteTop < threshold) {
        top = window.scrollY + threshold;
      } else if (absoluteTop + menuHeight > window.innerHeight - threshold) {
        top = window.scrollY + window.innerHeight - menuHeight - threshold;
      }

      setStyle(prev => ({
        ...prev,
        display: "block",
        opacity: 1,
        top,
        left,
        transform: `translateX(-100%) translateY(${isTop ? '0' : '0'})`, // Podemos ajustar translateY para micro-animaciones si se desea
      }));
    };

    // Usar un pequeño timeout para asegurar que el menú se ha renderizado y tiene dimensiones
    const timeoutId = setTimeout(updatePosition, 10); // Aumentar un poco el delay para asegurar layout estable

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    
    // Observar cambios en el contenido del menú (por si cargan datos asíncronos)
    const resizeObserver = new ResizeObserver(() => {
      updatePosition();
    });

    if (menuRef.current) {
      resizeObserver.observe(menuRef.current);
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      resizeObserver.disconnect();
    };
  }, [isOpen, anchorEl]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-hidden={!isOpen}
      style={style}
      className={`min-w-44 rounded-xl border border-border-light bg-bg-main shadow-theme-lg dark:border-border-dark dark:bg-bg-dark ${className}`}
    >
      {children}
    </div>,
    document.body
  );
};

