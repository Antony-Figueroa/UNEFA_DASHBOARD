/**
 * @file useTracking.ts
 * @description Hook para la gestión de seguimientos de estudiantes.
 */

import { useState, useEffect, useCallback } from "react";
import { Tracking } from "../types";
import * as trackingService from "../services/trackingService";
import { useToast } from "../../../context/toast";

type Status = 'loading' | 'success' | 'error';

export const useTracking = () => {
    const [trackings, setTrackings] = useState<Tracking[]>([]);
    const [status, setStatus] = useState<Status>('loading');
    const [loadingAction, setLoadingAction] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const { addToast } = useToast();

    const refreshTrackings = useCallback(async () => {
        setStatus('loading');
        try {
            const data = await trackingService.getTrackings();
            setTrackings(data);
            setStatus('success');
        } catch (e) {
            setError(e instanceof Error ? e : new Error('Error al cargar seguimientos'));
            setStatus('error');
        }
    }, []);

    useEffect(() => {
        refreshTrackings();
    }, [refreshTrackings]);

    const addTracking = async (trackingData: Omit<Tracking, "trackingId" | "creationDate">) => {
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
            const err = e instanceof Error ? e : new Error('Error al registrar seguimiento');
            addToast({ variant: "error", title: "Error", message: err.message });
            throw err;
        } finally {
            setLoadingAction(false);
        }
    };

    const editTracking = async (trackingData: Tracking) => {
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
            const err = e instanceof Error ? e : new Error('Error al actualizar seguimiento');
            addToast({ variant: "error", title: "Error", message: err.message });
            throw err;
        } finally {
            setLoadingAction(false);
        }
    };

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
            const err = e instanceof Error ? e : new Error('Error al eliminar seguimiento');
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
        refreshTrackings
    };
};
