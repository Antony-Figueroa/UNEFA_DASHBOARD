import { PeriodoRowData } from "../types";

export const STATUS_COLORS = {
    1: "warning", // Pendiente
    2: "success", // En Curso
    3: "error",   // Culminado
} as const;

export const STATUS_LABELS = {
    1: "Pendiente",
    2: "En Curso",
    3: "Culminado",
} as const;

export const getSafePeriodStatus = (periodo: PeriodoRowData): number => {
    if (!periodo) return 1;
    const status = periodo.periodStatus;
    if (typeof status === 'string') return parseInt(status) || 1;
    return Number(status) || 1;
};

export const getSafeProgress = (periodo: PeriodoRowData): number | null => {
    if (!periodo) return null;
    const progress = periodo.progress;
    if (progress === undefined || progress === null) return null;
    const numProgress = Number(progress);
    return isNaN(numProgress) ? null : Math.min(Math.max(numProgress, 0), 100);
};

export const getStatusLabel = (status: number) => {
    return STATUS_LABELS[status as keyof typeof STATUS_LABELS] || "Desconocido";
};

export const getStatusColor = (status: number) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || "warning";
};
