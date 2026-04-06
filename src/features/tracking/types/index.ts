/**
 * @file index.ts
 * @description Define la estructura de datos para el seguimiento de estudiantes.
 */

/**
 * Opciones para el filtro de traslado.
 */
export const TRANSFER_OPTIONS = [
    { value: "true", label: "Sí" },
    { value: "false", label: "No" },
];

/**
 * Representa el registro de seguimiento de un estudiante.
 */
export interface Tracking {
    /** Identificador único del seguimiento */
    trackingId: string;
    /** Número de cédula/identificación del estudiante */
    studentIdNumber: string;
    /** Nombre completo del estudiante */
    studentName: string;
    /** Título del reporte o actividad de seguimiento */
    reportTitle: string;
    /** Indica si hubo traslado/transferencia */
    transfer: boolean;
    /** Ruta o ubicación relacionada con el seguimiento */
    route: string;
    /** Observaciones adicionales */
    observations: string;
    /** Estado del registro (true: activo, false: inactivo/borrado lógico) */
    status: boolean;
    /** Fecha de creación del registro */
    creationDate: Date;
    /** Nombre de la carrera del estudiante */
    careerName?: string;
}

/**
 * Estructura de datos para mostrar en la tabla de seguimiento.
 * Las fechas se manejan como strings para facilitar la visualización.
 */
export interface TrackingRowData extends Omit<Tracking, "creationDate"> {
    /** Fecha de creación formateada como string */
    creationDate: string;
    /** Nombre de la carrera del estudiante */
    careerName?: string;
}

/**
 * Payload necesario para crear un nuevo registro de seguimiento.
 */
export interface CreateTrackingPayload {
    /** Número de cédula/identificación del estudiante */
    studentIdNumber: string;
    /** Nombre completo del estudiante */
    studentName: string;
    /** Título del reporte o actividad de seguimiento */
    reportTitle: string;
    /** Indica si hubo traslado/transferencia */
    transfer: boolean;
    /** Ruta o ubicación relacionada con el seguimiento */
    route: string;
    /** Observaciones adicionales */
    observations: string;
}

/**
 * Payload necesario para actualizar un registro de seguimiento existente.
 */
export interface UpdateTrackingPayload extends Partial<CreateTrackingPayload> {
    /** Identificador único del seguimiento a actualizar */
    trackingId: string;
    /** Estado del registro (opcional en actualización) */
    status?: boolean;
}
