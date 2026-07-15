import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { unefaBannerService, CarouselImage } from "../services/unefaBannerService";
import { ExternalLink } from "lucide-react";

/**
 * UnefaCarousel Component
 * Muestra un carrusel con las imágenes popup del portal oficial de UNEFA.
 * Se conecta al scraper automático para obtener las imágenes actualizadas.
 */
const UnefaCarousel: React.FC = () => {
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  useEffect(() => {
    let mounted = true;
    unefaBannerService.getCarouselImages().then((data) => {
      if (mounted && data.length > 0) {
        setImages(data);
      }
      if (mounted) setLoading(false);
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  // Auto-play cada 6 segundos
  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 12000);
    return () => clearInterval(timer);
  }, [images.length]);

  if (loading) return null;

  // Si no hay imágenes cargadas o todas fallaron, usar banner.jpeg como fallback
  const hasImages = images.length > 0;
  const allFailed = hasImages && failedImages.size >= images.length;

  if (!hasImages || allFailed) {
    return (
      <section className="py-12 bg-white dark:bg-bg-dark border-t border-border-light dark:border-border-dark">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-text-primary dark:text-white">
              Información de Interés
            </h2>
            <p className="text-text-secondary dark:text-text-tertiary mt-1">
              Avisos y convocatorias del portal UNEFA
            </p>
          </div>
          <div className="relative overflow-hidden rounded-2xl shadow-theme-md border border-border-light dark:border-border-dark">
            <img
              src="/banner.jpeg"
              alt="Información UNEFA"
              className="w-full h-auto block"
              loading="lazy"
            />
          </div>
        </div>
      </section>
    );
  }

  const current = images[currentIndex];

  return (
    <section className="py-12 bg-white dark:bg-bg-dark border-t border-border-light dark:border-border-dark">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-text-primary dark:text-white">
            Información de Interés
          </h2>
          <p className="text-text-secondary dark:text-text-tertiary mt-1">
            Avisos y convocatorias del portal UNEFA
          </p>
        </div>

        <div className="relative">
          {/* Slide actual */}
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative overflow-hidden rounded-2xl shadow-theme-md border border-border-light dark:border-border-dark bg-gray-50 dark:bg-gray-900"
          >
            <a
              href={current.link || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <div className="relative bg-white">
                {failedImages.has(currentIndex) ? (
                  <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-text-tertiary text-sm min-h-[200px]">
                    Imagen no disponible
                  </div>
                ) : (
                  <img
                    src={current.src}
                    alt={current.title || 'Información UNEFA'}
                    className="w-full h-auto block bg-white transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    onError={() => setFailedImages((prev) => new Set(prev).add(currentIndex))}
                  />
                )}

                {/* Tooltip hover */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 pointer-events-none z-10">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900/90 text-white text-xs font-medium shadow-lg backdrop-blur-sm whitespace-nowrap">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Abrir PDF
                  </span>
                </div>
              </div>
              {current.title && (
                <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-t border-border-light dark:border-border-dark">
                  <span className="text-sm font-medium text-text-primary dark:text-white">
                    {current.title}
                  </span>
                  <ExternalLink className="w-4 h-4 text-brand-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>
              )}
            </a>
          </motion.div>

          {/* Navegación de puntos */}
          {images.length > 1 && (
            <div className="flex items-center justify-center gap-2 mt-5">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    idx === currentIndex
                      ? 'bg-brand-500 w-6'
                      : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
                  }`}
                  aria-label={`Ir a imagen ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {/* Flechas de navegación */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 transition-colors z-10"
                aria-label="Anterior"
              >
                <svg className="w-5 h-5 text-gray-700 dark:text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentIndex((prev) => (prev + 1) % images.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 transition-colors z-10"
                aria-label="Siguiente"
              >
                <svg className="w-5 h-5 text-gray-700 dark:text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default UnefaCarousel;
