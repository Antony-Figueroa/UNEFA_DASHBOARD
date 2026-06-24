import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router";
import Button from "../../../components/ui/button/Button";
import { ThemeToggleButton } from "../../../components/common/ThemeToggleButton";
import { AnimatePresence, motion } from "framer-motion";

const NAV_LINKS = [
  { name: "Inicio", path: "/" },
  { name: "Nosotros", path: "/nosotros" },
  { name: "Carreras", path: "/carreras" },
  { name: "Pasantías", path: "/pasantias" },
];

const PublicNavbar: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const updateNavHeight = () => {
      if (navRef.current) {
        const height = navRef.current.offsetHeight;
        document.documentElement.style.setProperty("--navbar-height", `${height}px`);
      }
    };

    updateNavHeight();
    window.addEventListener("resize", updateNavHeight);
    return () => window.removeEventListener("resize", updateNavHeight);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? (window.pageYOffset / totalHeight) * 100 : 0;
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <nav 
      ref={navRef}
      className="w-full bg-bg-main/80 backdrop-blur-md border-b border-border-light dark:bg-bg-dark/80 dark:border-border-dark sticky top-0 z-50" 
      role="navigation" 
      aria-label="Navegación principal"
    >
      <div 
        className="absolute bottom-0 left-0 h-0.5 bg-brand-500 transition-all duration-150 ease-out z-10"
        style={{ width: `${scrollProgress}%` }}
        aria-hidden="true"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2" aria-label="Volver al inicio">
              <img
                className="h-12 w-auto"
                src="/logo-nuevo.png"
                alt="UNEFA Logo"
              />
              <span className="text-xl font-bold text-text-emphasis hidden sm:block">
                UNEFA
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = location.pathname === link.path;
              
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? "text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10"
                      : "text-text-secondary hover:text-brand-500 dark:hover:text-brand-400"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex items-center gap-3">
              <Link to="/signin">
                <Button variant="primary" size="sm">
                  Iniciar Sesión
                </Button>
              </Link>
            </div>
            <ThemeToggleButton />
            
            <button 
              className="md:hidden p-2 text-text-secondary hover:bg-bg-secondary rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
              onClick={() => setIsOpen(!isOpen)}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                {isOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16m-7 6h7"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden border-t border-border-light dark:border-border-dark bg-bg-main dark:bg-bg-dark overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              {NAV_LINKS.map((link) => {
                const isActive = location.pathname === link.path;
                
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center justify-between px-4 py-3 text-base font-medium rounded-xl transition-all ${
                      isActive
                        ? "bg-brand-50 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400"
                        : "text-text-secondary hover:text-brand-500 hover:bg-bg-secondary dark:hover:bg-white/5"
                    }`}
                  >
                    {link.name}
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-brand-500" />
                    )}
                  </Link>
                );
              })}
              <div className="pt-4 border-t border-border-light dark:border-border-dark sm:hidden">
                <Link to="/signin" onClick={() => setIsOpen(false)}>
                  <Button variant="primary" className="w-full justify-center py-3">
                    Iniciar Sesión
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default PublicNavbar;
