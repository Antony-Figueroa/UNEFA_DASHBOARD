import React from "react";
import { motion } from "framer-motion";
import { FaBullseye, FaEye } from "react-icons/fa6";

const MissionVisionSection: React.FC = () => {
  return (
    <section id="mision-vision" className="py-20 bg-white dark:bg-bg-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Misión */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative p-8 rounded-3xl bg-bg-secondary/40 dark:bg-white/5 border border-border-light dark:border-white/10 transition-all duration-300 hover:shadow-theme-lg group"
          >
            <div className="flex items-center gap-4 mb-6">
              <motion.div
                whileHover={{ scale: 1.15, rotate: 10 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-theme-sm group-hover:scale-110 transition-transform duration-300"
              >
                <FaBullseye className="text-2xl" />
              </motion.div>
              <h2 className="text-3xl font-bold text-text-emphasis">Misión</h2>
            </div>
            <p className="text-lg leading-relaxed text-text-secondary dark:text-text-tertiary text-justify">
              Formar a través de la docencia, la investigación y la extensión, ciudadanos corresponsables con la seguridad y Defensa Integral de la Nación, comprometidos con la Revolución Bolivariana, con competencias emancipadoras y humanistas necesarias para sustentar los planes de desarrollo del país, promoviendo la producción y el intercambio de saberes, como mecanismo de integración latinoamericana y caribeña.
            </p>
          </motion.div>

          {/* Visión */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative p-8 rounded-3xl bg-bg-secondary/40 dark:bg-white/5 border border-border-light dark:border-white/10 transition-all duration-300 hover:shadow-theme-lg group"
          >
            <div className="flex items-center gap-4 mb-6">
              <motion.div
                whileHover={{ scale: 1.15, rotate: -10 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-theme-sm group-hover:scale-110 transition-transform duration-300"
              >
                <FaEye className="text-2xl" />
              </motion.div>
              <h2 className="text-3xl font-bold text-text-emphasis">Visión</h2>
            </div>
            <p className="text-lg leading-relaxed text-text-secondary dark:text-text-tertiary text-justify">
              Ser la primera universidad socialista, reconocida por su Excelencia Educativa en el territorio nacional e internacional, líder en los saberes humanistas, científicos, tecnológicos y militares, inspirada en el ideario bolivariano.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default MissionVisionSection;
