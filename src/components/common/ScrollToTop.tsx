import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ScrollToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Detectar si el botón IA está visible para ajustar la posición vertical
  // Lazy initializer para evitar flash de posicionamiento incorrecto
  const [iaButtonVisible, setIaButtonVisible] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem("unefa_show_ia_button");
    const hiddenByAttr = document.documentElement.dataset.hideIaButton !== undefined;
    return stored !== "false" && !hiddenByAttr;
  });

  // Only run on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Escuchar cambios de visibilidad del botón IA (misma pestaña vía custom event, otras pestañas vía storage)
  useEffect(() => {
    if (!isMounted) return;

    const handleVisibilityChange = (e: Event | CustomEvent) => {
      if (e instanceof CustomEvent) {
        setIaButtonVisible(e.detail.visible);
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "unefa_show_ia_button") {
        setIaButtonVisible(e.newValue !== "false");
      }
    };

    // Escuchar custom event disparado por IAButton en la misma pestaña
    window.addEventListener("unefa:ia-visibility-changed", handleVisibilityChange as EventListener);
    // Escuchar cambios de localStorage desde otras pestañas
    window.addEventListener("storage", handleStorageChange);
    // Observar cambios en data-hide-ia-button del dataset
    const observer = new MutationObserver(() => {
      const hiddenByAttr = document.documentElement.dataset.hideIaButton !== undefined;
      setIaButtonVisible(prev => {
        const stored = localStorage.getItem("unefa_show_ia_button");
        return (stored !== "false") && !hiddenByAttr;
      });
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-hide-ia-button"] });

    return () => {
      window.removeEventListener("unefa:ia-visibility-changed", handleVisibilityChange as EventListener);
      window.removeEventListener("storage", handleStorageChange);
      observer.disconnect();
    };
  }, [isMounted]);

  // Show button when page is scrolled more than 300px
  useEffect(() => {
    if (!isMounted) return;
    
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, [isMounted]);

  const scrollToTop = () => {
    if (typeof window === 'undefined') return;
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <AnimatePresence>
      {isMounted && isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={scrollToTop}
          aria-label="Volver arriba"
          className={`fixed right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#2d90c4] text-white shadow-lg transition-all hover:bg-[#2579a5] focus:outline-none focus:ring-2 focus:ring-[#2d90c4] focus:ring-offset-2 ${iaButtonVisible ? 'bottom-20' : 'bottom-5'}`}
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 15l7-7 7 7"
            />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default ScrollToTop;
