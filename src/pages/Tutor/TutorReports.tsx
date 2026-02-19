import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import tutorService, { TutorReportData } from "../../features/tutor/services/tutorService";
import Badge from "../../components/ui/badge/Badge";
import { FileText, Users, TrendingUp, Calendar } from "lucide-react";

export default function TutorReports() {
  const [reportData, setReportData] = useState<TutorReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const data = await tutorService.getReports();
      setReportData(data);
    } catch (err) {
      console.error("[TutorReports] Error:", err);
      setError("Error al cargar reportes");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageMeta title="Reportes | SIGP - UNEFA" description="Reportes de tutor" />
        <div className="space-y-6">
          <div className="animate-pulse space-y-4">
            {[...Array(4)].map((_, i) => (
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
        <PageMeta title="Reportes | SIGP - UNEFA" description="Reportes de tutor" />
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
          {error}
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="Reportes | SIGP - UNEFA"
        description="Reportes y estadísticas de estudiantes asignados"
      />

      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-text-emphasis dark:text-text-emphasis">
            Reportes
          </h1>
          <p className="text-text-secondary dark:text-text-tertiary mt-1">
            Estadísticas y reportes de sus estudiantes asignados
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Total Estudiantes</p>
                <p className="text-xl font-bold">{reportData?.summary.totalStudents || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Promedio General</p>
                <p className="text-xl font-bold">{reportData?.summary.averageGrade || "0.00"}</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <FileText className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Períodos Activos</p>
                <p className="text-xl font-bold">
                  {Object.keys(reportData?.summary.periodDistribution || {}).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <Calendar className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Tutor</p>
                <p className="text-sm font-medium truncate">{reportData?.tutorInfo.name}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ComponentCard title="Distribución por Estado">
            {reportData?.summary.statusDistribution && (
              <div className="space-y-3">
                {Object.entries(reportData.summary.statusDistribution).map(([status, count]) => {
                  const total = reportData.summary.totalStudents;
                  const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                  
                  const colorMap: Record<string, "success" | "info" | "warning" | "error" | "light"> = {
                    "Activo": "success",
                    "Completado": "info",
                    "Pre-inscrito": "warning",
                    "Suspendido": "error"
                  };
                  
                  return (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge color={colorMap[status] || "light"} size="sm">
                          {status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-brand-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-text-secondary w-16 text-right">
                          {count} ({percentage}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ComponentCard>

          <ComponentCard title="Distribución por Período">
            {reportData?.summary.periodDistribution && (
              <div className="space-y-3">
                {Object.entries(reportData.summary.periodDistribution).map(([period, count]) => {
                  const total = reportData.summary.totalStudents;
                  const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                  
                  return (
                    <div key={period} className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate max-w-[150px]">{period || "Sin período"}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-text-secondary w-12 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ComponentCard>
        </div>

        <ComponentCard 
          title={`Listado de Estudiantes (${reportData?.students.length || 0})`}
          className="overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Estudiante</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Carrera</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Empresa</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Período</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Nota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark">
                {reportData?.students.map((student, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-text-emphasis">{student.studentName}</p>
                        <p className="text-sm text-text-secondary">{student.studentCi}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-text-secondary text-sm">{student.careerName}</td>
                    <td className="px-4 py-4 text-text-secondary text-sm">{student.institutionName}</td>
                    <td className="px-4 py-4 text-text-secondary text-sm">{student.period}</td>
                    <td className="px-4 py-4">
                      <Badge 
                        color={
                          student.status === "Activo" ? "success" :
                          student.status === "Completado" ? "info" :
                          student.status === "Pre-inscrito" ? "warning" : "error"
                        }
                        size="sm"
                      >
                        {student.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 font-medium">
                      {student.grade > 0 ? student.grade.toFixed(1) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
