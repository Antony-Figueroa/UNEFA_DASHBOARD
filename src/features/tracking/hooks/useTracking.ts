/**
 * @file useTracking.ts
 * @description Hook personalizado para la gestión del estado de los seguimientos de estudiantes.
 * Centraliza el estado, llamadas a API y notificaciones relacionadas con el seguimiento.
 */

import { useState, useEffect, useCallback } from "react";
import { Tracking, CreateTrackingPayload, UpdateTrackingPayload } from "../types";
import * as trackingService from "../services/trackingService";
import { useToast } from "../../../context/toast";

/**
 * Estado de carga del hook.
 */
type Status = 'loading' | 'success' | 'error';

/**
 * Hook personalizado para la gestión de seguimientos.
 * 
 * Proporciona funciones para cargar, crear, actualizar y eliminar registros de seguimiento,
 * manejando automáticamente los estados de carga y errores con notificaciones visuales.
 * 
 * @returns Objeto con el estado y las funciones de acción para seguimiento.
 * 
 * @example
 * const { trackings, addTracking, editTracking, removeTracking } = useTracking();
 */
export const useTracking = () => {
    const [trackings, setTrackings] = useState<Tracking[]>([]);
    const [status, setStatus] = useState<Status>('loading');
    const [loadingAction, setLoadingAction] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const { addToast } = useToast();

    /**
     * Refresca la lista de seguimientos desde el servidor.
     */
    const refreshTrackings = useCallback(async () => {
        setStatus('loading');
        try {
            const data = await trackingService.getTrackings();
            setTrackings(data);
            setStatus('success');
        } catch (e) {
            console.error("[useTracking] Error al refrescar seguimientos:", e);
            setError(e instanceof Error ? e : new Error('Error al cargar seguimientos'));
            setStatus('error');
        }
    }, []);

    useEffect(() => {
        refreshTrackings();
    }, [refreshTrackings]);

    /**
     * Registra un nuevo seguimiento y muestra una notificación de éxito.
     * 
     * @param trackingData - Datos del seguimiento a crear.
     */
    const addTracking = async (trackingData: CreateTrackingPayload) => {
        setLoadingAction(true);
        try {
            await trackingService.createTracking(trackingData);
            await refreshTrackings();
            addToast({
                variant: "success",
                title: "Seguimiento Registrado",
                message: "El seguimiento ha sido guardado exitosamente."
            });
        } catch (e) {
            console.error("[useTracking] Error al añadir seguimiento:", e);
            const err = e instanceof Error ? e : new Error('Error al registrar seguimiento');
            addToast({ variant: "error", title: "Error", message: err.message });
            throw err;
        } finally {
            setLoadingAction(false);
        }
    };

    /**
     * Actualiza un seguimiento existente y muestra una notificación de éxito.
     * 
     * @param trackingData - Datos actualizados del seguimiento.
     */
    const editTracking = async (trackingData: UpdateTrackingPayload) => {
        setLoadingAction(true);
        try {
            await trackingService.updateTracking(trackingData);
            await refreshTrackings();
            addToast({
                variant: "success",
                title: "Seguimiento Actualizado",
                message: "Los cambios han sido guardados exitosamente."
            });
        } catch (e) {
            console.error("[useTracking] Error al editar seguimiento:", e);
            const err = e instanceof Error ? e : new Error('Error al actualizar seguimiento');
            addToast({ variant: "error", title: "Error", message: err.message });
            throw err;
        } finally {
            setLoadingAction(false);
        }
    };

    /**
     * Elimina un registro de seguimiento y muestra una notificación de advertencia.
     * 
     * @param id - Identificador único del seguimiento a eliminar.
     */
    const removeTracking = async (id: string) => {
        setLoadingAction(true);
        try {
            await trackingService.deleteTracking(id);
            await refreshTrackings();
            addToast({
                variant: "warning",
                title: "Seguimiento Eliminado",
                message: "El seguimiento ha sido eliminado."
            });
        } catch (e) {
            console.error("[useTracking] Error al eliminar seguimiento:", e);
            const err = e instanceof Error ? e : new Error('Error al eliminar seguimiento');
            addToast({ variant: "error", title: "Error", message: err.message });
            throw err;
        } finally {
            setLoadingAction(false);
        }
    };

    /**
     * Restaura un registro de seguimiento eliminado y muestra una notificación de éxito.
     * 
     * @param id - Identificador único del seguimiento a restaurar.
     */
    const restoreTracking = async (id: string) => {
        setLoadingAction(true);
        try {
            await trackingService.restoreTracking(id);
            await refreshTrackings();
            addToast({
                variant: "success",
                title: "Seguimiento Restaurado",
                message: "El seguimiento ha sido restaurado exitosamente."
            });
        } catch (e) {
            console.error("[useTracking] Error al restaurar seguimiento:", e);
            const err = e instanceof Error ? e : new Error('Error al restaurar seguimiento');
            addToast({ variant: "error", title: "Error", message: err.message });
            throw err;
        } finally {
            setLoadingAction(false);
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
