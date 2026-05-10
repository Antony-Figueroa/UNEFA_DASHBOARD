/**
 * @file index.tsx
 * @description Define la estructura de datos para un Estudiante.
 * Centraliza las interfaces y tipos para asegurar consistencia en el módulo de Estudiantes.
 */

/**
 * Representa la entidad de un Estudiante en el sistema.
 */
export interface Student {
  /** Identificador único del estudiante */
  studentId: string;

  // Datos de Identificación
  /** Prefijo de identificación (V para Venezolano, E para Extranjero) */
  identificationPrefix: "V" | "E";
  /** Número de cédula o identificación */
  identificationNumber: string;

  // Nombres y Apellidos
  /** Primer nombre del estudiante */
  firstName: string;
  /** Segundo nombre del estudiante (opcional) */
  middleName?: string;
  /** Primer apellido del estudiante */
  lastName: string;
  /** Segundo apellido del estudiante (opcional) */
  secondLastName?: string;

  // Datos Personales
  /** Sexo del estudiante */
  sex: "FEMENINO" | "MASCULINO" | "OTRO";
  /** Fecha de nacimiento en formato ISO (YYYY-MM-DD) */
  birthDate: string;
  /** Estado civil del estudiante */
  civilStatus: "SOLTERO" | "CASADO" | "DIVORCIADO" | "VIUDO";
  /** Número de teléfono de contacto */
  phone: string;
  /** Correo electrónico institucional o personal */
  email: string;
  /** Dirección de habitación completa */
  address: string;

  // Datos de Clasificación
  /** Clasificación del estudiante */
  studentType: "CIVIL" | "MILITAR";
  /** Rango militar (o "NO APLICA" si es civil) */
  militaryRank: string;
  /** Indica si el estudiante trabaja actualmente */
  works: "SI" | "NO";

  // Metadatos
  /** Fecha en que se registró el estudiante en el sistema */
  enrollmentDate: Date;
  /** Estado del registro (true: activo, false: inactivo/eliminado lógicamente) */
  status: boolean;
  /** Indica si el estudiante tiene registros relacionados en otros módulos */
  isInUse?: boolean;
}

/**
 * Payload para la creación de un nuevo estudiante.
 * Excluye los campos generados por el servidor o metadatos iniciales.
 */
export type CreateStudentPayload = Omit<Student, "studentId" | "enrollmentDate" | "status" | "isInUse">;

/**
 * Payload para la actualización de un estudiante existente.
 * Incluye el ID y permite actualizar campos específicos.
 */
export type UpdateStudentPayload = Partial<CreateStudentPayload> & {
  /** Identificador único del estudiante a actualizar */
  studentId: string;
};

/**
 * Interfaz para los datos del estudiante optimizados para visualización en tablas.
 */
export interface StudentRowData extends Omit<Student, "enrollmentDate"> {
  /** Fecha de inscripción formateada para visualización */
  enrollmentDate: string;
  /** Nombre completo concatenado (Nombres + Apellidos) */
  fullNames: string;
}
