/**
 * @file index.ts
 * @description Define la estructura de datos para el seguimiento de estudiantes.
 */

export interface Tracking {
    trackingId: string;
    studentIdNumber: string;
    studentName: string;
    reportTitle: string;
    transfer: boolean;
    route: string;
    observations: string;
    status: boolean; // true: activo, false: inactivo/borrado lógico
    creationDate: Date;
}

export interface TrackingRowData extends Omit<Tracking, "creationDate"> {
    creationDate: string;
}
