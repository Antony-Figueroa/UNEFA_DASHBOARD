import React from "react";
import { motion } from "framer-motion";
import LogoLoop from "../components/LogoLoop";
import { FaFacebook, FaInstagram, FaYoutube, FaGlobe } from "react-icons/fa6";
import { FaXTwitter } from "react-icons/fa6";

const unefaSocialLogos = [
  { node: <FaFacebook />, title: "Facebook", href: "https://www.facebook.com/unefaoficial/" },
  { node: <FaXTwitter />, title: "X (Twitter)", href: "https://twitter.com/unefa_ve" },
  { node: <FaInstagram />, title: "Instagram", href: "https://www.instagram.com/unefa_ve/" },
  { node: <FaYoutube />, title: "YouTube", href: "https://www.youtube.com/@unefa_ve" },
  { node: <FaGlobe />, title: "Sitio Web", href: "http://www.unefa.edu.ve/" },
];

const PartnerLogosSection: React.FC = () => {
  return (
    <section className="py-8 lg:py-12 bg-bg-secondary/30 dark:bg-bg-dark/50 border-y border-border-light dark:border-border-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-8"
        >
          <p className="text-sm font-semibold text-text-tertiary uppercase tracking-widest">
            Nuestra Presencia Digital
          </p>
        </motion.div>
        <div className="relative">
          {/* Animación de logos: scale y rotate en hover */}
          <LogoLoop
            logos={unefaSocialLogos}
            speed={30}
            direction="left"
            logoHeight={32}
            gap={60}
            scaleOnHover
            fadeOut
            fadeOutColor="transparent"
            ariaLabel="Redes Sociales UNEFA"
          />
        </div>
      </div>
    </section>
  );
};

export default PartnerLogosSection;
