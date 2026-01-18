/**
 * @file Tracking.tsx
 * @description Página para la gestión de seguimientos de estudiantes.
 */

import { useState, useMemo, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import TrackingTable from "../../features/tracking/components/TrackingTable";
import { PlusCircleIcon } from "../../icons/actions";
import TrackingModal from "../../features/tracking/components/TrackingModal";
import Alert from "../../components/ui/alert/Alert";
import UnifiedDialog from "../../components/ui/dialog/UnifiedDialog";
import Button from "../../components/ui/button/Button";
import { FullScreenLoader } from "../../components/ui/loader";
import { SkeletonLoader, TitleSkeleton, BreadcrumbSkeleton, TablePageSkeleton } from "../../components/ui/skeleton";
import { useTracking } from "../../features/tracking/hooks/useTracking";
import { useLists } from "../../features/lists/hooks/useLists";
import { Tracking, TrackingRowData } from "../../features/tracking/types";
import ErrorBoundary from "../../components/common/ErrorBoundary";

const TRANSFER_OPTIONS = [
    { value: 'false', label: 'No' },
    { value: 'true', label: 'Sí' },
];

export default function TrackingPage() {
    const [pageLoading, setPageLoading] = useState(true);
    const { fetchMultipleLists } = useLists();
    const [lists, setLists] = useState<Record<string, { value: string; label: string }[]>>({});

    // Cargar opciones dinámicas
    useEffect(() => {
        const loadOptions = async () => {
            try {
                const data = await fetchMultipleLists(['Traslado']);
                if (data['Traslado']) {
                    setLists({
                        'Traslado': data['Traslado'].map(v => ({
                            value: v.name.toLowerCase(),
                            label: v.name.charAt(0).toUpperCase() + v.name.slice(1).toLowerCase()
                        }))
                    });
                }
            } catch (error) {
                console.error("Error loading list options for TrackingPage:", error);
            }
        };
        loadOptions();
    }, [fetchMultipleLists]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setPageLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const {
        trackings,
        status,
        loadingAction,
        error,
        addTracking,
        editTracking,
        removeTracking,
    } = useTracking();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTracking, setEditingTracking] = useState<Tracking | null>(null);
    const [confirmation, setConfirmation] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant: 'info' | 'error' | 'warning' | 'success';
    } | null>(null);
    const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');

    const handleOpenCreateModal = () => {
        setEditingTracking(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (trackingRow: TrackingRowData) => {
        const original = trackings.find(t => t.trackingId === trackingRow.trackingId);
        if (!original) return;
        setEditingTracking(original);
        setIsModalOpen(true);
    };

    const handleOpenViewModal = (trackingRow: TrackingRowData) => {
        const original = trackings.find(t => t.trackingId === trackingRow.trackingId);
        if (!original) return;
        setEditingTracking(original);
        setIsModalOpen(true);
    };

    const handleSave = async (trackingData: Omit<Tracking, "trackingId" | "creationDate"> | Tracking) => {
        const isEditing = 'trackingId' in trackingData;
        
        try {
            if (isEditing) {
                await editTracking(trackingData as Tracking);
            } else {
                await addTracking(trackingData);
            }
            setIsModalOpen(false);
            setEditingTracking(null);
        } catch {
            // Error handled in hook
        }
    };

    const handleDelete = (id: string) => {
        const tracking = trackings.find(t => t.trackingId === id);
        if (!tracking) return;

        setConfirmation({
            isOpen: true,
            title: 'Confirmar Inactivación',
            message: `¿Estás seguro de que deseas inactivar el seguimiento de "${tracking.studentName}"?`,
            variant: 'error',
            onConfirm: async () => {
                await removeTracking(id);
                setConfirmation(null);
            }
        });
    };

    const handleRestore = (trackingRow: TrackingRowData) => {
        const original = trackings.find(t => t.trackingId === trackingRow.trackingId);
        if (!original) return;

        setConfirmation({
            isOpen: true,
            title: 'Confirmar Restauración',
            message: `¿Estás seguro de que deseas restaurar el seguimiento de "${original.studentName}"?`,
            variant: 'success',
            onConfirm: async () => {
                await editTracking({ ...original, status: true });
                setConfirmation(null);
            }
        });
    };

    const tableData = useMemo(() => trackings
        .filter(t => t.status === (activeTab === 'active'))
        .map(t => ({
            ...t,
            creationDate: t.creationDate.toLocaleDateString(),
        })), [trackings, activeTab]);

    return (
        <ErrorBoundary
            fallback={(
                <div className="p-6">
                    <Alert
                        variant="error"
                        title="Se produjo un error en la página de Seguimiento"
                        message="Intenta recargar la página."
                        showLink={false}
                    />
                </div>
            )}
        >
            <>
                <PageMeta
                    title="Seguimiento de Estudiantes"
                    description="Administración de seguimientos y visitas"
                />
                <SkeletonLoader isLoading={pageLoading} skeleton={<BreadcrumbSkeleton />}>
                    <PageBreadcrumb pageTitle="Seguimiento" />
                </SkeletonLoader>

                {loadingAction && <FullScreenLoader label="Procesando..." />}

                <div className="stagger-delay">
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <SkeletonLoader isLoading={pageLoading} skeleton={<TitleSkeleton />}>
                                <h2 className="text-2xl font-bold text-text-primary dark:text-white/90">Gestión de Seguimiento</h2>
                                <p className="mt-1 text-sm text-text-secondary dark:text-text-tertiary">Administra el seguimiento académico y los informes de traslado.</p>
                            </SkeletonLoader>
                        </div>
                        {!pageLoading && (
                            <Button onClick={handleOpenCreateModal} className="sm:w-auto">
                                <PlusCircleIcon className="w-5 h-5" />
                                <span className="ml-2">Nuevo Seguimiento</span>
                            </Button>
                        )}
                    </div>

                    <div className="space-y-6">
                        <ComponentCard title={activeTab === 'active' ? "Seguimientos Activos" : "Seguimientos Inactivos"}>
                            <div className="mb-6 flex border-b border-border-light dark:border-white/5">
                                <button
                                    onClick={() => setActiveTab('active')}
                                    className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === 'active' ? "text-brand-500" : "text-text-secondary hover:text-text-primary"}`}
                                >
                                    Activos
                                    {activeTab === 'active' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500" />}
                                </button>
                                <button
                                    onClick={() => setActiveTab('inactive')}
                                    className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === 'inactive' ? "text-brand-500" : "text-text-secondary hover:text-text-primary"}`}
                                >
                                    Inactivos
                                    {activeTab === 'inactive' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500" />}
                                </button>
                            </div>

                            <div className="animate-fadeIn">
                                <SkeletonLoader isLoading={pageLoading || status === "loading"} skeleton={<TablePageSkeleton rows={5} />}>
                                    <TrackingTable
                                        data={tableData}
                                        status={status}
                                        error={error}
                                        onEdit={handleOpenEditModal}
                                        onView={handleOpenViewModal}
                                        onDelete={handleDelete}
                                        onRestore={handleRestore}
                                        transferOptions={lists['Traslado'] || TRANSFER_OPTIONS}
                                    />
                                </SkeletonLoader>
                            </div>
                        </ComponentCard>
                    </div>
                </div>

                <TrackingModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    tracking={editingTracking}
                    isLoading={loadingAction}
                />

                <UnifiedDialog
                    isOpen={confirmation?.isOpen || false}
                    onClose={() => setConfirmation(null)}
                    title={confirmation?.title || ""}
                    message={confirmation?.message || ""}
                    variant={confirmation?.variant || "info"}
                    confirmLabel="Confirmar"
                    cancelLabel="Cancelar"
                    onConfirm={confirmation?.onConfirm}
                    isLoading={loadingAction}
                />
            </>
        </ErrorBoundary>
    );
}
