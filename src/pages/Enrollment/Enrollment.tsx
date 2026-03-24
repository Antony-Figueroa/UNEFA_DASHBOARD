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
import { SkeletonLoader, TitleSkeleton, BreadcrumbSkeleton, TablePageSkeleton } from "../../components/ui/skeleton";
import { PlusCircleIcon } from "../../icons/actions";
import { DownloadIcon } from "../../icons";

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
import CareerModal from "../../features/careers/components/CareerModal";

/**
 * Normalizes an enrollment object for display in the table.
 * 
 * @param e - The enrollment object.
 * @returns The formatted row data.
 */
const formatEnrollmentToRow = (e: Enrollment): EnrollmentRowData => ({
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

    const { addPreEnrollment, loadingAction: preEnrollmentLoading } = usePreEnrollment();
    const { tutors, addTutor, loadingAction: tutorLoading } = useTutors();
    const { institutions, addInstitution, loadingAction: institutionLoading } = useInstitutions();
    const { addResponsible, loadingAction: responsibleLoading } = useInstitutionalResponsibles();
    const { careers, addCareer } = useCareers();
    const { activeOptions: internshipTypeOptions } = useInternshipTypes();

    const careerOptions = useMemo(() => 
        careers.filter(c => c.status).map(c => ({ 
            value: String(c.careerId), 
            text: c.careerName,
            internshipPriorities: c.internshipTypeIds || []
        })),
    [careers]);

    const [activeTab, setActiveTab] = useState<"Activas" | "Inactivas">("Activas");
    const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
    const [pdfSearchTerm, setPdfSearchTerm] = useState("");
    const [isPreEnrollmentModalOpen, setIsPreEnrollmentModalOpen] = useState(false);
    const [isTutorModalOpen, setIsTutorModalOpen] = useState(false);
    const [isInstitutionModalOpen, setIsInstitutionModalOpen] = useState(false);
    const [isResponsibleModalOpen, setIsResponsibleModalOpen] = useState(false);
    const [isCareerModalOpen, setIsCareerModalOpen] = useState(false);
    const [preselectedInstitutionId, setPreselectedInstitutionId] = useState<string | undefined>(undefined);
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
     * Efecto para escuchar eventos de agregar desde el modal de inscripción.
     */
    useEffect(() => {
        const handleAddPreEnrollment = () => setIsPreEnrollmentModalOpen(true);
        const handleAddTutor = () => setIsTutorModalOpen(true);
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

    /**
     * Opens the modal to create a new enrollment.
     */
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
     * 
     * @param payload - The data to save (CreateEnrollmentPayload or UpdateEnrollmentPayload).
     */
    const handleSave = (payload: CreateEnrollmentPayload | UpdateEnrollmentPayload) => {
        const isEditing = "enrollmentId" in payload;
        setConfirmation({
            isOpen: true,
            title: isEditing ? "Confirmar Modificación" : "Confirmar Registro",
            message: `¿Estás seguro de que deseas ${isEditing ? "guardar los cambios de" : "registrar"} esta inscripción?`,
            onConfirm: async () => {
                try {
                    if (isEditing) {
                        await editEnrollment(payload as UpdateEnrollmentPayload);
                    } else {
                        await addEnrollment(payload as CreateEnrollmentPayload);
                    }
                    setIsModalOpen(false);
                } catch (e) {
                    console.error("[EnrollmentPage] Error saving enrollment:", e);
                } finally {
                    setConfirmation(null);
                }
            },
            confirmText: isEditing ? "Guardar" : "Registrar",
            variant: "info",
        });
    };

    /**
     * Handles toggling the active status of an enrollment.
     * 
     * @param row - The row data of the enrollment to toggle.
     */
    const handleToggleStatus = (row: EnrollmentRowData) => {
        const original = enrollments.find((e) => e.enrollmentId === row.enrollmentId);
        if (!original) return;

        const isDeactivating = original.status;
        const actionVerb = isDeactivating ? "desactivar" : "activar";
        const confirmTitle = isDeactivating ? "Confirmar Desactivación" : "Confirmar Activación";
        const variant = isDeactivating ? "error" : "success";
        const confirmText = isDeactivating ? "Desactivar" : "Activar";

        setConfirmation({
            isOpen: true,
            title: confirmTitle,
            message: `¿Estás seguro de que deseas ${actionVerb} la inscripción de ${row.studentName}?`,
            onConfirm: async () => {
                try {
                    await toggleStatus(original);
                } catch (error) {
                    console.error("[EnrollmentPage] Error toggling status:", error);
                } finally {
                    setConfirmation(null);
                }
            },
            confirmText: confirmText,
            variant: variant as DialogVariant,
        });
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
                    />

                    <TutorModal
                        isOpen={isTutorModalOpen}
                        onClose={() => setIsTutorModalOpen(false)}
                        onSave={async (payload) => {
                            try {
                                const newTutor = await addTutor(payload as any);
                                if (newTutor) {
                                    // Disparar evento para actualizar la lista de tutores en el EnrollmentModal
                                    const updateEvt = new CustomEvent("enrollment:tutorAdded", { 
                                        detail: { tutor: newTutor } 
                                    });
                                    window.dispatchEvent(updateEvt);
                                    
                                    // Seleccionar el nuevo tutor automáticamente
                                    const selectEvt = new CustomEvent("enrollment:setTutor", { 
                                        detail: { tutorId: newTutor.tutorId } 
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
                        institutionOptions={institutions.map(i => ({ value: i.institutionId, label: i.name }))}
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
                </div>
            </div>
        </>
    );
}
