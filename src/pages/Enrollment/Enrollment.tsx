/**
 * @file Enrollment.tsx
 * @description Página principal para la gestión del módulo de Inscripción.
 */

import { useMemo, useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import { Tabs } from "../../components/ui/tabs/Tabs";
import { useTabs } from "../../hooks/useTabs";
import UnifiedDialog from "../../components/ui/dialog/UnifiedDialog";
import { CONFIRM_MESSAGES, MODAL_CONFIG, DialogVariant } from "../../components/ui/dialog/DialogConfig";
import Button from "../../components/ui/button/Button";
import { SkeletonLoader, TitleSkeleton, BreadcrumbSkeleton, TablePageSkeleton } from "../../components/ui/skeleton";
import { PlusCircleIcon } from "../../icons/actions";
import RetiroDashboard from "../../features/justified-withdrawal/components/RetiroDashboard";
import { FileText } from "lucide-react";

import EnrollmentTable from "../../features/enrollment/components/EnrollmentTable";
import EnrollmentModal from "../../features/enrollment/components/EnrollmentModal";
import EnrollmentViewModal from "../../features/enrollment/components/EnrollmentViewModal";
import PreEnrollmentModal from "../../features/pre-enrollment/components/PreEnrollmentModal";
import TutorModal from "../../features/tutors/components/TutorModal";
import InstitutionModal from "../../features/institutions/components/InstitutionModal";
import InstitutionalResponsibleModal from "../../features/institutions/components/InstitutionalResponsibleModal";
import { PDFPreviewModal } from "../../components/ui/pdf/PDFPreviewModal";
import { EnrollmentPDF } from "../../components/ui/pdf/templates/EnrollmentPDF";
import { getInternshipTypes, mapToOptions } from "../../features/internship-types/services/internshipTypesService";
import { usePeriods } from "../../features/periods/hooks/usePeriods";
import { useEnrollment } from "../../features/enrollment/hooks/useEnrollment";
import { usePreEnrollment } from "../../features/pre-enrollment/hooks/usePreEnrollment";
import { useTutors } from "../../features/tutors/hooks/useTutors";
import { useInstitutions } from "../../features/institutions/hooks/useInstitutions";
import { useInstitutionalResponsibles } from "../../features/institutions/hooks/useInstitutionalResponsibles";
import { useCareers } from "../../features/careers/hooks/useCareers";
import { useInternshipTypes } from "../../features/internship-types/hooks/useInternshipTypes";
import { Enrollment, EnrollmentRowData, CreateEnrollmentPayload, UpdateEnrollmentPayload } from "../../features/enrollment/types";
import { PreEnrollmentRowData } from "../../features/pre-enrollment/types";
import { formatDateTime } from "../../utils/date";
import { matchSearch } from "../../utils/searchNormalizer";
import CareerModal from "../../features/careers/components/CareerModal";
import { toTitleCase } from "../../utils/textFormat";

/**
 * Normalizes an enrollment object for display in the table.
 * 
 * @param e - The enrollment object.
 * @returns The formatted row data.
 */
const formatEnrollmentToRow = (e: any): EnrollmentRowData => ({
    ...e,
    enrollmentDate: formatDateTime(e.enrollmentDate),
});

/**
 * Enrollment Page component.
 * 
 * Manages the enrollment lifecycle: listing, creating, editing, and toggling status.
 * Also handles report generation via PDF.
 * 
 * @returns The Enrollment page component.
 */
export default function EnrollmentPage() {
    const [pageLoading, setPageLoading] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    const { periodos } = usePeriods();
    const [periodOptions, setPeriodOptions] = useState<{ value: string; label: string }[]>([]);
    const [practiceTypeOptions, setPracticeTypeOptions] = useState<{ value: string; label: string }[]>([]);
    const [initialPreEnrollmentData, setInitialPreEnrollmentData] = useState<PreEnrollmentRowData | null>(null);

    // Event listener for Command Palette - open create modal
    useEffect(() => {
        if (location.state?.openCreateModal) {
            setInitialPreEnrollmentData(null);
            setIsModalOpen(true);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate]);

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
                label: toTitleCase(p.description)
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
                    label: toTitleCase(opt.label),
                    id: opt.id
                }));

                if (mappedPractice.length > 0) {
                    setPracticeTypeOptions(mappedPractice);
                } else {
                    setPracticeTypeOptions([
                        { value: "ORDINARIA", label: toTitleCase("ORDINARIA") },
                        { value: "ESPECIAL", label: toTitleCase("ESPECIAL") },
                    ]);
                }
            } catch (error) {
                console.error("Error loading filter options:", error);
                setPracticeTypeOptions([
                    { value: "ORDINARIA", label: toTitleCase("ORDINARIA") },
                    { value: "ESPECIAL", label: toTitleCase("ESPECIAL") },
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
        withdraw,
    } = useEnrollment();

    const { addPreEnrollment, loadingAction: preEnrollmentLoading } = usePreEnrollment();
    const { tutors, addTutor, loadingAction: tutorLoading } = useTutors();
    const { institutions, addInstitution, loadingAction: institutionLoading } = useInstitutions();
    const { addResponsible, loadingAction: responsibleLoading } = useInstitutionalResponsibles();
    const { careers, addCareer } = useCareers();
    const { activeOptions: internshipTypeOptions } = useInternshipTypes();

    const careerOptions = useMemo(() => 
        careers.filter(c => c.status).map(c => ({ 
            value: String(c.careerId), 
            text: toTitleCase(c.careerName),
            internshipPriorities: c.internshipTypeIds || []
        })),
    [careers]);

    const tabsState = useTabs({ defaultTab: 'Activas' });
    const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
    const [pdfSearchTerm, setPdfSearchTerm] = useState("");
    const [isPreEnrollmentModalOpen, setIsPreEnrollmentModalOpen] = useState(false);
    const [isTutorModalOpen, setIsTutorModalOpen] = useState(false);
    const [isInstitutionModalOpen, setIsInstitutionModalOpen] = useState(false);
    const [isResponsibleModalOpen, setIsResponsibleModalOpen] = useState(false);
    const [isCareerModalOpen, setIsCareerModalOpen] = useState(false);
    const [preselectedInstitutionId, setPreselectedInstitutionId] = useState<string | undefined>(undefined);
    const tutorTargetRef = useRef<string>("academicTutorId");
    const [pdfPeriodFilter, setPdfPeriodFilter] = useState("");
    const [pdfPracticeTypeFilter, setPdfPracticeTypeFilter] = useState("");
    const [pdfSelectedIds, setPdfSelectedIds] = useState<Set<string>>(new Set());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<Enrollment | null>(null);
    const [viewItem, setViewItem] = useState<EnrollmentRowData | null>(null);

    // Historial de cambios
    const [historyItem, setHistoryItem] = useState<EnrollmentRowData | null>(null);
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Diálogo de retiro / abandono
    const [withdrawDialog, setWithdrawDialog] = useState<{
        type: 'justified' | 'unjustified';
        enrollment: EnrollmentRowData;
    } | null>(null);
    const [withdrawReason, setWithdrawReason] = useState('');
    const [withdrawComment, setWithdrawComment] = useState('');
    const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);

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
     * Efecto para escuchar eventos de agregar desde el modal de inscripción.
     */
    useEffect(() => {
        const handleAddPreEnrollment = () => setIsPreEnrollmentModalOpen(true);
        const handleAddTutor = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            tutorTargetRef.current = detail?.targetField || "academicTutorId";
            setIsTutorModalOpen(true);
        };
        const handleAddInstitution = () => setIsInstitutionModalOpen(true);
        const handleAddResponsible = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            setPreselectedInstitutionId(detail?.institutionId);
            setIsResponsibleModalOpen(true);
        };
        const handleAddCareer = () => setIsCareerModalOpen(true);

        window.addEventListener("enrollment:addPreEnrollment", handleAddPreEnrollment);
        window.addEventListener("enrollment:addTutor", handleAddTutor);
        window.addEventListener("enrollment:addInstitution", handleAddInstitution);
        window.addEventListener("enrollment:addResponsible", handleAddResponsible);
        window.addEventListener("enrollment:addCareer", handleAddCareer);

        return () => {
            window.removeEventListener("enrollment:addPreEnrollment", handleAddPreEnrollment);
            window.removeEventListener("enrollment:addTutor", handleAddTutor);
            window.removeEventListener("enrollment:addInstitution", handleAddInstitution);
            window.removeEventListener("enrollment:addResponsible", handleAddResponsible);
            window.removeEventListener("enrollment:addCareer", handleAddCareer);
        };
    }, []);

    /**
     * Datos filtrados específicamente para el reporte PDF de Inscripciones.
     */
    const pdfFilteredData = useMemo(() => {
        const periodSearch = pdfPeriodFilter.trim().toLowerCase();
        const practiceTypeSearch = pdfPracticeTypeFilter.trim().toLowerCase();

        return (Array.isArray(enrollments) ? enrollments : [])
            .filter((e) => {
                const matchesSearch = !pdfSearchTerm.trim() || 
                    matchSearch(e.identificationNumber, pdfSearchTerm) || 
                    matchSearch(e.studentName, pdfSearchTerm) ||
                    matchSearch(e.careerName ?? '', pdfSearchTerm);
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

    /**
     * Opens the modal to create a new enrollment.
     */
    const handleViewHistory = async (row: EnrollmentRowData) => {
        setHistoryItem(row);
        setHistoryLoading(true);
        try {
            const { default: apiClient } = await import("../../api/apiClient");
            const res = await apiClient.get(`/enrollments/${row.enrollmentId}/changes`);
            setHistoryData(res.data?.data || []);
        } catch (err) {
            console.error("Error fetching history:", err);
            setHistoryData([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingEntry(null);
        setIsModalOpen(true);
    };

    /**
     * Opens the modal to edit an existing enrollment.
     * 
     * @param row - The row data of the enrollment to edit.
     */
    const handleEdit = (row: EnrollmentRowData) => {
        const original = enrollments.find((e) => e.enrollmentId === row.enrollmentId) || null;
        setEditingEntry(original);
        setIsModalOpen(true);
    };

    /**
     * Handles saving an enrollment (create or update).
     * El modal ya muestra su propio diálogo de confirmación, este handler
     * ejecuta el guardado directo sin duplicar la confirmación.
     * 
     * @param payload - The data to save (CreateEnrollmentPayload or UpdateEnrollmentPayload).
     */
    const handleSave = async (payload: CreateEnrollmentPayload | UpdateEnrollmentPayload) => {
        const isEditing = "enrollmentId" in payload;
        try {
            if (isEditing) {
                await editEnrollment(payload as UpdateEnrollmentPayload);
            } else {
                await addEnrollment(payload as CreateEnrollmentPayload);
            }
            setIsModalOpen(false);
        } catch (e: any) {
            const errorCode = e?.response?.data?.code;
            if (errorCode === "DATE_OUTSIDE_PERIOD" || errorCode === "PERIOD_NOT_ACTIVE") {
                setConfirmation({
                    isOpen: true,
                    title: "Período Cerrado",
                    message: `El período de inscripción ha finalizado. ¿Desea ${isEditing ? "guardar los cambios" : "registrar la inscripción"} de todas formas?`,
                    onConfirm: async () => {
                        try {
                            if (isEditing) {
                                await editEnrollment({ ...(payload as UpdateEnrollmentPayload), overridePeriodValidation: true });
                            } else {
                                await addEnrollment({ ...(payload as CreateEnrollmentPayload), overridePeriodValidation: true });
                            }
                            setIsModalOpen(false);
                            setConfirmation(null);
                        } catch (e2: any) {
                            console.error("[EnrollmentPage] Error saving enrollment with override:", e2);
                            setConfirmation(null);
                        }
                    },
                    confirmText: isEditing ? "Guardar cambios" : "Registrar de todas formas",
                    variant: "warning",
                });
            } else {
                console.error("[EnrollmentPage] Error saving enrollment:", e);
            }
        }
	};

	/**
	 * Inactiva (toggle status) una inscripción.
	 */
    const handleInactivate = (row: EnrollmentRowData) => {
        const original = enrollments.find((e) => e.enrollmentId === row.enrollmentId);
        if (!original) return;
        const config = CONFIRM_MESSAGES.deactivate('la inscripción');

        setConfirmation({
            isOpen: true,
            title: config.title,
            message: `¿Estás seguro de que deseas desactivar la inscripción de ${row.studentName}?`,
            onConfirm: async () => {
                try {
                    await toggleStatus(original);
                } catch (error) {
                    console.error("[EnrollmentPage] Error toggling status:", error);
                } finally {
                    setConfirmation(null);
                }
            },
            confirmText: config.confirmLabel,
            variant: config.variant as DialogVariant,
        });
    };

    /**
     * Reactiva una inscripción inactivada.
     */
    const handleReactivate = (row: EnrollmentRowData) => {
        const original = enrollments.find((e) => e.enrollmentId === row.enrollmentId);
        if (!original) return;
        const config = CONFIRM_MESSAGES.activate('la inscripción');

        setConfirmation({
            isOpen: true,
            title: config.title,
            message: `¿Estás seguro de que deseas restaurar la inscripción de ${row.studentName}?`,
            onConfirm: async () => {
                try {
                    await toggleStatus(original);
                } catch (error) {
                    console.error("[EnrollmentPage] Error toggling status:", error);
                } finally {
                    setConfirmation(null);
                }
            },
            confirmText: config.confirmLabel,
            variant: config.variant as DialogVariant,
        });
    };

    /**
     * Abre el diálogo de retiro justificado / abandono.
     */
    const handleWithdraw = (type: 'justified' | 'unjustified', row: EnrollmentRowData) => {
        setWithdrawDialog({ type, enrollment: row });
        setWithdrawReason('');
        setWithdrawComment('');
    };

    /**
     * Confirma el retiro / abandono y llama al backend.
     */
    const handleWithdrawConfirm = async () => {
        if (!withdrawDialog) return;
        const { type, enrollment } = withdrawDialog;
        setWithdrawSubmitting(true);
        try {
            await withdraw(enrollment.enrollmentId || '', type, withdrawReason, withdrawComment);
            setWithdrawDialog(null);
        } catch (error) {
            console.error("[EnrollmentPage] Error withdrawing:", error);
        } finally {
            setWithdrawSubmitting(false);
        }
    };

    return (
        <>
            <PageMeta title="Gestión de Inscripciones" description="Administración de inscripciones" />

            <SkeletonLoader isLoading={pageLoading} skeleton={<BreadcrumbSkeleton />} id="enrollment-breadcrumb">
                <PageBreadcrumb pageTitle="Inscripción" />
            </SkeletonLoader>

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
                        <div className="flex flex-wrap items-center gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setIsPDFModalOpen(true)}
                                startIcon={<FileText className="h-5 w-5" />}
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
                    <ComponentCard title={tabsState.activeTab === "Activas" ? "Inscripciones Activas" : "Inscripciones Inactivas"}>
                        <Tabs
                            options={[
                                { id: 'Activas', label: 'Activas' },
                                { id: 'Inactivas', label: 'Inactivas' },
                            ]}
                            {...tabsState.tabProps}
                            variant="underline"
                            className="mb-6"
                        />

                        <SkeletonLoader isLoading={pageLoading || status === "loading"} skeleton={<TablePageSkeleton rows={5} />} id="enrollment-table">
                            <EnrollmentTable
                                data={filtered}
                                status={status}
                                error={null}
                                activeTab={tabsState.activeTab as "Activas" | "Inactivas"}
                                onEdit={handleEdit}
                                onInactivate={handleInactivate}
                                onReactivate={handleReactivate}
                                onWithdrawJustified={(row) => handleWithdraw('justified', row)}
                                onWithdrawUnjustified={(row) => handleWithdraw('unjustified', row)}
                                onView={setViewItem}
                                onViewHistory={handleViewHistory}
                                loading={loadingAction}
                                practiceTypeOptions={practiceTypeOptions}
                            />
                        </SkeletonLoader>
                    </ComponentCard>

                    {/* Retiros Justificados Pendientes */}
                    <div className="mt-6">
                      <RetiroDashboard />
                    </div>

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
                            { header: "Estudiante", accessor: (r: any) => toTitleCase(r.studentName) },
                            { header: "Carrera", accessor: (r: any) => toTitleCase(r.careerName) },
                            { header: "Período", accessor: (r: any) => toTitleCase(r.period) },
                            { header: "Tipo Práctica", accessor: (r: any) => toTitleCase(r.practiceType) },
                        ]}
                    />

                    <PreEnrollmentModal
                        isOpen={isPreEnrollmentModalOpen}
                        onClose={() => setIsPreEnrollmentModalOpen(false)}
                        onSave={async (payload) => {
                            try {
                                await addPreEnrollment(payload as any);
                                const evt = new CustomEvent("enrollment:setPreEnrollment", { detail: payload });
                                window.dispatchEvent(evt);
                                setIsPreEnrollmentModalOpen(false);
                            } catch (e) {
                                console.error("[EnrollmentPage] Error creating pre-enrollment:", e);
                            }
                        }}
                        isLoading={preEnrollmentLoading}
                        careerOptions={careerOptions.map(c => ({ value: c.value, label: c.text || c.value }))}
                    />

                    <TutorModal
                        isOpen={isTutorModalOpen}
                        onClose={() => setIsTutorModalOpen(false)}
                        tutorType={tutorTargetRef.current === "methodologicalTutorId" ? "methodological" : "academic"}
                        onSave={async (payload) => {
                            try {
                                const tutorType = tutorTargetRef.current === "methodologicalTutorId" ? "Metodológico" : "Académico";
                                const newTutor = await addTutor(payload as any, tutorType);
                                if (newTutor) {
                                    // Disparar evento para actualizar la lista de tutores en el EnrollmentModal
                                    const updateEvt = new CustomEvent("enrollment:tutorAdded", { 
                                        detail: { tutor: newTutor } 
                                    });
                                    window.dispatchEvent(updateEvt);
                                    
                                    // Seleccionar el nuevo tutor automáticamente
                                    const selectEvt = new CustomEvent("enrollment:setTutor", { 
                                        detail: { tutorId: newTutor.tutorId, targetField: tutorTargetRef.current } 
                                    });
                                    window.dispatchEvent(selectEvt);
                                    
                                    setIsTutorModalOpen(false);
                                }
                            } catch (e) {
                                console.error("[EnrollmentPage] Error creating tutor:", e);
                            }
                        }}
                        editingTutor={null}
                        isLoading={tutorLoading}
                        tutors={tutors}
                        modalId="enrollment-tutor"
                    />

                    <InstitutionModal
                        isOpen={isInstitutionModalOpen}
                        onClose={() => setIsInstitutionModalOpen(false)}
                        onSave={async (payload) => {
                            try {
                                const result = await addInstitution(payload as any);
                                if (result) {
                                    setIsInstitutionModalOpen(false);
                                    setIsResponsibleModalOpen(true);
                                    setPreselectedInstitutionId(result.institutionId);
                                    window.dispatchEvent(new CustomEvent("institution:saved"));
                                }
                                return result ? { institutionId: result.institutionId, name: result.name } : undefined;
                            } catch (e) {
                                console.error("[EnrollmentPage] Error creating institution:", e);
                            }
                        }}
                        isLoading={institutionLoading}
                        existingInstitutions={institutions}
                        careerOptions={careerOptions}
                        internshipTypeOptions={internshipTypeOptions}
                        modalId="enrollment-institution"
                    />

                    <InstitutionalResponsibleModal
                        isOpen={isResponsibleModalOpen}
                        onClose={() => {
                            setIsResponsibleModalOpen(false);
                            setPreselectedInstitutionId(undefined);
                        }}
                        onSave={async (payload) => {
                            try {
                                await addResponsible({ ...payload, institutionId: preselectedInstitutionId! } as any);
                                const evt = new CustomEvent("enrollment:setResponsible", { detail: { responsibleId: (payload as any).responsibleId } });
                                window.dispatchEvent(evt);
                                setIsResponsibleModalOpen(false);
                                setPreselectedInstitutionId(undefined);
                            } catch (e) {
                                console.error("[EnrollmentPage] Error creating responsible:", e);
                            }
                        }}
                        editingResp={null}
                        institutionOptions={institutions.map(i => ({ value: i.institutionId, label: toTitleCase(i.name) }))}
                        isLoading={responsibleLoading}
                        preselectedInstitutionId={preselectedInstitutionId}
                        modalId="enrollment-responsible"
                    />

                    <CareerModal
                        isOpen={isCareerModalOpen}
                        onClose={() => setIsCareerModalOpen(false)}
                        onSave={async (payload) => {
                            try {
                                await addCareer(payload as any);
                                // Notificar al EnrollmentModal que hay una nueva carrera disponible
                                const evt = new CustomEvent("enrollment:careerAdded");
                                window.dispatchEvent(evt);
                                setIsCareerModalOpen(false);
                            } catch (e) {
                                console.error("[EnrollmentPage] Error creating career:", e);
                            }
                        }}
                        editingCareer={null}
                        internshipOptions={internshipTypeOptions}
                        isLoading={loadingAction}
                        hasPendingEvaluations={false}
                        isInUse={false}
                        existingCareers={careers}
                        onAddInternshipType={() => {}}
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

                    {/* Diálogo de historial de cambios */}
                    <UnifiedDialog
                        isOpen={!!historyItem}
                        onClose={() => setHistoryItem(null)}
                        title="Historial de Cambios"
                        message={
                            historyLoading
                                ? "Cargando historial..."
                                : historyData.length === 0
                                ? "No hay cambios registrados para esta inscripción."
                                : undefined
                        }
                        size="lg"
                    >
                        {!historyLoading && historyData.length > 0 && (
                            <div className="space-y-4 max-h-[400px] overflow-y-auto">
                                {historyData.map((change: any, i: number) => (
                                    <div key={change.CHANGE_ID || i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-border-light dark:border-white/10">
                                        <div className="flex-shrink-0 mt-0.5">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-brand-500">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-text-primary dark:text-white">
                                                {{
                                                    'INSTITUTION': 'Institución',
                                                    'INSTITUTION_RESPONSIBLE': 'Responsable Institucional',
                                                    'PERIOD': 'Período',
                                                    'PRACTICE_TYPE': 'Tipo de Práctica',
                                                    'TUTOR_ACADEMICO': 'Tutor Académico',
                                                    'TUTOR_METODOLOGICO': 'Tutor Metodológico',
                                                }[change.FIELD_NAME as string] || change.FIELD_NAME}
                                            </p>
                                            <p className="text-xs text-text-secondary mt-1">
                                                {change.OLD_VALUE ? (
                                                    <span className="text-error-500 line-through mr-2">{change.OLD_VALUE}</span>
                                                ) : null}
                                                <span className="text-success-600 font-medium">{change.NEW_VALUE}</span>
                                            </p>
                                            {change.CHANGED_AT && (
                                                <p className="text-[10px] text-text-tertiary mt-1">
                                                    {new Date(change.CHANGED_AT).toLocaleDateString("es-ES", {
                                                        day: "numeric", month: "short", year: "numeric",
                                                        hour: "2-digit", minute: "2-digit"
                                                    })}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </UnifiedDialog>

                    {/* Diálogo de Retiro Justificado / Abandono */}
                    <UnifiedDialog
                        isOpen={!!withdrawDialog}
                        onClose={() => setWithdrawDialog(null)}
                        onConfirm={handleWithdrawConfirm}
                        title={withdrawDialog?.type === 'justified' ? 'Retiro Justificado' : 'Abandono'}
                        confirmLabel="Confirmar"
                        confirmStartIcon={
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        }
                        variant="warning"
                        isLoading={withdrawSubmitting}
                    >
                        <div className="w-full text-left space-y-4">
                            <p className="text-sm text-text-secondary">
                                {withdrawDialog?.type === 'justified'
                                    ? `Registrar retiro justificado para ${withdrawDialog?.enrollment?.studentName || ''}.`
                                    : `Registrar abandono para ${withdrawDialog?.enrollment?.studentName || ''}.`
                                }
                            </p>
                            <div>
                                <label className="block text-sm font-semibold text-text-primary mb-1">
                                    Motivo <span className="text-error-500">*</span>
                                </label>
                                <textarea
                                    value={withdrawReason}
                                    onChange={(e) => setWithdrawReason(e.target.value)}
                                    className="w-full h-24 rounded-xl border border-border-medium bg-transparent p-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand-500 focus:outline-none resize-none"
                                    placeholder="Describa el motivo del retiro..."
                                />
                                {withdrawReason.trim().length > 0 && withdrawReason.trim().length < 10 && (
                                    <p className="text-xs text-error-500 mt-1">Mínimo 10 caracteres</p>
                                )}
                            </div>
                            {withdrawDialog?.type === 'justified' && (
                                <div>
                                    <label className="block text-sm font-semibold text-text-primary mb-1">
                                        Comentario <span className="text-text-tertiary">(opcional)</span>
                                    </label>
                                    <textarea
                                        value={withdrawComment}
                                        onChange={(e) => setWithdrawComment(e.target.value)}
                                        className="w-full h-20 rounded-xl border border-border-medium bg-transparent p-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand-500 focus:outline-none resize-none"
                                        placeholder="Comentarios adicionales..."
                                    />
                                </div>
                            )}
                        </div>
                    </UnifiedDialog>
                </div>
            </div>
        </>
    );
}
