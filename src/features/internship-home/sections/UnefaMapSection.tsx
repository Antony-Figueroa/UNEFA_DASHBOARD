import React, { useMemo, useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Map, { MapRef } from "../../../components/ui/map/Map";
import { useTheme } from "../../../context/theme";

type MapThemeId = "light" | "dark" | "satellite" | "voyager";

const UnefaMapSection: React.FC = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const [activeTheme, setActiveTheme] = useState<MapThemeId>(() =>
    isDarkMode ? "dark" : "light"
  );

  useEffect(() => {
    if (activeTheme === "light" || activeTheme === "dark") {
      setActiveTheme(isDarkMode ? "dark" : "light");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDarkMode]);

  const unefaAraurePos = useMemo<[number, number]>(() => [-69.219552, 9.569627], []);
  const mapRef = useRef<MapRef>(null);

  const markers = useMemo(() => [
    {
      position: unefaAraurePos,
      popup: `<b class="text-brand-500">UNEFA Extensión Araure</b><br/><span class="text-gray-500 dark:text-gray-400 text-xs">Av. 13 de Junio, Portuguesa</span>`
    }
  ], [unefaAraurePos]);

  const handleLocate = () => {
    mapRef.current?.flyTo(unefaAraurePos, 16);
  };

  const themes = [
    {
      id: "light" as const,
      label: "Claro",
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 2a1 1 0 011 1v.01a1 1 0 11-2 0V5a1 1 0 011-1zm5 4a1 1 0 010 2h-.01a1 1 0 010-2H19zM5 8a1 1 0 011 1v.01a1 1 0 01-2 0V9a1 1 0 011-1zm1 6a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm5 4a1 1 0 011-1h.01a1 1 0 110 2H12a1 1 0 01-1-1zm4-2a1 1 0 011 1v.01a1 1 0 11-2 0V17a1 1 0 011-1zm-6.536-1.293a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414l-.707-.707zm8.485-8.485a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zM5.636 5.636a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zM10 6a4 4 0 100 8 4 4 0 000-8z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      id: "dark" as const,
      label: "Oscuro",
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )
    },
    {
      id: "satellite" as const,
      label: "Satélite",
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      id: "voyager" as const,
      label: "Colores",
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
        </svg>
      )
    }
  ];

  const handleThemeChange = (themeId: MapThemeId) => {
    setActiveTheme(themeId);
  };

  return (
    <section id="ubicacion" className="py-20 bg-gray-50 dark:bg-bg-dark/50 border-y border-border-light dark:border-border-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12 items-center">

          <div className="flex-1 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary dark:text-white mb-4">
                Ubicación
              </h2>
              <p className="text-lg text-text-secondary dark:text-text-tertiary leading-relaxed">
                Nuestra sede principal de la Extensión Araure está ubicada en un punto clave de Portuguesa,
                rodeada de servicios esenciales y fácil acceso para toda la comunidad universitaria.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.div
                className="flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-white/5 border border-border-light dark:border-border-dark shadow-sm hover:shadow-md transition-shadow"
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
                  <h4 className="font-bold text-text-primary dark:text-white mb-1">Dirección</h4>
                  <p className="text-sm text-text-secondary dark:text-text-tertiary">
                    Av. 23 con Calle 6, Araure 3303, Portuguesa, Venezuela.
                  </p>
                </div>
              </motion.div>

              <motion.div
                className="flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-white/5 border border-border-light dark:border-border-dark shadow-sm hover:shadow-md transition-shadow"
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
                  <h4 className="font-bold text-text-primary dark:text-white mb-1">Conectividad</h4>
                  <p className="text-sm text-text-secondary dark:text-text-tertiary">
                    A metros del Terminal de Araure y cerca de las principales vías de Acarigua.
                  </p>
                </div>
              </motion.div>

              <motion.div
                className="flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-white/5 border border-border-light dark:border-border-dark shadow-sm hover:shadow-md transition-shadow"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="p-3 rounded-xl bg-success-500/10 text-success-500 shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-text-primary dark:text-white mb-1">Contacto</h4>
                  <p className="text-sm text-text-secondary dark:text-text-tertiary">
                    +58 255-1234567 | extension.araure@unefa.edu.ve
                  </p>
                </div>
              </motion.div>

              <motion.div
                className="flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-white/5 border border-border-light dark:border-border-dark shadow-sm hover:shadow-md transition-shadow"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="p-3 rounded-xl bg-warning-500/10 text-warning-500 shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-text-primary dark:text-white mb-1">Horario</h4>
                  <p className="text-sm text-text-secondary dark:text-text-tertiary">
                    Lunes a Viernes: 8:00 AM - 5:00 PM
                  </p>
                </div>
              </motion.div>
            </div>

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
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/20 hover:shadow-xl hover:shadow-brand-500/30 hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span>Google Maps</span>
              </a>
            </motion.div>
          </div>

          <motion.div
            className="w-full lg:flex-1 h-80 sm:h-96 lg:h-125 rounded-3xl overflow-hidden border border-border-light dark:border-border-dark shadow-2xl relative"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <Map
              ref={mapRef}
              center={unefaAraurePos}
              zoom={15}
              markers={markers}
              mapStyle={activeTheme}
              className="w-full h-full"
            />

            <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 p-1.5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl border border-border-light dark:border-border-dark shadow-xl">
              <button
                onClick={handleLocate}
                className="p-2.5 rounded-xl transition-all duration-200 group relative text-brand-500 hover:bg-brand-500/10"
                title="Centrar en UNEFA"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded-lg bg-gray-900 dark:bg-gray-700 text-white text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                  Centrar en UNEFA
                </span>
              </button>

              <div className="h-px bg-border-light dark:bg-border-dark mx-1" />

              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleThemeChange(t.id)}
                  className={`p-2.5 rounded-xl transition-all duration-200 group relative ${activeTheme === t.id
                    ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30"
                    : "text-text-secondary dark:text-text-tertiary hover:bg-gray-100 dark:hover:bg-white/10"
                    }`}
                  title={t.label}
                >
                  {t.icon}
                  <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded-lg bg-gray-900 dark:bg-gray-700 text-white text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
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
