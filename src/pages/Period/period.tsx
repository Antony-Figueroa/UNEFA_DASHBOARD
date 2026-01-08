/**
 * @file Página para la gestión de Periodos Académicos.
 * @description Este componente actúa como el contenedor principal, orquestando
 * la visualización de datos, modales y alertas. La lógica de estado y las
 * interacciones con la API se abstraen en el hook `usePeriods`.
 */

import { useState, useMemo, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import PeriodTable from "../../features/periods/components/PeriodTable";
import { PlusCircleIcon } from "../../icons/actions";
import PeriodModal from "../../features/periods/components/PeriodModal";
import Alert from "../../components/ui/alert/Alert";
import UnifiedDialog from "../../components/ui/dialog/UnifiedDialog";
import { DialogVariant } from "../../components/ui/dialog/DialogConfig";
import Button from "../../components/ui/button/Button";
import { FullScreenLoader } from "../../components/ui/loader";
import { SkeletonLoader, TitleSkeleton, BreadcrumbSkeleton, TablePageSkeleton } from "../../components/ui/skeleton";
import { usePeriods } from "../../features/periods/hooks/usePeriods";
import PeriodViewModal from "../../features/periods/components/PeriodViewModal";
import { Periodo, PeriodoRowData } from "../../features/periods/types";
import ErrorBoundary from "../../components/common/ErrorBoundary";

type ConfirmationInfo = {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText: string;
    variant: DialogVariant;
};

export default function Period() {
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setPageLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    // Hook personalizado que encapsula toda la lógica de negocio de los periodos.
    const {
        periodos,
        status,
        loadingAction,
        error,
        addPeriod,
        editPeriod,
        removePeriod,
    } = usePeriods();


    // Estado para controlar la visibilidad y contenido de los modales.
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPeriodo, setEditingPeriodo] = useState<Periodo | null>(null);

    const [confirmation, setConfirmation] = useState<ConfirmationInfo | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingPeriod, setViewingPeriod] = useState<Periodo | null>(null);
    const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');

    // --- Manejadores de Eventos para Modales ---
    const handleOpenCreateModal = () => {
        setEditingPeriodo(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (periodoRow: PeriodoRowData) => {
        // Se busca el periodo original con objetos Date, ya que la tabla puede tener fechas formateadas como string.
        const originalPeriodo = periodos.find(p => p.periodId === periodoRow.periodId);
        // Si no se encuentra el periodo (no debería ocurrir), no se hace nada.
        if (!originalPeriodo) return;
        setEditingPeriodo(originalPeriodo);
        setIsModalOpen(true);
    };

    const handleCloseCreateEditModal = () => {
        setIsModalOpen(false);
        setEditingPeriodo(null);
    };

    const handleOpenViewModal = (periodoRow: PeriodoRowData) => {
        const originalPeriodo = periodos.find(p => p.periodId === periodoRow.periodId);
        if (!originalPeriodo) return;
        setViewingPeriod(originalPeriodo);
        setIsViewModalOpen(true);
    };

    const handleCloseViewModal = () => {
        setIsViewModalOpen(false);
    };

    // --- Lógica de Negocio ---
    const handleSave = (periodoData: Omit<Periodo, "periodId" | "creationDate"> | Periodo) => {
        const isEditing = 'periodId' in periodoData;
        setConfirmation({
            isOpen: true,
            title: isEditing ? 'Confirmar Modificación' : 'Confirmar Registro',
            message: `¿Estás seguro de que deseas ${isEditing ? 'guardar los cambios en' : 'registrar'} este periodo?`,
            onConfirm: async () => {
                try {
                    if (isEditing) {
                        await editPeriod(periodoData as Periodo);
                    } else {
                        await addPeriod(periodoData);
                    }
                    handleCloseCreateEditModal();
                    setConfirmation(null);
                } catch {
                    // El error ya se maneja en el hook
                }
            },
            confirmText: isEditing ? 'Guardar' : 'Registrar',
            variant: 'info'
        });
    };


    const handleCulminatePeriod = async (periodoToCulminate: PeriodoRowData) => {
        setConfirmation({
            isOpen: true,
            title: 'Confirmar Culminación',
            message: `¿Estás seguro de que deseas culminar el periodo "${periodoToCulminate.description}"? Los periodos culminados no se pueden editar.`,
            onConfirm: async () => {
                const originalPeriodo = periodos.find(p => p.periodId === periodoToCulminate.periodId);
                if (originalPeriodo) await editPeriod({ ...originalPeriodo, periodStatus: 3 });
                setConfirmation(null);
            },
            confirmText: 'Culminar',
            variant: 'warning'
        });
    };

    const handleRestore = async (periodoRow: PeriodoRowData) => {
        setConfirmation({
            isOpen: true,
            title: 'Confirmar Restauración',
            message: `¿Estás seguro de que deseas restaurar el periodo "${periodoRow.description}"?`,
            onConfirm: async () => {
                const originalPeriodo = periodos.find(p => p.periodId === periodoRow.periodId);
                if (originalPeriodo) {
                    await editPeriod({ ...originalPeriodo, status: true });
                }
                setConfirmation(null);
            },
            confirmText: 'Restaurar',
            variant: 'success'
        });
    };

    const handleDelete = (id: string) => {
        const periodoObject = periodos.find(p => p.periodId === id);
        if (!periodoObject) return;

        setConfirmation({
            isOpen: true,
            title: 'Confirmar Envío a Inactivos',
            message: `¿Estás seguro de que deseas enviar el período "${periodoObject.description}" a Inactivos?`,
            onConfirm: async () => {
                await removePeriod(periodoObject);
                setConfirmation(null);
            },
            confirmText: 'Confirmar',
            variant: 'error'
        });
    };

    // Memoizamos los datos formateados para la tabla para evitar recálculos innecesarios.
    const tableData = useMemo(() => periodos
        .filter(p => p.status === (activeTab === 'active')) // Filtra según la pestaña activa
        .map(p => {
            let progress = null;
            let daysPassed = 0;
            let daysRemaining = 0;
            let weeksRemaining = 0;

            if (p.periodStatus === 2) { // "En Curso"
                const totalDuration = p.endDate.getTime() - p.startDate.getTime();
                const elapsed = new Date().getTime() - p.startDate.getTime();
                // Asegurarse de que el progreso esté entre 0 y 100
                progress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));

                const oneDay = 1000 * 60 * 60 * 24;
                daysPassed = Math.floor(elapsed / oneDay);
                daysRemaining = Math.ceil((p.endDate.getTime() - new Date().getTime()) / oneDay);
                weeksRemaining = Math.ceil(daysRemaining / 7);
            }
            return {
                ...p,
                startDate: p.startDate.toLocaleDateString(),
                endDate: p.endDate.toLocaleDateString(),
                rawStartDate: p.startDate,
                rawEndDate: p.endDate,
                progress: progress,
                daysPassed: Math.max(0, daysPassed),
                daysRemaining: Math.max(0, daysRemaining),
                weeksRemaining: Math.max(0, weeksRemaining),
            };
        }), [periodos, activeTab]);

    return (
        <ErrorBoundary
            fallback={(
                <div className="p-6">
                    <Alert
                        variant="error"
                        title="Se produjo un error en la página de Periodos"
                        message="Intenta recargar la página. Si persiste, contacta al soporte."
                        showLink={false}
                    />
                </div>
            )}
        >
            <>
                <PageMeta
                    title="Periodos"
                    description="Administración de periodos académicos"
                />
                <SkeletonLoader isLoading={pageLoading} skeleton={<BreadcrumbSkeleton />} id="periods-breadcrumb">
                    <PageBreadcrumb pageTitle="Períodos" />
                </SkeletonLoader>

                {loadingAction && <FullScreenLoader label="Procesando..." />}

                <div className="stagger-delay">
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <SkeletonLoader isLoading={pageLoading} skeleton={<TitleSkeleton />} id="periods-title">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Gestión de Periodos</h2>
                                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                                        MockAPI
                                    </span>
                                </div>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Administra los lapsos académicos y su estado actual.</p>
                            </SkeletonLoader>
                        </div>
                        {!pageLoading && (
                            <Button onClick={handleOpenCreateModal} className="sm:w-auto">
                                <PlusCircleIcon className="w-5 h-5" />
                                <span className="ml-2">Nuevo Periodo</span>
                            </Button>
                        )}
                    </div>

                    <div className="space-y-6">
                        <ComponentCard title={activeTab === 'active' ? "Períodos Activos" : "Períodos Inactivos"}>
                            {/* Tabs Minimalistas */}
                            <div className="mb-6 flex border-b border-gray-200 dark:border-white/5">
                                <button
                                    onClick={() => setActiveTab('active')}
                                    className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === 'active' ? "text-brand-500" : "text-gray-500 hover:text-gray-700"}`}
                                >
                                    Activos
                                    {activeTab === 'active' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500 animate-slideInLeft" />}
                                </button>
                                <button
                                    onClick={() => setActiveTab('inactive')}
                                    className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === 'inactive' ? "text-brand-500" : "text-gray-500 hover:text-gray-700"}`}
                                >
                                    Inactivos
                                    {activeTab === 'inactive' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500 animate-slideInLeft" />}
                                </button>
                            </div>

                            <div className="animate-fadeIn">
                                <SkeletonLoader isLoading={pageLoading || status === "loading"} skeleton={<TablePageSkeleton rows={5} />} id="periods-table">
                                    <PeriodTable
                                        key={activeTab}
                                        data={tableData}
                                        status={status}
                                        error={error}
                                        onEdit={handleOpenEditModal}
                                        onCulminate={handleCulminatePeriod}
                                        onView={handleOpenViewModal}
                                        onDelete={handleDelete}
                                        onRestore={handleRestore}
                                        loading={loadingAction}
                                    />
                                </SkeletonLoader>
                            </div>
                        </ComponentCard>
                    </div>
                </div>
                <PeriodModal
                    isOpen={isModalOpen}
                    onClose={handleCloseCreateEditModal}
                    onSave={handleSave}
                    periodo={editingPeriodo}
                    isLoading={loadingAction}
                    existingPeriods={periodos}
                />
                <PeriodViewModal
                    isOpen={isViewModalOpen}
                    onClose={handleCloseViewModal}
                    periodo={viewingPeriod}
                />
                <UnifiedDialog
                     isOpen={confirmation?.isOpen || false}
                     onClose={() => !loadingAction && setConfirmation(null)}
                     title={confirmation?.title || ""}
                     message={confirmation?.message || ""}
                     variant={confirmation?.variant || "info"}
                     confirmLabel={confirmation?.confirmText || "Confirmar"}
                     cancelLabel="Cancelar"
                     onConfirm={confirmation?.onConfirm}
                     isLoading={loadingAction}
                 />
            </>
        </ErrorBoundary>
    );
}
