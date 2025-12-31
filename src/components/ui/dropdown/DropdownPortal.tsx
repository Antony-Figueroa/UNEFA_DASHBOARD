import type React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface DropdownPortalProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement>;
  children: React.ReactNode;
  className?: string;
}

/**
 * Renderiza el menú como portal en `document.body` para evitar clipping por overflow.
 * Posiciona el menú de forma absoluta respecto al elemento disparador (anchorRef).
 */
export const DropdownPortal: React.FC<DropdownPortalProps> = ({
  isOpen,
  onClose,
  anchorRef,
  children,
  className = "",
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({ display: "none" });

  // Cerrar al hacer click fuera y con Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        anchorRef.current &&
        !anchorRef.current.contains(target)
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
  }, [onClose, anchorRef]);

  // Calcular posición cada vez que abre, y cuando se hace resize/scroll
  useLayoutEffect(() => {
    const updatePosition = () => {
      const anchor = anchorRef.current;
      if (!anchor || !isOpen) return;
      const rect = anchor.getBoundingClientRect();
      // bottom-end respecto al viewport, sumando scroll para posición absoluta en body
      const top = rect.bottom + window.scrollY + 8; // 8px de separación
      const left = rect.right + window.scrollX; // alineamos al borde derecho del anchor
      setStyle({
        position: "absolute",
        top,
        left,
        transform: "translateX(-100%)",
        zIndex: 50,
      });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, anchorRef]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-hidden={!isOpen}
      style={style}
      className={`min-w-44 rounded-xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark ${className}`}
    >
      {children}
    </div>,
    document.body
  );
};

