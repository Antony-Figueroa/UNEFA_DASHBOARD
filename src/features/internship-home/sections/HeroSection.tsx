import React from "react";
import { Link } from "react-router";
import Button from "../../../components/ui/button/Button";
import Badge from "../../../components/ui/badge/Badge";
import RotatingText from "../components/RotatingText";
import CountUp from "../components/CountUp";
import { motion } from "framer-motion";
import { smoothScrollTo } from "../../../utils/scrollUtils";

const HeroSection: React.FC = () => {
  const rowCount = 15;
  const logosPerRow = 25;

  return (
    <section id="inicio" className="relative overflow-hidden bg-white pt-16 pb-24 dark:bg-bg-dark lg:pt-24 lg:pb-32">
      <style>
        {`
          @keyframes scroll-right {
            from { transform: translateX(-50%); }
            to { transform: translateX(0); }
          }
          @keyframes scroll-left {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
          .logo-row {
            display: flex;
            white-space: nowrap;
            width: fit-content;
            margin: -5px 0;
          }
          .logo-item {
            padding: 15px 30px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.3s ease;
            pointer-events: auto;
          }
          .logo-item:hover {
            transform: scale(1.2);
            filter: brightness(1.2);
          }
          .animate-scroll-right {
            animation: scroll-right 60s linear infinite;
          }
          .animate-scroll-left {
            animation: scroll-left 60s linear infinite;
          }
        `}
      </style>

      <motion.div
        className="absolute inset-0 z-0 overflow-hidden"
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.div
          className="absolute -inset-full opacity-10 flex flex-col justify-center items-center"
          style={{
            transform: 'rotate(15deg)',
            filter: 'grayscale(1) brightness(1.5)',
          }}
          animate={{
            rotate: [15, 18, 15],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {Array.from({ length: rowCount }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className={`logo-row ${rowIndex % 2 === 0 ? 'animate-scroll-right' : 'animate-scroll-left'}`}
            >
              {Array.from({ length: logosPerRow * 2 }).map((_, logoIndex) => (
                <div key={logoIndex} className="logo-item">
                  <img
                    src="/logo-nuevo.png"
                    alt=""
                    className="w-12.5 h-12.5 object-contain"
                  />
                </div>
              ))}
            </div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div 
        className="absolute top-0 right-0 -translate-y-12 translate-x-12 opacity-20 dark:opacity-10 pointer-events-none"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 0.2, x: 0 }}
        transition={{ duration: 1, delay: 0.3 }}
      >
        <div className="h-64 w-64 rounded-full bg-brand-200 blur-3xl" />
      </motion.div>
      
      <motion.div 
        className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 opacity-20 dark:opacity-10 pointer-events-none"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 0.2, x: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        <div className="h-64 w-64 rounded-full bg-success-200 blur-3xl" />
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
          <div className="relative z-10 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <Badge color="success" variant="light" size="md" className="font-semibold">
                    Inicia tu futuro profesional
                  </Badge>
                </motion.div>
                
                <motion.h1 
                  className="text-4xl font-extrabold tracking-tight text-text-emphasis sm:text-5xl lg:text-6xl flex flex-wrap items-center gap-x-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  Impulsa tu carrera con
                  <RotatingText
                    texts={['Creatividad', 'Excelencia', 'Valor', 'Éxito']}
                    mainClassName="px-2 sm:px-2 md:px-3 bg-[#2d90c4] text-white overflow-hidden py-0.5 sm:py-1 md:py-2 justify-center rounded-lg"
                    staggerFrom={"last"}
                    initial={{ y: "100%" }}
                    animate={{ y: "0%" }}
                    exit={{ y: "-120%" }}
                    staggerDuration={0.025}
                    splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
                    transition={{ type: "spring", damping: 30, stiffness: 400 }}
                    rotationInterval={3000}
                  />
                </motion.h1>
                
                <motion.p 
                  className="max-w-xl text-lg text-text-secondary sm:text-xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  Conectamos estudiantes talentosos de la UNEFA con las mejores oportunidades en el sector público y privado para transformar su potencial en experiencia real.
                </motion.p>
              </div>
            </motion.div>

            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link to="/signin">
                  <Button variant="primary" size="md" className="px-8 w-full sm:w-auto">
                    Comenzar ahora
                  </Button>
                </Link>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline"
                  size="md"
                  className="px-8"
                  onClick={() => smoothScrollTo("procesos")}
                >
                  Saber más
                </Button>
              </motion.div>
            </motion.div>

            <motion.div
              className="flex items-center gap-6 pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="h-10 w-10 rounded-full border-2 border-white bg-gray-200 dark:border-bg-dark overflow-hidden"
                    whileHover={{ scale: 1.1, zIndex: 10 }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                  >
                    <img
                      src={`/images/user/user-0${i}.jpg`}
                      alt="User"
                      className="h-full w-full object-cover"
                    />
                  </motion.div>
                ))}
              </div>
              <p className="text-sm text-text-secondary">
                <span className="font-bold text-text-emphasis">
                  + de <CountUp from={0} to={3200} separator="," duration={1.5} />
                </span> estudiantes han impulsado su carrera con nosotros a lo largo de los años.
              </p>
            </motion.div>
          </div>

          <motion.div 
            className="relative transition-all duration-300 ease-in-out hidden lg:block md:scale-75 min-[1200px]:scale-100 origin-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
              <motion.div
                className="aspect-square md:aspect-4/5 overflow-hidden rounded-3xl bg-gray-50 dark:bg-gray-900 shadow-theme-xl border border-border-light dark:border-border-dark"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <motion.img
                  src="/unefa-img/9360.jpg"
                  alt="UNEFA Community"
                  className="h-full w-full object-cover object-top"
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.5 }}
                />
              </motion.div>
              
              <motion.div
                className="absolute -bottom-6 -left-6 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-border-light dark:border-border-dark"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
                    <svg className="h-6 w-6 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-text-emphasis">+95%</p>
                    <p className="text-xs text-text-secondary">Éxito laboral</p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                className="absolute -top-4 -right-4 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-border-light dark:border-border-dark"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                    <svg className="h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-text-emphasis">200+</p>
                    <p className="text-xs text-text-secondary">Empresas aliadas</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
