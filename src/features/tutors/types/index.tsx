/**
 * @file index.tsx
 * @description Define la estructura de datos para un Tutor basada en el formulario oficial.
 * Centraliza las interfaces para asegurar consistencia en el módulo de Tutores.
 */

/**
 * Representa un tutor en el sistema.
 */
export interface Tutor {
  /** Identificador único del tutor */
  tutorId: string;

  /** Prefijo de identificación (V, E) */
  identificationPrefix: "V" | "E";
  /** Número de identificación (cédula) */
  identificationNumber: string;

  /** Primer nombre */
  firstName: string;
  /** Segundo nombre (opcional) */
  middleName?: string;
  /** Primer apellido */
  lastName: string;
  /** Segundo apellido (opcional) */
  secondLastName?: string;

  /** Sexo del tutor */
  sex: "FEMENINO" | "MASCULINO";
  /** Fecha de nacimiento (YYYY-MM-DD) */
  birthDate?: string;
  /** Dirección de residencia */
  address?: string;
  /** Estado civil */
  civilStatus?: string;
  /** Teléfono de contacto */
  phone: string;
  /** Correo electrónico */
  email: string;

  /** Profesión del tutor */
  profession: string;
  /** Título académico */
  titulo: string;
  /** Condición laboral */
  condition: string;
  /** Dedicación horaria */
  dedication: string;
  /** Categoría docente */
  category: string;

  /** Fecha de registro en el sistema */
  registrationDate: Date;
  /** Estado de activación (activo/inactivo) */
  status: boolean;
  /** IDs de las carreras asociadas */
  carreras: string[];
  /** Tipos de prácticas asignadas (opcional) */
  practiceTypes?: string[];
  /** Indica si el tutor está en uso en alguna práctica (opcional) */
  isInUse?: boolean;
  /** Referencia a la persona unificada en t_persons */
  personId?: string;
}

/**
 * Payload para crear un nuevo tutor.
 */
export type CreateTutorPayload = Omit<Tutor, 'tutorId' | 'registrationDate' | 'status' | 'isInUse'>;

/**
 * Payload para actualizar un tutor existente.
 */
export interface UpdateTutorPayload extends Partial<CreateTutorPayload> {
  /** Identificador único del tutor a actualizar */
  tutorId: string;
  /** Estado del tutor (opcional en actualización) */
  status?: boolean;
}

/**
 * Tipo para mostrar en tabla (fechas formateadas).
 */
export interface TutorRowData extends Omit<Tutor, "registrationDate"> {
  /** Fecha formateada para visualización */
  registrationDate: string;
}
