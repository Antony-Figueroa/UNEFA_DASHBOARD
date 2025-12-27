/**
 * @file Página para la gestión de Periodos Académicos.
 * @description Este componente actúa como el contenedor principal, orquestando
 * la visualización de datos, modales y alertas. La lógica de estado y las
 * interacciones con la API se abstraen en el hook `usePeriods`.
 */

import { useState, useMemo } from "react";
import { useTheme } from "../../context/ThemeContext";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import PeriodTable from "../../features/periods/components/PeriodTable";
import { PlusCircleIcon, XIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from "../../icons/actions";
import PeriodModal from "../../features/periods/components/PeriodModal";
import Alert from "../../components/ui/alert/Alert";
import { Modal } from "../../components/ui/modal";
import { usePeriods } from "../../features/periods/hooks/usePeriods";
import PeriodViewModal from "../../features/periods/components/PeriodViewModal";
import { Periodo, PeriodoRowData } from "../../features/periods/types";

type ConfirmationInfo = {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText: string;
    variant: 'success' | 'error' | 'warning' | 'info';
};

const confirmationStyles = {
    error: {
        iconBg: 'bg-red-100 dark:bg-red-900/30',
        icon: <XIcon className="h-6 w-6 text-red-600 dark:text-red-500" />,
        button: 'bg-red-600 hover:bg-red-700',
    },
    success: {
        iconBg: 'bg-green-100 dark:bg-green-900/30',
        icon: <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-500" />,
        button: 'bg-green-500 hover:bg-green-600',
    },
    warning: {
        iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
        icon: <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500 dark:text-yellow-400" />,
        button: 'bg-yellow-500 hover:bg-yellow-600',
    },
    info: {
        iconBg: 'bg-blue-100 dark:bg-blue-900/30',
        icon: <InformationCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-500" />,
        button: 'bg-blue-500 hover:bg-blue-600',
    }
};

export default function Period() {
    const { colorMode } = useTheme();
    // Hook personalizado que encapsula toda la lógica de negocio de los periodos.
    const {
        periodos,
        status,
        error,
        pageAlert,
        setPageAlert,
        addPeriod,
        editPeriod,
        removePeriod,
    } = usePeriods();

    // Estado para controlar la visibilidad y contenido de los modales.
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPeriodo, setEditingPeriodo] = useState<Periodo | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [periodoToDelete, setPeriodoToDelete] = useState<string | null>(null);
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
            title: isEditing ? 'Confirmar Modificación' : 'Confirmar Creación',
            message: `¿Estás seguro de que deseas ${isEditing ? 'guardar los cambios en' : 'crear'} este periodo?`,
            onConfirm: async () => {
                setIsSaving(true);
                try {
                    if (isEditing) {
                        await editPeriod(periodoData);
                    } else {
                        await addPeriod(periodoData);
                    }
                    handleCloseCreateEditModal();
                } catch (error) {
                    // El error ya se maneja en el hook
                } finally {
                    setIsSaving(false);
                    setConfirmation(null);
                }
            },
            confirmText: 'Confirmar',
            variant: 'info'
        });
    };

    const handleStartPeriod = async (periodoToStart: PeriodoRowData) => {
        // Validación 1: Solo puede haber un periodo "En Curso".
        const isAnyInProgress = periodos.some(p => p.periodStatus === 2 && p.periodId !== periodoToStart.periodId);
        if (isAnyInProgress) {
            setPageAlert({ variant: 'error', title: 'Operación no permitida', message: 'Ya existe otro periodo "En Curso". Finalícelo antes de iniciar uno nuevo.' });
            return;
        }

        // Validación 2: Todos los periodos anteriores deben estar culminados.
        const getLapsoValue = (l: string) => {
            const [y, t] = l.split('-');
            return parseInt(y) + (t === 'I' ? 0 : 0.5);
        };
        const valueToStart = getLapsoValue(periodoToStart.description);
        const hasUnfinishedPrevious = periodos.some(p => getLapsoValue(p.description) < valueToStart && p.periodStatus !== 3);
        if (hasUnfinishedPrevious) {
            setPageAlert({ variant: 'error', title: 'Operación no permitida', message: 'Para iniciar este periodo, todos los anteriores deben estar "Culminados".' });
            return;
        }

        setConfirmation({
            isOpen: true,
            title: 'Confirmar Inicio',
            message: `¿Estás seguro de que deseas iniciar el periodo "${periodoToStart.description}"? Esta acción no se puede deshacer.`,
            onConfirm: async () => {
                const originalPeriodo = periodos.find(p => p.periodId === periodoToStart.periodId);
                if (originalPeriodo) await editPeriod({ ...originalPeriodo, periodStatus: 2 });
                setConfirmation(null);
            },
            confirmText: 'Iniciar',
            variant: 'success'
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
            variant: 'info'
        });
    };

    const handleDelete = (id: string) => {
        const periodoObject = periodos.find(p => p.periodId === id);
        if (!periodoObject) return;

        setConfirmation({
            isOpen: true,
            title: 'Confirmar Eliminación',
            message: `¿Estás seguro de que deseas enviar el periodo "${periodoObject.description}" a la papelera?`,
            onConfirm: async () => {
                await removePeriod(periodoObject);
                setConfirmation(null);
            },
            confirmText: 'Eliminar',
            variant: 'error'
        });
    };

    // Memoizamos los datos formateados para la tabla para evitar recálculos innecesarios.
    const tableData = useMemo(() => periodos
        .filter(p => p.status === (activeTab === 'active')) // Filtra según la pestaña activa
        .map(p => {
            let progress = null;
            if (p.periodStatus === 2) { // "En Curso"
                const totalDuration = p.endDate.getTime() - p.startDate.getTime();
                const elapsed = new Date().getTime() - p.startDate.getTime();
                // Asegurarse de que el progreso esté entre 0 y 100
                progress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
            }
            return {
                ...p,
                startDate: p.startDate.toLocaleDateString(),
                endDate: p.endDate.toLocaleDateString(),
                progress: progress,
            };
        }), [periodos, activeTab]);

    return (
        <>
            <PageMeta
                title="Gestión de Periodos"
                description="Gestión de los periodos académicos"
            />
            <div className="flex items-center justify-between mb-6">
                <PageBreadcrumb pageTitle="Gestión de Periodos" />
                <button
                    onClick={handleOpenCreateModal}
                    className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
                >
                    <PlusCircleIcon className="w-5 h-5" /> Crear Periodo
                </button>
            </div>
            {pageAlert && (
                <div className="relative mb-6">
                    <Alert
                        variant={pageAlert.variant}
                        title={pageAlert.title}
                        message={pageAlert.message}
                        showLink={false}
                    />
                    <button
                        onClick={() => setPageAlert(null)}
                        className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
            )}
            <div className="space-y-6">
                <ComponentCard>
                    <div className="border-b border-gray-200 dark:border-gray-800">
                        <nav className="-mb-px flex space-x-2" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('active')}
                                className={`whitespace-nowrap border-b-2 py-4 px-3 text-sm font-medium transition-colors duration-200 ${activeTab === 'active'
                                    ? 'border-brand-500 text-brand-600'
                                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300 transition-colors duration-200'
                                    }`}
                            >
                                Activos
                            </button>
                            <button
                                onClick={() => setActiveTab('inactive')}
                                className={`whitespace-nowrap border-b-2 py-4 px-3 text-sm font-medium transition-colors duration-200 ${activeTab === 'inactive'
                                    ? 'border-brand-500 text-brand-600'
                                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300 transition-colors duration-200'
                                    }`}
                            >
                                Inactivos (Papelera)
                            </button>
                        </nav>
                    </div>
                    <div className="pt-6 animate-fadeIn">
                        <PeriodTable
                            key={activeTab} // Forzar re-render para la animación
                            data={tableData}
                            status={status}
                            error={error}
                            onEdit={handleOpenEditModal}
                            onStart={handleStartPeriod}
                            onCulminate={handleCulminatePeriod}
                            onView={handleOpenViewModal}
                            onDelete={handleDelete}
                            onRestore={handleRestore}
                        />
                    </div>
                </ComponentCard>
            </div>
            <PeriodModal
                isOpen={isModalOpen}
                onClose={handleCloseCreateEditModal}
                onSave={handleSave}
                periodo={editingPeriodo}
                isSaving={isSaving}
                existingPeriods={periodos}
            />
            <PeriodViewModal
                isOpen={isViewModalOpen}
                onClose={handleCloseViewModal}
                periodo={viewingPeriod}
            />
            {confirmation?.isOpen && (
                <Modal isOpen={confirmation.isOpen} onClose={() => setConfirmation(null)} className={`max-w-sm p-6 ${colorMode === 'dark' ? 'dark' : ''}`}>
                    <div className="text-center">
                        <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${confirmationStyles[confirmation.variant].iconBg}`}>
                            {confirmationStyles[confirmation.variant].icon}
                        </div>
                        <h3 className="mb-2 text-xl font-bold text-gray-800 dark:text-white">{confirmation.title}</h3>
                        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">{confirmation.message}</p>
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={() => setConfirmation(null)}
                                className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmation.onConfirm}
                                className={`flex w-full justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-white sm:w-auto ${confirmationStyles[confirmation.variant].button}`}
                            >
                                {confirmation.confirmText}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
}
