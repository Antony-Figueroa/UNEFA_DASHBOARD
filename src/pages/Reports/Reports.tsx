import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import CustomSelect from "../../components/form/CustomSelect";
import { reportsService, CareerData, PeriodData, RecentReport } from "../../features/reports/services/reportsService";
import toast from "react-hot-toast";

interface ReportMetric {
  label: string;
  value: number | string;
  change?: number;
  trend?: "up" | "down" | "stable";
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<ReportMetric[]>([]);
  const [careerData, setCareerData] = useState<CareerData[]>([]);
  const [periodData, setPeriodData] = useState<PeriodData[]>([]);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  
  const [periodFilter, setPeriodFilter] = useState("");
  const [reportType, setReportType] = useState("");
  const [generating, setGenerating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, careerRes, periodRes, recentRes] = await Promise.all([
        reportsService.getStats(periodFilter),
        reportsService.getStudentsByCareer(),
        reportsService.getEnrollmentsByPeriod(),
        reportsService.getRecentReports()
      ]);

      setMetrics(statsRes.metrics || []);
      setCareerData(careerRes);
      setPeriodData(periodRes);
      setRecentReports(recentRes);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Error al cargar los reportes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [periodFilter]);

  const handleGenerateReport = async () => {
    if (!reportType) {
      toast.error('Selecciona un tipo de reporte');
      return;
    }

    setGenerating(true);
    try {
      await reportsService.generateReport(reportType, periodFilter, 'PDF');
      toast.success('Reporte generado exitosamente');
      fetchData();
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Error al generar el reporte');
    } finally {
      setGenerating(false);
    }
  };

  const maxValue = periodData.length > 0 ? Math.max(...periodData.map((d) => d.value)) : 1;

  return (
    <>
      <PageMeta title="Reportes" description="Panel de reportes y estadísticas del sistema" />
      <PageBreadcrumb pageTitle="Reportes" />

      <div className="space-y-6 animate-fadeIn">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary dark:text-text-emphasis">
              Reportes y Estadísticas
            </h1>
            <p className="mt-1 text-sm text-text-secondary dark:text-text-tertiary">
              Visualiza métricas y genera reportes del sistema
            </p>
          </div>
          <div className="flex items-center gap-3">
            <CustomSelect
              options={[
                { value: "", label: "Todos los períodos" },
                { value: "2025-II", label: "2025-II" },
                { value: "2025-I", label: "2025-I" },
                { value: "2024-II", label: "2024-II" },
                { value: "2024-I", label: "2024-I" },
              ]}
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e as unknown as string)}
              className="w-40"
            />
            <Button
              variant="outline"
              onClick={fetchData}
              startIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              }
            >
              Actualizar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border-default dark:border-border-dark bg-bg-surface dark:bg-bg-dark-surface p-5 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
            ))
          ) : metrics.length > 0 ? (
            metrics.map((metric, index) => (
              <div key={index} className="rounded-xl border border-border-default dark:border-border-dark bg-bg-surface dark:bg-bg-dark-surface p-5">
                <p className="text-sm text-text-tertiary mb-1">{metric.label}</p>
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-bold text-text-primary dark:text-text-emphasis">
                    {typeof metric.value === "number" ? metric.value.toLocaleString() : metric.value}
                  </p>
                  {metric.change !== undefined && (
                    <span className={`text-xs font-medium flex items-center gap-0.5 ${
                      metric.trend === "up" ? "text-success-600" : metric.trend === "down" ? "text-error-600" : "text-text-tertiary"
                    }`}>
                      {metric.trend === "up" ? (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      ) : metric.trend === "down" ? (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      ) : null}
                      {Math.abs(metric.change)}%
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-4 text-center py-8 text-text-tertiary">
              No hay datos disponibles
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ComponentCard title="Estudiantes por Carrera">
            {loading ? (
              <div className="space-y-4 animate-pulse">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-700"></div>
                    <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="w-8 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            ) : careerData.length > 0 ? (
              <div className="space-y-4">
                {careerData.map((item, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-text-primary dark:text-text-emphasis" title={item.fullName}>
                        {item.label}
                      </span>
                      <span className="text-sm font-medium text-text-secondary dark:text-text-tertiary">
                        {item.value} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color || "var(--color-brand-500)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-text-tertiary">No hay datos de carreras</div>
            )}
          </ComponentCard>

          <ComponentCard title="Inscripciones por Período">
            {loading ? (
              <div className="h-48 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
              </div>
            ) : periodData.length > 0 ? (
              <div className="h-48 flex items-end justify-between gap-4 px-2">
                {periodData.map((item, index) => {
                  const heightPercent = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col items-center">
                        <span className="text-xs font-medium text-text-secondary dark:text-text-tertiary mb-1">
                          {item.value}
                        </span>
                        <div
                          className="w-full max-w-[48px] bg-brand-500 rounded-t-lg transition-all duration-500 hover:bg-brand-600"
                          style={{ height: `${Math.max(heightPercent * 1.5, 8)}px` }}
                        />
                      </div>
                      <span className="text-xs text-text-tertiary">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-text-tertiary">No hay datos de períodos</div>
            )}
          </ComponentCard>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ComponentCard title="Generar Reporte" className="lg:col-span-1">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-2">
                  Tipo de Reporte
                </label>
                <CustomSelect
                  options={[
                    { value: "", label: "Seleccionar tipo" },
                    { value: "students", label: "Estudiantes" },
                    { value: "enrollments", label: "Inscripciones" },
                    { value: "tracking", label: "Seguimiento" },
                    { value: "certificates", label: "Certificados" },
                    { value: "institutions", label: "Instituciones" },
                  ]}
                  value={reportType}
                  onChange={(e) => setReportType(e as unknown as string)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-2">
                  Período
                </label>
                <CustomSelect
                  options={[
                    { value: "", label: "Todos los períodos" },
                    { value: "2025-II", label: "2025-II" },
                    { value: "2025-I", label: "2025-I" },
                    { value: "2024-II", label: "2024-II" },
                    { value: "2024-I", label: "2024-I" },
                  ]}
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e as unknown as string)}
                  className="w-full"
                />
              </div>
              <Button 
                className="w-full" 
                disabled={!reportType || generating}
                onClick={handleGenerateReport}
              >
                {generating ? 'Generando...' : 'Generar Reporte'}
              </Button>
            </div>
          </ComponentCard>

          <ComponentCard title="Reportes Recientes" className="lg:col-span-2">
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentReports.length > 0 ? (
              <div className="space-y-3">
                {recentReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors group"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-500/10">
                      <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary dark:text-text-emphasis truncate">
                        {report.name}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {report.type} • {report.user || 'Sistema'} • {new Date(report.date).toLocaleDateString("es-VE")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-text-tertiary">
                No hay reportes recientes
              </div>
            )}
          </ComponentCard>
        </div>
      </div>
    </>
  );
}
