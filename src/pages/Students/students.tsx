/**
 * @file students.tsx
 * @description Página principal para la gestión del módulo de Estudiantes.
 * Orquesta la visualización de datos en tablas y operaciones CRUD mediante hooks especializados.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import { Tabs } from "../../components/ui/tabs/Tabs";
import { useTabs } from "../../hooks/useTabs";
import { useTabs as useAppTabs } from "../../context/tab";
import UnifiedDialog from "../../components/ui/dialog/UnifiedDialog";
import Button from "../../components/ui/button/Button";
import { SkeletonLoader, TitleSkeleton, BreadcrumbSkeleton, TablePageSkeleton } from "../../components/ui/skeleton";
import { PlusCircleIcon } from "../../icons/actions";
import { FileText, Upload } from "lucide-react";
import { ArrowUpIcon } from "../../icons";
import StudentTable from "../../features/students/components/StudentTable";
import StudentModal from "../../features/students/components/StudentModal";
import StudentViewModal from "../../features/students/components/StudentViewModal";
import ImportStudentsModal from "../../features/students/components/ImportStudentsModal";
import BatchPreEnrollModal from "../../features/pre-enrollment/components/BatchPreEnrollModal";
import { usePreEnrollment } from "../../features/pre-enrollment/hooks/usePreEnrollment";
import type { BatchPreEnrollRequest } from "../../features/pre-enrollment/services/preEnrollmentService";
import { PDFPreviewModal } from "../../components/ui/pdf/PDFPreviewModal";
import { StudentPDF } from "../../components/ui/pdf/templates/StudentPDF";
import UnifiedReportModal from "../../components/common/UnifiedReportModal";
import { useStudents } from "../../features/students/hooks/useStudents";
import { useStudentModals } from "../../features/students/hooks/useStudentModals";
import { useStudentFilters } from "../../features/students/hooks/useStudentFilters";
import type { Student } from "../../features/students/types";
import { useCareers } from "../../features/careers/hooks/useCareers";
import { useInternshipTypes } from "../../features/internship-types/hooks/useInternshipTypes";
import CareerModal from "../../features/careers/components/CareerModal";
import { useLists } from "../../features/lists/hooks/useLists";
import type { ListValue } from "../../features/lists/types";
import { exportToExcel, type ExportColumn } from "../../utils/excel";
import { matchSearch } from "../../utils/searchNormalizer";
import ExportFormatModal, { type ExportFormat } from "../../components/common/ExportFormatModal";
import { exportFullStudents } from "../../features/students/services/studentsService";
import { X } from "lucide-react";

export default function StudentsPage() {
  const [pageLoading, setPageLoading] = useState(true);
  const navigate = useNavigate();
  const { fetchMultipleLists } = useLists();
  const [dynamicLists, setDynamicLists] = useState<Record<string, ListValue[]>>({});

  const {
    students,
    status,
    loadingAction,
    error,
    addStudent,
    editStudent,
    toggleStatus,
    bulkRemoveStudents,
    bulkRestoreStudents,
    refreshStudents,
  } = useStudents();

  const { batchAddPreEnrollment } = usePreEnrollment();

  const modals = useStudentModals({
    students,
    addStudent,
    editStudent,
    toggleStatus,
    bulkRemoveStudents,
    bulkRestoreStudents,
    refreshStudents,
    addCareer: async () => {},
    loadingAction,
  });

  const tabsState = useTabs({ defaultTab: 'Activas' });
  const { openTab } = useAppTabs();

  const filters = useStudentFilters({ students, activeTab: tabsState.activeTab });

  const { careers, addCareer } = useCareers();
  const { activeOptions: activeInternshipOptions, fetchAll: fetchInternshipTypes } = useInternshipTypes();

  // ── Load dynamic lists on mount ──────────────────────────────────
  useEffect(() => {
    const loadLists = async () => {
      try {
        const lists = await fetchMultipleLists([
          "Nacionalidad", "Sexo", "PREFIJO", "Registro Civil",
          "Regimen/Turno", "Tipo de estudiante", "Trabajo", "Rango Militar"
        ]);
        setDynamicLists(lists);
      } catch (error) {
        console.error("Error loading dynamic lists:", error);
      } finally {
        setPageLoading(false);
      }
    };
    loadLists();
  }, [fetchMultipleLists]);

  useEffect(() => {
    fetchInternshipTypes();
  }, [fetchInternshipTypes]);

  // ── PDF data ─────────────────────────────────────────────────────
  const pdfFilteredData = (Array.isArray(students) ? students : [])
    .filter((s) => {
      const fullName = `${s.firstName} ${s.middleName || ""} ${s.lastName} ${s.secondLastName || ""}`;
      const matchesSearch = !modals.pdfSearchTerm.trim() ||
        matchSearch(s.identificationNumber ?? '', modals.pdfSearchTerm) ||
        matchSearch(fullName, modals.pdfSearchTerm);
      return matchesSearch && !!s.status;
    });

  // ── Export ───────────────────────────────────────────────────────
  const handleExportExcel = () => {
    const columns: ExportColumn<Record<string, unknown>>[] = [
      { key: 'identificationNumber', label: 'Cédula' },
      { key: 'fullNames', label: 'Nombre Completo' },
      { key: 'email', label: 'Correo Electrónico' },
      { key: 'phone', label: 'Teléfono' },
      { key: 'careerName', label: 'Carrera' },
      { key: 'regime', label: 'Régimen' },
      { key: 'semester', label: 'Semestre' },
      { key: 'enrollmentDate', label: 'Fecha de Inscripción' },
    ];
    exportToExcel(filters.filtered as unknown as Record<string, unknown>[], columns, 'estudiantes', 'Estudiantes');
  };

  const handleBatchSubmit = async (request: BatchPreEnrollRequest) => {
    const result = await batchAddPreEnrollment(request);
    if (result) modals.setSelectedIds([]);
    return result;
  };

  return (
    <>
      <PageMeta title="Gestión de Estudiantes" description="Administración de estudiantes" />

      <SkeletonLoader isLoading={pageLoading} skeleton={<BreadcrumbSkeleton />} id="students-breadcrumb">
        <PageBreadcrumb pageTitle="Estudiantes" />
      </SkeletonLoader>

      <div className="stagger-delay">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <SkeletonLoader isLoading={pageLoading} skeleton={<TitleSkeleton />} id="students-title">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-text-primary dark:text-text-emphasis">Listado de Estudiantes</h2>
              </div>
              <p className="mt-1 text-sm text-text-secondary dark:text-text-tertiary">Gestiona la información y estado académico de los estudiantes.</p>
            </SkeletonLoader>
          </div>

          {!pageLoading && (
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" onClick={() => modals.setIsPDFModalOpen(true)} disabled={modals.selectedIds.length > 0} startIcon={<FileText className="h-5 w-5" />}>Reporte</Button>
              <Button variant="outline" onClick={() => modals.setIsImportModalOpen(true)} disabled={modals.selectedIds.length > 0} startIcon={<ArrowUpIcon className="h-5 w-5" />}>Importar</Button>
              <Button variant="outline" onClick={() => modals.setIsExportModalOpen(true)} disabled={modals.selectedIds.length > 0} startIcon={<Upload className="h-5 w-5" />}>Exportación</Button>
              <Button onClick={modals.handleCreate} disabled={modals.selectedIds.length > 0} startIcon={<PlusCircleIcon className="h-5 w-5" />}>Nuevo Estudiante</Button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* ── Filter toolbar ──────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filters.filters.careerId}
              onChange={(e) => filters.setFilter("careerId", e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-primary"
              aria-label="Filtrar por carrera"
            >
              <option value="">Todas las carreras</option>
              {filters.availableCareers.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            <select
              value={filters.filters.regime}
              onChange={(e) => filters.setFilter("regime", e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-primary"
              aria-label="Filtrar por régimen"
            >
              <option value="">Todos los regímenes</option>
              {filters.availableRegimes.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>

            <select
              value={filters.filters.studentType}
              onChange={(e) => filters.setFilter("studentType", e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-primary"
              aria-label="Filtrar por tipo"
            >
              <option value="">Todos los tipos</option>
              {filters.availableStudentTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            <select
              value={filters.filters.periodId}
              onChange={(e) => filters.setFilter("periodId", e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-primary"
              aria-label="Filtrar por período"
            >
              <option value="">Todos los períodos</option>
              {filters.availablePeriods.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>

            {filters.hasActiveFilters && (
              <button
                onClick={filters.clearFilters}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                <X className="w-4 h-4" />
                Limpiar filtros
              </button>
            )}
          </div>

          {/* ── Table ─────────────────────────────────────────────── */}
          <ComponentCard title={tabsState.activeTab === "Activas" ? "Estudiantes Activos" : "Estudiantes Inactivos"}>
            <Tabs
              options={[{ id: 'Activas', label: 'Activos' }, { id: 'Inactivas', label: 'Inactivos' }]}
              {...tabsState.tabProps}
              variant="underline"
              className="mb-6"
            />

            <SkeletonLoader isLoading={pageLoading || status === "loading"} skeleton={<TablePageSkeleton rows={5} />} id="students-table">
              <StudentTable
                data={filters.filtered}
                status={status}
                error={error}
                activeTab={tabsState.activeTab as "Activas" | "Inactivas"}
                onEdit={modals.handleEdit}
                onToggleStatus={modals.handleToggleStatus}
                onExportToPreEnrollment={(row) => modals.handleExportToPreEnrollment(row, openTab)}
                onView={modals.setViewStudent}
                onBulkDelete={modals.handleBulkDelete}
                onBulkRestore={modals.handleBulkRestore}
                onBatchPreEnroll={modals.handleBatchPreEnroll}
                selectedIds={modals.selectedIds}
                onSelectionChange={modals.setSelectedIds}
                inactiveMode={tabsState.activeTab === "Inactivas"}
                loading={loadingAction}
              />
            </SkeletonLoader>
          </ComponentCard>

          {/* ── Modals ────────────────────────────────────────────── */}
          <StudentModal
            isOpen={modals.isModalOpen}
            onClose={modals.handleCloseModal}
            onSave={modals.handleSave}
            editingStudent={modals.editingStudent}
            dynamicLists={dynamicLists}
            isLoading={loadingAction}
            onEditExisting={modals.handleEditFromExisting}
          />

          <CareerModal
            isOpen={modals.isCareerModalOpen}
            onClose={() => modals.setIsCareerModalOpen(false)}
            onSave={modals.handleCareerSave}
            editingCareer={null}
            internshipOptions={activeInternshipOptions}
            isLoading={loadingAction}
            hasPendingEvaluations={false}
            isInUse={false}
            existingCareers={careers}
            onAddInternshipType={() => {}}
            lastCreatedInternshipTypeId={null}
            onConsumeLastCreatedInternshipType={() => {}}
          />

          <StudentViewModal
            isOpen={!!modals.viewStudent}
            onClose={() => modals.setViewStudent(null)}
            onEdit={modals.handleEdit}
            student={modals.viewStudent}
          />

          <BatchPreEnrollModal
            isOpen={modals.isBatchModalOpen}
            onClose={() => modals.setIsBatchModalOpen(false)}
            students={filters.filtered.filter(s => modals.batchStudentIds.includes(s.studentId)) as unknown as Student[]}
            onBatchPreEnroll={handleBatchSubmit}
            onComplete={() => refreshStudents()}
          />

          <ExportFormatModal
            isOpen={modals.isExportModalOpen}
            onClose={() => modals.setIsExportModalOpen(false)}
            onExport={(format: ExportFormat) => exportFullStudents(format)}
            entityLabel="estudiantes"
          />

          <ImportStudentsModal
            isOpen={modals.isImportModalOpen}
            onClose={() => modals.setIsImportModalOpen(false)}
            onImportComplete={() => refreshStudents()}
          />

          <UnifiedReportModal
            isOpen={modals.isPDFModalOpen}
            onClose={() => modals.setIsPDFModalOpen(false)}
            onExportExcel={handleExportExcel}
          />

          <PDFPreviewModal
            isOpen={modals.isPDFModalOpen}
            onClose={() => modals.setIsPDFModalOpen(false)}
            title="Reporte de Estudiantes Activos"
            data={pdfFilteredData}
            template={(data) => <StudentPDF data={data} />}
            fileName={`estudiantes-activos-${new Date().toISOString().split('T')[0]}.pdf`}
            searchTerm={modals.pdfSearchTerm}
            onSearchChange={modals.setPdfSearchTerm}
            renderFilters={() => (
              <div className="space-y-4">
                <p className="text-sm text-text-tertiary">Filtre por nombre o cédula usando el campo de búsqueda.</p>
              </div>
            )}
            columns={[
              { header: "Cédula", accessor: (s: any) => `${s.identificationPrefix}-${s.identificationNumber}` },
              { header: "Estudiante", accessor: (s: any) => `${s.firstName} ${s.lastName}` },
            ]}
          />

          <UnifiedDialog
            isOpen={!!modals.confirmation}
            onClose={() => !loadingAction && modals.setConfirmation(null)}
            onConfirm={modals.confirmation?.onConfirm || (() => {})}
            title={modals.confirmation?.title || ""}
            message={modals.confirmation?.message || ""}
            confirmLabel={modals.confirmation?.confirmText || "Confirmar"}
            variant={modals.confirmation?.variant || "info"}
            isLoading={loadingAction}
          />
        </div>
      </div>
    </>
  );
}
