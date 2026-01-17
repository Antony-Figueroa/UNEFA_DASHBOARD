import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Map from "../../../components/ui/map/Map";

type MapThemeId = "light" | "dark" | "satellite" | "voyager";

const UnefaMapSection: React.FC = () => {
  const [activeTheme, setActiveTheme] = useState<MapThemeId>("light");
  const unefaAraurePos = useMemo<[number, number]>(() => [-69.219552, 9.569627], []);
  
  const markers = useMemo(() => [
    {
      position: unefaAraurePos,
      popup: "<div class='text-center'><b>UNEFA Extensión Araure</b><br/><span class='text-xs'>Av. 13 de Junio</span></div>"
    }
  ], [unefaAraurePos]);

  const [mapKey, setMapKey] = useState(0);

  const handleLocate = () => {
    setMapKey(prev => prev + 1);
  };

  const themes = [
    { 
      id: "light", 
      label: "Claro", 
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.243 3.05a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zM17 10a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM14.243 16.95a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM10 17a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm-4.243-3.05a1 1 0 01-1.414 0l-.707-.707a1 1 0 011.414-1.414l.707.707a1 1 0 010 1.414zM3 10a1 1 0 011-1H3a1 1 0 110 2H4a1 1 0 01-1-1zm.707-4.243a1 1 0 010-1.414l.707-.707a1 1 0 111.414 1.414L4.414 5.757a1 1 0 01-1.414 0zM10 5a5 5 0 100 10 5 5 0 000-10z" clipRule="evenodd" />
        </svg>
      )
    },
    { 
      id: "dark", 
      label: "Oscuro", 
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )
    },
    { 
      id: "satellite", 
      label: "Satélite", 
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
        </svg>
      )
    },
    { 
      id: "voyager", 
      label: "Explorar", 
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd" />
        </svg>
      )
    }
  ] as const;

  return (
    <section className="py-20 bg-gray-50 dark:bg-bg-dark/50 border-y border-border-light dark:border-border-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          
          {/* Texto Informativo */}
          <div className="flex-1 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary dark:text-white mb-4">
                Ubicación Estratégica
              </h2>
              <p className="text-lg text-text-secondary dark:text-text-tertiary leading-relaxed">
                Nuestra sede principal de la Extensión Araure está ubicada en un punto clave de Portuguesa, 
                rodeada de servicios esenciales y fácil acceso para toda la comunidad universitaria.
              </p>
            </motion.div>

            <div className="grid grid-cols-2 gap-3 md:gap-6">
              <motion.div 
                className="flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-white/5 border border-border-light dark:border-border-dark shadow-sm h-full"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="p-3 rounded-xl bg-brand-500/10 text-brand-500 shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-text-primary dark:text-white">Dirección</h4>
                  <p className="text-sm text-text-secondary dark:text-text-tertiary">
                    Av. 23 con Calle 6, Araure 3303, Portuguesa, Venezuela.
                  </p>
                </div>
              </motion.div>

              <motion.div 
                className="flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-white/5 border border-border-light dark:border-border-dark shadow-sm h-full"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="p-3 rounded-xl bg-brand-500/10 text-brand-500 shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-text-primary dark:text-white">Conectividad</h4>
                  <p className="text-sm text-text-secondary dark:text-text-tertiary">
                    A metros del Terminal de Araure y cerca de las principales vías de Acarigua.
                  </p>
                </div>
              </motion.div>
            </div>

            <div className="flex flex-wrap gap-3">
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-3"
              >
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${unefaAraurePos[1]},${unefaAraurePos[0]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-500 text-white font-bold hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/20"
                >
                  <span>Ver en Google Maps</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </motion.div>
            </div>
          </div>

          {/* Mapa */}
          <motion.div 
            className="w-full lg:flex-1 h-100 sm:h-112.5 lg:h-150 rounded-3xl overflow-hidden border border-border-light dark:border-border-dark shadow-2xl relative"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <Map 
              key={mapKey}
              center={unefaAraurePos}
              zoom={14}
              markers={markers}
              mapStyle={activeTheme}
              className="w-full h-full"
            />
            
            {/* Panel de Control Flotante */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 p-1.5 bg-white/90 dark:bg-bg-dark/90 backdrop-blur-md rounded-2xl border border-border-light dark:border-border-dark shadow-xl">
              {/* Botón de Ubicación */}
              <button
                onClick={handleLocate}
                className="p-2.5 rounded-xl transition-all duration-200 group relative text-brand-500 hover:bg-brand-500/10"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2 py-1 rounded bg-bg-dark text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-xl border border-white/10">
                  Centrar en UNEFA
                </span>
              </button>

              <div className="h-px bg-border-light dark:bg-border-dark mx-1" />

              {/* Selector de Temas */}
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTheme(t.id)}
                  className={`p-2.5 rounded-xl transition-all duration-200 group relative ${
                    activeTheme === t.id 
                      ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30" 
                      : "text-text-secondary dark:text-text-tertiary hover:bg-gray-100 dark:hover:bg-white/10"
                  }`}
                >
                  {t.icon}
                  {/* Tooltip centrado verticalmente */}
                  <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2 py-1 rounded bg-bg-dark text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-xl border border-white/10">
                    {t.label}
                  </span>
                </button>
              ))}
            </div>

          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default UnefaMapSection;
