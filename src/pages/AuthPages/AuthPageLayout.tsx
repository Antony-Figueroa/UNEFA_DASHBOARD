import React from "react";
import { Link } from "react-router";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6 bg-bg-main z-1 dark:bg-bg-dark sm:p-0">
      <div className="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-bg-dark sm:p-0">
        {children}
        <div 
          className="items-center hidden w-full h-full lg:w-1/2 lg:grid relative overflow-hidden"
          style={{
            backgroundImage: 'url("/unefa-img/fondo-login.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {/* Overlay to ensure text readability */}
          <div className="absolute inset-0 bg-brand-950/40 backdrop-blur-[2px]"></div>
          
          <div className="relative flex items-center justify-center z-1">
            <div className="flex flex-col items-center max-w-sm px-6">
              <Link to="/" className="block mb-6">
                <img
                  width={180}
                  height={180}
                  src="/logo-nuevo.png"
                  alt="Logo UNEFA"
                  className="drop-shadow-lg"
                />
              </Link>
              <h2 className="text-3xl font-bold text-white mb-4 text-center drop-shadow-md">SIGP - UNEFA</h2>
              <p className="text-center text-white font-medium text-lg drop-shadow-sm">
                Sistema de Información para la Gestión de Prácticas Profesionales de la Universidad Nacional Experimental Politécnica de la Fuerza Armada
              </p>
            </div>
          </div>
        </div>
        <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}
