import type React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../../utils/cn";

/**
 * Props for the DropdownPortal component.
 */
interface DropdownPortalProps {
  /** Whether the dropdown is open. */
  isOpen: boolean;
  /** Callback to close the dropdown. */
  onClose: () => void;
  /** The element to anchor the dropdown to. */
  anchorEl: HTMLElement | null;
  /** Content of the dropdown. */
  children: React.ReactNode;
  /** Additional CSS classes. */
  className?: string;
}

/**
 * DropdownPortal component that renders the menu in a React portal.
 * This avoids clipping issues when the dropdown is inside a container with `overflow: hidden`.
 * It handles automatic positioning relative to the anchor element.
 * 
 * @example
 * ```tsx
 * <DropdownPortal isOpen={isOpen} onClose={close} anchorEl={buttonRef.current}>
 *   <DropdownItem>Action</DropdownItem>
 * </DropdownPortal>
 * ```
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
    zIndex: 9999,
    transform: "translateX(-100%)",
    opacity: 0,
    transition: "opacity 0.2s ease-in-out, transform 0.2s ease-in-out"
  });

  // Handle outside clicks and Escape key
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

  // Calculate position when opening, resizing, or scrolling
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
      const threshold = 20;

      // 1. Available space
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // 2. Determine vertical position
      let top: number;

      if (spaceBelow < menuHeight + threshold) {
        if (spaceAbove > menuHeight + threshold) {
          top = Math.round(rect.top + window.scrollY - menuHeight - offset);
        } else {
          if (spaceAbove > spaceBelow) {
            top = Math.round(rect.top + window.scrollY - menuHeight - offset);
          } else {
            top = Math.round(rect.bottom + window.scrollY + offset);
          }
        }
      } else {
        top = Math.round(rect.bottom + window.scrollY + offset);
      }

      // 3. Determine horizontal position
      let left = Math.round(rect.right + window.scrollX);

      // Ensure it doesn't overflow left
      if (left - menuWidth < window.scrollX + threshold) {
        left = Math.round(rect.left + window.scrollX + menuWidth);
      }
      
      // Ensure it doesn't overflow right
      if (left > window.innerWidth + window.scrollX - threshold) {
        left = Math.round(window.innerWidth + window.scrollX - threshold);
      }

      // 4. Final safety adjustment for viewport
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
        transform: `translateX(-100%)`,
      }));
    };

    const timeoutId = setTimeout(updatePosition, 10);

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    
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
      className={cn(
        "min-w-[176px] rounded-xl border border-border-light bg-bg-main shadow-theme-lg dark:border-border-dark dark:bg-bg-dark overflow-hidden",
        className
      )}
    >
      {children}
    </div>,
    document.body
  );
};

