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
import UnifiedDialog from "../../components/ui/dialog/UnifiedDialog";
import Button from "../../components/ui/button/Button";
import { SkeletonLoader, TitleSkeleton, BreadcrumbSkeleton, TablePageSkeleton } from "../../components/ui/skeleton";
import { useTracking } from "../../features/tracking/hooks/useTracking";
import { useLists } from "../../features/lists/hooks/useLists";
import { useToast } from "../../context/toast";
import { Tracking, TrackingRowData, CreateTrackingPayload, UpdateTrackingPayload, TRANSFER_OPTIONS } from "../../features/tracking/types";
import ErrorBoundary from "../../components/common/ErrorBoundary";
import TrackingStatsChart from "../../features/tracking/components/TrackingStatsChart";
import { getTrackingStats, TrackingStats } from "../../features/tracking/services/trackingService";

/**
 * Página de Seguimiento (Tracking).
 * 
 * Esta página gestiona la visualización, creación, edición y eliminación de registros
 * de seguimiento de estudiantes. Incluye estadísticas visuales y una tabla interactiva.
 * 
 * @component
 */
export default function TrackingPage() {
    const [pageLoading, setPageLoading] = useState(true);
    const { fetchMultipleLists } = useLists();
    const { addToast } = useToast();
    const [lists, setLists] = useState<Record<string, { value: string; label: string }[]>>({});
    const [stats, setStats] = useState<TrackingStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);

    const {
        trackings,
        status,
        loadingAction,
        error,
        addTracking,
        editTracking,
        removeTracking,
        restoreTracking
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

    /**
     * Carga las estadísticas de seguimiento desde el servidor.
     * 
     * @param silent - Si es true, evita mostrar el estado de carga inicial.
     */
    const loadStats = async (silent = false) => {
        try {
            if (!silent) setStatsLoading(true);
            const data = await getTrackingStats();
            setStats(data);
        } catch (error: unknown) {
            console.error("[TrackingPage] Error al cargar estadísticas:", error);
            const errorMessage = error instanceof Error 
                               ? error.message 
                               : "Error al cargar las estadísticas de seguimiento";
            addToast({
                variant: "error",
                title: "Error de Estadísticas",
                message: errorMessage
            });
        } finally {
            if (!silent) setStatsLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
        
        // Polling para mantener las estadísticas actualizadas cada 30 segundos
        const interval = setInterval(() => {
            loadStats(true);
        }, 30000);
        
        return () => clearInterval(interval);
    }, []);

    // Carga de opciones dinámicas para filtros y formularios
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
                console.error("[TrackingPage] Error al cargar listas dinámicas:", error);
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

    /**
     * Procesa el guardado de un registro (nuevo o existente).
     * 
     * @param trackingData - Datos provenientes del modal de seguimiento.
     */
    const handleSave = async (trackingData: CreateTrackingPayload | UpdateTrackingPayload) => {
        try {
            if ('trackingId' in trackingData) {
                await editTracking(trackingData as UpdateTrackingPayload);
            } else {
                await addTracking(trackingData as CreateTrackingPayload);
            }
            setIsModalOpen(false);
            setEditingTracking(null);
            // Refrescar estadísticas para reflejar el cambio
            loadStats(true);
        } catch (err) {
            console.error("[TrackingPage] Error al procesar el guardado:", err);
            // La notificación de error ya la maneja useTracking, 
            // pero cerramos el modal si es un error de negocio esperado (opcional)
        }
    };

    /**
     * Maneja la inactivación de un registro.
     * 
     * @param item - Datos de la fila de seguimiento a inactivar.
     */
    const handleDelete = (item: TrackingRowData) => {
        if (!item.trackingId) return;
        
        setConfirmation({
            isOpen: true,
            title: 'Confirmar Inactivación',
            message: `¿Estás seguro de que deseas inactivar el seguimiento de "${item.studentName}"?`,
            variant: 'error',
            onConfirm: async () => {
                try {
                    await removeTracking(item.trackingId);
                    loadStats(true);
                } catch (error) {
                    console.error("[TrackingPage] Error al inactivar:", error);
                } finally {
                    setConfirmation(null);
                }
            }
        });
    };

    /**
     * Maneja la restauración de un registro previamente inactivado.
     * 
     * @param trackingRow - Datos de la fila de seguimiento a restaurar.
     */
    const handleRestore = (trackingRow: TrackingRowData) => {
        if (!trackingRow.trackingId) return;

        setConfirmation({
            isOpen: true,
            title: 'Confirmar Restauración',
            message: `¿Estás seguro de que deseas restaurar el seguimiento de "${trackingRow.studentName}"?`,
            variant: 'success',
            onConfirm: async () => {
                try {
                    await restoreTracking(trackingRow.trackingId);
                    loadStats(true);
                } finally {
                    setConfirmation(null);
                }
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
                <div className="p-6 rounded-xl border border-error-200 bg-error-50 dark:bg-error-500/10 dark:border-error-500/20">
                    <div className="flex flex-col items-center justify-center text-center p-8">
                        <div className="w-12 h-12 rounded-full bg-error-100 dark:bg-error-500/20 flex items-center justify-center mb-4">
                            <span className="text-error-600 dark:text-error-400 text-2xl">!</span>
                        </div>
                        <h3 className="text-lg font-semibold text-error-900 dark:text-error-400 mb-2">
                            Se produjo un error en la página de Seguimiento
                        </h3>
                        <p className="text-error-700 dark:text-error-500/80">
                            Intenta recargar la página para solucionar el problema.
                        </p>
                    </div>
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
                        <TrackingStatsChart stats={stats} loading={statsLoading} />
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