import { useEffect, useState } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import studentService from "../../features/student/services/studentService";
import type { DashboardData } from "../../features/student/types";
import { User, Briefcase, FileText, Clock, Plus, Calendar, CheckCircle, AlertCircle } from "lucide-react";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";

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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("es-VE", {
      day: "2-digit",
      month: "short"
    });
  };

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

  const hoursPercentage = data?.stats.hoursProgress.percentage || 0;
  const hoursCompleted = data?.stats.hoursProgress.completed || 0;
  const hoursRequired = data?.stats.hoursProgress.required || 120;

  return (
    <>
      <PageMeta
        title="Panel de Estudiante | UNEFA"
        description="Panel de control para estudiantes"
      />

      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-text-emphasis dark:text-text-emphasis">
            Bienvenido, {data?.student.name}
          </h1>
          <p className="text-text-secondary dark:text-text-tertiary mt-1">
            Consulta tu informacion de pasantia y gestiona tus registros
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <User className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Cedula</p>
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
                <p className="text-sm text-text-secondary">Pasantia</p>
                <p className="font-medium">
                  {data?.stats.hasActiveInternship ? "Activa" : "Sin pasantia"}
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
                <p className="text-sm text-text-secondary">Solicitudes</p>
                <p className="font-medium">{data?.stats.pendingRequests || 0} pendientes</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Clock className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Horas</p>
                <p className="font-medium">{hoursCompleted}/{hoursRequired}h</p>
              </div>
            </div>
          </div>
        </div>

        {data?.internship && (
          <ComponentCard title="Progreso de Horas">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-brand-600">
                    {hoursCompleted} horas
                  </p>
                  <p className="text-sm text-text-secondary">
                    de {hoursRequired} horas requeridas
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${hoursPercentage >= 100 ? 'text-success-600' : hoursPercentage >= 50 ? 'text-warning-600' : 'text-error-600'}`}>
                    {hoursPercentage}%
                  </p>
                  <p className="text-sm text-text-secondary">completado</p>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    hoursPercentage >= 100 ? 'bg-success-500' : 
                    hoursPercentage >= 50 ? 'bg-warning-500' : 'bg-error-500'
                  }`}
                  style={{ width: `${Math.min(100, hoursPercentage)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-text-secondary">
                <span>Registros: {data.activityLogs?.totalLogs || 0}</span>
                <span>Aprobados: {data.activityLogs?.approvedLogs || 0}</span>
                <span>Pendientes: {data.activityLogs?.pendingLogs || 0}</span>
              </div>
            </div>
          </ComponentCard>
        )}

        {data?.internship ? (
          <ComponentCard title="Mi Pasantia">
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
                  <p className="text-sm text-text-secondary">Tipo de Practica</p>
                  <p className="font-medium">{data.internship.practiceType}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Periodo</p>
                  <p className="font-medium">{data.internship.period}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-text-secondary">Empresa</p>
                  <p className="font-medium">{data.internship.institutionName}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Tutor Academico</p>
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
          <ComponentCard title="Mi Pasantia">
            <div className="text-center py-8 text-text-secondary dark:text-text-tertiary">
              <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No tienes una pasantia activa registrada</p>
              <p className="text-sm mt-1">Contacta a coordinacion para mas informacion</p>
            </div>
          </ComponentCard>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ComponentCard 
            title="Registros Recientes"
            headerAction={
              data?.internship?.professionalPracticeId ? (
                <Link to={`/student/activity-logs/${data.internship.professionalPracticeId}`}>
                  <Button variant="primary" size="sm" className="flex items-center gap-1">
                    <Plus className="w-4 h-4" />
                    Nuevo
                  </Button>
                </Link>
              ) : undefined
            }
          >
            {data?.activityLogs?.recentLogs && data.activityLogs.recentLogs.length > 0 ? (
              <div className="space-y-3">
                {data.activityLogs.recentLogs.map((log) => (
                  <div 
                    key={log.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                  >
                    <div className={`p-2 rounded-lg ${log.approved ? 'bg-success-100 dark:bg-success-900/30' : 'bg-warning-100 dark:bg-warning-900/30'}`}>
                      {log.approved ? (
                        <CheckCircle className="w-4 h-4 text-success-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-warning-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{log.description}</p>
                      <p className="text-xs text-text-secondary">
                        {formatDate(log.date)} - {log.hours}h - {log.type}
                      </p>
                    </div>
                    <Badge color={log.approved ? 'success' : 'warning'} size="sm">
                      {log.approved ? 'Aprobado' : 'Pendiente'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-text-secondary">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay registros de actividad</p>
              </div>
            )}
          </ComponentCard>

          <ComponentCard title="Acciones Rapidas">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                to="/student/requests"
                className="flex items-center gap-3 p-4 rounded-lg border border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <FileText className="w-5 h-5 text-orange-500" />
                <div>
                  <span className="font-medium">Nueva Solicitud</span>
                  <p className="text-xs text-text-secondary">Envia solicitudes a coordinacion</p>
                </div>
              </Link>
              <Link
                to="/student/profile"
                className="flex items-center gap-3 p-4 rounded-lg border border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <User className="w-5 h-5 text-blue-500" />
                <div>
                  <span className="font-medium">Mi Perfil</span>
                  <p className="text-xs text-text-secondary">Ver datos personales</p>
                </div>
              </Link>
              {data?.internship?.professionalPracticeId && (
                <Link
                  to={`/student/activity-logs/${data.internship.professionalPracticeId}`}
                  className="flex items-center gap-3 p-4 rounded-lg border border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors sm:col-span-2"
                >
                  <Calendar className="w-5 h-5 text-purple-500" />
                  <div>
                    <span className="font-medium">Bitacora de Actividades</span>
                    <p className="text-xs text-text-secondary">Registra tus actividades semanales</p>
                  </div>
                </Link>
              )}
            </div>
          </ComponentCard>
        </div>
      </div>
    </>
  );
}
