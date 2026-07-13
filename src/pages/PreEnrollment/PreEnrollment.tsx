/**
 * @file PreEnrollment.tsx
 * @description Página principal para la gestión del módulo de Pre-Inscripción.
 */

import { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useTabs as useAppTabs } from "../../context/tab";
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

import PreEnrollmentTable from "../../features/pre-enrollment/components/PreEnrollmentTable";
import PreEnrollmentModal from "../../features/pre-enrollment/components/PreEnrollmentModal";
import PreEnrollmentViewModal from "../../features/pre-enrollment/components/PreEnrollmentViewModal";
import StudentModal from "../../features/students/components/StudentModal";
import { usePreEnrollment } from "../../features/pre-enrollment/hooks/usePreEnrollment";
import { withdrawPreEnrollment } from "../../features/pre-enrollment/services/preEnrollmentService";
import { useStudents } from "../../features/students/hooks/useStudents";
import { useCareers } from "../../features/careers/hooks/useCareers";
import { useLists } from "../../features/lists/hooks/useLists";
import { ListValue } from "../../features/lists/types";
import { usePeriods } from "../../features/periods/hooks/usePeriods";
import { getInternshipTypes, mapToOptions } from "../../features/internship-types/services/internshipTypesService";
import { PreEnrollment, PreEnrollmentRowData, CreatePreEnrollmentPayload, UpdatePreEnrollmentPayload } from "../../features/pre-enrollment/types";
import { formatDateTime } from "../../utils/date";
import { toTitleCase } from "../../utils/textFormat";

/**
 * Formatea un objeto PreEnrollment a PreEnrollmentRowData para su visualización en tablas.
 * 
 * @param p - El registro de pre-inscripción.
 * @returns El registro formateado.
 */
const formatPreEnrollmentToRow = (p: PreEnrollment): PreEnrollmentRowData => {
    // Determinar el tipo de registro basado en el estado
    // status=true = activa, status=false = inactiva/retirada
    const isWithdrawn = !p.status; // Por ahora usamos status=false como indicador de retirada
    return {
        ...p,
        preEnrollmentDate: formatDateTime(p.preEnrollmentDate),
        recordType: isWithdrawn ? 'withdrawn' : 'active',
        withdrawalType: undefined // Se actualizará cuando se implemente la lógica de retirada completa
    };
};

/**
 * Componente PreEnrollmentPage.
 * 
 * Página principal para la gestión de pre-inscripciones.
 * Proporciona una tabla con búsqueda, filtrado, creación, edición
 * y activación/desactivación de pre-inscripciones.
 */
export default function PreEnrollmentPage() {
    const [pageLoading, setPageLoading] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    const { openTab } = useAppTabs();
    const [initialCi, setInitialCi] = useState<string | null>(null);
    const { periodos } = usePeriods();
    const [periodOptions, setPeriodOptions] = useState<{ value: string; label: string }[]>([]);
    const [practiceTypeOptions, setPracticeTypeOptions] = useState<{ value: string; label: string }[]>([]);
    const [internshipTypeData, setInternshipTypeData] = useState<{ name: string; priority: number }[]>([]);

    // Event listener for Command Palette - open create modal
    useEffect(() => {
        if (location.state?.openCreateModal) {
            setEditingEntry(null);
            setInitialCi(null);
            setIsModalOpen(true);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate]);

    useEffect(() => {
        if (periodos.length > 0) {
            const mappedPeriods = periodos.map(p => ({
                value: p.description.toUpperCase(),
                label: toTitleCase(p.description)
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
                    label: toTitleCase(opt.label),
                    id: opt.id
                }));

                if (mappedPractice.length > 0) {
                    setPracticeTypeOptions(mappedPractice);
                } else {
                    // Fallback si no hay datos en la BD
                    setPracticeTypeOptions([
                        { value: "ORDINARIA", label: toTitleCase("ORDINARIA") },
                        { value: "ESPECIAL", label: toTitleCase("ESPECIAL") },
                    ]);
                }
                // Store raw data for priority computation
                setInternshipTypeData(practiceData.map(t => ({ name: t.name, priority: t.priority })));
            } catch (error) {
                console.error("Error loading filter options:", error);
                // Fallback en caso de error
                setPracticeTypeOptions([
                    { value: "ORDINARIA", label: toTitleCase("ORDINARIA") },
                    { value: "ESPECIAL", label: toTitleCase("ESPECIAL") },
                ]);
            }
        };
        loadFilterOptions();
    }, []);

    // Si hay más de 1 tipo de práctica activo, solo la prioridad 1 permite inactivación
    const hasMultiplePracticeTypes = practiceTypeOptions.length > 1;
    const priorityOnePracticeType = useMemo(() => {
        if (!hasMultiplePracticeTypes) return null;
        const p1 = internshipTypeData.find(t => t.priority === 1);
        return p1 ? p1.name.toUpperCase() : null;
    }, [hasMultiplePracticeTypes, internshipTypeData]);

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
        deletePreEnrollment,
        toggleStatus,
        withdrawPreEnrollment,
        bulkToggleStatus,
    } = usePreEnrollment();

    const { addStudent, loadingAction: studentLoading } = useStudents();
    const { careers } = useCareers();
    const { fetchMultipleLists } = useLists();

    const [isSelecting, setIsSelecting] = useState(false);
    const [activeTab, setActiveTab] = useState<"Activas" | "Inactivas">("Activas");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<PreEnrollment | null>(null);
    const [viewItem, setViewItem] = useState<PreEnrollmentRowData | null>(null);
    const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
    const [dynamicLists, setDynamicLists] = useState<Record<string, ListValue[]>>({});

    const careerOptions = useMemo(() => 
        careers.map(c => ({ value: String(c.careerId), label: toTitleCase(c.careerName) })),
        [careers]);

    useEffect(() => {
        const loadDynamicLists = async () => {
            try {
                const listNames = [
                    "Nacionalidad", 
                    "Sexo", 
                    "PREFIJO", 
                    "Registro Civil", 
                    "Regimen/Turno", 
                    "Tipo de estudiante", 
                    "Rango Militar", 
                    "Trabajo"
                ];
                const data = await fetchMultipleLists(listNames);
                setDynamicLists(data as Record<string, ListValue[]>);
            } catch (error) {
                console.error("Error loading dynamic lists:", error);
            }
        };
        loadDynamicLists();
    }, [fetchMultipleLists]);

    type ConfirmationInfo = {
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        confirmText: string;
        variant: DialogVariant;
    };

    const [confirmation, setConfirmation] = useState<ConfirmationInfo | null>(null);

    // Diálogo de retiro / abandono
    const [withdrawDialog, setWithdrawDialog] = useState<{
        type: 'justified' | 'unjustified';
        enrollment: PreEnrollmentRowData;
    } | null>(null);
    const [withdrawReason, setWithdrawReason] = useState('');
    const [withdrawComment, setWithdrawComment] = useState('');
    const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
    const [hasCheckedExpired, setHasCheckedExpired] = useState(false);

    // Detectar pre-inscripciones activas cuyo período de inscripción ya venció
    useEffect(() => {
        if (hasCheckedExpired || pageLoading || preEnrollments.length === 0 || periodos.length === 0) return;

        const now = new Date();
        const expired: PreEnrollment[] = [];

        for (const pre of preEnrollments) {
            if (!pre.status) continue; // solo activas
            const period = periodos.find(p => p.description.trim().toUpperCase() === pre.period.trim().toUpperCase());
            if (!period) continue;
            const startDate = new Date(period.startDate);
            if (isNaN(startDate.getTime())) continue;
            const graceDays = period.enrollmentGraceDays ?? 21;
            const deadline = new Date(startDate);
            deadline.setDate(deadline.getDate() + graceDays);
            if (now > deadline) {
                expired.push(pre);
            }
        }

        if (expired.length > 0) {
            setConfirmation({
                isOpen: true,
                title: "Pre-Inscripciones Vencidas",
                message: `Hay ${expired.length} pre-inscripcione(s) activa(s) cuyo período de inscripción ya cerró. ¿Desea desactivarlas automáticamente?`,
                confirmText: "Desactivar",
                variant: "warning",
                onConfirm: async () => {
                    try {
                        await bulkToggleStatus(expired.map(p => p.preEnrollmentId), false);
                    } catch (error) {
                        console.error("[PreEnrollmentPage] Error al desactivar vencidas:", error);
                    } finally {
                        setConfirmation(null);
                        setHasCheckedExpired(true);
                    }
                }
            });
        }
        setHasCheckedExpired(true);
    }, [preEnrollments, periodos, pageLoading, hasCheckedExpired, bulkToggleStatus]);

    const filtered = useMemo(() => {
        return preEnrollments.map(formatPreEnrollmentToRow);
    }, [preEnrollments]);

    /**
     * Efecto para escuchar eventos de agregar estudiante desde el modal de preinscripción.
     */
    useEffect(() => {
        const handleAddStudent = () => setIsStudentModalOpen(true);
        window.addEventListener("preenrollment:addStudent", handleAddStudent);
        return () => {
            window.removeEventListener("preenrollment:addStudent", handleAddStudent);
        };
    }, []);



    /**
     * Maneja la apertura del modal para crear una nueva pre-inscripción.
     */
    const handleCreate = () => {
        setEditingEntry(null);
        setIsModalOpen(true);
    };

    /**
     * Maneja la apertura del modal para editar una pre-inscripción existente.
     * 
     * @param row - Registro de la fila seleccionada en la tabla.
     */
    const handleEdit = (row: PreEnrollmentRowData) => {
        const original = preEnrollments.find((p) => p.preEnrollmentId === row.preEnrollmentId) || null;
        setEditingEntry(original);
        setIsModalOpen(true);
    };

    /**
     * Maneja el guardado (creación o actualización) de una pre-inscripción.
     * El modal ya muestra su propio diálogo de confirmación, este handler
     * ejecuta el guardado directo sin duplicar la confirmación.
     * 
     * @param payload - Datos de la pre-inscripción (Create o Update).
     */
    const handleSave = async (payload: CreatePreEnrollmentPayload | UpdatePreEnrollmentPayload) => {
        try {
            if (editingEntry) {
                await editPreEnrollment({ 
                    ...payload, 
                    preEnrollmentId: editingEntry.preEnrollmentId 
                } as UpdatePreEnrollmentPayload);
            } else {
                await addPreEnrollment(payload as CreatePreEnrollmentPayload);
            }
            setIsModalOpen(false);
        } catch (error) {
            // El error ya es manejado por el hook usePreEnrollment (muestra Toast)
        }
	};

/**
     * Maneja el cambio de estado (activar/desactivar) de una pre-inscripción.
     * Muestra un diálogo de confirmación antes de proceder con la desactivación.
     * 
     * @param item - Registro de la fila seleccionada.
     */
    const handleToggleStatus = (item: PreEnrollmentRowData) => {
        const original = preEnrollments.find((p) => p.preEnrollmentId === item.preEnrollmentId);
        if (!original) return;

        const isDeactivating = original.status;
        const config = isDeactivating
          ? CONFIRM_MESSAGES.deactivate('la pre-inscripción')
          : CONFIRM_MESSAGES.activate('la pre-inscripción');

        setConfirmation({
            isOpen: true,
            title: config.title,
            message: `¿Estás seguro de que deseas ${isDeactivating ? 'desactivar' : 'restaurar'} la pre-inscripción de ${item.studentName}?`,
            confirmText: config.confirmLabel,
            variant: config.variant as DialogVariant,
            onConfirm: async () => {
                try {
                    await toggleStatus(original);
                } catch (error) {
                    console.error(error);
                } finally {
                    setConfirmation(null);
                }
            }
        });
    };

    /**
     * Maneja la eliminación (desactivación) individual de una pre-inscripción.
     * Muestra un diálogo de confirmación antes de proceder.
     * 
     * @param item - Registro de la fila seleccionada.
     */
    const handleDelete = (item: PreEnrollmentRowData) => {
        const original = preEnrollments.find((p) => p.preEnrollmentId === item.preEnrollmentId);
        if (!original) return;

setConfirmation({
            isOpen: true,
            title: "Confirmar Eliminación",
            message: `¿Estás seguro de que deseas eliminar la pre-inscripción de ${item.studentName}? Esta acción no se puede deshacer.`,
            confirmText: "Eliminar",
            variant: "error",
            onConfirm: async () => {
                try {
                    await deletePreEnrollment(original.preEnrollmentId);
                } catch (error) {
                    console.error(error);
                } finally {
                    setConfirmation(null);
                }
            }
        });
    };

    /**
     * Maneja la desactivación masiva de múltiples pre-inscripciones.
     * 
     * @param ids - Arreglo de IDs de pre-inscripción a desactivar.
     */
    const handleBulkDelete = (ids: string[]) => {
        const config = CONFIRM_MESSAGES.deactivate('las pre-inscripciones');
        setConfirmation({
            isOpen: true,
            title: 'Confirmar desactivación masiva',
            message: `¿Estás seguro de que deseas desactivar las ${ids.length} pre-inscripciones seleccionadas?`,
            confirmText: "Desactivar Todos",
            variant: config.variant as DialogVariant,
            onConfirm: async () => {
                try {
                    await bulkToggleStatus(ids, false);
                } catch (error) {
                    console.error(error);
                } finally {
                    setConfirmation(null);
                }
            }
        });
    };

    /**
     * Maneja la restauración masiva de múltiples pre-inscripciones.
     * 
     * @param ids - Arreglo de IDs de pre-inscripción a restaurar.
     */
    const handleBulkRestore = (ids: string[]) => {
        const config = CONFIRM_MESSAGES.activate('las pre-inscripciones');
        setConfirmation({
            isOpen: true,
            title: 'Confirmar restauración masiva',
            message: `¿Estás seguro de que deseas restaurar las ${ids.length} pre-inscripciones seleccionadas?`,
            confirmText: "Restaurar Todos",
            variant: config.variant as DialogVariant,
            onConfirm: async () => {
                try {
                    await bulkToggleStatus(ids, true);
                } catch (error) {
                    console.error(error);
                } finally {
                    setConfirmation(null);
                }
            }
        });
    };

    /**
     * Redirige al módulo de Inscripción llevando los datos de la pre-inscripción.
     * 
     * @param item - Registro de pre-inscripción a exportar.
     */
    const handleExportToEnrollment = (item: PreEnrollmentRowData) => {
        openTab("/enrollment", "Inscripción");
        navigate("/enrollment", { state: { preEnrollmentData: item } });
    };

    /**
     * Abre el modal de retiro justificado / abandono.
     */
    const handleWithdraw = (type: 'justified' | 'unjustified', row: PreEnrollmentRowData) => {
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
            await withdrawPreEnrollment(enrollment.preEnrollmentId || '', type, withdrawReason, withdrawComment);
            setWithdrawDialog(null);
        } catch (error) {
            console.error("[PreEnrollmentPage] Error withdrawing:", error);
        } finally {
            setWithdrawSubmitting(false);
        }
    };

    return (
        <>
            <PageMeta title="Gestión de Pre-Inscripciones" description="Administración de pre-inscripciones" />

            <SkeletonLoader isLoading={pageLoading} skeleton={<BreadcrumbSkeleton />} id="pre-enrollment-breadcrumb">
                <PageBreadcrumb pageTitle="Pre-Inscripción" />
            </SkeletonLoader>

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
                        <div className="flex flex-wrap items-center gap-3">
                            <Button onClick={handleCreate} disabled={isSelecting} startIcon={<PlusCircleIcon className="h-5 w-5" />}>
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
                                onDelete={handleDelete}
                                onBulkDelete={handleBulkDelete}
                                onBulkRestore={handleBulkRestore}
                                onView={setViewItem}
                                onExportToEnrollment={handleExportToEnrollment}
                                onWithdrawJustified={(row) => handleWithdraw('justified', row)}
                                onWithdrawUnjustified={(row) => handleWithdraw('unjustified', row)}
                                loading={loadingAction}
                                periodOptions={periodOptions}
                                practiceTypeOptions={practiceTypeOptions}
                                onSelectionChange={setIsSelecting}
                                priorityOnePracticeType={priorityOnePracticeType}
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
                        careerOptions={careerOptions}
                    />

                    <PreEnrollmentViewModal
                        isOpen={!!viewItem}
                        onClose={() => setViewItem(null)}
                        onEdit={handleEdit}
                        item={viewItem}
                    />

                    <StudentModal
                        isOpen={isStudentModalOpen}
                        onClose={() => setIsStudentModalOpen(false)}
                        onSave={async (payload) => {
                            try {
                                await addStudent(payload as any);
                                const studentData = {
                                    identificationPrefix: payload.identificationPrefix,
                                    identificationNumber: payload.identificationNumber,
                                    firstName: payload.firstName,
                                    lastName: payload.lastName,
                                    phone: payload.phone,
                                };
                                const evt = new CustomEvent("preenrollment:setStudentId", { detail: studentData });
                                window.dispatchEvent(evt);
                                setIsStudentModalOpen(false);
                            } catch (e) {
                                console.error("[PreEnrollmentPage] Error creating student:", e);
                            }
                        }}
                        editingStudent={null}
                        isLoading={studentLoading}
                        modalId="preenrollment-student"
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
