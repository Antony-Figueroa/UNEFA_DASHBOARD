import { motion } from "framer-motion";

/**
 * UnefaBanner Component
 * Muestra la imagen estática del banner de UNEFA.
 * ponytail: scraping deshabilitado en cloud — se usa /banner.jpeg directamente.
 */
export default function UnefaBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-xl"
    >
      <a
        href="http://www.unefa.edu.ve/portal/"
        target="_blank"
        rel="noopener noreferrer"
        className="block relative w-full overflow-hidden rounded-2xl sm:rounded-3xl aspect-[16/5]"
      >
        <img
          src="/banner.jpeg"
          alt="Banner UNEFA - Ir al portal oficial"
          className="w-full h-full object-cover"
        />
      </a>
    </motion.div>
  );
}
