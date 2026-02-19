import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import studentService, { DashboardData } from "../../features/student/services/studentService";
import { User, Briefcase, FileText, Clock } from "lucide-react";
import Badge from "../../components/ui/badge/Badge";

export default function StudentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const statusColors: Record<string, "success" | "warning" | "info" | "error" | "light"> = {
    active: "success",
    completed: "info",
    "pre-enrolled": "warning",
    suspended: "error"
  };

  const statusLabels: Record<string, string> = {
    active: "Activo",
    completed: "Completado",
    "pre-enrolled": "Pre-inscrito",
    suspended: "Suspendido"
  };

  if (loading) {
    return (
      <>
        <PageMeta title="Panel de Estudiante | SIGP - UNEFA" description="Panel de control para estudiantes" />
        <div className="space-y-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageMeta title="Panel de Estudiante | SIGP - UNEFA" description="Panel de control para estudiantes" />
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
          {error}
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="Panel de Estudiante | SIGP - UNEFA"
        description="Panel de control para estudiantes"
      />

      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-text-emphasis dark:text-text-emphasis">
            Bienvenido, {data?.student.name}
          </h1>
          <p className="text-text-secondary dark:text-text-tertiary mt-1">
            Consulta tu información de pasantía y gestiona tus solicitudes
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <User className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Cédula</p>
                <p className="font-medium">{data?.student.ci}</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Briefcase className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Pasantía</p>
                <p className="font-medium">
                  {data?.stats.hasActiveInternship ? "Activa" : "Sin pasantía"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <FileText className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Solicitudes Pendientes</p>
                <p className="font-medium">{data?.stats.pendingRequests || 0}</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Clock className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Correo</p>
                <p className="font-medium text-sm truncate">{data?.student.email}</p>
              </div>
            </div>
          </div>
        </div>

        {data?.internship ? (
          <ComponentCard title="Mi Pasantía">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-text-secondary">Estado</p>
                  <Badge color={statusColors[data.internship.status] || "light"} className="mt-1">
                    {statusLabels[data.internship.status] || data.internship.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Carrera</p>
                  <p className="font-medium">{data.internship.careerName}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Tipo de Práctica</p>
                  <p className="font-medium">{data.internship.practiceType}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Período</p>
                  <p className="font-medium">{data.internship.period}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-text-secondary">Empresa</p>
                  <p className="font-medium">{data.internship.institutionName}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Tutor Académico</p>
                  <p className="font-medium">{data.internship.tutorName || "Sin asignar"}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Fecha de Inicio</p>
                  <p className="font-medium">{data.internship.startDate || "Por definir"}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Nota Final</p>
                  <p className="font-medium text-lg">
                    {data.internship.grade > 0 ? data.internship.grade.toFixed(1) : "Sin calificar"}
                  </p>
                </div>
              </div>
            </div>
          </ComponentCard>
        ) : (
          <ComponentCard title="Mi Pasantía">
            <div className="text-center py-8 text-text-secondary dark:text-text-tertiary">
              <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No tienes una pasantía activa registrada</p>
              <p className="text-sm mt-1">Contacta a coordinación para más información</p>
            </div>
          </ComponentCard>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ComponentCard title="Acciones Rápidas">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a
                href="/student/requests"
                className="flex items-center gap-3 p-4 rounded-lg border border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <FileText className="w-5 h-5 text-orange-500" />
                <div>
                  <span className="font-medium">Nueva Solicitud</span>
                  <p className="text-xs text-text-secondary">Envía solicitudes a coordinación</p>
                </div>
              </a>
              <a
                href="/student/profile"
                className="flex items-center gap-3 p-4 rounded-lg border border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <User className="w-5 h-5 text-blue-500" />
                <div>
                  <span className="font-medium">Mi Perfil</span>
                  <p className="text-xs text-text-secondary">Ver datos personales</p>
                </div>
              </a>
            </div>
          </ComponentCard>

          <ComponentCard title="Información">
            <div className="space-y-3 text-sm">
              <p className="text-text-secondary dark:text-text-tertiary">
                Como estudiante puedes:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  Ver información de tu pasantía
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  Enviar solicitudes a coordinación
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  Consultar el estado de tus solicitudes
                </li>
              </ul>
            </div>
          </ComponentCard>
        </div>
      </div>
    </>
  );
}
