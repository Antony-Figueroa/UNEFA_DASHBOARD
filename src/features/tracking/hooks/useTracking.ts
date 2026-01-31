/**
 * @file useTracking.ts
 * @description Hook personalizado para la gestión del estado de los seguimientos de estudiantes.
 * Centraliza el estado, llamadas a API y notificaciones relacionadas con el seguimiento.
 */

import { Tracking, CreateTrackingPayload, UpdateTrackingPayload } from "../types";
import * as trackingService from "../services/trackingService";
import { useToast } from "../../../context/toast";
import { useCrud } from "../../../hooks/useCrud";

/**
 * Hook personalizado para la gestión de seguimientos.
 * 
 * Proporciona funciones para cargar, crear, actualizar y eliminar registros de seguimiento,
 * manejando automáticamente los estados de carga y errores con notificaciones visuales.
 * 
 * @returns Objeto con el estado y las funciones de acción para seguimiento.
 */
export const useTracking = () => {
    const { addToast } = useToast();

    const {
        data: trackings,
        status,
        loadingAction,
        error,
        refresh: refreshTrackings,
        createItem: baseAddTracking,
        updateItem: baseEditTracking,
        deleteItem: baseRemoveTracking,
        bulkRestore: baseRestoreTracking
    } = useCrud<Tracking, CreateTrackingPayload, UpdateTrackingPayload>(trackingService as any, {
        resourceName: "Seguimiento",
        idField: "trackingId",
    });

    /**
     * Registra un nuevo seguimiento y muestra una notificación de éxito.
     * 
     * @param trackingData - Datos del seguimiento a crear.
     */
    const addTracking = async (trackingData: CreateTrackingPayload) => {
        try {
            await baseAddTracking(trackingData, { silent: true });
            addToast({
                variant: "success",
                title: "Seguimiento Registrado",
                message: "El seguimiento ha sido guardado exitosamente."
            });
        } catch (e) {
            console.error("[useTracking] Error al añadir seguimiento:", e);
            const axiosError = e as any;
            addToast({ 
                variant: "error", 
                title: "Error de Registro", 
                message: axiosError.response?.data?.message || axiosError.message || "No se pudo registrar el seguimiento." 
            });
            throw e;
        }
    };

    /**
     * Actualiza un seguimiento existente y muestra una notificación de éxito.
     * 
     * @param trackingData - Datos actualizados del seguimiento.
     */
    const editTracking = async (trackingData: UpdateTrackingPayload) => {
        try {
            await baseEditTracking(trackingData, { silent: true });
            addToast({
                variant: "success",
                title: "Seguimiento Actualizado",
                message: "Los cambios en el seguimiento han sido guardados exitosamente."
            });
        } catch (e) {
            console.error("[useTracking] Error al editar seguimiento:", e);
            const axiosError = e as any;
            addToast({ 
                variant: "error", 
                title: "Error de Actualización", 
                message: axiosError.response?.data?.message || axiosError.message || "No se pudo actualizar el seguimiento." 
            });
            throw e;
        }
    };

    /**
     * Elimina un registro de seguimiento y muestra una notificación de advertencia.
     * 
     * @param id - Identificador único del seguimiento a eliminar.
     */
    const removeTracking = async (id: string) => {
        try {
            await baseRemoveTracking(id, { silent: true });
            addToast({
                variant: "warning",
                title: "Seguimiento Eliminado",
                message: "El seguimiento ha sido eliminado exitosamente."
            });
        } catch (e) {
            console.error("[useTracking] Error al eliminar seguimiento:", e);
            addToast({ 
                variant: "error", 
                title: "Error de Eliminación", 
                message: "No se pudo eliminar el seguimiento." 
            });
            throw e;
        }
    };

    /**
     * Restaura un registro de seguimiento eliminado y muestra una notificación de éxito.
     * 
     * @param id - Identificador único del seguimiento a restaurar.
     */
    const restoreTracking = async (id: string) => {
        try {
            // baseRestoreTracking espera un array de IDs en useCrud
            await baseRestoreTracking([id], { silent: true });
            addToast({
                variant: "success",
                title: "Seguimiento Restaurado",
                message: "El seguimiento ha sido restaurado exitosamente."
            });
        } catch (e) {
            console.error("[useTracking] Error al restaurar seguimiento:", e);
            addToast({ 
                variant: "error", 
                title: "Error de Restauración", 
                message: "No se pudo restaurar el seguimiento." 
            });
            throw e;
        }
    };

    return {
        trackings,
        status,
        loadingAction,
        error,
        addTracking,
        editTracking,
        removeTracking,
        restoreTracking,
        refreshTrackings
    };
};
