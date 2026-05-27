/**
 * @file index.tsx
 * @description Define la superentidad Persona base del sistema.
 * Todos los roles (estudiantes, tutores, usuarios, responsables institucionales)
 * comparten esta estructura base para datos personales.
 */

/**
 * Representa una Persona en el sistema (superentidad t_persons).
 * Contiene los datos personales compartidos por todos los roles.
 */
export interface Persona {
  /** Identificador único de la persona (person_id) */
  personId: number;

  /** Cédula completa con prefijo (ej: "V-12345678") */
  ci: string;

  /** Prefijo de identificación (V, E, etc.) */
  prefixCi: string;

  /** Número de cédula (sin prefijo) */
  identificationNumber: string;

  /** Primer nombre */
  firstName: string;

  /** Segundo nombre (opcional) */
  middleName?: string;

  /** Primer apellido */
  lastName: string;

  /** Segundo apellido (opcional) */
  secondLastName?: string;

  /** Correo electrónico */
  email: string;

  /** Teléfono de contacto */
  phone?: string;

  /** Género (código DB: M, F, O) */
  gender?: string;

  /** Fecha de nacimiento (YYYY-MM-DD) */
  birthDate?: string;

  /** Dirección */
  address?: string;

  /** Estado civil (código DB: S, C, D, V) */
  maritalStatus?: string;

  /** Estado: 1 activo, 0 inactivo */
  status: number;

  /** Fecha de creación */
  createdAt: string;

  /** Fecha de última actualización */
  updatedAt: string;
}

/**
 * Payload para crear una persona.
 */
export interface CreatePersonaPayload {
  ci: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  secondLastName?: string | null;
  email: string;
  phone?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  address?: string | null;
  maritalStatus?: string | null;
  status?: number;
}

/**
 * Payload para actualizar una persona.
 */
export interface UpdatePersonaPayload {
  firstName?: string;
  middleName?: string | null;
  lastName?: string;
  secondLastName?: string | null;
  email?: string;
  phone?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  address?: string | null;
  maritalStatus?: string | null;
  status?: number;
}

/**
 * Resultado de validación de disponibilidad (CI o Email).
 */
export interface CheckAvailabilityResult {
  available: boolean;
  exists?: boolean;
  status?: number;
  personId?: number;
}

/**
 * Opciones para el selector de prefijo de cédula.
 */
export interface PrefixOption {
  value: string;
  label: string;
}

/**
 * Opciones de prefijo estándar del sistema.
 */
export const PREFIX_OPTIONS: PrefixOption[] = [
  { value: "V", label: "V" },
  { value: "E", label: "E" },
  { value: "J", label: "J" },
  { value: "G", label: "G" },
];

/**
 * Mapa de género: código DB → etiqueta frontend
 */
export const GENDER_MAP: Record<string, string> = {
  M: "MASCULINO",
  F: "FEMENINO",
  O: "OTRO",
};

/**
 * Mapa inverso: etiqueta frontend → código DB
 */
export const GENDER_MAP_INVERSE: Record<string, string> = {
  MASCULINO: "M",
  FEMENINO: "F",
  OTRO: "O",
};

/**
 * Mapa de estado civil: código DB → etiqueta frontend
 */
export const MARITAL_MAP: Record<string, string> = {
  S: "SOLTERO",
  C: "CASADO",
  D: "DIVORCIADO",
  V: "VIUDO",
};

/**
 * Mapa inverso: etiqueta frontend → código DB
 */
export const MARITAL_MAP_INVERSE: Record<string, string> = {
  SOLTERO: "S",
  CASADO: "C",
  DIVORCIADO: "D",
  VIUDO: "V",
};
