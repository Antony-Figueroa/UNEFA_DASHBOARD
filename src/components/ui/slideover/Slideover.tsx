/**
 * @file Slideover.tsx
 * @description Panel lateral deslizante desde la derecha.
 * Componente reutilizable con backdrop, animación y soporte para scroll.
 *
 * @example
 * ```tsx
 * <Slideover isOpen={isOpen} onClose={() => setIsOpen(false)} title="Tareas">
 *   <p>Contenido del panel</p>
 * </Slideover>
 * ```
 */

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';

interface SlideoverProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  badge?: number;
  children: ReactNode;
}

const PANEL_WIDTH = 400;

const Slideover = ({ isOpen, onClose, title, badge, children }: SlideoverProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-[55]"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: PANEL_WIDTH }}
            animate={{ x: 0 }}
            exit={{ x: PANEL_WIDTH }}
            transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
            className="fixed inset-y-0 right-0 bg-white dark:bg-gray-900 shadow-2xl z-[56] flex flex-col"
            style={{ width: PANEL_WIDTH }}
            role="dialog"
            aria-modal="true"
            aria-label={title || 'Panel lateral'}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark shrink-0">
              <div className="flex items-center gap-3">
                {title && (
                  <h2 className="text-lg font-semibold text-text-emphasis dark:text-text-emphasis">
                    {title}
                  </h2>
                )}
                {badge !== undefined && badge > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-bold text-white bg-red-500">
                    {badge}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Cerrar panel"
              >
                <FiX className="size-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Slideover;
