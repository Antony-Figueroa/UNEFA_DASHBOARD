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
import { PlusCircleIcon } from "../../icons/actions";

import PreEnrollmentTable from "../../features/pre-enrollment/components/PreEnrollmentTable";
import PreEnrollmentModal from "../../features/pre-enrollment/components/PreEnrollmentModal";
import PreEnrollmentViewModal from "../../features/pre-enrollment/components/PreEnrollmentViewModal";
import { usePreEnrollment } from "../../features/pre-enrollment/hooks/usePreEnrollment";
import { usePeriods } from "../../features/periods/hooks/usePeriods";
import { getInternshipTypes, mapToOptions } from "../../features/internship-types/services/internshipTypesService";
import { PreEnrollment, PreEnrollmentRowData } from "../../features/pre-enrollment/types";
import { formatDateTime } from "../../utils/date";
import { useLists } from "../../features/lists/hooks/useLists";

const formatPreEnrollmentToRow = (p: PreEnrollment): PreEnrollmentRowData => ({
    ...p,
    preEnrollmentDate: formatDateTime(p.preEnrollmentDate),
});

export default function PreEnrollmentPage() {
    const [pageLoading, setPageLoading] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    const [initialCi, setInitialCi] = useState<string | null>(null);
    const { fetchMultipleLists } = useLists();
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
                    label: opt.label
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
    const [isModalOpen, setIsModalOpen] = useState(false);
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
                        <Button onClick={handleCreate} startIcon={<PlusCircleIcon className="h-5 w-5" />}>
                            Nueva Pre-Inscripción
                        </Button>
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
