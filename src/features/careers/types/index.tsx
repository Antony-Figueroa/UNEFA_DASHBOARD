/**
 * @file Define la estructura de datos para una Carrera.
 * @description Centraliza las interfaces para asegurar consistencia en el módulo de Carreras.
 */

export interface Career {
  careerId: string | number; // Cambiado para soportar ID numérico
  careerCode: string; // Cambiado a string para soportar ceros a la izquierda
  careerName: string;
  minimumGrade: number;
  careerAbbreviation: string;
  careerType: 'CORTA' | 'LARGA';
  internshipTypeIds?: string[]; // Opcional ya que no está en la imagen de la tabla
  creationDate: Date;
  status: boolean | number; // Cambiado para soportar 0/1 (smallint)
  isInUse?: boolean;
  hasPendingEvaluations?: boolean;
}

// Tipo para mostrar en tabla (fechas formateadas)
export interface CareerRowData
  extends Omit<Career, "creationDate"> {
  creationDate: string; // fecha formateada
}

