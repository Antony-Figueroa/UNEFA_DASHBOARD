/**
 * @file Hook personalizado para la gestión del estado de los periodos.
 * @description Centraliza el estado, llamadas a API y lógica de negocio (CRUD, alertas).
 */

import { useState, useEffect, useCallback } from "react";
import { Periodo } from "../types";
import * as periodService from "../services/periodService";
import { useToast } from "../../../context/ToastContext";
import { ChangeComparison, RecordDetails } from "../../../components/ui/alert/AlertContextualContent";

type Status = 'loading' | 'success' | 'error';

const PERIOD_LABELS: Record<string, string> = {
    description: "Descripción del Periodo",
    startDate: "Fecha de Inicio",
    endDate: "Fecha de Cierre",
    status: "Estado",
};

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

    const refreshPeriods = useCallback(async () => {
        setStatus('loading');
        const startTime = Date.now();
        try {
            const data = await periodService.getPeriods();
            const uniqueData = Array.from(new Map(data.map(item => [item.periodId, item])).values());

            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, 1000 - elapsedTime);

            setTimeout(() => {
                setPeriodos(uniqueData);
                setStatus('success');
            }, remainingTime);
        } catch (e) {
            const err = e instanceof Error ? e : new Error('Error desconocido al cargar periodos');
            setError(err);
            setStatus('error');
        }
    }, []);

    useEffect(() => {
        refreshPeriods();
    }, [refreshPeriods]);

    const addPeriod = async (periodoData: Omit<Periodo, "periodId" | "creationDate">) => {
        setLoadingAction(true);
        try {
            const newPeriod = await periodService.createPeriod(periodoData);
            await refreshPeriods();
            setLoadingAction(false);

            addToast({
                variant: "success",
                title: "Periodo Creado",
                message: (
                    <>
                        <p>El periodo <strong>{periodoData.description}</strong> ha sido creado exitosamente.</p>
                        <RecordDetails data={periodoData} labels={PERIOD_LABELS} />
                    </>
                ),
                onViewDetails: () => console.log("Ver detalles de periodo:", newPeriod.periodId),
            });
        } catch (e) {
            const err = e instanceof Error ? e : new Error('Error desconocido al crear');
            addToast({ variant: "error", title: "Error al Crear", message: err.message });
            throw err;
        }
    };

    const editPeriod = async (periodoData: Periodo) => {
        setLoadingAction(true);
        try {
            const oldPeriod = periodos.find(p => p.periodId === periodoData.periodId);
            await periodService.updatePeriod(periodoData);
            await refreshPeriods();
            setLoadingAction(false);

            addToast({
                variant: "success",
                title: "Periodo Actualizado",
                message: (
                    <>
                        <p>Se han actualizado los datos del periodo <strong>{periodoData.description}</strong>.</p>
                        {oldPeriod && <ChangeComparison oldData={oldPeriod as unknown as Record<string, unknown>} newData={periodoData as unknown as Record<string, unknown>} labels={PERIOD_LABELS} />}
                    </>
                ),
                onUndo: oldPeriod ? async () => {
                    await periodService.updatePeriod(oldPeriod);
                    await refreshPeriods();
                } : undefined
            });
        } catch (e) {
            const err = e instanceof Error ? e : new Error('Error desconocido al actualizar');
            addToast({ variant: "error", title: "Error al Actualizar", message: err.message });
            throw err;
        }
    };

    const removePeriod = async (periodo: Periodo) => {
        setLoadingAction(true);
        try {
            await periodService.deletePeriod(periodo);
            await refreshPeriods();
            setLoadingAction(false);
            addToast({
                variant: "warning",
                title: "Periodo Eliminado",
                message: (
                    <>
                        <p>El periodo <strong>{periodo.description}</strong> ha sido eliminado permanentemente.</p>
                        <p className="mt-1 text-xs text-gray-500 italic">* Esta acción no se puede deshacer desde la interfaz, pero el registro permanece en auditoría.</p>
                    </>
                )
            });
        } catch (e) {
            setLoadingAction(false);
            const err = e instanceof Error ? e : new Error('Error desconocido al eliminar');
            addToast({ variant: "error", title: "Error al Eliminar", message: err.message });
            throw err;
        }
    };

    return { periodos, status, loadingAction, error, refreshPeriods, addPeriod, editPeriod, removePeriod };
};