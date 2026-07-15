import { useState, useEffect, useCallback, useRef, useMemo, ReactElement } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import CustomSelect from "../../components/form/CustomSelect";
import MultiSelect from "../../components/form/MultiSelect";
import type { MultiSelectOption } from "../../components/form/MultiSelect";
import { getPeriodsForReports } from "../../features/periods/services/periodService";
import { getCareers } from "../../features/careers/services/careersService";
import { reportsService, CareerData, PeriodData, TutorAcademicReportRow } from "../../features/reports/services/reportsService";
import { TablePreviewModal } from "../../components/ui/table/TablePreviewModal";
import { PDFPreviewModal } from "../../components/ui/pdf/PDFPreviewModal";
import { ReportList } from "../../features/reports/components/ReportList";
import { DocumentReportModal } from "../../features/reports/components/DocumentReportModal";
import { ProyeccionModal } from "./ProyeccionModal";
import { RelacionInstitucionesModal } from "./RelacionInstitucionesModal";
import { useReports } from "../../features/reports/hooks/useReports";
import { getReportConfig, DOCUMENT_SECTIONS, ReportType } from "../../features/reports/config/reportConfig";

import { useToast } from "../../context/toast";
import { TOAST } from "../../components/ui/dialog/DialogConfig";
import { DocumentProps } from "@react-pdf/renderer";
import { SearchInput } from "../../components/common/SearchInput";

export default function ReportsPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<{ label: string; value: number | string; change?: number; trend?: "up" | "down" | "stable" }[]>([]);
  const [careerData, setCareerData] = useState<CareerData[]>([]);
  const [periodData, setPeriodData] = useState<PeriodData[]>([]);

  const [periodFilter, setPeriodFilter] = useState("");
  const [careerIdsFilter, setCareerIdsFilter] = useState<number[]>([]);
  const [careerOptions, setCareerOptions] = useState<MultiSelectOption[]>([]);
  const [availablePeriods, setAvailablePeriods] = useState<{ value: string; label: string }[]>([]);
  const [activeReportId, setActiveReportId] = useState<ReportType>("");
  const [searchQuery, setSearchQuery] = useState("");

  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState("");
  const [tableData, setTableData] = useState<TutorAcademicReportRow[]>([]);
  const [pdfData, setPdfData] = useState<unknown[]>([]);
  const [pdfTemplate, setPdfTemplate] = useState<((data: unknown[]) => ReactElement<DocumentProps>) | null>(null);
  const [tableSearchTerm, setTableSearchTerm] = useState("");
  const [pdfSearchTerm, setPdfSearchTerm] = useState("");
  const [loadingExcelId, setLoadingExcelId] = useState<string | null>(null);

  const [isProyeccionModalOpen, setIsProyeccionModalOpen] = useState(false);
  const [isRelacionInstitucionesModalOpen, setIsRelacionInstitucionesModalOpen] = useState(false);

  const [paginationInfo, setPaginationInfo] = useState<{ page: number; totalPages: number; totalRecords: number } | null>(null);
  const activeReportConfigRef = useRef<{ type: string; periodNum?: number } | null>(null);
  const periodsRef = useRef<any[]>([]);

  const { fetchData: fetchReportData, exportExcel } = useReports();

  /** Resuelve el PERIOD_ID numérico a partir de la descripción del período */
  const resolvePeriodId = useCallback((desc: string | undefined): number | undefined => {
    if (!desc) return undefined;
    const found = periodsRef.current.find(
      (p: any) => p.description === desc || p.DESCRIPTION === desc
    );
    if (!found) return undefined;
    const rawId = found.PERIOD_ID ?? found.periodId;
    return rawId !== undefined ? Number(rawId) : undefined;
  }, []);

  /** Descarga un blob como archivo */
  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, careerRes, periodRes, apiPeriods, careers] = await Promise.all([
        reportsService.getStats(periodFilter),
        reportsService.getStudentsByCareer(),
        reportsService.getEnrollmentsByPeriod(),
        getPeriodsForReports(),
        getCareers()
      ]);
      setAvailablePeriods(
        (apiPeriods || []).map((p: any) => ({
          value: p.description,
          label: p.description
        }))
      );
      periodsRef.current = apiPeriods || [];
      setCareerOptions(
        (Array.isArray(careers) ? careers : (careers as any)?.data || [])
          .map((c: any) => ({
            value: String(c.careerId),
            text: c.careerName || c.career_name || ''
          }))
      );
      setMetrics(statsRes.metrics || []);
      setCareerData(careerRes);
      setPeriodData(periodRes);
    } catch (error) {
      console.error('Error fetching reports:', error);
      addToast(TOAST.loadError());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [periodFilter]);

  const loadReportPage = useCallback(async (type: string, page: number, limit = 50, careerIds?: number[]) => {
    const config = getReportConfig(type);
    if (!config) return;
    try {
      const periodNum = resolvePeriodId(periodFilter || undefined);
      const result = await fetchReportData(type, periodNum, undefined, page, limit, careerIds);
      if (!result?.data) {
        addToast({ variant: "error", title: "Sin datos", message: "No se encontraron datos" });
        return null;
      }
      return { data: result.data, meta: result.meta, config };
    } catch (error) {
      console.error(`[Reports] Error loading ${type}:`, error);
      addToast(TOAST.loadError());
      return null;
    }
  }, [periodFilter, fetchReportData, resolvePeriodId]);

  const handleViewReport = useCallback(async (type: string) => {
    if (type === "proyeccion-pasantias") {
      setIsProyeccionModalOpen(true);
      return;
    }
    if (type === "relacion-instituciones-solicitan") {
      setIsRelacionInstitucionesModalOpen(true);
      return;
    }
    // Documentos oficiales → DocumentReportModal
    if (/^(aceptacion-tutor|solicitud-institucion|carta-postulacion|acta-validacion|evaluacion-|constancia-)/.test(type)) {
      setSelectedDocumentType(type);
      setIsDocumentModalOpen(true);
      return;
    }
    // Reportes del config (Excel o PDF)
    const config = getReportConfig(type);
    if (!config) {
      addToast({ variant: "error", title: "No disponible", message: "Reporte no disponible" });
      return;
    }
    const effectiveCareerIds = careerIdsFilter.length > 0 ? careerIdsFilter : undefined;
    if (config.type === 'excel') {
      const loaded = await loadReportPage(type, 0, 50, effectiveCareerIds);
      if (!loaded) return;
      setTableData(loaded.data);
      const totalPages = loaded.meta?.total ? Math.ceil(loaded.meta.total / (loaded.meta?.limit || 50)) : 1;
      setPaginationInfo({ page: 0, totalPages, totalRecords: loaded.meta?.total || loaded.data.length });
      activeReportConfigRef.current = { type, periodNum: resolvePeriodId(periodFilter || undefined) };
      setActiveReportId(type as ReportType);
      setIsTableModalOpen(true);
    } else {
      const result = await loadReportPage(type, 0, 9999, effectiveCareerIds);
      if (!result) return;
      setPdfData(result.data);
      setPdfTemplate(() => config.pdfTemplate!);
      setIsPDFModalOpen(true);
    }
  }, [periodFilter, loadReportPage, careerIdsFilter]);

  const handleTablePageChange = useCallback(async (newPage: number) => {
    const ref = activeReportConfigRef.current;
    if (!ref) return;
    const effectiveCareerIds = careerIdsFilter.length > 0 ? careerIdsFilter : undefined;
    const loaded = await loadReportPage(ref.type, newPage, 50, effectiveCareerIds);
    if (!loaded) return;
    setTableData(loaded.data);
    const totalPages = loaded.meta?.total ? Math.ceil(loaded.meta.total / (loaded.meta?.limit || 50)) : 1;
    setPaginationInfo({ page: newPage, totalPages, totalRecords: loaded.meta?.total || loaded.data.length });
  }, [loadReportPage, careerIdsFilter]);

  /** Cambia filtros dentro del preview y recarga datos */
  const handlePreviewFilterChange = useCallback(async (period: string, careerIds: number[]) => {
    const ref = activeReportConfigRef.current;
    if (!ref) return;
    // ponytail: sync parent state so MultiSelect reflects selection
    setCareerIdsFilter(careerIds);
    if (period !== undefined) setPeriodFilter(period);
    const periodNum = resolvePeriodId(period || undefined);
    const effectiveCareerIds = careerIds.length > 0 ? careerIds : undefined;
    try {
      const result = await fetchReportData(ref.type, periodNum, undefined, 0, 50, effectiveCareerIds);
      if (!result?.data) {
        addToast({ variant: "error", title: "Sin datos", message: "No se encontraron datos" });
        return;
      }
      setTableData(result.data);
      const totalPages = result.meta?.total ? Math.ceil(result.meta.total / (result.meta?.limit || 50)) : 1;
      setPaginationInfo({ page: 0, totalPages, totalRecords: result.meta?.total || result.data.length });
    } catch (error) {
      addToast(TOAST.loadError());
    }
  }, [fetchReportData, resolvePeriodId]);

  const handleExportExcel = useCallback(async (type: string) => {
    if (type === "proyeccion-pasantias") {
      setIsProyeccionModalOpen(true);
      return;
    }
    if (type === "relacion-instituciones-solicitan") {
      setIsRelacionInstitucionesModalOpen(true);
      return;
    }

    setLoadingExcelId(type);
    try {
      const periodNum = resolvePeriodId(periodFilter || undefined);
      const effectiveCareerIds = careerIdsFilter.length > 0 ? careerIdsFilter : undefined;
      const label = periodFilter || "Todos";
      const safeLabel = label.replace(/\s+/g, '_');
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `${type}_${safeLabel}_${dateStr}.xlsx`;

      const blob = await reportsService.exportReportExcel(type, periodNum, undefined, effectiveCareerIds);
      downloadBlob(blob, filename);
      addToast({ variant: "success", title: "Exportado", message: "Reporte exportado exitosamente" });
    } catch (error: any) {
      console.error(`[Reports] Error exporting ${type}:`, error);
      const message = error?.response?.data?.message || 'Error al exportar el reporte';
      addToast({ variant: "error", title: "Error al exportar", message });
    } finally {
      setLoadingExcelId(null);
    }
  }, [periodFilter, downloadBlob, careerIdsFilter, resolvePeriodId]);

  const exportTableToExcel = async (data: any[], fileName: string) => {
    try {
      const config = getReportConfig(activeReportId);
      if (!config) return;
      const periodNum = resolvePeriodId(periodFilter || undefined);
      const effectiveCareerIds = careerIdsFilter.length > 0 ? careerIdsFilter : undefined;
      const blob = await reportsService.exportReportExcel(activeReportId, periodNum, undefined, effectiveCareerIds);
      downloadBlob(blob, `${fileName}.xlsx`);
      addToast({ variant: "success", title: "Exportado", message: "Reporte exportado exitosamente" });
    } catch (error: any) {
      console.error('[Reports] Error exporting Excel:', error);
      addToast({ variant: "error", title: "Error al exportar", message: error?.response?.data?.message || 'Error al exportar el reporte' });
    }
  };

  const maxValue = periodData.length > 0 ? Math.max(...periodData.map((d) => d.value)) : 1;
  const currentConfig = getReportConfig(activeReportId);
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return DOCUMENT_SECTIONS;
    const q = searchQuery.toLowerCase();
    return DOCUMENT_SECTIONS.map(s => ({
      ...s,
      reports: s.reports.filter(r =>
        r.title.toLowerCase().includes(q) || r.subtitle.toLowerCase().includes(q)
      )
    })).filter(s => s.reports.length > 0);
  }, [searchQuery]);

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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Buscar reporte..."
              className="w-full sm:!w-56"
            />
            <CustomSelect
              options={[
                { value: "", label: "Todos los períodos" },
                ...availablePeriods
              ]}
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e as unknown as string)}
              className="w-full sm:w-40"
            />
            <MultiSelect
              label=""
              options={careerOptions}
              value={careerIdsFilter.map(String)}
              onChange={(selected) => setCareerIdsFilter(selected.map(Number))}
              placeholder="Todas las carreras"
              className="w-full sm:w-56"
            />
            <Button variant="outline" onClick={fetchDashboardData} className="w-full sm:w-auto" startIcon={
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
            sections={filteredSections}
            loadingId={loadingExcelId}
            onView={handleViewReport}
            onExportExcel={handleExportExcel}
          />
          {filteredSections.length === 0 && searchQuery.trim() && (
            <p className="text-center text-text-tertiary py-8 text-sm">
              No se encontraron reportes para "{searchQuery}"
            </p>
          )}
        </ComponentCard>



        {currentConfig && (
          <TablePreviewModal<TutorAcademicReportRow>
            isOpen={isTableModalOpen}
            onClose={() => { setIsTableModalOpen(false); setPaginationInfo(null); }}
            title={currentConfig.title}
            subtitle={currentConfig.subtitle}
            data={tableData}
            searchTerm={tableSearchTerm}
            onSearchChange={setTableSearchTerm}
            fileName={`${activeReportId}_${new Date().toISOString().split('T')[0]}`}
            exportToExcel={exportTableToExcel}
            columns={currentConfig.columns as any[]}
            pagination={paginationInfo ? {
              page: paginationInfo.page,
              totalPages: paginationInfo.totalPages,
              totalRecords: paginationInfo.totalRecords,
              onPageChange: handleTablePageChange,
            } : undefined}
            renderFilters={() => (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest pl-1">
                    Período
                  </label>
                  <CustomSelect
                    options={[
                      { value: "", label: "Todos los períodos" },
                      ...availablePeriods
                    ]}
                    value={periodFilter}
                    onChange={(e) => handlePreviewFilterChange(e as unknown as string, careerIdsFilter)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest pl-1">
                    Carrera
                  </label>
                  <MultiSelect
                    label=""
                    options={careerOptions}
                    value={careerIdsFilter.map(String)}
                    onChange={(selected) => handlePreviewFilterChange(periodFilter, selected.map(Number))}
                    placeholder="Todas las carreras"
                  />
                </div>
              </div>
            )}
          />
        )}

        {currentConfig && pdfTemplate && (
          <PDFPreviewModal
            isOpen={isPDFModalOpen}
            onClose={() => setIsPDFModalOpen(false)}
            title={currentConfig.title}
            data={pdfData as any[]}
            template={pdfTemplate as any}
            fileName={`${activeReportId}_${new Date().toISOString().split('T')[0]}.pdf`}
            searchTerm={pdfSearchTerm}
            onSearchChange={setPdfSearchTerm}
          />
        )}

        <DocumentReportModal
          isOpen={isDocumentModalOpen}
          onClose={() => { setIsDocumentModalOpen(false); setSelectedDocumentType(""); }}
          documentType={selectedDocumentType}
        />

        <ProyeccionModal
          isOpen={isProyeccionModalOpen}
          onClose={() => setIsProyeccionModalOpen(false)}
        />

        <RelacionInstitucionesModal
          isOpen={isRelacionInstitucionesModalOpen}
          onClose={() => setIsRelacionInstitucionesModalOpen(false)}
        />

      </div>
    </>
  );
}
