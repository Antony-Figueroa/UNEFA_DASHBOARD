import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import Button from "../../../components/ui/button/Button";
import { ThemeToggleButton } from "../../../components/common/ThemeToggleButton";
import { motion, AnimatePresence } from "motion/react";
import { smoothScrollTo } from "../../../utils/scrollUtils";

const PublicNavbar: React.FC = () => {
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

  /**
   * Actualiza la barra de progreso de scroll basada en la posición actual de la página.
   */
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? (window.pageYOffset / totalHeight) * 100 : 0;
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /**
   * Cierra el menú móvil automáticamente si se redimensiona a pantalla de escritorio.
   */
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /**
   * Bloquea el scroll del cuerpo del documento cuando el menú móvil está abierto
   * para mejorar la experiencia de usuario.
   */
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

  const navLinks = [
    { name: "Inicio", href: "/" },
    { name: "Nosotros", href: "/nosotros" },
    { name: "Carreras", href: "/carreras" },
    { name: "Pasantías", href: "/pasantias" },
  ];

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const targetId = href.replace("#", "");
      smoothScrollTo(targetId);
    }
  };

  return (
    <nav 
      ref={navRef}
      className="w-full bg-bg-main/80 backdrop-blur-md border-b border-border-light dark:bg-bg-dark/80 dark:border-border-dark" 
      role="navigation" 
      aria-label="Navegación principal"
    >
      {/* Barra de Progreso de Scroll */}
      <div 
        className="absolute bottom-0 left-0 h-0.5 bg-brand-500 transition-all duration-150 ease-out z-10"
        style={{ width: `${scrollProgress}%` }}
        aria-hidden="true"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
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

          {/* Enlaces de Navegación - Escritorio */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => scrollToSection(e, link.href)}
                className="text-base font-semibold text-text-secondary hover:text-brand-500 transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex items-center gap-3">
              <Link to="/signin">
                <Button variant="primary" size="sm">
                  Iniciar Sesión
                </Button>
              </Link>
            </div>
            <ThemeToggleButton />
            
            {/* Botón de Menú Móvil */}
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

      {/* Menú Móvil */}
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
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => {
                    setIsOpen(false);
                    scrollToSection(e, link.href);
                  }}
                  className="block px-3 py-4 text-base font-medium text-text-secondary hover:text-brand-500 hover:bg-bg-secondary rounded-lg transition-all"
                >
                  {link.name}
                </a>
              ))}
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
