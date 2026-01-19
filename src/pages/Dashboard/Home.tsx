import PageMeta from "../../components/common/PageMeta";
import WelcomeBanner from "../../components/common/WelcomeBanner";
import HomeQuickStats from "../../components/common/HomeQuickStats";
import { useDashboardStats } from "../../features/dashboard/hooks/useDashboardStats";

/**
 * Componente Home (Dashboard)
 * @description Vista principal del sistema con datos reales de la base de datos.
 */
export default function Home() {
  const { stats, loading } = useDashboardStats();

  return (
    <>
      <PageMeta
        title="Dashboard | SIGP - UNEFA"
        description="Panel principal del Sistema de Gestión de Prácticas Profesionales UNEFA"
      />

      <div className="space-y-6">
        {/* 1. Banner de Bienvenida y Estadísticas Rápidas */}
        <div className="space-y-6">
          <WelcomeBanner />
          <HomeQuickStats stats={stats} loading={loading} />
        </div>
      </div>
    </>
  );
}
