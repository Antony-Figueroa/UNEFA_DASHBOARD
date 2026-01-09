/**
 * @file tutors.tsx
 * @description Página principal para la gestión del módulo de Tutores.
 * Orquesta la visualización de datos en tablas, la gestión de estados (activos/inactivos),
 * y las operaciones CRUD (Crear, Leer, Actualizar, Eliminar) mediante modales y hooks especializados.
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

import TutorTable from "../../features/tutors/components/TutorTable";
import TutorModal from "../../features/tutors/components/TutorModal";
import TutorViewModal from "../../features/tutors/components/TutorViewModal";
import { useTutors } from "../../features/tutors/hooks/useTutors";
import { Tutor, TutorRowData } from "../../features/tutors/types";
import { formatDateTime } from "../../utils/date";

/**
 * Transforma un objeto de tipo Tutor (dominio) a TutorRowData (vista).
 * Realiza el formateo de fechas y concatenación de nombres.
 */
const formatTutorToRow = (t: Tutor): TutorRowData => ({
    ...t,
    registrationDate: formatDateTime(t.registrationDate),
});

export default function TutorsPage() {
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setPageLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const {
        tutors,
        status,
        loadingAction,
        error,
        addTutor,
        editTutor,
        toggleStatus,
        bulkRemoveTutors,
        bulkRestoreTutors,
    } = useTutors();

    // Profesiones predefinidas (pueden venir de un hook en el futuro)
    const professionOptions = [
        { value: "INGENIERO EN SISTEMAS", label: "INGENIERO EN SISTEMAS" },
        { value: "INGENIERO INDUSTRIAL", label: "INGENIERO INDUSTRIAL" },
        { value: "LICENCIADO EN ADMINISTRACIÓN", label: "LICENCIADO EN ADMINISTRACIÓN" },
        { value: "ABOGADO", label: "ABOGADO" },
    ];

    const [activeTab, setActiveTab] = useState<"Activas" | "Inactivas">("Activas");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTutor, setEditingTutor] = useState<Tutor | null>(null);
    const [viewTutor, setViewTutor] = useState<TutorRowData | null>(null);

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
        const byStatus = tutors.filter((t) => (activeTab === "Activas" ? t.status : !t.status));
        return byStatus.map(formatTutorToRow);
    }, [tutors, activeTab]);

    const handleCreate = () => {
        setEditingTutor(null);
        setIsModalOpen(true);
    };

    const handleEdit = (row: TutorRowData) => {
        const original = tutors.find((t) => t.tutorId === row.tutorId) || null;
        setEditingTutor(original);
        setIsModalOpen(true);
    };

    const handleSave = (payload: Omit<Tutor, "tutorId" | "registrationDate">) => {
        const isEditing = !!editingTutor;
        setConfirmation({
            isOpen: true,
            title: isEditing ? "Confirmar Modificación" : "Confirmar Registro",
            message: `¿Estás seguro de que deseas ${isEditing ? "guardar los cambios de" : "registrar a"} este tutor?`,
            onConfirm: async () => {
                try {
                    if (isEditing && editingTutor) {
                        await editTutor({ ...editingTutor, ...payload });
                    } else {
                        await addTutor(payload);
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

    const handleToggleStatus = (tutorId: string) => {
        const original = tutors.find((t) => t.tutorId === tutorId);
        if (!original) return;
        const goingInactive = original.status === true;
        setConfirmation({
            isOpen: true,
            title: goingInactive ? "Confirmar Envío a Inactivos" : "Confirmar Restauración",
            message: goingInactive 
                ? `¿Estás seguro de que deseas enviar al tutor "${original.firstName} ${original.lastName}" a Inactivos?`
                : `¿Estás seguro de que deseas restaurar al tutor "${original.firstName} ${original.lastName}"?`,
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
            title: "Confirmar Envío a Inactivos (Masivo)",
            message: `¿Estás seguro de que deseas enviar los ${ids.length} tutores seleccionados a Inactivos?`,
            onConfirm: async () => {
                try {
                    await bulkRemoveTutors(ids);
                } catch (e) { console.error(e); }
                finally { setConfirmation(null); }
            },
            confirmText: "Confirmar",
            variant: "error",
        });
    };

    const handleBulkRestore = (ids: string[]) => {
        setConfirmation({
            isOpen: true,
            title: "Confirmar Restauración Masiva",
            message: `¿Estás seguro de que deseas restaurar los ${ids.length} tutores seleccionados?`,
            onConfirm: async () => {
                try {
                    await bulkRestoreTutors(ids);
                } catch (e) { console.error(e); }
                finally { setConfirmation(null); }
            },
            confirmText: "Restaurar",
            variant: "success",
        });
    };

    return (
        <>
            <PageMeta title="Gestión de Tutores" description="Administración de tutores" />

            <SkeletonLoader isLoading={pageLoading} skeleton={<BreadcrumbSkeleton />} id="tutors-breadcrumb">
                <PageBreadcrumb pageTitle="Tutores" />
            </SkeletonLoader>

            {loadingAction && <FullScreenLoader label="Procesando..." />}

            <div className="stagger-delay">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <SkeletonLoader isLoading={pageLoading} skeleton={<TitleSkeleton />} id="tutors-title">
                            <div className="flex items-center gap-2">
                                    <h2 className="text-2xl font-bold text-text-primary dark:text-white/90">Listado de Tutores</h2>
                                    <span className="inline-flex items-center rounded-full bg-bg-secondary px-2.5 py-0.5 text-xs font-medium text-text-primary dark:bg-bg-dark dark:text-text-tertiary border border-border-light dark:border-border-dark">
                                        Demo
                                    </span>
                                </div>
                                <p className="mt-1 text-sm text-text-secondary dark:text-text-tertiary">Gestiona la información y estado académico de los tutores.</p>
                        </SkeletonLoader>
                    </div>

                    {!pageLoading && (
                        <Button onClick={handleCreate} startIcon={<PlusCircleIcon className="h-5 w-5" />}>
                            Nuevo Tutor
                        </Button>
                    )}
                </div>

                {!pageLoading && (
                    <div className="mb-6 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-700 dark:border-blue-900/30 dark:bg-blue-500/10 dark:text-blue-400">
                        <InfoIcon className="h-5 w-5 shrink-0" />
                        <div className="text-sm">
                            <span className="font-bold">Modo Demostración Activo:</span> Esta vista utiliza datos estáticos locales. No se realizan conexiones a servicios externos.
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    <ComponentCard title={activeTab === "Activas" ? "Tutores Activos" : "Tutores Inactivos"}>
                        <div className="mb-6 flex border-b border-border-light dark:border-white/5">
                            <button
                                onClick={() => setActiveTab("Activas")}
                                className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === "Activas" ? "text-brand-500" : "text-text-secondary hover:text-text-primary"}`}
                            >
                                Activos
                                {activeTab === "Activas" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500 animate-slideInLeft" />}
                            </button>
                            <button
                                onClick={() => setActiveTab("Inactivas")}
                                className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === "Inactivas" ? "text-brand-500" : "text-text-secondary hover:text-text-primary"}`}
                            >
                                Inactivos
                                {activeTab === "Inactivas" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500 animate-slideInLeft" />}
                            </button>
                        </div>

                        <SkeletonLoader isLoading={pageLoading || status === "loading"} skeleton={<TablePageSkeleton rows={5} />} id="tutors-table">
                            <TutorTable
                                data={filtered}
                                status={status}
                                error={error}
                                activeTab={activeTab}
                                onEdit={handleEdit}
                                onToggleStatus={handleToggleStatus}
                                onView={setViewTutor}
                                onBulkDelete={handleBulkDelete}
                                onBulkRestore={handleBulkRestore}
                                inactiveMode={activeTab === "Inactivas"}
                                professionOptions={professionOptions}
                                loading={loadingAction}
                            />
                        </SkeletonLoader>
                    </ComponentCard>

                    <TutorModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onSave={handleSave}
                        editingTutor={editingTutor}
                        isLoading={loadingAction}
                    />

                    <TutorViewModal
                        isOpen={!!viewTutor}
                        onClose={() => setViewTutor(null)}
                        onEdit={handleEdit}
                        tutor={viewTutor}
                    />

                    {/* Modal de Confirmación Global */}
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
