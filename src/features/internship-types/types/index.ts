/**
 * @file types/index.ts
 * @description Definiciones de tipos para el módulo de Tipos de Pasantía.
 * 
 * @module features/internship-types/types
 */

/**
 * Representa un Tipo de Pasantía en el dominio de la aplicación.
 * Sigue la convención camelCase para uso interno.
 */
export interface InternshipType {
  /** Identificador único del tipo de pasantía */
  id: number;
  /** Nombre completo (ej: Pasantía Larga) */
  name: string;
  /** Nivel de prioridad/orden en el sistema */
  priority: number;
  /** Estado de vigencia */
  status: boolean;
  /** Fecha en que fue registrado */
  creationDate: Date;
}

/**
 * Estructura de datos cruda proveniente de la API (DTO).
 */
export interface InternshipTypeApiDTO {
  INTERNSHIP_TYPE_ID?: number;
  id?: number;
  NAME?: string;
  name?: string;
  PRIORITY?: number;
  priority?: number;
  STATUS?: number | boolean;
  status?: number | boolean;
  CREATION_DATE?: string;
  createdAt?: string;
}

/**
 * Estructura para componentes de selección (Select/MultiSelect).
 */
export interface InternshipTypeOption {
  id: number;
  value: string;
  label: string;
  /** @deprecated Usar label en su lugar, mantenido por compatibilidad */
  text: string;
}

/** Payload para crear un nuevo tipo de pasantía */
export type CreateInternshipTypePayload = Omit<InternshipType, 'id' | 'creationDate'>;

/** Payload para actualizar un tipo de pasantía existente */
export type UpdateInternshipTypePayload = Partial<CreateInternshipTypePayload> & { id: number };
