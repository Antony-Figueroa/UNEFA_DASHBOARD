/**
 * @file Hook personalizado para la gestión del estado de los periodos.
 * @description Centraliza el estado, llamadas a API y lógica de negocio (CRUD, alertas).
 */

import { useState, useEffect, useCallback } from "react";
import { Periodo, CreatePeriodPayload, UpdatePeriodPayload } from "../types";
import * as periodService from "../services/periodService";
import { useToast } from "../../../context/toast";
import { ChangeComparison, RecordDetails } from "../../../components/ui/alert/AlertContextualContent";

/**
 * Estado de carga del hook.
 */
type Status = 'loading' | 'success' | 'error';

/**
 * Etiquetas para la visualización de detalles en alertas y comparaciones.
 */
const PERIOD_LABELS: Record<string, string> = {
    description: "Descripción del Período",
    startDate: "Fecha de Inicio",
    endDate: "Fecha de Cierre",
    status: "Estado",
};

/**
 * Hook personalizado para la gestión de periodos académicos.
 * 
 * Centraliza el estado de los periodos, las operaciones CRUD contra el servicio,
 * y la lógica de notificaciones (toast) y auditoría visual.
 * 
 * @returns Un objeto con el estado de los periodos y funciones para manipularlos.
 * 
 * @example
 * const { periodos, addPeriod, editPeriod, removePeriod } = usePeriods();
 */
export const usePeriods = () => {
    const [periodos, setPeriodos] = useState<Periodo[]>([]);
    const [status, setStatus] = useState<Status>('loading');
    const [loadingAction, setLoadingAction] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const { addToast } = useToast();

    // Efecto para manejar el timeout de seguridad (30 segundos) en acciones críticas
    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>;
        if (loadingAction) {
            timeoutId = setTimeout(() => {
                setLoadingAction(false);
                console.warn("[usePeriods] Timeout de 30s alcanzado. Rehabilitando botones.");
            }, 30000);
        }
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [loadingAction]);

    /**
     * Refresca la lista de periodos desde el servidor.
     * Incluye una lógica de debounce visual de 1s para evitar parpadeos en conexiones rápidas.
     */
    const refreshPeriods = useCallback(async () => {
        setStatus('loading');
        const startTime = Date.now();
        try {
            const data = await periodService.getPeriods();
            // Asegurar unicidad por ID
            const uniqueData = Array.from(new Map(data.map(item => [item.periodId, item])).values());

            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, 1000 - elapsedTime);

            setTimeout(() => {
                setPeriodos(uniqueData);
                setStatus('success');
            }, remainingTime);
        } catch (e) {
            console.error("[usePeriods] Error al refrescar periodos:", e);
            const err = e instanceof Error ? e : new Error('Error desconocido al cargar períodos');
            setError(err);
            setStatus('error');
        }
    }, []);

    useEffect(() => {
        refreshPeriods();
    }, [refreshPeriods]);

    /**
     * Crea un nuevo periodo académico y muestra una notificación de éxito.
     * 
     * @param periodoData - Datos del nuevo periodo (CreatePeriodPayload).
     * @throws Re-lanza el error después de mostrar el toast de error.
     */
    const addPeriod = async (periodoData: CreatePeriodPayload) => {
        setLoadingAction(true);
        try {
            const newPeriod = await periodService.createPeriod(periodoData);
            await refreshPeriods();
            setLoadingAction(false);

            addToast({
                variant: "success",
                title: "Período Creado",
                message: (
                    <>
                        <p>El período <strong>{periodoData.description}</strong> ha sido creado exitosamente.</p>
                        <RecordDetails data={periodoData as unknown as Record<string, unknown>} labels={PERIOD_LABELS} />
                    </>
                ),
                onViewDetails: () => console.log("Ver detalles de período:", newPeriod.periodId),
            });
        } catch (e) {
            console.error("[usePeriods] Error al añadir periodo:", e);
            setLoadingAction(false);
            const err = e instanceof Error ? e : new Error('Error desconocido al crear');
            addToast({ variant: "error", title: "Error al Crear", message: err.message });
            throw err;
        }
    };

    /**
     * Actualiza un periodo académico existente y muestra una notificación con comparación de cambios.
     * Permite deshacer la acción desde la notificación.
     * 
     * @param periodoData - Datos actualizados del periodo (UpdatePeriodPayload).
     * @throws Re-lanza el error después de mostrar el toast de error.
     */
    const editPeriod = async (periodoData: UpdatePeriodPayload) => {
        setLoadingAction(true);
        try {
            const oldPeriod = periodos.find(p => p.periodId === periodoData.periodId);

            // LOGGING: Registro de auditoría para cambios de estatus (excluidos de la UI)
            if (oldPeriod && oldPeriod.periodStatus !== periodoData.periodStatus) {
                console.log(`[Audit Log] Cambio de estatus detectado para periodo ${periodoData.description || oldPeriod.description}: ${oldPeriod.periodStatus} -> ${periodoData.periodStatus}`);
            }

            await periodService.updatePeriod(periodoData);
            await refreshPeriods();
            setLoadingAction(false);

            addToast({
                variant: "success",
                title: "Período Actualizado",
                message: (
                    <>
                        <p>Se han actualizado los datos del período <strong>{periodoData.description || oldPeriod?.description}</strong>.</p>
                        {oldPeriod && <ChangeComparison oldData={oldPeriod as unknown as Record<string, unknown>} newData={periodoData as unknown as Record<string, unknown>} labels={PERIOD_LABELS} />}
                    </>
                ),
                onUndo: oldPeriod ? async () => {
                    await periodService.updatePeriod(oldPeriod);
                    await refreshPeriods();
                } : undefined
            });
        } catch (e) {
            console.error("[usePeriods] Error al editar periodo:", e);
            setLoadingAction(false);
            const err = e instanceof Error ? e : new Error('Error desconocido al actualizar');
            addToast({ variant: "error", title: "Error al Actualizar", message: err.message });
            throw err;
        }
    };

    /**
     * Elimina permanentemente un periodo académico.
     * 
     * @param periodo - El objeto completo del periodo a eliminar.
     * @throws Re-lanza el error después de mostrar el toast de error.
     */
    const removePeriod = async (periodo: Periodo) => {
        setLoadingAction(true);
        try {
            await periodService.deletePeriod(periodo.periodId);
            await refreshPeriods();
            setLoadingAction(false);
            addToast({
                variant: "warning",
                title: "Período Eliminado",
                message: (
                    <>
                        <p>El período <strong>{periodo.description}</strong> ha sido eliminado permanentemente.</p>
                        <p className="mt-1 text-xs text-text-secondary italic">* Esta acción no se puede deshacer desde la interfaz, pero el registro permanece en auditoría.</p>
                    </>
                )
            });
        } catch (e) {
            console.error("[usePeriods] Error al eliminar periodo:", e);
            setLoadingAction(false);
            const err = e instanceof Error ? e : new Error('Error desconocido al eliminar');
            addToast({ variant: "error", title: "Error al Eliminar", message: err.message });
            throw err;
        }
    };

    return { periodos, status, loadingAction, error, refreshPeriods, addPeriod, editPeriod, removePeriod };
};

