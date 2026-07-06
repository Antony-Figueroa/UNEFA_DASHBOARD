/**
 * @file ActionDropdown.tsx
 * @description Dropdown de acciones con portal para tablas.
 * Patrón igual al de Enrollment: click → portal con posición calculada.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ThreeDotsIcon } from '../../../icons/actions';

export interface ActionItem {
  label: string;
  onClick: () => void;
  className?: string;
  icon?: React.ReactNode;
  separator?: boolean;
}

interface ActionDropdownProps {
  actions: ActionItem[];
  disabled?: boolean;
}

export const ActionDropdown: React.FC<ActionDropdownProps> = ({ actions, disabled }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggle = useCallback(() => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.right - 200 });
    }
    setOpen(prev => !prev);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        disabled={disabled}
        className="p-1.5 rounded-lg hover:bg-bg-subtle dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
      >
        <ThreeDotsIcon className="w-4 h-4 text-text-tertiary" />
      </button>
      {open && createPortal(
        <div
          className="fixed z-[9999] min-w-[200px] bg-white dark:bg-gray-800 border border-border-default dark:border-border-dark rounded-lg shadow-lg py-1"
          style={{ top: pos.top, left: pos.left }}
        >
          {actions.map((action, i) => (
            action.separator ? (
              <div key={i} className="border-t border-border-default dark:border-border-dark my-1" />
            ) : (
              <button
                key={i}
                type="button"
                onClick={() => { setOpen(false); action.onClick(); }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-bg-subtle dark:hover:bg-gray-700 transition-colors ${action.className || 'text-text-secondary'}`}
              >
                {action.icon && <span className="mr-2 inline-flex">{action.icon}</span>}
                {action.label}
              </button>
            )
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};
