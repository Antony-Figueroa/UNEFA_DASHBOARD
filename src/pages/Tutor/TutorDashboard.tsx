import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { DynamicDashboard } from "../../features/dashboard/components/DynamicDashboard";
import { useDashboardLayout } from "../../features/dashboard/hooks/useDashboardLayout";
import tutorService, { TutorDashboardStats } from "../../features/tutor/services/tutorService";

export default function TutorDashboard() {
  const [stats, setStats] = useState<TutorDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { widgets } = useDashboardLayout();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await tutorService.getDashboard();
        setStats(data);
      } catch (err) {
        console.error("[TutorDashboard] Error:", err);
        setError("Error al cargar estadísticas");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <>
      <PageMeta
        title="Panel de Tutor | SIGP - UNEFA"
        description="Panel de control para tutores académicos"
      />

      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-text-emphasis dark:text-text-emphasis">
            Panel de Tutor
          </h1>
          <p className="text-text-secondary dark:text-text-tertiary mt-1">
            Resumen de sus estudiantes asignados y actividades de seguimiento
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <DynamicDashboard
          widgets={widgets}
          data={{ ...stats, loading }}
          loading={loading}
        />
      </div>
    </>
  );
}
