/**
 * @file PreEnrollment.tsx
 * @description Página principal para la gestión del módulo de Pre-Inscripción.
 */

import { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import UnifiedDialog from "../../components/ui/dialog/UnifiedDialog";
import { DialogVariant } from "../../components/ui/dialog/DialogConfig";
import Button from "../../components/ui/button/Button";
import { FullScreenLoader } from "../../components/ui/loader";
import { SkeletonLoader, TitleSkeleton, BreadcrumbSkeleton, TablePageSkeleton } from "../../components/ui/skeleton";
import { RefreshIcon, PlusCircleIcon } from "../../icons/actions";
import { DownloadIcon } from "../../icons";

import PreEnrollmentTable from "../../features/pre-enrollment/components/PreEnrollmentTable";
import PreEnrollmentModal from "../../features/pre-enrollment/components/PreEnrollmentModal";
import PreEnrollmentViewModal from "../../features/pre-enrollment/components/PreEnrollmentViewModal";
import { PDFPreviewModal } from "../../components/ui/pdf/PDFPreviewModal";
import { PreEnrollmentPDF } from "../../components/ui/pdf/templates/PreEnrollmentPDF";
import { usePreEnrollment } from "../../features/pre-enrollment/hooks/usePreEnrollment";
import { usePeriods } from "../../features/periods/hooks/usePeriods";
import { getInternshipTypes, mapToOptions } from "../../features/internship-types/services/internshipTypesService";
import { PreEnrollment, PreEnrollmentRowData } from "../../features/pre-enrollment/types";
import { formatDateTime } from "../../utils/date";

const formatPreEnrollmentToRow = (p: PreEnrollment): PreEnrollmentRowData => ({
    ...p,
    preEnrollmentDate: formatDateTime(p.preEnrollmentDate),
});

export default function PreEnrollmentPage() {
    const [pageLoading, setPageLoading] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    const [initialCi, setInitialCi] = useState<string | null>(null);
    const { periodos } = usePeriods();
    const [periodOptions, setPeriodOptions] = useState<{ value: string; label: string }[]>([]);
    const [practiceTypeOptions, setPracticeTypeOptions] = useState<{ value: string; label: string }[]>([]);

    useEffect(() => {
        if (periodos.length > 0) {
            const mappedPeriods = periodos.map(p => ({
                value: p.description.toUpperCase(),
                label: p.description.toUpperCase()
            }));
            setPeriodOptions(mappedPeriods);
        }
    }, [periodos]);

    useEffect(() => {
        const loadFilterOptions = async () => {
            try {
                // Cargar tipos de práctica desde el servicio especializado
                const practiceData = await getInternshipTypes();
                const mappedPractice = mapToOptions(practiceData).map(opt => ({
                    value: opt.value,
                    label: opt.label,
                    id: opt.id
                }));

                if (mappedPractice.length > 0) {
                    setPracticeTypeOptions(mappedPractice);
                } else {
                    // Fallback si no hay datos en la BD
                    setPracticeTypeOptions([
                        { value: "ORDINARIA", label: "ORDINARIA" },
                        { value: "ESPECIAL", label: "ESPECIAL" },
                    ]);
                }
            } catch (error) {
                console.error("Error loading filter options:", error);
                // Fallback en caso de error
                setPracticeTypeOptions([
                    { value: "ORDINARIA", label: "ORDINARIA" },
                    { value: "ESPECIAL", label: "ESPECIAL" },
                ]);
            }
        };
        loadFilterOptions();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setPageLoading(false);
        }, 500);

        // Verificar si venimos de una exportación de estudiante
        if (location.state?.exportStudentCi) {
            setInitialCi(location.state.exportStudentCi);
            setIsModalOpen(true);
            // Limpiar el estado para que no se vuelva a abrir al recargar
            navigate(location.pathname, { replace: true, state: {} });
        }

        return () => clearTimeout(timer);
    }, [location, navigate]);

    const {
        preEnrollments,
        status,
        loadingAction,
        addPreEnrollment,
        editPreEnrollment,
        toggleStatus,
        bulkToggleStatus,
    } = usePreEnrollment();

    const [activeTab, setActiveTab] = useState<"Activas" | "Inactivas">("Activas");
    const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Estados para filtros del PDF
    const [pdfSearchTerm, setPdfSearchTerm] = useState("");
    const [pdfPeriodFilter, setPdfPeriodFilter] = useState("");
    const [pdfPracticeTypeFilter, setPdfPracticeTypeFilter] = useState("");

    const [editingEntry, setEditingEntry] = useState<PreEnrollment | null>(null);
    const [viewItem, setViewItem] = useState<PreEnrollmentRowData | null>(null);

    type ConfirmationInfo = {
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        confirmText: string;
        variant: DialogVariant;
    };

    const [confirmation, setConfirmation] = useState<ConfirmationInfo | null>(null);

    const filtered = useMemo(() => {
        return preEnrollments.map(formatPreEnrollmentToRow);
    }, [preEnrollments]);

    const pdfFilteredData = useMemo(() => {
        const search = pdfSearchTerm.trim().toLowerCase();
        const period = pdfPeriodFilter.trim().toLowerCase();
        const practiceType = pdfPracticeTypeFilter.trim().toLowerCase();

        return (Array.isArray(preEnrollments) ? preEnrollments : [])
            .filter(p => p.status === true)
            .filter(p => {
                const matchesSearch = !search || 
                    p.identificationNumber.toLowerCase().includes(search) || 
                    p.studentName.toLowerCase().includes(search);
                const matchesPeriod = !period || p.period.toLowerCase() === period;
                const matchesPracticeType = !practiceType || p.practiceType.toLowerCase() === practiceType;
                
                return matchesSearch && matchesPeriod && matchesPracticeType;
            })
            .map(formatPreEnrollmentToRow);
    }, [preEnrollments, pdfSearchTerm, pdfPeriodFilter, pdfPracticeTypeFilter]);

    const handleCreate = () => {
        setEditingEntry(null);
        setIsModalOpen(true);
    };

    const handleEdit = (row: PreEnrollmentRowData) => {
        const original = preEnrollments.find((p) => p.preEnrollmentId === row.preEnrollmentId) || null;
        setEditingEntry(original);
        setIsModalOpen(true);
    };

    const handleSave = (payload: Omit<PreEnrollment, "preEnrollmentId" | "preEnrollmentDate">) => {
        const isEditing = !!editingEntry;
        setConfirmation({
            isOpen: true,
            title: isEditing ? "Confirmar Modificación" : "Confirmar Registro",
            message: `¿Estás seguro de que deseas ${isEditing ? "guardar los cambios de" : "registrar"} esta pre-inscripción?`,
            onConfirm: async () => {
                try {
                    if (isEditing && editingEntry) {
                        await editPreEnrollment({ ...editingEntry, ...payload });
                    } else {
                        await addPreEnrollment(payload);
                    }
                    setIsModalOpen(false);
                } catch (e) {
                    console.error(e);
                } finally {
                    setConfirmation(null);
                }
            },
            confirmText: isEditing ? "Guardar" : "Registrar",
            variant: "info",
        });
    };

    const handleToggleStatus = (id: string) => {
        const original = preEnrollments.find((p) => p.preEnrollmentId === id);
        if (!original) return;
        const goingInactive = original.status === true;
        setConfirmation({
            isOpen: true,
            title: goingInactive ? "Confirmar Envío a Inactivos" : "Confirmar Restauración",
            message: goingInactive 
                ? `¿Estás seguro de que deseas enviar la pre-inscripción de "${original.studentName}" a Inactivos?`
                : `¿Estás seguro de que deseas restaurar la pre-inscripción de "${original.studentName}"?`,
            onConfirm: async () => {
                try {
                    await toggleStatus(original);
                } catch (e) { console.error(e); }
                finally { setConfirmation(null); }
            },
            confirmText: goingInactive ? "Confirmar" : "Restaurar",
            variant: goingInactive ? "error" : "success",
        });
    };

    const handleBulkDelete = (ids: string[]) => {
        setConfirmation({
            isOpen: true,
            title: "Confirmar Desactivación Masiva",
            message: `¿Estás seguro de que deseas desactivar ${ids.length} pre-inscripciones seleccionadas?`,
            onConfirm: async () => {
                try {
                    await bulkToggleStatus(ids, false);
                } catch (e) {
                    console.error(e);
                } finally {
                    setConfirmation(null);
                }
            },
            confirmText: "Confirmar",
            variant: "error",
        });
    };

    const handleBulkRestore = (ids: string[]) => {
        setConfirmation({
            isOpen: true,
            title: "Confirmar Restauración Masiva",
            message: `¿Estás seguro de que deseas restaurar ${ids.length} pre-inscripciones seleccionadas?`,
            onConfirm: async () => {
                try {
                    await bulkToggleStatus(ids, true);
                } catch (e) {
                    console.error(e);
                } finally {
                    setConfirmation(null);
                }
            },
            confirmText: "Restaurar",
            variant: "success",
        });
    };


    const handleExportToEnrollment = (item: PreEnrollmentRowData) => {
        navigate("/enrollment", { state: { preEnrollmentData: item } });
    };

    const handleReport = () => {
        // Al hacer clic en reporte desde la tabla, abrimos el modal
        // En PreEnrollment, el modal de PDF usa pdfFilteredData, que ya está filtrado por pdfSearchTerm, etc.
        // Pero para ser consistentes con Enrollment, podríamos querer que el botón de la tabla
        // active el modal con los datos que ya están en la tabla.
        setIsPDFModalOpen(true);
    };

    return (
        <>
            <PageMeta title="Gestión de Pre-Inscripciones" description="Administración de pre-inscripciones" />

            <SkeletonLoader isLoading={pageLoading} skeleton={<BreadcrumbSkeleton />} id="pre-enrollment-breadcrumb">
                <PageBreadcrumb pageTitle="Pre-Inscripción" />
            </SkeletonLoader>

            {loadingAction && <FullScreenLoader label="Procesando..." />}

            <div className="stagger-delay">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <SkeletonLoader isLoading={pageLoading} skeleton={<TitleSkeleton />} id="pre-enrollment-title">
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-bold text-text-primary dark:text-white/90">Listado de Pre-Inscripciones</h2>
                            </div>
                            <p className="mt-1 text-sm text-text-secondary dark:text-text-tertiary">Gestiona las pre-inscripciones de los estudiantes para el período actual.</p>
                        </SkeletonLoader>
                    </div>

                    {!pageLoading && (
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setIsPDFModalOpen(true)}
                                startIcon={<DownloadIcon className="h-5 w-5" />}
                            >
                                Reporte
                            </Button>
                            <Button onClick={handleCreate} startIcon={<PlusCircleIcon className="h-5 w-5" />}>
                                Nueva Pre-Inscripción
                            </Button>
                        </div>
                    )}
                </div>



                <div className="space-y-6">
                    <ComponentCard title={activeTab === "Activas" ? "Pre Inscripciones Activas" : "Pre Inscripciones Inactivas"}>
                        <div className="mb-6 flex border-b border-border-light dark:border-border-dark">
                            <button
                                onClick={() => setActiveTab("Activas")}
                                className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === "Activas" ? "text-brand-500" : "text-text-secondary hover:text-text-primary dark:hover:text-white"}`}
                            >
                                Activas
                                {activeTab === "Activas" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500 animate-slideInLeft" />}
                            </button>
                            <button
                                onClick={() => setActiveTab("Inactivas")}
                                className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === "Inactivas" ? "text-brand-500" : "text-text-secondary hover:text-text-primary dark:hover:text-white"}`}
                            >
                                Inactivas
                                {activeTab === "Inactivas" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500 animate-slideInLeft" />}
                            </button>
                        </div>

                        <SkeletonLoader isLoading={pageLoading || status === "loading"} skeleton={<TablePageSkeleton rows={5} />} id="pre-enrollment-table">
                            <PreEnrollmentTable
                                data={filtered}
                                status={status}
                                error={null}
                                activeTab={activeTab}
                                onEdit={handleEdit}
                                onToggleStatus={handleToggleStatus}
                                onBulkDelete={handleBulkDelete}
                                onBulkRestore={handleBulkRestore}
                                onView={setViewItem}
                                onExportToEnrollment={handleExportToEnrollment}
                                onReport={handleReport}
                                loading={loadingAction}
                                periodOptions={periodOptions}
                                practiceTypeOptions={practiceTypeOptions}
                            />
                        </SkeletonLoader>
                    </ComponentCard>

                    <PreEnrollmentModal
                        isOpen={isModalOpen}
                        onClose={() => {
                            setIsModalOpen(false);
                            setInitialCi(null);
                        }}
                        onSave={handleSave}
                        editingEntry={editingEntry}
                        isLoading={loadingAction}
                        initialCi={initialCi}
                    />

                    <PreEnrollmentViewModal
                        isOpen={!!viewItem}
                        onClose={() => setViewItem(null)}
                        onEdit={handleEdit}
                        item={viewItem}
                    />

                    <PDFPreviewModal
                        isOpen={isPDFModalOpen}
                        onClose={() => setIsPDFModalOpen(false)}
                        title="Reporte de Pre-Inscripciones Activas"
                        data={pdfFilteredData}
                        template={(data) => <PreEnrollmentPDF data={data} />}
                        fileName={`reporte-pre-inscripciones-activas-${new Date().toISOString().split('T')[0]}.pdf`}
                        searchTerm={pdfSearchTerm}
                        onSearchChange={setPdfSearchTerm}
                        renderFilters={() => (
                            <div className="space-y-4">
                                {/* Filtro por Periodo */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest pl-1">
                                        Período Académico
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={pdfPeriodFilter}
                                            onChange={(e) => setPdfPeriodFilter(e.target.value)}
                                            className="w-full pl-3 pr-10 py-2.5 bg-bg-secondary/50 dark:bg-white/5 border border-border-light dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all appearance-none text-text-primary dark:text-white"
                                        >
                                            <option value="" className="dark:bg-bg-dark text-text-primary dark:text-white">Todos los períodos</option>
                                            {periodOptions.map((opt) => (
                                                <option key={opt.value} value={opt.value} className="dark:bg-bg-dark text-text-primary dark:text-white">
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Filtro por Tipo de Práctica */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest pl-1">
                                        Tipo de Práctica
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={pdfPracticeTypeFilter}
                                            onChange={(e) => setPdfPracticeTypeFilter(e.target.value)}
                                            className="w-full pl-3 pr-10 py-2.5 bg-bg-secondary/50 dark:bg-white/5 border border-border-light dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all appearance-none text-text-primary dark:text-white"
                                        >
                                            <option value="" className="dark:bg-bg-dark text-text-primary dark:text-white">Todos los tipos</option>
                                            {practiceTypeOptions.map((opt) => (
                                                <option key={opt.value} value={opt.value} className="dark:bg-bg-dark text-text-primary dark:text-white">
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {(pdfSearchTerm || pdfPeriodFilter || pdfPracticeTypeFilter) && (
                                    <button
                                        onClick={() => {
                                            setPdfSearchTerm("");
                                            setPdfPeriodFilter("");
                                            setPdfPracticeTypeFilter("");
                                        }}
                                        className="w-full mt-2 py-2 text-xs font-bold text-brand-500 hover:text-brand-600 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <RefreshIcon className="h-4 w-4" />
                                        Limpiar Filtros
                                    </button>
                                )}
                            </div>
                        )}
                        columns={[
                            { header: "Cédula", accessor: "identificationNumber" },
                            { header: "Estudiante", accessor: "studentName" },
                            { header: "Período", accessor: "period" },
                            { header: "Tipo Práctica", accessor: "practiceType" },
                            { header: "Fecha", accessor: "preEnrollmentDate" },
                        ]}
                    />

                    <UnifiedDialog
                        isOpen={!!confirmation}
                        onClose={() => !loadingAction && setConfirmation(null)}
                        onConfirm={confirmation?.onConfirm || (() => { })}
                        title={confirmation?.title || ""}
                        message={confirmation?.message || ""}
                        confirmLabel={confirmation?.confirmText || "Confirmar"}
                        variant={confirmation?.variant || "info"}
                        isLoading={loadingAction}
                    />
                </div>
            </div>
        </>
    );
}
