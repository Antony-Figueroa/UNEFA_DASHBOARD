/**
 * @file index.tsx
 * @description Define la estructura de datos para un Estudiante basada en el formulario oficial.
 * Centraliza las interfaces para asegurar consistencia en el módulo de Estudiantes.
 */

export interface Student {
  studentId: string; // identificador único

  // Datos de Identificación
  identificationPrefix: "V" | "E" | "J" | "P"; // V, E, J, P
  identificationNumber: string; // número de identificación

  // Nombres y Apellidos
  firstName: string; // Primer Nombre
  middleName?: string; // Segundo Nombre
  lastName: string; // Primer Apellido
  secondLastName?: string; // Segundo Apellido

  // Datos Personales
  sex: "FEMENINO" | "MASCULINO" | "OTRO"; // Sexo
  birthDate: string; // Fecha de Nacimiento (YYYY-MM-DD)
  civilStatus: "SOLTERO" | "CASADO" | "DIVORCIADO" | "VIUDO"; // Estado Civil
  phone: string; // Teléfono (ej: 0426-1234567)
  email: string; // Correo Electrónico
  address: string; // Dirección de Habitación

  // Datos Académicos
  careerId?: string; // ID de la carrera asociada
  careerName?: string; // nombre de la carrera (para visualización)
  semester: string; // Semestre (ej: 04)
  section: string; // Sección (ej: 236)
  regime: "DIURNO" | "NOCTURNO" | "MIXTO"; // Régimen

  // Datos de Clasificación
  studentType: "CIVIL" | "MILITAR"; // Tipo Estudiante
  militaryRank: string; // Rango Militar (o "NO APLICA")
  works: "SI" | "NO"; // Trabaja

  // Metadatos
  enrollmentDate: Date; // fecha de inscripción
  status: boolean; // true: activo, false: inactivo/papelera
  isInUse?: boolean; // indica si el estudiante tiene registros relacionados (ej: pre-inscripciones)
}

/**
 * Tipo para mostrar en tabla (fechas formateadas).
 */
export interface StudentRowData extends Omit<Student, "enrollmentDate"> {
  enrollmentDate: string; // fecha formateada para visualización
  fullNames: string; // nombre completo concatenado
}
