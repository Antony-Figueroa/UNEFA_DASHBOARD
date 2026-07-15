import React, { memo } from "react";
import { motion } from "framer-motion";

const HeroSection: React.FC = memo(() => {
  return (
    <section
      id="inicio"
      className="relative w-full overflow-hidden bg-gray-50 dark:bg-gray-950"
    >
      <motion.img
        src="/banner.jpeg"
        alt="Banner UNEFA"
        className="w-full h-auto block"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </section>
  );
});

export default HeroSection;
