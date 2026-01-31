/**
 * @file Hook personalizado para la gestión del estado de los periodos.
 * @description Centraliza el estado, llamadas a API y lógica de negocio (CRUD, alertas).
 */

import { Periodo, CreatePeriodPayload, UpdatePeriodPayload } from "../types";
import * as periodService from "../services/periodService";
import { useToast } from "../../../context/toast";
import { ChangeComparison, RecordDetails } from "../../../components/ui/alert/AlertContextualContent";
import { useCrud } from "../../../hooks/useCrud";

/**
 * Etiquetas para la visualización de detalles en alertas y comparaciones.
 */
const PERIOD_LABELS: Record<string, string> = {
    description: "Descripción del Período",
    startDate: "Fecha de Inicio",
    endDate: "Fecha de Cierre",
    status: "Estado (Habilitado)",
    periodStatus: "Fase del Período",
};

/**
 * Hook personalizado para la gestión de periodos académicos.
 * 
 * Ahora utiliza el hook genérico useCrud para centralizar la gestión de estado,
 * carga, errores y notificaciones, manteniendo la lógica de auditoría visual.
 * 
 * @returns Un objeto con el estado de los periodos y funciones para manipularlos.
 */
export const usePeriods = () => {
    const { addToast } = useToast();

    const {
        data: periodos,
        status,
        loadingAction,
        error,
        refresh: refreshPeriods,
        createItem: baseAddPeriod,
        updateItem: baseEditPeriod,
        deleteItem: removePeriod,
        toggleItemStatus: baseToggleStatus,
        bulkDelete: bulkRemovePeriods,
        bulkRestore: bulkRestorePeriods
    } = useCrud<Periodo, CreatePeriodPayload, UpdatePeriodPayload>(periodService as any, {
        resourceName: "Período",
        idField: "periodId",
    });

    /**
     * Crea un nuevo periodo académico y muestra una notificación de éxito enriquecida.
     */
    const addPeriod = async (periodoData: CreatePeriodPayload) => {
        try {
            const newPeriod = await baseAddPeriod(periodoData, { silent: true });
            
            if (newPeriod) {
                addToast({
                    variant: "success",
                    title: "Período Registrado",
                    message: (
                        <>
                            <p>El período <strong>{newPeriod.description}</strong> ha sido registrado exitosamente.</p>
                            <RecordDetails data={newPeriod as unknown as Record<string, unknown>} labels={PERIOD_LABELS} />
                        </>
                    ),
                });
            }
            return newPeriod;
        } catch (e) {
            console.error("[usePeriods] Error al añadir periodo:", e);
            const axiosError = e as any;
            addToast({ 
                variant: "error", 
                title: "Error de Registro", 
                message: axiosError.response?.data?.message || axiosError.message || "No se pudo registrar el período académico."
            });
            throw e;
        }
    };

    /**
     * Actualiza un periodo académico existente y muestra una notificación con comparación de cambios.
     */
    const editPeriod = async (periodoData: UpdatePeriodPayload) => {
        try {
            const oldPeriod = periodos.find(p => p.periodId === periodoData.periodId);

            // Auditoría para cambios de estatus
            if (oldPeriod && oldPeriod.periodStatus !== periodoData.periodStatus) {
                console.log(`[Audit Log] Cambio de estatus detectado para periodo ${periodoData.description || oldPeriod.description}: ${oldPeriod.periodStatus} -> ${periodoData.periodStatus}`);
            }

            const updatedPeriod = await baseEditPeriod(periodoData, { silent: true });

            if (updatedPeriod) {
                // Personalización de títulos y mensajes según la acción (Culminar, Activar, Editar)
                let toastTitle = "Período Actualizado";
                let toastMessage = <p>Los cambios del período <strong>{updatedPeriod.description}</strong> han sido guardados exitosamente.</p>;

                if (oldPeriod && oldPeriod.periodStatus !== updatedPeriod.periodStatus) {
                    if (updatedPeriod.periodStatus === 3) {
                        toastTitle = "Período Culminado";
                        toastMessage = <p>El período <strong>{updatedPeriod.description}</strong> ha sido culminado exitosamente.</p>;
                    } else if (updatedPeriod.periodStatus === 2) {
                        toastTitle = "Período Activado";
                        toastMessage = <p>El período <strong>{updatedPeriod.description}</strong> ha sido puesto "En Curso" exitosamente.</p>;
                    }
                }

                addToast({
                    variant: "success",
                    title: toastTitle,
                    message: (
                        <>
                            {toastMessage}
                            {oldPeriod && <ChangeComparison oldData={oldPeriod as unknown as Record<string, unknown>} newData={updatedPeriod as unknown as Record<string, unknown>} labels={PERIOD_LABELS} />}
                        </>
                    ),
                });
            }
            return updatedPeriod;
        } catch (e) {
            console.error("[usePeriods] Error al actualizar periodo:", e);
            const axiosError = e as any;
            addToast({ 
                variant: "error", 
                title: "Error de Actualización", 
                message: axiosError.response?.data?.message || axiosError.message || "No se pudo actualizar el período académico."
            });
            throw e;
        }
    };

    /**
     * Cambia el estado (activo/inactivo) con actualización optimista.
     */
    const toggleStatus = async (period: Periodo) => {
         const newStatus = !period.status; 
         try {
            await baseToggleStatus(period.periodId, newStatus, { silent: true });

            addToast({
                variant: newStatus ? "success" : "warning",
                title: "Estado Actualizado",
                message: `El período ${period.description} ha sido ${newStatus ? 'activado' : 'inactivado'} exitosamente.`,
            });
        } catch (e) {
            console.error("[usePeriods] Error al cambiar estado:", e);
            addToast({
                variant: "error",
                title: "Error de Estado",
                message: "No se pudo cambiar el estado del período.",
            });
        }
    };

    return {
        periodos,
        status,
        loadingAction,
        error,
        refreshPeriods,
        addPeriod,
        editPeriod,
        removePeriod,
        toggleStatus,
        bulkRemovePeriods,
        bulkRestorePeriods,
    };
};

