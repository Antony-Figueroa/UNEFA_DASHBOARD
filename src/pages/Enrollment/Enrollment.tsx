/**
 * @file Enrollment.tsx
 * @description Página principal para la gestión del módulo de Inscripción.
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
import { PlusCircleIcon } from "../../icons/actions";
import { DownloadIcon } from "../../icons";

import EnrollmentTable from "../../features/enrollment/components/EnrollmentTable";
import EnrollmentModal from "../../features/enrollment/components/EnrollmentModal";
import EnrollmentViewModal from "../../features/enrollment/components/EnrollmentViewModal";
import { PDFPreviewModal } from "../../components/ui/pdf/PDFPreviewModal";
import { EnrollmentPDF } from "../../components/ui/pdf/templates/EnrollmentPDF";
import { getInternshipTypes, mapToOptions } from "../../features/internship-types/services/internshipTypesService";
import { usePeriods } from "../../features/periods/hooks/usePeriods";
import { useEnrollment } from "../../features/enrollment/hooks/useEnrollment";
import { Enrollment, EnrollmentRowData } from "../../features/enrollment/types";
import { PreEnrollmentRowData } from "../../features/pre-enrollment/types";
import { formatDateTime } from "../../utils/date";

const formatEnrollmentToRow = (e: Enrollment): EnrollmentRowData => ({
    ...e,
    enrollmentDate: formatDateTime(e.enrollmentDate),
});

export default function EnrollmentPage() {
    const [pageLoading, setPageLoading] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    const { periodos } = usePeriods();
    const [periodOptions, setPeriodOptions] = useState<{ value: string; label: string }[]>([]);
    const [practiceTypeOptions, setPracticeTypeOptions] = useState<{ value: string; label: string }[]>([]);
    const [initialPreEnrollmentData, setInitialPreEnrollmentData] = useState<PreEnrollmentRowData | null>(null);

    useEffect(() => {
        if (location.state?.preEnrollmentData) {
            setInitialPreEnrollmentData(location.state.preEnrollmentData);
            setIsModalOpen(true);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate]);
    
    useEffect(() => {
        if (periodos.length > 0) {
            const mappedPeriods = periodos.map(p => ({
                value: p.description.toUpperCase(),
                label: p.description.toUpperCase()
            }));
            setPeriodOptions(mappedPeriods);

            // Establecer el periodo actual como filtro predeterminado para el PDF
            const current = periodos.find(p => p.periodStatus === 2);
            if (current) {
                setPdfPeriodFilter(current.description.toUpperCase());
            }
        }
    }, [periodos]);

    useEffect(() => {
        const loadFilterOptions = async () => {
            try {
                const practiceData = await getInternshipTypes();
                const mappedPractice = mapToOptions(practiceData).map(opt => ({
                    value: opt.value,
                    label: opt.label,
                    id: opt.id
                }));

                if (mappedPractice.length > 0) {
                    setPracticeTypeOptions(mappedPractice);
                } else {
                    setPracticeTypeOptions([
                        { value: "ORDINARIA", label: "ORDINARIA" },
                        { value: "ESPECIAL", label: "ESPECIAL" },
                    ]);
                }
            } catch (error) {
                console.error("Error loading filter options:", error);
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
        return () => clearTimeout(timer);
    }, []);

    const {
        enrollments,
        status,
        loadingAction,
        addEnrollment,
        editEnrollment,
        toggleStatus,
    } = useEnrollment();

    const [activeTab, setActiveTab] = useState<"Activas" | "Inactivas">("Activas");
    const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
    const [pdfSearchTerm, setPdfSearchTerm] = useState("");
    const [pdfPeriodFilter, setPdfPeriodFilter] = useState("");
    const [pdfPracticeTypeFilter, setPdfPracticeTypeFilter] = useState("");
    const [pdfSelectedIds, setPdfSelectedIds] = useState<Set<string>>(new Set());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<Enrollment | null>(null);
    const [viewItem, setViewItem] = useState<EnrollmentRowData | null>(null);

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
        return enrollments.map(formatEnrollmentToRow);
    }, [enrollments]);

    /**
     * Datos filtrados específicamente para el reporte PDF de Inscripciones.
     */
    const pdfFilteredData = useMemo(() => {
        const search = pdfSearchTerm.trim().toLowerCase();
        const periodSearch = pdfPeriodFilter.trim().toLowerCase();
        const practiceTypeSearch = pdfPracticeTypeFilter.trim().toLowerCase();

        return (Array.isArray(enrollments) ? enrollments : [])
            .filter((e) => {
                const matchesSearch = !search || 
                    e.identificationNumber.toLowerCase().includes(search) || 
                    e.studentName.toLowerCase().includes(search) ||
                    (e.careerName && e.careerName.toLowerCase().includes(search));
                const matchesPeriod = !periodSearch || e.period.toLowerCase() === periodSearch;
                const matchesPracticeType = !practiceTypeSearch || e.practiceType.toLowerCase() === practiceTypeSearch;
                const matchesStatus = e.status === true;

                return matchesSearch && matchesPeriod && matchesPracticeType && matchesStatus;
            });
    }, [enrollments, pdfSearchTerm, pdfPeriodFilter, pdfPracticeTypeFilter]);

    // Inicializar selección cuando cambian los datos filtrados
    useEffect(() => {
        if (isPDFModalOpen) {
            setPdfSelectedIds(new Set(pdfFilteredData.map(e => e.enrollmentId)));
        }
    }, [pdfFilteredData, isPDFModalOpen]);

    // Datos finales para el PDF (solo los seleccionados)
    const pdfFinalData = useMemo(() => {
        return pdfFilteredData.filter(e => pdfSelectedIds.has(e.enrollmentId));
    }, [pdfFilteredData, pdfSelectedIds]);

    const handleCreate = () => {
        setEditingEntry(null);
        setIsModalOpen(true);
    };

    const handleEdit = (row: EnrollmentRowData) => {
        const original = enrollments.find((e) => e.enrollmentId === row.enrollmentId) || null;
        setEditingEntry(original);
        setIsModalOpen(true);
    };

    const handleSave = (payload: Omit<Enrollment, "enrollmentId" | "enrollmentDate">) => {
        const isEditing = !!editingEntry;
        setConfirmation({
            isOpen: true,
            title: isEditing ? "Confirmar Modificación" : "Confirmar Registro",
            message: `¿Estás seguro de que deseas ${isEditing ? "guardar los cambios de" : "registrar"} esta inscripción?`,
            onConfirm: async () => {
                try {
                    if (isEditing && editingEntry) {
                        await editEnrollment({ ...editingEntry, ...payload });
                    } else {
                        await addEnrollment(payload);
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
        const original = enrollments.find((e) => e.enrollmentId === id);
        if (!original) return;
        const goingInactive = original.status === true;
        setConfirmation({
            isOpen: true,
            title: goingInactive ? "Confirmar Envío a Inactivos" : "Confirmar Restauración",
            message: goingInactive 
                ? `¿Estás seguro de que deseas enviar la inscripción de "${original.studentName}" a Inactivos?`
                : `¿Estás seguro de que deseas restaurar la inscripción de "${original.studentName}"?`,
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

    return (
        <>
            <PageMeta title="Gestión de Inscripciones" description="Administración de inscripciones" />

            <SkeletonLoader isLoading={pageLoading} skeleton={<BreadcrumbSkeleton />} id="enrollment-breadcrumb">
                <PageBreadcrumb pageTitle="Inscripción" />
            </SkeletonLoader>

            {loadingAction && <FullScreenLoader label="Procesando..." />}

            <div className="stagger-delay">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <SkeletonLoader isLoading={pageLoading} skeleton={<TitleSkeleton />} id="enrollment-title">
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-bold text-text-primary dark:text-white/90">Listado de Inscripciones</h2>
                            </div>
                            <p className="mt-1 text-sm text-text-secondary dark:text-text-tertiary">Gestiona las inscripciones de los estudiantes para el período actual.</p>
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
                                Nueva Inscripción
                            </Button>
                        </div>
                    )}
                </div>



                <div className="space-y-6">
                    <ComponentCard title={activeTab === "Activas" ? "Inscripciones Activas" : "Inscripciones Inactivas"}>
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

                        <SkeletonLoader isLoading={pageLoading || status === "loading"} skeleton={<TablePageSkeleton rows={5} />} id="enrollment-table">
                            <EnrollmentTable
                                data={filtered}
                                status={status}
                                error={null}
                                activeTab={activeTab}
                                onEdit={handleEdit}
                                onToggleStatus={handleToggleStatus}
                                onView={setViewItem}
                                loading={loadingAction}
                                periodOptions={periodOptions}
                                practiceTypeOptions={practiceTypeOptions}
                            />
                        </SkeletonLoader>
                    </ComponentCard>

                    <EnrollmentModal
                        isOpen={isModalOpen}
                        onClose={() => {
                            setIsModalOpen(false);
                            setInitialPreEnrollmentData(null);
                        }}
                        onSave={handleSave}
                        editingEntry={editingEntry}
                        isLoading={loadingAction}
                        initialData={initialPreEnrollmentData}
                    />

                    <EnrollmentViewModal
                        isOpen={!!viewItem}
                        onClose={() => setViewItem(null)}
                        onEdit={handleEdit}
                        item={viewItem}
                    />

                    <PDFPreviewModal
                        isOpen={isPDFModalOpen}
                        onClose={() => setIsPDFModalOpen(false)}
                        title="Reporte de Inscripciones Activas"
                        data={pdfFinalData}
                        template={(data) => <EnrollmentPDF data={data} selectedPeriod={pdfPeriodFilter} />}
                        fileName={`reporte-inscripciones-activas-${new Date().toISOString().split('T')[0]}.pdf`}
                        searchTerm={pdfSearchTerm}
                        onSearchChange={setPdfSearchTerm}
                        renderFilters={() => (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest pl-1">
                                        Filtrar por Período
                                    </label>
                                    <select
                                        value={pdfPeriodFilter}
                                        onChange={(e) => setPdfPeriodFilter(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-bg-secondary/50 dark:bg-white/5 border border-border-light dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                                    >
                                        <option value="">Todos los períodos</option>
                                        {periodOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest pl-1">
                                        Tipo de Práctica
                                    </label>
                                    <select
                                        value={pdfPracticeTypeFilter}
                                        onChange={(e) => setPdfPracticeTypeFilter(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-bg-secondary/50 dark:bg-white/5 border border-border-light dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                                    >
                                        <option value="">Todos los tipos</option>
                                        {practiceTypeOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="pt-4 border-t border-border-light dark:border-white/5">
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest pl-1">
                                            Seleccionar Registros ({pdfSelectedIds.size})
                                        </label>
                                        <button 
                                            onClick={() => {
                                                if (pdfSelectedIds.size === pdfFilteredData.length) {
                                                    setPdfSelectedIds(new Set());
                                                } else {
                                                    setPdfSelectedIds(new Set(pdfFilteredData.map(e => e.enrollmentId)));
                                                }
                                            }}
                                            className="text-[10px] font-bold text-brand-500 hover:text-brand-600 uppercase tracking-tight"
                                        >
                                            {pdfSelectedIds.size === pdfFilteredData.length ? "Desmarcar Todos" : "Marcar Todos"}
                                        </button>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                        {pdfFilteredData.map((e) => (
                                            <label key={e.enrollmentId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-bg-secondary dark:hover:bg-white/5 cursor-pointer transition-colors group">
                                                <input
                                                    type="checkbox"
                                                    checked={pdfSelectedIds.has(e.enrollmentId)}
                                                    onChange={() => {
                                                        const next = new Set(pdfSelectedIds);
                                                        if (next.has(e.enrollmentId)) next.delete(e.enrollmentId);
                                                        else next.add(e.enrollmentId);
                                                        setPdfSelectedIds(next);
                                                    }}
                                                    className="w-4 h-4 rounded border-border-light dark:border-white/10 text-brand-500 focus:ring-brand-500/20 transition-all"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-text-primary dark:text-white truncate group-hover:text-brand-500 transition-colors">
                                                        {e.studentName}
                                                    </p>
                                                    <p className="text-[10px] text-text-tertiary truncate">
                                                        {e.identificationNumber} • {e.careerName}
                                                    </p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        columns={[
                            { header: "Cédula", accessor: "identificationNumber" },
                            { header: "Estudiante", accessor: "studentName" },
                            { header: "Carrera", accessor: "careerName" },
                            { header: "Período", accessor: "period" },
                            { header: "Tipo Práctica", accessor: "practiceType" },
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
