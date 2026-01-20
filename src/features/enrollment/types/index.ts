/**
 * @file index.ts
 * @description Define la estructura de datos para una Inscripción.
 */

export interface Enrollment {
  enrollmentId: string;
  
  // Datos de Identificación (vinculados a Pre-Inscripción)
  identificationPrefix: "V" | "E";
  identificationNumber: string;
  
  // Datos del Estudiante
  studentName: string;
  careerName?: string;
  
  // Tutores
  academicTutorId: string;
  academicTutorName?: string;
  academicTutorPhone?: string;
  methodologicalTutorId: string;
  methodologicalTutorName?: string;
  methodologicalTutorPhone?: string;
  
  // Institución y Responsable
  institutionId: string;
  institutionName?: string;
  institutionAddress?: string;
  institutionPhone?: string;
  institutionResponsibleId: string;
  institutionResponsibleName?: string;
  institutionResponsiblePhone?: string;
  
  // Datos de Ubicación y Tipo de Institución (para reportes)
  region?: string;
  nucleus?: string;
  extension?: string;
  institutionType?: string;
  
  // Datos de la Inscripción
  practiceType: string;
  period: string;
  enrollmentCode?: string;
  observation?: string;
  
  // Metadatos
  enrollmentDate: Date;
  status: boolean; // true: activa, false: inactiva
}

/**
 * Tipo para mostrar en tabla (fechas formateadas).
 */
export interface EnrollmentRowData extends Omit<Enrollment, "enrollmentDate"> {
  enrollmentDate: string;
}
