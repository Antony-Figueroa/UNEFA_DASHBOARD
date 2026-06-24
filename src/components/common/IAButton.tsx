import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";

const STORAGE_KEY = "unefa_show_ia_button";

const IAButton: React.FC = () => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isHiddenByPage, setIsHiddenByPage] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setIsVisible(stored === "true");
    }
  }, []);

  useEffect(() => {
    setIsHiddenByPage(document.documentElement.dataset.hideIaButton !== undefined);
  }, []);

  const toggleVisibility = (show: boolean) => {
    setIsVisible(show);
    localStorage.setItem(STORAGE_KEY, String(show));
    setShowOptions(false);
  };

  if (!isVisible || isHiddenByPage) return null;

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowOptions(!showOptions);
  };

  return (
    <motion.div className="fixed bottom-5 right-5 z-50" initial={{ opacity: 0, scale: 0.5, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate("/ai-assistant")}
        onContextMenu={handleRightClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Asistente IA"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#2d90c4] to-[#054f94] text-white shadow-xl ring-2 ring-[#2d90c4]/50 transition-all hover:from-[#2d90c4] hover:to-[#033a6b] hover:ring-[#2d90c4] focus:outline-none"
      >
        <motion.div animate={{ rotate: isHovered ? 15 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 10 }}>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
        </motion.div>

        {/* Tooltip */}
        <AnimatePresence>
          {isHovered && !showOptions && (
            <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="absolute right-full mr-3 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white shadow-lg">
              Asistente IA
              <span className="absolute -right-2 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 bg-gray-900" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Options Menu */}
      <AnimatePresence>
        {showOptions && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute bottom-full mb-2 right-0 w-48 rounded-lg bg-white py-1 shadow-xl ring-1 ring-black/5 dark:bg-gray-800">
            <div className="border-b border-gray-100 px-3 py-2 text-xs font-semibold text-gray-500 dark:border-gray-700 dark:text-gray-400">
              Configurar botón IA
            </div>
            <button onClick={() => toggleVisibility(true)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
              <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Mostrar botón
            </button>
            <button onClick={() => toggleVisibility(false)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
              <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Ocultar botón
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default IAButton;