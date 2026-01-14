import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CircularGalleryProps {
  bend?: number;
  borderRadius?: number;
  scrollEase?: number;
}

const CircularGallery: React.FC<CircularGalleryProps> = ({
  borderRadius = 0.05,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const images = useMemo(() => [
    {
      src: "/unefa-img/unefa_fachada.jpeg",
      title: "Fachada Principal: Cuna de la Excelencia Educativa"
    },
    {
      src: "/unefa-img/Graduacion-UNEFA.jpg",
      title: "Forjando el Futuro: Soberanía y Conocimiento"
    },
    {
      src: "/unefa-img/Universidad De Las Fuerzas Armadas.jpg",
      title: "UNEFA: Excelencia Educativa Abierta al Pueblo"
    },
    {
      src: "/unefa-img/Carreras que ofrece la UNEFA en el Distrito Capital - Notilogía.jpg",
      title: "Soberanía Tecnológica: Formación para la Patria"
    },
    {
      src: "/unefa-img/WhatsApp Image 2024-07-02 at 12-3649.jpg",
      title: "Identidad y Cultura: Sentimiento Venezolano"
    },
    {
      src: "/unefa-img/WhatsApp Image 2024-07-02 at 12-5425.jpg",
      title: "Disciplina y Compromiso: Juventud de Oro"
    },
  ], []);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 500 : -500,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 500 : -500,
      opacity: 0,
      scale: 0.95,
    }),
  };

  const paginate = useCallback((newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prevIndex) => {
      let nextIndex = prevIndex + newDirection;
      if (nextIndex < 0) nextIndex = images.length - 1;
      if (nextIndex >= images.length) nextIndex = 0;
      return nextIndex;
    });
  }, [images.length]);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      paginate(1);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, paginate]);

  return (
    <div 
      className="w-full h-full bg-white dark:bg-bg-dark rounded-3xl overflow-hidden flex flex-col items-center justify-center p-2 md:p-8 border border-border-light dark:border-border-dark relative shadow-theme-md transition-colors duration-500"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      <div className="relative w-full min-h-137.5 flex items-center justify-center overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 1.5 },
              scale: { duration: 1.5 },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(_, info) => {
              if (info.offset.x > 100) paginate(-1);
              else if (info.offset.x < -100) paginate(1);
            }}
            className="absolute w-full max-w-2xl px-4 flex flex-col items-center justify-center"
            draggable={false}
          >
            <div 
              className="w-full aspect-video overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.15)] border border-border-light dark:border-border-dark relative group transition-all duration-500 bg-gray-50 dark:bg-gray-900"
              style={{ borderRadius: `${borderRadius * 200}px` }}
            >
              <img 
                src={images[currentIndex].src} 
                alt={images[currentIndex].title} 
                className="w-full h-full object-contain md:object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-40" />
            </div>
            
            <div className="mt-8 flex flex-col items-center">
              <motion.h3 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl md:text-2xl font-bold tracking-tight text-text-emphasis text-center px-4"
              >
                {images[currentIndex].title}
              </motion.h3>
              <div className="mt-2 h-1 w-24 bg-[#2d90c4] rounded-full" />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-6 flex flex-col items-center gap-2 pointer-events-none">
        <p className="text-xs font-semibold opacity-40 uppercase tracking-[0.3em] text-text-secondary dark:text-text-tertiary">
          Galería UNEFA
        </p>
        <div className="h-px w-12 bg-border-light dark:bg-border-dark" />
      </div>
    </div>
  );
};

export default CircularGallery;
