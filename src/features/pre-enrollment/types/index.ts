/**
 * @file index.tsx
 * @description Define la estructura de datos para una Pre-Inscripción.
 */

export interface PreEnrollment {
  preEnrollmentId: string;
  
  // Datos de Identificación
  identificationPrefix: "V" | "E" | "J" | "P";
  identificationNumber: string;
  
  // Datos del Estudiante
  studentName: string;
  careerName: string;
  phone: string;
  
  // Datos de la Pre-Inscripción
  period: string; // ej: 2026 - II
  practiceType: string; // ej: ORDINARIA
  enrollmentCode: string; // Matrícula, ej: ING-AI-111-336-S3
  
  // Metadatos
  preEnrollmentDate: Date;
  status: boolean; // true: activa, false: inactiva
  isInUse?: boolean;
}

/**
 * Tipo para mostrar en tabla (fechas formateadas).
 */
export interface PreEnrollmentRowData extends Omit<PreEnrollment, "preEnrollmentDate"> {
  preEnrollmentDate: string;
}
