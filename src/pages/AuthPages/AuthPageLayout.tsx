import React from "react";
import GridShape from "../../components/common/GridShape";
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
        <div className="items-center hidden w-full h-full lg:w-1/2 bg-brand-950 dark:bg-white/5 lg:grid">
          <div className="relative flex items-center justify-center z-1">
            {/* <!-- ===== Common Grid Shape Start ===== --> */}
            <GridShape />
            <div className="flex flex-col items-center max-w-xs">
              <Link to="/" className="block mb-4">
                <img
                  width={120}
                  height={120}
                  src="/images/logo/logo-nuevo.svg"
                  alt="Logo"
                />
              </Link>
              <h2 className="text-2xl font-bold text-white mb-2">SIGP - UNEFA</h2>
              <p className="text-center text-text-tertiary dark:text-white/60">
                Sistema de Gestión de Pasantías de la Universidad Nacional Experimental Politécnica de la Fuerza Armada
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
