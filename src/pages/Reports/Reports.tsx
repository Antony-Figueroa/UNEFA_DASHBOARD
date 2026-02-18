import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import CustomSelect from "../../components/form/CustomSelect";

interface ReportMetric {
  label: string;
  value: number | string;
  change?: number;
  trend?: "up" | "down" | "stable";
}

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

const MOCK_METRICS: ReportMetric[] = [
  { label: "Estudiantes Activos", value: 245, change: 12, trend: "up" },
  { label: "Inscripciones del Período", value: 89, change: -3, trend: "down" },
  { label: "Prácticas en Curso", value: 156, change: 8, trend: "up" },
  { label: "Certificados Emitidos", value: 67, change: 15, trend: "up" },
];

const MOCK_CAREER_DATA: ChartData[] = [
  { label: "Ing. Informática", value: 45, color: "#3B82F6" },
  { label: "Ing. Agroindustrial", value: 32, color: "#10B981" },
  { label: "TSU Enfermería", value: 28, color: "#F59E0B" },
  { label: "Otras Carreras", value: 15, color: "#6B7280" },
];

const MOCK_PERIOD_DATA: ChartData[] = [
  { label: "2024-I", value: 120 },
  { label: "2024-II", value: 145 },
  { label: "2025-I", value: 178 },
  { label: "2025-II", value: 89 },
];

const MOCK_RECENT_REPORTS = [
  { id: 1, name: "Reporte de Inscripciones Enero 2025", date: "2025-01-15", type: "Inscripciones", status: "completed" },
  { id: 2, name: "Lista de Estudiantes Activos", date: "2025-01-14", type: "Estudiantes", status: "completed" },
  { id: 3, name: "Seguimiento Prácticas Q4 2024", date: "2025-01-10", type: "Seguimiento", status: "completed" },
  { id: 4, name: "Certificados Emitidos 2024", date: "2025-01-08", type: "Certificados", status: "completed" },
];

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<ReportMetric[]>([]);
  const [careerData, setCareerData] = useState<ChartData[]>([]);
  const [periodData, setPeriodData] = useState<ChartData[]>([]);
  const [recentReports, setRecentReports] = useState<typeof MOCK_RECENT_REPORTS>([]);
  
  const [periodFilter, setPeriodFilter] = useState("2025-I");
  const [reportType, setReportType] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setMetrics(MOCK_METRICS);
      setCareerData(MOCK_CAREER_DATA);
      setPeriodData(MOCK_PERIOD_DATA);
      setRecentReports(MOCK_RECENT_REPORTS);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const maxValue = Math.max(...periodData.map((d) => d.value));

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
                { value: "2025-II", label: "2025-II" },
                { value: "2025-I", label: "2025-I" },
                { value: "2024-II", label: "2024-II" },
                { value: "2024-I", label: "2024-I" },
              ]}
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e as unknown as string)}
              className="w-36"
            />
            <Button
              variant="outline"
              startIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              }
            >
              Exportar
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
          ) : (
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
            ) : (
              <div className="space-y-4">
                {careerData.map((item, index) => {
                  const total = careerData.reduce((sum, d) => sum + d.value, 0);
                  const percentage = Math.round((item.value / total) * 100);
                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-text-primary dark:text-text-emphasis">{item.label}</span>
                        <span className="text-sm font-medium text-text-secondary dark:text-text-tertiary">
                          {item.value} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: item.color || "var(--color-brand-500)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ComponentCard>

          <ComponentCard title="Inscripciones por Período">
            {loading ? (
              <div className="h-48 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
              </div>
            ) : (
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
                          style={{ height: `${heightPercent * 1.5}px`, minHeight: "8px" }}
                        />
                      </div>
                      <span className="text-xs text-text-tertiary">{item.label}</span>
                    </div>
                  );
                })}
              </div>
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
                    { value: "all", label: "Todos los períodos" },
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
              <div>
                <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-2">
                  Formato
                </label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    PDF
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Excel
                  </Button>
                </div>
              </div>
              <Button className="w-full" disabled={!reportType}>
                Generar Reporte
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
            ) : (
              <div className="space-y-3">
                {recentReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-500/10">
                      <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary dark:text-text-emphasis truncate group-hover:text-brand-600 transition-colors">
                        {report.name}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {report.type} • {new Date(report.date).toLocaleDateString("es-VE")}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ComponentCard>
        </div>
      </div>
    </>
  );
}
