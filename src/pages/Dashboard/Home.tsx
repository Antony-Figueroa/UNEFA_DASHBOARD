import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import { SkeletonLoader } from "../../components/ui/skeleton";
import WelcomeBanner from "../../features/dashboard/components/WelcomeBanner";
import HeroBanner from "../../features/dashboard/components/HeroBanner";
import StatsCards from "../../features/dashboard/components/StatsCards";
import MiddleRow from "../../features/dashboard/components/MiddleRow";
import CourseList from "../../features/dashboard/components/CourseList";
import DashboardCharts from "../../features/dashboard/components/DashboardCharts";

/**
 * Componente Home (Dashboard)
 * @description Vista principal del sistema con un diseño moderno y limpio (Clean Modern Dashboard).
 */
export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulación de carga inicial para la estructura general
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <PageMeta
        title="Dashboard | SIGP - UNEFA"
        description="Panel principal del Sistema de Gestión de Prácticas Profesionales UNEFA"
      />

      <div className="space-y-10 pb-10">
        {/* 1. Header: Reloj y Periodo */}
        <WelcomeBanner />

        {/* 2. Hero Card: Go Premium */}
        <SkeletonLoader
          isLoading={isLoading}
          id="home-hero"
          skeleton={<div className="h-64 bg-white/50 dark:bg-slate-900/50 rounded-4xl animate-pulse" />}
        >
          <HeroBanner />
        </SkeletonLoader>

        {/* 3. Métricas Principales (StatsCards) */}
        <StatsCards />

        {/* 4. Middle Row: Gráfica de Progreso y Tareas */}
        <SkeletonLoader
          isLoading={isLoading}
          id="home-middle"
          skeleton={
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 h-64 bg-white/50 dark:bg-slate-900/50 rounded-4xl animate-pulse" />
              <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="h-28 bg-white/50 dark:bg-slate-900/50 rounded-4xl animate-pulse" />
                <div className="h-28 bg-white/50 dark:bg-slate-900/50 rounded-4xl animate-pulse" />
              </div>
            </div>
          }
        >
          <MiddleRow />
        </SkeletonLoader>

        {/* 5. Bottom Section: Course List */}
        <SkeletonLoader
          isLoading={isLoading}
          id="home-bottom"
          skeleton={
            <div className="space-y-4">
              <div className="h-8 w-48 bg-white/50 dark:bg-slate-900/50 rounded-lg animate-pulse" />
              <div className="h-24 bg-white/50 dark:bg-slate-900/50 rounded-4xl animate-pulse" />
              <div className="h-24 bg-white/50 dark:bg-slate-900/50 rounded-4xl animate-pulse" />
            </div>
          }
        >
          <CourseList />
        </SkeletonLoader>

        {/* 6. Gráficos Interactivos (Opcional, se mantiene por funcionalidad) */}
        <div className="pt-10">
          <DashboardCharts />
        </div>

        {/* Nota informativa al pie */}
        <div className="flex items-center justify-center py-4">
          <p className="text-[10px] text-text-tertiary uppercase tracking-[0.2em] font-medium opacity-50">
            Sistema de Gestión de Prácticas Profesionales • UNEFA {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </>
  );
}
