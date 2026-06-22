import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import { DynamicDashboard } from "../../features/dashboard/components/DynamicDashboard";
import { useDashboardLayout } from "../../features/dashboard/hooks/useDashboardLayout";
import tutorService, { TutorDashboardStats } from "../../features/tutor/services/tutorService";
import { EyeIcon, ClockIcon } from "../../icons/actions";

export default function TutorDashboard() {
  const navigate = useNavigate();
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

        {/* ponytail: pending approvals card */}
        {stats && !loading && (
          <ComponentCard title="Actividades Pendientes">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-warning-50 dark:bg-warning-500/10">
                  <ClockIcon className="w-8 h-8 text-warning-500" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-warning-500">{stats.pendingApprovals ?? 0}</p>
                  <p className="text-sm text-text-secondary">registros por aprobar</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('/tutor/activity-logs')}
                className="flex items-center gap-2"
              >
                <EyeIcon className="w-4 h-4" />
                Ver Bitácora
              </Button>
            </div>
          </ComponentCard>
        )}
      </div>
    </>
  );
}
