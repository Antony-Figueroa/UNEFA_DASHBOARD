import React, { useState, useEffect, useRef, useContext } from "react";
import { SidebarContext } from "../../context/sidebar";

const TopBanner: React.FC = () => {
  const sidebarContext = useContext(SidebarContext);
  
  // Si no hay contexto de sidebar (páginas públicas), usamos valores por defecto
  const isExpanded = sidebarContext?.isExpanded ?? false;
  const isHovered = sidebarContext?.isHovered ?? false;
  const isMobileOpen = sidebarContext?.isMobileOpen ?? false;
  
  const [isVisible, setIsVisible] = useState(true);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1000);
  const scrollRef = useRef<number>(0);

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1000);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Calcular el desplazamiento a la izquierda basado en el estado del sidebar y el tamaño de pantalla
  // Si no hay contexto de sidebar (páginas públicas), el ancho es siempre 0px
  const sidebarWidth = !sidebarContext || !isLargeScreen || isMobileOpen 
    ? "0px" 
    : (isExpanded || isHovered ? "260px" : "70px");

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Use requestAnimationFrame for performance
      if (scrollRef.current) {
        cancelAnimationFrame(scrollRef.current);
      }

      scrollRef.current = requestAnimationFrame(() => {
        // El banner solo es visible en la posición inicial (0) del scroll
        if (currentScrollY <= 0) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollRef.current) {
        cancelAnimationFrame(scrollRef.current);
      }
    };
  }, [sidebarContext]);

  useEffect(() => {
    const height = isVisible && isLargeScreen ? (window.innerWidth >= 1000 ? "60px" : "48px") : "0px";
    document.documentElement.style.setProperty("--banner-height", height);
  }, [isVisible, isLargeScreen]);

  return (
    <div 
      style={{ 
        left: sidebarWidth,
        width: `calc(100% - ${sidebarWidth})`
      }}
      className={`${!sidebarContext ? "relative" : "fixed top-0"} ${!isLargeScreen ? "hidden" : "flex"} bg-white dark:bg-bg-dark border-b border-border-light dark:border-border-dark overflow-hidden z-99999 transition-all duration-300 ease-in-out items-center justify-start ${
        isVisible ? "h-12 lg:h-15 opacity-100" : "h-0 opacity-0 border-none"
      }`}
    >
      <img
        src="/unefa-img/menbrete-nuevo.jpg"
        alt="Gobierno Bolivariano de Venezuela"
        className="h-full w-full object-fill object-left"
      />
    </div>
  );
};

export default TopBanner;
