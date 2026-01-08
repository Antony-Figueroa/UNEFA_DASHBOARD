/**
 * @file PreEnrollment.tsx
 * @description Página principal para la gestión del módulo de Pre-Inscripción.
 */

import { useMemo, useState, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import UnifiedDialog from "../../components/ui/dialog/UnifiedDialog";
import { DialogVariant } from "../../components/ui/dialog/DialogConfig";
import Button from "../../components/ui/button/Button";
import { FullScreenLoader } from "../../components/ui/loader";
import { SkeletonLoader, TitleSkeleton, BreadcrumbSkeleton, TablePageSkeleton } from "../../components/ui/skeleton";
import { PlusCircleIcon } from "../../icons/actions";
import { InfoIcon } from "../../icons";

import PreEnrollmentTable from "../../features/pre-enrollment/components/PreEnrollmentTable";
import PreEnrollmentModal from "../../features/pre-enrollment/components/PreEnrollmentModal";
import PreEnrollmentViewModal from "../../features/pre-enrollment/components/PreEnrollmentViewModal";
import { usePreEnrollment } from "../../features/pre-enrollment/hooks/usePreEnrollment";
import { PreEnrollment, PreEnrollmentRowData } from "../../features/pre-enrollment/types";
import { formatDateTime } from "../../utils/date";

const formatPreEnrollmentToRow = (p: PreEnrollment): PreEnrollmentRowData => ({
    ...p,
    preEnrollmentDate: formatDateTime(p.preEnrollmentDate),
});

export default function PreEnrollmentPage() {
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setPageLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const {
        preEnrollments,
        status,
        loadingAction,
        addPreEnrollment,
        editPreEnrollment,
        toggleStatus,
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
            title: goingInactive ? "Confirmar Desactivación" : "Confirmar Restauración",
            message: `¿Estás seguro de que deseas ${goingInactive ? "desactivar" : "restaurar"} la pre-inscripción de "${original.studentName}"?`,
            onConfirm: async () => {
                try {
                    await toggleStatus(original);
                } catch (e) { console.error(e); }
                finally { setConfirmation(null); }
            },
            confirmText: goingInactive ? "Desactivar" : "Restaurar",
            variant: goingInactive ? "warning" : "success",
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
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Listado de Pre-Inscripciones</h2>
                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                                    Demo
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Gestiona las pre-inscripciones de los estudiantes para el período actual.</p>
                        </SkeletonLoader>
                    </div>

                    {!pageLoading && (
                        <Button onClick={handleCreate} startIcon={<PlusCircleIcon className="h-5 w-5" />}>
                            Nueva Pre-Inscripción
                        </Button>
                    )}
                </div>

                {!pageLoading && (
                    <div className="mb-6 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-700 dark:border-blue-900/30 dark:bg-blue-500/10 dark:text-blue-400">
                        <InfoIcon className="h-5 w-5 shrink-0" />
                        <div className="text-sm">
                            <span className="font-bold">Modo Demostración Activo:</span> Esta vista utiliza datos estáticos locales.
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    <ComponentCard title={activeTab === "Activas" ? "Pre Inscripciones Activas" : "Pre Inscripciones Inactivas"}>
                        <div className="mb-6 flex border-b border-gray-200 dark:border-white/5">
                            <button
                                onClick={() => setActiveTab("Activas")}
                                className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === "Activas" ? "text-brand-500" : "text-gray-500 hover:text-gray-700"}`}
                            >
                                Activas
                                {activeTab === "Activas" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500 animate-slideInLeft" />}
                            </button>
                            <button
                                onClick={() => setActiveTab("Inactivas")}
                                className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === "Inactivas" ? "text-brand-500" : "text-gray-500 hover:text-gray-700"}`}
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
                                onView={setViewItem}
                                loading={loadingAction}
                            />
                        </SkeletonLoader>
                    </ComponentCard>

                    <PreEnrollmentModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onSave={handleSave}
                        editingEntry={editingEntry}
                        isLoading={loadingAction}
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
