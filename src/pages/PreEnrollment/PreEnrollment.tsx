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
import { SkeletonLoader, TitleSkeleton, BreadcrumbSkeleton, TablePageSkeleton } from "../../components/ui/skeleton";
import { PlusCircleIcon } from "../../icons/actions";

import PreEnrollmentTable from "../../features/pre-enrollment/components/PreEnrollmentTable";
import PreEnrollmentModal from "../../features/pre-enrollment/components/PreEnrollmentModal";
import PreEnrollmentViewModal from "../../features/pre-enrollment/components/PreEnrollmentViewModal";
import StudentModal from "../../features/students/components/StudentModal";
import { usePreEnrollment } from "../../features/pre-enrollment/hooks/usePreEnrollment";
import { useStudents } from "../../features/students/hooks/useStudents";
import { useCareers } from "../../features/careers/hooks/useCareers";
import { useLists } from "../../features/lists/hooks/useLists";
import { ListValue } from "../../features/lists/types";
import { usePeriods } from "../../features/periods/hooks/usePeriods";
import { getInternshipTypes, mapToOptions } from "../../features/internship-types/services/internshipTypesService";
import { PreEnrollment, PreEnrollmentRowData, CreatePreEnrollmentPayload, UpdatePreEnrollmentPayload } from "../../features/pre-enrollment/types";
import { formatDateTime } from "../../utils/date";

/**
 * Formatea un objeto PreEnrollment a PreEnrollmentRowData para su visualización en tablas.
 * 
 * @param p - El registro de pre-inscripción.
 * @returns El registro formateado.
 */
const formatPreEnrollmentToRow = (p: PreEnrollment): PreEnrollmentRowData => ({
    ...p,
    preEnrollmentDate: formatDateTime(p.preEnrollmentDate),
});

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

    const { addStudent, loadingAction: studentLoading } = useStudents();
    const { careers } = useCareers();
    const { fetchMultipleLists } = useLists();

    const [activeTab, setActiveTab] = useState<"Activas" | "Inactivas">("Activas");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<PreEnrollment | null>(null);
    const [viewItem, setViewItem] = useState<PreEnrollmentRowData | null>(null);
    const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
    const [dynamicLists, setDynamicLists] = useState<Record<string, ListValue[]>>({});

    const careerOptions = useMemo(() => 
        careers.map(c => ({ value: String(c.careerId), label: c.careerName.toUpperCase() })),
        [careers]);

    useEffect(() => {
        const loadDynamicLists = async () => {
            try {
                const listNames = ["Nacionalidad", "Tipo de sangre"];
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
     * Muestra un diálogo de confirmación antes de proceder.
     * 
     * @param payload - Datos de la pre-inscripción (Create o Update).
     */
    const handleSave = (payload: CreatePreEnrollmentPayload | UpdatePreEnrollmentPayload) => {
        const isEditing = !!editingEntry;
        setConfirmation({
            isOpen: true,
            title: isEditing ? "Confirmar Modificación" : "Confirmar Registro",
            message: `¿Estás seguro de que deseas ${isEditing ? "guardar los cambios de" : "registrar"} esta pre-inscripción?`,
            onConfirm: async () => {
                try {
                    if (isEditing && editingEntry) {
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
                } finally {
                    setConfirmation(null);
                }
            },
            confirmText: isEditing ? "Guardar" : "Registrar",
            variant: "info",
        });
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
        const actionVerb = isDeactivating ? "desactivar" : "activar";
        const confirmTitle = isDeactivating ? "Confirmar Desactivación" : "Confirmar Activación";
        const variant = isDeactivating ? "error" : "success";
        const confirmText = isDeactivating ? "Desactivar" : "Activar";

        setConfirmation({
            isOpen: true,
            title: confirmTitle,
            message: `¿Estás seguro de que deseas ${actionVerb} la pre-inscripción de ${item.studentName}?`,
            confirmText: confirmText,
            variant: variant as any,
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
     * Maneja la desactivación masiva de múltiples pre-inscripciones.
     * 
     * @param ids - Arreglo de IDs de pre-inscripción a desactivar.
     */
    const handleBulkDelete = (ids: string[]) => {
        setConfirmation({
            isOpen: true,
            title: "Confirmar Desactivación Masiva",
            message: `¿Estás seguro de que deseas desactivar las ${ids.length} pre-inscripciones seleccionadas?`,
            confirmText: "Desactivar",
            variant: "error",
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
        setConfirmation({
            isOpen: true,
            title: "Confirmar Restauración Masiva",
            message: `¿Estás seguro de que deseas restaurar las ${ids.length} pre-inscripciones seleccionadas?`,
            confirmText: "Restaurar",
            variant: "success",
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
        navigate("/enrollment", { state: { preEnrollmentData: item } });
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
                        <div className="flex items-center gap-3">
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

                    <StudentModal
                        isOpen={isStudentModalOpen}
                        onClose={() => setIsStudentModalOpen(false)}
                        onSave={async (payload) => {
                            try {
                                await addStudent(payload as any);
                                const evt = new CustomEvent("preenrollment:setStudentId", { detail: { ...payload } });
                                window.dispatchEvent(evt);
                                setIsStudentModalOpen(false);
                            } catch (e) {
                                console.error("[PreEnrollmentPage] Error creating student:", e);
                            }
                        }}
                        editingStudent={null}
                        careerOptions={careerOptions}
                        isLoading={studentLoading}
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
