/**
 * @file Define la estructura de datos para una Carrera.
 * @description Centraliza las interfaces para asegurar consistencia en el módulo de Carreras.
 */

export interface Career {
  careerId: string; // identificador único (string para compatibilidad con MockAPI/UUID)
  careerCode: string; // CAREER_CODE
  careerName: string; // CAREER_NAME
  minimumGrade: number; // MINIMUM_GRADE
  careerAbbreviation: string; // CAREER_ABBREVIATION
  internshipTypeIds: string[]; // IDs de tipos de prácticas asociados
  creationDate: Date; // CREATION_DATE
  status: boolean; // STATUS (true: activo, false: inactivo/eliminado)
}

// Tipo para mostrar en tabla (fechas formateadas)
export interface CareerRowData
  extends Omit<Career, "creationDate"> {
  creationDate: string; // fecha formateada
}

