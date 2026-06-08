import PageMeta from "../../components/common/PageMeta";
import WelcomeBanner from "../../components/common/WelcomeBanner";
import { useDashboardStats } from "../../features/dashboard/hooks/useDashboardStats";
import { useDashboardLayout } from "../../features/dashboard/hooks/useDashboardLayout";
import { DynamicDashboard } from "../../features/dashboard/components/DynamicDashboard";
import { useToast } from "../../context/toast";
import { useEffect, useState } from "react";
import Slideover from "../../components/ui/slideover/Slideover";
import PendingTasksPanel from "../../features/dashboard/components/PendingTasksPanel";

/**
 * Home (Admin Dashboard)
 *
 * Vista principal del sistema. Ahora usa DynamicDashboard que renderiza
 * los widgets según la configuración guardada en DB para el rol Admin.
 */
export default function Home() {
  const { stats, loading, error, isStale, refresh, selectedPeriodId, handlePeriodChange, availablePeriods } = useDashboardStats();
  const { widgets, loading: layoutLoading } = useDashboardLayout();
  const { addToast } = useToast();
  const [isSlideoverOpen, setIsSlideoverOpen] = useState(false);

  const pendingCount = (stats?.pendingRequests ?? 0)
    + (stats?.pendingEvaluations ?? 0)
    + (stats?.upcomingVisits ?? 0);

  useEffect(() => {
    if (error) {
      addToast({
        variant: "error",
        title: "Error de Conexión",
        message: typeof error === 'string' ? error : "No se pudieron cargar las estadísticas del panel principal.",
      });
    }
  }, [error, addToast]);

  return (
    <>
      <PageMeta
        title="Dashboard | SIGP - UNEFA"
        description="Panel principal del Sistema de Gestión de Prácticas Profesionales UNEFA"
      />

      <div className="space-y-6">
        {/* Indicador de datos en caché */}
        {isStale && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-400 text-xs">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Mostrando datos en caché. <button onClick={() => refresh(false, true)} className="underline hover:no-underline">Actualizar</button></span>
          </div>
        )}

        {/* 1. Banner de Bienvenida (siempre visible, no es widget configurable) */}
        <WelcomeBanner
          pendingCount={pendingCount}
          onTasksClick={() => setIsSlideoverOpen(true)}
        />

        {/* 2. Dashboard dinámico con widgets configurables */}
        <DynamicDashboard
          widgets={widgets}
          data={{ stats, loading, selectedPeriodId, handlePeriodChange, availablePeriods }}
          loading={layoutLoading || loading}
        />
      </div>

      {/* Panel lateral de tareas pendientes */}
      <Slideover
        isOpen={isSlideoverOpen}
        onClose={() => setIsSlideoverOpen(false)}
        title="Tareas Pendientes"
        badge={pendingCount}
      >
        <PendingTasksPanel
          stats={stats}
          onTaskNavigate={() => setIsSlideoverOpen(false)}
        />
      </Slideover>
    </>
  );
}
