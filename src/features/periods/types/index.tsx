/**
 * @file Define la estructura de datos para un periodo académico.
 * @description Este archivo centraliza las interfaces para asegurar consistencia.
 */

export interface Periodo {
    periodId: string;
    description: string;
    startDate: Date;
    endDate: Date;
    creationDate: Date;
    periodStatus: 1 | 2 | 3; // 1: Pendiente, 2: En Curso, 3: Culminado
    status: boolean;      // true: Activo, false: Eliminado
    code: string;
}

// Tipo para los datos que se muestran en la tabla, con fechas formateadas y progreso
export interface PeriodoRowData extends Omit<Periodo, 'startDate' | 'endDate' | 'creationDate'> {
    startDate: string; // Formatted
    endDate: string;   // Formatted
    rawStartDate: Date; // For sorting
    rawEndDate: Date;   // For sorting
    progress: number | null;
    daysPassed?: number;
    daysRemaining?: number;
    weeksRemaining?: number;
}