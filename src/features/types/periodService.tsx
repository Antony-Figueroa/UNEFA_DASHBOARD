/**
 * @file Define la estructura de datos para un periodo académico.
 * @description Este archivo centraliza las interfaces para asegurar consistencia.
 */

export interface Periodo {
    id: number;
    lapso: string;
    fechaInicio: Date;
    fechaFin: Date;
    status: 'Pendiente' | 'En Curso' | 'Finalizado';
}

export type PeriodoRowData = Omit<Periodo, 'fechaInicio' | 'fechaFin'> & {
    fechaInicio: string;
    fechaFin: string;
};

