/**
 * @file index.tsx
 * @description Define la estructura de datos para un Tutor basada en el formulario oficial.
 * Centraliza las interfaces para asegurar consistencia en el módulo de Tutores.
 */

export interface Tutor {
  tutorId: string; // identificador único

  // Datos de Identificación
  identificationPrefix: "V" | "E"; // V, E
  identificationNumber: string; // número de identificación

  // Nombres y Apellidos
  firstName: string; // Primer Nombre
  middleName?: string; // Segundo Nombre
  lastName: string; // Primer Apellido
  secondLastName?: string; // Segundo Apellido

  // Datos Personales
  sex: "FEMENINO" | "MASCULINO"; // Sexo
  phone: string; // Teléfono (ej: 04261234567)
  email: string; // Correo Electrónico

  // Datos Profesionales
  profession: string; // Profesión
  condition: string; // Condición
  dedication: string; // Dedicación
  category: string; // Categoría

  // Metadatos
  registrationDate: Date; // fecha de registro
  status: boolean; // true: activo, false: inactivo/papelera
  carreras: string[];
  isInUse?: boolean;
}

/**
 * Tipo para mostrar en tabla (fechas formateadas).
 */
export interface TutorRowData extends Omit<Tutor, "registrationDate"> {
  registrationDate: string; // fecha formateada para visualización
}
