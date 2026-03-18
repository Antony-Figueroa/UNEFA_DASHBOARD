/**
 * @file index.tsx
 * @description Definiciones de tipos y esquemas para el módulo de Carreras.
 * Centraliza las interfaces para asegurar consistencia en todo el dominio de Carreras.
 * 
 * @module features/careers/types
 */

/**
 * Representa la entidad Carrera en el sistema.
 */
export interface Career {
  /** Identificador único de la carrera (UUID o numérico) */
  careerId: string | number;
  /** Código académico de la carrera (ej: 'ING-SIST') */
  careerCode: string;
  /** Nombre completo de la carrera */
  careerName: string;
  /** Nota mínima aprobatoria para la carrera */
  minimumGrade: number;
  /** Siglas o abreviación de la carrera (ej: 'ISO') */
  careerAbbreviation: string;
  /** Tipo de carrera según duración (Técnica o Ingeniería/Licenciatura) */
  careerType: 'CORTA' | 'LARGA';
  /** Lista de identificadores de tipos de pasantía permitidos */
  internshipTypeIds?: string[];
  /** Lista de prioridades de tipos de pasantía (0 = Única, 1 = Hospitalaria, 2 = Comunitaria) */
  internshipPriorities?: number[];
  /** Fecha en la que se registró la carrera en el sistema */
  creationDate: Date;
  /** Estado de la carrera (true/1: Activo, false/0: Inactivo) */
  status: boolean | number;
  /** Indica si la carrera tiene registros asociados que impiden su eliminación */
  isInUse?: boolean;
  /** Indica si existen evaluaciones pendientes asociadas a esta carrera */
  hasPendingEvaluations?: boolean;
}

/**
 * Interfaz extendida para la visualización de carreras en tablas.
 * Transforma campos complejos (como fechas) en strings formateados.
 */
export interface CareerRowData extends Omit<Career, "creationDate"> {
  /** Fecha de creación formateada como string (ej: 'DD/MM/YYYY') */
  creationDate: string;
}

/**
 * Payload necesario para crear una nueva carrera.
 */
export type CreateCareerPayload = Omit<Career, 'careerId' | 'creationDate' | 'isInUse' | 'hasPendingEvaluations'>;

/**
 * Payload necesario para actualizar una carrera existente.
 */
export type UpdateCareerPayload = Partial<CreateCareerPayload> & { careerId: string | number };

