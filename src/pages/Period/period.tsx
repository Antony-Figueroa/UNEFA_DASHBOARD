/**
 * @file Página para la gestión de Periodos Académicos.
 * @description Este componente actúa como el contenedor principal, orquestando
 * la visualización de datos, modales y alertas. La lógica de estado y las
 * interacciones con la API se abstraen en el hook `usePeriods`.
 */

import { useState, useMemo } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import PeriodTable from "../../features/periods/components/PeriodTable";
import { PlusCircleIcon, XIcon } from "../../icons/actions";
import PeriodModal from "../../features/periods/components/PeriodModal";
import Alert from "../../components/ui/alert/Alert";
import { Modal } from "../../components/ui/modal";
import { usePeriods } from "../../features/periods/hooks/usePeriods";
import { Periodo, PeriodoRowData } from "../../features/periods/types";

export default function Period() {
    // Hook personalizado que encapsula toda la lógica de negocio de los periodos.
    const {
        periodos,
        status,
        pageAlert,
        setPageAlert,
        addPeriod,
        editPeriod,
        removePeriod,
    } = usePeriods();

    // Estado para controlar la visibilidad y contenido de los modales.
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPeriodo, setEditingPeriodo] = useState<Periodo | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [periodoToDelete, setPeriodoToDelete] = useState<number | null>(null);

    // --- Manejadores de Eventos para Modales ---
    const handleOpenCreateModal = () => {
        setEditingPeriodo(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (periodoRow: PeriodoRowData) => {
        // Se busca el periodo original con objetos Date, ya que la tabla puede tener fechas formateadas como string.
        const originalPeriodo = periodos.find(p => p.id === periodoRow.id);
        // Si no se encuentra el periodo (no debería ocurrir), no se hace nada.
        if (!originalPeriodo) return;
        setEditingPeriodo(originalPeriodo);
        setIsModalOpen(true);
    };

    const handleCloseCreateEditModal = () => {
        setIsModalOpen(false);
        setEditingPeriodo(null);
    };

    // --- Lógica de Negocio ---
    const handleSave = async (periodoData: Omit<Periodo, 'id'> | Periodo) => {
        try {
            if ('id' in periodoData) {
                await editPeriod(periodoData);
            } else {
                await addPeriod(periodoData);
            }
        } catch (error) {
            // El error ya se maneja y muestra en la alerta desde el hook.
            // Se puede añadir lógica adicional aquí si es necesario.
        }
        handleCloseCreateEditModal();
    };

    const handleDelete = (id: number) => {
        setPeriodoToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (periodoToDelete === null) return;
        await removePeriod(periodoToDelete);
        setIsDeleteModalOpen(false);
        setPeriodoToDelete(null);
    };

    // Memoizamos los datos formateados para la tabla para evitar recálculos innecesarios.
    const tableData = useMemo(() => periodos.map(p => ({
        ...p,
        fechaInicio: p.fechaInicio.toLocaleDateString(),
        fechaFin: p.fechaFin.toLocaleDateString()
    })), [periodos]);

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
                <ComponentCard title="Periodos Académicos">
                    <PeriodTable
                        data={tableData}
                        status={status}
                        error={status === 'error' ? new Error("Error al cargar los datos. Por favor, recargue la página.") : null}
                        onEdit={handleOpenEditModal}
                        onDelete={handleDelete}
                    />
                </ComponentCard>
            </div>
            <PeriodModal
                isOpen={isModalOpen}
                onClose={handleCloseCreateEditModal}
                onSave={handleSave}
                periodo={editingPeriodo}
            />
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} className="max-w-sm p-6">
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                        <XIcon className="h-6 w-6 text-red-600 dark:text-red-500" />
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-gray-800 dark:text-white">Confirmar Eliminación</h3>
                    <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">¿Estás seguro de que deseas eliminar este periodo? Esta acción no se puede deshacer.</p>
                    <div className="flex justify-center gap-3">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/3 sm:w-auto"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="flex w-full justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 sm:w-auto"
                        >
                            Eliminar
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
