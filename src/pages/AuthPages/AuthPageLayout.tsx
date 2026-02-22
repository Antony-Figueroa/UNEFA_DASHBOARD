import React, { useEffect, useMemo } from "react";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";
import { motion } from "framer-motion";
import { Spotlight } from "../../components/ui/spotlight/Spotlight";
import { useTheme } from "../../context/theme";

const preloadImages = [
  '/unefa-img/fondo-login.png',
  '/logo-nuevo.png',
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useTheme();

  const spotlightColor = useMemo(() => {
    return theme === 'dark' ? '#3B9FD8' : '#67baff';
  }, [theme]);

  const spotlightKey = useMemo(() => `spotlight-${theme}`, [theme]);

  useEffect(() => {
    preloadImages.forEach((src) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });
    
    return () => {
      preloadImages.forEach((src) => {
        const link = document.querySelector(`link[rel="preload"][href="${src}"]`);
        if (link) document.head.removeChild(link);
      });
    };
  }, []);

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-white dark:bg-gray-900">
      <Spotlight
        key={spotlightKey}
        className="top-0 left-0"
        fill={spotlightColor}
      />

      <div className="w-full lg:w-[55%] relative flex flex-col min-h-screen bg-transparent">
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03] z-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, #054F94 1px, transparent 1px),
              linear-gradient(to bottom, #054F94 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px'
          }}
        />

        <div className="relative z-20 flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>

        <div className="relative z-20 flex items-center justify-between px-6 lg:px-10 py-4 border-t border-slate-100 dark:border-gray-800">
          <ThemeTogglerTwo />
          <div className="text-xs text-slate-400 dark:text-gray-600">
            © {new Date().getFullYear()} UNEFA
          </div>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-[45%] p-4 items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full h-[calc(100vh-32px)] rounded-3xl overflow-hidden relative"
        >
          <img
            src="/unefa-img/fondo-login.png"
            alt="UNEFA"
            className="absolute inset-0 w-full h-full object-cover"
          />

          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(160deg, rgba(5,79,148,0.92) 0%, rgba(6,61,110,0.88) 50%, rgba(3,42,77,0.95) 100%)',
            }}
          />

          <div className="absolute inset-0 flex flex-col items-center justify-between p-8 lg:p-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col items-center text-center"
            >
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-white/5 rounded-full blur-3xl scale-150" />
                <img
                  src="/logo-nuevo.png"
                  alt="UNEFA"
                  className="relative w-32 h-32 lg:w-40 lg:h-40 object-contain"
                />
              </div>

              <h1 className="text-2xl lg:text-3xl font-bold text-white leading-tight mb-3 tracking-tight">
                Sistema de Gestión de
                <br />
                Prácticas Profesionales
              </h1>

              <div className="w-12 h-0.5 bg-amber-500 rounded-full" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col items-center text-center"
            >
              <p className="text-white/90 text-sm font-medium mb-1">
                Universidad Nacional Experimental
              </p>
              <p className="text-white/50 text-xs">
                Politécnica de la Fuerza Armada Nacional Bolivariana
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
