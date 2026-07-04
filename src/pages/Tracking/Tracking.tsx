/**
 * @file Tracking.tsx
 * @description Página para la gestión de seguimientos de estudiantes.
 */

import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router";
import { useTabs } from "../../context/tab";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import TrackingTable from "../../features/tracking/components/TrackingTable";
import TrackingModal from "../../features/tracking/components/TrackingModal";
import TrackingDetailModal from "../../features/tracking/components/TrackingDetailModal";
import UnifiedDialog from "../../components/ui/dialog/UnifiedDialog";
import { CONFIRM_MESSAGES, DialogVariant } from "../../components/ui/dialog/DialogConfig";
import { SkeletonLoader, TitleSkeleton, BreadcrumbSkeleton, TablePageSkeleton } from "../../components/ui/skeleton";
import { useTracking } from "../../features/tracking/hooks/useTracking";
import { useLists } from "../../features/lists/hooks/useLists";
import { Tracking, TrackingRowData, UpdateTrackingPayload, TRANSFER_OPTIONS } from "../../features/tracking/types";
import ErrorBoundary from "../../components/common/ErrorBoundary";
import TrackingStatsChart from "../../features/tracking/components/TrackingStatsChart";
import { getTrackingStats, TrackingStats } from "../../features/tracking/services/trackingService";
import { toTitleCase } from "../../utils/textFormat";

/**
 * Página de Seguimiento (Tracking).
 * 
 * Esta página gestiona la visualización, edición y eliminación de registros
 * de seguimiento de estudiantes. Incluye estadísticas visuales y una tabla interactiva.
 * 
 * @component
 */
export default function TrackingPage() {
    const { fetchMultipleLists } = useLists();
    const navigate = useNavigate();
    const { openTab } = useTabs();
    const [lists, setLists] = useState<Record<string, { value: string; label: string }[]>>({});
    const [stats, setStats] = useState<TrackingStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);

    const {
        trackings,
        status,
        loadingAction,
        error,
        editTracking,
        removeTracking,
        restoreTracking
    } = useTracking();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [editingTracking, setEditingTracking] = useState<Tracking | null>(null);
    const [viewingTracking, setViewingTracking] = useState<Tracking | null>(null);
    const [confirmation, setConfirmation] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant: 'info' | 'error' | 'warning' | 'success';
    } | null>(null);

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
                            label: toTitleCase(v.name)
                        }))
                    });
                }
            } catch (error) {
                console.error("[TrackingPage] Error al cargar listas dinámicas:", error);
            }
        };
        loadOptions();
    }, [fetchMultipleLists]);

    const handleOpenEditModal = (trackingRow: TrackingRowData) => {
        const original = trackings.find(t => t.trackingId === trackingRow.trackingId);
        if (!original) return;
        setEditingTracking(original);
        setIsModalOpen(true);
    };

    const handleOpenViewModal = (trackingRow: TrackingRowData) => {
        const original = trackings.find(t => t.trackingId === trackingRow.trackingId);
        if (!original) return;
        setViewingTracking(original);
        setIsDetailModalOpen(true);
    };

    const handleDetailEdit = (tracking: Tracking) => {
        setEditingTracking(tracking);
        setIsModalOpen(true);
    };

    /**
     * Procesa la actualización de un registro existente.
     * 
     * @param trackingData - Datos provenientes del modal de seguimiento.
     */
    const handleUpdate = async (trackingData: UpdateTrackingPayload) => {
        try {
            await editTracking(trackingData);
            setIsModalOpen(false);
            setEditingTracking(null);
            // Refrescar estadísticas para reflejar el cambio
            loadStats(true);
        } catch (err) {
            console.error("[TrackingPage] Error al procesar la actualización:", err);
        }
    };

    /**
     * Maneja la inactivación de un registro.
     * 
     * @param item - Datos de la fila de seguimiento a inactivar.
     */
    const handleDelete = (item: TrackingRowData) => {
        if (!item.trackingId) return;
        const config = CONFIRM_MESSAGES.deactivate('el seguimiento');
        
        setConfirmation({
            isOpen: true,
            title: config.title,
            message: `¿Estás seguro de que deseas desactivar el seguimiento de "${item.studentName}"?`,
            variant: config.variant as DialogVariant,
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
        const config = CONFIRM_MESSAGES.activate('el seguimiento');

        setConfirmation({
            isOpen: true,
            title: config.title,
            message: `¿Estás seguro de que deseas restaurar el seguimiento de "${trackingRow.studentName}"?`,
            variant: config.variant as DialogVariant,
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
        .map(t => ({
            ...t,
            creationDate: t.creationDate.toLocaleDateString(),
        })), [trackings]);

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
                <SkeletonLoader isLoading={status === "loading"} skeleton={<BreadcrumbSkeleton />}>
                    <PageBreadcrumb pageTitle="Seguimiento" />
                </SkeletonLoader>

                <div className="stagger-delay">
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <SkeletonLoader isLoading={status === "loading"} skeleton={<TitleSkeleton />}>
                                <h2 className="text-2xl font-bold text-text-primary dark:text-white/90">Gestión de Seguimiento</h2>
                                <p className="mt-1 text-sm text-text-secondary dark:text-text-tertiary">Administra el seguimiento académico y los informes de traslado.</p>
                            </SkeletonLoader>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <TrackingStatsChart stats={stats} loading={statsLoading} />
                        <ComponentCard title="Seguimientos">
                            <div className="animate-fadeIn">
                                <SkeletonLoader isLoading={status === "loading"} skeleton={<TablePageSkeleton rows={5} />}>
                                    <TrackingTable
                                        data={tableData}
                                        status={status}
                                        error={error}
                                        onEdit={handleOpenEditModal}
                                        onView={handleOpenViewModal}
                                        onDelete={handleDelete}
                                        onRestore={handleRestore}
                                        onVisitRegistration={(item) => openTab(`/visit-registration/${item.trackingId}`, `${item.studentName}`)}
                                        onActivityLogs={(item) => openTab(`/activity-logs/${item.trackingId}`, `Actividades #${item.trackingId}`)}
                                        transferOptions={lists['Traslado'] || TRANSFER_OPTIONS}
                                    />
                                </SkeletonLoader>
                            </div>
                        </ComponentCard>
                    </div>
                </div>

                <TrackingDetailModal
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    onEdit={handleDetailEdit}
                    tracking={viewingTracking}
                />

                <TrackingModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleUpdate}
                    tracking={editingTracking}
                    isLoading={loadingAction}
                />

                <UnifiedDialog
                    isOpen={confirmation?.isOpen || false}
                    onClose={() => setConfirmation(null)}
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