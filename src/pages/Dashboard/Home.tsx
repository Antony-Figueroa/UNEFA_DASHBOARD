import PageMeta from "../../components/common/PageMeta";
import WelcomeBanner from "../../components/common/WelcomeBanner";
import HomeQuickStats from "../../components/common/HomeQuickStats";
import { useDashboardStats } from "../../features/dashboard/hooks/useDashboardStats";
import { useToast } from "../../context/toast";
import { lazy, Suspense, useEffect } from "react";
import { Skeleton } from "../../components/ui/skeleton";

// Lazy load charts for better initial performance
const RegistrationStatsChart = lazy(() => import("../../features/dashboard/components/RegistrationStatsChart"));
const CareerDistributionChart = lazy(() => import("../../features/dashboard/components/CareerDistributionChart"));
const GrowthMetrics = lazy(() => import("../../features/dashboard/components/GrowthMetrics"));
const EvaluationStatsChart = lazy(() => import("../../features/dashboard/components/EvaluationStatsChart"));
const TutorDistributionChart = lazy(() => import("../../features/dashboard/components/TutorDistributionChart"));
const InstitutionDistributionChart = lazy(() => import("../../features/dashboard/components/InstitutionDistributionChart"));

// Skeleton for charts while loading
const ChartSkeleton = () => (
  <div className="rounded-2xl border border-border-light bg-white p-5 shadow-sm dark:border-border-dark dark:bg-gray-900">
    <Skeleton height={24} width="50%" className="mb-4" />
    <Skeleton height={250} className="rounded-xl" />
  </div>
);

/**
 * Componente Home (Dashboard)
 * @description Vista principal del sistema con datos reales de la base de datos.
 */
export default function Home() {
  const { stats, loading, error, isStale, refresh } = useDashboardStats();
  const { addToast } = useToast();

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

        {/* 1. Banner de Bienvenida y Estadísticas Rápidas */}
        <div className="space-y-6">
          <WelcomeBanner />
          <HomeQuickStats stats={stats} loading={loading} />
        </div>

        {/* 2. Gráficos y Métricas de Crecimiento */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <Suspense fallback={<ChartSkeleton />}>
              <RegistrationStatsChart 
                data={stats?.registrationStats || []} 
                loading={loading} 
              />
            </Suspense>
          </div>
          <div className="lg:col-span-4">
            <Suspense fallback={<ChartSkeleton />}>
              <GrowthMetrics 
                growth={stats?.monthlyGrowth || {
                  totalLastMonth: 0,
                  totalPrevMonth: 0,
                  percentageChange: 0,
                  trend: 'neutral',
                  weeklyBreakdown: [],
                  dailyBreakdown: []
                }} 
                loading={loading} 
              />
            </Suspense>
          </div>
        </div>

        {/* 3. Distribución por Carrera */}
        <div className="grid grid-cols-1 gap-6">
          <Suspense fallback={<ChartSkeleton />}>
            <CareerDistributionChart 
              data={stats?.careerDistribution || []} 
              loading={loading} 
            />
          </Suspense>
        </div>

        {/* 4. Evaluaciones, Tutores e Instituciones */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Suspense fallback={<ChartSkeleton />}>
            <EvaluationStatsChart 
              pending={stats?.pendingEvaluations || 0}
              completed={stats?.completedEvaluations || 0}
              loading={loading}
            />
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            <TutorDistributionChart 
              data={stats?.tutorDistribution || []}
              loading={loading}
            />
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            <InstitutionDistributionChart 
              data={stats?.institutionDistribution || []}
              loading={loading}
            />
          </Suspense>
        </div>
      </div>
    </>
  );
}