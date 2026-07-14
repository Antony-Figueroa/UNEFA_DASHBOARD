import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { unefaBannerService } from "../../features/internship-home/services/unefaBannerService";
import { Skeleton } from "../ui/skeleton";

/**
 * UnefaBanner Component
 * Muestra la imagen del banner oficial de UNEFA (scrapeada automáticamente)
 * en un contenedor con el mismo diseño que el WelcomeBanner.
 * Muestra un skeleton shimmer mientras carga.
 */
export default function UnefaBanner() {
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [bannerLoaded, setBannerLoaded] = useState(false);
  const [bannerError, setBannerError] = useState(false);

  useEffect(() => {
    let mounted = true;
    unefaBannerService.getBannerInfo().then((data) => {
      if (!mounted) return;
      const url = data.status === 'ok' && data.imageUrl ? data.imageUrl : null;
      if (url) {
        // Precargar la imagen antes de mostrarla
        const img = new Image();
        img.onload = () => {
          if (mounted) {
            setBannerUrl(url);
            setBannerLoaded(true);
          }
        };
        img.onerror = () => {
          if (mounted) setBannerError(true);
        };
        img.src = url;
      } else {
        if (mounted) setBannerError(true);
      }
    }).catch(() => {
      if (mounted) setBannerError(true);
    });
    return () => { mounted = false; };
  }, []);

  // Mostrar skeleton mientras se obtiene la URL o se precarga la imagen
  if (!bannerLoaded && !bannerError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-xl"
      >
        <Skeleton className="w-full aspect-[16/5] rounded-2xl sm:rounded-3xl" animation="shimmer" />
      </motion.div>
    );
  }

  // Si hubo error, no renderizar nada
  if (bannerError) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-xl cursor-pointer"
    >
      <a
        href="http://www.unefa.edu.ve/portal/"
        target="_blank"
        rel="noopener noreferrer"
        className="block relative w-full overflow-hidden rounded-2xl sm:rounded-3xl aspect-[16/5]"
      >
        {bannerUrl && (
          <img
            src={bannerUrl}
            alt="Banner UNEFA - Ir al portal oficial"
            className="w-full h-full object-cover"
            style={{
              opacity: bannerLoaded ? 1 : 0,
              transition: 'opacity 0.5s ease-in-out',
            }}
            onLoad={() => setBannerLoaded(true)}
            onError={() => setBannerError(true)}
          />
        )}

      </a>
    </motion.div>
  );
}
