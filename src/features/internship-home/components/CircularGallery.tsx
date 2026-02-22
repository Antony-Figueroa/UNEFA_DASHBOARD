import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CircularGalleryProps {
  borderRadius?: number;
}

const CircularGallery: React.FC<CircularGalleryProps> = memo(({ borderRadius = 0.05 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

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

  const handleImageLoad = useCallback((index: number) => {
    setLoadedImages(prev => new Set([...prev, index]));
  }, []);

  useEffect(() => {
    images.forEach((img, index) => {
      const imageLoader = new Image();
      imageLoader.onload = () => handleImageLoad(index);
      imageLoader.src = img.src;
    });
  }, [images, handleImageLoad]);

  const slideVariants = useMemo(() => ({
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  }), []);

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
    const interval = setInterval(() => paginate(1), 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, paginate]);

  return (
    <div 
      className="w-full h-full bg-white dark:bg-bg-dark rounded-3xl overflow-hidden flex flex-col items-center justify-center p-2 md:p-8 border border-border-light dark:border-border-dark relative shadow-theme-md"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      <div className="relative w-full min-h-[500px] flex items-center justify-center overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeInOut" }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.5}
            onDragEnd={(_, info) => {
              if (info.offset.x > 100) paginate(-1);
              else if (info.offset.x < -100) paginate(1);
            }}
            className="absolute w-full max-w-2xl px-4 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing"
          >
            <div 
              className="w-full aspect-video overflow-hidden shadow-lg border border-border-light dark:border-border-dark relative group bg-gray-100 dark:bg-gray-800"
              style={{ borderRadius: `${borderRadius * 200}px` }}
            >
              {!loadedImages.has(currentIndex) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <img 
                src={images[currentIndex].src} 
                alt={images[currentIndex].title} 
                className={`w-full h-full object-contain md:object-cover object-top transition-opacity duration-300 ${
                  loadedImages.has(currentIndex) ? 'opacity-100' : 'opacity-0'
                }`}
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
            </div>
            
            <div className="mt-6 flex flex-col items-center">
              <h3 className="text-lg md:text-xl font-bold tracking-tight text-text-emphasis text-center px-4">
                {images[currentIndex].title}
              </h3>
              <div className="mt-2 h-1 w-20 bg-[#2d90c4] rounded-full" />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2 mt-4">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setDirection(idx > currentIndex ? 1 : -1);
              setCurrentIndex(idx);
            }}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === currentIndex ? 'w-6 bg-brand-500' : 'w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
            }`}
            aria-label={`Ir a imagen ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
});

export default CircularGallery;
