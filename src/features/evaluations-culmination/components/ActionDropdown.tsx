/**
 * @file ActionDropdown.tsx
 * @description Dropdown de acciones con portal, teclado, ARIA y animación.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ThreeDotsIcon } from '../../../icons/actions';
import { cn } from '../../../utils/cn';

export interface ActionItem {
  label: string;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
  separator?: boolean;
}

interface ActionDropdownProps {
  actions: ActionItem[];
  disabled?: boolean;
}

/** Actions that are actually clickable (not separators). */
function getInteractiveActions(actions: ActionItem[]): ActionItem[] {
  return actions.filter(a => !a.separator);
}

export const ActionDropdown: React.FC<ActionDropdownProps> = ({ actions, disabled }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [activeIndex, setActiveIndex] = useState(0);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const interactiveActions = useMemo(() => getInteractiveActions(actions), [actions]);

  // Position with viewport boundary detection
  const calculatePosition = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const MENU_WIDTH = 200;
    const MENU_HEIGHT = interactiveActions.length * 36 + 16;
    const MARGIN = 8;

    let top = rect.bottom + 4;
    let left = rect.right - MENU_WIDTH;

    // Flip above if overflow bottom
    if (top + MENU_HEIGHT > window.innerHeight - MARGIN) {
      top = rect.top - MENU_HEIGHT - 4;
    }
    // Clamp left to viewport
    if (left < MARGIN) left = MARGIN;
    if (left + MENU_WIDTH > window.innerWidth - MARGIN) {
      left = window.innerWidth - MENU_WIDTH - MARGIN;
    }

    setPos({ top, left });
  }, [interactiveActions.length]);

  // Click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Keyboard on menu
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          setOpen(false);
          btnRef.current?.focus();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex(prev => (prev + 1) % interactiveActions.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex(prev => (prev - 1 + interactiveActions.length) % interactiveActions.length);
          break;
        case 'Home':
          e.preventDefault();
          setActiveIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setActiveIndex(interactiveActions.length - 1);
          break;
        case 'Tab':
          // Trap focus inside menu
          e.preventDefault();
          if (e.shiftKey) {
            setActiveIndex(prev => (prev - 1 + interactiveActions.length) % interactiveActions.length);
          } else {
            setActiveIndex(prev => (prev + 1) % interactiveActions.length);
          }
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (interactiveActions[activeIndex]?.onClick) {
            setOpen(false);
            interactiveActions[activeIndex].onClick!();
          }
          break;
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, activeIndex, interactiveActions]);

  // Focus active item
  useEffect(() => {
    if (open && itemRefs.current[activeIndex]) {
      itemRefs.current[activeIndex]?.focus();
    }
  }, [open, activeIndex]);

  const toggle = useCallback(() => {
    if (!open) {
      calculatePosition();
      setActiveIndex(0);
    }
    setOpen(prev => !prev);
  }, [open, calculatePosition]);

  const handleItemClick = useCallback((action: ActionItem) => {
    setOpen(false);
    action.onClick?.();
  }, []);

  // Track which interactive index a given actions-map index corresponds to
  const getInteractiveIndex = useCallback((actionIndex: number): number | null => {
    let count = 0;
    for (let i = 0; i <= actionIndex; i++) {
      if (!actions[i].separator) {
        if (i === actionIndex) return count;
        count++;
      }
    }
    return null;
  }, [actions]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        className="p-1.5 rounded-lg hover:bg-bg-subtle dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
      >
        <ThreeDotsIcon className="w-4 h-4 text-text-tertiary" />
      </button>

      <AnimatePresence>
        {open && createPortal(
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="fixed z-[9999] min-w-[200px] bg-white dark:bg-gray-800 border border-border-default dark:border-border-dark rounded-lg shadow-lg py-1"
            style={{ top: pos.top, left: pos.left }}
            role="menu"
            aria-orientation="vertical"
          >
            {actions.map((action, i) => {
              if (action.separator) {
                return (
                  <div
                    key={`sep-${i}`}
                    className="border-t border-border-default dark:border-border-dark my-1"
                    role="separator"
                  />
                );
              }

              const idx = getInteractiveIndex(i);
              const isActive = idx !== null && idx === activeIndex;

              return (
                <button
                  key={i}
                  ref={el => { if (idx !== null) itemRefs.current[idx] = el; }}
                  type="button"
                  role="menuitem"
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => handleItemClick(action)}
                  onMouseEnter={() => { if (idx !== null) setActiveIndex(idx); }}
                  className={cn(
                    'w-full text-left px-4 py-2 text-sm transition-colors',
                    'hover:bg-bg-subtle dark:hover:bg-gray-700',
                    'focus:bg-bg-subtle dark:focus:bg-gray-700 focus:outline-none',
                    action.className || 'text-text-secondary'
                  )}
                >
                  {action.icon && <span className="mr-2 inline-flex">{action.icon}</span>}
                  {action.label}
                </button>
              );
            })}
          </motion.div>,
          document.body
        )}
      </AnimatePresence>
    </div>
  );
};

export default ActionDropdown;
