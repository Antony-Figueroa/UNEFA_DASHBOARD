import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { unefaInfoService, UnefaInfo } from "../../../services/unefaInfoService";
import Button from "../../../components/ui/button/Button";
import { RefreshIcon } from "../../../icons/actions";
import { Skeleton } from "../../../components/ui/skeleton";

const CACHE_DURATION_MS = 3600000;

const UnefaInfoSection: React.FC = () => {
  const [info, setInfo] = useState<UnefaInfo | null>(() => {
    const cached = localStorage.getItem('unefa_info_cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as UnefaInfo;
        if (Date.now() - parsed.timestamp < CACHE_DURATION_MS) {
          return parsed;
        }
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(!info);

  const loadInfo = useCallback(async (force = false) => {
    if (force) {
      setIsLoading(true);
    }
    
    try {
      const data = await unefaInfoService.getUnefaInfo(force);
      setInfo(data);
    } catch (err) {
      console.error("[UnefaInfoSection] Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!info) {
      loadInfo();
    }
  }, [info, loadInfo]);

  const imageSrc = useMemo(() => info?.thumbnail || "/unefa-img/hero-bg.jpg", [info?.thumbnail]);

  return (
    <section className="py-16 bg-white dark:bg-bg-dark border-y border-border-light dark:border-border-dark overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center gap-12">
          
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
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
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
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="flex-1 w-full max-w-lg">
            <AnimatePresence mode="wait">
              <motion.div
                key={imageSrc}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="relative aspect-video md:aspect-square rounded-2xl overflow-hidden shadow-theme-md border border-border-light dark:border-border-dark"
              >
                <img
                  src={imageSrc}
                  alt={info?.title || "UNEFA"}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/unefa-img/hero-bg.jpg";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
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
                transition={isLoading ? { repeat: Infinity, duration: 1, ease: "linear" } : { duration: 0.3 }}
              >
                <RefreshIcon className="w-4 h-4" />
              </motion.div>
              {isLoading ? "Actualizando..." : "Nueva información"}
            </Button>
          </div>

        </div>
      </div>
    </section>
  );
};

export default UnefaInfoSection;
