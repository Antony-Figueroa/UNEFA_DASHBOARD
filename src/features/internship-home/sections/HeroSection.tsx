import React from "react";
import { Link } from "react-router";
import Button from "../../../components/ui/button/Button";
import Badge from "../../../components/ui/badge/Badge";
import RotatingText from "../components/RotatingText";
import CountUp from "../components/CountUp";

// Fix typos in the file
import { smoothScrollTo } from "../../../utils/scrollUtils";

const HeroSection: React.FC = () => {
  const rowCount = 15; // Aumentado para cubrir mejor el fondo
  const logosPerRow = 25; // Aumentado para asegurar que no haya espacios laterales

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
            margin: -5px 0; /* Reducir espacio vertical entre filas */
          }
          .logo-item {
            padding: 15px 30px; /* Ajustado: menos vertical, más horizontal */
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
      {/* Animación de entrada para el título principal */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-8 text-center"
      >
        <h1 className="text-4xl font-bold text-brand-600 dark:text-brand-400">Bienvenido a Prácticas UNEFA</h1>
      </motion.div>
      {/* Animación de zoom en el botón principal */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="flex justify-center mb-6"
      >
        <Button>Comenzar</Button>
      </motion.div>
      {/* Animación de logos: ya tienen hover, se mantiene */}

      {/* Patrón de fondo con logo de la UNEFA animado */}
      <div
        className="absolute inset-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute -inset-full opacity-10 flex flex-col justify-center items-center"
          style={{
            transform: 'rotate(15deg)',
            filter: 'grayscale(1) brightness(1.5)',
          }}
        >
          {Array.from({ length: rowCount }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className={`logo-row ${rowIndex % 2 === 0 ? 'animate-scroll-right' : 'animate-scroll-left'}`}
            >
              {/* Duplicamos los logos para el efecto de loop infinito */}
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
        </div>
      </div>

      {/* Background Shapes (Placeholders) */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 opacity-20 dark:opacity-10">
        <div className="h-64 w-64 rounded-full bg-brand-200 blur-3xl" />
      </div>
      <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 opacity-20 dark:opacity-10">
        <div className="h-64 w-64 rounded-full bg-success-200 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
          {/* Left Column: Content */}
          <div className="relative z-10 space-y-8">
            <div className="space-y-4">
              <Badge color="success" variant="light" size="md" className="font-semibold">
                Inicia tu futuro profesional
              </Badge>
              <h1 className="text-4xl font-extrabold tracking-tight text-text-emphasis sm:text-5xl lg:text-6xl flex flex-wrap items-center gap-x-3">
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
              </h1>
              <p className="max-w-xl text-lg text-text-secondary sm:text-xl">
                Conectamos estudiantes talentosos de la UNEFA con las mejores oportunidades en el sector público y privado para transformar su potencial en experiencia real.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
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
            </div>

            {/* Floating Stats Placeholder */}
            <div className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-10 w-10 rounded-full border-2 border-white bg-gray-200 dark:border-bg-dark"
                  >
                    <img
                      src={`/images/user/user-0${i}.jpg`}
                      alt="User"
                      className="h-full w-full rounded-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <p className="text-sm text-text-secondary">
                <span className="font-bold text-text-emphasis">
                  + de <CountUp from={0} to={3200} separator="," duration={1.5} />
                </span> estudiantes han impulsado su carrera con nosotros a lo largo de los años.
              </p>
            </div>
          </div>

          {/* Right Column: Image */}
          <div className="relative transition-all duration-300 ease-in-out hidden lg:block md:scale-75 min-[1200px]:scale-100 origin-center">
            <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
              {/* Main Image Placeholder */}
              <div className="aspect-square md:aspect-4/5 overflow-hidden rounded-3xl bg-gray-50 dark:bg-gray-900 shadow-theme-xl border border-border-light dark:border-border-dark">
                <img
                  src="/unefa-img/9360.jpg"
                  alt="UNEFA Community"
                  className="h-full w-full object-cover object-top transition-transform duration-500 hover:scale-105"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
