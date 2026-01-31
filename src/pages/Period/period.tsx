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
import CustomSelect from "../../components/form/CustomSelect";
import { PlusCircleIcon } from "../../icons/actions";
import { DownloadIcon } from "../../icons";
import PeriodModal from "../../features/periods/components/PeriodModal";
import Alert from "../../components/ui/alert/Alert";
import UnifiedDialog from "../../components/ui/dialog/UnifiedDialog";
import { DialogVariant } from "../../components/ui/dialog/DialogConfig";
import Button from "../../components/ui/button/Button";
import { FullScreenLoader } from "../../components/ui/loader";
import { SkeletonLoader, TitleSkeleton, BreadcrumbSkeleton, TablePageSkeleton } from "../../components/ui/skeleton";
import { usePeriods } from "../../features/periods/hooks/usePeriods";
import PeriodViewModal from "../../features/periods/components/PeriodViewModal";
import { PDFPreviewModal } from "../../components/ui/pdf/PDFPreviewModal";
import PeriodoPDF from "../../components/ui/pdf/templates/PeriodoPDF";
import { Periodo, PeriodoRowData, CreatePeriodPayload, UpdatePeriodPayload } from "../../features/periods/types";
import ErrorBoundary from "../../components/common/ErrorBoundary";

/**
 * Información para los diálogos de confirmación.
 */
type ConfirmationInfo = {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText: string;
    variant: DialogVariant;
};

/**
 * Página principal de gestión de Periodos Académicos.
 * 
 * Esta página orquestra la visualización de la lista de periodos (activos e inactivos),
 * la creación, edición, culminación, activación y eliminación de los mismos.
 * Utiliza el hook `usePeriods` para la lógica de negocio y comunicación con la API.
 */
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
    const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
    const [pdfSearchTerm, setPdfSearchTerm] = useState("");
    const [pdfStatusFilter, setPdfStatusFilter] = useState<string>("");
    const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');

    // Opciones para el filtro de estado en el PDF
    const statusOptions = useMemo(() => [
        { value: "", label: "Todos los Estados" },
        { value: "1", label: "Pendiente" },
        { value: "2", label: "En Curso" },
        { value: "3", label: "Culminado" },
    ], []);

    /**
     * Filtra los datos para el reporte PDF según el término de búsqueda y estatus.
     */
    const pdfFilteredData = useMemo(() => {
        const search = pdfSearchTerm.trim().toLowerCase();
        return (Array.isArray(periodos) ? periodos : [])
            .filter(p => p.status === true)
            .filter(p => {
                const matchesSearch = !search || 
                    p.code.toLowerCase().includes(search) || 
                    p.description.toLowerCase().includes(search);
                
                const matchesStatus = pdfStatusFilter === "" || 
                    p.periodStatus.toString() === pdfStatusFilter;
                
                return matchesSearch && matchesStatus;
            });
    }, [periodos, pdfSearchTerm, pdfStatusFilter]);

    // --- Manejadores de Eventos para Modales ---
    
    /**
     * Abre el modal para crear un nuevo periodo.
     */
    const handleOpenCreateModal = () => {
        setEditingPeriodo(null);
        setIsModalOpen(true);
    };

    /**
     * Abre el modal para editar un periodo existente.
     * 
     * @param periodoRow - Datos de la fila seleccionada.
     */
    const handleOpenEditModal = (periodoRow: PeriodoRowData) => {
        const originalPeriodo = periodos.find(p => p.periodId === periodoRow.periodId);
        if (!originalPeriodo) {
            console.error("[PeriodPage] No se encontró el periodo original para editar:", periodoRow.periodId);
            return;
        }
        setEditingPeriodo(originalPeriodo);
        setIsModalOpen(true);
    };

    /**
     * Cierra el modal de creación/edición.
     */
    const handleCloseCreateEditModal = () => {
        setEditingPeriodo(null);
        setIsModalOpen(false);
    };

    /**
     * Abre el modal de visualización de detalles.
     * 
     * @param periodoRow - Datos de la fila seleccionada.
     */
    const handleOpenViewModal = (periodoRow: PeriodoRowData) => {
        const originalPeriodo = periodos.find(p => p.periodId === periodoRow.periodId);
        if (!originalPeriodo) {
            console.error("[PeriodPage] No se encontró el periodo original para visualizar:", periodoRow.periodId);
            return;
        }
        setViewingPeriod(originalPeriodo);
        setIsViewModalOpen(true);
    };

    /**
     * Cierra el modal de visualización.
     */
    const handleCloseViewModal = () => {
        setIsViewModalOpen(false);
    };

    // --- Lógica de Negocio ---

    /**
     * Maneja el guardado (creación o actualización) de un periodo con confirmación previa.
     * 
     * @param payload - Datos del periodo (CreatePeriodPayload o UpdatePeriodPayload).
     */
    const handleSave = (payload: CreatePeriodPayload | UpdatePeriodPayload) => {
        const isEditing = 'periodId' in payload;
        setConfirmation({
            isOpen: true,
            title: isEditing ? 'Confirmar Modificación' : 'Confirmar Registro',
            message: `¿Estás seguro de que deseas ${isEditing ? 'guardar los cambios en' : 'registrar'} este periodo?`,
            onConfirm: async () => {
                try {
                    if (isEditing) {
                        await editPeriod(payload as UpdatePeriodPayload);
                    } else {
                        await addPeriod(payload as CreatePeriodPayload);
                    }
                    handleCloseCreateEditModal();
                    setConfirmation(null);
                } catch (e) {
                    console.error("[PeriodPage] Error al guardar periodo:", e);
                }
            },
            confirmText: isEditing ? 'Guardar' : 'Registrar',
            variant: 'info'
        });
    };

    /**
     * Maneja la culminación de un periodo académico.
     * 
     * @param periodoToCulminate - Datos de la fila del periodo a culminar.
     */
    const handleCulminatePeriod = async (periodoToCulminate: PeriodoRowData) => {
        setConfirmation({
            isOpen: true,
            title: 'Confirmar Culminación',
            message: `¿Estás seguro de que deseas culminar el periodo "${periodoToCulminate.description}"? Los periodos culminados no se pueden editar.`,
            onConfirm: async () => {
                try {
                    const originalPeriodo = periodos.find(p => p.periodId === periodoToCulminate.periodId);
                    if (originalPeriodo) {
                        await editPeriod({ ...originalPeriodo, periodStatus: 3 });
                    }
                } catch (e) {
                    console.error("[PeriodPage] Error al culminar periodo:", e);
                } finally {
                    setConfirmation(null);
                }
            },
            confirmText: 'Culminar',
            variant: 'warning'
        });
    };

    /**
     * Maneja la activación de un periodo académico (cambio a "En Curso").
     * 
     * @param periodoToActivate - Datos de la fila del periodo a activar.
     */
    const handleActivatePeriod = async (periodoToActivate: PeriodoRowData) => {
        setConfirmation({
            isOpen: true,
            title: 'Confirmar Activación',
            message: `¿Estás seguro de que deseas activar el periodo "${periodoToActivate.description}"? Esto lo pondrá "En Curso" y permitirá registrar actividades.`,
            onConfirm: async () => {
                try {
                    const originalPeriodo = periodos.find(p => p.periodId === periodoToActivate.periodId);
                    if (originalPeriodo) {
                        await editPeriod({ ...originalPeriodo, periodStatus: 2 });
                    }
                } catch (e) {
                    console.error("[PeriodPage] Error al activar periodo:", e);
                } finally {
                    setConfirmation(null);
                }
            },
            confirmText: 'Activar',
            variant: 'success'
        });
    };

    /**
     * Maneja la restauración de un periodo inactivo/eliminado.
     * 
     * @param periodoRow - Datos de la fila del periodo a restaurar.
     */
    const handleRestore = async (periodoRow: PeriodoRowData) => {
        setConfirmation({
            isOpen: true,
            title: 'Confirmar Restauración',
            message: `¿Estás seguro de que deseas restaurar el periodo "${periodoRow.description}"?`,
            onConfirm: async () => {
                try {
                    const originalPeriodo = periodos.find(p => p.periodId === periodoRow.periodId);
                    if (originalPeriodo) {
                        await editPeriod({ ...originalPeriodo, status: true });
                    }
                } catch (e) {
                    console.error("[PeriodPage] Error al restaurar periodo:", e);
                } finally {
                    setConfirmation(null);
                }
            },
            confirmText: 'Restaurar',
            variant: 'success'
        });
    };

    /**
     * Maneja la desactivación (eliminación lógica) de un periodo.
     * 
     * @param periodoRow - Datos de la fila del periodo a desactivar.
     */
    const handleDelete = (periodoRow: PeriodoRowData) => {
        const originalPeriodo = periodos.find(p => p.periodId === periodoRow.periodId);
        if (!originalPeriodo) {
            console.error("[PeriodPage] No se encontró el periodo original para eliminar:", periodoRow.periodId);
            return;
        }

        setConfirmation({
            isOpen: true,
            title: 'Confirmar Envío a Inactivos',
            message: `¿Estás seguro de que deseas enviar el período "${originalPeriodo.description}" a Inactivos?`,
            onConfirm: async () => {
                try {
                    await removePeriod(originalPeriodo);
                } catch (e) {
                    console.error("[PeriodPage] Error al eliminar periodo:", e);
                } finally {
                    setConfirmation(null);
                }
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
                                    <h2 className="text-2xl font-bold text-text-primary dark:text-white/90">Gestión de Periodos</h2>
                                </div>
                                <p className="mt-1 text-sm text-text-secondary dark:text-text-tertiary">Administra los lapsos académicos y su estado actual.</p>
                            </SkeletonLoader>
                        </div>
                        {!pageLoading && (
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsPDFModalOpen(true)}
                                    className="sm:w-auto"
                                >
                                    <DownloadIcon className="w-5 h-5" />
                                    <span className="ml-2">Reporte</span>
                                </Button>
                                <Button onClick={handleOpenCreateModal} className="sm:w-auto">
                                    <PlusCircleIcon className="w-5 h-5" />
                                    <span className="ml-2">Nuevo Período</span>
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <ComponentCard title={activeTab === 'active' ? "Períodos Activos" : "Períodos Inactivos"}>
                            {/* Tabs Minimalistas */}
                            <div className="mb-6 flex border-b border-border-light dark:border-white/5">
                                <button
                                    onClick={() => setActiveTab('active')}
                                    className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === 'active' ? "text-brand-500" : "text-text-secondary hover:text-text-primary"}`}
                                >
                                    Activos
                                    {activeTab === 'active' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500 animate-slideInLeft" />}
                                </button>
                                <button
                                    onClick={() => setActiveTab('inactive')}
                                    className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === 'inactive' ? "text-brand-500" : "text-text-secondary hover:text-text-primary"}`}
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
                                        onActivate={handleActivatePeriod}
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
                <PDFPreviewModal
                    isOpen={isPDFModalOpen}
                    onClose={() => setIsPDFModalOpen(false)}
                    title="Reporte de Periodos Académicos Activos"
                    data={pdfFilteredData}
                    template={(data) => <PeriodoPDF data={data} />}
                    fileName={`reporte-periodos-activos-${new Date().toISOString().split('T')[0]}.pdf`}
                    searchTerm={pdfSearchTerm}
                    onSearchChange={setPdfSearchTerm}
                    defaultInverted={true}
                    renderFilters={() => (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest pl-1">
                                    Filtrar por Estado
                                </label>
                                <CustomSelect
                                    options={statusOptions}
                                    value={pdfStatusFilter}
                                    onChange={setPdfStatusFilter}
                                    placeholder="Estado"
                                    className="w-full"
                                />
                            </div>
                        </div>
                    )}
                    columns={[
                        { header: "Código", accessor: "code" },
                        { header: "Descripción", accessor: "description" },
                        { header: "Fecha Inicio", accessor: (p) => new Date(p.startDate).toLocaleDateString("es-VE") },
                        { header: "Fecha Fin", accessor: (p) => new Date(p.endDate).toLocaleDateString("es-VE") },
                        { 
                            header: "Estado", 
                            accessor: (p) => {
                                const labels: Record<number, string> = { 1: "Pendiente", 2: "En Curso", 3: "Culminado" };
                                return labels[p.periodStatus] || "Desconocido";
                            }
                        },
                    ]}
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
