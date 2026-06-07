import { useState, useEffect, useCallback, ReactElement } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import CustomSelect from "../../components/form/CustomSelect";
import { getPeriods } from "../../features/periods/services/periodService";
import { reportsService, CareerData, PeriodData, RecentReport, TutorAcademicReportRow } from "../../features/reports/services/reportsService";
import { TablePreviewModal } from "../../components/ui/table/TablePreviewModal";
import { PDFPreviewModal } from "../../components/ui/pdf/PDFPreviewModal";
import { StudentPDF } from "../../components/ui/pdf/templates/StudentPDF";
import { TutorPDF } from "../../components/ui/pdf/templates/TutorPDF";
import { InstitutionPDF } from "../../components/ui/pdf/templates/InstitutionPDF";
import { EnrollmentPDF } from "../../components/ui/pdf/templates/EnrollmentPDF";
import { CulminatedStudentsPDF } from "../../components/ui/pdf/templates/CulminatedStudentsPDF";
import { ReportList } from "../../features/reports/components/ReportList";
import { DocumentReportModal } from "../../features/reports/components/DocumentReportModal";
import { ProspectListModal } from "../../features/prospectos/components/ProspectListModal";
import { useReports } from "../../features/reports/hooks/useReports";
import { generateSimpleExcel } from "../../utils/unefaExcelReports";
import { getStudents } from "../../features/students/services/studentsService";
import { getInstitutions } from "../../features/institutions/services/institutionsService";
import { getEnrollments } from "../../features/enrollment/services/enrollmentService";
import toast from "react-hot-toast";
import { DocumentProps } from "@react-pdf/renderer";

interface ReportMetric {
  label: string;
  value: number | string;
  change?: number;
  trend?: "up" | "down" | "stable";
}

type ReportType = "students" | "enrollments" | "institutions" | "tutores-academicos" | "culminated-students" | "resumen-pasantias" | "relacion-empresas" | "distribucion-tutores" | "distribucion-tutores-v2" | "relacion-individual-docente" | "";

const DOCUMENT_SECTIONS = [
  {
    title: "Documentos Oficiales",
    description: "Documentos PDF institucionales para estudiantes y tutores",
    reports: [
      { id: "aceptacion-tutor", title: "Carta de Aceptación", subtitle: "Aceptación del Tutor Académico", icon: "fileText", type: "pdf" as const },
      { id: "solicitud-institucion", title: "Solicitud de Institución", subtitle: "Asignación de institución para PP", icon: "fileText", type: "pdf" as const },
      { id: "carta-postulacion", title: "Carta de Postulación", subtitle: "Postulación del estudiante", icon: "fileText", type: "pdf" as const },
      { id: "acta-validacion", title: "Acta de Validación", subtitle: "Validación de prácticas profesionales", icon: "fileText", type: "pdf" as const },
      { id: "evaluacion-final", title: "Evaluación Final", subtitle: "Evaluación final de prácticas", icon: "fileText", type: "pdf" as const },
      { id: "evaluacion-tutor-institucional", title: "Eval. Tutor Institucional", subtitle: "Evaluación del tutor de la institución", icon: "fileText", type: "pdf" as const },
      { id: "evaluacion-tutor-academico", title: "Eval. Tutor Académico", subtitle: "Evaluación del tutor académico", icon: "fileText", type: "pdf" as const },
      { id: "evaluacion-comite", title: "Eval. Comité Evaluador", subtitle: "Evaluación del comité evaluador", icon: "fileText", type: "pdf" as const },
      { id: "constancia-tutor-academico", title: "Const. Tutor Académico", subtitle: "Constancia de tutor académico", icon: "fileText", type: "pdf" as const },
      { id: "constancia-tutor-institucional", title: "Const. Tutor Institucional", subtitle: "Constancia de tutor institucional", icon: "fileText", type: "pdf" as const },
    ],
  },
  {
    title: "Prospectos",
    description: "Listas editables de estudiantes elegibles para pasantías",
    reports: [
      { id: "prospectos", title: "Reporte de Prospectos", subtitle: "Crear y gestionar listas de prospectos por período", icon: "users", type: "pdf" as const },
    ],
  },
  {
    title: "Reportes Generales",
    description: "Reportes exportables a Excel con datos agregados",
    reports: [
      { id: "tutores-academicos", title: "Relación de Tutores Acad.", subtitle: "ANEXO 4 - Tutores y estudiantes atendidos", icon: "table", type: "excel" as const },
      { id: "resumen-pasantias", title: "Resumen de Pasantías", subtitle: "Resumen general de prácticas profesionales", icon: "table", type: "excel" as const },
      { id: "relacion-empresas", title: "Relación de Empresas", subtitle: "Instituciones que demandan pasantes", icon: "spreadsheet", type: "excel" as const },
      { id: "distribucion-tutores", title: "Distribución de Tutores", subtitle: "Asignación de tutores por estudiante", icon: "spreadsheet", type: "excel" as const },
      { id: "distribucion-tutores-v2", title: "Dist. Tutores (Detallada)", subtitle: "Distribución con horario detallado", icon: "spreadsheet", type: "excel" as const },
      { id: "relacion-individual-docente", title: "Relación Individual Doc.", subtitle: "Reporte individual por docente", icon: "spreadsheet", type: "excel" as const },
    ],
  },
];

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<ReportMetric[]>([]);
  const [careerData, setCareerData] = useState<CareerData[]>([]);
  const [periodData, setPeriodData] = useState<PeriodData[]>([]);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);

  const [periodFilter, setPeriodFilter] = useState("");
  const [availablePeriods, setAvailablePeriods] = useState<{ value: string; label: string }[]>([]);
  const [reportType, setReportType] = useState<ReportType>("");

  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState("");
  const [tableData, setTableData] = useState<TutorAcademicReportRow[]>([]);
  const [pdfData, setPdfData] = useState<unknown[]>([]);
  const [pdfTemplate, setPdfTemplate] = useState<((data: unknown[]) => ReactElement<DocumentProps>) | null>(null);
  const [tableSearchTerm, setTableSearchTerm] = useState("");
  const [pdfSearchTerm, setPdfSearchTerm] = useState("");
  const [loadingReport, setLoadingReport] = useState(false);
  const [loadingExcelId, setLoadingExcelId] = useState<string | null>(null);
  const [isProspectosModalOpen, setIsProspectosModalOpen] = useState(false);

  const { fetchData: fetchReportData, exportExcel } = useReports();

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, careerRes, periodRes, recentRes, apiPeriods] = await Promise.all([
        reportsService.getStats(periodFilter),
        reportsService.getStudentsByCareer(),
        reportsService.getEnrollmentsByPeriod(),
        reportsService.getRecentReports(),
        getPeriods()
      ]);
      setAvailablePeriods(
        (apiPeriods || []).map((p: any) => ({
          value: p.description,
          label: p.description
        }))
      );
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
    fetchDashboardData();
  }, [periodFilter]);

  const reportConfig: Record<Exclude<ReportType, "">, {
    title: string;
    subtitle: string;
    loadTable?: () => Promise<any[]>;
    loadPDF?: () => Promise<unknown[]>;
    pdfTemplate: (data: unknown[]) => ReactElement<DocumentProps>;
    columns: { header: string; accessor: string | ((item: any) => React.ReactNode); className?: string }[];
  }> = {
    "students": {
      title: "Reporte de Estudiantes",
      subtitle: "Listado de estudiantes activos en el sistema",
      loadPDF: async () => {
        const response = await getStudents();
        return response.data.filter((s: any) => s.status === true);
      },
      pdfTemplate: (data) => <StudentPDF data={data as any[]} />,
      columns: [
        { header: "Cédula", accessor: (s: any) => `${s.identificationPrefix}-${s.identificationNumber}` },
        { header: "Nombre", accessor: (s: any) => `${s.firstName} ${s.lastName}` },
        { header: "Carrera", accessor: "careerName" },
      ]
    },
    "tutores-academicos": {
      title: "ANEXO 4 - Relación de Tutores Académicos",
      subtitle: "Reporte de tutores académicos y estudiantes atendidos",
      loadTable: async () => {
        const response = await reportsService.getTutorsAcademicReport();
        return response.data;
      },
      pdfTemplate: (data) => <TutorPDF data={data as any[]} />,
      columns: [
        { header: "N°", accessor: "nro", className: "w-12 text-center" },
        { header: "Región", accessor: "region" },
        { header: "Núcleo", accessor: "nucleo" },
        { header: "Extensión", accessor: "extension" },
        { header: "Carrera", accessor: "carrera" },
        { header: "Nombre", accessor: "nombreTutor" },
        { header: "Apellido", accessor: "apellidoTutor" },
        { header: "Cédula", accessor: "cedula" },
        { header: "Condición", accessor: "condicion" },
        { header: "Dedicación", accessor: "dedicacion" },
        { header: "Categoría", accessor: "categoria" },
        { header: "Teléfono", accessor: "telefono" },
        { header: "Correo", accessor: "correo" },
        { header: "Estudiantes", accessor: (row: TutorAcademicReportRow) => row.cantidadEstudiantes, className: "text-center font-bold" },
      ]
    },
    "resumen-pasantias": {
      title: "Resumen de Pasantías",
      subtitle: "Reporte resumen general de las prácticas profesionales",
      loadTable: async () => {
        const response = await reportsService.getResumenPasantiasReport();
        return response.data;
      },
      pdfTemplate: () => <></>,
      columns: [
        { header: "N°", accessor: "nro" },
        { header: "Región", accessor: "region" },
        { header: "Núcleo", accessor: "nucleo" },
        { header: "Carrera", accessor: "carrera" },
        { header: "Estudiantes", accessor: "cantidadEstudiantes" },
        { header: "Tutores Acad.", accessor: "cantidadTutoresAcad" },
        { header: "Empresa", accessor: "empresa" },
        { header: "Tipo", accessor: "tipoEmpresa" },
      ]
    },
    "institutions": {
      title: "Reporte de Instituciones",
      subtitle: "Listado de instituciones registradas",
      loadPDF: async () => {
        const data = await getInstitutions();
        return data.filter((i: any) => i.status === true);
      },
      pdfTemplate: (data) => <InstitutionPDF data={data as any[]} />,
      columns: [
        { header: "RIF", accessor: "institutionRif" },
        { header: "Nombre", accessor: "institutionName" },
        { header: "Región", accessor: "region" },
      ]
    },
    "enrollments": {
      title: "Reporte de Inscripciones",
      subtitle: "Listado de inscripciones activas",
      loadPDF: async () => {
        const data = await getEnrollments();
        return data.filter((e: any) => e.status === true);
      },
      pdfTemplate: (data) => <EnrollmentPDF data={data as any[]} />,
      columns: [
        { header: "Estudiante", accessor: "studentName" },
        { header: "Carrera", accessor: "careerName" },
        { header: "Período", accessor: "period" },
      ]
    },
    "culminated-students": {
      title: "Estudiantes Culminados",
      subtitle: "Estudiantes que han completado sus prácticas profesionales",
      loadPDF: async () => {
        const response = await reportsService.getCulminatedStudents();
        return response.data;
      },
      pdfTemplate: (data) => <CulminatedStudentsPDF data={data as any[]} />,
      columns: [
        { header: "Cédula", accessor: "studentCi" },
        { header: "Estudiante", accessor: "studentName" },
        { header: "Carrera", accessor: "careerName" },
        { header: "Institución", accessor: "institutionName" },
        { header: "Tipo", accessor: "practiceType" },
        { header: "Tutor", accessor: "tutorName" },
        { header: "Período", accessor: "period" },
        { header: "Horas", accessor: "totalHours" },
        { header: "Nota", accessor: "grade" },
      ]
    },
    "relacion-empresas": {
      title: "Relación de Empresas",
      subtitle: "Instituciones que demandan asignación de pasantes",
      loadTable: async () => {
        const response = await reportsService.getRelacionEmpresas();
        return response.data;
      },
      pdfTemplate: (data) => <StudentPDF data={data as any[]} />,
      columns: [
        { header: "Región", accessor: "region" },
        { header: "Núcleo", accessor: "nucleo" },
        { header: "Extensión", accessor: "extension" },
        { header: "Empresa", accessor: "empresa" },
        { header: "RIF", accessor: "rif" },
        { header: "Tipo", accessor: "tipo" },
        { header: "Carrera", accessor: "carrera" },
        { header: "Estudiantes", accessor: "cantidadEstudiantes", className: "text-center font-bold" },
      ]
    },
    "distribucion-tutores": {
      title: "Distribución de Tutores",
      subtitle: "Asignación de tutores por estudiante",
      loadTable: async () => {
        const response = await reportsService.getDistribucionTutores();
        return response.data;
      },
      pdfTemplate: (data) => <StudentPDF data={data as any[]} />,
      columns: [
        { header: "N°", accessor: "nro", className: "w-12 text-center" },
        { header: "Carrera", accessor: "carrera" },
        { header: "Estudiante", accessor: "estudiante" },
        { header: "Título TA", accessor: (r: any) => r.tutorAcademico?.titulo || '' },
        { header: "Nombre TA", accessor: (r: any) => r.tutorAcademico?.nombre || '' },
        { header: "Contacto TA", accessor: (r: any) => r.tutorAcademico?.contacto || '' },
        { header: "Nombre TM", accessor: (r: any) => r.tutorMetodologico?.nombre || '' },
        { header: "Contacto TM", accessor: (r: any) => r.tutorMetodologico?.contacto || '' },
        { header: "Horario TM", accessor: (r: any) => r.tutorMetodologico?.horario || '' },
        { header: "Nombre Eval", accessor: (r: any) => r.evaluador?.nombre || '' },
        { header: "Contacto Eval", accessor: (r: any) => r.evaluador?.contacto || '' },
      ]
    },
    "distribucion-tutores-v2": {
      title: "Dist. Tutores (Detallada)",
      subtitle: "Distribución de tutores con horario detallado",
      loadTable: async () => {
        const response = await reportsService.getDistribucionTutoresV2();
        return response.data;
      },
      pdfTemplate: (data) => <StudentPDF data={data as any[]} />,
      columns: [
        { header: "N°", accessor: "nro", className: "w-12 text-center" },
        { header: "Carrera", accessor: "carrera" },
        { header: "Estudiante", accessor: "estudiante" },
        { header: "Título TA", accessor: (r: any) => r.tutorAcademico?.titulo || '' },
        { header: "Nombre TA", accessor: (r: any) => r.tutorAcademico?.nombre || '' },
        { header: "Contacto TA", accessor: (r: any) => r.tutorAcademico?.contacto || '' },
        { header: "Nombre TM", accessor: (r: any) => r.tutorMetodologico?.nombre || '' },
        { header: "Contacto TM", accessor: (r: any) => r.tutorMetodologico?.contacto || '' },
        { header: "Horario TM", accessor: (r: any) => r.tutorMetodologico?.horario || '' },
        { header: "Horario Det.", accessor: (r: any) => r.tutorMetodologico?.horarioDetallado || '' },
        { header: "Nombre Eval", accessor: (r: any) => r.evaluador?.nombre || '' },
        { header: "Contacto Eval", accessor: (r: any) => r.evaluador?.contacto || '' },
      ]
    },
    "relacion-individual-docente": {
      title: "Relación Individual del Docente",
      subtitle: "Reporte individual por docente tutor",
      loadTable: async () => [],
      pdfTemplate: (data) => <StudentPDF data={data as any[]} />,
      columns: [
        { header: "N°", accessor: "nro", className: "w-12 text-center" },
        { header: "Región", accessor: "region" },
        { header: "Núcleo", accessor: "nucleo" },
        { header: "Extensión", accessor: "extension" },
        { header: "Carrera", accessor: "carrera" },
        { header: "Est. Nombre", accessor: (r: any) => r.estudiante?.nombre || '' },
        { header: "Est. Apellido", accessor: (r: any) => r.estudiante?.apellido || '' },
        { header: "Cédula", accessor: (r: any) => r.estudiante?.ci || '' },
        { header: "Sexo", accessor: (r: any) => r.estudiante?.sexo || '' },
        { header: "Tipo", accessor: (r: any) => r.estudiante?.tipo || '' },
        { header: "Teléfono", accessor: (r: any) => r.estudiante?.telefono || '' },
        { header: "Institución", accessor: (r: any) => r.institucion?.nombre || '' },
        { header: "Tutor Inst.", accessor: (r: any) => `${r.tutorInstitucional?.nombre || ''} ${r.tutorInstitucional?.apellido || ''}`.trim() },
        { header: "Dirección", accessor: "direccion" },
      ]
    }
  };

  const handleViewReport = useCallback(async (type: string) => {
    if (type === "prospectos") {
      setIsProspectosModalOpen(true);
      return;
    }
    if (type === "tutores-academicos" || type === "resumen-pasantias" || type === "relacion-empresas" || type === "distribucion-tutores" || type === "distribucion-tutores-v2" || type === "relacion-individual-docente") {
      if (type === "relacion-individual-docente") {
        toast("Seleccione un tutor desde la sección de tutores", { icon: "ℹ️" });
        return;
      }
      setLoadingReport(true);
      try {
        const periodNum = periodFilter ? parseInt(periodFilter.split('-')[0]) : undefined;
        const result = await fetchReportData(type, periodNum);
        if (result?.data) {
          setTableData(result.data);
          setReportType(type as ReportType);
          setIsTableModalOpen(true);
        }
      } catch (error) {
        console.error(`[Reports] Error viewing ${type}:`, error);
        toast.error('Error al cargar el reporte');
      } finally {
        setLoadingReport(false);
      }
    } else if (type.startsWith("aceptacion-tutor") || type.startsWith("solicitud-institucion") || type.startsWith("carta-postulacion") ||
               type.startsWith("acta-validacion") || type.startsWith("evaluacion-") || type.startsWith("constancia-")) {
      setSelectedDocumentType(type);
      setIsDocumentModalOpen(true);
    } else {
      const config = reportConfig[type as Exclude<ReportType, "">];
      if (!config?.loadPDF) {
        toast.error('Reporte no disponible');
        return;
      }
      setLoadingReport(true);
      try {
        const data = await config.loadPDF();
        setPdfData(data);
        setPdfTemplate(() => config.pdfTemplate);
        setIsPDFModalOpen(true);
      } catch (error) {
        toast.error('Error al cargar el reporte');
      } finally {
        setLoadingReport(false);
      }
    }
  }, [periodFilter, fetchReportData]);

  const handleExportExcel = useCallback(async (type: string) => {
    if (type === "relacion-individual-docente") {
      toast("Seleccione un tutor desde la sección de tutores", { icon: "ℹ️" });
      return;
    }
    setLoadingExcelId(type);
    try {
      const periodNum = periodFilter ? parseInt(periodFilter.split('-')[0]) : undefined;
      const result = await fetchReportData(type, periodNum);
      if (result?.data) {
        const periodLabel = periodFilter || "Todos";
        await exportExcel(type, result.data, periodLabel);
      }
    } catch (error) {
      console.error(`[Reports] Error exporting ${type}:`, error);
      toast.error('Error al exportar el reporte');
    } finally {
      setLoadingExcelId(null);
    }
  }, [periodFilter, fetchReportData, exportExcel]);

  const handleOpenReport = async () => {
    if (!reportType) {
      toast.error('Selecciona un tipo de reporte');
      return;
    }
    const config = reportConfig[reportType];
    if (!config) {
      toast.error('Tipo de reporte no válido');
      return;
    }
    setLoadingReport(true);
    try {
      if (config.loadTable) {
        const data = await config.loadTable();
        setTableData(data);
        setIsTableModalOpen(true);
      } else if (config.loadPDF) {
        const data = await config.loadPDF();
        setPdfData(data);
        setPdfTemplate(() => config.pdfTemplate);
        setIsPDFModalOpen(true);
      }
    } catch (error) {
      console.error('Error loading report:', error);
      toast.error('Error al cargar el reporte');
    } finally {
      setLoadingReport(false);
    }
  };

  const exportTableToExcel = async (data: any[], fileName: string) => {
    if (reportType === "tutores-academicos" || reportType === "resumen-pasantias") {
      const periodLabel = periodFilter || "Todos";
      await exportExcel(reportType, data, periodLabel);
      return;
    }
    const config = reportType ? reportConfig[reportType] : null;
    if (!config) return;
    try {
      await generateSimpleExcel(data, config.columns as { header: string; accessor: string | ((item: any) => string | number | boolean | null | undefined) }[], fileName, config.title);
      toast.success('Reporte exportado exitosamente');
    } catch (error) {
      console.error('[Reports] Error exporting Excel:', error);
      toast.error('Error al exportar el reporte');
    }
  };

  const maxValue = periodData.length > 0 ? Math.max(...periodData.map((d) => d.value)) : 1;
  const currentConfig = reportType ? reportConfig[reportType] : null;

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
                ...availablePeriods
              ]}
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e as unknown as string)}
              className="w-40"
            />
            <Button variant="outline" onClick={fetchDashboardData} startIcon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            }>
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
            <div className="col-span-4 text-center py-8 text-text-tertiary">No hay datos disponibles</div>
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
                      <span className="text-sm text-text-primary dark:text-text-emphasis" title={item.fullName}>{item.label}</span>
                      <span className="text-sm font-medium text-text-secondary dark:text-text-tertiary">{item.value} ({item.percentage}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.percentage}%`, backgroundColor: item.color || "var(--color-brand-500)" }} />
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
                        <span className="text-xs font-medium text-text-secondary dark:text-text-tertiary mb-1">{item.value}</span>
                        <div className="w-full max-w-[48px] bg-brand-500 rounded-t-lg transition-all duration-500 hover:bg-brand-600" style={{ height: `${Math.max(heightPercent * 1.5, 8)}px` }} />
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

        <ComponentCard title="Reportes Disponibles" desc="Seleccione un reporte para visualizarlo o exportarlo">
          <ReportList
            sections={DOCUMENT_SECTIONS}
            loadingId={loadingExcelId}
            onView={handleViewReport}
            onExportExcel={handleExportExcel}
          />
        </ComponentCard>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ComponentCard title="Generar Reporte" className="lg:col-span-1">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-2">Tipo de Reporte</label>
                <CustomSelect
                  options={[
                    { value: "", label: "Seleccionar tipo" },
                    { value: "students", label: "Estudiantes" },
                    { value: "enrollments", label: "Inscripciones" },
                    { value: "institutions", label: "Instituciones" },
                    { value: "tutores-academicos", label: "ANEXO 4 - Tutores Académicos" },
                    { value: "resumen-pasantias", label: "RESUMEN PASANTIAS" },
                    { value: "culminated-students", label: "Estudiantes Culminados" }
                  ]}
                  value={reportType}
                  onChange={(e) => setReportType(e as ReportType)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-2">Período</label>
                <CustomSelect
                  options={[
                    { value: "", label: "Todos los períodos" },
                    ...availablePeriods
                  ]}
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e as unknown as string)}
                  className="w-full"
                />
              </div>
              <Button className="w-full" disabled={!reportType || loadingReport} onClick={handleOpenReport}>
                {loadingReport ? 'Cargando...' : `Ver Reporte de ${currentConfig?.title.split(' - ')[0] || '...'}`}
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
                  <div key={report.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors group">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-500/10">
                      <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary dark:text-text-emphasis truncate">{report.name}</p>
                      <p className="text-xs text-text-tertiary">{report.type} • {report.user || 'Sistema'} • {new Date(report.date).toLocaleDateString("es-VE")}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-text-tertiary">No hay reportes recientes</div>
            )}
          </ComponentCard>
        </div>

        {currentConfig && (
          <TablePreviewModal<TutorAcademicReportRow>
            isOpen={isTableModalOpen}
            onClose={() => setIsTableModalOpen(false)}
            title={currentConfig.title}
            subtitle={currentConfig.subtitle}
            data={tableData}
            searchTerm={tableSearchTerm}
            onSearchChange={setTableSearchTerm}
            fileName={`${reportType}_${new Date().toISOString().split('T')[0]}`}
            exportToExcel={exportTableToExcel}
            columns={currentConfig.columns as any[]}
          />
        )}

        {currentConfig && pdfTemplate && (
          <PDFPreviewModal
            isOpen={isPDFModalOpen}
            onClose={() => setIsPDFModalOpen(false)}
            title={currentConfig.title}
            data={pdfData as any[]}
            template={pdfTemplate as any}
            fileName={`${reportType}_${new Date().toISOString().split('T')[0]}.pdf`}
            searchTerm={pdfSearchTerm}
            onSearchChange={setPdfSearchTerm}
          />
        )}

        <DocumentReportModal
          isOpen={isDocumentModalOpen}
          onClose={() => { setIsDocumentModalOpen(false); setSelectedDocumentType(""); }}
          documentType={selectedDocumentType}
        />

        <ProspectListModal
          isOpen={isProspectosModalOpen}
          onClose={() => setIsProspectosModalOpen(false)}
        />
      </div>
    </>
  );
}
