/**
 * @file FloatingActionButton.tsx
 * @description Botón flotante de acciones rápidas (FAB)
 * Visible solo para administradores (roles 0, 1, 2)
 */

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/auth";
import { PlusIcon } from "../../icons";
import { cn } from "../../utils/cn";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
}

const FloatingActionButton: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Roles permitidos: admin (0), superadmin (1), coordinator (2)
  const isAdmin = user?.role !== undefined && [0, 1, 2].includes(user.role);
  
  if (!isAdmin) return null;

  const quickActions: QuickAction[] = [
    {
      id: "new-student",
      label: "Nuevo Estudiante",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" />
          <line x1="22" y1="11" x2="16" y2="11" />
        </svg>
      ),
      action: () => window.dispatchEvent(new CustomEvent("app:openStudentModal"))
    },
    {
      id: "new-institution",
      label: "Nueva Institución",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 21h18" />
          <path d="M5 21V7l8-4v18" />
          <path d="M19 21V11l-6-4" />
          <path d="M9 9v.01" />
          <path d="M9 12v.01" />
          <path d="M9 15v.01" />
          <path d="M9 18v.01" />
        </svg>
      ),
      action: () => window.dispatchEvent(new CustomEvent("app:openInstitutionModal"))
    },
    {
      id: "new-pre-enrollment",
      label: "Nueva Pre-inscripción",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      ),
      action: () => window.dispatchEvent(new CustomEvent("app:openPreEnrollmentModal"))
    },
    {
      id: "new-tutor",
      label: "Nuevo Tutor",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      action: () => window.dispatchEvent(new CustomEvent("app:openTutorModal"))
    }
  ];

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleActionClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50" ref={menuRef}>
      {/* Menú de acciones */}
      <div
        className={cn(
          "absolute bottom-full right-0 mb-3 w-56 bg-white dark:bg-bg-dark rounded-xl shadow-xl border border-border-light/50 dark:border-white/10 overflow-hidden transition-all duration-200",
          isOpen 
            ? "opacity-100 translate-y-0 scale-100" 
            : "opacity-0 translate-y-2 scale-95 pointer-events-none"
        )}
      >
        <div className="py-2">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-text-tertiary border-b border-border-light/30 dark:border-white/5">
            Acciones Rápidas
          </div>
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleActionClick(action.action)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-text-secondary hover:bg-gray-50 dark:text-text-tertiary dark:hover:bg-white/5 transition-colors"
            >
              <span className="text-text-tertiary">{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Botón principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-200",
          isOpen 
            ? "bg-gray-200 dark:bg-white/10 rotate-90" 
            : "bg-brand-500 hover:bg-brand-600 dark:bg-brand-500 dark:hover:bg-brand-600",
          "text-white dark:text-white"
        )}
        aria-label="Acciones rápidas"
      >
        <PlusIcon className={cn("w-6 h-6 transition-transform", isOpen && "rotate-45")} />
      </button>
    </div>
  );
};

export default FloatingActionButton;