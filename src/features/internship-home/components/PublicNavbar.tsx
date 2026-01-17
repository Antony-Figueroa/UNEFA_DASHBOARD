import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import Button from "../../../components/ui/button/Button";
import { ThemeToggleButton } from "../../../components/common/ThemeToggleButton";
import { motion, AnimatePresence } from "motion/react";
import { smoothScrollTo } from "../../../utils/scrollUtils";

const PublicNavbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Update scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.pageYOffset / totalHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

  const navLinks = [
    { name: "Inicio", href: "#inicio" },
    { name: "Ofertas", href: "#ofertas" },
    { name: "Procesos", href: "#procesos" },
    { name: "Contacto he Información", href: "#contacto" },
  ];

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const targetId = href.replace("#", "");
      smoothScrollTo(targetId);
    }
  };

  return (
    <nav className="w-full bg-bg-main/80 backdrop-blur-md border-b border-border-light dark:bg-bg-dark/80 dark:border-border-dark sticky top-0 z-9999">
      {/* Scroll Progress Bar */}
      <div 
        className="absolute bottom-0 left-0 h-0.5 bg-brand-500 transition-all duration-150 ease-out z-10"
        style={{ width: `${scrollProgress}%` }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2">
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

          {/* Navigation Links - Desktop */}
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

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex items-center gap-3">
              <Link to="/signin">
                <Button variant="primary" size="sm">
                  Iniciar Sesión
                </Button>
              </Link>
            </div>
            <ThemeToggleButton />
            
            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 text-text-secondary hover:bg-bg-secondary rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
              onClick={() => setIsOpen(!isOpen)}
              aria-expanded={isOpen}
              aria-label="Menú principal"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
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

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
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
