import PageMeta from "../../components/common/PageMeta";
import WelcomeBanner from "../../components/common/WelcomeBanner";
import HomeQuickStats from "../../components/common/HomeQuickStats";
import { useDashboardStats } from "../../features/dashboard/hooks/useDashboardStats";
import RegistrationStatsChart from "../../features/dashboard/components/RegistrationStatsChart";
import CareerDistributionChart from "../../features/dashboard/components/CareerDistributionChart";
import GrowthMetrics from "../../features/dashboard/components/GrowthMetrics";
import Alert from "../../components/ui/alert/Alert";

/**
 * Componente Home (Dashboard)
 * @description Vista principal del sistema con datos reales de la base de datos.
 */
export default function Home() {
  const { stats, loading, error } = useDashboardStats();

  return (
    <>
      <PageMeta
        title="Dashboard | SIGP - UNEFA"
        description="Panel principal del Sistema de Gestión de Prácticas Profesionales UNEFA"
      />

      <div className="space-y-6">
        {error && (
          <Alert 
            variant="error" 
            title="Error de Conexión"
            message={typeof error === 'string' ? error : "No se pudieron cargar las estadísticas del panel principal. Por favor, verifique su conexión a la base de datos."}
          />
        )}

        {/* 1. Banner de Bienvenida y Estadísticas Rápidas */}
        <div className="space-y-6">
          <WelcomeBanner />
          <HomeQuickStats stats={stats} loading={loading} />
        </div>

        {/* 2. Gráficos y Métricas de Crecimiento */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <RegistrationStatsChart 
              data={stats?.registrationStats || []} 
              loading={loading} 
            />
          </div>
          <div className="lg:col-span-4">
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
          </div>
        </div>

        {/* 3. Distribución por Carrera */}
        <div className="grid grid-cols-1 gap-6">
          <CareerDistributionChart 
            data={stats?.careerDistribution || []} 
            loading={loading} 
          />
        </div>
      </div>
    </>
  );
}