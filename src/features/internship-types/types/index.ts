export interface InternshipType {
  INTERNSHIP_TYPE_ID: number;
  NAME: string;
  ABBREVIATION: string;
  PRIORITY: number;
  STATUS: number; // 1=activo, 0=inactivo
  CREATION_DATE: string;
}

export interface InternshipTypeOption {
  id: number;
  value: string;
  label: string;
  text: string; // Para compatibilidad con MultiSelect
}
