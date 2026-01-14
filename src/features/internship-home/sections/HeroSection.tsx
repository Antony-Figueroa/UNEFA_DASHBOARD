import React from "react";
import { Link } from "react-router";
import Button from "../../../components/ui/button/Button";
import Badge from "../../../components/ui/badge/Badge";
import RotatingText from "../components/RotatingText";
import CountUp from "../components/CountUp";

const HeroSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-white pt-16 pb-24 dark:bg-bg-dark lg:pt-24 lg:pb-32">
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
                  texts={['Creatividad', 'Excelencía', 'Valor', 'Éxito']}
                  mainClassName="px-2 sm:px-2 md:px-3 bg-[#2d90c4] text-white overflow-hidden py-0.5 sm:py-1 md:py-2 justify-center rounded-lg"
                  staggerFrom={"last"}
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
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
              <Button variant="outline" size="md" className="px-8">
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
                </span> estudiantes han impulsado su carrera con nosotros a los largo de los años.
              </p>
            </div>
          </div>

          {/* Right Column: Image */}
          <div className="relative transition-all duration-300 ease-in-out hidden md:block md:scale-75 min-[1200px]:scale-100 origin-center">
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
