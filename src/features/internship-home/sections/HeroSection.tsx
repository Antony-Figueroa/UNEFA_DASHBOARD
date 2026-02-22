import React, { useMemo, memo } from "react";
import { Link } from "react-router";
import Button from "../../../components/ui/button/Button";
import Badge from "../../../components/ui/badge/Badge";
import RotatingText from "../components/RotatingText";
import CountUp from "../components/CountUp";
import { motion } from "framer-motion";
import { smoothScrollTo } from "../../../utils/scrollUtils";

const HeroSection: React.FC = memo(() => {
  const logoRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < 6; i++) {
      const isEven = i % 2 === 0;
      rows.push(
        <div
          key={i}
          className={`flex whitespace-nowrap ${isEven ? 'animate-scroll-right' : 'animate-scroll-left'}`}
          style={{
            animationDuration: `${40 + i * 5}s`,
            animationDelay: `${i * -5}s`
          }}
        >
          {Array.from({ length: 20 }).map((_, j) => (
            <div key={j} className="px-8 py-4 opacity-[0.04] dark:opacity-[0.03]">
              <img
                src="/logo-nuevo.png"
                alt=""
                className="w-10 h-10 object-contain"
                loading="lazy"
                decoding="async"
              />
            </div>
          ))}
        </div>
      );
    }
    return rows;
  }, []);

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
        `}
      </style>

      <div
        className="absolute inset-0 z-0 overflow-hidden opacity-[0.08] dark:opacity-[0.04]"
        aria-hidden="true"
        style={{ transform: 'rotate(12deg) scale(1.5)' }}
      >
        {logoRows}
      </div>

      <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 opacity-20 dark:opacity-10 pointer-events-none">
        <div className="h-64 w-64 rounded-full bg-brand-200 blur-3xl" />
      </div>
      
      <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 opacity-20 dark:opacity-10 pointer-events-none">
        <div className="h-64 w-64 rounded-full bg-success-200 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-8">
            <div>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <Badge color="success" variant="light" size="md" className="font-semibold">
                  Inicia tu futuro profesional
                </Badge>
              </motion.div>
              
              <motion.h1 
                className="text-4xl font-extrabold tracking-tight text-text-emphasis sm:text-5xl lg:text-6xl flex flex-wrap items-center gap-x-3 mt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
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
                className="max-w-xl text-lg text-text-secondary sm:text-xl mt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Conectamos estudiantes talentosos de la UNEFA con las mejores oportunidades en el sector público y privado para transformar su potencial en experiencia real.
              </motion.p>
            </div>

            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Link to="/signin">
                <Button variant="primary" size="md" className="px-8 w-full sm:w-auto">
                  Comenzar ahora
                </Button>
              </Link>
              
              <Button
                variant="outline"
                size="md"
                className="px-8"
                onClick={() => smoothScrollTo("procesos")}
              >
                Saber más
              </Button>
            </motion.div>

            <motion.div
              className="flex items-center gap-6 pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-10 w-10 rounded-full border-2 border-white bg-gray-200 dark:border-bg-dark overflow-hidden"
                  >
                    <img
                      src={`/images/user/user-0${i}.jpg`}
                      alt="User"
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                ))}
              </div>
              <p className="text-sm text-text-secondary">
                <span className="font-bold text-text-emphasis">
                  + de <CountUp from={0} to={3200} separator="," duration={1.5} />
                </span> estudiantes han impulsado su carrera con nosotros.
              </p>
            </motion.div>
          </div>

          <motion.div 
            className="relative hidden lg:block"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative mx-auto w-full max-w-lg">
              <div className="aspect-square md:aspect-4/5 overflow-hidden rounded-3xl bg-gray-50 dark:bg-gray-900 shadow-theme-xl border border-border-light dark:border-border-dark">
                <img
                  src="/unefa-img/9360.jpg"
                  alt="UNEFA Community"
                  className="h-full w-full object-cover object-top"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                />
              </div>
              
              <motion.div
                className="absolute -bottom-6 -left-6 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-border-light dark:border-border-dark"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
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
                transition={{ delay: 0.6, duration: 0.4 }}
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
});

export default HeroSection;
