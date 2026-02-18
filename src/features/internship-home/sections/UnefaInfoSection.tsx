import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { unefaInfoService, UnefaInfo } from "../../../services/unefaInfoService";
import Button from "../../../components/ui/button/Button";
import { RefreshIcon } from "../../../icons/actions";
import { Skeleton } from "../../../components/ui/skeleton";

interface UnefaInfoSectionProps {
  updateIntervalMs?: number; // Tiempo de actualización automática en ms
}

const UnefaInfoSection: React.FC<UnefaInfoSectionProps> = ({ 
  updateIntervalMs = 3600000 // 1 hora por defecto
}) => {
  const [info, setInfo] = useState<UnefaInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadInfo = useCallback(async (force = false) => {
    setIsLoading(true);
    try {
      // Simular una pequeña latencia para que el usuario perciba la actualización
      if (force) await new Promise(resolve => setTimeout(resolve, 800));
      
      const data = await unefaInfoService.getUnefaInfo(force);
      setInfo(data);
    } catch (err) {
      // Manejo silencioso del error: se registra en consola pero no se muestra al usuario
      console.error("[UnefaInfoSection] Error al cargar información:", err);
      // Intentar cargar desde fallback si el servicio no lo hizo automáticamente
      const fallback = await unefaInfoService.getUnefaInfo(false);
      if (fallback) setInfo(fallback);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carga inicial y temporizador
  useEffect(() => {
    loadInfo();

    const timer = setInterval(() => {
      loadInfo(true);
    }, updateIntervalMs);

    return () => clearInterval(timer);
  }, [loadInfo, updateIntervalMs]);

  return (
    <section className="py-16 bg-white dark:bg-bg-dark border-y border-border-light dark:border-border-dark overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center gap-12">
          
          {/* Columna de Texto */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-text-primary dark:text-white">
                Información Institucional
              </h2>
            </div>

            <AnimatePresence mode="wait">
              {isLoading && !info ? (
                <motion.div
                  key="skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <Skeleton height={32} className="w-3/4" />
                  <Skeleton height={16} className="w-full" />
                  <Skeleton height={16} className="w-full" />
                  <Skeleton height={16} className="w-2/3" />
                </motion.div>
              ) : info ? (
                <motion.div
                  key={info.timestamp}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-4"
                >
                  <h3 className="text-xl font-semibold text-brand-500">
                    {info.title}
                  </h3>
                  <p className="text-lg text-text-secondary dark:text-text-tertiary leading-relaxed">
                    {info.extract}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-text-tertiary">
                    <span>Fuente: {info.source}</span>
                    <span>•</span>
                    <span>Última actualización: {new Date(info.timestamp).toLocaleTimeString()}</span>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Columna de Imagen */}
          <div className="flex-1 w-full max-w-lg">
            <AnimatePresence mode="wait">
              <motion.div
                key={info?.thumbnail || 'default'}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5 }}
                className="relative aspect-video md:aspect-square rounded-2xl overflow-hidden shadow-theme- border border-border-light dark:border-border-dark"
              >
                {info?.thumbnail ? (
                  <div className="w-full h-full bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center group">
                    <img
                      src={info.thumbnail}
                      alt={info.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/unefa-img/hero-bg.jpg";
                      }}
                    />
                    
                    {/* Atribución de Imagen */}
                    {info.imageAttribution && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm text-white p-2 text-xs translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        Foto por{" "}
                        <a 
                          href={info.imageAttribution.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="underline hover:text-brand-300"
                        >
                          {info.imageAttribution.photographer}
                        </a>{" "}
                        en{" "}
                        <a 
                          href="https://unsplash.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="underline hover:text-brand-300"
                        >
                          Unsplash
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <img 
                      src="/logo-nuevo.png" 
                      alt="Logo UNEFA" 
                      className="w-32 opacity-20"
                    />
                  </div>
                )}
                <div className="absolute inset-0 from-black/40 to-transparent pointer-events-none" />
              </motion.div>
            </AnimatePresence>
                          <Button
                variant="outline"
                size="sm"
                onClick={() => loadInfo(true)}
                disabled={isLoading}
                className="flex items-center gap-2 min-w-3 justify-center mt-3"
              >
                <motion.div
                  animate={isLoading ? { rotate: 360 } : { rotate: 0 }}
                  transition={isLoading ? { repeat: Infinity, duration: 1, ease: "linear" } : { duration: 0.5 }}
                >
                  <RefreshIcon className="w-4 h-4" />
                </motion.div>
                {isLoading ? "Actualizando..." : "Actualizar"}
              </Button>
          </div>

        </div>
      </div>
    </section>
  );
};

export default UnefaInfoSection;