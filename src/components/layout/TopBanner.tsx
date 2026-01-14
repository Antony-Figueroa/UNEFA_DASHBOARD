import React, { useState, useEffect, useRef } from "react";

const TopBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const scrollRef = useRef<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Use requestAnimationFrame for performance
      if (scrollRef.current) {
        cancelAnimationFrame(scrollRef.current);
      }

      scrollRef.current = requestAnimationFrame(() => {
        // Mostrar SOLO cuando se está viendo el tope superior de la página
        if (currentScrollY <= 0) {
          setIsVisible(true);
        } else {
          // Se mantiene oculto en el resto del espacio
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
  }, []);

  return (
    <div 
      className={`w-full bg-white dark:bg-white border-b border-border-light dark:border-border-dark overflow-hidden z-99999 transition-all duration-300 ease-in-out shadow-theme-md ${
        isVisible ? "max-h-15 opacity-100" : "max-h-0 opacity-0 border-none"
      }`}
    >
      <img
        src="/unefa-img/menbrete-nuevo.jpg"
        alt="Gobierno Bolivariano de Venezuela"
        className="w-full h-auto max-h-15 object-contain mx-auto"
      />
    </div>
  );
};

export default TopBanner;
