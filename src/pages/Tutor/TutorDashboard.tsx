import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import tutorService, { TutorDashboardStats } from "../../features/tutor/services/tutorService";
import { Users, Briefcase, ClipboardCheck, Award } from "lucide-react";

export default function TutorDashboard() {
  const [stats, setStats] = useState<TutorDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const statCards = [
    {
      title: "Total Estudiantes",
      value: stats?.totalStudents || 0,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/20"
    },
    {
      title: "Pasantías Activas",
      value: stats?.activeInternships || 0,
      icon: Briefcase,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-900/20"
    },
    {
      title: "Notas Pendientes",
      value: stats?.pendingGrades || 0,
      icon: ClipboardCheck,
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-900/20"
    },
    {
      title: "Completadas",
      value: stats?.completedInternships || 0,
      icon: Award,
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-900/20"
    }
  ];

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

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card, index) => (
            <ComponentCard
              key={index}
              title={
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <span className="text-sm font-medium text-text-secondary dark:text-text-tertiary">
                    {card.title}
                  </span>
                </div>
              }
              className="overflow-hidden"
            >
              {loading ? (
                <div className="animate-pulse h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              ) : (
                <p className="text-3xl font-bold text-text-emphasis dark:text-text-emphasis">
                  {card.value}
                </p>
              )}
            </ComponentCard>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ComponentCard title="Acciones Rápidas">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a
                href="/tutor/students"
                className="flex items-center gap-3 p-4 rounded-lg border border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <Users className="w-5 h-5 text-blue-500" />
                <span className="font-medium">Ver Estudiantes</span>
              </a>
              <a
                href="/tutor/grades"
                className="flex items-center gap-3 p-4 rounded-lg border border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <ClipboardCheck className="w-5 h-5 text-orange-500" />
                <span className="font-medium">Cargar Notas</span>
              </a>
              <a
                href="/tutor/tracking"
                className="flex items-center gap-3 p-4 rounded-lg border border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <Briefcase className="w-5 h-5 text-green-500" />
                <span className="font-medium">Seguimiento</span>
              </a>
              <a
                href="/tutor/reports"
                className="flex items-center gap-3 p-4 rounded-lg border border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <Award className="w-5 h-5 text-purple-500" />
                <span className="font-medium">Reportes</span>
              </a>
            </div>
          </ComponentCard>

          <ComponentCard title="Información">
            <div className="space-y-4">
              <p className="text-sm text-text-secondary dark:text-text-tertiary">
                Como tutor académico, usted puede:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  Ver y gestionar estudiantes asignados
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  Registrar seguimiento de pasantías
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  Cargar notas finales de los estudiantes
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  Generar reportes de sus estudiantes
                </li>
              </ul>
            </div>
          </ComponentCard>
        </div>
      </div>
    </>
  );
}
