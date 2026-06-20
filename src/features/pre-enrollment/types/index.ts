/**
 * @file index.ts
 * @description Define las interfaces y tipos de datos para el módulo de Pre-Inscripción.
 * Sigue los principios de arquitectura basada en características y separación de preocupaciones.
 */

/**
 * Representa la entidad de Pre-Inscripción en el dominio de la aplicación.
 */
export interface PreEnrollment {
  /** Identificador único de la pre-inscripción */
  preEnrollmentId: string;
  
  /** Prefijo de identificación (V para Venezolano, E para Extranjero) */
  identificationPrefix: "V" | "E";
  /** Número de cédula de identidad */
  identificationNumber: string;
  
  /** Nombre completo del estudiante */
  studentName: string;
  /** Número de teléfono de contacto */
  phone: string;
  
  /** Periodo académico (ej: 2026 - II) */
  period: string;
  /** Tipo de práctica (ej: ORDINARIA) */
  practiceType: string;
  /** ID del tipo de pasantía (para resolución de fechas tipo-específicas) */
  internshipTypeId?: number;
  /** ID de la carrera */
  careerId: string;
  /** Nombre de la carrera */
  careerName: string;
  /** Semestre (ej: 04) */
  semester: string;
  /** Sección (ej: 536) */
  section: string;
  /** Régimen de estudio */
  regime: "DIURNO" | "NOCTURNO" | "MIXTO";
  /** Código de matrícula (ej: ING-AI-111-336-S3) */
  enrollmentCode: string;
  
  /** Fecha en que se realizó la pre-inscripción */
  preEnrollmentDate: Date;
  /** Estado de la pre-inscripción (true: activa, false: inactiva) */
  status: boolean;
  /** Indica si la pre-inscripción está siendo referenciada por otros registros */
  isInUse?: boolean;
}

/**
 * Tipo de datos optimizado para la visualización en tablas.
 * Convierte tipos complejos (como Date) a strings formateados.
 */
export interface PreEnrollmentRowData extends Omit<PreEnrollment, "preEnrollmentDate"> {
  /** Fecha de pre-inscripción formateada como string para visualización */
  preEnrollmentDate: string;
}

/**
 * Payload necesario para crear una nueva pre-inscripción.
 * Excluye campos generados automáticamente por el servidor o metadatos internos.
 */
export type CreatePreEnrollmentPayload = Omit<PreEnrollment, "preEnrollmentId" | "preEnrollmentDate" | "status" | "isInUse">;

/**
 * Payload necesario para actualizar una pre-inscripción existente.
 * Permite actualizaciones parciales excepto para el identificador único.
 */
export type UpdatePreEnrollmentPayload = Partial<CreatePreEnrollmentPayload> & {
  /** El ID es obligatorio para identificar el registro a actualizar */
  preEnrollmentId: string;
  /** Permite actualizar el estado de forma independiente */
  status?: boolean;
};
