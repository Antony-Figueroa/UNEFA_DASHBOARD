import React from "react";
import { Link } from "react-router";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";
import { motion } from "framer-motion";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      <div className="w-full lg:w-[55%] bg-white dark:bg-gray-900 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-8 lg:p-16 xl:p-20">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>

      <div className="hidden lg:block lg:w-[45%] relative p-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full h-screen rounded-[2rem] overflow-hidden relative"
          style={{
            background: 'linear-gradient(135deg, #054F94 0%, #0A6FBF 50%, #054F94 100%)',
          }}
        >
          <img
            src="/unefa-img/fondo-login.png"
            alt="UNEFA"
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

          <div className="absolute inset-0 flex flex-col justify-between p-10">
            <div />

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col items-center text-center"
            >
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-white/10 rounded-full blur-2xl scale-150" />
                <img
                  src="/logo-nuevo.png"
                  alt="UNEFA"
                  className="relative w-28 h-28 object-contain drop-shadow-2xl"
                />
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
                SIGP - UNEFA
              </h2>
              
              <p className="text-white/70 text-sm max-w-xs leading-relaxed">
                Sistema de Información para la Gestión de Prácticas Profesionales
              </p>
              
              <div className="mt-6 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                <div className="size-2 rounded-full bg-[#3B9FD8]" />
                <span className="text-xs font-medium text-white/80">Sistema Activo</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                  <svg className="size-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Universidad Nacional Experimental</p>
                  <p className="text-xs text-white/60">Politécnica de la Fuerza Armada</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="size-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <svg className="size-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button className="size-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <svg className="size-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </motion.div>
          </div>

          <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 200 400" preserveAspectRatio="none">
              <defs>
                <linearGradient id="authLineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3B9FD8" stopOpacity="0" />
                  <stop offset="50%" stopColor="#3B9FD8" stopOpacity="1" />
                  <stop offset="100%" stopColor="#3B9FD8" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1="100" y1="0" x2="100" y2="400" stroke="url(#authLineGradient)" strokeWidth="2" />
            </svg>
          </div>
        </motion.div>
      </div>

      <div className="fixed z-50 bottom-6 right-6 lg:right-auto lg:left-[55%] lg:ml-6">
        <ThemeTogglerTwo />
      </div>
    </div>
  );
}
