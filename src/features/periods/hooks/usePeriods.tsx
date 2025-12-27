/**
 * @file Hook personalizado para la gestión del estado de los periodos.
 * @description Centraliza el estado, llamadas a API y lógica de negocio (CRUD, alertas).
 */

import { useState, useEffect, useCallback } from "react";
import { Periodo } from "../types";
import * as periodService from "../services/periodService";

type Status = 'loading' | 'success' | 'error';

interface PageAlert {
    variant: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
}

export const usePeriods = () => {
    const [periodos, setPeriodos] = useState<Periodo[]>([]);
    const [status, setStatus] = useState<Status>('loading');
    const [error, setError] = useState<Error | null>(null);
    const [pageAlert, setPageAlert] = useState<PageAlert | null>(null);

    const showAlert = (variant: PageAlert['variant'], title: string, message: string) => {
        setPageAlert({ variant, title, message });
        setTimeout(() => setPageAlert(null), 5000);
    };

    const refreshPeriods = useCallback(async () => {
        setStatus('loading');
        try {
            const data = await periodService.getPeriods();
            const uniqueData = Array.from(new Map(data.map(item => [item.id, item])).values());
            setPeriodos(uniqueData);
            setStatus('success');
        } catch (e) {
            const err = e instanceof Error ? e : new Error('Error desconocido al cargar periodos');
            setError(err);
            setStatus('error');
        }
    }, []);

    useEffect(() => {
        refreshPeriods();
    }, [refreshPeriods]);

    const addPeriod = async (periodoData: Omit<Periodo, 'id'>) => {
        try {
            await periodService.createPeriod(periodoData);
            await refreshPeriods();
            showAlert('success', 'Éxito', 'Periodo creado correctamente.');
        } catch (e) {
            const err = e instanceof Error ? e : new Error('Error desconocido al crear');
            showAlert('error', 'Error al Crear', err.message);
            throw err;
        }
    };

    const editPeriod = async (periodoData: Periodo) => {
        try {
            await periodService.updatePeriod(periodoData.id, periodoData);
            await refreshPeriods();
            showAlert('success', 'Éxito', 'Periodo actualizado correctamente.');
        } catch (e) {
            const err = e instanceof Error ? e : new Error('Error desconocido al actualizar');
            showAlert('error', 'Error al Actualizar', err.message);
            throw err;
        }
    };

    const removePeriod = async (id: number) => {
        try {
            await periodService.deletePeriod(id);
            await refreshPeriods();
            showAlert('success', 'Éxito', 'Periodo eliminado correctamente.');
        } catch (e) {
            const err = e instanceof Error ? e : new Error('Error desconocido al eliminar');
            showAlert('error', 'Error al Eliminar', err.message);
            throw err;
        }
    };

    return { periodos, status, error, pageAlert, setPageAlert, refreshPeriods, addPeriod, editPeriod, removePeriod };
};