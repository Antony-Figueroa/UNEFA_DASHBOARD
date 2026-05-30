import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { DynamicDashboard } from "../../features/dashboard/components/DynamicDashboard";
import { useDashboardLayout } from "../../features/dashboard/hooks/useDashboardLayout";
import studentService from "../../features/student/services/studentService";
import type { DashboardData } from "../../features/student/types";
import { User, Briefcase, FileText, Clock } from "lucide-react";

export default function StudentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { widgets } = useDashboardLayout();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const result = await studentService.getDashboard();
      setData(result);
    } catch (err) {
      console.error("[StudentDashboard] Error:", err);
      setError("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const hoursCompleted = data?.stats.hoursProgress.completed || 0;
  const hoursRequired = data?.stats.hoursProgress.required || 120;

  if (loading) {
    return (
      <>
        <PageMeta title="Panel de Estudiante | UNEFA" description="Panel de control para estudiantes" />
        <div className="space-y-6">
          <div className="animate-pulse space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            ))}
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageMeta title="Panel de Estudiante | UNEFA" description="Panel de control para estudiantes" />
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
          {error}
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="Panel de Estudiante | UNEFA"
        description="Panel de control para estudiantes"
      />

      <div className="space-y-6">
        {/* Header con nombre y mini stats — siempre visible */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-text-emphasis dark:text-text-emphasis">
            Bienvenido, {data?.student.name}
          </h1>
          <p className="text-text-secondary dark:text-text-tertiary mt-1">
            Consultá tu información de pasantía y gestioná tus registros
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<User className="w-5 h-5 text-blue-500" />}
            bg="bg-blue-50 dark:bg-blue-900/20"
            label="Cédula"
            value={data?.student.ci}
          />
          <StatCard
            icon={<Briefcase className="w-5 h-5 text-green-500" />}
            bg="bg-green-50 dark:bg-green-900/20"
            label="Pasantía"
            value={data?.stats.hasActiveInternship ? "Activa" : "Sin pasantía"}
          />
          <StatCard
            icon={<FileText className="w-5 h-5 text-orange-500" />}
            bg="bg-orange-50 dark:bg-orange-900/20"
            label="Solicitudes"
            value={`${data?.stats.pendingRequests || 0} pendientes`}
          />
          <StatCard
            icon={<Clock className="w-5 h-5 text-purple-500" />}
            bg="bg-purple-50 dark:bg-purple-900/20"
            label="Horas"
            value={`${hoursCompleted}/${hoursRequired}h`}
          />
        </div>

        {/* Dashboard dinámico con widgets configurables */}
        <DynamicDashboard
          widgets={widgets}
          data={data}
          loading={loading}
        />
      </div>
    </>
  );
}

const StatCard = ({
  icon,
  bg,
  label,
  value,
}: {
  icon: React.ReactNode;
  bg: string;
  label: string;
  value?: string;
}) => (
  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark">
    <div className="flex items-center gap-3">
      <div className={`p-2 ${bg} rounded-lg`}>{icon}</div>
      <div>
        <p className="text-sm text-text-secondary">{label}</p>
        <p className="font-medium">{value ?? "-"}</p>
      </div>
    </div>
  </div>
);
