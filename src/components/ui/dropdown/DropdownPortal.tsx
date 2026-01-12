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
    zIndex: 50,
    transform: "translateX(-100%)"
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
      setStyle(prev => {
        if (prev.display === "none") return prev;
        return { ...prev, display: "none" };
      });
      return;
    }

    const updatePosition = () => {
      const rect = anchorEl.getBoundingClientRect();
      const top = Math.round(rect.bottom + window.scrollY + 8); // 8px de separación
      const left = Math.round(rect.right + window.scrollX); // alineamos al borde derecho del anchor
      
      setStyle(prev => {
        if (prev.top === top && prev.left === left && prev.display === "block") {
          return prev;
        }
        return {
          ...prev,
          display: "block",
          top,
          left,
        };
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
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

