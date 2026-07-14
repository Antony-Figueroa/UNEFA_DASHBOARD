import React, { memo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { unefaBannerService, BannerData } from "../services/unefaBannerService";

const HeroSection: React.FC = memo(() => {
  const [banner, setBanner] = useState<BannerData | null>(null);
  const [bannerLoaded, setBannerLoaded] = useState(false);
  const [bannerError, setBannerError] = useState(false);
  const heroImageUrl = banner?.imageUrl || banner?.fallbackImage || '/unefa-img/9360.jpg';

  useEffect(() => {
    let mounted = true;
    unefaBannerService.getBannerInfo().then((data) => {
      if (mounted) {
        setBanner(data);
        if (data.status === 'ok' && data.imageUrl) {
          const img = new Image();
          img.onload = () => { if (mounted) setBannerLoaded(true); };
          img.onerror = () => { if (mounted) setBannerError(true); };
          img.src = data.imageUrl;
        } else {
          const img = new Image();
          img.onload = () => { if (mounted) setBannerLoaded(true); };
          img.onerror = () => { if (mounted) setBannerError(true); };
          img.src = data.fallbackImage;
        }
      }
    }).catch(() => { if (mounted) setBannerError(true); });
    return () => { mounted = false; };
  }, []);

  if (bannerError && !bannerLoaded) return null;

  return (
    <section
      id="inicio"
      className="relative w-full overflow-hidden bg-gray-50 dark:bg-gray-950"
    >
      {bannerLoaded && (
        <motion.img
          src={heroImageUrl}
          alt="Banner UNEFA"
          className="w-full h-auto block"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      )}
      {!bannerLoaded && (
        <div className="w-full aspect-[16/5] md:aspect-[16/4] bg-gray-100 dark:bg-gray-900 animate-pulse" />
      )}
    </section>
  );
});

export default HeroSection;
